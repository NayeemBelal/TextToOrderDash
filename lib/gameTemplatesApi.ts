/**
 * Typed client for the curated game catalog and the game creator
 * (belan-marketing-backend `GET /api/marketing/game-templates`,
 * `POST /api/marketing/games/preview`, `PUT /api/marketing/vertical`).
 *
 * Follows the pattern in lib/campaignConfigApi.ts — thin functions over
 * `marketingApiFetch`, which attaches the Supabase JWT.
 *
 * The backend is the source of truth for both halves of this: which games are
 * curated (services/game_catalog.py) and what a game may be (game_engine.py).
 * The wizard builds its dropdowns from `answer_formats`/`win_rules`/
 * `winner_caps` in the response rather than from a local copy, so a rule added
 * server-side shows up here without a frontend release.
 */
import { marketingApiFetch } from "@/lib/api";
import type {
  AnswerFormat,
  GameSpec,
  WinRule,
  WinnerCap,
} from "@/components/voice/games";

export type Vertical = "restaurant" | "cafe" | "fragrance" | "retail";

export const VERTICAL_LABELS: Record<Vertical, string> = {
  restaurant: "Restaurant",
  cafe: "Café",
  fragrance: "Fragrance",
  retail: "Retail",
};

export interface GameTemplatePrize {
  type?: string;
  itemName?: string;
  percent?: number;
}

export interface GameTemplateMessages {
  game?: string;
  winner?: string;
  loser?: string;
  /** Deferred games only: the "you're entered" acknowledgement. */
  entry?: string;
}

export interface GameTemplate {
  id: string;
  name: string;
  tagline: string;
  /** Verticals this game suits; ["*"] means it works anywhere. */
  verticals: string[];
  spec: GameSpec;
  /** One-line description of the rules, e.g. "Guess the Note · reply: choice
   *  · win: exact · all winners". */
  summary: string;
  /** True when winners are picked after an entry window rather than on reply. */
  deferred: boolean;
  suggested_prize: GameTemplatePrize;
  messages: GameTemplateMessages;
}

export interface GameTemplatesResponse {
  /** The vertical these templates were selected for. */
  vertical: Vertical;
  /** What's saved on the restaurant (differs from `vertical` while browsing). */
  saved_vertical: Vertical;
  verticals: Vertical[];
  templates: GameTemplate[];
  answer_formats: AnswerFormat[];
  win_rules: WinRule[];
  winner_caps: WinnerCap[];
  deferred_rules: WinRule[];
  default_window_minutes: number;
}

export function getGameTemplates(
  restaurantId: string,
  vertical?: string,
): Promise<GameTemplatesResponse> {
  const query = vertical ? `&vertical=${encodeURIComponent(vertical)}` : "";
  return marketingApiFetch<GameTemplatesResponse>(
    `/api/marketing/game-templates?restaurant_id=${restaurantId}${query}`,
  );
}

export interface GamePreviewResponse {
  /** The spec as the engine understood it — defaults filled in, invalid
   *  values replaced. This is what would actually be played. */
  spec: GameSpec;
  summary: string;
  deferred: boolean;
  /** An example of what the round would be graded against (a fresh random
   *  draw for match-draw games, the set answer otherwise). */
  example_winning_answer: string;
  /** The game SMS this spec produces, placeholders substituted. */
  message: string;
  /** Things the owner should fix before launching. Advisory: the game will
   *  still run, with defaults substituted for whatever is missing. */
  problems: string[];
}

export function previewGame(params: {
  restaurantId: string;
  spec: Partial<GameSpec>;
  prize?: GameTemplatePrize;
  gameMessage?: string;
  everyoneWins?: boolean;
}): Promise<GamePreviewResponse> {
  return marketingApiFetch<GamePreviewResponse>("/api/marketing/games/preview", {
    method: "POST",
    body: JSON.stringify({
      restaurant_id: params.restaurantId,
      spec: params.spec,
      prize: params.prize,
      game_message: params.gameMessage,
      everyone_wins: params.everyoneWins ?? false,
    }),
  });
}

export function setVertical(
  restaurantId: string,
  vertical: string,
): Promise<{ vertical: Vertical }> {
  return marketingApiFetch<{ vertical: Vertical }>("/api/marketing/vertical", {
    method: "PUT",
    body: JSON.stringify({ restaurant_id: restaurantId, vertical }),
  });
}
