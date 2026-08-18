"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { MARKETING_API_BASE_URL } from "@/lib/api";
import ReferralModal from "./ReferralModal";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

type PrizeState = "loading" | "pending" | "active" | "expired" | "used" | "not_found";

interface PrizeData {
  prize_code: string;
  state: "pending" | "active" | "expired" | "used";
  is_winner: boolean;
  prize_config: { type?: string; itemName?: string; percent?: number };
  loser_discount: number;
  redemption_expires_at: string | null;
  restaurant_name: string;
  discount_name: string;
  logo_url: string | null;
  brand_color: string | null;
  background_image_url: string | null;
  referral: {
    referral_url: string;
    bonus_claimed: boolean;
    bonus_percent: number;
    referred_discount_percent: number;
    share_image_url: string | null;
    share_taglines: string[];
  } | null;
}

// Neutral, professional fallback when a restaurant hasn't set a brand color.
const DEFAULT_BRAND = "#1e293b"; // slate-800

// Darken a #rrggbb hex by `amount` (0..1) for a subtle header gradient.
function darken(hex: string, amount = 0.18): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return hex;
  const n = parseInt(h, 16);
  const r = Math.max(0, Math.round(((n >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

// Format milliseconds remaining as a friendly countdown — the actual window
// (days/hours/minutes, restaurant-configured) comes from redemption_expires_at,
// not a fixed 24h. Rolls over to days once it clears 24h (so a week-long
// window reads "6d 23h" instead of "167h"), then hours, then MM:SS in the
// final hour.
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

// "Use this by 10:42 AM" (today) or "10:42 AM on Mon, Jul 27" if past midnight.
function formatUseBy(exp: Date): string {
  const time = exp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sameDay = exp.toDateString() === new Date().toDateString();
  if (sameDay) return `Use this by ${time}`;
  const date = exp.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  return `Use this by ${time} on ${date}`;
}

// Pick readable text color (black/white) for a given background hex.
function textOn(hex: string): string {
  const h = hex.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#ffffff";
  const n = parseInt(h, 16);
  const r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  // Relative luminance
  const L = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

export default function PrizePage() {
  const { prize_code } = useParams<{ prize_code: string }>();
  const [pageState, setPageState] = useState<PrizeState>("loading");
  const [data, setData] = useState<PrizeData | null>(null);
  const [discountName, setDiscountName] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch(`${MARKETING_API_BASE_URL}/api/prize/${prize_code}`)
      .then((r) => {
        if (r.status === 404) { setPageState("not_found"); return null; }
        return r.json();
      })
      .then((d: PrizeData | null) => {
        if (!d) return;
        setData(d);
        if (d.state === "used") {
          setPageState("used");
        } else if (d.state === "active" && d.redemption_expires_at) {
          const exp = new Date(d.redemption_expires_at);
          setDiscountName(d.discount_name);
          setExpiresAt(exp);
          setCountdown(formatRemaining(exp.getTime() - Date.now()));
          setPageState("active");
        } else if (d.state === "expired") {
          setPageState("expired");
        } else {
          if (d.redemption_expires_at) {
            const exp = new Date(d.redemption_expires_at);
            setExpiresAt(exp);
            setCountdown(formatRemaining(exp.getTime() - Date.now()));
          }
          setPageState("pending");
        }
      })
      .catch(() => setPageState("not_found"));
  }, [prize_code]);

  // Countdown ticker — runs for both "pending" (offer not yet redeemed in
  // store) and "active" (post-redeem, waiting on the cashier) states, since
  // redemption_expires_at is the same deadline for both.
  useEffect(() => {
    if ((pageState !== "active" && pageState !== "pending") || !expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setCountdown(formatRemaining(remaining));
      setIsUrgent(remaining < 900000); // last 15 minutes
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setPageState("expired");
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [pageState, expiresAt]);

  async function handleRedeem() {
    setRedeeming(true);
    setError("");
    try {
      const res = await fetch(`${MARKETING_API_BASE_URL}/api/prize/${prize_code}/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || "Failed to redeem. Please try again.");
      if (json.already_redeemed) { window.location.reload(); return; }
      const exp = new Date(json.expires_at);
      setDiscountName(json.discount_name);
      setExpiresAt(exp);
      setCountdown(formatRemaining(exp.getTime() - Date.now()));
      setPageState("active");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setRedeeming(false);
    }
  }

  const prizeLabel = () => {
    if (!data) return "";
    if (data.is_winner) {
      if (data.prize_config?.type === "free-item")
        return `Free ${data.prize_config.itemName || "Item"}`;
      return `${data.prize_config?.percent || 10}% Off Your Order`;
    }
    return `${data.loser_discount}% Off Your Next Order`;
  };

  const prizeSubtitle = () => {
    if (!data) return "";
    if (data.is_winner) {
      if (data.prize_config?.type === "free-item")
        return `100% off your ${data.prize_config.itemName || "prize item"}`;
      return "Applied to your entire order";
    }
    return "Thanks for playing!";
  };

  const [showReferralModal, setShowReferralModal] = useState(false);

  // ── Branding ──────────────────────────────────────────────────────────────
  const brand = (data?.brand_color && /^#?[0-9a-fA-F]{6}$/.test(data.brand_color))
    ? (data.brand_color.startsWith("#") ? data.brand_color : `#${data.brand_color}`)
    : DEFAULT_BRAND;
  const headerBg =
    pageState === "expired"
      ? "linear-gradient(135deg, #64748b, #475569)"
      : pageState === "used"
      ? "linear-gradient(135deg, #16a34a, #15803d)"
      : `linear-gradient(135deg, ${brand}, ${darken(brand)})`;
  const onBrand = textOn(brand);
  const logo = data?.logo_url || null;
  const hasHeroImage = Boolean(data?.background_image_url);

  return (
    <div className={`min-h-screen bg-slate-100 flex items-start justify-center p-5 ${poppins.className}`}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">

        {/* Header — a full, unobstructed shot of the food when the restaurant
            has one (the whole point: make them hungry before they even read
            the offer), falling back to the plain brand-color header otherwise. */}
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
            {/* Scrim only over the bottom third, where the name/status sit —
                the rest of the photo stays untouched and vivid. */}
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="relative h-full flex flex-col items-center justify-end pb-4 px-6 text-center text-white">
              <div className="mb-2 w-14 h-14 rounded-full bg-white shadow-md ring-2 ring-white/60 flex items-center justify-center overflow-hidden">
                {logo && pageState !== "used" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={data?.restaurant_name ?? "Logo"} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <span className="text-2xl">
                    {pageState === "used" ? "✅" : pageState === "expired" ? "⏰" : data?.is_winner ? "🏆" : "🎁"}
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold leading-tight drop-shadow-sm">{data?.restaurant_name ?? ""}</h1>
              <p className="text-sm mt-0.5 text-white/90">
                {pageState === "used"
                  ? "Coupon used"
                  : pageState === "expired"
                  ? "Offer expired"
                  : data?.is_winner
                  ? "You won a reward!"
                  : "A reward for you"}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8 text-center" style={{ backgroundImage: headerBg, color: onBrand }}>
            {/* Logo badge (falls back to an emoji when no logo is set) */}
            <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden">
              {logo && pageState !== "used" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={data?.restaurant_name ?? "Logo"} className="w-full h-full object-contain p-1.5" />
              ) : (
                <span className="text-3xl">
                  {pageState === "used" ? "✅" : pageState === "expired" ? "⏰" : data?.is_winner ? "🏆" : "🎁"}
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold leading-tight">{data?.restaurant_name ?? ""}</h1>
            <p className="text-sm mt-0.5" style={{ opacity: 0.85 }}>
              {pageState === "used"
                ? "Coupon used"
                : pageState === "expired"
                ? "Offer expired"
                : data?.is_winner
                ? "You won a reward!"
                : "A reward for you"}
            </p>
          </div>
        )}

        {/* Prize summary — shown while the coupon is still claimable/active */}
        {pageState !== "expired" && pageState !== "used" && pageState !== "loading" && pageState !== "not_found" && data && (
          <div className="px-6 py-5 border-b border-gray-100 text-center">
            <span
              className="inline-block rounded-full px-5 py-2 text-sm font-semibold"
              style={{ backgroundColor: `${brand}14`, color: darken(brand, 0.1) }}
            >
              {prizeLabel()}
            </span>
            <p className="text-xs text-gray-400 mt-2">{prizeSubtitle()}</p>
          </div>
        )}

        {/* Loading */}
        {pageState === "loading" && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading your reward…</div>
        )}

        {/* Not found */}
        {pageState === "not_found" && (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <p className="font-semibold text-gray-700 mb-2">Reward Not Found</p>
            <p className="text-sm text-gray-400">This link doesn&apos;t exist or has been removed.</p>
          </div>
        )}

        {/* Pending — show redeem button */}
        {pageState === "pending" && (
          <div className="px-6 py-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center leading-relaxed">
              {expiresAt ? (
                <>⏱ <strong>{formatUseBy(expiresAt)}</strong></>
              ) : (
                <>⏱ This offer won&apos;t last forever.</>
              )}
              <br />Tap <strong>Redeem</strong> when you&apos;re ready at the register!
            </div>
            {expiresAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Time Remaining</p>
                <p className={`text-4xl font-extrabold tabular-nums ${isUrgent ? "text-red-600" : "text-amber-700"}`}>
                  {countdown}
                </p>
              </div>
            )}
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className="w-full font-bold text-base rounded-xl py-4 transition-opacity disabled:opacity-50"
              style={{ backgroundColor: brand, color: onBrand }}
            >
              {redeeming ? "Creating discount…" : "Redeem in Store Now"}
            </button>
            {error && (
              <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}
          </div>
        )}

        {/* Active — show discount name + countdown */}
        {pageState === "active" && (
          <div className="px-6 py-6 space-y-4 text-center">
            <p className="text-sm text-gray-500">Show this screen to the cashier and ask them to apply:</p>
            <div
              className="border-2 border-dashed rounded-xl p-4 font-bold text-lg break-all"
              style={{ borderColor: `${brand}55`, backgroundColor: `${brand}0f`, color: darken(brand, 0.15) }}
            >
              {discountName}
            </div>
            <p className="text-xs text-gray-400">
              <strong className="text-gray-600">Cashier:</strong> search for this name in the Clover discount list and apply it.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Time Remaining</p>
              <p className={`text-4xl font-extrabold tabular-nums ${isUrgent ? "text-red-600" : "text-amber-700"}`}>
                {countdown}
              </p>
            </div>
          </div>
        )}

        {/* Used — coupon was applied to an order and retired */}
        {pageState === "used" && (
          <div className="px-6 py-10 text-center space-y-3">
            <div className="text-4xl mb-1">🎉</div>
            <p className="font-semibold text-gray-700">This coupon has been used</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Thanks for stopping by! This reward has been redeemed and can&apos;t be used again.<br />
              <strong className="text-gray-600">Look out for your next coupon in your messages!</strong>
            </p>
          </div>
        )}

        {/* Expired */}
        {pageState === "expired" && (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="font-semibold text-gray-700">This offer has expired</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              The redemption window has passed.<br />
              Keep an eye out for the next one!
            </p>
          </div>
        )}

        {/* Referral CTA — only on states where bumping this coupon still means
            something (an expired coupon can't be un-expired by a bump). Opens
            the full explainer card rather than sharing directly. */}
        {data?.referral && (pageState === "pending" || pageState === "active" || pageState === "used") && (
          <div className="px-6 py-5 border-t border-gray-100">
            <button
              onClick={() => setShowReferralModal(true)}
              className="w-full flex items-center justify-center gap-2.5 rounded-full border-2 py-3 px-4 font-semibold text-sm transition-colors"
              style={{ borderColor: brand, color: darken(brand, 0.1) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/refer.webp" alt="" className="w-5 h-5" />
              Want +{data.referral.bonus_percent}% on the coupon?
            </button>
          </div>
        )}

        <div className="px-6 py-4 text-center text-xs text-gray-300">Powered by Belan</div>
      </div>

      {data?.referral && (
        <ReferralModal
          open={showReferralModal}
          onClose={() => setShowReferralModal(false)}
          restaurantName={data.restaurant_name}
          shareImageUrl={data.referral.share_image_url}
          bonusPercent={data.referral.bonus_percent}
          referredPercent={data.referral.referred_discount_percent}
          referralUrl={data.referral.referral_url}
          shareTaglines={data.referral.share_taglines}
          bonusClaimed={data.referral.bonus_claimed}
        />
      )}
    </div>
  );
}
