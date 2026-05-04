'use client';

import { useState, useEffect } from 'react';
import { TimeFilter } from './TimeFilter';
import { RevenueChart } from './RevenueChart';
import { ChartShimmer } from './ChartShimmer';
export type TimeFilterValue = '1h' | '24h' | '1w' | '1m';
export type ViewMode = 'revenue' | 'orders';
export interface RevenueDataPoint {
  timestamp: Date;
  revenue: number;
  orders: number;
}

const RESTAURANT_ID = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';
const API_BASE_URL = 'https://text-to-order-coffee-34770846162.us-central1.run.app';

interface ItemAnalyticsProps {
  itemId: string;
  itemName: string;
  className?: string;
}

interface AnalyticsMetadata {
  total_revenue: number;
  total_orders: number;
  previous_period_revenue: number;
  previous_period_orders: number;
  revenue_delta_pct: number;
  orders_delta_pct: number;
  comparison_label: string;
  interval: string;
}

export function ItemAnalytics({ itemName, className = '' }: ItemAnalyticsProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilterValue>('24h');
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [itemData, setItemData] = useState<RevenueDataPoint[]>([]);
  const [metadata, setMetadata] = useState<AnalyticsMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [interactiveValue, setInteractiveValue] = useState<number | null>(null);

  const fetchData = async (filter: TimeFilterValue) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        restaurant_id: RESTAURANT_ID,
        item_name: itemName,
        time_range: filter,
      });
      const response = await fetch(`${API_BASE_URL}/api/analytics/item-analytics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();

      setItemData(
        json.data.map((point: { timestamp: string; revenue: number; orders: number }) => ({
          timestamp: new Date(point.timestamp),
          revenue: point.revenue,
          orders: point.orders,
        }))
      );
      setMetadata(json.metadata);
    } catch (err) {
      console.error('ItemAnalytics fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeFilter);
  }, [itemName, activeFilter]);

  const handleFilterChange = (filter: TimeFilterValue) => {
    setActiveFilter(filter);
    setInteractiveValue(null);
  };

  const totalValue = viewMode === 'revenue'
    ? (metadata?.total_revenue ?? 0)
    : (metadata?.total_orders ?? 0);

  const currentValue = interactiveValue !== null ? interactiveValue : totalValue;

  const delta = viewMode === 'revenue'
    ? (metadata?.revenue_delta_pct ?? 0)
    : (metadata?.orders_delta_pct ?? 0);

  const formatValue = (value: number): string => {
    if (viewMode === 'orders') return Math.round(value).toLocaleString('en-US');
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className={`${className}`}>
      <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
        <div className="p-6">
          {isLoading ? (
            <ChartShimmer />
          ) : (
            <>
              {/* Value Display */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {viewMode === 'revenue' ? `${itemName} Revenue` : `${itemName} Orders`}
                  </div>

                  {/* View Mode Toggle */}
                  <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-900">
                    {(['revenue', 'orders'] as ViewMode[]).map(mode => (
                      <button
                        key={mode}
                        onClick={() => { setViewMode(mode); setInteractiveValue(null); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                          viewMode === mode
                            ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
                  {formatValue(currentValue)}
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    delta >= 0
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {metadata?.comparison_label ?? ''}
                  </span>
                </div>
              </div>

              {/* Chart */}
              <RevenueChart
                data={itemData}
                activeFilter={activeFilter}
                viewMode={viewMode}
                onValueChange={setInteractiveValue}
              />
            </>
          )}

          {/* Time Filter */}
          <div className="mt-4">
            <TimeFilter activeFilter={activeFilter} onFilterChange={handleFilterChange} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 rounded-b-lg transition-colors">
          <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: just now</p>
        </div>
      </div>

    </div>
  );
}
