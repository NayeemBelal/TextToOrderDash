import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Belan AI — The Team Behind Restaurant Phone AI",
  description:
    "Belan AI was built to solve the number one silent killer of restaurant revenue: missed calls. Meet the team and learn why we built the AI that never misses a call.",
  alternates: {
    canonical: "https://belan.tech/about",
  },
  openGraph: {
    title: "About Belan AI — The Team Behind Restaurant Phone AI",
    description:
      "Meet the team that built the AI answering system for restaurants. Learn our story, our mission, and why $200/month beats a missed order every time.",
    url: "https://belan.tech/about",
    siteName: "Belan AI",
    images: [
      {
        url: "https://belan.tech/BelanLogo.png",
        width: 512,
        height: 512,
        alt: "Belan AI Logo",
      },
    ],
    type: "website",
    locale: "en_US",
  },
};

const aboutSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Belan AI",
  url: "https://belan.tech/about",
  description:
    "Belan AI builds AI-powered phone and SMS ordering automation for restaurants. Learn about our founding story, mission, and the team behind the product.",
  mainEntity: {
    "@type": "Organization",
    name: "Belan AI",
    url: "https://belan.tech",
    logo: {
      "@type": "ImageObject",
      url: "https://belan.tech/BelanLogo.png",
    },
    description:
      "Belan AI answers every restaurant phone call, takes the order, upsells the customer, and fires the order straight to your POS — automatically. $200/month flat rate.",
    areaServed: "US",
    serviceType: "Restaurant AI Software",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+18554852690",
      contactType: "sales",
      availableLanguage: "English",
    },
    foundingDate: "2025",
    founder: [
      { "@type": "Person", name: "Nayeem Belal" },
      { "@type": "Person", name: "Rayyan Weldingwala" },
    ],
    sameAs: ["https://www.instagram.com/belantech"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Belan AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI is an AI-powered phone and SMS ordering platform for restaurants. It answers every incoming call, takes orders, upsells customers, and fires the completed order directly to your POS system — automatically, 24/7.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Belan AI cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI costs $200 per month, flat rate. That includes Voice AI, SMS Text AI, the analytics Dashboard, Marketing AI, and Sales AI. There are no per-order fees and no usage limits.",
      },
    },
    {
      "@type": "Question",
      name: "Which POS systems does Belan AI integrate with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI integrates directly with Clover, Toast, Square, Lightspeed, Revel, and TouchBistro, plus other POS systems. Setup takes approximately 20 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Belan AI built for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Belan AI is built for independent restaurants, multi-location restaurant groups, ghost kitchens, and quick-service operators who want to automate phone and SMS order taking without hiring additional staff.",
      },
    },
  ],
};

const PRODUCTS = [
  {
    name: "Voice AI",
    description:
      "Answers every incoming call within 1 second, takes the order, upsells based on the customer's taste profile, and fires it straight to your POS. No hold music. No missed calls. No extra staff.",
    highlight: "Handles unlimited concurrent calls — even during dinner rush.",
  },
  {
    name: "Text AI",
    description:
      "Lets customers order by SMS text using their regular phone number — no app download required. Same AI, same accuracy, same direct-to-POS integration.",
    highlight:
      "Orders by text work just like orders by call — no friction for the customer.",
  },
  {
    name: "Dashboard",
    description:
      "Real-time revenue, order volume, and customer insights in one place. See what's selling, when orders peak, and which menu items drive the most revenue — from any device.",
    highlight: "Built for restaurant owners, not data analysts.",
  },
  {
    name: "Marketing AI",
    description:
      "Sends targeted SMS campaigns to your existing customer base — timed to fill slow nights, promote seasonal items, or bring back lapsed regulars. No marketing expertise required.",
    highlight:
      "Uses real order history to target the right customer with the right message.",
  },
  {
    name: "Sales AI",
    description:
      "Answers natural language questions about your restaurant's sales data. Ask things like 'What were our top 5 items last Tuesday?' and get an instant answer — no SQL, no spreadsheets.",
    highlight: "Your data, in plain English, on demand.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Dinner rush used to mean constant ringing phones and stressed staff. Now Belan handles the phones and our team stays on the grill. It paid for itself in the first week.",
    name: "Owner",
    restaurant: "Lime N Dime",
  },
  {
    quote:
      "The global taste profile is a game changer. When someone visiting from out of town calls, Belan already knows their preferences — every visitor feels like a local regular.",
    name: "Owner",
    restaurant: "Epic Pizza",
  },
  {
    quote:
      "Setup took 20 minutes. We connected Clover, chose a voice, and started taking orders. The Sales AI even flagged that we were underpricing our lattes.",
    name: "Owner",
    restaurant: "Shaghf",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="bg-white min-h-screen font-tektur">
        {/* ── Nav ── */}
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b-2 border-black px-4 sm:px-8 xl:px-16 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/BelanLogo.png"
              alt="Belan AI logo"
              width={32}
              height={32}
              className="w-7 h-7 rounded-full border-2 border-black object-cover"
            />
            <span className="font-black text-black text-sm tracking-widest">
              BELAN AI
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-bold text-black/60 hover:text-black tracking-widest uppercase transition-colors"
            >
              Home
            </Link>
            <Link
              href="/#pricing"
              className="text-xs font-bold text-black/60 hover:text-black tracking-widest uppercase transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/register"
              className="bg-black text-white text-xs font-bold px-4 py-2 border-2 border-black tracking-widest hover:bg-white hover:text-black transition-colors"
            >
              GET STARTED
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="border-b-2 border-black px-4 sm:px-8 xl:px-16 py-16 sm:py-20 xl:py-24">
          <div className="max-w-4xl mx-auto">
            <div
              className="inline-block border-2 border-black px-3 py-1.5 text-xs font-bold mb-6 tracking-widest"
              style={{ background: "#a4e5f8" }}
            >
              OUR STORY
            </div>
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-black leading-tight mb-6">
              The Team Behind the AI That Never Misses a Call
            </h1>
            <p className="text-lg sm:text-xl xl:text-2xl text-black/70 font-bold leading-relaxed max-w-3xl">
              We built Belan AI because restaurants keep losing revenue to a
              problem that should have been solved years ago: a ringing phone
              that nobody answers.
            </p>
          </div>
        </section>

        {/* ── Origin Story ── */}
        <section className="border-b-2 border-black px-4 sm:px-8 xl:px-16 py-14 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-black mb-6">
              Why We Built Belan AI
            </h2>
            <div className="space-y-4 text-base sm:text-lg text-black/70 font-bold leading-relaxed">
              <p>
                Nayeem and Rayyan had a ritual — after long days at work,
                they&rsquo;d head to Lime N Dime, a local spot they loved. Great
                food. Terrible phone service. Every visit, nobody would answer
                the phone. One night they looked at each other and said,
                &ldquo;we should just fix this.&rdquo; So they did. They built
                an AI, pitched it directly to Lime N Dime, and got their first
                yes.
              </p>
              <p>
                What followed was a grind. Restaurant after restaurant, the
                answer was the same — &ldquo;AI isn&rsquo;t good enough,&rdquo;
                &ldquo;our customers won&rsquo;t like it,&rdquo;
                &ldquo;we&rsquo;ll stick with what we have.&rdquo; They kept
                going anyway. Every rejection sharpened the product. And then
                traction hit. Word spread from owner to owner, city to city.
                Turns out, every restaurant had the same problem — and Belan was
                the best one solving it.
              </p>
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="border-b-2 border-black px-4 sm:px-8 xl:px-16 py-14 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-black mb-3">
              Meet the Team
            </h2>
            <p className="text-base sm:text-lg text-black/60 font-bold mb-10">
              A lean team obsessed with one problem: making sure restaurants
              never lose another order to a missed call.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {[
                {
                  name: "Nayeem Belal",
                  title: "CEO & Co-Founder",
                  bio: "Nayeem leads product vision and business development, turning restaurant pain points into AI-powered solutions that actually ship.",
                  photo: "/capybaraPics/insuittexting.svg",
                },
                {
                  name: "Rayyan Weldingwala",
                  title: "CTO & Co-Founder",
                  bio: "Rayyan architects the AI infrastructure — from voice call processing to POS integrations — that powers every Belan AI interaction.",
                  photo: "/capybaraPics/cheftexting.svg",
                },
                {
                  name: "Uzair Quraishi",
                  title: "CMO",
                  bio: "Uzair drives growth and tells the story of how restaurants are winning back revenue they never knew they were losing.",
                  photo: "/capybaraPics/baristatexting.svg",
                },
                {
                  name: "Saad Jahangir",
                  title: "COO",
                  bio: "Saad ensures every restaurant onboarding is seamless and that operations scale without dropping the ball on customer experience.",
                  photo: "/capybaraPics/readingnews.svg",
                },
              ].map(({ name, title, bio, photo }) => (
                <div
                  key={name}
                  className="border-2 border-black -ml-[2px] -mt-[2px] p-6 flex flex-col gap-3"
                >
                  <div
                    className="w-20 h-20 border-2 border-black bg-[#a4e5f8] overflow-hidden rounded-none"
                    style={{ flexShrink: 0 }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt={`${name} — ${title}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="font-black text-base text-black">
                      {name}
                    </div>
                    <div className="text-xs font-bold text-black/50 uppercase tracking-widest">
                      {title}
                    </div>
                  </div>
                  <p className="text-sm text-black/70 font-bold leading-relaxed">
                    {bio}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-b-2 border-black px-4 sm:px-8 xl:px-16 py-14 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-black mb-10">
              Common Questions About Belan AI
            </h2>
            <div className="flex flex-col gap-0">
              {faqSchema.mainEntity.map(
                ({ name: q, acceptedAnswer: { text: a } }) => (
                  <div key={q} className="border-2 border-black -mt-[2px] p-6">
                    <h3 className="font-black text-base xl:text-lg text-black mb-2">
                      {q}
                    </h3>
                    <p className="text-sm xl:text-base text-black/70 font-bold leading-relaxed">
                      {a}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section
          className="px-4 sm:px-8 xl:px-16 py-16 sm:py-20"
          style={{ background: "#2fb67d" }}
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black text-black mb-2">
                Ready to see it in action?
              </h2>
              <p className="text-base font-bold text-black/70">
                Call or text (855) 485-2690 for a live demo — no signup
                required.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href="/register"
                className="bg-black text-white font-bold text-sm px-7 py-3 border-2 border-black tracking-widest whitespace-nowrap hover:bg-white hover:text-black transition-colors"
              >
                GET STARTED →
              </Link>
              <Link
                href="https://calendar.app.google/pSRSqBMoWzxTeMoD6"
                className="bg-white text-black font-bold text-sm px-7 py-3 border-2 border-black tracking-widest whitespace-nowrap hover:bg-black hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                BOOK A DEMO →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t-2 border-black px-4 sm:px-8 xl:px-16 py-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/BelanLogo.png"
                alt="Belan AI"
                width={28}
                height={28}
                className="w-7 h-7 rounded-full border-2 border-black object-cover"
              />
              <span className="font-black text-black text-xs tracking-widest">
                BELAN AI
              </span>
            </Link>
            <div className="flex items-center gap-4 text-xs font-bold text-black/50 tracking-widest">
              <Link
                href="/"
                className="hover:text-black transition-colors uppercase"
              >
                Home
              </Link>
              <Link
                href="/#pricing"
                className="hover:text-black transition-colors uppercase"
              >
                Pricing
              </Link>
              <Link href="/about" className="text-black uppercase">
                About
              </Link>
              <Link
                href="/privacy-policy"
                className="hover:text-black transition-colors uppercase"
              >
                Privacy
              </Link>
              <Link
                href="/terms-of-service"
                className="hover:text-black transition-colors uppercase"
              >
                Terms
              </Link>
            </div>
            <p className="text-xs font-bold text-black/40 tracking-widest">
              © {new Date().getFullYear()} BELAN AI
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
