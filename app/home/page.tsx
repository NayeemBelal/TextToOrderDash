"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, AnimatePresence, useInView } from "framer-motion";

/* ── animation config ── */
const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45 } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

/* ── stat counter ── */
function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const startAnim = () => {
    if (started.current) return;
    started.current = true;
    let start: number | null = null;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  return { count, startAnim };
}

function StatPill({
  value, prefix = "", suffix = "", label, color, textWhite = false,
}: {
  value: number; prefix?: string; suffix?: string; label: string; color: string; textWhite?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { count, startAnim } = useCountUp(value, 1800);
  if (inView) startAnim();
  const tc = textWhite ? "text-white" : "text-black";
  return (
    <motion.div ref={ref} variants={scaleIn}
      className="flex flex-col items-center gap-1 px-8 py-5 border-2 border-black"
      style={{ background: color }}
      whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 20 } }}>
      <div className={`text-4xl font-black ${tc}`} style={{ fontFamily: "Tektur, sans-serif" }}>
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className={`text-xs font-bold uppercase tracking-widest ${tc}`}>{label}</div>
    </motion.div>
  );
}

/* ── scroll reveal section ── */
function RevealSection({ children, className, style, id }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section ref={ref} id={id} className={className} style={style}
      variants={stagger} initial="hidden" animate={inView ? "visible" : "hidden"}>
      {children}
    </motion.section>
  );
}

/* ── rotating capybara (desktop only) ── */
const CAPY_SLOTS = [
  { img: "baristatalkingonphone.svg", text: "Answers every call — even during dinner rush" },
  { img: "pizzatalkingonphone.svg", text: "No hold music. No missed calls. Just orders." },
  { img: "waiter_explaining_the_cost_of_a_menu_item.svg", text: "Track revenue, calls, and orders in real-time" },
  { img: "waiter_recommending_from_menu.svg", text: "AI suggests the right item at the right moment" },
  { img: "runningwithpizza.svg", text: "Orders go straight to your kitchen, instantly" },
  { img: "waiter_serving_a_drink_really_fast.svg", text: "Never miss an order — Belan AI is always ready" },
];

function RotatingCapybara() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx((i) => (i + 1) % CAPY_SLOTS.length), 7000);
    return () => clearInterval(iv);
  }, []);
  const slot = CAPY_SLOTS[idx];
  return (
    <div className="flex flex-col items-center justify-center relative">
      <AnimatePresence mode="wait">
        <motion.div key={idx} className="flex flex-col items-center gap-1"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.5, ease }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/capybaraPics/${encodeURIComponent(slot.img)}`} alt=""
            className="h-72 xl:h-96 2xl:h-[28rem] w-auto object-contain -mb-16" />
          <p className="text-center font-black text-xl xl:text-2xl 2xl:text-3xl text-black max-w-sm xl:max-w-md">
            {slot.text}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── product cards ── */
const PRODUCTS = [
  {
    color: "#a4e5f8", name: "Voice AI", tagline: "Never miss a call",
    desc: "AI answers, takes orders, upsells.",
    bullets: ["Unlimited concurrent calls", "Custom greetings & upsells", "FAQ handling built-in"],
    img: "talkingonphone.svg",
  },
  {
    color: "#c6a591", name: "Text AI", tagline: "Order by SMS",
    desc: "No app. No login. Just text.",
    bullets: ["Same number as voice", "Unlimited messages", "Auto payment link via SMS"],
    img: "baristatexting.svg",
  },
  {
    color: "#a1dfc5", name: "Dashboard", tagline: "See everything",
    desc: "Revenue and orders, live.",
    bullets: ["Live revenue tracking", "Top sellers & trends", "Call & order history"],
    img: "scooterguytalkingonphone.svg",
  },
  {
    color: "#c4b5fd", name: "Marketing", tagline: "Fill slow nights",
    desc: "SMS blasts to past customers.",
    bullets: ["One-click SMS blasts", "Target past customers", "Track campaign results"],
    img: "runningupstairs.svg", imgSize: "h-28 xl:h-36 2xl:h-44",
  },
  {
    color: "#fbc8d4", name: "Sales AI", tagline: "Ask your data",
    desc: "Chat with your own numbers.",
    bullets: ["Natural language queries", "Revenue insights on demand", "Menu optimization tips"],
    img: "waitertakingselfie.svg",
  },
];

function ProductCards() {
  const voice = PRODUCTS[0];
  const rest = PRODUCTS.slice(1);
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <>
      {/* ── Mobile: stacked single-column ── */}
      <div className="md:hidden flex flex-col gap-0 border-2 border-black">
        {PRODUCTS.map(({ color, name, tagline, desc, bullets, img }) => (
          <div key={name} className="flex items-center gap-0 border-b-2 last:border-b-0 border-black"
            style={{ background: color }}>
            <div className="flex-1 p-5">
              <div className="font-black text-xl text-black leading-tight">{name}</div>
              <div className="text-xs font-bold text-black/50 uppercase tracking-widest mt-0.5 mb-2">{tagline}</div>
              <p className="text-sm font-bold text-black/70 leading-relaxed mb-3">{desc}</p>
              <ul className="flex flex-col gap-1.5">
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs font-bold text-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/capybaraPics/${encodeURIComponent(img)}`} alt=""
              className="h-28 w-auto object-contain flex-shrink-0 pr-3" />
          </div>
        ))}
      </div>

      {/* ── Desktop: bento grid ── */}
      <div className="hidden md:grid grid-cols-3 gap-0">
        {/* Voice AI — hero card, spans 2 rows */}
        <motion.div
          className="row-span-2 border-2 border-black p-6 xl:p-10 flex flex-col justify-between overflow-hidden relative"
          style={{ background: voice.color }}
          whileHover={{ y: -4, boxShadow: "4px 4px 0px #000" }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}>
          <div className="flex flex-col gap-4">
            <div>
              <div className="font-black text-3xl xl:text-4xl 2xl:text-5xl text-black leading-tight">{voice.name}</div>
              <div className="text-sm xl:text-base font-bold text-black/50 uppercase tracking-widest mt-1">{voice.tagline}</div>
            </div>
            <p className="text-sm xl:text-base font-bold text-black/70 leading-relaxed">{voice.desc}</p>
            <ul className="flex flex-col gap-2 mt-1">
              {voice.bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm xl:text-base font-bold text-black">
                  <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/capybaraPics/${encodeURIComponent(voice.img)}`} alt=""
            className="h-48 xl:h-64 2xl:h-80 w-auto object-contain self-end -mb-8" />
        </motion.div>

        {/* remaining 4 cards */}
        {rest.map(({ color, name, tagline, desc, bullets, img, imgSize }) => {
          const isHovered = hovered === name;
          return (
            <motion.div key={name}
              className="border-2 border-black -ml-[2px] -mt-[2px] p-5 xl:p-7 flex flex-col gap-3 overflow-hidden relative"
              style={{ background: isHovered ? color : "rgba(255,255,255,0.85)", transition: "background 0.2s ease" }}
              whileHover={{ y: -4, boxShadow: "4px 4px 0px #000" }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              onHoverStart={() => setHovered(name)}
              onHoverEnd={() => setHovered(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/capybaraPics/${encodeURIComponent(img)}`} alt=""
                className={`absolute bottom-0 right-0 w-auto object-contain pointer-events-none opacity-90 ${imgSize ?? "h-36 xl:h-44 2xl:h-52"}`}
                style={{ zIndex: 0 }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div className="font-black text-lg xl:text-xl 2xl:text-2xl text-black leading-tight">{name}</div>
                <div className="text-xs xl:text-sm font-bold text-black/40 uppercase tracking-widest mt-0.5">{tagline}</div>
              </div>
              <p className="text-sm xl:text-base font-bold text-black/60 leading-relaxed" style={{ position: "relative", zIndex: 1 }}>{desc}</p>
              <ul className="flex flex-col gap-1.5" style={{ position: "relative", zIndex: 1 }}>
                {bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2 text-xs xl:text-sm font-bold text-black/70">
                    <span className="w-1 h-1 rounded-full bg-black/40 flex-shrink-0" />{b}
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

/* ── sandbox ── */
interface MenuItem {
  id: number;
  name: string;
  price: string;
}

function buildConversation(greeting: string, items: MenuItem[]) {
  const firstItem = items[0] ?? { name: "a Latte", price: "4.50" };
  return [
    { role: "ai" as const, text: greeting || "Hi! Welcome to our restaurant. What can I get you today?" },
    { role: "customer" as const, text: `I'd like a ${firstItem.name} please` },
    { role: "ai" as const, text: `Perfect! ${firstItem.name} ($${firstItem.price}) added. Anything else?` },
    { role: "customer" as const, text: "No thanks, ready to checkout" },
    { role: "ai" as const, text: "Great! I'll send you a payment link via SMS right now 📱" },
  ];
}

const SALES_RESPONSES: { match: RegExp; reply: string }[] = [
  { match: /classic smash|smashburger/i, reply: "You sold 47 Classic Smashburgers last Thursday — up 12% from the week before. It was your #1 item that day." },
  { match: /double stack/i, reply: "34 Double Stacks sold last Thursday. It's consistently your #2 seller on weekday evenings." },
  { match: /chicken/i, reply: "The Crispy Chicken Sandwich moved 28 units last Thursday, mostly between 12–2pm during the lunch rush." },
  { match: /fries|loaded/i, reply: "Loaded Fries were ordered with 68% of all burgers last Thursday — your best-performing upsell." },
  { match: /shake|vanilla/i, reply: "Vanilla Shakes sold 19 units. Shake sales spike on Fridays — consider a weekend promo." },
  { match: /revenue|sales|how much|total/i, reply: "Total revenue last Thursday was $1,847. Dinner (5–9pm) drove 61% of that — your strongest window." },
  { match: /best.?sell|top|popular/i, reply: "Your top 3 last Thursday: Classic Smashburger (47), Double Stack (34), Crispy Chicken (28)." },
  { match: /slow|quiet|dead|worst/i, reply: "Your slowest window is 2–4pm on weekdays — averaging only 4 orders/hour. A happy hour promo could help." },
  { match: /busy|rush|peak|when/i, reply: "Peak hours are 12–1pm and 6–8pm. Friday dinner is your busiest single window of the week." },
  { match: /last week|this week|weekly/i, reply: "Last week's total: $11,240 across 892 orders. That's up 8% from the previous week." },
];

function getSalesReply(input: string): string {
  const match = SALES_RESPONSES.find((r) => r.match.test(input));
  return match?.reply ?? "Based on your data: orders are trending up 9% week-over-week, with burgers driving 74% of revenue. Want me to dig into a specific item?";
}

function SandboxSection() {
  const [activeTab, setActiveTab] = useState<"demo" | "sales" | "marketing">("demo");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDropdownOpen = () => {
    if (!dropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ position: "fixed", top: rect.bottom, left: rect.left, width: rect.width, zIndex: 9999 });
    }
    setDropdownOpen((o) => !o);
  };

  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hey! I'm your Sales AI. Ask me anything about Stack & Smash Burgers — revenue, top sellers, slow periods, you name it." },
  ]);

  const PROMOS = [
    { id: "smash", label: "Classic Smashburger — $2 off", target: "Customers who ordered it before", count: 142, segment: "Repeat burger buyers" },
    { id: "chicken", label: "Crispy Chicken — Buy 1 Get 1", target: "Customers who never tried chicken", count: 89, segment: "Burger-only customers" },
    { id: "shake", label: "Free Shake with any combo", target: "High-spend customers ($30+)", count: 67, segment: "Top spenders" },
    { id: "happyhour", label: "Happy Hour: Fries for $2", target: "Customers active 2–5pm", count: 54, segment: "Afternoon regulars" },
    { id: "lapsed", label: "We miss you — 20% off", target: "Customers inactive 30+ days", count: 203, segment: "Lapsed customers" },
  ];
  const [selectedPromo, setSelectedPromo] = useState(PROMOS[0].id);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const promo = PROMOS.find((p) => p.id === selectedPromo)!;
  const smsPreview = `Hey! ${promo.label.split("—")[0].trim()} is on at Stack & Smash Burgers. ${promo.label.includes("off") ? "Use code BELAN at checkout." : promo.label.includes("Get 1") ? "Show this text when you order." : "Tonight only."} Reply STOP to opt out.`;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1800);
  };
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    const reply = getSalesReply(userMsg);
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }, { role: "ai", text: reply }]);
    setChatInput("");
    setTimeout(() => {
      if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, 100);
  };

  const TAB_LABELS = { demo: "VOICE & TEXT", sales: "SALES AI", marketing: "MARKETING" };

  return (
    <RevealSection id="sandbox" className="py-16 md:py-20 xl:py-32 px-4 sm:px-8 md:px-16 xl:px-24 2xl:px-32"
      style={{ position: "relative", zIndex: 1 }}>
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto">
        <motion.div variants={fadeUp} className="mb-8 md:mb-10 xl:mb-14 flex items-start gap-4">
          <div className="flex-1">
            <div className="inline-block border-2 border-black px-3 py-1.5 mb-3 text-xs md:text-sm xl:text-base font-bold"
              style={{ background: "#e01d5a", color: "white", transform: "rotate(-1deg)" }}>
              LIVE DEMO
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-black text-black leading-tight">
              Hear it for yourself.
              <br />
              <span style={{ color: "#ecb32e" }}>Call or text — right now.</span>
            </h2>
          </div>
          {/* Mobile decorative capybara */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capybaraPics/dishwashertalkingonphone.svg" alt=""
            className="md:hidden h-24 w-auto object-contain flex-shrink-0 self-end" />
        </motion.div>

        {/* Mobile: custom dropdown selector */}
        <motion.div variants={fadeIn} className="md:hidden mb-6">
          <button
            ref={triggerRef}
            type="button"
            onClick={handleDropdownOpen}
            className="w-full flex items-center justify-between px-4 py-3 border-2 border-black bg-white font-bold text-sm tracking-widest"
          >
            <span>{TAB_LABELS[activeTab]}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && typeof window !== "undefined" && createPortal(
            <div ref={dropdownRef} style={dropdownStyle} className="border-2 border-t-0 border-black bg-white shadow-[4px_4px_0px_#000] overflow-hidden">
              {(["demo", "sales", "marketing"] as const).map((tab) => {
                const isSelected = activeTab === tab;
                return (
                  <div
                    key={tab}
                    onClick={() => { setActiveTab(tab); setDropdownOpen(false); }}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b-2 border-black last:border-b-0 transition-colors ${isSelected ? "bg-black text-white" : "bg-white hover:bg-gray-50"}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${isSelected ? "bg-white border-white" : "border-black"}`} />
                    <span className="font-bold text-sm tracking-widest">{TAB_LABELS[tab]}</span>
                  </div>
                );
              })}
            </div>,
            document.body
          )}
        </motion.div>

        {/* Desktop: tab buttons */}
        <motion.div variants={fadeIn} className="hidden md:inline-flex gap-0 mb-8 xl:mb-10 border-2 border-black">
          {(["demo", "sales", "marketing"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-6 xl:px-8 py-3 xl:py-4 text-sm xl:text-base font-bold tracking-widest transition-colors"
              style={{ background: activeTab === tab ? "#000" : "rgba(255,255,255,0.85)", color: activeTab === tab ? "#fff" : "#000" }}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {activeTab === "demo" ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capybaraPics/dishwashertalkingonphone.svg" alt=""
                className="hidden lg:block absolute -right-24 xl:-right-32 bottom-0 h-72 xl:h-80 2xl:h-96 w-auto object-contain pointer-events-none"
                style={{ zIndex: 2 }} />
              <motion.div key="demo" variants={fadeIn}
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease }}
                className="border-2 border-black" style={{ background: "rgba(255,255,255,0.75)" }}>

                {/* Mobile layout: phone number first, menu below */}
                <div className="md:hidden flex flex-col">
                  {/* Phone number */}
                  <div className="p-5 border-b-2 border-black flex flex-col items-center text-center gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Call or text this number</p>
                      <a href="tel:+18005550123"
                        className="block text-4xl font-black text-black tracking-tight leading-none border-b-4 border-black pb-1 hover:text-[#0066cc] transition-colors"
                        style={{ fontFamily: "Tektur, sans-serif" }}>
                        (800) 555-0123
                      </a>
                      <p className="text-xs font-bold text-black/50 mt-3">Same AI handles calls and texts — one number.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs font-bold text-black/50 uppercase tracking-widest">Live now · 24/7</span>
                    </div>
                  </div>
                  {/* Menu info */}
                  <div className="p-5 flex flex-col gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1">Demo restaurant</p>
                      <h3 className="text-lg font-black text-black">Stack & Smash Burgers</h3>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Menu highlights</p>
                      <div className="grid grid-cols-2 gap-1">
                        {[{ name: "Classic Smashburger", price: "10.99" }, { name: "Double Stack", price: "13.99" }, { name: "Crispy Chicken", price: "11.49" }, { name: "Loaded Fries", price: "5.99" }].map((item) => (
                          <div key={item.name} className="flex items-center justify-between px-2 py-1.5 border border-black text-xs"
                            style={{ background: "rgba(255,255,255,0.9)" }}>
                            <span className="font-bold truncate mr-1">{item.name}</span>
                            <span className="font-black flex-shrink-0">${item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Try saying</p>
                      <div className="flex flex-col gap-1">
                        {['"I\'d like a Double Stack and Fries"', '"What comes on the Crispy Chicken?"'].map((q) => (
                          <div key={q} className="text-xs font-bold text-black/60 px-3 py-1.5 border border-black/20"
                            style={{ background: "#f5dda1" }}>{q}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop layout: left menu, right phone */}
                <div className="hidden md:grid md:grid-cols-5 gap-0">
                  <div className="md:col-span-2 p-6 xl:p-8 border-r-2 border-black flex flex-col gap-5">
                    <div>
                      <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Demo restaurant</p>
                      <h3 className="text-2xl xl:text-3xl font-black text-black leading-tight">Stack & Smash Burgers</h3>
                    </div>
                    <div>
                      <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Menu highlights</p>
                      <div className="flex flex-col gap-1">
                        {[{ name: "Classic Smashburger", price: "10.99" }, { name: "Double Stack", price: "13.99" }, { name: "Crispy Chicken Sandwich", price: "11.49" }, { name: "Loaded Fries", price: "5.99" }, { name: "Vanilla Shake", price: "4.99" }].map((item) => (
                          <div key={item.name} className="flex items-center justify-between px-3 py-1.5 border border-black text-sm xl:text-base"
                            style={{ background: "rgba(255,255,255,0.9)" }}>
                            <span className="font-bold">{item.name}</span>
                            <span className="font-black text-xs xl:text-sm">${item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-2">Try asking or ordering</p>
                      <div className="flex flex-col gap-1.5">
                        {['"I\'d like a Double Stack and Loaded Fries"', '"What comes on the Crispy Chicken?"', '"Do you have any combos?"', '"What time do you close?"'].map((q) => (
                          <div key={q} className="text-xs xl:text-sm font-bold text-black/60 px-3 py-1.5 border border-black/20"
                            style={{ background: "#f5dda1" }}>{q}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-3 p-6 xl:p-10 flex items-center justify-center">
                    <div className="flex flex-col items-center text-center gap-6 py-4">
                      <div>
                        <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-3">Call or text this number</p>
                        <a href="tel:+18005550123"
                          className="block text-5xl xl:text-6xl 2xl:text-7xl font-black text-black tracking-tight leading-none border-b-4 border-black pb-1 hover:text-[#0066cc] transition-colors"
                          style={{ fontFamily: "Tektur, sans-serif" }}>
                          (800) 555-0123
                        </a>
                        <p className="text-sm xl:text-base font-bold text-black/50 mt-4 max-w-sm xl:max-w-md">
                          Call to place a voice order or send a text — the same AI handles both on the same number.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs xl:text-sm font-bold text-black/50 uppercase tracking-widest">Live now · Available 24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

          ) : activeTab === "sales" ? (
            <motion.div key="sales"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
              className="border-2 border-black" style={{ background: "rgba(255,255,255,0.75)" }}>

              {/* Mobile: chat first, suggestions below */}
              <div className="md:hidden flex flex-col">
                <div className="border-b-2 border-black">
                  <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-black">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sales AI · Stack & Smash</span>
                  </div>
                  <div ref={chatScrollRef} className="h-56 overflow-y-auto p-4 flex flex-col gap-3">
                    {chatHistory.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[85%] px-3 py-2 text-xs font-bold border-2 border-black"
                          style={{ background: msg.role === "ai" ? "#ecb32e" : "#000", color: msg.role === "ai" ? "#000" : "#fff" }}>
                          {msg.role === "ai" && <span className="text-[10px] font-black block mb-1 opacity-60">SALES AI</span>}
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t-2 border-black flex">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ask about your sales data..."
                      className="flex-1 px-3 py-2.5 text-sm font-bold outline-none bg-transparent" />
                    <button type="button" onClick={sendMessage}
                      className="px-4 py-2.5 text-xs font-black bg-black text-white border-l-2 border-black hover:bg-[#ecb32e] hover:text-black transition-colors">
                      ASK
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-2">Try asking</p>
                  <div className="flex flex-col gap-1.5">
                    {["How many Classic Smashburgers did I sell?", "What was my revenue last week?", "When is my slowest time?"].map((q) => (
                      <button key={q} onClick={() => setChatInput(q)}
                        className="text-left text-xs font-bold text-black/70 px-3 py-2 border border-black/20 hover:border-black hover:bg-[#f5dda1] transition-colors"
                        style={{ background: "rgba(255,255,255,0.8)" }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop: side by side */}
              <div className="hidden md:grid md:grid-cols-5">
                <div className="md:col-span-2 p-6 xl:p-8 border-r-2 border-black flex flex-col gap-5">
                  <div>
                    <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Your restaurant</p>
                    <h3 className="text-2xl xl:text-3xl font-black text-black">Stack & Smash Burgers</h3>
                  </div>
                  <div>
                    <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-3">Try asking</p>
                    <div className="flex flex-col gap-2">
                      {["How many Classic Smashburgers did I sell last Thursday?", "What was my revenue last week?", "What are my best selling items?", "When is my slowest time of day?", "How are Loaded Fries performing as an upsell?"].map((q) => (
                        <button key={q} onClick={() => setChatInput(q)}
                          className="text-left text-xs xl:text-sm font-bold text-black/70 px-3 py-2 border border-black/20 hover:border-black hover:bg-[#f5dda1] transition-colors"
                          style={{ background: "rgba(255,255,255,0.8)" }}>
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-3 flex flex-col h-72 md:h-[420px]">
                  <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-black">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs xl:text-sm font-bold uppercase tracking-widest">Sales AI · Stack & Smash</span>
                  </div>
                  <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
                    {chatHistory.map((msg, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[80%] px-4 py-2.5 text-sm xl:text-base font-bold border-2 border-black"
                          style={{ background: msg.role === "ai" ? "#ecb32e" : "#000", color: msg.role === "ai" ? "#000" : "#fff" }}>
                          {msg.role === "ai" && <span className="text-xs font-black block mb-1 opacity-60">SALES AI</span>}
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="border-t-2 border-black flex">
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Ask about your sales data..."
                      className="flex-1 px-4 py-3 text-sm xl:text-base font-bold outline-none bg-transparent" />
                    <button type="button" onClick={sendMessage}
                      className="px-5 py-3 text-sm xl:text-base font-black bg-black text-white border-l-2 border-black hover:bg-[#ecb32e] hover:text-black transition-colors">
                      ASK
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

          ) : (
            <motion.div key="marketing"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease }}
              className="border-2 border-black" style={{ background: "rgba(255,255,255,0.75)" }}>

              {/* Mobile layout */}
              <div className="md:hidden flex flex-col">
                <div className="p-4 border-b-2 border-black">
                  <p className="text-xs font-bold uppercase tracking-widest text-black/40 mb-1">Campaign builder</p>
                  <h3 className="text-lg font-black text-black">Pick what to promote.</h3>
                </div>
                <div className="p-4 flex flex-col gap-2 border-b-2 border-black">
                  {PROMOS.slice(0, 3).map((p) => (
                    <button type="button" key={p.id}
                      onClick={() => { setSelectedPromo(p.id); setSent(false); }}
                      className="text-left px-3 py-2.5 border-2 transition-colors"
                      style={{ borderColor: selectedPromo === p.id ? "#000" : "rgba(0,0,0,0.15)", background: selectedPromo === p.id ? "#c4b5fd" : "rgba(255,255,255,0.8)" }}>
                      <div className="font-black text-sm text-black">{p.label}</div>
                      <div className="text-xs font-bold text-black/50 mt-0.5">{p.segment} · {p.count} customers</div>
                    </button>
                  ))}
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-3 p-3 border-2 border-black" style={{ background: "#f5dda1" }}>
                    <div>
                      <div className="font-black text-2xl text-black">{promo.count}</div>
                      <div className="text-xs font-bold text-black/60 uppercase tracking-widest">matched</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="font-black text-sm text-black">{promo.segment}</div>
                    </div>
                  </div>
                  <div className="p-3 border-2 border-black text-xs font-bold text-black leading-relaxed"
                    style={{ background: "rgba(255,255,255,0.9)" }}>{smsPreview}</div>
                  <AnimatePresence mode="wait">
                    {!sent ? (
                      <motion.button type="button" key="send" onClick={handleSend}
                        className="w-full py-3 font-black text-sm tracking-widest border-2 border-black"
                        style={{ background: sending ? "#d1d5db" : "#000", color: "#fff" }}
                        whileHover={!sending ? { background: "#2fb67d" } : {}} disabled={sending}>
                        {sending ? "SENDING..." : `SEND TO ${promo.count} CUSTOMERS`}
                      </motion.button>
                    ) : (
                      <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="w-full py-3 font-black text-sm tracking-widest border-2 border-black text-center"
                        style={{ background: "#2fb67d", color: "#fff" }}>
                        {promo.count} MESSAGES SENT
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:grid md:grid-cols-5">
                <div className="md:col-span-2 p-6 xl:p-8 border-r-2 border-black flex flex-col gap-5">
                  <div>
                    <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-1">Campaign builder</p>
                    <h3 className="text-2xl xl:text-3xl font-black text-black">Pick what to promote.</h3>
                    <p className="text-xs xl:text-sm font-bold text-black/50 mt-1">Belan AI picks the right customers automatically.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {PROMOS.map((p) => (
                      <button type="button" key={p.id}
                        onClick={() => { setSelectedPromo(p.id); setSent(false); }}
                        className="text-left px-3 py-2.5 border-2 transition-colors"
                        style={{ borderColor: selectedPromo === p.id ? "#000" : "rgba(0,0,0,0.15)", background: selectedPromo === p.id ? "#c4b5fd" : "rgba(255,255,255,0.8)" }}>
                        <div className="font-black text-sm xl:text-base text-black">{p.label}</div>
                        <div className="text-xs xl:text-sm font-bold text-black/50 mt-0.5">{p.segment} · {p.count} customers</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-3 p-6 xl:p-8 flex flex-col gap-5">
                  <div>
                    <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-3">AI-selected audience</p>
                    <div className="flex items-center gap-3 p-4 border-2 border-black" style={{ background: "#f5dda1" }}>
                      <div>
                        <div className="font-black text-3xl xl:text-4xl text-black">{promo.count}</div>
                        <div className="text-xs xl:text-sm font-bold text-black/60 uppercase tracking-widest">customers matched</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="font-black text-sm xl:text-base text-black">{promo.segment}</div>
                        <div className="text-xs xl:text-sm font-bold text-black/50 mt-0.5">{promo.target}</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/40 mb-3">SMS preview</p>
                    <div className="p-4 border-2 border-black text-sm xl:text-base font-bold text-black leading-relaxed"
                      style={{ background: "rgba(255,255,255,0.9)" }}>{smsPreview}</div>
                  </div>
                  <AnimatePresence mode="wait">
                    {!sent ? (
                      <motion.button type="button" key="send" onClick={handleSend}
                        className="w-full py-4 font-black text-sm xl:text-base tracking-widest border-2 border-black transition-colors"
                        style={{ background: sending ? "#d1d5db" : "#000", color: "#fff" }}
                        whileHover={!sending ? { background: "#2fb67d" } : {}} disabled={sending}>
                        {sending ? "SENDING..." : `SEND TO ${promo.count} CUSTOMERS`}
                      </motion.button>
                    ) : (
                      <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        className="w-full py-4 font-black text-sm xl:text-base tracking-widest border-2 border-black text-center"
                        style={{ background: "#2fb67d", color: "#fff" }}>
                        {promo.count} MESSAGES SENT
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RevealSection>
  );
}

/* ── page ── */
export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen font-tektur overflow-x-hidden relative" style={{ background: "#fafafa" }}>
      {/* full-page grid */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)", backgroundSize: "64px 64px", zIndex: 0 }} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-black">
        <div className="flex items-center h-14 md:h-16 xl:h-20 2xl:h-24 px-4 md:px-6 xl:px-12 2xl:px-20 gap-4 md:gap-6 max-w-[1920px] mx-auto">
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src="/BelanLogo.png" alt="Belan AI"
              className="w-9 h-9 md:w-12 md:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-full object-cover border-2 border-black"
              whileHover={{ rotate: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} />
            <span className="font-black text-black text-xs md:text-sm xl:text-base tracking-tight">BELAN AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0 flex-1">
            {([["#", "HOME"], ["#how-it-works", "HOW IT WORKS"], ["#sandbox", "TRY IT"], ["#pricing", "PRICING"]] as [string, string][]).map(([href, label], i) => (
              <motion.a key={href} href={href}
                className={`flex items-center px-4 xl:px-6 h-12 xl:h-14 2xl:h-16 text-xs xl:text-sm font-bold tracking-widest border-r-2 border-black ${i === 0 ? "bg-black text-white border-l-2" : "text-black"}`}
                whileHover={i !== 0 ? { backgroundColor: "#000", color: "#fff" } : {}}
                transition={{ duration: 0.15 }}>
                {label}
              </motion.a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <Link href="/login" className="hidden md:block text-xs xl:text-sm font-bold text-black tracking-widest hover:underline">LOG IN</Link>
            <motion.div className="hidden md:block" whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link href="/register" className="block text-xs xl:text-sm font-bold px-4 xl:px-5 py-2 xl:py-2.5 border-2 border-black tracking-widest" style={{ background: "#a4e5f8" }}>SIGN UP</Link>
            </motion.div>
            <motion.div whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link href="https://calendar.app.google/uCwfd2qfNtjJMSca9" target="_blank" rel="noopener noreferrer" className="bg-black text-white text-xs font-bold px-3 md:px-5 xl:px-7 py-2 md:py-2.5 xl:py-3 tracking-widest border-2 border-black block whitespace-nowrap">
                BOOK A DEMO →
              </Link>
            </motion.div>
            <button className="md:hidden text-black p-1" onClick={() => setMobileOpen((o) => !o)}>
              <motion.svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                animate={{ rotate: mobileOpen ? 90 : 0 }} transition={{ duration: 0.25 }}>
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </motion.svg>
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div className="md:hidden bg-white/95 border-t-2 border-black px-6 flex flex-col gap-3 text-xs font-bold tracking-widest overflow-hidden"
              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease }}>
              <div className="py-4 flex flex-col gap-3">
                <a href="#how-it-works" onClick={() => setMobileOpen(false)}>HOW IT WORKS</a>
                <a href="#sandbox" onClick={() => setMobileOpen(false)}>TRY IT</a>
                <a href="#pricing" onClick={() => setMobileOpen(false)}>PRICING</a>
                <Link href="/login">LOG IN</Link>
                <a href="https://calendar.app.google/uCwfd2qfNtjJMSca9" target="_blank" rel="noopener noreferrer" className="bg-black text-white px-4 py-2 text-center">BOOK A DEMO →</a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="min-h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] xl:h-[calc(100vh-5rem)] 2xl:h-[calc(100vh-6rem)] px-4 sm:px-8 md:px-16 xl:px-24 flex items-center relative"
        style={{ zIndex: 1 }}>
        {/* floating feature tiles — desktop only */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
          <div className="absolute" style={{ top: "16%", left: "4%", animation: "floatA 10s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm xl:text-base font-bold whitespace-nowrap" style={{ background: "#a1dfc5", transform: "rotate(-2deg)" }}>📞 Voice AI Ordering</div>
          </div>
          <div className="absolute" style={{ top: "11%", right: "5%", animation: "floatB 12s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm xl:text-base font-bold whitespace-nowrap" style={{ background: "#f5dda1", transform: "rotate(3deg)" }}>💬 SMS Text Ordering</div>
          </div>
          <div className="absolute" style={{ top: "52%", right: "3%", animation: "floatC 9s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm xl:text-base font-bold whitespace-nowrap text-white" style={{ background: "#e01d5a", transform: "rotate(-1.5deg)" }}>DIRECT TO POS</div>
          </div>
          <div className="absolute" style={{ bottom: "20%", left: "3%", animation: "floatD 11s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm xl:text-base font-bold whitespace-nowrap text-white flex items-center gap-2" style={{ background: "#ecb32e", transform: "rotate(2deg)" }}>
              <span>→</span> 99%+ Order Accuracy
            </div>
          </div>
          <div className="absolute" style={{ top: "38%", left: "2%", animation: "floatE 13s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm xl:text-base font-bold whitespace-nowrap" style={{ background: "#a4e5f8", transform: "rotate(1.5deg)" }}>📊 Smart Dashboard</div>
          </div>
        </div>

        <style>{`
          @keyframes floatA { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-10px,-22px)} 55%{transform:translate(7px,-40px)} 80%{transform:translate(-6px,-18px)} }
          @keyframes floatB { 0%,100%{transform:translate(0,0)} 30%{transform:translate(13px,-28px)} 65%{transform:translate(-9px,-48px)} 85%{transform:translate(5px,-20px)} }
          @keyframes floatC { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-14px,52px)} 70%{transform:translate(-6px,30px)} }
          @keyframes floatD { 0%,100%{transform:translate(0,0)} 35%{transform:translate(62px,-38px)} 65%{transform:translate(28px,-55px)} 85%{transform:translate(45px,-25px)} }
          @keyframes floatE { 0%,100%{transform:translate(0,0)} 30%{transform:translate(8px,-30px)} 60%{transform:translate(-12px,-52px)} 80%{transform:translate(4px,-22px)} }
        `}</style>

        <motion.div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto w-full flex flex-col items-center text-center py-10"
          style={{ zIndex: 10, position: "relative" }}
          variants={stagger} initial="hidden" animate="visible">

          {/* Badge — one line on all screens */}
          <motion.div variants={fadeUp}
            className="border-2 border-black px-3 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm xl:text-base font-bold mb-5 sm:mb-6 whitespace-nowrap"
            style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}
            whileHover={{ rotate: 0, scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            Restaurant AI that actually works 📞
          </motion.div>

          {/* BELAN AI — one line on all screens */}
          <motion.div variants={scaleIn} className="relative inline-block mb-5 sm:mb-6">
            {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map((pos) => (
              <div key={pos} className={`absolute w-2.5 h-2.5 sm:w-3 sm:h-3 z-10 ${pos}`}
                style={{ border: "2px solid #36c5f0", background: "transparent" }} />
            ))}
            <div className="px-3 sm:px-6 py-2 sm:py-3" style={{ background: "transparent", border: "2px solid #36c5f0" }}>
              <h1 className="text-6xl sm:text-7xl md:text-9xl xl:text-[11rem] 2xl:text-[13rem] font-black text-black leading-none tracking-tight whitespace-nowrap">
                BELAN AI
              </h1>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-[10px] sm:text-xs xl:text-sm font-bold uppercase tracking-widest text-black">Available for your restaurant</span>
          </motion.div>

          {/* Subtitle — 2 lines on mobile */}
          <motion.p variants={fadeUp}
            className="text-lg sm:text-2xl md:text-3xl xl:text-4xl 2xl:text-5xl font-black text-black leading-snug mb-2 sm:mb-3 max-w-xs sm:max-w-xl md:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
            I handle{" "}
            <span className="px-1.5 sm:px-2 py-0.5 border-2 border-black" style={{ background: "#a4e5f8" }}>
              📞 every phone call
            </span>{" "}
            so your team can focus on what actually matters{" "}
            <span style={{ color: "#ecb32e" }}>🍕</span>
          </motion.p>

          {/* Description — 2-3 lines on mobile */}
          <motion.p variants={fadeUp}
            className="text-sm sm:text-base md:text-lg xl:text-xl 2xl:text-2xl text-black/60 font-medium mb-6 sm:mb-8 max-w-xs sm:max-w-sm md:max-w-xl xl:max-w-2xl leading-relaxed">
            Belan AI answers calls, takes SMS orders, and sends them straight to your POS. No app. No account. No friction.
          </motion.p>

          {/* Buttons — stacked on mobile, side by side on sm+ */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto justify-center">
            <motion.div whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <Link href="/register"
                className="bg-black text-white font-bold text-xs sm:text-sm xl:text-base px-6 sm:px-7 xl:px-10 py-2.5 sm:py-3 xl:py-4 border-2 border-black tracking-wide block text-center whitespace-nowrap">
                GET STARTED →
              </Link>
            </motion.div>
            <motion.div whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <motion.a href="#how-it-works"
                className="bg-white/80 text-black font-bold text-xs sm:text-sm xl:text-base px-6 sm:px-7 xl:px-10 py-2.5 sm:py-3 xl:py-4 border-2 border-black tracking-wide block text-center whitespace-nowrap">
                SEE HOW IT WORKS
              </motion.a>
            </motion.div>
          </motion.div>

        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <RevealSection id="how-it-works"
        className="py-16 md:py-20 xl:py-32 px-4 sm:px-8 md:px-16 xl:px-24 2xl:px-32 relative"
        style={{ zIndex: 1 }}>
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto relative" style={{ zIndex: 1 }}>
          <div className="grid md:grid-cols-[3fr_1fr] gap-8 md:gap-12 xl:gap-20 items-center">
            {/* LEFT — static info */}
            <div>
              <motion.div variants={fadeIn}
                className="inline-block border-2 border-black px-4 py-1.5 mb-4 sm:mb-5 text-xs sm:text-sm xl:text-base font-bold"
                style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}>
                HOW IT WORKS
              </motion.div>
              <motion.h2 variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-black text-black leading-tight mb-6 sm:mb-10 xl:mb-14">
                Your phone answers itself —<br />
                <span style={{ color: "#ecb32e" }}>every call, every time.</span>
              </motion.h2>

              <motion.div variants={stagger} className="flex flex-col gap-3 sm:gap-4 xl:gap-6">
                {[
                  { num: "01", color: "#a4e5f8", title: "Customer calls. Belan answers.", desc: "Every call picked up on the first ring — no hold music, no missed orders, no staff needed.", mobileImg: "baristatalkingonphone.svg" },
                  { num: "02", color: "#f5dda1", title: "AI takes the order naturally.", desc: "Belan knows your menu and talks like a person. Customers just say what they want.", mobileImg: "waiter_recommending_from_menu.svg" },
                  { num: "03", color: "#2fb67d", title: "Pay by text. Print in the kitchen.", desc: "Belan texts a payment link, then fires the order straight to your POS the moment they pay.", white: true, mobileImg: "runningwithpizza.svg" },
                ].map(({ num, color, title, desc, white, mobileImg }) => (
                  <motion.div key={num} variants={fadeUp}
                    className="flex gap-3 sm:gap-5 items-center p-4 sm:p-5 xl:p-6 border-2 border-black"
                    style={{ background: "rgba(255,255,255,0.75)" }}
                    whileHover={{ x: 4, boxShadow: "4px 4px 0px #000", transition: { type: "spring", stiffness: 400, damping: 20 } }}>
                    <div className="text-base sm:text-xl xl:text-2xl font-black border-2 border-black w-9 h-9 sm:w-12 sm:h-12 xl:w-14 xl:h-14 flex items-center justify-center flex-shrink-0"
                      style={{ background: color, color: white ? "white" : "black", fontFamily: "Tektur, sans-serif" }}>
                      {num}
                    </div>
                    <div className="flex-1">
                      <div className="font-black text-sm sm:text-lg xl:text-xl 2xl:text-2xl text-black mb-0.5 sm:mb-1">{title}</div>
                      <div className="text-xs sm:text-sm xl:text-base text-black leading-relaxed font-bold">{desc}</div>
                    </div>
                    {/* Mobile static capybara per step */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/capybaraPics/${mobileImg}`} alt=""
                      className={`md:hidden w-auto object-contain flex-shrink-0 ${num === "01" ? "h-24" : "h-16"}`} />
                  </motion.div>
                ))}
              </motion.div>

              {/* POS row */}
              <motion.div variants={fadeIn} className="mt-6 sm:mt-8 xl:mt-10 flex flex-wrap items-center gap-2">
                <span className="text-xs xl:text-sm font-bold uppercase tracking-widest text-black/50 mr-2">Works with</span>
                {[{ label: "Clover ✓", color: "#a1dfc5" }, { label: "Toast ✓", color: "#a4e5f8" }, { label: "Square ✓", color: "#f5dda1" }, { label: "Lightspeed ✓", color: "#ecb32e" }, { label: "Revel ✓", color: "#a1dfc5" }, { label: "TouchBistro ✓", color: "#a4e5f8" }].map(({ label, color }) => (
                  <div key={label} className="px-2.5 sm:px-3 py-1 sm:py-1.5 border-2 border-black text-xs xl:text-sm font-bold" style={{ background: color }}>{label}</div>
                ))}
                <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 border-2 border-black text-xs xl:text-sm font-bold text-white" style={{ background: "#000" }}>+ others</div>
              </motion.div>
            </div>

            {/* RIGHT — rotating capybara (desktop only) */}
            <motion.div variants={scaleIn} className="hidden md:flex flex-col items-center justify-center">
              <RotatingCapybara />
            </motion.div>
          </div>
        </div>
      </RevealSection>

      {/* ── PRODUCTS ── */}
      <RevealSection className="py-16 md:py-28 xl:py-36 2xl:py-44 px-4 sm:px-8 md:px-16 xl:px-24 2xl:px-32 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto relative" style={{ zIndex: 1 }}>
          <motion.div variants={fadeIn}
            className="inline-block border-2 border-black px-4 py-1.5 mb-4 sm:mb-5 text-xs sm:text-sm xl:text-base font-bold"
            style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}>
            EVERYTHING INCLUDED
          </motion.div>
          <motion.h2 variants={fadeUp}
            className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-black text-black leading-tight mb-8 sm:mb-12 xl:mb-16">
            One price.<br />
            <span style={{ color: "#ecb32e" }}>Five products.</span>
          </motion.h2>
          <ProductCards />
        </div>
      </RevealSection>

      {/* ── SANDBOX ── */}
      <SandboxSection />

      {/* ── TESTIMONIALS ── */}
      <RevealSection className="py-16 md:py-20 xl:py-32 px-4 sm:px-8 md:px-16 xl:px-24 2xl:px-32 relative overflow-hidden" style={{ zIndex: 1 }}>
        <div className="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto relative" style={{ zIndex: 1 }}>
          <motion.div variants={fadeIn}
            className="inline-block border-2 border-black px-4 py-1.5 mb-4 sm:mb-5 text-xs sm:text-sm xl:text-base font-bold"
            style={{ background: "#2fb67d", color: "white", transform: "rotate(-1deg)" }}>
            WHAT RESTAURANTS SAY
          </motion.div>

          {/* Mobile: header + capybara side by side */}
          <div className="flex items-end gap-4 mb-8 sm:mb-12 xl:mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl font-black text-black flex-1">
              Real restaurants. Real results.
            </motion.h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/capybaraPics/twotalkingontable.svg" alt=""
              className="md:hidden h-20 w-auto object-contain flex-shrink-0" />
          </div>

          <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-0">
            {[
              { name: "Lime N Dime", quote: "We were drowning during dinner rush. Now our phones answer themselves and orders go straight to Clover.", color: "#a4e5f8" },
              { name: "Epic Pizza", quote: "Customers love texting their order. Fewer mistakes, faster kitchen, and zero hold music.", color: "#f5dda1" },
              { name: "Shaghf", quote: "Setup took 20 minutes. Belan connected to our POS and started taking orders the same day.", color: "#a1dfc5" },
            ].map(({ name, quote, color }) => (
              <motion.div key={name} variants={fadeUp}
                className="p-5 sm:p-6 xl:p-8 2xl:p-10 border-2 border-black md:-ml-[2px] relative"
                style={{ background: "rgba(255,255,255,0.8)", borderLeft: `6px solid ${color}` }}
                whileHover={{ y: -4, boxShadow: "4px 4px 0px #000", transition: { type: "spring", stiffness: 400, damping: 20 } }}>
                <div className="text-4xl sm:text-5xl xl:text-6xl font-black mb-3 leading-none" style={{ color, fontFamily: "Tektur, sans-serif" }}>&ldquo;</div>
                <p className="text-sm xl:text-base 2xl:text-lg font-medium text-black/80 leading-relaxed mb-4">{quote}</p>
                <div className="font-black text-sm xl:text-base text-black">{name}</div>
                <div className="text-xs xl:text-sm text-black/50 font-medium">— Owner</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </RevealSection>

      {/* ── PRICING ── */}
      <RevealSection id="pricing" className="py-16 md:py-20 xl:py-32 px-4 sm:px-8 md:px-16 xl:px-24 2xl:px-32"
        style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
          <motion.div variants={fadeIn}
            className="inline-block border-2 border-black px-4 py-1.5 mb-4 sm:mb-5 text-xs sm:text-sm xl:text-base font-bold"
            style={{ background: "#f5dda1", transform: "rotate(-1deg)" }}>
            PRICING
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl xl:text-5xl 2xl:text-6xl font-black text-black mb-2">
            One price. Every AI. Unlimited.
          </motion.h2>
          <motion.p variants={fadeIn} className="text-black/60 mb-8 sm:mb-10 xl:mb-14 font-medium text-sm sm:text-base xl:text-lg">
            Voice AI, SMS ordering, Dashboard, Recommendations — all included. No per-order fees.
          </motion.p>

          <div className="relative flex justify-center">
            {/* left capybara — desktop only */}
            <div className="hidden md:block absolute bottom-0 left-0" style={{ zIndex: 2, transform: "translateX(-85%)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capybaraPics/scooterguytakingpic.svg" alt="" className="h-64 xl:h-80 2xl:h-96 w-auto object-contain" />
            </div>

            {/* pricing card */}
            <motion.div variants={scaleIn}
              className="border-2 border-black p-6 sm:p-8 xl:p-10 2xl:p-12 w-full max-w-xl xl:max-w-2xl"
              style={{ background: "rgba(255,255,255,0.85)" }}
              whileHover={{ y: -4, boxShadow: "6px 6px 0px #000", transition: { type: "spring", stiffness: 300, damping: 20 } }}>
              <div className="mb-5 sm:mb-6 flex items-center flex-wrap gap-2">
                <span className="text-5xl sm:text-6xl xl:text-7xl 2xl:text-8xl font-black text-black" style={{ fontFamily: "Tektur, sans-serif" }}>$200</span>
                <span className="text-black/60 font-bold xl:text-lg"> / mo</span>
                <motion.span className="text-xs xl:text-sm font-bold border-2 border-black px-2 py-1 inline-block" style={{ background: "#f5dda1" }}
                  whileHover={{ scale: 1.08, rotate: -2 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                  ONLY $6.67/DAY
                </motion.span>
              </div>

              <motion.div variants={staggerFast} className="flex flex-col gap-2 xl:gap-3 mb-6 sm:mb-8">
                {["Voice AI Ordering — unlimited concurrent calls", "SMS Text-to-Order — unlimited messages", "Dedicated Belan AI phone number", "Direct POS Integration", "Smart Dashboard — real-time analytics", "AI Recommendation Engine", "Custom AI Voice & Greeting", "FAQ & Upsell Rule Builder", "Integrated Payment Processing", "86 Detection & Menu Availability Toggles", "SMS Marketing Campaigns", "Best support in the restaurant universe"].map((item) => (
                  <motion.div key={item} variants={fadeIn} className="flex items-start gap-2 text-xs sm:text-sm xl:text-base font-medium text-black">
                    <span className="font-black flex-shrink-0" style={{ color: "#ecb32e" }}>→</span>{item}
                  </motion.div>
                ))}
              </motion.div>

              <div className="flex items-center gap-4 flex-wrap">
                <motion.div whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }} className="inline-block">
                  <Link href="/register"
                    className="inline-block bg-black text-white font-bold text-xs sm:text-sm xl:text-base px-6 sm:px-8 xl:px-10 py-2.5 sm:py-3 xl:py-4 border-2 border-black tracking-wide">
                    GET STARTED →
                  </Link>
                </motion.div>
                <span className="text-xs xl:text-sm text-black/40 font-medium">No credit card required</span>
              </div>
            </motion.div>

            {/* right capybara — desktop only */}
            <div className="hidden md:block absolute bottom-0 right-0" style={{ zIndex: 2, transform: "translateX(70%)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capybaraPics/sittingoncrate.svg" alt="" className="h-64 xl:h-80 2xl:h-96 w-auto object-contain" style={{ transform: "scaleX(-1)" }} />
            </div>
          </div>

          {/* Mobile capybara below pricing card */}
          <div className="md:hidden flex justify-center mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/capybaraPics/scooterguytakingpic.svg" alt="" className="h-36 w-auto object-contain" />
          </div>

          <motion.p variants={fadeIn} className="text-xs sm:text-sm xl:text-base mt-4 sm:mt-6 font-medium text-black/60 text-center">
            Have 10+ locations?{" "}
            <a href="#" className="font-bold text-black underline">Talk to us about custom pricing.</a>
          </motion.p>
        </div>
      </RevealSection>

      {/* ── CTA Band ── */}
      <RevealSection className="py-16 md:py-20 xl:py-32 px-4 sm:px-8 md:px-16 xl:px-24 text-center"
        style={{ background: "#2fb67d", position: "relative", zIndex: 1 }}>
        <motion.h2 variants={fadeUp}
          className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-black text-black mb-3 sm:mb-4 leading-tight">
          Ready to let AI take the calls? 📞
        </motion.h2>
        <motion.p variants={fadeUp} className="text-black/70 text-sm sm:text-base md:text-lg xl:text-xl 2xl:text-2xl font-medium mb-6 sm:mb-8 xl:mb-12">
          Set up in 30 minutes. Works with your existing POS. No app required.
        </motion.p>
        <motion.div variants={staggerFast} className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
          <motion.div variants={fadeIn} whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <a href="https://calendar.app.google/uCwfd2qfNtjJMSca9" target="_blank" rel="noopener noreferrer"
              className="bg-black text-white font-bold text-xs sm:text-sm xl:text-base px-8 sm:px-10 xl:px-14 py-2.5 sm:py-3 xl:py-4 border-2 border-black tracking-wide block whitespace-nowrap">
              BOOK A DEMO →
            </a>
          </motion.div>
          <motion.div variants={fadeIn} whileHover={{ y: -3, boxShadow: "3px 3px 0px #000" }} whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}>
            <Link href="/login"
              className="bg-white text-black font-bold text-xs sm:text-sm xl:text-base px-8 sm:px-10 xl:px-14 py-2.5 sm:py-3 xl:py-4 border-2 border-black tracking-wide block whitespace-nowrap">
              LOG IN TO DASHBOARD
            </Link>
          </motion.div>
        </motion.div>
      </RevealSection>

      {/* ── Footer ── */}
      <footer className="py-5 sm:py-6 xl:py-8 px-4 sm:px-8 xl:px-16" style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan AI" className="w-6 h-6 sm:w-7 sm:h-7 xl:w-9 xl:h-9 rounded-full object-cover border-2 border-black" />
            <span className="font-black text-black text-xs xl:text-sm tracking-widest">BELAN AI</span>
          </div>
          <div className="flex gap-4 sm:gap-6 text-xs xl:text-sm font-bold tracking-widest text-black/50">
            <Link href="/login" className="hover:text-black transition-colors">LOG IN</Link>
            <Link href="/register" className="hover:text-black transition-colors">SIGN UP</Link>
          </div>
          <p className="text-xs xl:text-sm font-bold tracking-widest text-black/40">© 2026 BELAN AI</p>
        </div>
      </footer>
    </div>
  );
}
