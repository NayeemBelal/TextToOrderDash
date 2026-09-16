"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { MARKETING_API_BASE_URL } from "@/lib/api";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

type PageState =
  | "loading"
  | "form"
  | "submitting"
  | "success"
  | "already_member"
  | "invalid";

// Named promo offer selected by ?promo=slug on the QR link (e.g. a BOGO).
interface JoinPromo {
  slug: string;
  label: string;
  headline: string;
  fine_print?: string | null;
  kind: "percent" | "amount";
  discount_percent?: number | null;
  discount_amount_cents?: number | null;
  expiry_days?: number;
}

interface JoinData {
  state: "active" | "invalid";
  restaurant_name?: string;
  // false = opt-in-only restaurant (no coupon): drop the "Get N% off" framing.
  incentive_enabled?: boolean;
  discount_percent?: number;
  promo?: JoinPromo | null;
  // "ended" = the QR's promo is over; "outside_hours" = live promo but not
  // right now (daily window). Both fall back to the default offer.
  promo_state?: "active" | "ended" | "outside_hours" | null;
  // Human explanation for outside_hours ("The Copycat BOGO runs 11 AM–4 PM…").
  promo_note?: string | null;
  logo_url?: string | null;
  brand_color?: string | null;
  background_image_url?: string | null;
  consent_disclosure_text?: string;
}

// POST /api/join response — since the backend activates the coupon at signup,
// the success screen shows it immediately instead of "check your texts".
interface JoinResult {
  already_member: boolean;
  incentive_enabled?: boolean;
  promo?: JoinPromo | null;
  // "already_used": this customer already redeemed this promo (one per
  // customer) — no new coupon.
  promo_state?: "active" | "ended" | "outside_hours" | "already_used" | null;
  prize_code?: string;
  prize_url?: string;
  discount_percent?: number;
  discount_amount_cents?: number | null;
  discount_name?: string;
  expires_at?: string;
  // "pos_coupon": cashier searches the discount name in the POS list (Clover).
  // "show_staff": staff applies the restaurant's standing tier discount (Toast).
  redemption_mode?: "pos_coupon" | "show_staff";
  // False = the POS mint failed; fall back to the old "check your texts" copy
  // (the SMS link still works and retries the mint on its redeem button).
  pos_ready?: boolean;
}

// Same countdown formatting as the /prize page: days, then hours, then MM:SS.
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DEFAULT_BRAND = "#1e293b"; // slate-800
const FALLBACK_DISCLOSURE =
  "By checking this box, I agree to receive recurring automated marketing text messages at the phone number provided. Consent is not a condition of purchase. Msg & data rates may apply. Message frequency varies. Reply STOP to opt out, HELP for help. View our Privacy Policy.";
const PRIVACY_POLICY_URL = "https://belan.tech/privacy-policy";

// The disclosure text (from the backend, or the fallback above) ends with a
// "...View our Privacy Policy." sentence — strip it out here since the actual
// link is rendered as its own separate element below the checkbox instead.
function stripPrivacyPolicyMention(text: string): string {
  return text.replace(/\s*View our Privacy Policy\.?\s*$/i, "");
}

function darken(hex: string, amount = 0.18): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function textOn(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
  const n = parseInt(h, 16);
  const r = (n >> 16) & 0xff,
    g = (n >> 8) & 0xff,
    b = n & 0xff;
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

export default function JoinPage() {
  const { restaurant_slug } = useParams<{ restaurant_slug: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [data, setData] = useState<JoinData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<JoinResult | null>(null);
  const [countdown, setCountdown] = useState("");
  // ?promo=slug&src=sub-tag from the QR link — read client-side in the effect
  // below (this component is SSR'd; window isn't available at render time).
  const [promoParam, setPromoParam] = useState<string | null>(null);
  const [srcParam, setSrcParam] = useState<string | null>(null);
  // Outside-hours popup: "sorry, the deal runs 11–4 — but you still get 10%".
  const [hoursModalOpen, setHoursModalOpen] = useState(false);

  // Live ticking countdown on the success coupon — the movement doubles as a
  // liveness cue so staff can tell the real page from a screenshot.
  useEffect(() => {
    if (pageState !== "success" || !result?.pos_ready || !result?.expires_at)
      return;
    const exp = new Date(result.expires_at).getTime();
    const tick = () => setCountdown(formatRemaining(exp - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pageState, result]);

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const promo = qs.get("promo");
    const src = qs.get("src");
    setPromoParam(promo);
    setSrcParam(src);

    const url = new URL(`${MARKETING_API_BASE_URL}/api/join/${restaurant_slug}`);
    if (promo) url.searchParams.set("promo", promo);
    fetch(url.toString())
      .then((r) => {
        if (r.status === 404) {
          setPageState("invalid");
          return null;
        }
        return r.json();
      })
      .then((d: JoinData | null) => {
        if (!d) return;
        setData(d);
        if (d.promo_state === "outside_hours") setHoursModalOpen(true);
        setPageState(d.state === "active" ? "form" : "invalid");
      })
      .catch(() => setPageState("invalid"));
  }, [restaurant_slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim()) {
      setError("Enter your first name.");
      return;
    }
    if (!lastName.trim()) {
      setError("Enter your last name.");
      return;
    }
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    if (!consentChecked) {
      setError("Please check the box to agree to receive texts.");
      return;
    }

    setPageState("submitting");
    try {
      const res = await fetch(
        `${MARKETING_API_BASE_URL}/api/join/${restaurant_slug}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone_number: phone.trim(),
            consent_checked: consentChecked,
            promo: promoParam,
            src: srcParam,
          }),
        },
      );
      const json: JoinResult & { detail?: string } = await res.json();
      if (!res.ok)
        throw new Error(
          json.detail || "Something went wrong. Please try again.",
        );
      setResult(json);
      setPageState(
        json.already_member || json.promo_state === "already_used"
          ? "already_member"
          : "success",
      );
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Something went wrong. Please try again.",
      );
      setPageState("form");
    }
  }

  const brand =
    data?.brand_color && /^#?[0-9a-fA-F]{6}$/.test(data.brand_color)
      ? data.brand_color.startsWith("#")
        ? data.brand_color
        : `#${data.brand_color}`
      : DEFAULT_BRAND;
  const headerBg = `linear-gradient(135deg, ${brand}, ${darken(brand)})`;
  const onBrand = textOn(brand);
  const logo = data?.logo_url || null;
  const restaurantName = data?.restaurant_name || "this restaurant";
  const pct = data?.discount_percent ?? 10;
  const incentive = data?.incentive_enabled !== false;
  const promo = data?.promo ?? null;

  const headline =
    pageState === "loading"
      ? ""
      : promo
        ? promo.headline
        : incentive
          ? `Get ${pct}% off your next order`
          : "Be the first to hear about specials & offers";
  const hasHeroImage = Boolean(data?.background_image_url);

  if (pageState === "loading") {
    return (
      <div
        className={`min-h-screen bg-slate-100 flex items-center justify-center p-5 ${poppins.className}`}
      >
        <div
          className="w-10 h-10 rounded-full border-[3px] border-slate-300 animate-spin"
          style={{ borderTopColor: DEFAULT_BRAND }}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-slate-100 flex items-start justify-center p-5 ${poppins.className}`}
    >
      {/* Outside-hours popup: the promo QR was scanned outside its daily
          window — be upfront about the miss AND the consolation, so nobody
          feels bait-and-switched. */}
      {hoursModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 text-center space-y-3">
            <button
              onClick={() => setHoursModalOpen(false)}
              aria-label="Close"
              className="absolute top-3 right-3 w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-slate-100 flex items-center justify-center text-xl leading-none"
            >
              ×
            </button>
            <div className="text-4xl">⏰</div>
            <p className="text-lg font-bold text-gray-800 leading-snug">
              Sorry — you caught us outside deal hours!
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {data?.promo_note ||
                "This deal has limited daily hours — come back during the window to grab it."}
            </p>
            <p className="text-base font-semibold text-gray-800">
              But don&apos;t leave empty-handed — you still get{" "}
              <span style={{ color: darken(brand, 0.15) }}>{pct}% off</span> just
              for signing up today. 🎉
            </p>
            <button
              onClick={() => setHoursModalOpen(false)}
              className="w-full font-bold text-base rounded-xl py-3.5"
              style={{ backgroundColor: brand, color: onBrand }}
            >
              Get my {pct}% off
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
        {/* Header — a full, unobstructed shot of the food when the restaurant
            has one, falling back to the plain brand-color header otherwise. */}
        {hasHeroImage ? (
          <div className="relative h-64">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${data!.background_image_url})`,
                backgroundSize: "cover",
                // Lime N Dime's hero photo crops the burger at "center bottom"
                // (same fix as the /prize pages) — nudge it down further here.
                backgroundPosition:
                  restaurantName === "Lime N Dime"
                    ? "center bottom -100px"
                    : "center bottom",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="relative h-full flex flex-col items-center justify-end pb-4 px-6 text-center text-white">
              <div className="mb-2 w-14 h-14 rounded-full bg-white shadow-md ring-2 ring-white/60 flex items-center justify-center overflow-hidden">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={restaurantName}
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <span className="text-2xl">🎁</span>
                )}
              </div>
              <h1 className="text-lg font-bold leading-tight drop-shadow-sm">
                {restaurantName}
              </h1>
              <p className="text-sm mt-0.5 text-white/90">
                {pageState === "invalid" ? "Sign-up link not found" : headline}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="px-6 py-8 text-center"
            style={{ backgroundImage: headerBg, color: onBrand }}
          >
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={restaurantName}
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <span className="text-3xl">🎁</span>
              )}
            </div>
            <h1 className="text-lg font-bold leading-tight">
              {restaurantName}
            </h1>
            <p className="text-sm mt-0.5" style={{ opacity: 0.85 }}>
              {pageState === "invalid" ? "Sign-up link not found" : headline}
            </p>
          </div>
        )}

        {/* Invalid */}
        {pageState === "invalid" && (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <p className="font-semibold text-gray-700 mb-2">
              Sign-Up Link Not Found
            </p>
            <p className="text-sm text-gray-400">
              This link doesn&apos;t exist or is no longer active.
            </p>
          </div>
        )}

        {/* Form */}
        {(pageState === "form" || pageState === "submitting") && (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            {promo?.fine_print && (
              <p className="text-[11px] text-gray-400 text-center -mt-1">{promo.fine_print}</p>
            )}
            {/* Ended / outside-hours promos fall back to the default offer
                silently — the headline above already shows the regular deal. */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  First name
                </label>
                <input
                  type="text"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- the form
                  // is this page's sole purpose; landing straight in the first
                  // field saves a tap for someone standing in line.
                  autoFocus
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Jane"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                  style={
                    {
                      ["--tw-ring-color" as string]: brand,
                    } as React.CSSProperties
                  }
                  disabled={pageState === "submitting"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                  style={
                    {
                      ["--tw-ring-color" as string]: brand,
                    } as React.CSSProperties
                  }
                  disabled={pageState === "submitting"}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Phone number
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={
                  {
                    ["--tw-ring-color" as string]: brand,
                  } as React.CSSProperties
                }
                disabled={pageState === "submitting"}
              />
            </div>

            <label className="flex items-start gap-2 text-[11px] text-gray-500 leading-relaxed">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 shrink-0"
                disabled={pageState === "submitting"}
              />
              <span>
                {stripPrivacyPolicyMention(data?.consent_disclosure_text || FALLBACK_DISCLOSURE)}
              </span>
            </label>
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[11px] text-gray-400 underline -mt-2"
            >
              View our Privacy Policy
            </a>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pageState === "submitting" || !consentChecked}
              className="w-full font-bold text-base rounded-xl py-4 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: brand, color: onBrand }}
            >
              {pageState === "submitting"
                ? "Joining…"
                : promo
                  ? "Claim this deal"
                  : incentive
                    ? `Get my ${pct}% off`
                    : "Sign me up"}
            </button>
          </form>
        )}

        {/* Success — the coupon IS this screen (backend already activated it
            in the POS). Falls back to the old "check your texts" copy only if
            the POS activation failed (pos_ready=false). */}
        {pageState === "success" &&
          (result?.pos_ready ? (
            <div className="px-6 py-8 text-center space-y-4">
              <p className="font-semibold text-gray-700">
                🎉 You&apos;re in!
              </p>
              {result.promo ? (
                <>
                  <p
                    className="text-3xl font-extrabold uppercase leading-tight tracking-tight"
                    style={{ color: darken(brand, 0.15) }}
                  >
                    {result.promo.headline}
                  </p>
                  {result.promo.fine_print && (
                    <p className="text-xs text-gray-400 -mt-1">{result.promo.fine_print}</p>
                  )}
                </>
              ) : (
                <p
                  className="text-4xl font-extrabold uppercase leading-tight tracking-tight"
                  style={{ color: darken(brand, 0.15) }}
                >
                  {result.discount_percent ?? pct}% off
                  <br />
                  your next visit
                </p>
              )}
              <p className="text-xl font-extrabold uppercase tracking-tight text-gray-700">
                Show to your cashier
              </p>
              <div
                className="border-2 border-dashed rounded-xl p-4 font-bold text-lg break-all"
                style={{
                  borderColor: `${brand}55`,
                  backgroundColor: `${brand}0f`,
                  color: darken(brand, 0.15),
                }}
              >
                {result.discount_name || `${pct}% OFF`}
              </div>
              <p className="text-xs text-gray-400">
                <strong className="text-gray-600">Cashier:</strong>{" "}
                {result.redemption_mode === "show_staff"
                  ? `apply the "${result.discount_percent ?? pct}%" Belan SMS discount to this order.`
                  : "search for this name in the discount list and apply it."}
              </p>
              {countdown && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Time Remaining
                  </p>
                  <p className="text-4xl font-extrabold tabular-nums text-amber-700">
                    {countdown}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-400 leading-relaxed">
                We also texted you a link to this coupon
                {result.prize_url ? (
                  <>
                    {" "}
                    — or{" "}
                    <a
                      href={result.prize_url}
                      className="underline text-gray-500"
                    >
                      open it here
                    </a>
                  </>
                ) : null}
                .
              </p>
            </div>
          ) : (
            <div className="px-6 py-10 text-center space-y-3">
              <div className="text-4xl mb-1">🎉</div>
              <p className="font-semibold text-gray-700">You&apos;re in!</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                {result?.incentive_enabled === false || !incentive
                  ? `Welcome to the ${restaurantName} VIP list — you'll be the first to hear about specials and offers.`
                  : `Check your texts — your ${pct}% off code from ${restaurantName} is on its way.`}
              </p>
            </div>
          ))}

        {/* Already a member */}
        {pageState === "already_member" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">👋</div>
            <p className="font-semibold text-gray-700">
              Looks like you&apos;re already on our list!
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              {result?.promo_state === "already_used"
                ? `You've already used the ${result?.promo?.label || "promo"} deal — it's one per customer. Keep an eye on your texts for more offers from ${restaurantName}!`
                : incentive
                  ? `You've already got an active offer from ${restaurantName} — check your texts for your code.`
                  : `You're already on the ${restaurantName} VIP list — keep an eye on your texts for specials.`}
            </p>
          </div>
        )}

        <div className="px-6 py-4 text-center text-xs text-gray-300">
          Powered by Belan
        </div>
      </div>
    </div>
  );
}
