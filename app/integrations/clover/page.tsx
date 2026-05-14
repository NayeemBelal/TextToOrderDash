import type { Metadata } from "next";
import CloverPage from "./CloverPage";

export const metadata: Metadata = {
  title: "Clover POS Voice AI Integration | AI Phone Ordering | Belan AI",
  description:
    "Connect Belan AI's restaurant voice AI to your Clover POS in minutes. AI answers every call via voice or SMS and fires it to Clover automatically. $200/month flat.",
  alternates: {
    canonical: "https://belan.tech/integrations/clover",
  },
  openGraph: {
    title: "Clover POS Voice AI Integration | AI Phone Ordering | Belan AI",
    description:
      "Belan AI connects directly to Clover. Every phone call and text order fires to your Clover POS automatically. $200/month flat.",
    url: "https://belan.tech/integrations/clover",
    siteName: "Belan AI",
    type: "website",
    locale: "en_US",
  },
};

export default function CloverIntegrationPage() {
  return <CloverPage />;
}
