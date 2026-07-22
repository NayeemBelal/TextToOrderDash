/**
 * Typed client for the Marketing → Revenue analytics endpoints
 * (belan-marketing-backend `/api/marketing/analytics/*`).
 *
 * All requests go through `marketingApiFetch`, which attaches the Supabase JWT;
 * the backend enforces that the token's restaurant matches `restaurant_id`.
 * Money is always integer cents.
 */
import { marketingApiFetch } from '@/lib/api';

export type CouponType = 'optin' | 'winner' | 'loser';
export type RangeKey = '7d' | '30d' | '90d' | 'all';

export const COUPON_TYPES: CouponType[] = ['optin', 'winner', 'loser'];

export const COUPON_TYPE_LABEL: Record<CouponType, string> = {
  optin: 'Opt-in',
  winner: 'Winners',
  loser: 'Losers',
};

export interface SummaryPoint {
  day: string; // YYYY-MM-DD (restaurant-local)
  revenue_cents: number;
  discount_cents: number;
  count: number;
}

export interface AnalyticsSummary {
  range: RangeKey;
  types: CouponType[];
  totals: { revenue_cents: number; discount_cents: number; order_count: number };
  series: SummaryPoint[];
}

export interface OrderCustomer {
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
}

export interface OrderListItem {
  clover_order_id: string;
  order_total_cents: number;
  discount_amount_cents: number;
  discount_percent: number | null;
  coupon_type: CouponType;
  prize_code: string | null;
  paid_at: string | null;
  customer: OrderCustomer | null;
}

export interface OrdersPage {
  items: OrderListItem[];
  next_cursor: number | null;
}

export interface OrderDetail extends OrderListItem {
  // Money breakdown (integer cents), computed by the backend so that
  // subtotal - discount + tax = total. Display these directly — do NOT reconstruct.
  subtotal_cents: number;
  tax_cents: number;
  flagged: boolean; // >1 marketing coupon applied to this order (register misuse)
  clover_discount_id: string | null;
  order_state: string | null;
  ordered_at: string | null;
  order_snapshot: CloverOrderSnapshot | null;
  customers: OrderCustomer | null;
}

/** Trimmed shape of the Clover order snapshot we render in the detail drawer. */
export interface CloverOrderSnapshot {
  id?: string;
  total?: number;
  currency?: string;
  lineItems?: {
    elements?: Array<{
      name?: string;
      price?: number;
      unitQty?: number;
      modifications?: { elements?: Array<{ name?: string; amount?: number }> };
    }>;
  };
  payments?: { elements?: Array<{ amount?: number; result?: string; createdTime?: number }> };
  [k: string]: unknown;
}

/** Browser timezone so revenue buckets by the owner's local day. */
function localTz(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';
  } catch {
    return 'America/Chicago';
  }
}

function typesParam(types: CouponType[]): string {
  // Omit when all selected so the backend default applies.
  return types.length && types.length < COUPON_TYPES.length ? `&types=${types.join(',')}` : '';
}

export function fetchSummary(
  restaurantId: string,
  range: RangeKey,
  types: CouponType[],
): Promise<AnalyticsSummary> {
  const tz = encodeURIComponent(localTz());
  return marketingApiFetch<AnalyticsSummary>(
    `/api/marketing/analytics/summary?restaurant_id=${restaurantId}&range=${range}&tz=${tz}${typesParam(types)}`,
  );
}

export interface AdminRestaurant {
  id: string;
  name: string;
  active: boolean;
  revenue: AnalyticsSummary;
}

/** Admin-only: every restaurant plus a revenue summary, for the /admin grid. */
export function fetchAdminRestaurants(range: RangeKey = '30d'): Promise<AdminRestaurant[]> {
  const tz = encodeURIComponent(localTz());
  return marketingApiFetch<AdminRestaurant[]>(
    `/api/admin/restaurants?range=${range}&tz=${tz}`,
  );
}

export function fetchOrders(
  restaurantId: string,
  types: CouponType[],
  cursor = 0,
  limit = 50,
): Promise<OrdersPage> {
  return marketingApiFetch<OrdersPage>(
    `/api/marketing/analytics/orders?restaurant_id=${restaurantId}&cursor=${cursor}&limit=${limit}${typesParam(types)}`,
  );
}

export function fetchOrderDetail(
  restaurantId: string,
  cloverOrderId: string,
): Promise<OrderDetail> {
  return marketingApiFetch<OrderDetail>(
    `/api/marketing/analytics/orders/${encodeURIComponent(cloverOrderId)}?restaurant_id=${restaurantId}`,
  );
}

/** Format integer cents as USD, hiding cents when whole. */
export function formatUSD(cents: number): string {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function customerLabel(c: OrderCustomer | null): { name: string | null; phone: string } {
  const name = c ? [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || null : null;
  return { name, phone: c?.phone_number || 'Unknown' };
}
