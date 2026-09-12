"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Poppins } from "next/font/google";
import { MARKETING_API_BASE_URL } from "@/lib/api";
import ReferralModal from "./ReferralModal";

const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

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
const DEFAULT_BRAND = "#1e293b";

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
  const L = (0.299 * ((n >> 16) & 0xff) + 0.587 * ((n >> 8) & 0xff) + 0.114 * (n & 0xff)) / 255;
  return L > 0.6 ? "#111827" : "#ffffff";
}

// Countdown: days once past 24h, then hours, then MM:SS in the final hour.
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

function formatUseBy(exp: Date): string {
  const time = exp.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const sameDay = exp.toDateString() === new Date().toDateString();
  if (sameDay) return `today by ${time}`;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  if (exp.toDateString() === tomorrow.toDateString()) return `tomorrow by ${time}`;
  return `by ${time} on ${exp.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}`;
}

/** A one-shot confetti burst for winners — pure CSS, no library. */
function Confetti({ colors }: { colors: string[] }) {
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
    [colors],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      <style>{`@keyframes belan-confetti{0%{transform:translateY(-12vh) rotate(0);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: p.left,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            transform: `rotate(${p.rotate})`,
            animation: `belan-confetti ${p.duration} ease-in ${p.delay} 1 both`,
          }}
        />
      ))}
    </div>
  );
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
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [copied, setCopied] = useState(false);
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
        setDiscountName(d.discount_name);
        if (d.redemption_expires_at) {
          const exp = new Date(d.redemption_expires_at);
          setExpiresAt(exp);
          setCountdown(formatRemaining(exp.getTime() - Date.now()));
        }
        setPageState(d.state === "used" ? "used" : d.state === "active" && d.redemption_expires_at ? "active" : d.state === "expired" ? "expired" : "pending");
      })
      .catch(() => setPageState("not_found"));
  }, [prize_code]);

  useEffect(() => {
    if ((pageState !== "active" && pageState !== "pending") || !expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiresAt.getTime() - Date.now());
      setCountdown(formatRemaining(remaining));
      setIsUrgent(remaining < 900_000);
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
      if (data.prize_config?.type === "free-item") return `Free ${data.prize_config.itemName || "Item"}`;
      return `${data.prize_config?.percent || 10}% off`;
    }
    return `${data.loser_discount}% off`;
  };
  const prizeSub = () => {
    if (!data) return "";
    if (data.is_winner) return data.prize_config?.type === "free-item" ? "on us — 100% off that item" : "your whole order";
    return "your next order";
  };

  // ── Branding ──
  const brand = data?.brand_color && /^#?[0-9a-fA-F]{6}$/.test(data.brand_color)
    ? (data.brand_color.startsWith("#") ? data.brand_color : `#${data.brand_color}`)
    : DEFAULT_BRAND;
  const onBrand = textOn(brand);
  const logo = data?.logo_url || null;
  const hero = data?.background_image_url || null;
  const isWinner = !!data?.is_winner;
  const done = pageState === "expired" || pageState === "used";

  if (pageState === "loading") {
    return (
      <div className={`min-h-screen bg-slate-100 flex items-center justify-center p-5 ${poppins.className}`}>
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-300 animate-spin" style={{ borderTopColor: DEFAULT_BRAND }} />
      </div>
    );
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(discountName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div
      className={`min-h-screen flex items-start justify-center px-4 py-6 sm:py-10 ${poppins.className}`}
      style={{ background: `radial-gradient(1200px 600px at 50% -10%, ${brand}33, transparent 60%), #f1f3f7` }}
    >
      {pageState === "active" && isWinner && <Confetti colors={[brand, "#f59e0b", "#22c55e", "#ffffff", darken(brand, 0.3)]} />}

      <div className="relative w-full max-w-sm">
        {/* ── The ticket ── */}
        <div className="bg-white rounded-3xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.35)] ring-1 ring-black/5 overflow-hidden">
          {/* Header: hero photo or brand gradient */}
          <div className="relative h-56">
            {hero ? (
              <div
                className="absolute inset-0"
                style={{ backgroundImage: `url(${hero})`, backgroundSize: "cover", backgroundPosition: data?.restaurant_name === "Lime N Dime" ? "center bottom -100px" : "center" }}
              />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${brand}, ${darken(brand, 0.35)})` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
            <div className="relative h-full flex flex-col items-center justify-end pb-5 px-6 text-center text-white">
              <div className="mb-2.5 w-16 h-16 rounded-full bg-white shadow-lg ring-4 ring-white/40 flex items-center justify-center overflow-hidden">
                {logo && !done ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={data?.restaurant_name ?? "Logo"} className="w-full h-full object-contain p-1.5" />
                ) : (
                  <span className="text-2xl">{pageState === "used" ? "✅" : pageState === "expired" ? "⏰" : isWinner ? "🏆" : "🎁"}</span>
                )}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">{data?.restaurant_name ?? ""}</p>
              <h1 className="text-2xl font-black leading-tight mt-0.5 drop-shadow-sm">
                {pageState === "used" ? "Already used" : pageState === "expired" ? "This one's expired" : pageState === "not_found" ? "Hmm…" : isWinner ? "You won! 🎉" : "A treat for you 🎁"}
              </h1>
            </div>
          </div>

          {/* Perforation */}
          <div className="relative">
            <div className="absolute -left-3 -top-3 w-6 h-6 rounded-full" style={{ background: "#f1f3f7" }} />
            <div className="absolute -right-3 -top-3 w-6 h-6 rounded-full" style={{ background: "#f1f3f7" }} />
            <div className="mx-5 border-t-2 border-dashed border-slate-200" />
          </div>

          {/* Body */}
          {pageState === "not_found" && (
            <div className="px-6 py-10 text-center">
              <p className="font-bold text-slate-800 mb-1">Reward not found</p>
              <p className="text-sm text-slate-500">This link doesn&apos;t exist or has been removed.</p>
            </div>
          )}

          {(pageState === "pending" || pageState === "active") && data && (
            <div className="px-6 pt-6 pb-5 space-y-5">
              {/* The prize, big */}
              <div className="text-center">
                <p className="text-5xl font-black tracking-tight leading-none" style={{ color: brand }}>{prizeLabel()}</p>
                <p className="text-sm font-medium text-slate-500 mt-1.5">{prizeSub()}</p>
              </div>

              {pageState === "pending" ? (
                <>
                  {expiresAt && (
                    <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${brand}0f` }}>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Use it</p>
                        <p className="text-sm font-bold text-slate-800">{formatUseBy(expiresAt)}</p>
                      </div>
                      <p className={`text-2xl font-black tabular-nums ${isUrgent ? "text-red-600" : ""}`} style={isUrgent ? undefined : { color: brand }}>{countdown}</p>
                    </div>
                  )}
                  <button
                    onClick={handleRedeem}
                    disabled={redeeming}
                    className="w-full font-black text-base rounded-2xl py-4 shadow-lg transition-transform active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: brand, color: onBrand, boxShadow: `0 12px 30px -10px ${brand}` }}
                  >
                    {redeeming ? "Getting your code…" : "I'm at the register — redeem"}
                  </button>
                  <p className="text-[12px] text-slate-400 text-center leading-relaxed">Tap when you&apos;re ordering. You&apos;ll get a code to show the cashier.</p>
                  {error && <p className="text-sm text-red-600 text-center bg-red-50 rounded-xl px-4 py-2">{error}</p>}
                </>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-slate-500">Show this to the cashier</p>
                    <button
                      onClick={copyCode}
                      className="w-full border-2 border-dashed rounded-2xl px-4 py-4 font-black text-lg break-all tracking-wide"
                      style={{ borderColor: `${brand}66`, backgroundColor: `${brand}0d`, color: darken(brand, 0.15) }}
                    >
                      {discountName}
                      <span className="block text-[11px] font-semibold mt-1 opacity-70">{copied ? "Copied ✓" : "tap to copy"}</span>
                    </button>
                    <p className="text-[12px] text-slate-400 leading-relaxed">
                      <span className="font-semibold text-slate-600">Cashier:</span> find this name in your POS discount list and apply it.
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: `${brand}0f` }}>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Time left</p>
                    <p className={`text-2xl font-black tabular-nums ${isUrgent ? "text-red-600" : ""}`} style={isUrgent ? undefined : { color: brand }}>{countdown}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {pageState === "used" && (
            <div className="px-6 py-10 text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <p className="font-bold text-slate-800">This coupon has been used</p>
              <p className="text-sm text-slate-500 leading-relaxed">Thanks for stopping by! Keep an eye on your texts for the next one.</p>
            </div>
          )}

          {pageState === "expired" && (
            <div className="px-6 py-10 text-center space-y-2">
              <div className="text-4xl">⏰</div>
              <p className="font-bold text-slate-800">This offer has expired</p>
              <p className="text-sm text-slate-500 leading-relaxed">The window has closed — but there&apos;s always a next game.</p>
            </div>
          )}

          {/* Referral CTA — only where a bump still means something */}
          {data?.referral && (pageState === "pending" || pageState === "active" || pageState === "used") && (
            <div className="px-6 pb-5">
              <button
                onClick={() => setShowReferralModal(true)}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 py-3 px-4 font-bold text-sm transition-colors"
                style={{ borderColor: `${brand}55`, color: darken(brand, 0.1) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/refer.webp" alt="" className="w-5 h-5" />
                Invite a friend, get +{data.referral.bonus_percent}%
              </button>
            </div>
          )}

          <div className="px-6 py-3 text-center text-[11px] text-slate-300 border-t border-slate-100">Powered by Belan</div>
        </div>
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
