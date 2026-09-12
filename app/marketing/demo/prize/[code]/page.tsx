"use client";

/* The landing-page demo coupon. Same gift-ticket design and states as the real
   /prize/[prize_code] page, in the fictional Stack & Smash Burgers branding —
   but the "redeem" is mocked: no POS discount is ever created. Outcome and
   prize come from the demo lookup endpoint (falling back to the URL params the
   SMS link carries), so the page reflects the real game the visitor played. */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { MARKETING_API_BASE_URL } from "@/lib/config";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

type PrizeState = "loading" | "pending" | "active" | "expired";

const BRAND = "#e11d48";
const BRAND_DARK = "#9f1239";
const RESTAURANT = "Stack & Smash Burgers";
const DEMO_WINDOW_MS = 24 * 60 * 60 * 1000;

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Confetti() {
  const colors = [BRAND, "#f59e0b", "#22c55e", "#ffffff", BRAND_DARK];
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        delay: `${(i % 9) * 0.09}s`,
        duration: `${2.4 + (i % 5) * 0.35}s`,
        color: colors[i % colors.length],
        rotate: `${(i * 53) % 360}deg`,
        size: 6 + (i % 4) * 2,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      <style>{`@keyframes belan-confetti{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[2px]"
          style={{ left: p.left, width: p.size, height: p.size * 1.6, background: p.color, transform: `rotate(${p.rotate})`, animation: `belan-confetti ${p.duration} ease-in ${p.delay} 1 both` }}
        />
      ))}
    </div>
  );
}

export default function DemoPrizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "#f1f3f7" }} />}>
      <DemoPrizeContent />
    </Suspense>
  );
}

function DemoPrizeContent() {
  const { code } = useParams<{ code: string }>();
  const search = useSearchParams();

  const [isWinner, setIsWinner] = useState(search.get("win") === "1" || code.startsWith("WIN"));
  const [prizeLabel, setPrizeLabel] = useState(search.get("label") || "a discount");
  const [pageState, setPageState] = useState<PrizeState>("loading");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const discountName = `${prizeLabel} - ${code}`;

  // Prefer the server's record of this demo (what the visitor actually played).
  useEffect(() => {
    let cancelled = false;
    fetch(`${MARKETING_API_BASE_URL}/api/marketing/demo/prize/${code}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { is_winner?: boolean; prize_label?: string } | null) => {
        if (cancelled) return;
        if (d) {
          setIsWinner(!!d.is_winner);
          if (d.prize_label) setPrizeLabel(d.prize_label);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          const exp = new Date(Date.now() + DEMO_WINDOW_MS);
          setExpiresAt(exp);
          setCountdown(formatRemaining(DEMO_WINDOW_MS));
          setPageState("pending");
        }
      });
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if ((pageState !== "active" && pageState !== "pending") || !expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setCountdown(formatRemaining(remaining));
      setIsUrgent(remaining < 900_000);
      if (remaining <= 0) { clearInterval(timerRef.current!); setPageState("expired"); }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [pageState, expiresAt]);

  function handleRedeem() {
    setRedeeming(true);
    // Mock: pretend to create the POS discount, then show the cashier code.
    setTimeout(() => { setPageState("active"); setRedeeming(false); }, 700);
  }

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(discountName); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  if (pageState === "loading") {
    return (
      <div className={`min-h-screen bg-slate-100 flex items-center justify-center p-5 ${poppins.className}`}>
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-300 animate-spin" style={{ borderTopColor: BRAND }} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex items-start justify-center px-4 py-6 sm:py-10 ${poppins.className}`}
      style={{ background: `radial-gradient(1200px 600px at 50% -10%, ${BRAND}33, transparent 60%), #f1f3f7` }}
    >
      {pageState === "active" && isWinner && <Confetti />}

      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5 overflow-hidden">
          {/* Demo ribbon */}
          <div className="bg-black text-white text-center text-[11px] font-bold uppercase tracking-widest py-1.5">
            ✦ Belan demo · no real discount is created
          </div>

          {/* Header */}
          <div className="relative h-52">
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})` }} />
            <div className="absolute -right-6 -top-4 text-[150px] leading-none opacity-20 select-none" aria-hidden>🍔</div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="relative h-full flex flex-col items-center justify-end pb-5 px-6 text-center text-white">
              <div className="mb-2.5 w-16 h-16 rounded-full bg-white shadow-lg ring-4 ring-white/40 flex items-center justify-center text-3xl">
                {pageState === "expired" ? "⏰" : "🍔"}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{RESTAURANT}</p>
              <h1 className="text-2xl font-black leading-tight mt-0.5 drop-shadow-sm">
                {pageState === "expired" ? "This one's expired" : isWinner ? "You won! 🎉" : "A treat for you 🎁"}
              </h1>
            </div>
          </div>

          {/* Perforation */}
          <div className="relative">
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full" style={{ background: "#f1f3f7" }} />
            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full" style={{ background: "#f1f3f7" }} />
            <div className="mx-5 border-t-2 border-dashed border-slate-200" />
          </div>

          {(pageState === "pending" || pageState === "active") && (
            <div className="px-6 pt-6 pb-5 space-y-5">
              <div className="text-center">
                <p className="text-4xl font-black tracking-tight leading-none" style={{ color: BRAND }}>{prizeLabel}</p>
                <p className="text-sm font-medium text-slate-500 mt-1.5">{isWinner ? "on your whole order" : "on your next order"}</p>
              </div>

              {pageState === "pending" ? (
                <>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${BRAND}0f` }}>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Use it</p>
                      <p className="text-sm font-bold text-slate-800">within 24 hours</p>
                    </div>
                    <p className={`text-2xl font-black tabular-nums ${isUrgent ? "text-red-600" : ""}`} style={isUrgent ? undefined : { color: BRAND }}>{countdown}</p>
                  </div>
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="w-full font-black text-base rounded-2xl py-4 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60 text-white"
                    style={{ backgroundColor: BRAND, boxShadow: `0 12px 30px -10px ${BRAND}` }}
                  >
                    {redeeming ? "Getting your code…" : "I'm at the register — redeem"}
                  </button>
                  <p className="text-[12px] text-slate-400 text-center leading-relaxed">Tap when you&apos;re ordering. You&apos;ll get a code to show the cashier.</p>
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-slate-500">Show this to the cashier</p>
                    <button
                      onClick={copyCode}
                      className="w-full border-2 border-dashed rounded-2xl px-4 py-4 font-black text-lg break-all tracking-wide"
                      style={{ borderColor: `${BRAND}66`, backgroundColor: `${BRAND}0d`, color: BRAND_DARK }}
                    >
                      {discountName}
                      <span className="block text-[11px] font-semibold mt-1 opacity-70">{copied ? "Copied ✓" : "tap to copy"}</span>
                    </button>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-600">Cashier:</span> find this name in your POS discount list and apply it.
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${BRAND}0f` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Time left</p>
                    <p className={`text-2xl font-black tabular-nums ${isUrgent ? "text-red-600" : ""}`} style={isUrgent ? undefined : { color: BRAND }}>{countdown}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">In a real campaign this creates a real discount at the register.</p>
                </>
              )}
            </div>
          )}

          {pageState === "expired" && (
            <div className="px-6 py-10 text-center space-y-2">
              <div className="text-4xl">⏰</div>
              <p className="font-bold text-slate-800">This offer has expired</p>
              <p className="text-sm text-slate-500 leading-relaxed">The window has closed — play the next game for another chance.</p>
            </div>
          )}

          <div className="px-6 py-3 text-center text-[11px] text-slate-300 border-t border-slate-100">Powered by Belan</div>
        </div>

        <a
          href="/marketing/onboarding"
          className="mt-5 block text-center text-sm font-bold text-slate-600 hover:text-slate-900"
        >
          Want this for your restaurant? Set it up in 10 minutes →
        </a>
      </div>
    </div>
  );
}
