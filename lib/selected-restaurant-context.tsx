'use client';

import { createContext, useContext } from 'react';
import { useAuth } from '@/lib/auth-context';

const SelectedRestaurantContext = createContext<string | null | undefined>(undefined);

/**
 * The restaurant id the current view should fetch data for. Normal owners
 * always see their own restaurant (from the JWT via useAuth()). Admins
 * viewing /admin/[restaurantId] get an override seeded from the route param
 * by SelectedRestaurantProvider — the tab components underneath don't need
 * to know which case they're in.
 */
export function useSelectedRestaurant(): string | null {
  const override = useContext(SelectedRestaurantContext);
  const { restaurantId } = useAuth();
  return override !== undefined ? override : restaurantId;
}

export function SelectedRestaurantProvider({
  restaurantId,
  children,
}: {
  restaurantId: string;
  children: React.ReactNode;
}) {
  return (
    <SelectedRestaurantContext.Provider value={restaurantId}>
      {children}
    </SelectedRestaurantContext.Provider>
  );
}
