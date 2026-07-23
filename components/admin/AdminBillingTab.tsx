"use client";

import { useEffect, useState } from "react";
import {
  fetchBillingSummary,
  formatUSDFromDollars,
  type BillingRangeKey,
  type BillingSummary,
} from "@/lib/adminBillingApi";
import { Skeleton } from "@/components/ui/Skeleton";

const RANGES: { key: BillingRangeKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
];

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

function RowSkeleton() {
  return (
    <tr className="border-t border-capy-border">
      <td className="px-4 py-2.5"><Skeleton className="h-4 w-32" /></td>
      <td className="px-4 py-2.5"><Skeleton className="h-4 w-10 ml-auto" /></td>
      <td className="px-4 py-2.5"><Skeleton className="h-4 w-10 ml-auto" /></td>
      <td className="px-4 py-2.5"><Skeleton className="h-4 w-16 ml-auto" /></td>
    </tr>
  );
}

/**
 * Super-admin SMS billing: total Telnyx spend + per-restaurant breakdown.
 * Cost is attributed via the restaurant_id tag on every Telnyx send, pulled
 * live from Telnyx's usage_reports API (no local cost ledger).
 */
export function AdminBillingTab() {
  const [range, setRange] = useState<BillingRangeKey>("30d");
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchBillingSummary(range)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setError("Couldn't load billing data from Telnyx."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Billing</h2>
            <p className="text-xs text-capy-muted">SMS spend via Telnyx, by restaurant</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-capy-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  range === r.key
                    ? "bg-capy-bg text-capy-text font-semibold"
                    : "text-capy-muted hover:text-capy-text"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Tile
            label="Total SMS spend"
            value={summary ? formatUSDFromDollars(summary.total_cost) : "—"}
            loading={loading}
          />
          <Tile
            label="Untagged spend"
            value={summary ? formatUSDFromDollars(summary.untagged_cost) : "—"}
            loading={loading}
          />
          <Tile
            label="Telnyx account balance"
            value={summary?.account_balance ? formatUSDFromDollars(summary.account_balance.balance) : "—"}
            loading={loading}
          />
        </div>

        <div className="bg-white rounded-2xl border border-capy-border shadow-sm">
          <div className="px-4 py-3 border-b border-capy-border">
            <h3 className="text-sm font-semibold text-capy-text">By restaurant</h3>
          </div>

          {!loading && summary && summary.by_restaurant.length === 0 && (
            <div className="p-6 text-sm text-capy-muted">
              No tagged SMS spend in this range yet.
            </div>
          )}

          {(loading || (summary && summary.by_restaurant.length > 0)) && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-capy-muted uppercase tracking-wide">
                    <th className="px-4 py-2 font-medium">Restaurant</th>
                    <th className="px-4 py-2 font-medium text-right">Messages</th>
                    <th className="px-4 py-2 font-medium text-right">Parts</th>
                    <th className="px-4 py-2 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
                    : summary!.by_restaurant.map((row) => (
                    <tr key={row.restaurant_id} className="border-t border-capy-border">
                      <td className="px-4 py-2.5 text-capy-text font-medium">{row.restaurant_name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-capy-text">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-capy-muted">
                        {row.parts.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-capy-text font-semibold">
                        {formatUSDFromDollars(row.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
