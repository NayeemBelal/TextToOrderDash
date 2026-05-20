import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "How Restaurant Voice AI Works | Belan AI",
  description:
    "Learn how AI phone ordering works for restaurants — how Belan AI answers calls, takes orders, integrates with your POS, and fires orders to your kitchen automatically.",
  alternates: {
    canonical: "https://belan.tech/how-it-works",
  },
  openGraph: {
    title: "How Restaurant Voice AI Works | Belan AI",
    description:
      "How Belan AI answers every restaurant call, takes the order, and fires it to your POS automatically — $200/month flat.",
    url: "https://belan.tech/how-it-works",
    siteName: "Belan AI",
    type: "website",
    locale: "en_US",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is AI phone ordering accurate enough for real restaurants?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI achieves 99%+ order accuracy by combining natural language understanding with your restaurant's exact menu, modifier rules, and pricing. It confirms every order back to the customer before checkout to eliminate errors.",
      },
    },
    {
      "@type": "Question",
      name: "What happens if a customer has a complex modification?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI handles common modifications — extra sauce, no onions, allergy substitutions — based on your configured modifier rules. For modifications outside your menu rules, the AI collects the order details and flags it for staff review before the POS ticket prints.",
      },
    },
    {
      "@type": "Question",
      name: "Can AI phone ordering replace my front-of-house staff?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI handles all inbound phone and text orders, freeing your team to focus on in-person guests and food preparation. It is not designed to replace all front-of-house functions, but it eliminates phone duty entirely — which typically consumes 1–3 hours of staff time per dinner shift in a busy restaurant.",
      },
    },
  ],
};


export default function HowItWorksPage() {
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
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20 overflow-hidden" style={{ background: "#a1dfc5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            <div className="flex-1">
              <span className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5 bg-white">
                HOW IT WORKS
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black leading-tight mb-5">
                Your phone.<br />Now run by AI.
              </h1>
              <p className="text-base sm:text-lg font-bold text-black/70 leading-relaxed max-w-md">
                Belan AI answers every call, takes the full order, collects payment, and fires the ticket to your POS — all without a single staff member picking up the phone.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="tel:+18554852690"
                  className="bg-black text-white font-bold text-xs px-6 py-3 border-2 border-black tracking-wide text-center"
                >
                  CALL THE LIVE DEMO: (855) 485-2690
                </a>
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/baristatalkingonphone.svg"
                alt="Barista answering restaurant calls with Belan AI voice ordering"
                width={300}
                height={300}
                className="w-44 sm:w-60 md:w-72 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Big statement */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#000" }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight">
            Phone rings.<br />
            <span style={{ color: "#a1dfc5" }}>AI answers.</span><br />
            Order prints. You win.
          </p>
        </div>
      </section>

      {/* Step 1 */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#a4e5f8" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-shrink-0 flex justify-center order-2 md:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/talkingonphone.svg"
                alt="Restaurant customer placing a phone order"
                width={260}
                height={260}
                className="w-40 sm:w-52 md:w-60 h-auto"
              />
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="text-6xl font-black text-black/10 mb-2 leading-none">01</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-4">
                Customer calls<br />or texts.
              </h2>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed mb-4">
                Belan AI picks up on the first ring — no hold music, no voicemail. It greets the caller with your custom voice and greeting, then asks what they&apos;d like to order.
              </p>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed">
                Prefer to text? Customers can also SMS your number to place an order. Belan AI handles both channels simultaneously, 24/7, with no concurrent call limit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#f5dda1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1">
              <div className="text-6xl font-black text-black/10 mb-2 leading-none">02</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-4">
                AI takes the<br />full order.
              </h2>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed mb-4">
                The caller speaks naturally — &ldquo;large pepperoni, no olives, and a Diet Coke.&rdquo; Belan AI parses every item, maps it to your exact menu, applies modifiers, checks allergy history for returning guests, and upsells based on your rules.
              </p>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed">
                Before checkout, the AI reads the order back verbatim. That confirmation step is why Belan AI hits 99%+ order accuracy — every time, on every call.
              </p>
            </div>
            <div className="flex-shrink-0 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/waiter_recommending_from_menu.svg"
                alt="AI recommending menu items and taking restaurant orders"
                width={260}
                height={260}
                className="w-40 sm:w-52 md:w-60 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#fbc8d4" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-shrink-0 flex justify-center order-2 md:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/baristatexting.svg"
                alt="Customer paying for restaurant order via text message"
                width={260}
                height={260}
                className="w-40 sm:w-52 md:w-60 h-auto"
              />
            </div>
            <div className="flex-1 order-1 md:order-2">
              <div className="text-6xl font-black text-black/10 mb-2 leading-none">03</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-4">
                Payment collected<br />by text.
              </h2>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed mb-4">
                Once the order is confirmed, Belan AI texts the customer a secure payment link. They pay in seconds on their phone — no card reader, no cash handling, no staff needed.
              </p>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed">
                Payment is processed and confirmed before any ticket ever hits your kitchen. No more &ldquo;they didn&apos;t show up to pay.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4 */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#a1dfc5" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
            <div className="flex-1">
              <div className="text-6xl font-black text-black/10 mb-2 leading-none">04</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-4">
                Order fires<br />to your POS.
              </h2>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed mb-4">
                The moment payment clears, Belan AI sends the order to your POS as a standard ticket. It appears in your kitchen printer exactly like any other order — your team sees it, makes it, done.
              </p>
              <p className="text-sm sm:text-base font-bold text-black/70 leading-relaxed">
                Works with Clover, Toast, Square, Lightspeed, Revel, and TouchBistro. Your menu syncs automatically — price changes, 86&apos;d items, daily specials — all reflected instantly.
              </p>
            </div>
            <div className="flex-shrink-0 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/runningwithpizza.svg"
                alt="Restaurant order automatically sent to POS and kitchen"
                width={260}
                height={260}
                className="w-40 sm:w-52 md:w-60 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-12 md:py-16" style={{ background: "#000" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-2 border-white/20">
            {[
              { stat: "99%+", label: "Order accuracy" },
              { stat: "$200", label: "Per month, flat" },
              { stat: "24/7", label: "Always answering" },
              { stat: "∞", label: "Concurrent calls" },
            ].map(({ stat, label }) => (
              <div key={label} className="border-b-2 md:border-b-0 md:border-r-2 last:border-0 border-white/20 p-6 md:p-8 text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1">{stat}</div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup section */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#f5dda1" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-start">
            <div className="flex-1">
              <span className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5 bg-white">
                SETUP
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-2">
                Live in 20 minutes.
              </h2>
              <p className="text-sm sm:text-base font-bold text-black/60 mb-8">No IT. No hardware. No headaches.</p>
              <ol className="flex flex-col gap-5">
                {[
                  { n: "01", t: "Connect your POS", d: "Authorize Clover, Toast, or any supported POS. Your full menu — items, modifiers, pricing — syncs automatically." },
                  { n: "02", t: "Choose your voice", d: "Pick an AI voice that fits your brand. Type your greeting. Preview it before going live." },
                  { n: "03", t: "Set your rules", d: "Configure upsell pairings, allergy flags, and how to handle questions about hours, parking, and specials." },
                  { n: "04", t: "Go live", d: "Forward your restaurant number to your Belan AI line. The AI starts answering every call immediately." },
                ].map(({ n, t, d }) => (
                  <li key={n} className="flex gap-4 items-start">
                    <span className="border-2 border-black w-10 h-10 flex-shrink-0 flex items-center justify-center font-black text-sm bg-white">
                      {n}
                    </span>
                    <div>
                      <div className="font-black text-sm sm:text-base text-black mb-0.5">{t}</div>
                      <div className="text-sm text-black/60 font-bold leading-relaxed">{d}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex-shrink-0 flex justify-center mx-auto md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/chefTakingSelfie.svg"
                alt="Restaurant chef celebrating easy AI phone ordering setup"
                width={220}
                height={220}
                className="w-36 md:w-52 h-auto self-center"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POS integrations */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-12 md:py-16 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-6" style={{ background: "#a4e5f8" }}>
            POS INTEGRATIONS
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-black mb-2">Works with your POS.</h2>
          <p className="text-sm sm:text-base font-bold text-black/60 mb-10">Connect once. Orders flow automatically.</p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            {[
              { name: "Clover", logo: "/integrations/cloverLogo.png", href: "/integrations/clover" },
              { name: "Toast", logo: "/integrations/ToastLogo.png", href: "/integrations/toast" },
              { name: "Square", logo: "/integrations/SquareLogo.png", href: "/integrations/square" },
            ].map(({ name, logo, href }) => (
              <Link
                key={name}
                href={href}
                className="flex items-center gap-3 border-2 border-black px-5 py-3 hover:bg-black hover:text-white transition-colors group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="w-7 h-7 bg-white flex items-center justify-center flex-shrink-0">
                  <img src={logo} alt={`${name} POS logo`} width={28} height={28} className="w-full h-full object-contain" />
                </div>
                <span className="font-black text-sm tracking-wide">{name}</span>
                <span className="text-xs font-bold text-black/40 group-hover:text-white/60">→</span>
              </Link>
            ))}
            {["Lightspeed", "Revel", "TouchBistro"].map((pos) => (
              <div key={pos} className="flex items-center gap-2 border-2 border-black/20 px-5 py-3">
                <span className="font-black text-sm text-black/40 tracking-wide">{pos}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row gap-10 md:gap-16 items-center">
            <div className="flex-1">
              <span className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5" style={{ background: "#a1dfc5" }}>
                VS. PHONE STAFF
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-black leading-tight mb-6">
                AI beats a phone<br />employee every time.
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Monthly cost", ai: "$200 flat", human: "$2,000–$4,000+" },
                  { label: "Availability", ai: "24/7, unlimited", human: "Shift hours only" },
                  { label: "Concurrent calls", ai: "Unlimited", human: "1 per employee" },
                  { label: "Order accuracy", ai: "99%+", human: "Drops during rush" },
                  { label: "Upsell every call", ai: "Always", human: "Hit or miss" },
                  { label: "Setup time", ai: "20 minutes", human: "Weeks to hire + train" },
                ].map(({ label, ai, human }) => (
                  <div key={label} className="grid grid-cols-3 border-b border-black/10 last:border-0 py-2.5 gap-2">
                    <div className="text-xs font-bold text-black/40 uppercase tracking-widest self-center">{label}</div>
                    <div className="font-black text-sm text-black flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#2fb67d" }} />
                      {ai}
                    </div>
                    <div className="font-bold text-sm text-black/40">{human}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 flex justify-center mx-auto md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/capybaraPics/twotalkingontable.svg"
                alt="Restaurant owners comparing AI ordering vs traditional phone staff"
                width={240}
                height={240}
                className="w-40 sm:w-52 md:w-56 h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-black mb-8">Common questions</h2>
          <div className="border-2 border-black bg-white">
            {[
              {
                q: "Is AI phone ordering accurate enough for real restaurants?",
                a: "Belan AI achieves 99%+ order accuracy by combining natural language understanding with your exact menu, modifier rules, and pricing. Every order is confirmed back to the customer before checkout — errors are caught in conversation, not when wrong food arrives.",
              },
              {
                q: "What happens if a customer has a complex modification?",
                a: "Belan AI handles modifications — extra sauce, no onions, allergy substitutions — based on your configured modifier rules. For requests outside your menu rules, the AI collects the details and flags it for staff review before the POS ticket prints.",
              },
              {
                q: "Can AI phone ordering replace my front-of-house staff?",
                a: "Belan AI eliminates phone duty entirely — which typically takes 1–3 hours of staff time per dinner shift. Your team can focus on in-person guests and food prep instead of answering the same questions over and over.",
              },
              {
                q: "How accurate is AI phone ordering?",
                a: "Belan AI achieves 99%+ order accuracy. This comes from the confirmation step before checkout — every order is read back verbatim before payment is requested. Customers confirm or correct before any ticket is sent to the kitchen.",
              },
              {
                q: "What if a customer calls during a dinner rush?",
                a: "Belan AI handles unlimited concurrent calls 24/7. It doesn't matter if 50 people call at the same time during your Saturday dinner rush — every call is answered on the first ring.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b-2 last:border-b-0 border-black px-6 py-5">
                <div className="font-black text-sm sm:text-base text-black mb-1.5">{q}</div>
                <div className="text-sm sm:text-base text-black/60 font-bold leading-relaxed">{a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#2fb67d" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black leading-tight mb-3">
              Hear it for yourself.
            </h2>
            <p className="text-sm sm:text-base font-bold text-black/70 mb-6">
              Call <strong>(855) 485-2690</strong> right now — no signup, no demo request. Belan AI answers and takes a real order, 24/7.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://calendar.app.google/uCwfd2qfNtjJMSca9"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black text-white font-bold text-xs px-8 py-3 border-2 border-black tracking-wide text-center"
              >
                BOOK A DEMO →
              </a>
              <Link href="/register" className="bg-white text-black font-bold text-xs px-8 py-3 border-2 border-black tracking-wide text-center">
                GET STARTED FREE →
              </Link>
            </div>
          </div>
          <div className="flex-shrink-0 flex justify-center mx-auto md:mx-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/capybaraPics/scooterguytalkingonphone.svg"
              alt="Restaurant delivery driver using AI phone ordering system"
              width={200}
              height={200}
              className="w-36 md:w-48 h-auto"
            />
          </div>
        </div>
      </section>

      {/* Footer links */}
      <div className="border-t-2 border-black px-4 sm:px-8 py-5 flex flex-wrap gap-4 bg-white">
        <Link href="/integrations/clover" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Clover POS integration →</Link>
        <Link href="/integrations/toast" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Toast POS integration →</Link>
        <Link href="/integrations/square" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Square POS integration →</Link>
        <Link href="/about" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">About Belan AI →</Link>
        <Link href="/" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Belan AI home →</Link>
      </div>
    </div>
  );
}
