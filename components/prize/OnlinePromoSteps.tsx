"use client";

import { useState } from "react";

/**
 * The two-step coupon body for restaurants in "online_promo" redemption mode
 * (coupons are redeemed on the restaurant's ordering site with a shared promo
 * code, not at the register). Shared by the /prize page and the /join success
 * screen so both look identical:
 *
 *   1. Order online  → button opens the ordering site in a new tab
 *   2. Enter this code at checkout → the promo code, tap to copy
 *      (+ optional inline how-to video)
 */
export function OnlinePromoSteps({
  brand,
  onBrand,
  orderUrl,
  promoCode,
  videoUrl,
  onOrderTap,
  onCopy,
}: {
  brand: string;
  onBrand: string;
  orderUrl: string | null;
  promoCode: string | null;
  videoUrl?: string | null;
  /** Called when the order button is tapped (before navigation). */
  onOrderTap?: () => void;
  /** Called after a successful copy (for metrics). */
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const host = (() => {
    if (!orderUrl) return null;
    try {
      return new URL(orderUrl).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();

  const openSite = () => {
    onOrderTap?.();
    if (orderUrl) window.open(orderUrl, "_blank", "noopener");
  };

  const copy = async () => {
    if (!promoCode) return;
    try {
      await navigator.clipboard.writeText(promoCode);
      onCopy?.();
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const StepNo = ({ n }: { n: number }) => (
    <span
      className="inline-flex w-6 h-6 rounded-full items-center justify-center text-[12px] font-black shrink-0"
      style={{ backgroundColor: brand, color: onBrand }}
    >
      {n}
    </span>
  );

  return (
    <div className="space-y-5">
      {/* Step 1 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <StepNo n={1} />
          <p className="text-sm font-bold text-slate-800">Order online</p>
        </div>
        <button
          onClick={openSite}
          disabled={!orderUrl}
          className="w-full font-black text-base rounded-2xl py-4 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: brand, color: onBrand, boxShadow: `0 12px 30px -10px ${brand}` }}
        >
          {host ? `Order at ${host}` : "Order online"}
        </button>
      </div>

      {/* Step 2 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <StepNo n={2} />
          <p className="text-sm font-bold text-slate-800">Enter this code at checkout</p>
        </div>
        {promoCode ? (
          <button
            onClick={copy}
            className="w-full border-2 border-dashed rounded-2xl px-4 py-4 font-black text-2xl tracking-[0.12em]"
            style={{ borderColor: `${brand}66`, backgroundColor: `${brand}0d`, color: brand }}
          >
            {promoCode}
            <span className="block text-[11px] font-semibold mt-1 tracking-normal opacity-70">
              {copied ? "Copied ✓" : "tap to copy"}
            </span>
          </button>
        ) : (
          <p className="text-sm text-slate-400 text-center py-2">Ask the restaurant for your code</p>
        )}
        {videoUrl && (
          <div className="text-center space-y-2">
            <button
              onClick={() => setShowVideo((v) => !v)}
              className="text-[12px] font-semibold underline underline-offset-2 text-slate-500"
            >
              {showVideo ? "Hide video" : "See how to apply it (15 sec)"}
            </button>
            {showVideo && (
              <video
                controls
                playsInline
                preload="metadata"
                src={videoUrl}
                className="w-full rounded-2xl bg-black"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
