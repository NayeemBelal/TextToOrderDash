/**
 * Typed client for the unified Campaigns list
 * (belan-marketing-backend `GET /api/marketing/campaigns/all`).
 */
import { marketingApiFetch } from '@/lib/api';

export type CampaignType = 'classic' | 'everyone_wins' | 'promo';

export interface CampaignListItem {
  id: string;
  type: CampaignType;
  status: string; // 'active' | 'paused' | 'ended' (game) | 'pending' | 'sent' | 'canceled' | 'failed' (promo)
  schedule_label: string;
  recipient_count: number;
  created_at: string;
}

export function fetchAllCampaigns(restaurantId: string): Promise<{ campaigns: CampaignListItem[] }> {
  return marketingApiFetch(`/api/marketing/campaigns/all?restaurant_id=${restaurantId}`);
}
