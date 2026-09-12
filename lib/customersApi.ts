/**
 * Typed client for the Customers tab
 * (belan-marketing-backend `/api/marketing/customers/*`).
 */
import { marketingApiFetch } from "@/lib/api";

export interface CustomerHit {
  id: string;
  phone: string | null;
  name: string;
  opt_in_status: string | null;
  last_activity_at: string | null;
}

export type EventCategory = "consent" | "message" | "coupon" | "game" | "order" | "referral";

export interface TimelineEvent {
  type: string;
  category: EventCategory;
  timestamp: string;
  title: string;
  detail: string | null;
  emphasis: boolean;
  icon: string;
  meta: Record<string, unknown>;
}

export interface TimelineSummary {
  orders: number;
  lifetime_spend_cents: number;
  last_order_at: string | null;
  coupons_issued: number;
  coupons_used: number;
  coupons_active: number;
  games_played: number;
  games_won: number;
  texts_sent: number;
  texts_received: number;
  first_seen: string | null;
  last_activity: string | null;
  consent: {
    status: string | null;
    source: string | null;
    opted_in_at: string | null;
    opted_out_at: string | null;
  };
  as_of: string;
}

export interface PosSyncStatus {
  last_synced_at: string | null;
  pos_linked: boolean;
  pos_connected: boolean;
  last_error: string | null;
}

export interface TimelineResponse {
  customer: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  };
  summary: TimelineSummary;
  pos_sync: PosSyncStatus;
  events: TimelineEvent[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

export interface PosSyncResult {
  status: "synced" | "fresh" | "no_pos" | "no_phone" | "not_in_pos" | "error";
  new_orders: number;
  total_orders?: number;
  last_synced_at: string | null;
}

export function searchCustomers(restaurantId: string, q: string, limit = 12): Promise<{ customers: CustomerHit[] }> {
  const params = new URLSearchParams({ restaurant_id: restaurantId, q, limit: String(limit) });
  return marketingApiFetch(`/api/marketing/customers/search?${params}`);
}

export function fetchTimeline(
  restaurantId: string,
  customerId: string,
  offset = 0,
  limit = 60,
): Promise<TimelineResponse> {
  const params = new URLSearchParams({ restaurant_id: restaurantId, offset: String(offset), limit: String(limit) });
  return marketingApiFetch(`/api/marketing/customers/${customerId}/timeline?${params}`);
}

export function syncCustomerPos(restaurantId: string, customerId: string, force = false): Promise<PosSyncResult> {
  const params = new URLSearchParams({ restaurant_id: restaurantId, force: String(force) });
  return marketingApiFetch(`/api/marketing/customers/${customerId}/sync-pos?${params}`, { method: "POST" });
}
