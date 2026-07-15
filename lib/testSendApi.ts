/**
 * Typed client for the dashboard test-send endpoints
 * (belan-marketing-backend `POST /api/marketing/test-optin` and
 * `POST /api/marketing/test-campaign`).
 *
 * Follows the pattern in lib/optinConfigApi.ts — thin functions over
 * `marketingApiFetch`, which attaches the Supabase JWT.
 */
import { marketingApiFetch } from "@/lib/api";
import type { GameType, TriviaConfig } from "@/components/voice/games";

export interface TestOptinParams {
  restaurantId: string;
  phone: string;
  message?: string;
  discountPercent?: number;
  expiryDays?: number;
  expiryTime?: string; // "HH:MM" 24h
  createCloverCoupon: boolean; // whether redeeming the test coupon touches Clover
}

export interface TestOptinResult {
  phone: string;
  queued: number;
  errors: number;
}

export function sendTestOptin(p: TestOptinParams): Promise<TestOptinResult> {
  return marketingApiFetch<TestOptinResult>("/api/marketing/test-optin", {
    method: "POST",
    body: JSON.stringify({
      restaurant_id: p.restaurantId,
      phone: p.phone,
      message: p.message,
      discount_percent: p.discountPercent,
      expiry_days: p.expiryDays,
      expiry_time: p.expiryTime,
      create_clover_coupon: p.createCloverCoupon,
    }),
  });
}

export interface TestCampaignParams {
  restaurantId: string;
  phone: string;
  gameType: GameType;
  trivia?: TriviaConfig;
  prizeConfig: { type: string; itemName?: string; percent?: number };
  loserDiscount: number;
  messages: { game?: string; winner?: string; loser?: string };
  expiryDays?: number;
  expiryTime?: string; // "HH:MM" 24h — copy rendering only; test coupons last 3 min
  createCloverCoupon: boolean;
}

export interface TestCampaignResult {
  phone: string;
  queued: number;
  winning_answer: string;
  test_coupon_minutes: number;
}

export function sendTestCampaign(
  p: TestCampaignParams,
): Promise<TestCampaignResult> {
  return marketingApiFetch<TestCampaignResult>("/api/marketing/test-campaign", {
    method: "POST",
    body: JSON.stringify({
      restaurant_id: p.restaurantId,
      phone: p.phone,
      game_type: p.gameType,
      trivia: p.trivia,
      prize_config: p.prizeConfig,
      loser_discount: p.loserDiscount,
      messages: p.messages,
      expiry_days: p.expiryDays,
      expiry_time: p.expiryTime,
      create_clover_coupon: p.createCloverCoupon,
    }),
  });
}
