"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SelectedRestaurantProvider } from "@/lib/selected-restaurant-context";
import { MarketingSection } from "@/components/marketing/MarketingSection";

/**
 * Super-admin view of a single restaurant's dashboard — the same Campaign
 * and Revenue tabs the restaurant's own owner sees, scoped to this
 * restaurantId via SelectedRestaurantProvider instead of the admin's own JWT.
 * The back-to-grid affordance lives in AdminTopNav (a plain back arrow).
 */
export default function AdminRestaurantPage() {
  const params = useParams();
  const restaurantId = params?.restaurantId as string;
  const { isSuperAdmin, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-capy-bg">
        <div className="w-6 h-6 border-2 border-capy-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <SelectedRestaurantProvider restaurantId={restaurantId}>
      {/* h-full (not flex-1): this is a direct child of <main>, which is a plain
          block element, not a flex container — flex-1 would be a no-op here and
          this div would grow to fit content instead of being height-bounded,
          silently clipped by main's overflow-hidden with no scrollbar. Matches
          the working pattern in app/home/page.tsx. */}
      <div className="h-full flex flex-col overflow-hidden">
        <MarketingSection />
      </div>
    </SelectedRestaurantProvider>
  );
}
