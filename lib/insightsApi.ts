/**
 * Typed client for the super-admin Insights endpoints
 * (belan-marketing-backend `/api/admin/insights/*`).
 *
 * Sends are precomputed report cards (send_stats, rebuilt nightly): the
 * action — copy, game, discount, local send time, audience — next to every
 * outcome (delivery, replies, coupon funnel, revenue ex-tax, opt-outs).
 * The join funnel reads the web-beacon events, so view counts exist only
 * from the day the beacon shipped.
 */
import { marketingApiFetch } from '@/lib/api';

export type InsightsRange = '7d' | '30d' | '90d';

export interface SendStatsRow {
  source_kind: 'round' | 'promo' | 'reminder';
  source_id: string;
  restaurant_id: string;
  restaurant_name: string;
  campaign_id: string | null;
  game_type: string | null;
  win_rule: string | null;
  message_text: string | null;
  discount_percent: number | null;
  fired_at: string | null;
  fired_local_dow: number | null;
  fired_local_hour: number | null;
  recipient_count: number | null;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  reply_count: number;
  median_reply_seconds: number | null;
  winners: number;
  losers: number;
  capped_losers: number;
  coupons_minted: number;
  coupons_redeemed: number;
  coupons_consumed: number;
  attributed_orders: number;
  attributed_revenue_cents: number;
  attributed_revenue_ex_tax_cents: number;
  discount_cost_cents: number;
  optouts_24h: number;
  delivery_rate: number | null;
  reply_rate: number | null;
  redemption_rate: number | null;
  net_revenue_cents: number;
}

export interface JoinFunnelRow {
  restaurant_id: string;
  restaurant_name: string;
  src: string;
  views: number;
  form_starts: number;
  submits: number;
  opted_in: number;
  already_member: number;
  rejected: number;
  view_to_optin_rate: number | null;
}

export interface DailyStatsRow {
  restaurant_id: string;
  day: string;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  optins_new: number;
  optouts_new: number;
  join_page_views: number;
  join_form_starts: number;
  join_submits: number;
  game_entries: number;
  coupons_redeemed: number;
  coupons_consumed: number;
  attributed_orders: number;
  attributed_revenue_cents: number;
  attributed_revenue_ex_tax_cents: number;
  discount_cost_cents: number;
}

export function fetchInsightsSends(
  range: InsightsRange = '30d',
  restaurantId?: string,
): Promise<{ sends: SendStatsRow[] }> {
  const params = new URLSearchParams({ range });
  if (restaurantId) params.set('restaurant_id', restaurantId);
  return marketingApiFetch(`/api/admin/insights/sends?${params}`);
}

export function fetchJoinFunnel(
  range: InsightsRange = '30d',
  restaurantId?: string,
): Promise<{ funnels: JoinFunnelRow[] }> {
  const params = new URLSearchParams({ range });
  if (restaurantId) params.set('restaurant_id', restaurantId);
  return marketingApiFetch(`/api/admin/insights/join-funnel?${params}`);
}

export function fetchInsightsDaily(
  range: InsightsRange = '30d',
  restaurantId?: string,
): Promise<{ days: DailyStatsRow[] }> {
  const params = new URLSearchParams({ range });
  if (restaurantId) params.set('restaurant_id', restaurantId);
  return marketingApiFetch(`/api/admin/insights/daily?${params}`);
}
