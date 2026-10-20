/**
 * Typed client for the super-admin Billing endpoint
 * (belan-marketing-backend `/api/admin/billing`).
 *
 * SMS spend comes live from both carriers — no local cost ledger. Telnyx is
 * attributed per restaurant via the `restaurant_id` tag on every send
 * (usage_reports API); Twilio has no tags, so its per-message prices are
 * grouped by the sending/receiving number and mapped to the restaurant that
 * owns it. `untagged_cost` is Telnyx spend from before tagging existed plus
 * Twilio spend on numbers no restaurant owns. Each carrier is best-effort:
 * `providers.<name>.error` is set when that one failed.
 */
import { marketingApiFetch } from '@/lib/api';

export type BillingRangeKey = '7d' | '30d';

export type SmsProvider = 'telnyx' | 'twilio';

export interface RestaurantBillingRow {
  restaurant_id: string;
  restaurant_name: string;
  provider: SmsProvider;
  cost: number;
  count: number;
  parts: number;
}

export interface ProviderBilling {
  total_cost: number | null;
  error: string | null;
  account_balance: AccountBalance | null;
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
  /** Telnyx balance (legacy field; same as providers.telnyx.account_balance). */
  account_balance: AccountBalance | null;
  providers: Partial<Record<SmsProvider, ProviderBilling>>;
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
