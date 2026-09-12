import type { Metadata } from "next";
import { MARKETING_API_BASE_URL } from "@/lib/config";

// The landing-page demo texts a real SMS with a link to this page. Without
// its own metadata the link unfurled as the generic Belan screenshot; this
// gives the fictional demo restaurant the same treatment a real restaurant
// gets on /prize: an outcome-aware title and a generated, branded preview
// image (./opengraph-image.tsx).

const RESTAURANT = "Stack & Smash Burgers";

async function fetchDemo(code: string): Promise<{ is_winner?: boolean; prize_label?: string; restaurant_name?: string } | null> {
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/marketing/demo/prize/${code}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const d = await fetchDemo(code);
  const name = d?.restaurant_name || RESTAURANT;
  const won = d?.is_winner ?? code.startsWith("WIN");
  const title = won ? `You won at ${name}! 🎉` : `A reward from ${name} 🎁`;
  const description = d?.prize_label
    ? `${d.prize_label} — tap to see your coupon.`
    : "Tap to see your coupon.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function DemoPrizeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
