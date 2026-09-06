/**
 * Typed client for the campaign message config endpoint
 * (belan-marketing-backend `GET /api/marketing/campaign-config`).
 *
 * Follows the pattern in lib/optinConfigApi.ts — thin functions over
 * `marketingApiFetch`, which attaches the Supabase JWT.
 */
import { marketingApiFetch } from "@/lib/api";
import type { GameType, TriviaConfig } from "@/components/voice/games";

export interface CampaignMessageDefaults {
  // Per game type, the restaurant's saved defaults merged over the backend's
  // shipped templates. Game messages may contain {restaurant_name}/{prize}
  // ({range}, and {question}/{choices} for multiple-choice games; {draw_time}
  // for deferred ones); winner/loser replies may contain
  // {first_name}/{prize}/{discount}/{code}/{link}/{expiry}.
  // Keyed by game slug. Partial because a curated or hand-built game has no
  // saved default until the restaurant launches one — the backend fills those
  // in from its catalog at send time.
  game_messages: Partial<Record<GameType, string>>;
  // Guaranteed-prize game texts used when everyone-wins mode is on.
  everyone_wins_game_messages: Partial<Record<GameType, string>>;
  winner_messages: Partial<Record<GameType, string>>;
  loser_messages: Partial<Record<GameType, string>>;
  // Deferred games (closest guess, random draw): the "you're entered" text
  // sent on reply, before the winner is known.
  entry_messages: Partial<Record<GameType, string>>;
  expiry_days: number | null; // coupon valid this many days after playing
  expiry_time: string | null; // ...at this local time of day, "HH:MM" (24h); null = rolling default
  default_expiry_hours: number;
  restaurant_name: string;
  default_trivia: TriviaConfig;
}

export function getCampaignConfig(
  restaurantId: string,
): Promise<CampaignMessageDefaults> {
  return marketingApiFetch<CampaignMessageDefaults>(
    `/api/marketing/campaign-config?restaurant_id=${restaurantId}`,
  );
}
