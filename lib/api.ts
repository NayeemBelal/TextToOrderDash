import { supabase } from './supabase';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'https://text-to-order-coffee-34770846162.us-central1.run.app';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

/**
 * fetch() wrapper for the dashboard-scoped marketing backend, which requires a
 * Supabase JWT (Authorization: Bearer) whose user_metadata.restaurant_id matches
 * the restaurant being acted on. Without this header every marketing endpoint
 * returns 401 "Missing bearer token". Mirrors the pattern in the onboarding pages.
 *
 * Returns the raw Response so callers can inspect res.ok / status codes.
 */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

export interface Call {
  id: string;
  timestamp: string;
  timeLabel: string;
  phoneNumber: string;
  customerName: string | null;
  statuses: string[];
  duration: string;
  locationId: string;
}

export interface Caller {
  phoneNumber: string;
  customerName: string | null;
  lastCallAt: string;
  lastStatus: string;
}

export interface VoiceStats {
  totalCalls: number;
  totalCallsDelta: number;
  callMinutes: number;
  avgCallDuration: number;
  newCallers: number;
  repeatCallers: number;
  minutesSaved: number;
  aov: number;
  successfulUpsells: number;
  upsellRevenue: number;
}

export interface RestaurantConfig {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  website: string | null;
  phoneNumber: string;
  voiceCallNumber: string | null;
  aiGreeting: string | null;
  aiVoiceId: string | null;
  forwardingNumber: string | null;
  smsOrderingEnabled: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  active: boolean;
  sortOrder: number;
}

export interface UpsellRule {
  id: string;
  triggerItemName: string;
  suggestedItemName: string;
  message: string;
  active: boolean;
}

export interface SalesAIQueryRecord {
  query: string;
  row_count: number;
  error: string | null;
}

export type SalesAIChartType = "bar" | "time_series";

export interface SalesAIChart {
  type: SalesAIChartType;
  title?: string | null;
  x_key: string;
  y_key: string;
  x_label?: string | null;
  y_label?: string | null;
  data: Array<Record<string, unknown>>;
}

export interface SpecialClosure {
  date: string;
  message: string;
}

export interface BusinessHours {
  googleHours: Record<string, string> | null;
  googleHoursFetchedAt: string | null;
  hoursOverride: Record<string, string | null> | null;
  specialClosures: SpecialClosure[];
  timezone: string;
  isOpen: boolean;
  closedMessage: string | null;
}

export interface SalesAIResponse {
  answer: string;
  message: string;
  thinking: string | null;
  python_code: string | null;
  chart: SalesAIChart | null;
  queries: SalesAIQueryRecord[];
  iterations: number;
  error: string | null;
}
