import { NextResponse, type NextRequest } from "next/server";
import {
  SALES_COOKIE,
  SALES_COOKIE_MAX_AGE,
  SALES_OFF,
  SALES_SITE_OG_DESCRIPTION,
  parseSalesRep,
} from "@/lib/sales-mode";

// Sales links (lib/sales-mode.ts):
//   /r/<rep>       set the sales cookie, redirect to "/"
//   /r/off         clear it, redirect to "/"
//   /?sales=off    clear it, stay on "/"
// Anything else under /r/ is a referral code and passes through untouched.

// Link-preview fetchers (iMessage identifies as facebookexternalhit/Twitterbot).
// They may not keep the cookie across the redirect, so they would unfurl the
// rep's link with the public site's priced description; give them a
// price-free card instead.
const PREVIEW_BOT =
  /facebookexternalhit|facebot|twitterbot|whatsapp|slackbot|telegrambot|discordbot|linkedinbot|skypeuripreview|snapchat|google-pagerenderer/i;

const PREVIEW_CARD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>Gamified SMS Marketing — Games, Not Spam | Belan AI</title>
<meta name="robots" content="noindex">
<meta name="description" content="${SALES_SITE_OG_DESCRIPTION}">
<meta property="og:title" content="Gamified SMS Marketing — Games, Not Spam | Belan AI">
<meta property="og:description" content="${SALES_SITE_OG_DESCRIPTION}">
<meta property="og:site_name" content="Belan AI">
<meta property="og:type" content="website">
<meta property="og:image" content="https://belan.tech/og-screenshot.png">
<meta name="twitter:card" content="summary_large_image">
</head><body><script>location.replace("/")</script><a href="/">Continue to belan.tech</a></body></html>`;

function noStore(res: NextResponse): NextResponse {
  // A Set-Cookie response must never be served from a shared cache.
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

function clearSalesCookie(res: NextResponse): NextResponse {
  res.cookies.delete(SALES_COOKIE);
  return noStore(res);
}

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (pathname === "/") {
    if (searchParams.get("sales") !== SALES_OFF) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.searchParams.delete("sales");
    return clearSalesCookie(NextResponse.redirect(url));
  }

  const slug = pathname.slice("/r/".length);
  if (slug === SALES_OFF) return clearSalesCookie(NextResponse.redirect(new URL("/", req.url)));

  const rep = parseSalesRep(slug);
  if (!rep) return NextResponse.next();

  const res = PREVIEW_BOT.test(req.headers.get("user-agent") ?? "")
    ? new NextResponse(PREVIEW_CARD, { headers: { "Content-Type": "text/html; charset=utf-8" } })
    : NextResponse.redirect(new URL("/", req.url));
  res.cookies.set(SALES_COOKIE, rep, {
    path: "/",
    maxAge: SALES_COOKIE_MAX_AGE,
    sameSite: "lax",
    httpOnly: true,
    secure: req.nextUrl.protocol === "https:",
  });
  return noStore(res);
}

export const config = {
  matcher: ["/r/:slug", { source: "/", has: [{ type: "query", key: "sales" }] }],
};
