"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SiteNav from "@/components/SiteNav";
import MarketingDemo from "@/components/marketing/MarketingDemo";

/* ── design tokens (shared with the onboarding wizard + /oldprods) ── */
const ease = [0.22, 1, 0.36, 1] as const;
const ACCENT = "#c4b5fd"; // Marketing AI purple
const BOOK_DEMO = "https://calendar.app.google/uCwfd2qfNtjJMSca9";
const SIGNUP = "/marketing/onboarding";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

/* ── how it works — mirrors the real dashboard flow 1:1 ── */
const STEPS = [
  {
    n: "01",
    title: "Add your customers",
    desc: "Import the list you already have, or put our QR sign-up form on the counter. Every contact carries a real, recorded consent.",
    color: "#a4e5f8",
  },
  {
    n: "02",
    title: "Pick a game",
    desc: "Choose from a curated catalog — trivia, pick-a-number, roll the dice, closest guess, random draw — or build your own in a minute.",
    color: ACCENT,
  },
  {
    n: "03",
    title: "Set prizes & a schedule",
    desc: "A free item or a percentage off for winners, an optional consolation for everyone else, and the days and times it goes out.",
    color: "#f5dda1",
  },
  {
    n: "04",
    title: "Test it on your phone, then launch",
    desc: "Send yourself the real text, play it, open the coupon. When it feels right, launch — Belan runs every round from there.",
    color: "#a1dfc5",
  },
];

/* ── features — one card per thing the product actually does ── */
const FEATURES = [
  { emoji: "🎯", title: "Curated game catalog", desc: "Ready-to-run games with proven copy, tuned for restaurants, cafés and retail." },
  { emoji: "🛠️", title: "Build your own game", desc: "Pick what players reply with, how they win, and how many can win. Live preview included." },
  { emoji: "🎉", title: "Everyone-wins mode", desc: "No losers. Every reply gets the prize — the fastest way to fill a slow night." },
  { emoji: "📣", title: "Promotional messages", desc: "A one-off or scheduled text to any group, with an optional instant coupon." },
  { emoji: "🎟️", title: "Branded coupon pages", desc: "Your logo, colours and food photo — in the link preview and on the page. Redeem creates a real POS discount." },
  { emoji: "🤝", title: "Referral bonus", desc: "Customers invite a friend from their coupon page; the friend gets a welcome offer, they get a bump." },
  { emoji: "📈", title: "Revenue from your POS", desc: "Every order that used a coupon is pulled from the register and attributed to the campaign." },
  { emoji: "🧾", title: "Customer timeline", desc: "Search any phone number and see every text, reply, game, coupon and order — in order." },
];

const EXTRAS = ["Customer groups", "Scheduled sends", "Coupon expiry windows", "Delivery receipts", "Test sends", "Spreadsheet import", "Pause / resume", "Dark mode"];

const PLAN_INCLUDES = [
  "A dedicated marketing phone number",
  "Unlimited game and promotional campaigns",
  "Curated catalog + build-your-own games",
  "Branded coupon, sign-up and referral pages",
  "POS revenue tracking and the customer timeline",
  "Live cost estimates before every send",
  "Setup with a real person on a call",
];

const FAQ = [
  {
    q: "Do my customers need an app?",
    a: "No. Everything happens over a normal text message. They reply with an answer and tap a link to see their coupon.",
  },
  {
    q: "How do customers get on my list?",
    a: "Two ways: import the contacts you already have permission to text, or put our QR sign-up form on your counter, receipts and tables. Either way the consent is recorded, and STOP is handled automatically.",
  },
  {
    q: "Which POS does it work with?",
    a: "Clover today — coupons become real discounts and orders are matched back to campaigns. Toast and Square are next. Any restaurant can run games from a spreadsheet list in the meantime.",
  },
  {
    q: "Can I try a campaign before sending it to everyone?",
    a: "Yes. Every step has a “send to my phone” button: you receive the real text, play the real game, and open the real coupon page before anyone else does.",
  },
  {
    q: "What does it cost me in discounts?",
    a: "You choose the prize, the consolation (or none), how many can win, and how long the coupon lasts. The dashboard shows the estimated text cost before you send.",
  },
  {
    q: "How long does setup take?",
    a: "About ten minutes for the account. We provision your number and, if you're on Clover, connect it — then your first campaign is a five-step wizard.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      className="w-full text-left border-2 border-black bg-white p-5 transition-colors hover:bg-[#faf8ff]"
    >
      <div className="flex items-center justify-between gap-4">
        <span className="font-black text-black text-sm md:text-base">{q}</span>
        <span className="text-xl font-black leading-none">{open ? "–" : "+"}</span>
      </div>
      {open && <p className="mt-3 text-sm font-bold text-black/60 leading-relaxed">{a}</p>}
    </button>
  );
}

export default function MarketingHomePage() {
  return (
    <div className="min-h-screen bg-white font-tektur overflow-x-hidden">
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
              ✦ Gamified SMS marketing for restaurants
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="font-black text-black leading-[0.95] text-4xl md:text-5xl xl:text-6xl"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              Turn one-time customers into regulars — with a game.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 text-base md:text-lg font-bold text-black/60 max-w-lg">
              Belan texts your customers a quick game they actually play. Winners get a prize, everyone gets a
              reason to come back this week — and you see exactly which orders it brought in.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                href={SIGNUP}
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
            <motion.p variants={fadeUp} className="mt-4 text-xs font-bold text-black/40">
              $200/month flat · phone number included · no per-text fees
            </motion.p>
          </motion.div>

          {/* hero phone preview — a real exchange, branded coupon link included */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ duration: 0.6, ease }}
            className="justify-self-center"
          >
            <div className="w-[290px] border-2 border-black bg-white" style={{ borderRadius: 28 }}>
              <div
                className="flex items-center justify-center border-b-2 border-black py-3"
                style={{ background: ACCENT, borderTopLeftRadius: 26, borderTopRightRadius: 26 }}
              >
                <span className="font-black text-sm text-black">Sauce Bros Pizza</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="self-start max-w-[88%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🍕 Trivia Tuesday! What&apos;s the most ordered pizza in America? A) Pepperoni B) Cheese C) Supreme.
                  Reply with your answer to win 20% off tonight!
                </div>
                <div className="self-end max-w-[60%] border-2 border-black px-3.5 py-2.5 text-[13px] rounded-2xl rounded-br-sm" style={{ background: "#a4e5f8" }}>
                  A
                </div>
                <div className="self-start max-w-[88%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🏆 Correct! Tap to claim 20% off (valid tonight): belan.tech/prize/WIN-7K2P
                  <div className="mt-2 border-2 border-black overflow-hidden rounded-lg">
                    <div className="h-14 flex items-center gap-2 px-2" style={{ background: "#3a1a0f" }}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-base">🍕</div>
                      <div className="leading-tight">
                        <p className="text-[11px] font-black text-white">Sauce Bros Pizza</p>
                        <p className="text-[10px] font-bold" style={{ color: "#f4c6d6" }}>You won 20% off 🎉</p>
                      </div>
                    </div>
                    <p className="px-2 py-1 text-[10px] font-bold text-black/50 bg-white">belan.tech</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-b-2 border-black scroll-mt-20" style={{ background: "#faf8ff" }}>
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
            How it works
          </h2>
          <p className="font-bold text-black/50 mb-10 max-w-2xl">
            The same four steps you&apos;ll see in the dashboard. Set it up once; Belan sends every round,
            grades every reply, texts every coupon, and matches the orders back.
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid md:grid-cols-2 xl:grid-cols-4 gap-5"
          >
            {STEPS.map((s) => (
              <motion.div key={s.n} variants={fadeUp} className="border-2 border-black bg-white p-6 flex flex-col">
                <div
                  className="inline-block self-start font-black text-2xl text-black border-2 border-black px-3 py-1 mb-4"
                  style={{ background: s.color, fontFamily: "Tektur, sans-serif" }}
                >
                  {s.n}
                </div>
                <h3 className="font-black text-lg text-black mb-2">{s.title}</h3>
                <p className="text-sm font-bold text-black/60 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="border-b-2 border-black scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
            Everything in the box
          </h2>
          <p className="font-bold text-black/50 mb-10 max-w-2xl">
            Promo blasts get ignored. Games get played. Here&apos;s what makes the difference.
          </p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                className="p-6 border-2 border-black"
                style={{ background: ["#ffffff", "#f4f1fb"][i % 2] }}
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-black text-base text-black mb-1.5">{f.title}</h3>
                <p className="text-sm font-bold text-black/60 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-6 flex flex-wrap gap-2">
            {EXTRAS.map((x) => (
              <span key={x} className="border-2 border-black px-3 py-1 text-[11px] font-black uppercase tracking-widest bg-white">
                {x}
              </span>
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
              This is exactly what your customers experience. Send yourself a real game text, reply with your
              answer, and watch the coupon come back.
            </p>
          </div>
          <MarketingDemo />
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-b-2 border-black scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
            One flat price
          </h2>
          <p className="font-bold text-black/50 mb-10 max-w-2xl">
            No per-text fees, no contracts. Cancel any time.
          </p>
          <div className="grid lg:grid-cols-[3fr_2fr] gap-5">
            <div className="border-2 border-black bg-white p-7 md:p-9">
              <div className="flex items-end gap-2 mb-1">
                <span className="font-black text-5xl md:text-6xl text-black leading-none" style={{ fontFamily: "Tektur, sans-serif" }}>
                  $200
                </span>
                <span className="font-black text-black/50 mb-1">/ month</span>
              </div>
              <p className="text-sm font-bold text-black/60 mb-6">Gamified marketing, everything included.</p>
              <ul className="space-y-2.5">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm font-bold text-black">
                    <span className="mt-0.5 w-5 h-5 shrink-0 border-2 border-black flex items-center justify-center text-[11px]" style={{ background: "#a1dfc5" }}>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={SIGNUP}
                className="mt-8 inline-block font-black uppercase tracking-widest text-sm px-8 py-4 border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000]"
                style={{ background: ACCENT, color: "#000" }}
              >
                Set up my restaurant →
              </Link>
            </div>
            <div className="border-2 border-black p-7 md:p-9" style={{ background: "#f4f1fb" }}>
              <div className="inline-block border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-white mb-4">
                Optional add-on
              </div>
              <h3 className="font-black text-xl text-black mb-1">Branded RCS sender</h3>
              <p className="font-black text-black/70 mb-3">$500 / year carrier registration</p>
              <p className="text-sm font-bold text-black/60 leading-relaxed">
                Your restaurant&apos;s name, logo and a verified badge in the message thread itself — instead of a
                bare phone number. Higher open rates, richer replies. We handle the carrier paperwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="border-b-2 border-black scroll-mt-20" style={{ background: "#faf8ff" }}>
        <div className="max-w-[900px] mx-auto px-6 md:px-10 py-16">
          <h2 className="font-black text-3xl md:text-4xl text-black mb-8" style={{ fontFamily: "Tektur, sans-serif" }}>
            Questions owners ask
          </h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <FaqItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
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
              href={SIGNUP}
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
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 text-black font-black transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000]"
              style={{ background: ACCENT }}
            >
              📘 DOCS
            </Link>
            <Link href="/oldprods" className="hover:text-black transition-colors">VOICE &amp; TEXT ORDERING</Link>
            <Link href="/about" className="hover:text-black transition-colors">ABOUT</Link>
            <Link href="/privacy-policy" className="hover:text-black transition-colors">PRIVACY</Link>
            <Link href="/terms-of-service" className="hover:text-black transition-colors">TERMS</Link>
          </div>
          <p className="text-xs font-bold tracking-widest text-black/40">© 2026 BELAN AI</p>
        </div>
      </footer>
    </div>
  );
}
