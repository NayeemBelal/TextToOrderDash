export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
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
