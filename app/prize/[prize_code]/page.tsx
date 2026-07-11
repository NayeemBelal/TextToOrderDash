"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MARKETING_API_BASE_URL } from "@/lib/api";

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

// Format milliseconds remaining as a friendly countdown. The coupon is valid
// for up to 24h (the clock starts when the SMS is sent), so show hours while the
// window is long and fall back to MM:SS in the final hour.
function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
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
          setPageState("pending");
        }
      })
      .catch(() => setPageState("not_found"));
  }, [prize_code]);

  // Countdown ticker
  useEffect(() => {
    if (pageState !== "active" || !expiresAt) return;
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">

        {/* Header */}
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
              ⏱ This offer is valid for <strong>24 hours</strong> from when you received it.
              <br />Tap <strong>Redeem</strong> when you&apos;re ready at the register!
            </div>
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
              The 24-hour redemption window has passed.<br />
              Keep an eye out for the next one!
            </p>
          </div>
        )}

        <div className="px-6 py-4 text-center text-xs text-gray-300">Powered by Belan</div>
      </div>
    </div>
  );
}
