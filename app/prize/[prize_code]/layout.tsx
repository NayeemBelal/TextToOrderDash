import type { Metadata } from "next";
import { MARKETING_API_BASE_URL } from "@/lib/api";

// The prize page itself (page.tsx) is a client component, so it can't export
// metadata. This server-component layout overrides the site-wide OG tags from
// the root layout so the coupon link unfurls as the reward — not the marketing
// homepage screenshot — when customers share/receive it.
//
// The OG image is per-restaurant: each restaurant can set `og_image_url` in
// marketing_settings (falls back to the generic /prize-og.png when unset), so
// a text with a Sayfani Sachse link unfurls with a Sayfani photo, an Epic
// Pizza link with an Epic Pizza photo, etc.

const DEFAULT_TITLE = "Your Prize!";
const DEFAULT_DESCRIPTION = "You've got a reward waiting — tap to redeem it in store.";
const DEFAULT_OG_IMAGE = "/prize-og.png";

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
  const image = data?.og_image_url || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        // No width/height hint — per-restaurant og_image_url photos vary in
        // aspect ratio (square, portrait, etc.), so a fixed dimension here
        // would misrepresent some of them to crawlers.
        { url: image, alt: title },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function PrizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
