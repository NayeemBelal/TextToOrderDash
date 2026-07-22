"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  fetchAdminRestaurants,
  formatUSD,
  type AdminRestaurant,
} from "@/lib/marketingAnalyticsApi";
import { RevenueSparkline } from "@/components/marketing/revenue/RevenueSparkline";

/**
 * Super-admin landing page: one block per signed-up restaurant with a quick
 * 30-day revenue glance. Click a block to open that restaurant's dashboard
 * (app/admin/[restaurantId]) without a separate login.
 */
export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading, signOut } = useAuth();
  const [restaurants, setRestaurants] = useState<AdminRestaurant[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !isSuperAdmin) return;
    let cancelled = false;
    fetchAdminRestaurants("30d")
      .then((r) => !cancelled && setRestaurants(r))
      .catch(() => !cancelled && setError("Couldn't load restaurants."));
    return () => {
      cancelled = true;
    };
  }, [authLoading, isSuperAdmin]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-capy-bg">
        <div className="w-6 h-6 border-2 border-capy-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // ConditionalWrapper redirects non-admins away from /admin
  }

  return (
    <div className="min-h-screen bg-capy-bg">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-capy-text">Restaurants</h1>
            <p className="text-sm text-capy-muted">Revenue over the last 30 days</p>
          </div>
          <button
            onClick={() => signOut()}
            className="text-sm text-capy-muted hover:text-capy-text"
          >
            Sign out
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!error && !restaurants && (
          <div className="flex items-center justify-center py-24 text-sm text-capy-muted">
            Loading restaurants…
          </div>
        )}

        {restaurants && restaurants.length === 0 && (
          <p className="text-sm text-capy-muted">No restaurants yet.</p>
        )}

        {restaurants && restaurants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((r) => (
              <button
                key={r.id}
                onClick={() => router.push(`/admin/${r.id}`)}
                className="text-left bg-white rounded-2xl border border-capy-border shadow-sm p-4 hover:border-capy-green transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-semibold text-capy-text truncate">{r.name}</h2>
                  {!r.active && (
                    <span className="text-xs text-capy-muted border border-capy-border rounded px-1.5 py-0.5">
                      Inactive
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-capy-text tabular-nums">
                  {formatUSD(r.revenue.totals.revenue_cents)}
                </p>
                <p className="text-xs text-capy-muted mb-2">
                  {r.revenue.totals.order_count} order
                  {r.revenue.totals.order_count === 1 ? "" : "s"} · last 30 days
                </p>
                <RevenueSparkline series={r.revenue.series} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
