/**
 * Typed client for the super-admin QR-offer wizard
 * (belan-marketing-backend `/api/admin/qr-offers`).
 *
 * Each offer is a join_promos row on the backend; its link mints a coupon at
 * signup and never touches the restaurant's default join offer, so printing
 * a new QR code can't change QR codes already in the wild. The `src` tag is
 * appended per placement (table-tent, window, flyer…) and is what splits the
 * Insights sign-up funnel by campaign.
 */
import { marketingApiFetch } from '@/lib/api';

export type QROfferKind = 'percent' | 'amount';

export interface QROffer {
  id: string;
  slug: string;
  label: string;
  kind: QROfferKind;
  discount_percent: number | null;
  expiry_days: number;
  active: boolean;
  created_at: string;
  link: string;
}

export interface QROfferCreateInput {
  restaurant_id: string;
  kind: QROfferKind;
  expiry_days: number;
  label?: string;
  // percent offers
  discount_percent?: number;
  // amount promos
  headline?: string;
  fine_print?: string;
  discount_amount_cents?: number;
  clover_item_name?: string;
  daily_start_time?: string;
  daily_end_time?: string;
}

export interface QROfferCreated {
  id: string;
  slug: string;
  label: string;
  kind: QROfferKind;
  discount_percent: number | null;
  expiry_days: number;
  link: string;
}

export function fetchQROffers(restaurantId: string): Promise<{ join_page: string; offers: QROffer[] }> {
  return marketingApiFetch(`/api/admin/qr-offers?restaurant_id=${restaurantId}`);
}

export function createQROffer(input: QROfferCreateInput): Promise<QROfferCreated> {
  return marketingApiFetch('/api/admin/qr-offers', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** The final URL to encode in the QR image: offer link + placement tag. */
export function qrLink(offerLink: string, src: string): string {
  const tag = src.trim().toLowerCase().replace(/\s+/g, '-');
  return tag ? `${offerLink}&src=${encodeURIComponent(tag)}` : offerLink;
}
