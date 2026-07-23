"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatUSD, type RangeKey, type SummaryPoint } from "@/lib/marketingAnalyticsApi";
import { Skeleton } from "@/components/ui/Skeleton";

const GREEN = "#22C55E"; // capy-green — single-series brand accent (no legend needed)

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "all", label: "All" },
];

function shortDate(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function compactUSD(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(dollars >= 10000 ? 0 : 1)}k`;
  return `$${Math.round(dollars)}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p: SummaryPoint = payload[0].payload;
  return (
    <div className="rounded-lg border border-capy-border bg-white px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-capy-text">{shortDate(label)}</p>
      <p className="text-capy-text tabular-nums mt-0.5">{formatUSD(p.revenue_cents)}</p>
      <p className="text-capy-muted tabular-nums">
        {p.count} order{p.count === 1 ? "" : "s"} · {formatUSD(p.discount_cents)} off
      </p>
    </div>
  );
}

interface Props {
  series: SummaryPoint[];
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  loading?: boolean;
}

export function RevenueChart({ series, range, onRangeChange, loading }: Props) {
  const hasData = series.some((p) => p.revenue_cents > 0);
  // Thin out x labels so long ranges don't crowd.
  const tickInterval = Math.max(0, Math.floor(series.length / 6) - 1);

  return (
    <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-capy-text">Revenue from marketing</h3>
        <div className="inline-flex items-center gap-1 rounded-lg border border-capy-border p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRangeChange(r.key)}
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

      <div className="h-56 w-full">
        {loading ? (
          <div className="h-full flex items-end gap-2 pb-4">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-t"
                // Deterministic per-index heights so the shimmer doesn't jump on re-render.
                style={{ height: `${30 + ((i * 37) % 60)}%` }}
              />
            ))}
          </div>
        ) : !hasData ? (
          <div className="h-full flex items-center justify-center text-sm text-capy-muted">
            No revenue in this range yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ofmRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="day"
                tickFormatter={shortDate}
                interval={tickInterval}
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={{ stroke: "#CBD5E1" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={compactUSD}
                width={44}
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="revenue_cents"
                stroke={GREEN}
                strokeWidth={2}
                fill="url(#ofmRevenueFill)"
                dot={false}
                activeDot={{ r: 4, fill: GREEN, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
