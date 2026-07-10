"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  COUPON_TYPES,
  fetchSummary,
  type AnalyticsSummary,
  type CouponType,
  type RangeKey,
} from "@/lib/marketingAnalyticsApi";
import { CouponTypeFilter } from "@/components/marketing/revenue/CouponTypeFilter";
import { StatTiles } from "@/components/marketing/revenue/StatTiles";
import { RevenueChart } from "@/components/marketing/revenue/RevenueChart";
import { OrdersList } from "@/components/marketing/revenue/OrdersList";
import { OrderDetailDrawer } from "@/components/marketing/revenue/OrderDetailDrawer";

/**
 * Marketing → Revenue: coupon-attributed revenue from orders-from-marketing.
 * Top: filter + stat tiles + revenue chart. Below: real-time order list → detail.
 */
export function RevenueAnalyticsTab() {
  const { restaurantId } = useAuth();
  const [range, setRange] = useState<RangeKey>("30d");
  const [types, setTypes] = useState<CouponType[]>(COUPON_TYPES);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    fetchSummary(restaurantId, range, types)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setSummary(null))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [restaurantId, range, types]);

  if (!restaurantId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-capy-muted">
        No restaurant linked to this account.
      </div>
    );
  }

  const totals = summary?.totals;

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Revenue</h2>
            <p className="text-xs text-capy-muted">Revenue from orders where a marketing coupon was used</p>
          </div>
          <CouponTypeFilter selected={types} onChange={setTypes} />
        </div>

        <StatTiles
          revenueCents={totals?.revenue_cents ?? 0}
          discountCents={totals?.discount_cents ?? 0}
          orderCount={totals?.order_count ?? 0}
          loading={loading}
        />

        <RevenueChart
          series={summary?.series ?? []}
          range={range}
          onRangeChange={setRange}
          loading={loading}
        />

        <OrdersList restaurantId={restaurantId} types={types} onSelect={setSelectedOrderId} />
      </div>

      <OrderDetailDrawer
        restaurantId={restaurantId}
        cloverOrderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
