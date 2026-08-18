"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { MARKETING_API_BASE_URL } from "@/lib/api";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type PageState =
  | "loading"
  | "form"
  | "submitting"
  | "verifying"
  | "success"
  | "verify_failed"
  | "already_member"
  | "invalid";

const VERIFY_MESSAGES = ["Checking…", "Eating…", "Saving…"];
const VERIFY_POLL_INTERVAL_MS = 1500;
const VERIFY_TIMEOUT_MS = 20000;

async function pollDeliveryStatus(claimId: string): Promise<"delivered" | "failed" | "timeout"> {
  const start = Date.now();
  while (Date.now() - start < VERIFY_TIMEOUT_MS) {
    try {
      const res = await fetch(`${MARKETING_API_BASE_URL}/api/referral/claim/${claimId}/status`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === "delivered") return "delivered";
        if (json.status === "failed") return "failed";
      }
    } catch {
      // Network hiccup mid-poll — keep trying until the timeout.
    }
    await new Promise((r) => setTimeout(r, VERIFY_POLL_INTERVAL_MS));
  }
  return "timeout";
}

interface ReferralData {
  state: "active" | "invalid";
  referral_code?: string;
  restaurant_name?: string;
  referrer_first_name?: string | null;
  referred_discount_percent?: number;
  logo_url?: string | null;
  brand_color?: string | null;
  background_image_url?: string | null;
}

const DEFAULT_BRAND = "#1e293b"; // slate-800

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
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

export default function ReferralPage() {
  const { referral_code } = useParams<{ referral_code: string }>();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [data, setData] = useState<ReferralData | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [verifyMsgIndex, setVerifyMsgIndex] = useState(0);

  useEffect(() => {
    if (pageState !== "verifying") return;
    setVerifyMsgIndex(0);
    const id = setInterval(() => {
      setVerifyMsgIndex((i) => (i + 1) % VERIFY_MESSAGES.length);
    }, 1100);
    return () => clearInterval(id);
  }, [pageState]);

  useEffect(() => {
    fetch(`${MARKETING_API_BASE_URL}/api/referral/${referral_code}`)
      .then((r) => {
        if (r.status === 404) { setPageState("invalid"); return null; }
        return r.json();
      })
      .then((d: ReferralData | null) => {
        if (!d) return;
        setData(d);
        setPageState(d.state === "active" ? "form" : "invalid");
      })
      .catch(() => setPageState("invalid"));
  }, [referral_code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!fullName.trim()) { setError("Enter your name."); return; }
    if (!phone.trim()) { setError("Enter your phone number."); return; }

    setPageState("submitting");
    try {
      const res = await fetch(`${MARKETING_API_BASE_URL}/api/referral/${referral_code}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phone.trim(),
          email: email.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Something went wrong. Please try again.");
      if (json.already_member) {
        setPageState("already_member");
        return;
      }
      setPageState("verifying");
      const outcome = await pollDeliveryStatus(json.claim_id);
      setPageState(outcome === "failed" ? "verify_failed" : "success");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPageState("form");
    }
  }

  const brand = (data?.brand_color && /^#?[0-9a-fA-F]{6}$/.test(data.brand_color))
    ? (data.brand_color.startsWith("#") ? data.brand_color : `#${data.brand_color}`)
    : DEFAULT_BRAND;
  const headerBg = `linear-gradient(135deg, ${brand}, ${darken(brand)})`;
  const onBrand = textOn(brand);
  const logo = data?.logo_url || null;
  const restaurantName = data?.restaurant_name || "this restaurant";
  const pct = data?.referred_discount_percent ?? 10;

  const headline = pageState === "loading"
    ? ""
    : data?.referrer_first_name
      ? `${data.referrer_first_name} gave you ${pct}% off your first order`
      : `You've got ${pct}% off your first order`;

  const hasHeroImage = Boolean(data?.background_image_url);

  return (
    <div className={`min-h-screen bg-slate-100 flex items-start justify-center p-5 ${poppins.className}`}>
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
                backgroundPosition: "center bottom",
              }}
            />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="relative h-full flex flex-col items-center justify-end pb-4 px-6 text-center text-white">
              <div className="mb-2 w-14 h-14 rounded-full bg-white shadow-md ring-2 ring-white/60 flex items-center justify-center overflow-hidden">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={restaurantName} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <span className="text-2xl">🎁</span>
                )}
              </div>
              <h1 className="text-lg font-bold leading-tight drop-shadow-sm">{restaurantName}</h1>
              <p className="text-sm mt-0.5 text-white/90">
                {pageState === "invalid" ? "Invite not found" : headline}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center" style={{ backgroundImage: headerBg, color: onBrand }}>
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={restaurantName} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-3xl">🎁</span>
              )}
            </div>
            <h1 className="text-lg font-bold leading-tight">{restaurantName}</h1>
            <p className="text-sm mt-0.5" style={{ opacity: 0.85 }}>
              {pageState === "invalid" ? "Invite not found" : headline}
            </p>
          </div>
        )}

        {/* Loading */}
        {pageState === "loading" && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading your invite…</div>
        )}

        {/* Invalid */}
        {pageState === "invalid" && (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <p className="font-semibold text-gray-700 mb-2">Invite Not Found</p>
            <p className="text-sm text-gray-400">This link doesn&apos;t exist or is no longer active.</p>
          </div>
        )}

        {/* Form */}
        {(pageState === "form" || pageState === "submitting") && (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: brand } as React.CSSProperties}
                disabled={pageState === "submitting"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: brand } as React.CSSProperties}
                disabled={pageState === "submitting"}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Email <span className="normal-case text-gray-300">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: brand } as React.CSSProperties}
                disabled={pageState === "submitting"}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={pageState === "submitting"}
              className="w-full font-bold text-base rounded-xl py-4 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: brand, color: onBrand }}
            >
              {pageState === "submitting" ? "Joining…" : `Join & claim my ${pct}% off`}
            </button>

            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              By joining, you agree to receive recurring marketing texts from {restaurantName}.
              Msg &amp; data rates may apply. Msg frequency varies. Reply STOP to opt out, HELP for help.
            </p>
          </form>
        )}

        {/* Verifying — confirming the welcome text actually reached the number */}
        {pageState === "verifying" && (
          <div className="px-6 py-12 text-center space-y-3">
            <div
              className="mx-auto mb-1 w-10 h-10 rounded-full border-4 border-gray-200 animate-spin"
              style={{ borderTopColor: brand }}
            />
            <p className="font-semibold text-gray-700">{VERIFY_MESSAGES[verifyMsgIndex]}</p>
            <p className="text-sm text-gray-400">Sending your welcome text…</p>
          </div>
        )}

        {/* Verification failed — the welcome text never delivered */}
        {pageState === "verify_failed" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">📵</div>
            <p className="font-semibold text-gray-700">We failed to verify this number</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              We couldn&apos;t deliver a text to that number. Double-check it and try again.
            </p>
            <button
              onClick={() => setPageState("form")}
              className="mt-2 text-sm font-semibold underline"
              style={{ color: brand }}
            >
              Try a different number
            </button>
          </div>
        )}

        {/* Success */}
        {pageState === "success" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">🎉</div>
            <p className="font-semibold text-gray-700">You&apos;re in!</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Check your texts — your {pct}% off welcome coupon is on its way.
            </p>
          </div>
        )}

        {/* Already a member */}
        {pageState === "already_member" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">👋</div>
            <p className="font-semibold text-gray-700">Looks like you&apos;re already on our list!</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Check your texts for your existing offers from {restaurantName}.
            </p>
          </div>
        )}

        <div className="px-6 py-4 text-center text-xs text-gray-300">Powered by Belan</div>
      </div>
    </div>
  );
}
