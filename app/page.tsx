"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
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

const PLANS = [
  { name: "Tier 1", price: "$200", messages: "2,500", overage: "8.0¢", fit: "Around 290 subscribers at two sends a week.", color: "#a4e5f8" },
  { name: "Tier 2", price: "$300", messages: "4,500", overage: "6.7¢", fit: "Around 520 subscribers at two sends a week.", color: ACCENT },
  { name: "Tier 3", price: "$400", messages: "7,000", overage: "5.7¢", fit: "Around 810 subscribers at two sends a week.", color: "#f5dda1" },
];

/* ── POS trust bar — shown directly under the hero ── */
const POS_SYSTEMS = ["Toast", "Square", "Clover", "Lightspeed", "Custom POS setups"];

/* ── done-for-you launch & growth kit — free with every plan, shown as a receipt in pricing ── */
const KIT_GROUPS = [
  {
    name: "Launch & Design Kit",
    cadence: "One-time · $1,250 value",
    color: "#a4e5f8",
    items: [
      { title: "Table tents & counter flyers", img: "table-tents", value: "$350", desc: "Custom-designed with your logo so dine-in guests join your VIP text club." },
      { title: "Done-for-you social opt-in posts", img: "social-posts", value: "$300", desc: "15 branded Instagram Stories and posts, ready to publish. Nothing to edit." },
      { title: "Google Maps video audit", img: "maps-audit", value: "$250", desc: "A personalized 10-minute teardown of your listing: categories, links, photos." },
      { title: "Branded table QR codes", img: "table-qr", value: "$200", desc: "Mapped to your menu and ordering links, one for every table." },
      { title: "DoorDash & Uber Eats bag flyer", img: "bag-flyer", value: "$150", desc: "Turns delivery-app customers into direct repeat diners." },
    ],
  },
  {
    name: "Growth & Reputation Suite",
    cadence: "Every month · $250/mo value",
    color: "#f5dda1",
    items: [
      { title: "10 viral campaign ideas a month", img: "campaign-ideas", value: "$150/mo", desc: "Proven promos and social hooks trending in your exact food category." },
      { title: "1-hour post-visit review booster", img: "review-booster", value: "$100/mo", desc: "An automatic follow-up text that guides happy diners to a Google review." },
    ],
  },
];

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
    q: "What if I don't have a customer phone list or time to design flyers?",
    a: "Most restaurants start from zero. Our team designs your custom table tents, delivery bag flyers, QR codes, and social media opt-in posts for free during onboarding—so your tables and takeout bags build your VIP text list for you automatically.",
  },
  {
    q: "How does the 30-day money-back guarantee work?",
    a: "We don't do free trials because our team builds your custom QR codes, table tents, bag flyers, and Google Maps audit upfront. Instead, start today risk-free: put out your table tents, run at least two text games in your first 30 days, and if you don't see repeat customers coming back, email us for a 100% refund—and keep all your custom designs.",
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

/* ── guarantee seal — a spinning starburst in a colour used nowhere else on the page ── */
const SEAL_COLOR = "#ff5c39";
const SEAL_POINTS = Array.from({ length: 48 }, (_, i) => {
  const r = i % 2 === 0 ? 104 : 92;
  const a = (Math.PI * 2 * i) / 48;
  return `${(110 + r * Math.cos(a)).toFixed(2)},${(110 + r * Math.sin(a)).toFixed(2)}`;
}).join(" ");

function GuaranteeSeal() {
  const reduce = useReducedMotion();
  const spin = reduce ? undefined : { rotate: 360 };
  const spinTransition = { duration: 40, ease: "linear" as const, repeat: Infinity };
  return (
    <motion.div
      id="guarantee"
      role="img"
      aria-label="30-day money-back guarantee"
      className="relative shrink-0 scroll-mt-24 w-[172px] h-[172px] md:w-[216px] md:h-[216px]"
      initial={reduce ? false : { scale: 0, rotate: -45 }}
      whileInView={{ scale: 1, rotate: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 240, damping: 10 }}
      whileHover={{ scale: 1.08 }}
    >
      {/* hard shadow */}
      <div className="absolute inset-0 translate-x-[6px] translate-y-[6px]">
        <motion.svg viewBox="0 0 220 220" className="w-full h-full" animate={spin} transition={spinTransition} aria-hidden>
          <polygon points={SEAL_POINTS} fill="#000" />
        </motion.svg>
      </div>
      <motion.svg viewBox="0 0 220 220" className="absolute inset-0 w-full h-full" animate={spin} transition={spinTransition} aria-hidden>
        <polygon points={SEAL_POINTS} fill={SEAL_COLOR} stroke="#000" strokeWidth={3} strokeLinejoin="round" />
        <circle cx={110} cy={110} r={80} fill="none" stroke="#000" strokeWidth={2} strokeDasharray="5 6" />
      </motion.svg>
      <motion.div
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center text-center text-black"
        style={{ rotate: -8, fontFamily: "Tektur, sans-serif" }}
        animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
        transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
      >
        <span className="font-black leading-none text-[29px] md:text-[37px]">30-DAY</span>
        <span className="font-black leading-tight uppercase text-[13px] md:text-[16px] mt-1">Money-back</span>
        <span className="font-black leading-tight uppercase text-[13px] md:text-[16px]">Guarantee</span>
      </motion.div>
    </motion.div>
  );
}

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
  // freebie image opened full-size (thumbnails live in the pricing receipt)
  const [zoom, setZoom] = useState<{ title: string; img: string } | null>(null);
  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoom(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoom]);

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
            <motion.a
              variants={fadeUp}
              href="#pricing"
              className="inline-block border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-widest mb-5 sm:ml-2 text-black"
              style={{ background: "#a1dfc5" }}
            >
              🎁 $1,500+ setup kit free
            </motion.a>
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
              From $200/location/month · Phone number &amp; 2,500 texts included · Backed by our{" "}
              <a href="#guarantee" className="underline underline-offset-2 hover:text-black transition-colors">
                30-Day Money-Back Guarantee
              </a>
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
                <span className="font-black text-sm text-black">Stack &amp; Smash Burgers</span>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="self-start max-w-[88%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🍔 Trivia Tuesday! What&apos;s the most ordered burger topping in America? A) Cheese B) Bacon C) Onions.
                  Reply with your answer to win 20% off tonight!
                </div>
                <div className="self-end max-w-[60%] border-2 border-black px-3.5 py-2.5 text-[13px] rounded-2xl rounded-br-sm" style={{ background: "#a4e5f8" }}>
                  A
                </div>
                <div className="self-start max-w-[88%] border-2 border-black bg-white px-3.5 py-2.5 text-[13px] leading-relaxed rounded-2xl rounded-bl-sm">
                  🏆 Correct! Tap to claim 20% off (valid tonight): belan.tech/prize/WIN-7K2P
                  <div className="mt-2 border-2 border-black overflow-hidden rounded-lg">
                    <div className="h-14 flex items-center gap-2 px-2" style={{ background: "#3a1a0f" }}>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-base">🍔</div>
                      <div className="leading-tight">
                        <p className="text-[11px] font-black text-white">Stack &amp; Smash Burgers</p>
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

      {/* ── POS trust bar ── */}
      <section aria-label="POS compatibility" className="border-b-2 border-black bg-white">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <p className="text-[11px] font-black uppercase tracking-widest text-black/40 shrink-0">
            Works with your POS
          </p>
          <ul className="flex flex-wrap gap-2">
            {POS_SYSTEMS.map((pos) => (
              <li
                key={pos}
                className="border-2 border-black/15 px-3 py-1 text-xs font-black tracking-wide text-black/60"
              >
                {pos}
              </li>
            ))}
          </ul>
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

      {/* ── Pricing — guarantee badge, plans with the free kit attached, then the kit as a receipt ── */}
      <section id="pricing" className="border-b-2 border-black scroll-mt-20">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 py-14 md:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8 md:mb-10">
            <div>
              <h2 className="font-black text-3xl md:text-5xl text-black mb-2" style={{ fontFamily: "Tektur, sans-serif" }}>
                Simple per-location pricing
              </h2>
              <p className="font-bold text-black/50 max-w-2xl">
                Three plans, priced per location per month. Phone number included. Sends are never blocked.
              </p>
            </div>
            <div className="flex items-center gap-5 lg:flex-row-reverse lg:-my-6">
              <GuaranteeSeal />
              <p className="font-black text-black text-sm md:text-base leading-snug max-w-[190px] lg:text-right">
                Not working? Full refund, and you keep your designs.
              </p>
            </div>
          </div>

          {/* plans — the free kit is attached to every price */}
          <div className="grid md:grid-cols-3 gap-5 mb-5">
            {PLANS.map((plan) => (
              <div key={plan.name} className="border-2 border-black bg-white flex flex-col">
                <div className="p-6 md:p-7 flex flex-col flex-1">
                  <div className="inline-block self-start border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest mb-4" style={{ background: plan.color }}>
                    {plan.name}
                  </div>
                  <div className="flex flex-wrap items-end gap-x-2 mb-2">
                    <span className="font-black text-6xl text-black leading-none" style={{ fontFamily: "Tektur, sans-serif" }}>
                      {plan.price}
                    </span>
                    <span className="font-black text-black/50 mb-1">/ location / month</span>
                  </div>
                  <p className="text-base font-black text-black mb-1">{plan.messages} messages a month included</p>
                  <p className="text-sm font-bold text-black/60 mb-3">{plan.fit}</p>
                  <p className="text-xs font-bold text-black/50 mt-auto">Overage {plan.overage} per message, never blocked</p>
                </div>
                <a
                  href="#launch-kit"
                  className="border-t-2 border-black px-6 md:px-7 py-4 flex items-center justify-between gap-3"
                  style={{ background: "#a1dfc5" }}
                >
                  <span className="font-black text-black leading-tight text-lg md:text-xl">
                    + $1,500 setup kit
                  </span>
                  <span className="shrink-0 border-2 border-black bg-white px-2.5 py-1 font-black text-sm uppercase tracking-widest text-black">
                    Free
                  </span>
                </a>
                <div className="border-t-2 border-black p-4">
                  <Link
                    href={SIGNUP}
                    className="block text-center font-black uppercase tracking-widest text-sm px-6 py-4 border-2 border-black transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#000]"
                    style={{ background: ACCENT, color: "#000" }}
                  >
                    Start with {plan.name} →
                  </Link>
                  <p className="mt-2.5 text-center text-[11px] font-black uppercase tracking-widest text-black/50">
                    30-day money-back guarantee
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* the kit, itemised like a receipt */}
          <div id="launch-kit" className="border-2 border-black bg-white scroll-mt-24 mb-5">
            <div className="border-b-2 border-black px-5 md:px-8 py-5 md:py-6" style={{ background: "#faf8ff" }}>
              <h3 className="font-black text-black leading-tight text-2xl md:text-4xl" style={{ fontFamily: "Tektur, sans-serif" }}>
                Everything we set up for you, free
              </h3>
              <p className="font-bold text-black/60 mt-1.5 text-sm md:text-base">
                No time to set this up? You don&apos;t need any. Our team designs and builds all of it for you on every plan.
              </p>
            </div>
            <div className="grid lg:grid-cols-2">
              {KIT_GROUPS.map((group, gi) => (
                <div key={group.name} className={gi === 0 ? "border-b-2 lg:border-b-0 lg:border-r-2 border-black" : "flex flex-col"}>
                  <div
                    className="border-b-2 border-black px-5 md:px-8 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1"
                    style={{ background: group.color }}
                  >
                    <p className="font-black text-black text-sm md:text-base uppercase tracking-widest">{group.name}</p>
                    <p className="font-black text-black/60 text-[11px] uppercase tracking-widest">{group.cadence}</p>
                  </div>
                  <ul>
                    {group.items.map((item) => (
                      <li
                        key={item.title}
                        className="px-5 md:px-8 py-4 border-b-2 border-black/10 last:border-b-0 flex items-start gap-3 md:gap-4"
                      >
                        <button
                          type="button"
                          onClick={() => setZoom({ title: item.title, img: item.img })}
                          aria-label={`See an example: ${item.title}`}
                          className="group relative shrink-0 w-16 h-16 md:w-24 md:h-24 border-2 border-black overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#000]"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/freebies/${item.img}-thumb.webp`}
                            alt=""
                            width={96}
                            height={96}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 border-l-2 border-t-2 border-black bg-white w-5 h-5 flex items-center justify-center text-[11px] font-black leading-none">
                            ⤢
                          </span>
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-black text-base md:text-lg leading-snug">{item.title}</p>
                          <p className="text-sm font-bold text-black/60 leading-relaxed mt-0.5">{item.desc}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-black text-black/40 line-through decoration-2 text-base md:text-lg leading-snug">
                            {item.value}
                          </p>
                          <p
                            className="inline-block border-2 border-black px-2 py-0.5 text-[11px] font-black uppercase tracking-widest text-black mt-1"
                            style={{ background: "#a1dfc5" }}
                          >
                            Free
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {gi === 1 && (
                    <div
                      className="flex-1 border-t-2 border-black px-5 md:px-8 py-7 flex flex-col justify-center gap-4"
                      style={{ background: ACCENT }}
                    >
                      <div className="flex items-end gap-6 sm:gap-10">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-black/60 mb-1">Total value</p>
                          <p className="font-black text-black/50 line-through decoration-[3px] leading-none text-4xl md:text-5xl" style={{ fontFamily: "Tektur, sans-serif" }}>
                            $1,500+
                          </p>
                        </div>
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-widest text-black/60 mb-1">You pay</p>
                          <p className="font-black text-black leading-none text-6xl md:text-7xl" style={{ fontFamily: "Tektur, sans-serif" }}>
                            $0
                          </p>
                        </div>
                      </div>
                      <p className="font-black text-black text-sm md:text-base leading-snug">
                        Total Bonus Value Included Free: $1,500+ in your first month alone — yours free when you activate any plan.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* the software + discounts + add-on */}
          <div className="border-2 border-black bg-white p-5 md:p-8 mb-5">
            <p className="font-black text-black text-lg md:text-xl mb-4">Plus the full platform on every plan</p>
            <ul className="grid sm:grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-3">
              {PLAN_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm md:text-base font-bold text-black">
                  <span className="mt-0.5 w-5 h-5 shrink-0 border-2 border-black flex items-center justify-center text-[11px]" style={{ background: "#a1dfc5" }}>
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            <div className="border-2 border-black p-5 md:p-6" style={{ background: "#faf8ff" }}>
              <p className="font-black text-black text-lg mb-1">More locations, lower price</p>
              <p className="text-sm font-bold text-black/60">2 locations: 10% off every location. 3 or more: 20% off every location.</p>
            </div>
            <div className="border-2 border-black p-5 md:p-6" style={{ background: "#faf8ff" }}>
              <p className="font-black text-black text-lg mb-1">Commit longer, pay less</p>
              <p className="text-sm font-bold text-black/60">3 months at list. 6 months: $100 off per location. 12 months: $200 off per location.</p>
            </div>
            <div className="border-2 border-black p-5 md:p-6 md:col-span-2 xl:col-span-1" style={{ background: "#f4f1fb" }}>
              <div className="inline-block border-2 border-black px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-white mb-3">
                Optional add-on
              </div>
              <h3 className="font-black text-lg text-black">Branded RCS sender</h3>
              <p className="font-black text-black/70 text-sm mb-2">$500 one-time setup + $200 / year</p>
              <p className="text-sm font-bold text-black/60 leading-relaxed">
                Your restaurant&apos;s name, logo and a verified badge in the message thread itself — instead of a
                bare phone number. We handle the carrier paperwork.
              </p>
            </div>
          </div>
          <div className="mt-6">
            <Link href="/marketing-terms" className="text-xs font-bold tracking-widest text-black/60 hover:text-black underline underline-offset-4">
              ORDER FORM &amp; SERVICE TERMS
            </Link>
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

      {/* ── Freebie image viewer ── */}
      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoom.title}
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[560px] border-2 border-black bg-white shadow-[6px_6px_0px_#000]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/freebies/${zoom.img}.webp`}
              alt={`Example: ${zoom.title} made for our demo restaurant`}
              width={1000}
              height={1000}
              className="block w-full h-auto max-h-[70vh] object-cover border-b-2 border-black"
            />
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-black text-black text-base md:text-lg leading-snug">{zoom.title}</p>
                <p className="text-xs font-bold text-black/50 mt-0.5">Example made for our demo restaurant.</p>
              </div>
              <button
                type="button"
                autoFocus
                onClick={() => setZoom(null)}
                className="shrink-0 border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

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
