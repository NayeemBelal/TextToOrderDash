import { type User } from '@supabase/supabase-js';

// Product subscriptions a dashboard account can have. Stored on the Supabase
// user as `user_metadata.subscriptions: SubscriptionKey[]`.
export type SubscriptionKey = 'ordering' | 'marketing';

export const ALL_SUBSCRIPTIONS: SubscriptionKey[] = ['ordering', 'marketing'];

function isSubscriptionKey(value: unknown): value is SubscriptionKey {
  return (ALL_SUBSCRIPTIONS as string[]).includes(value as string);
}

/**
 * Resolve which subscriptions a user has.
 *
 * - If `user_metadata.subscriptions` is a non-empty array, use it (filtered to
 *   valid keys).
 * - Otherwise fall back for accounts created before subscriptions existed:
 *   marketing-onboarded accounts get `['marketing']`; every other legacy
 *   account keeps full access.
 */
export function resolveSubscriptions(user: User | null): SubscriptionKey[] {
  if (!user) return [];

  const raw = user.user_metadata?.subscriptions;
  if (Array.isArray(raw)) {
    const valid = raw.filter(isSubscriptionKey);
    if (valid.length > 0) return valid;
  }

  if (user.user_metadata?.marketing_onboarding_complete === true) {
    return ['marketing'];
  }

  return [...ALL_SUBSCRIPTIONS];
}
