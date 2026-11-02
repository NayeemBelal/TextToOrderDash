import type { Metadata } from "next";
import SquarePage from "./SquarePage";
import { salesAwareMetadata } from "@/lib/sales-mode-server";

const metadata: Metadata = {
  title: "Square POS Voice AI Integration | AI Phone Ordering | Belan AI",
  description:
    "Connect Belan AI's restaurant voice AI to your Square POS in minutes. AI answers every call via voice or SMS and fires it to Square automatically. $200/month flat.",
  alternates: {
    canonical: "https://belan.tech/integrations/square",
  },
  openGraph: {
    title: "Square POS Voice AI Integration | AI Phone Ordering | Belan AI",
    description:
      "Belan AI connects directly to Square. Every phone call and text order fires to your Square POS automatically. $200/month flat.",
    url: "https://belan.tech/integrations/square",
    siteName: "Belan AI",
    type: "website",
    locale: "en_US",
  },
};

export const generateMetadata = salesAwareMetadata(metadata, {
  description:
    "Connect Belan AI's restaurant voice AI to your Square POS in minutes. AI answers every call via voice or SMS and fires it to Square automatically.",
  ogDescription:
    "Belan AI connects directly to Square. Every phone call and text order fires to your Square POS automatically.",
});

export default function SquareIntegrationPage() {
  return <SquarePage />;
}
