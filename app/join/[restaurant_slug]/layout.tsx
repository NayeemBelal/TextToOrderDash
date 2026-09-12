import type { Metadata } from "next";
import { MARKETING_API_BASE_URL } from "@/lib/config";

// The join page itself (page.tsx) is a client component, so it can't export
// metadata. This server-component layout overrides the site-wide OG tags from
// the root layout so a QR-code link unfurls as a sign-up page — not the
// marketing homepage screenshot — when it's shared/received.
//
// The OG image is per-restaurant: each restaurant can set `og_image_url` in
// marketing_settings (falls back to the generic /prize-og.png when unset).

const DEFAULT_TITLE = "Join Our Text List";
const DEFAULT_DESCRIPTION = "Sign up for exclusive offers and a welcome discount.";
const DEFAULT_OG_IMAGE = "/prize-og.png";

interface JoinBranding {
  restaurant_name?: string;
  og_image_url?: string | null;
}

async function fetchBranding(restaurant_slug: string): Promise<JoinBranding | null> {
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/join/${restaurant_slug}`, {
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
  params: Promise<{ restaurant_slug: string }>;
}): Promise<Metadata> {
  const { restaurant_slug } = await params;
  const data = await fetchBranding(restaurant_slug);

  const title = data?.restaurant_name ? `Join ${data.restaurant_name}'s Text List` : DEFAULT_TITLE;
  const description = data?.restaurant_name
    ? `Sign up for exclusive offers from ${data.restaurant_name} and get a welcome discount.`
    : DEFAULT_DESCRIPTION;
  const image = data?.og_image_url || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, alt: title }],
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

export default function JoinLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
