import type { Metadata } from "next";
import { Tektur } from "next/font/google";
import "./globals.css";
import { ConditionalWrapper } from "@/components/ConditionalWrapper";
import { AuthProvider } from "@/lib/auth-context";

const tektur = Tektur({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-tektur",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://belan.tech"),
  title: "Restaurant Voice AI That Answers Every Call | Belan AI",
  description:
    "Belan AI answers every restaurant call, takes the order, and fires it to your POS — automatically. $200/month all-in. No per-order fees.",
  alternates: {
    canonical: "https://belan.tech",
  },
  openGraph: {
    title: "Restaurant AI Ordering — Every Call Answered | Belan AI",
    description:
      "Belan AI picks up every call, upsells every order, and fires it to your POS. $200/month flat. No per-order fees.",
    url: "https://belan.tech",
    siteName: "Belan AI",
    images: [
      {
        url: "https://belan.tech/og-screenshot.png",
        width: 3024,
        height: 1640,
        alt: "Belan AI restaurant phone ordering dashboard",
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
    "AI-powered voice and SMS ordering automation for restaurants. Belan AI answers every call, takes orders, handles upsells, and fires them directly to your POS system.",
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
      "Flat rate $200/month. Includes Voice AI, SMS Text AI, Dashboard Analytics, Marketing AI, and Sales AI. No per-order fees.",
    url: "https://belan.tech",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "Restaurant voice AI ordering — answers every call 24/7",
    "Voice AI for restaurants — no app, no staff needed",
    "SMS text ordering — no app required",
    "Real-time revenue and orders dashboard",
    "AI-powered SMS marketing campaigns",
    "Natural language sales analytics",
    "POS integration with Clover, Toast, Square, Lightspeed, Revel, TouchBistro",
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
    "Belan AI builds restaurant ordering automation — voice AI, SMS ordering, and marketing campaigns powered by artificial intelligence.",
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
  name: "Belan AI Restaurant Voice AI Ordering",
  serviceType: "Restaurant Voice AI Phone and SMS Ordering",
  description:
    "Belan AI answers every restaurant call, takes orders via voice and SMS, upsells automatically, and fires orders to your POS. $200/month flat rate.",
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
    "AI-powered ordering automation for restaurants. Voice AI, Text AI, and marketing campaigns — $200/month flat rate.",
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
    <html lang="en" className={tektur.variable}>
      <body className="antialiased">
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
        <AuthProvider>
          <ConditionalWrapper>{children}</ConditionalWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
