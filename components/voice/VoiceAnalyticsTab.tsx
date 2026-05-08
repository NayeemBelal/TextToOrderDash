"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiFetch, API_BASE_URL, type VoiceStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type DateRange = "24h" | "1w" | "1m";

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: "Last Day", value: "24h" },
  { label: "Last 7 Days", value: "1w" },
  { label: "Last Month", value: "1m" },
];

interface BestSellerItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend: number;
}

function seedItemHistory(base: number) {
  const factors = [0.7, 0.9, 0.8, 1.1, 1.3, 1.5, 1.2];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return days.map((day, i) => ({
    day,
    orders: Math.max(1, Math.round(base * factors[i])),
  }));
}

function formatAvgDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <span
      className={`text-xs font-semibold ${positive ? "text-capy-green-dark" : "text-red-500"}`}
    >
      {positive ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function StatTile({
  label,
  value,
  delta,
  sub,
}: {
  label: string;
  value: string | number;
  delta: number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-capy-border p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-capy-muted font-medium uppercase tracking-wide leading-none">
        {label}
      </p>
      <p className="text-lg md:text-2xl font-bold text-capy-text leading-tight mt-1 break-words">
        {value}
      </p>
      {sub && <p className="text-xs text-capy-muted">{sub}</p>}
      <div className="mt-auto pt-2 flex items-center gap-1">
        <DeltaBadge delta={delta} />
        <span className="text-xs text-capy-muted">vs prior</span>
      </div>
    </div>
  );
}

// Date range dropdown
function DateRangeDropdown({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (v: DateRange) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = DATE_RANGE_OPTIONS.find((o) => o.value === value)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-capy-border rounded-xl text-sm font-semibold text-capy-text hover:border-capy-text transition-colors shadow-sm"
      >
        <svg
          className="w-3.5 h-3.5 text-capy-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {selected.label}
        <svg
          className={`w-3 h-3 text-capy-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-capy-border rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]">
          {DATE_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                opt.value === value
                  ? "bg-capy-bg text-capy-text font-semibold"
                  : "text-capy-muted hover:bg-capy-bg hover:text-capy-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Top selling items with drilldown mini-chart
function TopSellingItems({ dateRange, restaurantId }: { dateRange: DateRange; restaurantId: string }) {
  const [items, setItems] = useState<BestSellerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<BestSellerItem | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const apiRange = dateRange === "24h" ? "1w" : dateRange;
    fetch(
      `${API_BASE_URL}/api/analytics/best-sellers?restaurant_id=${restaurantId}&time_range=${apiRange}&limit=5`,
    )
      .then((r) => r.json())
      .then((data) => {
        const list = data.items ?? data;
        setItems(list);
        setSelected(list[0] ?? null);
      })
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, [dateRange, restaurantId]);

  const chartData = selected
    ? seedItemHistory(Math.round(selected.orders / 7))
    : [];

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col h-full overflow-hidden shadow-sm">
      <div className="px-5 pt-4 pb-3 border-b border-capy-border flex-shrink-0">
        <h2 className="card-heading text-base">Top Selling Items</h2>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-capy-muted">Loading…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-capy-muted">No data</p>
          </div>
        ) : (
          <>
            <div className="flex-shrink-0 border-b border-capy-border">
              {items.map((item, i) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-capy-border last:border-b-0 ${
                      isSelected ? "bg-capy-bg" : "hover:bg-capy-bg/50"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-gray-100 text-gray-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-capy-bg text-capy-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-semibold text-capy-text truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-capy-muted flex-shrink-0">
                      {item.orders} orders
                    </span>
                    <span
                      className={`text-xs font-semibold flex-shrink-0 ${item.trend >= 0 ? "text-capy-green-dark" : "text-red-500"}`}
                    >
                      {item.trend >= 0 ? "+" : ""}
                      {item.trend.toFixed(0)}%
                    </span>
                    {isSelected && (
                      <span className="w-1 h-4 rounded-full bg-capy-green flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
            {selected && (
              <div className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-4 gap-2">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-capy-text truncate">
                    {selected.name}
                  </p>
                  <p className="text-xs text-capy-muted ml-2 flex-shrink-0">
                    {formatCurrency(selected.revenue)} rev
                  </p>
                </div>
                <div className="flex-1 min-h-0" style={{ minHeight: 80 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      barCategoryGap="30%"
                      margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          fontSize: 11,
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          boxShadow: "none",
                        }}
                        formatter={(v: number) => [`${v} orders`, ""]}
                        labelStyle={{ color: "#64748b" }}
                        cursor={{ fill: "rgba(0,0,0,0.04)" }}
                      />
                      <Bar
                        dataKey="orders"
                        fill="#01bf63"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function VoiceAnalyticsTab() {
  const { restaurantId } = useAuth();
  const [dateRange, setDateRange] = useState<DateRange>("1w");
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    let mounted = true;
    setStatsLoading(true);
    setStatsError(false);
    apiFetch<{ stats: VoiceStats }>(
      `/api/analytics/voice-stats?restaurant_id=${restaurantId}&time_range=${dateRange}`
    )
      .then((data) => { if (mounted) { setStats(data.stats); setStatsLoading(false); } })
      .catch(() => { if (mounted) { setStatsError(true); setStatsLoading(false); } });
    return () => { mounted = false; };
  }, [dateRange, restaurantId]);

  const callMinutesLabel = stats
    ? stats.callMinutes >= 60
      ? `${Math.floor(stats.callMinutes / 60)}h ${Math.round(stats.callMinutes % 60)}m`
      : `${stats.callMinutes}m`
    : "—";

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-y-auto">
      {/* Header row with date filter */}
      <div className="flex items-center justify-between flex-shrink-0">
        <DateRangeDropdown value={dateRange} onChange={setDateRange} />
      </div>

      {/* Top row: Top selling items */}
      <div className="flex-shrink-0" style={{ height: 360 }}>
        <TopSellingItems dateRange={dateRange} restaurantId={restaurantId ?? ''} />
      </div>

      {/* Stat tiles: 3×3 grid */}
      {statsError ? (
        <div className="flex items-center justify-center gap-3 py-6 bg-white rounded-2xl border border-capy-border min-h-[80px]">
          <p className="text-sm text-capy-muted">Couldn&apos;t load analytics.</p>
          <button
            onClick={() => { setStatsError(false); setStatsLoading(true); apiFetch<{ stats: VoiceStats }>(`/api/analytics/voice-stats?restaurant_id=${restaurantId}&time_range=${dateRange}`).then((d) => { setStats(d.stats); setStatsLoading(false); }).catch(() => { setStatsError(true); setStatsLoading(false); }); }}
            className="text-xs font-semibold text-capy-green-dark underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-shrink-0">
          <StatTile
            label="Total Calls"
            value={statsLoading ? "—" : (stats?.totalCalls ?? 0).toLocaleString()}
            delta={stats?.totalCallsDelta ?? 0}
            sub="Handled by Belan AI"
          />
          <StatTile
            label="Call Minutes"
            value={statsLoading ? "—" : callMinutesLabel}
            delta={0}
            sub="Total this period"
          />
          <StatTile
            label="Avg Duration"
            value={statsLoading ? "—" : formatAvgDuration(stats?.avgCallDuration ?? 0)}
            delta={0}
            sub="Per call"
          />
          <StatTile
            label="New Callers"
            value={statsLoading ? "—" : (stats?.newCallers ?? 0).toLocaleString()}
            delta={0}
            sub="First-time callers"
          />
          <StatTile
            label="Repeat Callers"
            value={statsLoading ? "—" : (stats?.repeatCallers ?? 0).toLocaleString()}
            delta={0}
            sub="Return customers"
          />
          <StatTile
            label="Minutes Saved"
            value={statsLoading ? "—" : `${(stats?.minutesSaved ?? 0).toLocaleString()}m`}
            delta={0}
            sub="By AI handling"
          />
          <StatTile
            label="AOV"
            value={statsLoading ? "—" : formatCurrency(stats?.aov ?? 0)}
            delta={0}
            sub="Avg order value"
          />
          <StatTile
            label="Successful Upsells"
            value={statsLoading ? "—" : (stats?.successfulUpsells ?? 0).toLocaleString()}
            delta={0}
            sub="Upsells accepted"
          />
          <StatTile
            label="Upsell Revenue"
            value={statsLoading ? "—" : formatCurrency(stats?.upsellRevenue ?? 0)}
            delta={0}
            sub="From upsell accepts"
          />
        </div>
      )}

      {!statsLoading && stats?.totalCalls === 0 && (
        <p className="text-sm text-capy-muted text-center mt-2">
          These stats will populate after your first customer call.
        </p>
      )}
    </div>
  );
}
