/**
 * Sales mode: the same public site with every price left out, for prospects
 * the sales reps warm up by phone. A rep sends belan.tech/r/<rep>; middleware.ts
 * sets SALES_COOKIE and redirects to "/", and while the cookie is set the server
 * render drops each pricing surface (read via isSalesMode() in server code and
 * useSalesMode() in client components). Without the cookie nothing changes.
 * belan.tech/r/off or belan.tech/?sales=off clears it.
 *
 * Edge-safe: middleware imports this file, so no next/headers or Node imports.
 */

export const SALES_COOKIE = "belan_sales";
export const SALES_COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days
/** The slug (and ?sales= value) that turns sales mode off. */
export const SALES_OFF = "off";

// Any lowercase slug is a rep, so a new rep needs no deploy. Referral links
// share the /r/ prefix but their codes are uppercase (REF-XXXXXX), so they
// never match and fall through to app/r/[referral_code].
const REP_SLUG = /^[a-z0-9-]{1,32}$/;

export function parseSalesRep(value: string | null | undefined): string | null {
  return value && value !== SALES_OFF && REP_SLUG.test(value) ? value : null;
}

/** Price-free copy for the site-wide description and link previews. */
export const SALES_SITE_DESCRIPTION =
  "Belan texts your customers a quick game — trivia, pick a number, roll the dice — and turns every reply into a coupon they redeem at your register.";
export const SALES_SITE_OG_DESCRIPTION =
  "Text your customers a game, not a coupon blast. Winners and players alike walk in with a real POS coupon. Phone number included.";

/** Drops the inline " ($200/month)" aside a few FAQ answers carry. */
export function stripPriceAside(text: string): string {
  return text.replace(/ \(\$\d+\/month\)/g, "");
}
