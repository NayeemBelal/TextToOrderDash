import type { Metadata } from "next";
import Link from "next/link";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Docs | Belan AI",
  description:
    "Guides for setting up Belan: the onboarding playbook from sign-up to your first campaign, the contact spreadsheet template, and where to get help.",
  alternates: { canonical: "https://belan.tech/docs" },
  openGraph: {
    title: "Belan Docs",
    description:
      "The onboarding playbook from sign-up to your first campaign, the contact spreadsheet template, and where to get help.",
    url: "https://belan.tech/docs",
    siteName: "Belan AI",
    type: "website",
  },
};

const ACCENT = "#c4b5fd";
const BOOK_CALL = "https://calendar.app.google/uCwfd2qfNtjJMSca9";

const DOCS = [
  {
    href: "/docs/onboarding-playbook.html",
    emoji: "📘",
    title: "Onboarding playbook",
    desc: "Every step from creating the account to a launched campaign: payment, the POS API key, branding, the QR sign-up link, importing a spreadsheet of contacts, and the first game tested on your own phone. Annotated screenshots throughout.",
    cta: "Open the playbook →",
    color: ACCENT,
    external: true,
  },
  {
    href: "/belan-contacts-example.xlsx",
    emoji: "📄",
    title: "Contact spreadsheet template",
    desc: "The layout Belan reads when you import contacts: a phone column is all that is required, names are optional, any US number format works. Download it, paste your list in, and drop it on the Contacts page.",
    cta: "Download the template (.xlsx)",
    color: "#a4e5f8",
    external: true,
  },
  {
    href: "/deck",
    emoji: "🎯",
    title: "Sales deck",
    desc: "Fifteen slides on how Belan works: games your customers reply to, prizes they earn and redeem before they expire, and a list that grows through referrals and QR sign-up. Arrow keys to move, N for presenter notes, P to print.",
    cta: "Open the deck →",
    color: "#fbc8d4",
    external: true,
  },
  {
    href: BOOK_CALL,
    emoji: "🗓️",
    title: "Set up with a real person",
    desc: "A 30-minute call where we provision your number, connect your register, brand your coupon pages and build the first game with you.",
    cta: "Book a setup call →",
    color: "#a1dfc5",
    external: true,
  },
];

const QUICK_LINKS = [
  { label: "Create the account", href: "/docs/onboarding-playbook.html#s1" },
  { label: "Payment", href: "/docs/onboarding-playbook.html#s4" },
  { label: "Connect the POS (API key)", href: "/docs/onboarding-playbook.html#s6" },
  { label: "Branding", href: "/docs/onboarding-playbook.html#s7" },
  { label: "QR sign-up link", href: "/docs/onboarding-playbook.html#s8" },
  { label: "Import contacts (Excel)", href: "/docs/onboarding-playbook.html#s9" },
  { label: "First campaign", href: "/docs/onboarding-playbook.html#s10" },
  { label: "Problems & who to call", href: "/docs/onboarding-playbook.html#s12" },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-white text-black font-tektur">
      <SiteNav />

      <section className="max-w-[1200px] mx-auto px-6 md:px-10 pt-16 pb-10">
        <span
          className="inline-block border-2 border-black px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em]"
          style={{ background: ACCENT }}
        >
          Docs
        </span>
        <h1 className="mt-5 text-4xl md:text-6xl font-black leading-[0.98] tracking-tight max-w-[18ch]">
          Everything you need to get a restaurant live on Belan.
        </h1>
        <p className="mt-5 text-base md:text-lg font-bold text-black/60 max-w-[60ch] leading-relaxed">
          Written for the person doing the setup, in the order it happens. Each step says where to click, what to say, and what done looks like.
        </p>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-10 pb-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DOCS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              target={d.external ? "_blank" : undefined}
              rel={d.external ? "noopener noreferrer" : undefined}
              className="flex flex-col border-2 border-black bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#000]"
            >
              <span
                className="w-12 h-12 flex items-center justify-center border-2 border-black text-2xl"
                style={{ background: d.color }}
                aria-hidden
              >
                {d.emoji}
              </span>
              <h2 className="mt-4 text-xl font-black leading-tight">{d.title}</h2>
              <p className="mt-2 text-sm font-bold text-black/60 leading-relaxed flex-1">{d.desc}</p>
              <span className="mt-5 text-xs font-black uppercase tracking-widest">{d.cta}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 md:px-10 pb-20">
        <div className="border-2 border-black p-6 md:p-8" style={{ background: "#faf8ff" }}>
          <h2 className="text-lg font-black uppercase tracking-widest">Jump straight to a step</h2>
          <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((q) => (
              <li key={q.href}>
                <a
                  href={q.href}
                  className="text-sm font-bold underline decoration-2 underline-offset-4 hover:bg-black hover:text-white"
                >
                  {q.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="bg-white border-t-2 border-black">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold tracking-widest text-black/60">
          <Link href="/" className="hover:text-black transition-colors">← BACK TO BELAN.TECH</Link>
          <span className="text-black/40">© 2026 BELAN AI</span>
        </div>
      </footer>
    </div>
  );
}
