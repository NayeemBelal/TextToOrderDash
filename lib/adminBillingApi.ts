/**
 * Typed client for the super-admin Billing endpoint
 * (belan-marketing-backend `/api/admin/billing`).
 *
 * SMS spend is attributed per restaurant via a `restaurant_id` tag Telnyx
 * echoes back on every send, queried live from Telnyx's usage_reports API —
 * there's no local cost ledger. `untagged_cost` covers sends made before
 * tagging existed or routed through a provider (Twilio) that doesn't tag.
 */
import { marketingApiFetch } from '@/lib/api';

export type BillingRangeKey = '7d' | '30d';

export interface RestaurantBillingRow {
  restaurant_id: string;
  restaurant_name: string;
  cost: number;
  count: number;
  parts: number;
}

export interface AccountBalance {
  balance: string;
  available_credit: string;
  currency: string;
}

export interface BillingSummary {
  range: BillingRangeKey;
  currency: string;
  total_cost: number;
  untagged_cost: number;
  by_restaurant: RestaurantBillingRow[];
  account_balance: AccountBalance | null;
}

export function fetchBillingSummary(range: BillingRangeKey = '30d'): Promise<BillingSummary> {
  return marketingApiFetch<BillingSummary>(`/api/admin/billing?range=${range}`);
}

export function formatUSDFromDollars(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}
