import type { Metadata } from "next";
import ToastPage from "./ToastPage";
import { salesAwareMetadata } from "@/lib/sales-mode-server";

const metadata: Metadata = {
  title: "Toast POS Voice AI Integration | AI Phone Ordering | Belan AI",
  description:
    "Connect Belan AI's restaurant voice AI to your Toast POS in minutes. AI answers every call via voice or SMS and fires it to Toast automatically. $200/month flat.",
  alternates: {
    canonical: "https://belan.tech/integrations/toast",
  },
  openGraph: {
    title: "Toast POS Voice AI Integration | AI Phone Ordering | Belan AI",
    description:
      "Belan AI connects directly to Toast. Every phone call and text order fires to your Toast POS automatically. $200/month flat.",
    url: "https://belan.tech/integrations/toast",
    siteName: "Belan AI",
    type: "website",
    locale: "en_US",
  },
};

export const generateMetadata = salesAwareMetadata(metadata, {
  description:
    "Connect Belan AI's restaurant voice AI to your Toast POS in minutes. AI answers every call via voice or SMS and fires it to Toast automatically.",
  ogDescription:
    "Belan AI connects directly to Toast. Every phone call and text order fires to your Toast POS automatically.",
});

export default function ToastIntegrationPage() {
  return <ToastPage />;
}
