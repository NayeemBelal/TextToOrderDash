"use client";

import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SelectedRestaurantProvider } from "@/lib/selected-restaurant-context";
import { MarketingViewProvider } from "@/lib/marketing-view-context";
import { MarketingSection } from "@/components/marketing/MarketingSection";

/**
 * Super-admin view of a single restaurant's dashboard — the same Campaign
 * and Revenue tabs the restaurant's own owner sees, scoped to this
 * restaurantId via SelectedRestaurantProvider instead of the admin's own JWT.
 */
export default function AdminRestaurantPage() {
  const router = useRouter();
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
      <MarketingViewProvider>
        <div className="flex flex-col h-screen bg-capy-bg overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-capy-border flex-shrink-0">
            <button
              onClick={() => router.push("/admin")}
              className="text-sm text-capy-muted hover:text-capy-text"
            >
              ← All restaurants
            </button>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <MarketingSection />
          </div>
        </div>
      </MarketingViewProvider>
    </SelectedRestaurantProvider>
  );
}
