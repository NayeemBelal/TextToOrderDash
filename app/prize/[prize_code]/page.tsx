"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { MARKETING_API_BASE_URL } from "@/lib/api";

type PrizeState = "loading" | "pending" | "active" | "expired" | "not_found";

interface PrizeData {
  prize_code: string;
  state: "pending" | "active" | "expired";
  is_winner: boolean;
  prize_config: { type?: string; itemName?: string; percent?: number };
  loser_discount: number;
  redemption_expires_at: string | null;
  restaurant_name: string;
  discount_name: string;
}

export default function PrizePage() {
  const { prize_code } = useParams<{ prize_code: string }>();
  const [pageState, setPageState] = useState<PrizeState>("loading");
  const [data, setData] = useState<PrizeData | null>(null);
  const [discountName, setDiscountName] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("30:00");
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
        if (d.state === "active" && d.redemption_expires_at) {
          setDiscountName(d.discount_name);
          setExpiresAt(new Date(d.redemption_expires_at));
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
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      setIsUrgent(remaining < 300000);
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
      setDiscountName(json.discount_name);
      setExpiresAt(new Date(json.expires_at));
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

  const gradientClass = data?.is_winner
    ? "from-pink-400 to-rose-500"
    : "from-indigo-400 to-purple-600";

  const pillClass = data?.is_winner
    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
    : "bg-green-50 text-green-800 border border-green-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600 flex items-start justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className={`bg-gradient-to-br ${pageState === "expired" ? "from-slate-400 to-slate-600" : gradientClass} text-white px-6 py-8 text-center`}>
          <div className="text-5xl mb-3">
            {pageState === "expired" ? "⏰" : data?.is_winner ? "🏆" : "🎁"}
          </div>
          <h1 className="text-xl font-bold mb-1">
            {pageState === "expired"
              ? "Prize Expired"
              : data?.is_winner
              ? "You Won!"
              : "Your Discount"}
          </h1>
          <p className="text-sm opacity-90">{data?.restaurant_name ?? ""}</p>
        </div>

        {/* Prize summary — shown when not expired */}
        {pageState !== "expired" && pageState !== "loading" && pageState !== "not_found" && data && (
          <div className="px-6 py-5 border-b border-gray-100 text-center">
            <span className={`inline-block rounded-full px-5 py-2 text-sm font-semibold ${pillClass}`}>
              {prizeLabel()}
            </span>
            <p className="text-xs text-gray-400 mt-2">{prizeSubtitle()}</p>
          </div>
        )}

        {/* Loading */}
        {pageState === "loading" && (
          <div className="px-6 py-12 text-center text-gray-400 text-sm">Loading your prize…</div>
        )}

        {/* Not found */}
        {pageState === "not_found" && (
          <div className="px-6 py-10 text-center">
            <div className="text-4xl mb-4">🤔</div>
            <p className="font-semibold text-gray-700 mb-2">Prize Not Found</p>
            <p className="text-sm text-gray-400">This prize link doesn&apos;t exist or has been removed.</p>
          </div>
        )}

        {/* Pending — show redeem button */}
        {pageState === "pending" && (
          <div className="px-6 py-6 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center leading-relaxed">
              ⏱ Once you tap <strong>Redeem</strong>, you&apos;ll have <strong>30 minutes</strong> to use your prize in store.
              <br />Only tap when you&apos;re ready at the register!
            </div>
            <button
              onClick={handleRedeem}
              disabled={redeeming}
              className={`w-full text-white font-bold text-base rounded-xl py-4 transition-opacity bg-gradient-to-r ${gradientClass} disabled:opacity-50`}
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
            <div className="border-2 border-dashed border-indigo-300 rounded-xl p-4 bg-indigo-50 text-indigo-800 font-bold text-lg break-all">
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

        {/* Expired */}
        {pageState === "expired" && (
          <div className="px-6 py-10 text-center space-y-3">
            <p className="font-semibold text-gray-700">This prize has expired</p>
            <p className="text-sm text-gray-400 leading-relaxed">
              The 30-minute redemption window has passed.<br />
              Play the next game for another chance to win!
            </p>
          </div>
        )}

        <div className="px-6 py-4 text-center text-xs text-gray-300">Powered by Belan</div>
      </div>
    </div>
  );
}
