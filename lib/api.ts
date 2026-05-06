export const API_BASE_URL = 'https://text-to-order-coffee-34770846162.us-central1.run.app';

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
