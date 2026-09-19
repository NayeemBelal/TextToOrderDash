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
import { type OptinPoint, type OptinSummary, type RangeKey } from "@/lib/marketingAnalyticsApi";
import { Skeleton } from "@/components/ui/Skeleton";

const GREEN = "#22C55E"; // capy-green — single-series brand accent (matches RevenueChart)

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

const RANGE_BASIS: Record<RangeKey, string> = {
  "7d": "last 7 days",
  "30d": "last 30 days",
  "90d": "last 90 days",
  all: "all time",
};

function fmtAvg(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: n < 10 ? 1 : 0 });
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function monthName(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short" });
}

/**
 * Average pace from the range's daily series, extrapolated to the total
 * opted-in list size at the end of this month and next: today's opted-in
 * total + pace × days remaining. A straight-line estimate — a blast or promo
 * QR launch will move it.
 */
function computePace(series: OptinPoint[], totals: OptinSummary["totals"]) {
  const days = Math.max(1, series.length);
  const perDay = totals.optin_count / days;
  const now = new Date();
  const daysInThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeftThisMonth = daysInThisMonth - now.getDate();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const daysInNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  return {
    perDay,
    perWeek: perDay * 7,
    perMonth: perDay * 30,
    thisMonth: { name: monthName(now), projectedList: totals.total_opted_in + perDay * daysLeftThisMonth },
    nextMonth: {
      name: monthName(nextMonth),
      projectedList: totals.total_opted_in + perDay * (daysLeftThisMonth + daysInNextMonth),
    },
  };
}

function compactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${Math.round(n)}`;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p: OptinPoint = payload[0].payload;
  return (
    <div className="rounded-lg border border-capy-border bg-capy-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-capy-text">{shortDate(label)}</p>
      <p className="text-capy-text tabular-nums mt-0.5">
        {p.count.toLocaleString()} opt-in{p.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

interface Props {
  series: OptinPoint[];
  /** Range totals + baselines for the pace/projection footer; null while loading. */
  totals: OptinSummary["totals"] | null;
  range: RangeKey;
  onRangeChange: (r: RangeKey) => void;
  loading?: boolean;
}

/**
 * Daily new-opt-ins area chart (same layout, ranges and skeleton as RevenueChart)
 * with a pace footer: average per day / week / month over the selected range and
 * a straight-line projection to the end of this month and next.
 */
export function OptinsChart({ series, totals, range, onRangeChange, loading }: Props) {
  const hasData = series.some((p) => p.count > 0);
  const pace = !loading && totals ? computePace(series, totals) : null;
  // Thin out x labels so long ranges don't crowd.
  const tickInterval = Math.max(0, Math.floor(series.length / 6) - 1);

  return (
    <div className="bg-capy-card rounded-2xl border border-capy-border shadow-sm p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-capy-text">Opt-ins per day</h3>
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
            No opt-ins in this range yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="ofmOptinFill" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={compactCount}
                allowDecimals={false}
                width={44}
                tick={{ fill: "#64748B", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#CBD5E1", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={GREEN}
                strokeWidth={2}
                fill="url(#ofmOptinFill)"
                dot={false}
                activeDot={{ r: 4, fill: GREEN, stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pace + projections. Follows the same range picker as the chart. */}
      <div className="mt-3 pt-3 border-t border-capy-border">
        <p className="text-[11px] text-capy-muted uppercase tracking-wide font-medium leading-none mb-2">
          Average pace · {RANGE_BASIS[range]}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {(["Per day", "Per week", "Per month"] as const).map((label, i) => (
            <div key={label} className="rounded-xl bg-capy-bg px-3 py-2">
              <p className="text-[11px] text-capy-muted leading-none">{label}</p>
              {pace ? (
                <p className="text-lg font-bold text-capy-text tabular-nums leading-tight mt-1">
                  {fmtAvg([pace.perDay, pace.perWeek, pace.perMonth][i])}
                </p>
              ) : (
                <Skeleton className="h-6 w-12 mt-1" />
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-capy-muted uppercase tracking-wide font-medium leading-none mt-3 mb-2">
          Projected at this pace
        </p>
        {pace ? (
          <div className="space-y-1.5 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-capy-muted">Total opt-ins by end of {pace.thisMonth.name}</span>
              <span className="text-capy-text font-semibold tabular-nums">
                ~{fmtInt(pace.thisMonth.projectedList)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-capy-muted">Total opt-ins by end of {pace.nextMonth.name}</span>
              <span className="text-capy-text font-semibold tabular-nums">
                ~{fmtInt(pace.nextMonth.projectedList)}
              </span>
            </div>
            <p className="text-[11px] text-capy-muted/70">
              {fmtInt(totals!.total_opted_in)} opted in today
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}
      </div>
    </div>
  );
}
