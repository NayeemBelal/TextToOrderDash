/**
 * Typed client for the marketing Settings panel: coupon-page branding, the
 * QR/web sign-up link, and the referral program
 * (belan-marketing-backend `/api/marketing/branding`, `/join-optin-settings`,
 * `/referral-settings`).
 */
import { marketingApiFetch } from "@/lib/api";

export interface Branding {
  logo_url: string | null;
  brand_color: string | null;
  background_image_url: string | null;
  og_image_url: string | null;
  referral_share_image_url: string | null;
  restaurant_name: string | null;
  prize_page_base: string;
}

export type BrandingUpdate = Omit<Branding, "restaurant_name" | "prize_page_base">;

export function getBranding(restaurantId: string): Promise<Branding> {
  return marketingApiFetch(`/api/marketing/branding?restaurant_id=${restaurantId}`);
}

export function updateBranding(restaurantId: string, body: BrandingUpdate): Promise<{ success: boolean }> {
  return marketingApiFetch(`/api/marketing/branding?restaurant_id=${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface JoinOptinSettings {
  join_optin_enabled: boolean;
  marketing_slug: string | null;
  join_discount_percent: number;
  join_expiry_hours: number;
  join_url: string | null;
}

export function getJoinSettings(restaurantId: string): Promise<JoinOptinSettings> {
  return marketingApiFetch(`/api/marketing/join-optin-settings?restaurant_id=${restaurantId}`);
}

export function updateJoinSettings(
  restaurantId: string,
  body: Omit<JoinOptinSettings, "join_url" | "marketing_slug"> & { marketing_slug: string },
): Promise<{ success: boolean; join_url: string }> {
  return marketingApiFetch(`/api/marketing/join-optin-settings?restaurant_id=${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export interface ReferralSettings {
  referral_enabled: boolean;
  referrer_bonus_percent: number;
  referred_discount_percent: number;
  referral_expiry_days: number;
}

export function getReferralSettings(restaurantId: string): Promise<ReferralSettings> {
  return marketingApiFetch(`/api/marketing/referral-settings?restaurant_id=${restaurantId}`);
}

export function updateReferralSettings(restaurantId: string, body: ReferralSettings): Promise<{ success: boolean }> {
  return marketingApiFetch(`/api/marketing/referral-settings?restaurant_id=${restaurantId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ── POS connection ───────────────────────────────────────────────────────────

export type PosProvider = "clover" | "toast";

export interface PosConnectionStatus {
  provider: PosProvider;
  merchant_id: string | null;
  connected: boolean;
  has_credentials: boolean;
  toast_supported: boolean;
  merchant_name?: string | null;
}

export interface PosConnectRequest {
  provider: PosProvider;
  merchant_id: string;
  api_key?: string;        // Clover API token
  client_id?: string;      // Toast
  client_secret?: string;  // Toast
  api_host?: string;       // Toast (optional)
}

export interface PosConnectResult {
  connected: boolean;
  provider: PosProvider;
  merchant_id: string;
  merchant_name: string | null;
  checks: { orders?: boolean; customers?: boolean; inventory?: boolean };
}

export function getPosConnection(restaurantId: string): Promise<PosConnectionStatus> {
  return marketingApiFetch(`/api/marketing/pos-connection?restaurant_id=${restaurantId}`);
}

export async function connectPos(restaurantId: string, body: PosConnectRequest): Promise<PosConnectResult> {
  // Read the backend's own error message — it says exactly what the POS rejected.
  const { supabase } = await import("@/lib/supabase");
  const { MARKETING_API_BASE_URL } = await import("@/lib/config");
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${MARKETING_API_BASE_URL}/api/marketing/pos-connection?restaurant_id=${restaurantId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json?.detail === "string" ? json.detail : `Couldn't connect (${res.status}).`);
  return json as PosConnectResult;
}

export function disconnectPos(restaurantId: string): Promise<{ success: boolean }> {
  return marketingApiFetch(`/api/marketing/pos-connection?restaurant_id=${restaurantId}`, { method: "DELETE" });
}
