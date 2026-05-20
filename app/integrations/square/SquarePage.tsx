"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";
import SiteNav from "@/components/SiteNav";

const ease = [0.22, 1, 0.36, 1] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease },
  }),
};

const listItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease },
  }),
};

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease },
  }),
};

const CARD_HOVER = {
  whileHover: { boxShadow: "inset 0 0 0 3px #000" },
  transition: { type: "spring" as const, stiffness: 400, damping: 20 },
};


const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Does Belan AI work with Square POS?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Belan AI integrates directly with Square via the Square API. Your menu syncs automatically and orders fire to your Square system the moment a customer confirms and pays — no manual entry required.",
      },
    },
    {
      "@type": "Question",
      name: "Which Square plan do I need to use Belan AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI connects to Square through Square's standard API access, available on Square for Restaurants plans. Your Belan AI subscription ($200/month) covers the integration — no additional Square add-on is required.",
      },
    },
    {
      "@type": "Question",
      name: "How long does it take to connect Belan AI to Square?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connecting Belan AI to Square takes about 5 minutes. You authorize the Square connection in your Belan AI dashboard, and your full menu — items, modifiers, prices — syncs automatically.",
      },
    },
  ],
};

const syncItems = [
  "Menu items & descriptions",
  "Prices — updated in real time",
  "Modifier groups & options",
  "Item availability (86 detection)",
  "Orders → Square ticket queue",
  "Payment status → Square",
];

const setupSteps = [
  { n: "01", t: "Create your Belan AI account", d: "Sign up at belan.tech — no credit card required." },
  { n: "02", t: "Connect Square", d: "Click 'Connect POS', select Square, and authorize the connection. Your menu syncs in under a minute." },
  { n: "03", t: "Set your voice & rules", d: "Pick a voice, write your greeting, set upsell rules. Takes 5 minutes." },
  { n: "04", t: "Go live", d: "Forward your restaurant number to your Belan AI line. The AI starts answering immediately." },
];

const faqItems = [
  {
    q: "Does Belan AI work with Square POS?",
    a: "Yes. Belan AI integrates directly with Square via the Square API. Your menu syncs automatically and orders fire to your Square system the moment a customer confirms and pays — no manual entry required.",
  },
  {
    q: "Which Square plan do I need?",
    a: "Belan AI connects to Square through Square's standard API access, available on Square for Restaurants plans. Your Belan AI subscription ($200/month) covers the integration — no additional Square add-on is required.",
  },
  {
    q: "How long does setup take?",
    a: "Connecting Belan AI to Square takes about 5 minutes. You authorize the connection in your Belan AI dashboard, and your full menu — items, modifiers, prices — syncs automatically.",
  },
];

const howItWorksCards = [
  {
    num: "01",
    bg: "#e8e8e8",
    title: "Customer calls or texts",
    body: "Belan AI picks up on the first ring and takes the full order — items, modifications, allergy requests — in natural conversation.",
    img: "/capybaraPics/scootertalkingonphone.svg",
    imgAlt: "Customer placing a phone order via Belan AI voice ordering",
  },
  {
    num: "02",
    bg: "#d4d4d4",
    title: "AI confirms & collects payment",
    body: "The order is read back for accuracy, then a payment link is texted to the customer. 99%+ order accuracy, every time.",
    img: "/capybaraPics/dishwashertexting.svg",
    imgAlt: "Restaurant staff confirming order and collecting payment via text",
  },
  {
    num: "03",
    bg: "#f0f0f0",
    title: "Fires straight to Square",
    body: "The moment payment clears, Belan AI fires the order to your Square POS as a standard ticket. Your kitchen sees it instantly.",
    img: "/capybaraPics/deliverydudeonscoot.svg",
    imgAlt: "Restaurant order automatically sent to Square POS",
  },
];

export default function SquarePage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const statementRef = useRef<HTMLDivElement>(null);
  const statementInView = useInView(statementRef, { once: true, margin: "-80px" });

  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: "-60px" });

  const syncRef = useRef<HTMLDivElement>(null);
  const syncInView = useInView(syncRef, { once: true, margin: "-60px" });

  const stepsRef = useRef<HTMLOListElement>(null);
  const stepsInView = useInView(stepsRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-screen" style={{ fontFamily: "Tektur, sans-serif" }}>
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          zIndex: 0,
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <SiteNav />

      {/* Hero */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-12 md:py-16 overflow-hidden" style={{ background: "#e8e8e8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              {/* Logo lockup */}
              <motion.div
                className="flex items-center gap-4 mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/BelanLogo.png" alt="Belan AI" width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-black object-cover bg-white" />
                <div className="text-2xl font-black text-black">+</div>
                <div className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-black bg-white flex items-center justify-center p-1.5 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/integrations/SquareLogo.png" alt="Square POS" width={56} height={56} className="w-full h-full object-contain" />
                </div>
              </motion.div>

              <motion.span
                className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4 bg-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease }}
              >
                INTEGRATION
              </motion.span>

              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl font-black text-black leading-tight mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease }}
              >
                Belan AI<br />loves Square.
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg font-bold text-black/70 leading-relaxed max-w-md"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease }}
              >
                Every phone call, every text order — answered by AI and fired straight into your Square POS. Automatically. No staff needed.
              </motion.p>
            </div>

            {/* Capybara — floating */}
            <div className="flex-shrink-0 flex justify-center">
              <motion.img
                src="/capybaraPics/insuittexting.svg"
                alt="Restaurant manager using Belan AI voice ordering connected to Square POS"
                width={280}
                height={280}
                className="w-40 sm:w-56 md:w-64 h-auto"
                animate={{ y: [0, -14, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Big statement */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#000" }}>
        <div className="max-w-5xl mx-auto text-center" ref={statementRef}>
          <motion.p
            className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={statementInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease }}
          >
            Customer calls.<br />
            <span style={{ color: "#d4d4d4" }}>Square prints.</span><br />
            You do nothing.
          </motion.p>
        </div>
      </section>

      {/* How it works — 3 punchy cards */}
      <section className="px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-2xl sm:text-3xl md:text-4xl font-black text-black mb-10 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease }}
          >
            How Belan AI + Square works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-2 border-black" ref={cardsRef}>
            {howItWorksCards.map(({ num, bg, title, body, img, imgAlt }, i) => (
              <motion.div
                key={num}
                className="border-b-2 md:border-b-0 md:border-r-2 last:border-0 border-black flex flex-col overflow-hidden relative"
                style={{
                  background: hoveredCard === num ? bg : "rgba(255,255,255,0.92)",
                  transition: "background 0.2s ease",
                }}
                variants={cardVariants}
                custom={i}
                initial="hidden"
                animate={cardsInView ? "visible" : "hidden"}
                {...CARD_HOVER}
                onHoverStart={() => setHoveredCard(num)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <div className="p-6 sm:p-8 flex-1" style={{ position: "relative", zIndex: 1 }}>
                  <div className="text-4xl font-black text-black/20 mb-3">{num}</div>
                  <div className="font-black text-lg sm:text-xl text-black mb-2 leading-tight">{title}</div>
                  <p className="text-sm font-bold text-black/70 leading-relaxed">{body}</p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={imgAlt} width={120} height={120} className="w-28 h-28 object-contain self-end mr-4 mb-2" style={{ position: "relative", zIndex: 1 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What syncs */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            <div className="flex-1">
              <motion.span
                className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-4 bg-black text-white"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                REAL-TIME SYNC
              </motion.span>
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.08, ease }}
              >
                Your Square menu.<br />Always in sync.
              </motion.h2>
              <motion.p
                className="text-sm sm:text-base font-bold text-black/60 leading-relaxed mb-6"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.14, ease }}
              >
                86 an item in Square? Belan AI stops offering it immediately. Update a price? The AI charges the new price on the next call. No manual updates ever.
              </motion.p>
              <div className="flex flex-col gap-2" ref={syncRef}>
                {syncItems.map((item, i) => (
                  <motion.div
                    key={item}
                    className="flex items-center gap-3 py-2 border-b border-black/10 last:border-0"
                    variants={listItemVariants}
                    custom={i}
                    initial="hidden"
                    animate={syncInView ? "visible" : "hidden"}
                  >
                    <div className="w-5 h-5 border-2 border-black flex items-center justify-center flex-shrink-0 bg-black">
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="font-bold text-sm text-black">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            {/* Square logo + capybara stack */}
            <div className="flex-shrink-0 flex flex-col items-center gap-4 mx-auto md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/integrations/SquareLogo.png" alt="Square POS logo" width={120} height={120} className="w-24 h-24 border-2 border-black p-3 bg-white object-contain" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capybaraPics/sittingoncrate.svg" alt="Restaurant owner reviewing Square POS orders with Belan AI" width={180} height={180} className="w-40 h-40 object-contain" />
            </div>
          </div>
        </div>
      </section>

      {/* Setup steps */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#e8e8e8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex-1">
              <motion.h2
                className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, ease }}
              >
                Up in 20 minutes.
              </motion.h2>
              <motion.p
                className="text-sm sm:text-base font-bold text-black/60 mb-8"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.08, ease }}
              >
                No IT. No hardware. No headaches.
              </motion.p>
              <ol className="flex flex-col gap-5" ref={stepsRef}>
                {setupSteps.map(({ n, t, d }, i) => (
                  <motion.li
                    key={n}
                    className="flex gap-4 items-start"
                    variants={stepVariants}
                    custom={i}
                    initial="hidden"
                    animate={stepsInView ? "visible" : "hidden"}
                  >
                    <span className="border-2 border-black w-10 h-10 flex-shrink-0 flex items-center justify-center font-black text-sm bg-white">
                      {n}
                    </span>
                    <div>
                      <div className="font-black text-sm sm:text-base text-black mb-0.5">{t}</div>
                      <div className="text-sm text-black/60 font-bold leading-relaxed">{d}</div>
                    </div>
                  </motion.li>
                ))}
              </ol>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/capybaraPics/readingnews.svg" alt="Restaurant owner reviewing Square POS setup guide with Belan AI" width={220} height={220} className="w-36 md:w-52 h-auto self-center md:self-end flex-shrink-0 mx-auto md:mx-0" />
          </div>
        </div>
      </section>

      {/* FAQ — interactive accordion */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-2xl sm:text-3xl font-black text-black mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, ease }}
          >
            Square integration FAQ
          </motion.h2>
          <div className="border-2 border-black bg-white">
            {faqItems.map(({ q, a }, idx) => (
              <div key={q} className="border-b-2 last:border-b-0 border-black">
                <button
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                  onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
                  aria-expanded={openIdx === idx}
                >
                  <span className="font-black text-sm sm:text-base text-black">{q}</span>
                  <motion.svg
                    className="w-4 h-4 flex-shrink-0 text-black"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    viewBox="0 0 24 24"
                    animate={{ rotate: openIdx === idx ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </motion.svg>
                </button>
                <AnimatePresence initial={false}>
                  {openIdx === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm sm:text-base text-black/60 font-bold leading-relaxed">
                        {a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#3d4348" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-3"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease }}
            >
              Ready to connect<br />Belan AI to Square?
            </motion.h2>
            <motion.p
              className="text-sm sm:text-base font-bold text-white/60 mb-6"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
            >
              $200/month flat. Setup in 20 minutes. No per-order fees.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-3"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: 0.18, ease }}
            >
              <motion.a
                href="https://calendar.app.google/uCwfd2qfNtjJMSca9"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-black font-bold text-xs px-8 py-3 border-2 border-white tracking-wide text-center"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                BOOK A DEMO →
              </motion.a>
            </motion.div>
          </div>
          {/* CTA capybara — floating */}
          <motion.img
            src="/capybaraPics/scooterguytakingpic.svg"
            alt="Restaurant staff celebrating with Square POS and Belan AI"
            width={200}
            height={200}
            className="w-32 md:w-48 h-auto flex-shrink-0 mx-auto md:mx-0"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </section>

      {/* Footer links */}
      <div className="border-t-2 border-black px-4 sm:px-8 py-5 flex flex-wrap gap-4 bg-white">
        <Link href="/integrations/clover" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Clover POS integration →</Link>
        <Link href="/integrations/toast" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Toast POS integration →</Link>
        <Link href="/integrations" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">All POS integrations →</Link>
        <Link href="/how-it-works" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">How restaurant voice AI works →</Link>
        <Link href="/" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Belan AI home →</Link>
      </div>
    </div>
  );
}
