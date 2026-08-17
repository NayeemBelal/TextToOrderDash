import type { Metadata } from "next";
import { MARKETING_API_BASE_URL } from "@/lib/api";

// The referral page itself (page.tsx) is a client component, so it can't
// export metadata. This server-component layout overrides the site-wide OG
// tags from the root layout so an invite link unfurls as an invite — not the
// marketing homepage screenshot — when it's shared/received.
//
// The OG image is per-restaurant: each restaurant can set `og_image_url` in
// marketing_settings (falls back to the generic /prize-og.png when unset), so
// an invite from Sayfani Sachse unfurls with a Sayfani photo, one from Epic
// Pizza with an Epic Pizza photo, etc.

const DEFAULT_TITLE = "You've Been Invited!";
const DEFAULT_DESCRIPTION = "A friend invited you — join for a welcome discount on your first order.";
const DEFAULT_OG_IMAGE = "/prize-og.png";

interface ReferralBranding {
  restaurant_name?: string;
  og_image_url?: string | null;
}

async function fetchBranding(referral_code: string): Promise<ReferralBranding | null> {
  try {
    const res = await fetch(`${MARKETING_API_BASE_URL}/api/referral/${referral_code}`, {
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
  params: Promise<{ referral_code: string }>;
}): Promise<Metadata> {
  const { referral_code } = await params;
  const data = await fetchBranding(referral_code);

  const title = data?.restaurant_name ? `You've Been Invited to ${data.restaurant_name}!` : DEFAULT_TITLE;
  const description = data?.restaurant_name
    ? `A friend invited you to ${data.restaurant_name} — join for a welcome discount on your first order.`
    : DEFAULT_DESCRIPTION;
  const image = data?.og_image_url || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: title,
        },
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

export default function ReferralLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
