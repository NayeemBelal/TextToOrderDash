import type { Metadata } from "next";
import { MARKETING_API_BASE_URL } from "@/lib/config";

// The prize page itself (page.tsx) is a client component, so it can't export
// metadata. This server-component layout overrides the site-wide OG tags from
// the root layout so the coupon link unfurls as the reward — not the marketing
// homepage screenshot — when customers share/receive it.
//
// The OG image is per-restaurant. When `og_image_url` is set in
// marketing_settings that static image is used verbatim; otherwise the
// image is GENERATED per coupon by ./opengraph-image.tsx from the
// restaurant's logo, brand colour and hero photo — so every restaurant's
// coupon links unfurl in its own look without uploading anything.

const DEFAULT_TITLE = "Your Prize!";
const DEFAULT_DESCRIPTION = "You've got a reward waiting — tap to redeem it in store.";

interface PrizeBranding {
  restaurant_name?: string;
  og_image_url?: string | null;
}

async function fetchBranding(prize_code: string): Promise<PrizeBranding | null> {
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/prize/${prize_code}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prize_code: string }>;
}): Promise<Metadata> {
  const { prize_code } = await params;
  const data = await fetchBranding(prize_code);

  const title = data?.restaurant_name ? `A Reward From ${data.restaurant_name}!` : DEFAULT_TITLE;
  const description = data?.restaurant_name
    ? `${data.restaurant_name} has a reward waiting for you — tap to redeem it in store.`
    : DEFAULT_DESCRIPTION;
  // Only pin an explicit image when the restaurant set one; leaving `images`
  // out lets Next attach the generated ./opengraph-image.tsx route instead.
  const custom = data?.og_image_url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(custom ? { images: [{ url: custom, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(custom ? { images: [custom] } : {}),
    },
  };
}

export default function PrizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
