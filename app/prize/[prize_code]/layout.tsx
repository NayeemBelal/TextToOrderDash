import type { Metadata } from "next";

// The prize page itself (page.tsx) is a client component, so it can't export
// metadata. This server-component layout overrides the site-wide OG tags from
// the root layout so the coupon link unfurls as the reward — not the marketing
// homepage screenshot — when customers share/receive it.
export const metadata: Metadata = {
  title: "Your Prize!",
  description: "You've got a reward waiting — tap to redeem it in store.",
  openGraph: {
    title: "Your Prize!",
    description: "You've got a reward waiting — tap to redeem it in store.",
    images: [
      {
        url: "/prize-og.png",
        width: 1200,
        height: 630,
        alt: "Your Prize! — a gift waiting to be redeemed",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Prize!",
    description: "You've got a reward waiting — tap to redeem it in store.",
    images: ["/prize-og.png"],
  },
};

export default function PrizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
