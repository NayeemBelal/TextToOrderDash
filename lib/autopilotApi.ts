/**
 * Typed client for Autopilot (belan-marketing-backend `/api/marketing/autopilot`,
 * docs/AUTOPILOT.md there): spaced, AI-personalized game sends.
 *
 * Errors carry the backend's `detail` so a rejected save says exactly what to
 * fix ("Send time must be between 10:00 and 19:30").
 */
import { supabase } from '@/lib/supabase';
import { MARKETING_API_BASE_URL } from '@/lib/config';

export type AutopilotMode = 'preview' | 'live';
export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export const WEEKDAYS: Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** The knobs each game in the rotation sets for itself. A key a game leaves
 * unset falls back to the same-named shared value on AutopilotSettings. */
export interface GameSettings {
  send_time: string; // "16:00", restaurant time
  winner_percent: number;
  consolation_percent: number;
  everyone_wins: boolean;
  coupon_expiry_hours: number;
  reply_window_hours: number;
  // Reply texts. "" = the game's default copy (catalog.default_*_message);
  // may use {first_name} {prize} {discount} {code} {link} {expiry}; must keep {link}.
  winner_message: string;
  loser_message: string;
}
export const GAME_KEYS: (keyof GameSettings)[] = [
  'send_time',
  'winner_percent',
  'consolation_percent',
  'everyone_wins',
  'coupon_expiry_hours',
  'reply_window_hours',
  'winner_message',
  'loser_message',
];
export const MAX_MESSAGE_CHARS = 320;

export interface AutopilotSettings extends GameSettings {
  enabled: boolean;
  mode: AutopilotMode;
  gap_days: number;
  bucket_size: number;
  send_days: Weekday[];
  horizon_days: number;
  audience: { type: 'all' } | { type: 'group'; group_id: string };
  games: string[];
  personalize: boolean;
  require_approval: boolean;
  test_phone: string;
  trivia_topic?: string;
  /** Per-game overrides, keyed by catalog game id. */
  game_settings: Record<string, Partial<GameSettings>>;
}

/** What one game actually runs with: its overrides on top of the shared values. */
export function gameSettingsFor(s: AutopilotSettings, gameId: string): GameSettings {
  const over = s.game_settings?.[gameId] ?? {};
  const pick = <K extends keyof GameSettings>(k: K): GameSettings[K] => {
    const v = over[k];
    return v === undefined || v === null || (v as unknown) === '' ? s[k] : v;
  };
  return {
    send_time: pick('send_time'),
    winner_percent: pick('winner_percent'),
    consolation_percent: pick('consolation_percent'),
    everyone_wins: pick('everyone_wins'),
    coupon_expiry_hours: pick('coupon_expiry_hours'),
    reply_window_hours: pick('reply_window_hours'),
    winner_message: pick('winner_message') ?? '',
    loser_message: pick('loser_message') ?? '',
  };
}

export type OpenerSource = 'ai' | 'name' | 'template' | 'pending';

export interface AutopilotRecipient {
  customer_id: string;
  name: string | null;
  last4: string | null;
  last_touch_kind: string | null;
  last_touch_label: string;
  last_touch_days_ago: number | null;
  eligible_at: string | null;
  segment: string | null;
  opener: string | null;
  opener_source: OpenerSource;
  opener_reason: string | null;
  message: string;
  segments: number;
  encoding: string;
}

export type SlotStatus = 'preview' | 'awaiting_approval' | 'approved' | 'scheduled' | 'missed';

export interface AutopilotSlot {
  round_id: string;
  scheduled_at: string;
  local_label: string;
  game_id: string | null;
  game_name: string;
  prize: string;
  consolation_percent: number;
  everyone_wins: boolean;
  coupon_expiry_hours: number | null;
  reply_window_hours: number;
  status: SlotStatus;
  approved_at: string | null;
  size: number;
  openers: Partial<Record<OpenerSource, number>>;
  template_body: string;
  template_segments: number;
  template_encoding: string;
  recipients: AutopilotRecipient[];
}

export interface AutopilotHistoryRow {
  round_id: string;
  sent_at: string | null;
  local_label: string;
  game_name: string;
  status: string;
  recipients: number;
  replies: number;
  winners: number;
  coupons_used: number;
  dropped: Record<string, number>;
}

export interface AutopilotState {
  enabled?: boolean;
  mode?: AutopilotMode;
  audience?: number;
  planned?: number;
  slots?: number;
  waiting?: { total: number; not_due: number; full: number; histogram: { date: string; count: number }[] };
  no_phone?: number;
  personalization?: { ai: number; name: number; template: number; pending: number; failed: Record<string, number> };
  llm?: { model: string; prompt_tokens: number; completion_tokens: number; cost_usd: number };
  duration_s?: number;
  last_planned_at?: string;
  error?: string;
}

export interface AutopilotDashboard {
  available: boolean;
  live_allowed: boolean;
  admin_only: boolean;
  configured?: boolean;
  settings?: AutopilotSettings;
  state?: AutopilotState;
  timezone?: string;
  send_window?: [string, string];
  max_bucket?: number;
  catalog?: {
    id: string;
    name: string;
    tagline: string;
    deferred: boolean;
    /** What the game replies with when the owner hasn't written their own text. */
    default_winner_message?: string;
    default_loser_message?: string;
  }[];
  groups?: { id: string; name: string; member_count: number }[];
  slots?: AutopilotSlot[];
  history?: AutopilotHistoryRow[];
  run?: AutopilotState | { error: string } | null;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(`${MARKETING_API_BASE_URL}/api/marketing/autopilot${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let detail = `Something went wrong (${res.status}). Try again.`;
    try {
      const body = await res.json();
      if (typeof body?.detail === 'string') detail = body.detail;
    } catch {
      // Non-JSON error body — keep the generic line.
    }
    throw new Error(detail);
  }
  return res.json() as Promise<T>;
}

export function fetchAutopilot(restaurantId: string): Promise<AutopilotDashboard> {
  return call(`?restaurant_id=${encodeURIComponent(restaurantId)}`);
}

export function saveAutopilot(restaurantId: string, settings: Partial<AutopilotSettings>): Promise<AutopilotDashboard> {
  return call('', { method: 'PUT', body: JSON.stringify({ restaurant_id: restaurantId, settings }) });
}

export function planAutopilot(restaurantId: string): Promise<AutopilotDashboard> {
  return call('/plan', { method: 'POST', body: JSON.stringify({ restaurant_id: restaurantId }) });
}

export function approveSlot(restaurantId: string, roundId: string, approved: boolean): Promise<AutopilotDashboard> {
  return call(`/slots/${roundId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, approved }),
  });
}

export function sendSample(
  restaurantId: string,
  roundId: string,
  customerId: string,
  phone: string,
): Promise<{ sent_to: string; message: string }> {
  return call(`/slots/${roundId}/sample`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, customer_id: customerId, phone }),
  });
}
