"use client";

import { useEffect, useState } from "react";
import { useSelectedRestaurant } from "@/lib/selected-restaurant-context";
import {
  COUPON_TYPES,
  fetchOptinSummary,
  fetchSummary,
  type AnalyticsSummary,
  type OptinSummary,
  type CouponType,
  type RangeKey,
} from "@/lib/marketingAnalyticsApi";
import { CouponTypeFilter } from "@/components/marketing/revenue/CouponTypeFilter";
import { StatTiles } from "@/components/marketing/revenue/StatTiles";
import { RevenueChart } from "@/components/marketing/revenue/RevenueChart";
import { OptinsChart } from "@/components/marketing/revenue/OptinsChart";
import { OrdersList } from "@/components/marketing/revenue/OrdersList";
import { OrderDetailDrawer } from "@/components/marketing/revenue/OrderDetailDrawer";

/**
 * Marketing → Analytics: coupon-attributed revenue from orders-from-marketing
 * plus daily opt-ins. Top: filter + stat tiles. Then the revenue chart and the
 * opt-ins chart side by side on wide screens; on phones the opt-ins chart drops
 * below the real-time order list. Order list → detail drawer.
 */
export function RevenueAnalyticsTab() {
  const restaurantId = useSelectedRestaurant();
  const [range, setRange] = useState<RangeKey>("30d");
  const [types, setTypes] = useState<CouponType[]>(COUPON_TYPES);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [optinRange, setOptinRange] = useState<RangeKey>("30d");
  const [optins, setOptins] = useState<OptinSummary | null>(null);
  const [optinsLoading, setOptinsLoading] = useState(true);

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

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setOptinsLoading(true);
    fetchOptinSummary(restaurantId, optinRange)
      .then((s) => !cancelled && setOptins(s))
      .catch(() => !cancelled && setOptins(null))
      .finally(() => !cancelled && setOptinsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [restaurantId, optinRange]);


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
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Analytics</h2>
            <p className="text-xs text-capy-muted">Revenue from orders where a marketing coupon was used, and new opt-ins</p>
          </div>
          <CouponTypeFilter selected={types} onChange={setTypes} />
        </div>

        <StatTiles
          revenueCents={totals?.revenue_cents ?? 0}
          discountCents={totals?.discount_cents ?? 0}
          orderCount={totals?.order_count ?? 0}
          loading={loading}
          optinCount={optins?.totals.optin_count ?? 0}
          optinRange={optinRange}
          optinLoading={optinsLoading}
        />

        {/*
          Phone: revenue chart → order list → opt-ins chart (stacked).
          lg+: the two charts sit side by side, order list full-width beneath.
        */}
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2">
          <RevenueChart
            series={summary?.series ?? []}
            range={range}
            onRangeChange={setRange}
            loading={loading}
          />

          <div className="order-last lg:order-none">
            <OptinsChart
              series={optins?.series ?? []}
              totals={optins?.totals ?? null}
              range={optinRange}
              onRangeChange={setOptinRange}
              loading={optinsLoading}
            />
          </div>

          <div className="lg:col-span-2">
            <OrdersList restaurantId={restaurantId} types={types} onSelect={setSelectedOrderId} />
          </div>
        </div>
      </div>

      <OrderDetailDrawer
        restaurantId={restaurantId}
        cloverOrderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
}
