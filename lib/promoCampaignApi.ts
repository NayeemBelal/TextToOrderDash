/**
 * Typed client for Promotional Message campaigns
 * (belan-marketing-backend `/api/marketing/promo/*`, `/api/marketing/test-promo`).
 *
 * A one-off (or scheduled) plain SMS blast to selected customers, with an
 * optional instant coupon — no reply/game mechanic required.
 */
import { marketingApiFetch } from '@/lib/api';

export interface PromoRecipient {
  customer_id: string;
  phone: string;
  name: string | null;
}

export interface AccountBalance {
  balance: string;
  available_credit: string;
  currency: string;
}

export interface PromoPreview {
  recipients: PromoRecipient[];
  recipient_count: number;
  segments_per_message: number;
  encoding: 'GSM-7' | 'UCS-2';
  cost_per_part: number;
  outbound_cost: number;
  worst_case_cost: number;
  currency: string;
  account_balance: AccountBalance | null;
}

export interface PromoParams {
  restaurant_id: string;
  target_customer_ids: string[];
  message: string;
  has_coupon: boolean;
  discount_percent?: number | null;
  coupon_expiry_days?: number | null;
  coupon_expiry_hours?: number | null;
  media_urls?: string[] | null;
}

export function previewPromo(params: PromoParams): Promise<PromoPreview> {
  return marketingApiFetch<PromoPreview>('/api/marketing/promo/preview', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export interface SendPromoResult {
  recipients: number;
  queued: number;
  coupons_minted: number;
}

export function sendPromoNow(params: PromoParams): Promise<SendPromoResult> {
  return marketingApiFetch<SendPromoResult>('/api/marketing/promo/send', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export type PromoStatus = 'pending' | 'sent' | 'canceled' | 'failed';

export interface ScheduledPromo {
  id: string;
  restaurant_id: string;
  message: string;
  has_coupon: boolean;
  discount_percent: number | null;
  coupon_expiry_days: number | null;
  coupon_expiry_hours: number | null;
  target_customer_ids: string[];
  send_at: string;
  status: PromoStatus;
  recipient_count_estimate: number | null;
  recipient_count_actual: number | null;
  created_at: string;
  fired_at: string | null;
}

export function schedulePromo(
  params: PromoParams & { send_date: string; send_time: string },
): Promise<ScheduledPromo> {
  return marketingApiFetch<ScheduledPromo>('/api/marketing/promo/schedule', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function fetchScheduledPromos(restaurantId: string, status?: PromoStatus): Promise<{ promos: ScheduledPromo[] }> {
  const params = new URLSearchParams({ restaurant_id: restaurantId });
  if (status) params.set('status', status);
  return marketingApiFetch(`/api/marketing/promo/scheduled?${params}`);
}

export function cancelScheduledPromo(restaurantId: string, promoId: string): Promise<{ status: string }> {
  return marketingApiFetch(`/api/marketing/promo/scheduled/${promoId}?restaurant_id=${restaurantId}`, {
    method: 'DELETE',
  });
}

export interface PromoDeliveryRecipient {
  customer_id: string;
  name: string | null;
  phone: string | null;
  status: string;
  delivery_status: string | null;
  sent_at: string | null;
}

export interface PromoDetail extends ScheduledPromo {
  recipients: PromoDeliveryRecipient[];
  delivered: number;
  failed: number;
  unconfirmed: number;
}

export function fetchPromoDetail(restaurantId: string, promoId: string): Promise<PromoDetail> {
  return marketingApiFetch(`/api/marketing/promo/${promoId}?restaurant_id=${restaurantId}`);
}

export function sendTestPromo(params: {
  restaurant_id: string;
  phone: string;
  message: string;
  has_coupon: boolean;
  discount_percent?: number | null;
  coupon_expiry_days?: number | null;
  coupon_expiry_hours?: number | null;
  create_clover_coupon: boolean;
}): Promise<{ phone: string; message: string }> {
  return marketingApiFetch('/api/marketing/test-promo', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
