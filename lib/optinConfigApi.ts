/**
 * Typed client for the opt-in blast config endpoint
 * (belan-marketing-backend `GET /api/marketing/optin-config`).
 *
 * Follows the pattern in lib/marketingAnalyticsApi.ts — thin functions over
 * `marketingApiFetch`, which attaches the Supabase JWT.
 */
import { marketingApiFetch } from "@/lib/api";

export interface OptinConfig {
  message: string; // may contain {restaurant_name}/{discount} placeholders
  discount_percent: number;
  expiry_days: number | null; // coupon valid this many days after opt-in
  expiry_time: string | null; // ...at this local time of day, "HH:MM" (24h); null = rolling default
  default_expiry_hours: number;
  restaurant_name: string;
}

export function getOptinConfig(restaurantId: string): Promise<OptinConfig> {
  return marketingApiFetch<OptinConfig>(
    `/api/marketing/optin-config?restaurant_id=${restaurantId}`,
  );
}
