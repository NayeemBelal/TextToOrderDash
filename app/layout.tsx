import type { Metadata } from "next";
import { Tektur } from "next/font/google";
import "./globals.css";
import { ConditionalWrapper } from "@/components/ConditionalWrapper";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

const tektur = Tektur({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-tektur",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://belan.tech"),
  title: "Gamified SMS Marketing for Restaurants | Belan AI",
  description:
    "Belan texts your customers a quick game — trivia, pick a number, roll the dice — and turns every reply into a coupon they redeem at your register. $200/month flat.",
  alternates: {
    canonical: "https://belan.tech",
  },
  openGraph: {
    title: "Gamified SMS Marketing — Games, Not Spam | Belan AI",
    description:
      "Text your customers a game, not a coupon blast. Winners and players alike walk in with a real POS coupon. $200/month flat, phone number included.",
    url: "https://belan.tech",
    siteName: "Belan AI",
    images: [
      {
        url: "https://belan.tech/og-screenshot.png",
        width: 3024,
        height: 1640,
        alt: "Belan AI gamified SMS marketing dashboard",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://belan.tech/og-screenshot.png"],
  },
  icons: {
    icon: [
      { url: "/BelanLogo.png", sizes: "32x32", type: "image/png" },
      { url: "/BelanLogo.png", sizes: "64x64", type: "image/png" },
      { url: "/BelanLogo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/BelanLogo.png", sizes: "180x180", type: "image/png" },
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Belan AI",
  url: "https://belan.tech",
  description:
    "Gamified SMS marketing for restaurants: Belan texts customers a quick game, turns every reply into a real POS coupon, tracks the revenue it brings back, and keeps a full per-customer timeline.",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Restaurant Management Software",
  operatingSystem: "Web",
  browserRequirements: "Requires a modern web browser",
  offers: {
    "@type": "Offer",
    name: "Belan AI Monthly Plan",
    price: "200.00",
    priceCurrency: "USD",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "200.00",
      priceCurrency: "USD",
      billingDuration: "P1M",
      unitCode: "MON",
    },
    description:
      "Flat rate $200/month. Includes your own marketing phone number, unlimited game and promo campaigns, branded coupon pages, POS revenue tracking, and the customer timeline. Branded RCS sender available for a $500/year carrier registration fee.",
    url: "https://belan.tech",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Gamified SMS campaigns — trivia, pick-a-number, dice, closest-guess, random draws",
    "Curated game catalog plus a build-your-own game creator",
    "Everyone-wins and promotional message campaigns",
    "Branded coupon pages that become real POS discounts",
    "Referral bonuses and QR-code sign-up forms",
    "Revenue attribution from POS orders that used a coupon",
    "Per-customer timeline: texts, games, coupons, and orders",
    "POS integration with Clover (Toast and Square coming)",
  ],
  screenshot: "https://belan.tech/og-screenshot.png",
  provider: {
    "@type": "Organization",
    name: "Belan AI",
    url: "https://belan.tech",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Belan AI",
  url: "https://belan.tech",
  logo: {
    "@type": "ImageObject",
    url: "https://belan.tech/BelanLogo.png",
    width: 192,
    height: 192,
  },
  description:
    "Belan AI builds gamified SMS marketing for restaurants — text games that bring customers back with real POS coupons — alongside voice and text ordering automation.",
  areaServed: "US",
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+18554852690",
    contactType: "customer support",
    availableLanguage: "English",
  },
  sameAs: ["https://www.instagram.com/belantech"],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Belan AI Gamified SMS Marketing",
  serviceType: "Restaurant SMS Marketing Automation",
  description:
    "Belan AI runs gamified text-message campaigns for restaurants: customers play a quick game by text and redeem a real POS coupon. $200/month flat rate.",
  url: "https://belan.tech",
  provider: {
    "@type": "Organization",
    name: "Belan AI",
    url: "https://belan.tech",
  },
  areaServed: {
    "@type": "Country",
    name: "United States",
  },
  offers: {
    "@type": "Offer",
    price: "200.00",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "200.00",
      priceCurrency: "USD",
      billingDuration: "P1M",
    },
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Belan AI",
  url: "https://belan.tech",
  description:
    "Gamified SMS marketing for restaurants — plus voice and text ordering — $200/month flat rate.",
  inLanguage: "en-US",
  publisher: {
    "@type": "Organization",
    name: "Belan AI",
    url: "https://belan.tech",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={tektur.variable} suppressHydrationWarning>
      <body className="antialiased">
        <script
          // Apply the saved dashboard theme before first paint (no flash).
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(serviceSchema),
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <ConditionalWrapper>{children}</ConditionalWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
