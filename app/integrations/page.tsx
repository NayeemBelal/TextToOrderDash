import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Restaurant Voice AI POS Integrations | Clover, Toast & Square | Belan AI",
  description:
    "Connect Belan AI's restaurant voice AI to your POS. Native integrations with Clover, Toast, and Square — orders fire to your kitchen automatically. $200/month flat.",
  alternates: {
    canonical: "https://belan.tech/integrations",
  },
  openGraph: {
    title: "Restaurant Voice AI POS Integrations | Clover, Toast & Square | Belan AI",
    description:
      "Belan AI's restaurant voice AI connects natively to Clover, Toast, and Square. Every call answered, every order fired to your POS. $200/month flat.",
    url: "https://belan.tech/integrations",
    siteName: "Belan AI",
    type: "website",
    locale: "en_US",
  },
};

const integrationListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Belan AI POS Integrations",
  description: "Restaurant voice AI integrations for Clover, Toast, and Square POS systems.",
  url: "https://belan.tech/integrations",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Belan AI + Clover POS Integration",
      url: "https://belan.tech/integrations/clover",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Belan AI + Toast POS Integration",
      url: "https://belan.tech/integrations/toast",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Belan AI + Square POS Integration",
      url: "https://belan.tech/integrations/square",
    },
  ],
};

const integrations = [
  {
    name: "Clover",
    href: "/integrations/clover",
    logo: "/integrations/cloverLogo.png",
    color: "#a1dfc5",
    description:
      "Belan AI connects directly to Clover via the Clover API. Your menu syncs automatically — items, modifiers, prices, 86'd items. Orders fire to your Clover ticket queue the moment payment clears.",
    cta: "Clover POS voice AI integration →",
  },
  {
    name: "Toast",
    href: "/integrations/toast",
    logo: "/integrations/ToastLogo.png",
    color: "#f5dda1",
    description:
      "Belan AI integrates with Toast POS to route every phone and SMS order directly into your Toast system as a standard ticket. No manual entry, no missed calls.",
    cta: "Toast POS voice AI integration →",
  },
  {
    name: "Square",
    href: "/integrations/square",
    logo: "/integrations/SquareLogo.png",
    color: "#a4e5f8",
    description:
      "Belan AI connects to Square and fires orders directly to your Square POS. Your full menu syncs automatically and updates in real time when you make changes.",
    cta: "Square POS voice AI integration →",
  },
];

const comingSoon = ["Lightspeed", "Revel", "TouchBistro"];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Tektur, sans-serif" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(integrationListSchema) }}
      />

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

      <SiteNav />

      {/* Hero */}
      <section className="relative border-b-2 border-black px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#a4e5f8" }}>
        <div className="max-w-5xl mx-auto">
          <span className="inline-block border-2 border-black px-3 py-1 text-[10px] font-bold uppercase tracking-widest mb-5 bg-white">
            POS INTEGRATIONS
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-black leading-tight mb-5">
            Restaurant Voice AI<br />Works With Your POS.
          </h1>
          <p className="text-base sm:text-lg font-bold text-black/70 leading-relaxed max-w-xl">
            Belan AI connects natively to your POS system. Every phone call and text order is answered by AI and fired straight to your kitchen — no manual entry, no missed orders.
          </p>
        </div>
      </section>

      {/* Integration cards */}
      <section className="relative px-4 sm:px-8 md:px-16 py-14 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-0 border-2 border-black">
            {integrations.map(({ name, href, logo, color, description, cta }) => (
              <div
                key={name}
                className="border-b-2 last:border-b-0 border-black flex flex-col sm:flex-row items-start gap-6 p-8"
              >
                <div
                  className="w-16 h-16 border-2 border-black flex items-center justify-center p-2 flex-shrink-0"
                  style={{ background: color }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt={`${name} POS logo`} width={48} height={48} className="w-full h-full object-contain" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl sm:text-2xl font-black text-black mb-2">{name} POS</h2>
                  <p className="text-sm font-bold text-black/60 leading-relaxed mb-4">{description}</p>
                  <Link
                    href={href}
                    className="inline-block bg-black text-white font-bold text-xs px-5 py-2.5 border-2 border-black tracking-wide hover:bg-white hover:text-black transition-colors"
                  >
                    {cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="relative border-t-2 border-black px-4 sm:px-8 md:px-16 py-12 md:py-16" style={{ background: "#000" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">COMING SOON</p>
          <div className="flex flex-wrap gap-4">
            {comingSoon.map((pos) => (
              <div key={pos} className="border-2 border-white/20 px-5 py-3">
                <span className="font-black text-sm text-white/40 tracking-wide">{pos}</span>
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-white/40 mt-4">
            Already supported — dedicated integration pages coming soon. Contact us to connect now.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-4 sm:px-8 md:px-16 py-14 md:py-20" style={{ background: "#2fb67d" }}>
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black leading-tight mb-3">
            Ready to connect your POS?
          </h2>
          <p className="text-sm sm:text-base font-bold text-black/70 mb-6">
            $200/month flat. Setup in 20 minutes. No per-order fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://calendar.app.google/uCwfd2qfNtjJMSca9"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-black text-white font-bold text-xs px-8 py-3 border-2 border-black tracking-wide text-center"
            >
              BOOK A DEMO →
            </a>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <div className="border-t-2 border-black px-4 sm:px-8 py-5 flex flex-wrap gap-4 bg-white">
        <Link href="/how-it-works" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">How restaurant voice AI works →</Link>
        <Link href="/" className="text-xs font-bold text-black underline underline-offset-2 hover:opacity-60 transition-opacity">Belan AI home →</Link>
      </div>
    </div>
  );
}
