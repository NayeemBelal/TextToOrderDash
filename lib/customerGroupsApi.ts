/**
 * Typed client for static customer groups (belan-marketing-backend
 * `/api/marketing/customer-groups*`) — named, reusable lists of opted-in
 * customers selectable as a one-click filter in the campaign wizard.
 */
import { marketingApiFetch } from '@/lib/api';

export interface CustomerGroup {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  customer_id: string;
  name: string | null;
  phone: string | null;
  added_at: string;
}

export function fetchCustomerGroups(restaurantId: string): Promise<{ groups: CustomerGroup[] }> {
  return marketingApiFetch(`/api/marketing/customer-groups?restaurant_id=${restaurantId}`);
}

export function createCustomerGroup(restaurantId: string, name: string): Promise<CustomerGroup> {
  return marketingApiFetch('/api/marketing/customer-groups', {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, name }),
  });
}

export function renameCustomerGroup(restaurantId: string, groupId: string, name: string): Promise<{ status: string }> {
  return marketingApiFetch(`/api/marketing/customer-groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify({ restaurant_id: restaurantId, name }),
  });
}

export function deleteCustomerGroup(restaurantId: string, groupId: string): Promise<{ status: string }> {
  return marketingApiFetch(`/api/marketing/customer-groups/${groupId}?restaurant_id=${restaurantId}`, {
    method: 'DELETE',
  });
}

export function fetchGroupMembers(restaurantId: string, groupId: string): Promise<{ members: GroupMember[] }> {
  return marketingApiFetch(`/api/marketing/customer-groups/${groupId}/members?restaurant_id=${restaurantId}`);
}

export function addGroupMembers(
  restaurantId: string,
  groupId: string,
  customerIds: string[],
): Promise<{ added: number }> {
  return marketingApiFetch(`/api/marketing/customer-groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, customer_ids: customerIds }),
  });
}

export function removeGroupMember(
  restaurantId: string,
  groupId: string,
  customerId: string,
): Promise<{ status: string }> {
  return marketingApiFetch(
    `/api/marketing/customer-groups/${groupId}/members/${customerId}?restaurant_id=${restaurantId}`,
    { method: 'DELETE' },
  );
}
