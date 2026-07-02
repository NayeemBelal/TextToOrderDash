"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "@/lib/api";

/* ── games (mirror the real product's GAME_DEFINITIONS) ── */
type GameType = "pick-number" | "trivia" | "guess-letter" | "roll-dice";

const GAMES: { type: GameType; label: string; emoji: string; hint: string }[] = [
  { type: "pick-number", label: "Pick a Number", emoji: "🎲", hint: "1–100" },
  { type: "roll-dice", label: "Roll the Dice", emoji: "🎰", hint: "1–6" },
  { type: "trivia", label: "Food Trivia", emoji: "🍕", hint: "A / B / C" },
  { type: "guess-letter", label: "Guess the Letter", emoji: "🔤", hint: "A–Z" },
];

const ease = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#c4b5fd"; // Marketing AI purple

/* ── status shape from GET /api/marketing/demo/status ── */
interface DemoStatus {
  found: boolean;
  status?: "sent" | "answered";
  game_type?: string;
  prize_label?: string;
  response_text?: string | null;
  is_winner?: boolean | null;
  prize_code?: string | null;
}

interface SendResult {
  ok: boolean;
  phone_number: string;
  game_type: string;
  prize_label: string;
  message: string;
  expires_at: string;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length < 4) return d;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function MarketingDemo() {
  const [phone, setPhone] = useState("");
  const [game, setGame] = useState<GameType>("pick-number");
  const [percent, setPercent] = useState(20);
  const [consent, setConsent] = useState(false);

  const [phase, setPhase] = useState<"idle" | "sending" | "sent" | "answered">("idle");
  const [error, setError] = useState("");
  const [sent, setSent] = useState<SendResult | null>(null);
  const [status, setStatus] = useState<DemoStatus | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCount = useRef(0);

  const digits = phone.replace(/\D/g, "");
  const canSend = digits.length === 10 && consent && phase !== "sending";

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function startPolling(phoneNumber: string) {
    pollCount.current = 0;
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      pollCount.current += 1;
      // ~3 min cap (60 × 3s)
      if (pollCount.current > 60) { if (pollRef.current) clearInterval(pollRef.current); return; }
      try {
        const r = await fetch(
          `${API_BASE_URL}/api/marketing/demo/status?phone_number=${encodeURIComponent(phoneNumber)}`,
        );
        const d: DemoStatus = await r.json();
        setStatus(d);
        if (d.found && d.status === "answered") {
          setPhase("answered");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
  }

  async function handleSend() {
    if (!canSend) return;
    setPhase("sending");
    setError("");
    setStatus(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/marketing/demo/send-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phone,
          game_type: game,
          prize_type: "percent-off",
          prize_percent: percent,
          consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Could not send the demo text.");
      setSent(data as SendResult);
      setPhase("sent");
      startPolling((data as SendResult).phone_number);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setPhase("idle");
    }
  }

  function reset() {
    if (pollRef.current) clearInterval(pollRef.current);
    setPhase("idle");
    setSent(null);
    setStatus(null);
    setError("");
  }

  const prizeLabel = status?.prize_label || sent?.prize_label || `${percent}% off your order`;
  const won = status?.is_winner === true;
  const code = status?.prize_code || "";
  const prizeHref =
    code &&
    `/marketing/demo/prize/${code}?win=${won ? 1 : 0}&label=${encodeURIComponent(prizeLabel)}&demo=1`;

  return (
    <div className="grid lg:grid-cols-2 gap-0 border-2 border-black bg-white">
      {/* ── Left: form ── */}
      <div className="p-6 md:p-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black">
        <h3 className="font-black text-2xl text-black" style={{ fontFamily: "Tektur, sans-serif" }}>
          Try it on your own phone
        </h3>
        <p className="text-sm font-bold text-black/60 mt-1 mb-6">
          Enter a number, pick a game, and we&apos;ll text it a real gamified offer — right now.
        </p>

        {/* phone */}
        <label className="block text-xs font-black uppercase tracking-widest text-black mb-2">
          Phone number
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="(555) 123-4567"
          disabled={phase === "sending"}
          className="w-full border-2 border-black px-4 py-3 text-base font-bold text-black placeholder:text-black/30 focus:outline-none focus:shadow-[3px_3px_0px_#000] transition-shadow disabled:opacity-50"
        />

        {/* game picker */}
        <label className="block text-xs font-black uppercase tracking-widest text-black mt-6 mb-2">
          Choose a game
        </label>
        <div className="grid grid-cols-2 gap-2">
          {GAMES.map((g) => {
            const active = game === g.type;
            return (
              <button
                key={g.type}
                onClick={() => setGame(g.type)}
                disabled={phase === "sending"}
                className={`flex items-center gap-2 border-2 border-black px-3 py-3 text-left transition-all disabled:opacity-50 ${
                  active ? "shadow-[3px_3px_0px_#000] -translate-x-px -translate-y-px" : "hover:bg-black/5"
                }`}
                style={active ? { background: ACCENT } : undefined}
              >
                <span className="text-2xl leading-none">{g.emoji}</span>
                <span>
                  <span className="block font-black text-sm text-black leading-tight">{g.label}</span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-black/50">
                    {g.hint}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* prize */}
        <label className="block text-xs font-black uppercase tracking-widest text-black mt-6 mb-2">
          Winner&apos;s prize
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={50}
            step={5}
            value={percent}
            onChange={(e) => setPercent(Number(e.target.value))}
            disabled={phase === "sending"}
            className="flex-1 accent-black"
          />
          <span
            className="border-2 border-black px-3 py-1.5 font-black text-black text-sm min-w-[72px] text-center"
            style={{ background: ACCENT }}
          >
            {percent}% off
          </span>
        </div>

        {/* consent */}
        <label className="flex items-start gap-3 mt-6 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            disabled={phase === "sending"}
            className="mt-0.5 w-5 h-5 accent-black border-2 border-black flex-shrink-0"
          />
          <span className="text-xs font-bold text-black/70 leading-relaxed">
            I have permission to text this number. This sends one real SMS for demo purposes.
          </span>
        </label>

        {error && (
          <p className="mt-4 text-sm font-bold text-red-600 bg-red-50 border-2 border-red-600 px-3 py-2">
            {error}
          </p>
        )}

        {/* CTA */}
        <motion.button
          onClick={handleSend}
          disabled={!canSend}
          whileHover={canSend ? { y: -3, boxShadow: "4px 4px 0px #000" } : {}}
          whileTap={canSend ? { scale: 0.98 } : {}}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="mt-6 w-full bg-black text-white font-black tracking-widest uppercase text-sm py-4 border-2 border-black disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: "Tektur, sans-serif" }}
        >
          {phase === "sending" ? "Sending…" : phase === "idle" ? "Send me the game 🎮" : "Sent! Check the phone 📲"}
        </motion.button>

        {phase !== "idle" && (
          <button
            onClick={reset}
            className="mt-3 w-full text-xs font-black uppercase tracking-widest text-black/50 hover:text-black transition-colors"
          >
            ↻ Run another demo
          </button>
        )}
      </div>

      {/* ── Right: phone mockup ── */}
      <div className="p-6 md:p-8 flex items-center justify-center bg-[#f4f1fb]">
        <PhoneMockup
          phase={phase}
          gameMessage={sent?.message}
          reply={status?.response_text}
          won={won}
          prizeLabel={prizeLabel}
          code={code}
          prizeHref={prizeHref || undefined}
        />
      </div>
    </div>
  );
}

/* ── on-screen recipient phone ── */
function PhoneMockup({
  phase,
  gameMessage,
  reply,
  won,
  prizeLabel,
  code,
  prizeHref,
}: {
  phase: "idle" | "sending" | "sent" | "answered";
  gameMessage?: string;
  reply?: string | null;
  won: boolean;
  prizeLabel: string;
  code: string;
  prizeHref?: string;
}) {
  return (
    <div className="w-full max-w-[300px] border-2 border-black bg-white" style={{ borderRadius: 28 }}>
      {/* notch / header */}
      <div className="flex items-center justify-center relative border-b-2 border-black py-3" style={{ background: ACCENT, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
        <span className="absolute left-1/2 -translate-x-1/2 top-1.5 w-16 h-1.5 rounded-full bg-black/30" />
        <span className="font-black text-sm text-black mt-1" style={{ fontFamily: "Tektur, sans-serif" }}>
          Stack &amp; Smash Burgers
        </span>
      </div>

      {/* conversation */}
      <div className="p-4 flex flex-col gap-3 min-h-[340px] justify-end">
        {phase === "idle" && (
          <p className="text-center text-xs font-bold text-black/40 my-auto">
            Your gamified text will appear here 👇
          </p>
        )}

        {/* incoming: the game */}
        {phase !== "idle" && (
          <Bubble side="in" delay={0}>
            {gameMessage || "🎲 Sending your game…"}
          </Bubble>
        )}

        {phase === "sent" && (
          <p className="text-center text-[11px] font-bold text-black/40 mt-1">
            Waiting for a reply… text your answer back!
          </p>
        )}

        {/* outgoing: their reply */}
        {phase === "answered" && reply && (
          <Bubble side="out" delay={0.1}>
            {reply}
          </Bubble>
        )}

        {/* incoming: the coupon */}
        {phase === "answered" && (
          <Bubble side="in" delay={0.35}>
            {won ? "🏆 You won! " : "So close! Here's one on us — "}
            tap to claim {prizeLabel} (valid 7 days):{" "}
            {prizeHref ? (
              <a href={prizeHref} target="_blank" rel="noopener noreferrer" className="underline font-black break-all">
                belan.tech/prize/{code}
              </a>
            ) : (
              <span className="underline break-all">belan.tech/prize/{code}</span>
            )}
          </Bubble>
        )}
      </div>
    </div>
  );
}

function Bubble({ side, delay, children }: { side: "in" | "out"; delay: number; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease, delay }}
        className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line border-2 border-black ${
          side === "in"
            ? "self-start bg-white text-black rounded-2xl rounded-bl-sm"
            : "self-end text-black rounded-2xl rounded-br-sm"
        }`}
        style={side === "out" ? { background: "#a4e5f8" } : undefined}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
