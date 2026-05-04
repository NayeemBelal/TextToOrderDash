"use client";

import { useState, useRef, useEffect } from "react";
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

function StatPill({ value, prefix = "", suffix = "", label, color, textWhite = false }: {
  value: number; prefix?: string; suffix?: string; label: string; color: string; textWhite?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { count, startAnim } = useCountUp(value, 1800);
  if (inView) startAnim();
  const tc = textWhite ? "text-white" : "text-black";
  return (
    <motion.div ref={ref} variants={scaleIn} className="flex flex-col items-center gap-1 px-8 py-5 border-2 border-black" style={{ background: color }}
      whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 20 } }}>
      <div className={`text-4xl font-black ${tc}`} style={{ fontFamily: "Tektur, sans-serif" }}>{prefix}{count.toLocaleString()}{suffix}</div>
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

/* ── rotating capybara ── */
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
          <img src={`/capybaraPics/${encodeURIComponent(slot.img)}`} alt="" className="h-96 w-auto object-contain -mb-16" />
          <p className="text-center font-black text-2xl text-black max-w-sm">
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
    img: "waiter_explaining_the_cost_of_a_menu_item.svg",
  },
  {
    color: "#c4b5fd", name: "Marketing", tagline: "Fill slow nights",
    desc: "SMS blasts to past customers.",
    bullets: ["One-click SMS blasts", "Target past customers", "Track campaign results"],
    img: "waiter_recommending_from_menu.svg",
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
    <div className="grid grid-cols-3 gap-0">
      {/* Voice AI — hero card, spans 2 rows */}
      <motion.div
        className="row-span-2 border-2 border-black p-8 flex flex-col justify-between overflow-hidden relative"
        style={{ background: voice.color }}
        whileHover={{ y: -4, boxShadow: "4px 4px 0px #000" }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <div className="flex flex-col gap-4">
          <div>
            <div className="font-black text-3xl text-black leading-tight">{voice.name}</div>
            <div className="text-sm font-bold text-black/50 uppercase tracking-widest mt-1">{voice.tagline}</div>
          </div>
          <p className="text-sm font-bold text-black/70 leading-relaxed">{voice.desc}</p>
          <ul className="flex flex-col gap-2 mt-1">
            {voice.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm font-bold text-black">
                <span className="w-1.5 h-1.5 rounded-full bg-black flex-shrink-0" />{b}
              </li>
            ))}
          </ul>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/capybaraPics/${encodeURIComponent(voice.img)}`} alt="" className="h-64 w-auto object-contain self-end -mb-8" />
      </motion.div>

      {/* remaining 4 cards in a 2×2 grid (cols 2-3) */}
      {rest.map(({ color, icon: _icon, name, tagline, desc, bullets, img }) => {
        const isHovered = hovered === name;
        return (
          <motion.div
            key={name}
            className="border-2 border-black -ml-[2px] -mt-[2px] p-6 flex flex-col gap-3 overflow-hidden relative"
            style={{ background: isHovered ? color : "rgba(255,255,255,0.85)", transition: "background 0.2s ease" }}
            whileHover={{ y: -4, boxShadow: "4px 4px 0px #000" }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onHoverStart={() => setHovered(name)}
            onHoverEnd={() => setHovered(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/capybaraPics/${encodeURIComponent(img)}`} alt="" className="absolute bottom-0 right-0 h-44 w-auto object-contain pointer-events-none opacity-90" />
            <div>
              <div className="font-black text-lg text-black leading-tight">{name}</div>
              <div className="text-xs font-bold text-black/40 uppercase tracking-widest mt-0.5">{tagline}</div>
            </div>
            <p className="text-sm font-bold text-black/60 leading-relaxed">{desc}</p>
            <ul className="flex flex-col gap-1.5">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-2 text-xs font-bold text-black/70">
                  <span className="w-1 h-1 rounded-full bg-black/40 flex-shrink-0" />{b}
                </li>
              ))}
            </ul>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── sandbox types ── */
interface MenuItem { id: number; name: string; price: string; }

/* ── sandbox conversation builder ── */
function buildConversation(greeting: string, items: MenuItem[]) {
  const firstItem = items[0] ?? { name: "a Latte", price: "4.50" };
  return [
    { role: "ai" as const, text: greeting || "Hi! Welcome to our restaurant. What can I get you today?" },
    { role: "customer" as const, text: `I'd like a ${firstItem.name} please` },
    { role: "ai" as const, text: `Perfect! ${firstItem.name} ($${firstItem.price}) added to your cart. Anything else?` },
    { role: "customer" as const, text: "No thanks, ready to checkout" },
    { role: "ai" as const, text: "Great! I'll send you a payment link via SMS right now 📱" },
  ];
}

function SandboxSection() {
  const [activeTab, setActiveTab] = useState<"voice" | "sms">("voice");
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: 1, name: "Latte", price: "4.50" },
    { id: 2, name: "Croissant", price: "3.75" },
  ]);
  const [greeting, setGreeting] = useState("Hi! Welcome to our restaurant. What can I get you today?");
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);
  const nextId = useRef(3);

  const addItem = () => {
    if (!newName.trim()) return;
    setMenuItems((prev) => [...prev, { id: nextId.current++, name: newName.trim(), price: newPrice || "0.00" }]);
    setNewName("");
    setNewPrice("");
    setShowAddRow(false);
  };
  const removeItem = (id: number) => setMenuItems((prev) => prev.filter((m) => m.id !== id));
  const convo = buildConversation(greeting, menuItems);

  return (
    <RevealSection id="sandbox" className="py-20 px-8 md:px-16" style={{ position: "relative", zIndex: 1 }}>
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <motion.div variants={fadeUp} className="mb-10">
          <div className="inline-block border-2 border-black px-4 py-1.5 mb-4 text-sm font-bold"
            style={{ background: "#e01d5a", color: "white", transform: "rotate(-1deg)" }}>
            TRY IT YOURSELF
          </div>
          <h2 className="text-5xl font-black text-black leading-tight">
            Build your demo.<br />
            <span style={{ color: "#ecb32e" }}>See it work in seconds.</span>
          </h2>
        </motion.div>

        {/* tab switcher */}
        <motion.div variants={fadeIn} className="flex gap-0 mb-8 inline-flex border-2 border-black">
          {(["voice", "sms"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-6 py-3 text-sm font-bold tracking-widest transition-colors"
              style={{ background: activeTab === tab ? "#000" : "rgba(255,255,255,0.85)", color: activeTab === tab ? "#fff" : "#000" }}>
              {tab === "voice" ? "📞 VOICE AI" : "💬 TEXT TO ORDER"}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease }}
            className="grid md:grid-cols-5 gap-0 border-2 border-black"
            style={{ background: "rgba(255,255,255,0.75)" }}>

            {/* LEFT: config */}
            <div className="md:col-span-2 p-6 border-r-2 border-black">
              {/* capybara */}
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeTab === "voice" ? "/capybaraPics/pizzatalkingonphone.svg" : "/capybaraPics/insuittexting.svg"}
                  alt="" className="h-28 w-auto object-contain" />
              </div>

              {/* menu items */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest">📋 Your Menu</span>
                  {menuItems.length < 5 && (
                    <button onClick={() => setShowAddRow(true)}
                      className="text-xs font-bold px-2 py-1 border border-black hover:bg-black hover:text-white transition-colors"
                      style={{ background: "#a1dfc5" }}>+ ADD</button>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-3 py-1.5 border border-black text-sm"
                      style={{ background: "rgba(255,255,255,0.9)" }}>
                      <span className="font-medium">{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs">${item.price}</span>
                        <button onClick={() => removeItem(item.id)} className="text-xs text-black/40 hover:text-red-600 font-bold">✕</button>
                      </div>
                    </div>
                  ))}
                  {showAddRow && (
                    <div className="flex gap-1 mt-1">
                      <input value={newName} onChange={(e) => setNewName(e.target.value)}
                        placeholder="Item name" onKeyDown={(e) => e.key === "Enter" && addItem()}
                        className="flex-1 border border-black px-2 py-1 text-xs font-medium outline-none" />
                      <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                        placeholder="$0.00" className="w-16 border border-black px-2 py-1 text-xs font-medium outline-none" />
                      <button onClick={addItem} className="bg-black text-white px-2 py-1 text-xs font-bold">✓</button>
                    </div>
                  )}
                </div>
              </div>

              {/* greeting */}
              <div>
                <span className="text-xs font-bold uppercase tracking-widest block mb-2">🤖 AI Greeting</span>
                <textarea value={greeting} onChange={(e) => setGreeting(e.target.value)} rows={3}
                  className="w-full border-2 border-black p-2 text-sm font-medium outline-none resize-none"
                  style={{ background: "rgba(255,255,255,0.9)" }} />
              </div>
              <p className="text-xs text-black/50 font-medium mt-2">Your changes preview instantly →</p>
            </div>

            {/* RIGHT: conversation preview */}
            <div className="md:col-span-3 p-6">
              {activeTab === "voice" ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">Live Call</span>
                    <span className="text-xs text-black/40 font-medium ml-auto">Belan Voice AI</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {convo.map((msg, i) => (
                      <motion.div key={`${greeting}-${menuItems.length}-${i}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.35 }}
                        className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%] px-4 py-2.5 text-sm font-medium border-2 border-black"
                          style={{ background: msg.role === "ai" ? "#a4e5f8" : "#000", color: msg.role === "ai" ? "#000" : "#fff" }}>
                          {msg.role === "ai" && <span className="text-xs font-bold block mb-0.5 opacity-60">BELAN AI</span>}
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">SMS Thread</span>
                    <span className="text-xs text-black/40 font-medium ml-auto">iMessage · Belan</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {convo.map((msg, i) => (
                      <motion.div key={`${greeting}-${menuItems.length}-${i}`}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.35 }}
                        className={`flex ${msg.role === "customer" ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%] px-4 py-2.5 text-sm font-medium rounded-2xl"
                          style={{ background: msg.role === "ai" ? "#e9e9eb" : "#007aff", color: msg.role === "ai" ? "#000" : "#fff" }}>
                          {msg.text}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
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
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "64px 64px", zIndex: 0,
      }} />

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-black">
        <div className="flex items-center h-20 px-6 gap-6">
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img src="/BelanLogo.png" alt="Belan AI"
              className="w-14 h-14 rounded-full object-cover border-2 border-black"
              whileHover={{ rotate: -5, scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 15 }} />
            <span className="font-black text-black text-sm tracking-tight">BELAN AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0 flex-1">
            {([["#", "HOME"], ["#how-it-works", "HOW IT WORKS"], ["#sandbox", "TRY IT"], ["#pricing", "PRICING"]] as [string, string][]).map(([href, label], i) => (
              <motion.a key={href} href={href}
                className={`flex items-center px-4 h-14 text-xs font-bold tracking-widest border-r-2 border-black ${i === 0 ? "bg-black text-white border-l-2" : "text-black"}`}
                whileHover={i !== 0 ? { backgroundColor: "#000", color: "#fff" } : {}} transition={{ duration: 0.15 }}>
                {label}
              </motion.a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/login" className="hidden md:block text-xs font-bold text-black tracking-widest hover:underline">LOG IN</Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
              <Link href="/" className="bg-black text-white text-xs font-bold px-5 py-2.5 tracking-widest border-2 border-black block">BOOK A DEMO →</Link>
            </motion.div>
            <button className="md:hidden text-black" onClick={() => setMobileOpen((o) => !o)}>
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
                <Link href="/" className="bg-black text-white px-4 py-2 text-center">BOOK A DEMO →</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ── */}
      <section className="h-[calc(100vh-5rem)] px-8 md:px-16 flex items-center relative" style={{ zIndex: 1 }}>
        {/* floating feature tiles */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
          <div className="absolute" style={{ top: "16%", left: "4%", animation: "floatA 10s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm font-bold whitespace-nowrap" style={{ background: "#a1dfc5", transform: "rotate(-2deg)" }}>📞 Voice AI Ordering</div>
          </div>
          <div className="absolute" style={{ top: "11%", right: "5%", animation: "floatB 12s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm font-bold whitespace-nowrap" style={{ background: "#f5dda1", transform: "rotate(3deg)" }}>💬 SMS Text Ordering</div>
          </div>
          <div className="absolute" style={{ top: "52%", right: "3%", animation: "floatC 9s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm font-bold whitespace-nowrap text-white" style={{ background: "#e01d5a", transform: "rotate(-1.5deg)" }}>DIRECT TO POS</div>
          </div>
          <div className="absolute" style={{ bottom: "20%", left: "3%", animation: "floatD 11s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm font-bold whitespace-nowrap text-white flex items-center gap-2" style={{ background: "#ecb32e", transform: "rotate(2deg)" }}>
              <span>→</span> 99%+ Order Accuracy
            </div>
          </div>
          <div className="absolute" style={{ top: "38%", left: "2%", animation: "floatE 13s ease-in-out infinite" }}>
            <div className="px-4 py-2 border-2 border-black text-sm font-bold whitespace-nowrap" style={{ background: "#a4e5f8", transform: "rotate(1.5deg)" }}>📊 Smart Dashboard</div>
          </div>
        </div>

        <style>{`
          @keyframes floatA { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-10px,-22px)} 55%{transform:translate(7px,-40px)} 80%{transform:translate(-6px,-18px)} }
          @keyframes floatB { 0%,100%{transform:translate(0,0)} 30%{transform:translate(13px,-28px)} 65%{transform:translate(-9px,-48px)} 85%{transform:translate(5px,-20px)} }
          @keyframes floatC { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-14px,52px)} 70%{transform:translate(-6px,30px)} }
          @keyframes floatD { 0%,100%{transform:translate(0,0)} 35%{transform:translate(62px,-38px)} 65%{transform:translate(28px,-55px)} 85%{transform:translate(45px,-25px)} }
          @keyframes floatE { 0%,100%{transform:translate(0,0)} 30%{transform:translate(8px,-30px)} 60%{transform:translate(-12px,-52px)} 80%{transform:translate(4px,-22px)} }
        `}</style>

        <motion.div className="max-w-6xl mx-auto w-full flex flex-col items-center text-center px-12 py-10"
          style={{ zIndex: 10, position: "relative" }} variants={stagger} initial="hidden" animate="visible">
          <motion.div variants={fadeUp} className="border-2 border-black px-5 py-3 text-sm font-bold mb-6"
            style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}
            whileHover={{ rotate: 0, scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            Restaurant AI that actually works 📞
          </motion.div>

          <motion.div variants={scaleIn} className="relative inline-block mb-6">
            {["-top-1.5 -left-1.5", "-top-1.5 -right-1.5", "-bottom-1.5 -left-1.5", "-bottom-1.5 -right-1.5"].map((pos) => (
              <div key={pos} className={`absolute w-3 h-3 z-10 ${pos}`} style={{ border: "2px solid #36c5f0", background: "transparent" }} />
            ))}
            <div className="px-6 py-3" style={{ background: "transparent", border: "2px solid #36c5f0" }}>
              <h1 className="text-8xl md:text-[10rem] font-black text-black leading-none tracking-tight">BELAN AI</h1>
            </div>
          </motion.div>

          <motion.div variants={fadeIn} className="flex items-center justify-center gap-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-black">Available for your restaurant</span>
          </motion.div>

          <motion.p variants={fadeUp} className="text-3xl font-black text-black leading-snug mb-3 max-w-2xl">
            I handle{" "}
            <span className="px-2 py-0.5 border-2 border-black" style={{ background: "#a4e5f8" }}>📞 every phone call</span>{" "}
            so your team can focus on what actually matters{" "}
            <span style={{ color: "#ecb32e" }}>🍕</span>
          </motion.p>

          <motion.p variants={fadeUp} className="text-lg text-black/60 font-medium mb-8 max-w-xl leading-relaxed">
            Belan AI answers calls, takes SMS orders, and sends them straight to your POS. No app. No account. No friction.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-row gap-3 justify-center">
            <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
              <Link href="/" className="bg-black text-white font-bold text-sm px-7 py-3 border-2 border-black tracking-wide block">GET STARTED →</Link>
            </motion.div>
            <motion.a href="#how-it-works" className="bg-white/80 text-black font-bold text-sm px-7 py-3 border-2 border-black tracking-wide block"
              whileHover={{ backgroundColor: "#000", color: "#fff", y: -2 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
              SEE HOW IT WORKS
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <RevealSection id="how-it-works" className="py-20 px-8 md:px-16 relative" style={{ zIndex: 1 }}>
        <div className="max-w-6xl mx-auto relative" style={{ zIndex: 1 }}>
          <div className="grid md:grid-cols-[3fr_1fr] gap-12 items-center">
            {/* LEFT — static info */}
            <div>
              <motion.div variants={fadeIn} className="inline-block border-2 border-black px-4 py-1.5 mb-5 text-sm font-bold"
                style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}>HOW IT WORKS</motion.div>
              <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-black leading-tight mb-10">
                Your phone answers itself —<br />
                <span style={{ color: "#ecb32e" }}>every call, every time.</span>
              </motion.h2>

              <motion.div variants={stagger} className="flex flex-col gap-4">
                {[
                  { num: "01", color: "#a4e5f8", title: "Customer calls. Belan answers.", desc: "Every call picked up on the first ring — no hold music, no missed orders, no staff needed." },
                  { num: "02", color: "#f5dda1", title: "AI takes the order naturally.", desc: "Belan knows your menu and talks like a person. Customers just say what they want." },
                  { num: "03", color: "#2fb67d", title: "Pay by text. Print in the kitchen.", desc: "Belan texts a payment link, then fires the order straight to your POS the moment they pay.", white: true },
                ].map(({ num, color, title, desc, white }) => (
                  <motion.div key={num} variants={fadeUp}
                    className="flex gap-5 items-start p-5 border-2 border-black"
                    style={{ background: "rgba(255,255,255,0.75)" }}
                    whileHover={{ x: 4, boxShadow: "4px 4px 0px #000", transition: { type: "spring", stiffness: 400, damping: 20 } }}>
                    <div className="text-xl font-black border-2 border-black w-12 h-12 flex items-center justify-center flex-shrink-0"
                      style={{ background: color, color: white ? "white" : "black", fontFamily: "Tektur, sans-serif" }}>{num}</div>
                    <div>
                      <div className="font-black text-lg text-black mb-1">{title}</div>
                      <div className="text-sm text-black leading-relaxed font-bold">{desc}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* POS row */}
              <motion.div variants={fadeIn} className="mt-8 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-black/50 mr-2">Works with</span>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#a1dfc5" }}>Clover ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#a4e5f8" }}>Toast ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#f5dda1" }}>Square ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#ecb32e" }}>Lightspeed ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#a1dfc5" }}>Revel ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold" style={{ background: "#a4e5f8" }}>TouchBistro ✓</div>
                <div className="px-3 py-1.5 border-2 border-black text-xs font-bold text-white" style={{ background: "#000" }}>+ others</div>
              </motion.div>
            </div>

            {/* RIGHT — rotating capybara */}
            <motion.div variants={scaleIn} className="flex flex-col items-center justify-center">
              <RotatingCapybara />
            </motion.div>
          </div>
        </div>
      </RevealSection>

      {/* ── PRODUCTS ── */}
      <RevealSection className="py-28 px-4 md:px-6 relative" style={{ zIndex: 1 }}>
        <div className="relative" style={{ zIndex: 1 }}>
          <motion.div variants={fadeIn} className="inline-block border-2 border-black px-4 py-1.5 mb-5 text-sm font-bold"
            style={{ background: "#a4e5f8", transform: "rotate(-1deg)" }}>EVERYTHING INCLUDED</motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-black leading-tight mb-12">
            One price.<br />
            <span style={{ color: "#ecb32e" }}>Five products.</span>
          </motion.h2>

          <ProductCards />
        </div>
      </RevealSection>

      {/* ── SANDBOX ── */}
      <SandboxSection />

      {/* ── TESTIMONIALS ── */}
      <RevealSection className="py-20 px-8 md:px-16 relative overflow-hidden" style={{ zIndex: 1 }}>
        {/* faded background capybara */}
        <div className="hidden lg:block absolute right-0 bottom-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.06 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/capybaraPics/twotalkingontable.svg" alt="" className="h-80 w-auto" />
        </div>

        <div className="max-w-5xl mx-auto relative" style={{ zIndex: 1 }}>
          <motion.div variants={fadeIn} className="inline-block border-2 border-black px-4 py-1.5 mb-5 text-sm font-bold"
            style={{ background: "#2fb67d", color: "white", transform: "rotate(-1deg)" }}>WHAT RESTAURANTS SAY</motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-black mb-12">
            Real restaurants. Real results.
          </motion.h2>

          <motion.div variants={stagger} className="grid md:grid-cols-3 gap-0">
            {[
              { name: "Lime N Dime", quote: "We were drowning during dinner rush. Now our phones answer themselves and orders go straight to Clover.", color: "#a4e5f8" },
              { name: "Epic Pizza", quote: "Customers love texting their order. Fewer mistakes, faster kitchen, and zero hold music.", color: "#f5dda1" },
              { name: "Shaghf", quote: "Setup took 20 minutes. Belan connected to our POS and started taking orders the same day.", color: "#a1dfc5" },
            ].map(({ name, quote, color }) => (
              <motion.div key={name} variants={fadeUp}
                className="p-6 border-2 border-black -ml-[2px] relative"
                style={{ background: "rgba(255,255,255,0.8)", borderLeft: `6px solid ${color}` }}
                whileHover={{ y: -4, boxShadow: "4px 4px 0px #000", transition: { type: "spring", stiffness: 400, damping: 20 } }}>
                <div className="text-5xl font-black mb-3 leading-none" style={{ color, fontFamily: "Tektur, sans-serif" }}>"</div>
                <p className="text-sm font-medium text-black/80 leading-relaxed mb-4">{quote}</p>
                <div className="font-black text-sm text-black">{name}</div>
                <div className="text-xs text-black/50 font-medium">— Owner</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </RevealSection>

      {/* ── PRICING ── */}
      <RevealSection id="pricing" className="py-20 px-8 md:px-16" style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeIn} className="inline-block border-2 border-black px-4 py-1.5 mb-5 text-sm font-bold"
            style={{ background: "#f5dda1", transform: "rotate(-1deg)" }}>PRICING</motion.div>
          <motion.h2 variants={fadeUp} className="text-4xl font-black text-black mb-2">One price. Every AI. Unlimited.</motion.h2>
          <motion.p variants={fadeIn} className="text-black/60 mb-10 font-medium">Voice AI, SMS ordering, Dashboard, Recommendations — all included. No per-order fees.</motion.p>

          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* pricing card */}
            <motion.div variants={scaleIn} className="border-2 border-black p-8"
              style={{ background: "rgba(255,255,255,0.85)" }}
              whileHover={{ y: -4, boxShadow: "6px 6px 0px #000", transition: { type: "spring", stiffness: 300, damping: 20 } }}>
              <div className="mb-6">
                <span className="text-6xl font-black text-black" style={{ fontFamily: "Tektur, sans-serif" }}>$200</span>
                <span className="text-black/60 font-bold"> / mo</span>
                <motion.span className="ml-3 text-xs font-bold border-2 border-black px-2 py-1 inline-block" style={{ background: "#f5dda1" }}
                  whileHover={{ scale: 1.08, rotate: -2 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}>
                  ONLY $6.67/DAY
                </motion.span>
              </div>

              <motion.div variants={staggerFast} className="flex flex-col gap-2 mb-8">
                {[
                  "Voice AI Ordering — unlimited concurrent calls",
                  "SMS Text-to-Order — unlimited messages",
                  "Dedicated Belan AI phone number",
                  "Direct Clover POS Integration",
                  "Smart Dashboard — real-time analytics",
                  "AI Recommendation Engine",
                  "Custom AI Voice & Greeting",
                  "FAQ & Upsell Rule Builder",
                  "Stripe Payment Processing",
                  "86 Detection & Menu Availability Toggles",
                  "SMS Marketing Campaigns",
                  "Best support in the restaurant universe",
                ].map((item) => (
                  <motion.div key={item} variants={fadeIn} className="flex items-start gap-2 text-sm font-medium text-black">
                    <span className="font-black flex-shrink-0" style={{ color: "#ecb32e" }}>→</span>
                    {item}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 18 }} className="inline-block">
                <Link href="/" className="inline-block bg-black text-white font-bold text-sm px-8 py-3 border-2 border-black tracking-wide">
                  GET STARTED →
                </Link>
              </motion.div>
              <span className="ml-4 text-xs text-black/40 font-medium">No credit card required</span>
            </motion.div>

            {/* capybara beside pricing */}
            <motion.div variants={fadeIn} className="flex flex-col items-center justify-center gap-4 hidden md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/capybaraPics/waiter_explaining_the_cost_of_a_menu_item.svg" alt="" className="h-64 w-auto object-contain" />
              <p className="text-sm font-bold text-center text-black/60 max-w-xs">
                Less than a single no-show costs you. Belan pays for itself after one busy Friday.
              </p>
            </motion.div>
          </div>

          <motion.p variants={fadeIn} className="text-sm mt-6 font-medium text-black/60">
            Have 10+ locations?{" "}
            <a href="#" className="font-bold text-black underline">Talk to us about custom pricing.</a>
          </motion.p>
        </div>
      </RevealSection>

      {/* ── CTA Band ── */}
      <RevealSection className="py-20 px-8 md:px-16 text-center" style={{ background: "#2fb67d", position: "relative", zIndex: 1 }}>
        <motion.h2 variants={fadeUp} className="text-5xl font-black text-black mb-4 leading-tight">
          Ready to let AI take the calls? 📞
        </motion.h2>
        <motion.p variants={fadeUp} className="text-black/70 text-lg font-medium mb-8">
          Set up in 30 minutes. Works with your existing POS. No app required.
        </motion.p>
        <motion.div variants={staggerFast} className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.div variants={fadeIn} whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
            <Link href="/" className="bg-black text-white font-bold text-sm px-10 py-3 border-2 border-black tracking-wide block">BOOK A DEMO →</Link>
          </motion.div>
          <motion.div variants={fadeIn} whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
            <Link href="/login" className="bg-white text-black font-bold text-sm px-10 py-3 border-2 border-black tracking-wide block">LOG IN TO DASHBOARD</Link>
          </motion.div>
        </motion.div>
      </RevealSection>

      {/* ── Footer ── */}
      <footer className="py-6 px-8" style={{ position: "relative", zIndex: 1 }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/BelanLogo.png" alt="Belan AI" className="w-7 h-7 rounded-full object-cover border-2 border-black" />
            <span className="font-black text-black text-xs tracking-widest">BELAN AI</span>
          </div>
          <div className="flex gap-6 text-xs font-bold tracking-widest text-black/50">
            {["PRIVACY", "TERMS", "DOCS"].map((l) => (
              <a key={l} href="#" className="hover:text-black transition-colors">{l}</a>
            ))}
            <Link href="/login" className="hover:text-black transition-colors">LOG IN</Link>
          </div>
          <p className="text-xs font-bold tracking-widest text-black/40">© 2026 BELAN AI</p>
        </div>
      </footer>
    </div>
  );
}
