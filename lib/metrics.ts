// First-party web-event beacon for the public funnel pages (/join, /prize, /r).
//
// Fires small allowlisted events at the marketing backend's POST /api/events —
// page viewed, form started, code copied, redeem tapped, share tapped. These
// are the funnel edges that only exist in the browser: a QR scan that never
// converts, a coupon opened but never redeemed. Client-fired on purpose, so
// SSR metadata fetches and link-preview crawlers never count as humans.
//
// Identity is a random anon_id in localStorage (stitched to the customer
// server-side when they convert) plus a per-tab session_id. Everything here
// is fire-and-forget: analytics must never break a customer-facing page.
import { MARKETING_API_BASE_URL } from './config';

const ANON_KEY = 'belan_anon_id';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function anonId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return undefined; // storage blocked (private mode) — events stay anonymous
  }
}

let sessionId: string | undefined;
function getSessionId(): string {
  if (!sessionId) sessionId = randomId();
  return sessionId;
}

export interface TrackContext {
  restaurantSlug?: string;
  prizeCode?: string;
  referralCode?: string;
}

export function track(
  name: string,
  context: TrackContext,
  props: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined') return;
  try {
    const body = JSON.stringify({
      events: [{ name, props }],
      anon_id: anonId(),
      session_id: getSessionId(),
      restaurant_slug: context.restaurantSlug,
      prize_code: context.prizeCode,
      referral_code: context.referralCode,
    });
    const url = `${MARKETING_API_BASE_URL}/api/events`;
    // sendBeacon survives navigation (share sheets, tab closes); fall back to
    // a keepalive fetch where it's unavailable.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    // never let analytics surface on the page
  }
}
