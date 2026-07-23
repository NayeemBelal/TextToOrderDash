"use client";

import { formatUSD } from "@/lib/marketingAnalyticsApi";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  revenueCents: number;
  discountCents: number;
  orderCount: number;
  loading?: boolean;
}

function Tile({ label, value, loading }: { label: string; value: string; loading?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-capy-border p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-capy-muted font-medium uppercase tracking-wide leading-none">
        {label}
      </p>
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

/** The three headline numbers for orders-from-marketing over the selected range. */
export function StatTiles({ revenueCents, discountCents, orderCount, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tile label="Revenue" value={formatUSD(revenueCents)} loading={loading} />
      <Tile label="Discounts given" value={formatUSD(discountCents)} loading={loading} />
      <Tile label="Orders from marketing" value={orderCount.toLocaleString()} loading={loading} />
    </div>
  );
}
