'use client';

import { useState, useEffect, useCallback } from 'react';
import { RevenueChart } from '@/components/RevenueChart';
import { type TimeFilterValue, type RevenueDataPoint } from '@/components/ItemAnalytics';
import { API_BASE_URL } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type ViewMode = 'revenue' | 'orders';

const TIME_FILTERS: { label: string; value: TimeFilterValue }[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
];

function formatRevenue(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function VoiceRevenueCard() {
  const { restaurantId } = useAuth();
  const [activeFilter, setActiveFilter] = useState<TimeFilterValue>('24h');
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [viewHover, setViewHover] = useState<Record<string, 'hovering' | 'leaving' | null>>({});
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (filter: TimeFilterValue) => {
    if (!restaurantId) return;
    setIsLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/analytics/revenue?restaurant_id=${restaurantId}&time_range=${filter}&timezone=${encodeURIComponent(Intl.DateTimeFormat().resolvedOptions().timeZone)}`
      );
      const data = await res.json();
      setRevenueData(data.data.map((p: any) => ({ timestamp: new Date(p.timestamp), revenue: p.revenue, orders: p.orders })));
      setMetadata(data.metadata);
    } catch {
      setRevenueData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(activeFilter); }, [restaurantId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (filter: TimeFilterValue) => {
    setActiveFilter(filter);
    fetchData(filter);
  };

  const total = metadata
    ? viewMode === 'revenue'
      ? formatRevenue(metadata.total_revenue)
      : `${metadata.total_orders} orders`
    : '—';

  const delta = metadata
    ? viewMode === 'revenue'
      ? metadata.revenue_delta_pct
      : metadata.orders_delta_pct
    : null;

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col h-full min-h-0 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <h2 className="card-heading text-base">Today at a Glance</h2>

        {/* View mode toggle */}
        <div className="flex items-center gap-1">
          {(['revenue', 'orders'] as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            const hover = viewHover[mode];
            return (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                onMouseEnter={() => setViewHover((s) => ({ ...s, [mode]: 'hovering' }))}
                onMouseLeave={() => setViewHover((s) => ({ ...s, [mode]: 'leaving' }))}
                className={`nav-tab-bar relative px-3 pt-1 pb-0.5 text-xs capitalize transition-colors duration-150 ${
                  active
                    ? 'nav-tab-active text-capy-text font-semibold'
                    : hover === 'hovering'
                    ? 'nav-tab-hovering text-capy-text'
                    : hover === 'leaving'
                    ? 'nav-tab-leaving text-capy-muted'
                    : 'text-capy-muted'
                }`}
                style={{ fontFamily: 'Tektur, sans-serif', fontWeight: active ? 600 : 400 }}
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary row */}
      <div className="px-5 py-3 flex-shrink-0">
        <p className="text-3xl font-bold text-capy-text">{total}</p>
        {delta !== null && (
          <p className={`text-xs mt-0.5 font-medium ${delta >= 0 ? 'text-capy-green-dark' : 'text-red-500'}`}>
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs prior period
          </p>
        )}
      </div>

      {/* Chart — fills remaining space, no inner box */}
      <div className="flex-1 min-h-0 pl-3">
        {isLoading || revenueData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-capy-muted">{isLoading ? 'Loading…' : 'No data'}</p>
          </div>
        ) : (
          <RevenueChart
            data={revenueData}
            activeFilter={activeFilter}
            viewMode={viewMode}
            color="#01bf63"
            bare
          />
        )}
      </div>

      {/* Time filters */}
      <div className="flex items-center gap-1 flex-shrink-0 px-5 py-3 border-t border-capy-border">
        {TIME_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors border ${
              activeFilter === f.value
                ? 'bg-capy-text text-white border-capy-text'
                : 'text-capy-muted border-capy-border hover:text-capy-text hover:border-capy-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
