"use client";

/* Self-contained MOCK coupon page for the /marketing landing-page demo.
   Mirrors the real /prize/[prize_code] page visuals but makes ZERO backend calls — the win/lose,
   prize label, and restaurant come from the URL, and redeem→countdown is driven entirely
   client-side with mock data. No real Clover discount is ever created. */

import { Suspense, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type PrizeState = "pending" | "active" | "expired";

export default function DemoPrizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600" />}>
      <DemoPrizeContent />
    </Suspense>
  );
}

function DemoPrizeContent() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();

  const isWinner = search.get("win") === "1";
  const prizeLabel = search.get("label") || (isWinner ? "Your Prize" : "A Discount on Us");
  const restaurantName = search.get("r") || "Stack & Smash Burgers";

  const [pageState, setPageState] = useState<PrizeState>("pending");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("30:00");
  const [isUrgent, setIsUrgent] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const discountName = `${prizeLabel} - ${code}`;

  useEffect(() => {
    if (pageState !== "active" || !expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
      setIsUrgent(remaining < 300000);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPageState("expired");
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [pageState, expiresAt]);

  function handleRedeem() {
    setRedeeming(true);
    // Mock: pretend to create the discount, then start the 30-min window.
    setTimeout(() => {
      setExpiresAt(new Date(Date.now() + 30 * 60 * 1000));
      setPageState("active");
      setRedeeming(false);
    }, 700);
  }

  const gradientClass = isWinner ? "from-pink-400 to-rose-500" : "from-indigo-400 to-purple-600";
  const pillClass = isWinner
    ? "bg-yellow-50 text-yellow-800 border border-yellow-200"
    : "bg-green-50 text-green-800 border border-green-200";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600 flex items-start justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Demo banner */}
        <div className="bg-black text-white text-center text-[11px] font-bold uppercase tracking-widest py-1.5">
          ✦ Belan Demo Coupon
        </div>

        {/* Header */}
        <div className={`bg-gradient-to-br ${pageState === "expired" ? "from-slate-400 to-slate-600" : gradientClass} text-white px-6 py-8 text-center`}>
          <div className="text-5xl mb-3">
            {pageState === "expired" ? "⏰" : isWinner ? "🏆" : "🎁"}
          </div>
          <h1 className="text-xl font-bold mb-1">
            {pageState === "expired" ? "Prize Expired" : isWinner ? "You Won!" : "Your Discount"}
          </h1>
          <p className="text-sm opacity-90">{restaurantName}</p>
        </div>

        {/* Prize summary */}
        {pageState !== "expired" && (
          <div className="px-6 py-5 border-b border-gray-100 text-center">
            <span className={`inline-block rounded-full px-5 py-2 text-sm font-semibold ${pillClass}`}>
              {prizeLabel}
            </span>
            <p className="text-xs text-gray-400 mt-2">
              {isWinner ? "Congrats on the win!" : "Thanks for playing!"}
            </p>
          </div>
        )}

        {/* Pending */}
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
          </div>
        )}

        {/* Active */}
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
            <p className="text-[11px] text-gray-300">This is a demo — no real discount was created.</p>
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
