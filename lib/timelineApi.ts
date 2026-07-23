/**
 * Typed client for the Coupon Timeline + scheduled-reminder endpoints
 * (belan-marketing-backend `/api/marketing/timeline/*`, `/api/marketing/reminders/*`).
 */
import { marketingApiFetch } from '@/lib/api';

export type TimelinePeriod = 'day' | 'week' | 'month';
export type ReminderSource = 'optin' | 'campaign';

export interface OptInEvent {
  customer_id: string;
  name: string | null;
  phone: string | null;
  timestamp: string;
}

export interface GameCouponEvent {
  customer_id: string;
  name: string | null;
  phone: string | null;
  prize_code: string;
  is_winner: boolean | null;
  timestamp: string;
}

export interface ExpiringEvent {
  customer_id: string;
  name: string | null;
  phone: string | null;
  prize_code: string;
  source: ReminderSource;
  timestamp: string;
}

export interface TimelineSummary {
  period: TimelinePeriod;
  start: string; // YYYY-MM-DD
  end: string;
  timezone: string;
  opt_ins: OptInEvent[];
  game_coupons: GameCouponEvent[];
  expiring: ExpiringEvent[];
}

export function fetchTimelineSummary(
  restaurantId: string,
  period: TimelinePeriod,
  anchor: string, // YYYY-MM-DD
): Promise<TimelineSummary> {
  return marketingApiFetch<TimelineSummary>(
    `/api/marketing/timeline/summary?restaurant_id=${restaurantId}&period=${period}&anchor=${anchor}`,
  );
}

export interface ReminderRecipient {
  customer_id: string;
  phone: string;
  name: string | null;
  code: string;
  discount: number;
  offer: string;
  expires_local_date: string;
}

export interface AccountBalance {
  balance: string;
  available_credit: string;
  currency: string;
}

export interface ReminderPreview {
  recipients: ReminderRecipient[];
  recipient_count: number;
  segments_per_message: number;
  encoding: 'GSM-7' | 'UCS-2';
  cost_per_part: number;
  outbound_cost: number;
  worst_case_cost: number;
  currency: string;
  account_balance: AccountBalance | null;
}

export function previewReminder(
  restaurantId: string,
  source: ReminderSource,
  start: string,
  end: string,
  message: string,
): Promise<ReminderPreview> {
  const params = new URLSearchParams({
    restaurant_id: restaurantId,
    source,
    start,
    end,
    message,
  });
  return marketingApiFetch<ReminderPreview>(`/api/marketing/reminders/preview?${params}`);
}

export type ReminderStatus = 'pending' | 'sent' | 'canceled' | 'failed';

export interface ScheduledReminder {
  id: string;
  restaurant_id: string;
  source: ReminderSource;
  expiry_start: string;
  expiry_end: string;
  message: string;
  send_at: string;
  status: ReminderStatus;
  recipient_count_estimate: number | null;
  recipient_count_actual: number | null;
  created_at: string;
  fired_at: string | null;
}

export function scheduleReminder(params: {
  restaurant_id: string;
  source: ReminderSource;
  expiry_start: string;
  expiry_end: string;
  message: string;
  send_date: string; // YYYY-MM-DD, restaurant-local
  send_time: string; // HH:MM 24h, restaurant-local
}): Promise<ScheduledReminder> {
  return marketingApiFetch<ScheduledReminder>('/api/marketing/reminders', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function sendTestReminder(params: {
  restaurant_id: string;
  phone: string;
  source: ReminderSource;
  expiry_start: string;
  expiry_end: string;
  message: string;
}): Promise<{ phone: string; message: string }> {
  return marketingApiFetch('/api/marketing/test-reminder', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export function fetchReminders(restaurantId: string, status?: ReminderStatus): Promise<{ reminders: ScheduledReminder[] }> {
  const params = new URLSearchParams({ restaurant_id: restaurantId });
  if (status) params.set('status', status);
  return marketingApiFetch(`/api/marketing/reminders?${params}`);
}

export function cancelReminder(restaurantId: string, reminderId: string): Promise<{ status: string }> {
  return marketingApiFetch(`/api/marketing/reminders/${reminderId}?restaurant_id=${restaurantId}`, {
    method: 'DELETE',
  });
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
