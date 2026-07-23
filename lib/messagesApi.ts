/**
 * Typed client for the Messages tab (belan-marketing-backend `/api/marketing/messages/*`).
 */
import { marketingApiFetch } from '@/lib/api';

export interface SentMessage {
  id: string;
  kind: 'optin' | 'campaign' | 'reminder';
  phone: string | null;
  name: string | null;
  message: string;
  sent_at: string;
  delivery_status: string | null; // 'delivered' | 'delivery_failed' | ... | null (unconfirmed)
  delivery_confirmed_at: string | null;
}

export interface SentMessagesPage {
  items: SentMessage[];
  next_cursor: number | null;
}

export function fetchSentMessages(restaurantId: string, cursor = 0, limit = 50): Promise<SentMessagesPage> {
  return marketingApiFetch<SentMessagesPage>(
    `/api/marketing/messages/sent?restaurant_id=${restaurantId}&cursor=${cursor}&limit=${limit}`,
  );
}

export interface QueuedMessage {
  id: string;
  kind: 'optin' | 'campaign' | 'reminder';
  phone: string | null;
  name: string | null;
  message: string;
  status: 'pending' | 'sending';
  enqueued_at: string;
}

export function fetchQueuedMessages(restaurantId: string): Promise<{ items: QueuedMessage[] }> {
  return marketingApiFetch(`/api/marketing/messages/queued?restaurant_id=${restaurantId}`);
}

export interface ScheduledMessage {
  type: 'reminder' | 'campaign_round';
  id: string;
  label: string;
  message: string | null;
  send_at: string;
  recipient_estimate: number;
}

export function fetchScheduledMessages(restaurantId: string): Promise<{ items: ScheduledMessage[] }> {
  return marketingApiFetch(`/api/marketing/messages/scheduled?restaurant_id=${restaurantId}`);
}

export interface Reconciliation {
  range: '7d' | '30d';
  our_sent_count: number;
  telnyx_message_count: number;
  telnyx_cost: number;
  status: 'ok' | 'drift';
}

export function fetchReconciliation(restaurantId: string, range: '7d' | '30d' = '7d'): Promise<Reconciliation> {
  return marketingApiFetch(`/api/marketing/messages/reconciliation?restaurant_id=${restaurantId}&range=${range}`);
}
