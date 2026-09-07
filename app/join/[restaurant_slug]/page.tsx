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

interface JoinData {
  state: "active" | "invalid";
  restaurant_name?: string;
  discount_percent?: number;
  logo_url?: string | null;
  brand_color?: string | null;
  background_image_url?: string | null;
  consent_disclosure_text?: string;
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

  useEffect(() => {
    fetch(`${MARKETING_API_BASE_URL}/api/join/${restaurant_slug}`)
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
          }),
        },
      );
      const json = await res.json();
      if (!res.ok)
        throw new Error(
          json.detail || "Something went wrong. Please try again.",
        );
      setPageState(json.already_member ? "already_member" : "success");
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

  const headline =
    pageState === "loading" ? "" : `Get ${pct}% off your next order`;
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  First name
                </label>
                <input
                  type="text"
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
              {pageState === "submitting" ? "Joining…" : `Get my ${pct}% off`}
            </button>
          </form>
        )}

        {/* Success */}
        {pageState === "success" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">🎉</div>
            <p className="font-semibold text-gray-700">You&apos;re in!</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Check your texts — your {pct}% off code from {restaurantName} is
              on its way.
            </p>
          </div>
        )}

        {/* Already a member */}
        {pageState === "already_member" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">👋</div>
            <p className="font-semibold text-gray-700">
              Looks like you&apos;re already on our list!
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              You&apos;ve already got an active offer from {restaurantName} —
              check your texts for your code.
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
