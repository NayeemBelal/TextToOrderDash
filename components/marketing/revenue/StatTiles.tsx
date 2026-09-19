"use client";

import { formatUSD, type RangeKey } from "@/lib/marketingAnalyticsApi";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  revenueCents: number;
  discountCents: number;
  orderCount: number;
  loading?: boolean;
  /** New opt-ins over the opt-ins chart's selected range (follows that chart's picker). */
  optinCount: number;
  optinRange: RangeKey;
  optinLoading?: boolean;
}

const RANGE_LABEL: Record<RangeKey, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

function Tile({
  label,
  value,
  loading,
  action,
}: {
  label: string;
  value: string;
  loading?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-capy-card rounded-2xl border border-capy-border p-4 flex flex-col gap-1 shadow-sm">
      <div className="flex items-center justify-between gap-2 min-h-[18px]">
        <p className="text-xs text-capy-muted font-medium uppercase tracking-wide leading-none">
          {label}
        </p>
        {action}
      </div>
      {loading ? (
        <Skeleton className="h-7 md:h-8 w-24 mt-1" />
      ) : (
        <p className="text-2xl md:text-3xl font-bold text-capy-text leading-tight mt-1 break-words tabular-nums">
          {value}
        </p>
      )}
    </div>
  );
}

/**
 * Headline numbers: the three orders-from-marketing totals over the revenue
 * range, plus total new opt-ins over the opt-ins chart's range — that chart's
 * 7d/30d/90d/All picker drives this tile, so it has no picker of its own.
 */
export function StatTiles({
  revenueCents,
  discountCents,
  orderCount,
  loading,
  optinCount,
  optinRange,
  optinLoading,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile label="Revenue" value={formatUSD(revenueCents)} loading={loading} />
      <Tile label="Discounts given" value={formatUSD(discountCents)} loading={loading} />
      <Tile label="Orders from marketing" value={orderCount.toLocaleString()} loading={loading} />
      <Tile
        label="Opt-ins"
        value={optinCount.toLocaleString()}
        loading={optinLoading}
        action={<span className="text-[11px] text-capy-muted whitespace-nowrap">{RANGE_LABEL[optinRange]}</span>}
      />
    </div>
  );
}
