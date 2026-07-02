"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import MarketingDemo from "@/components/marketing/MarketingDemo";

const ease = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#c4b5fd"; // Marketing AI purple
const BOOK_DEMO = "https://calendar.app.google/uCwfd2qfNtjJMSca9";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/* ── value props ── */
const VALUES = [
  {
    color: "#c4b5fd",
    emoji: "🎮",
    title: "Games, not spam",
    desc: "Every text is a game — pick a number, roll the dice, food trivia. Customers actually reply because it's fun.",
  },
  {
    color: "#a4e5f8",
    emoji: "🤖",
    title: "The AI runs it",
    desc: "Set a schedule once. The AI sends the games, picks winners, and sends prizes — automatically, every week.",
  },
  {
    color: "#a1dfc5",
    emoji: "🎟️",
    title: "Real POS discounts",
    desc: "Winners redeem a coupon that becomes a real discount in your Clover register. No manual codes, no mess.",
  },
  {
    color: "#fbc8d4",
    emoji: "📈",
    title: "Brings them back",
    desc: "Consolation discounts for everyone who plays means even non-winners have a reason to come in this week.",
  },
];

/* ── how it works ── */
const STEPS = [
  {
    n: "01",
    title: "Create a campaign",
    desc: "Pick your days, games, and prizes in a 5-step setup. Choose who gets it from your opted-in list.",
  },
  {
    n: "02",
    title: "Customers get a game",
    desc: "Your guests receive a fun text — a quick game with a prize on the line. They reply to play.",
  },
  {
    n: "03",
    title: "They play & win",
    desc: "Winners get a prize, everyone else gets a discount. Both redeem in-store as a real POS coupon.",
  },
];

/* ── campaign-creation showcase (read-only mock of the real wizard) ── */
const WIZARD = [
  { n: 1, label: "Roster", desc: "Choose opted-in customers" },
  { n: 2, label: "Schedule", desc: "Up to 2 game days / week" },
  { n: 3, label: "Games", desc: "Pick a game per day" },
  { n: 4, label: "Prizes", desc: "Winner prize + consolation" },
  { n: 5, label: "Review", desc: "Preview & launch" },
];

export default function MarketingLandingPage() {
  return (
    <div className="min-h-screen bg-white font-tektur">
      <SiteNav />

      {/* ── Hero ── */}
      <section className="border-b-2 border-black overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="inline-block border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest mb-5"
              style={{ background: ACCENT }}
            >
              ✦ Belan Marketing AI
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-black text-black leading-[0.95] text-4xl md:text-5xl xl:text-6xl"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              Turn one-time customers into regulars — with a game.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-base md:text-lg font-bold text-black/60 max-w-lg">
              Belan&apos;s Marketing AI sends your customers fun, gamified texts that they actually
              play. Winners get prizes, everyone gets a reason to come back — all on autopilot.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/marketing/onboarding"
                className="font-black uppercase tracking-widest text-sm px-7 py-4 border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000]"
                style={{ background: ACCENT, color: "#000" }}
              >
                Set up my restaurant →
              </Link>
              <motion.a
                href="#demo"
                whileHover={{ y: -3, boxShadow: "4px 4px 0px #000" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="bg-black text-white font-black uppercase tracking-widest text-sm px-7 py-4 border-2 border-black"
              >
                Try the live demo →
              </motion.a>
              <motion.a
                href={BOOK_DEMO}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3, boxShadow: "4px 4px 0px #000" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="bg-white text-black font-black uppercase tracking-widest text-sm px-7 py-4 border-2 border-black"
              >
                Book a call
              </motion.a>
            </motion.div>
          </motion.div>

          {/* hero phone preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ duration: 0.6, ease }}
            className="justify-self-center"
          >
            <div className="w-[280px] border-2 border-black bg-white" style={{ borderRadius: 28 }}>
              <div className="flex items-center justify-center border-b-2 border-black py-3" style={{ background: ACCENT, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}>
                <span className="font-black text-sm text-black">Stack &amp; Smash Burgers</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="self-start max-w-[85%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🎲 Pick a number between 1–100 for your chance to win 20% off your order! Reply with your number.
                </div>
                <div className="self-end max-w-[60%] border-2 border-black px-3.5 py-2.5 text-[13px] rounded-2xl rounded-br-sm" style={{ background: "#a4e5f8" }}>
                  42
                </div>
                <div className="self-start max-w-[85%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🏆 You won! Tap to claim 20% off (valid 7 days): <span className="underline font-black">belan.tech/prize/WIN-7K2P</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Value props ── */}
      <section className="border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
            Why it works
          </h2>
          <p className="font-bold text-black/50 mb-10 max-w-2xl">
            Promo blasts get ignored. Games get played. The difference is engagement — and
            engagement is what fills slow nights.
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {VALUES.map((v) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                className="p-6 border-2 border-black"
                style={{ background: v.color }}
              >
                <div className="text-4xl mb-3">{v.emoji}</div>
                <h3 className="font-black text-lg text-black mb-1.5">{v.title}</h3>
                <p className="text-sm font-bold text-black/70 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b-2 border-black" style={{ background: "#faf8ff" }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-10" style={{ fontFamily: "Tektur, sans-serif" }}>
            How it works
          </h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-3 gap-5"
          >
            {STEPS.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="border-2 border-black bg-white p-6">
                <div
                  className="inline-block font-black text-2xl text-black border-2 border-black px-3 py-1 mb-4"
                  style={{ background: ACCENT, fontFamily: "Tektur, sans-serif" }}
                >
                  {s.n}
                </div>
                <h3 className="font-black text-xl text-black mb-2">{s.title}</h3>
                <p className="text-sm font-bold text-black/60 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Campaign-creation showcase ── */}
      <section className="border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
            Setup takes 5 minutes
          </h2>
          <p className="font-bold text-black/50 mb-10 max-w-2xl">
            You stay in control. A simple 5-step wizard launches a campaign that runs for weeks.
          </p>
          <div className="flex flex-col md:flex-row gap-0 border-2 border-black overflow-hidden">
            {WIZARD.map((w, i) => (
              <div
                key={w.n}
                className={`flex-1 p-5 border-black ${i < WIZARD.length - 1 ? "border-b-2 md:border-b-0 md:border-r-2" : ""}`}
                style={{ background: i % 2 === 0 ? "#ffffff" : "#f4f1fb" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-black text-white font-black text-xs">
                    {w.n}
                  </span>
                  <span className="font-black text-black text-sm uppercase tracking-wide">{w.label}</span>
                </div>
                <p className="text-xs font-bold text-black/55 leading-relaxed">{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live demo ── */}
      <section id="demo" className="border-b-2 border-black scroll-mt-20" style={{ background: ACCENT }}>
        <div className="max-w-[1100px] mx-auto px-6 md:px-10 py-16">
          <div className="text-center mb-8">
            <h2 className="font-black text-3xl md:text-4xl text-black" style={{ fontFamily: "Tektur, sans-serif" }}>
              See it for yourself 📲
            </h2>
            <p className="font-bold text-black/60 mt-2 max-w-xl mx-auto">
              This is exactly what your customers experience. Send yourself a real game text, reply
              with your answer, and watch the coupon come back.
            </p>
          </div>
          <MarketingDemo />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-b-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-20 text-center">
          <h2 className="font-black text-3xl md:text-5xl text-black max-w-3xl mx-auto leading-tight" style={{ fontFamily: "Tektur, sans-serif" }}>
            Ready to fill your slow nights?
          </h2>
          <p className="font-bold text-black/60 mt-4 max-w-xl mx-auto">
            Book a 15-minute call and we&apos;ll set up your first gamified campaign together.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/marketing/onboarding"
              className="inline-block font-black uppercase tracking-widest text-sm px-10 py-5 border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000]"
              style={{ background: ACCENT, color: "#000" }}
            >
              Set up my restaurant →
            </Link>
            <motion.a
              href={BOOK_DEMO}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -3, boxShadow: "5px 5px 0px #000" }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="inline-block bg-black text-white font-black uppercase tracking-widest text-sm px-10 py-5 border-2 border-black"
            >
              Book a demo →
            </motion.a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan AI" className="w-8 h-8 rounded-full border-2 border-black object-cover" />
            <span className="font-black text-black text-sm tracking-tight">BELAN AI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold tracking-widest text-black/60">
            <Link href="/" className="hover:text-black transition-colors">HOME</Link>
            <Link href="/how-it-works" className="hover:text-black transition-colors">HOW IT WORKS</Link>
            <Link href="/about" className="hover:text-black transition-colors">ABOUT</Link>
            <Link href="/privacy-policy" className="hover:text-black transition-colors">PRIVACY</Link>
          </div>
          <p className="text-xs font-bold tracking-widest text-black/40">© 2026 BELAN AI</p>
        </div>
      </footer>
    </div>
  );
}
