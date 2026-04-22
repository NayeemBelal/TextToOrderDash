'use client';

import { useState, useEffect } from 'react';
import { TimeFilter } from './TimeFilter';
import { RevenueHero } from './RevenueHero';
import { RevenueChart } from './RevenueChart';
import { ChartShimmer } from './ChartShimmer';
// import { AIDataChatbot } from './AIDataChatbot'; // Now using FloatingChatbot in layout
import { BestSellers, type BestSellerItem } from './BestSellers';

// Hardcoded for MVP - Lime N Dime restaurant
const RESTAURANT_ID = 'a9d9fb45-34a7-4c63-b0d9-70add44b6275';
const API_BASE_URL = 'https://text-to-order-coffee-34770846162.us-central1.run.app';

export type TimeFilterValue = '1h' | '24h' | '1w' | '1m' | 'custom';
export type ViewMode = 'revenue' | 'orders';
export type ChannelFilter = 'all' | 'text' | 'voice';

export interface RevenueDataPoint {
  timestamp: Date;
  revenue: number;
  orders: number;
}

interface RevenueDashboardProps {
  className?: string;
}

// Fetch revenue analytics from backend
const fetchRevenueData = async (filter: TimeFilterValue, channel: ChannelFilter = 'all') => {
  try {
    const params = new URLSearchParams({
      restaurant_id: RESTAURANT_ID,
      time_range: filter,
      timezone: 'UTC',
    });
    if (channel !== 'all') {
      params.set('channel_type', channel);
    }
    const response = await fetch(
      `${API_BASE_URL}/api/analytics/revenue?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      revenueData: data.data.map((point: any) => ({
        timestamp: new Date(point.timestamp),
        revenue: point.revenue,
        orders: point.orders,
      })),
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Failed to fetch revenue data:', error);
    // Return empty data on error
    return {
      revenueData: [],
      metadata: {
        total_revenue: 0,
        total_orders: 0,
        revenue_delta_pct: 0,
        orders_delta_pct: 0,
      },
    };
  }
};

// Fetch best sellers from backend
const fetchBestSellers = async (channel: ChannelFilter = 'all'): Promise<BestSellerItem[]> => {
  try {
    const params = new URLSearchParams({
      restaurant_id: RESTAURANT_ID,
      time_range: '1m',
      limit: '5',
    });
    if (channel !== 'all') {
      params.set('channel_type', channel);
    }
    const response = await fetch(
      `${API_BASE_URL}/api/analytics/best-sellers?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.items.map((item: any) => ({
      id: item.id || item.name.toLowerCase().replace(/\s+/g, '-'),
      name: item.name,
      orders: item.orders,
      revenue: item.revenue,
      trend: item.trend,
    }));
  } catch (error) {
    console.error('Failed to fetch best sellers:', error);
    return [];
  }
};

export function RevenueDashboard({ className = '' }: RevenueDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<TimeFilterValue>('24h');
  const [viewMode, setViewMode] = useState<ViewMode>('revenue');
  const [activeChannel, setActiveChannel] = useState<ChannelFilter>('all');
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [interactiveValue, setInteractiveValue] = useState<number | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [bestSellersData, setBestSellersData] = useState<BestSellerItem[]>([]);

  // Fetch initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);

      // Fetch revenue data and best sellers in parallel
      const [revenueResult, bestSellers] = await Promise.all([
        fetchRevenueData('24h', 'all'),
        fetchBestSellers('all'),
      ]);

      setRevenueData(revenueResult.revenueData);
      setMetadata(revenueResult.metadata);
      setBestSellersData(bestSellers);
      setIsLoading(false);
    };

    loadInitialData();
  }, []);

  const handleFilterChange = async (filter: TimeFilterValue) => {
    setIsLoading(true);
    setActiveFilter(filter);

    const { revenueData: newData, metadata: newMetadata } = await fetchRevenueData(filter, activeChannel);
    setRevenueData(newData);
    setMetadata(newMetadata);
    setIsLoading(false);
  };

  const handleChannelChange = async (channel: ChannelFilter) => {
    setIsLoading(true);
    setActiveChannel(channel);
    setInteractiveValue(null);

    const [revenueResult, bestSellers] = await Promise.all([
      fetchRevenueData(activeFilter, channel),
      fetchBestSellers(channel),
    ]);

    setRevenueData(revenueResult.revenueData);
    setMetadata(revenueResult.metadata);
    setBestSellersData(bestSellers);
    setIsLoading(false);
  };

  // Calculate totals from metadata
  const totalValue = metadata
    ? (viewMode === 'revenue' ? metadata.total_revenue : metadata.total_orders)
    : 0;

  // Get delta from metadata based on view mode
  const delta = metadata
    ? (viewMode === 'revenue' ? metadata.revenue_delta_pct : metadata.orders_delta_pct)
    : 0;

  // Use interactive value when scrubbing, otherwise show total
  const currentValue = interactiveValue !== null ? interactiveValue : totalValue;

  // Use comparison label from metadata if available
  const comparisonLabel = metadata?.comparison_label || 'vs. previous period';

  return (
    <div className={`revenue-dashboard ${className}`}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .revenue-dashboard {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white transition-colors">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Main Content Card */}
          <div className="bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <div className="p-6">
              {/* Channel Toggle */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900 rounded-full p-1 border border-gray-200 dark:border-gray-800">
                  {(
                    [
                      {
                        value: 'all' as ChannelFilter,
                        label: 'All',
                        icon: (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
                            <path d="M5 8h6M8 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        ),
                      },
                      {
                        value: 'text' as ChannelFilter,
                        label: 'Text',
                        icon: (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3 2v-2H3a1 1 0 0 1-1-1V3z" />
                          </svg>
                        ),
                      },
                      {
                        value: 'voice' as ChannelFilter,
                        label: 'Voice',
                        icon: (
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328z" />
                          </svg>
                        ),
                      },
                    ] as const
                  ).map(({ value, label, icon }) => {
                    const isActive = activeChannel === value;
                    const activeStyles: Record<ChannelFilter, string> = {
                      all: 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-gray-700',
                      text: 'bg-blue-500 text-white shadow-sm border border-blue-600',
                      voice: 'bg-emerald-500 text-white shadow-sm border border-emerald-600',
                    };
                    return (
                      <button
                        key={value}
                        onClick={() => handleChannelChange(value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                          isActive
                            ? activeStyles[value]
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-transparent'
                        }`}
                      >
                        {icon}
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Channel indicator dot */}
                <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                  {activeChannel === 'text' && (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span>SMS orders only</span>
                    </>
                  )}
                  {activeChannel === 'voice' && (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Voice orders only</span>
                    </>
                  )}
                  {activeChannel === 'all' && (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                      <span>All channels</span>
                    </>
                  )}
                </div>
              </div>

              {/* Content or Shimmer */}
              {isLoading ? (
                <ChartShimmer />
              ) : (
                <>
                  {/* Revenue/Orders Hero */}
                  <RevenueHero
                    revenue={currentValue}
                    delta={delta}
                    comparisonLabel={comparisonLabel}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                  />

                  {/* Chart */}
                  <RevenueChart
                    data={revenueData}
                    activeFilter={activeFilter}
                    viewMode={viewMode}
                    onValueChange={setInteractiveValue}
                  />
                </>
              )}

              {/* Time Filter */}
              <div className="mt-4">
                <TimeFilter
                  activeFilter={activeFilter}
                  onFilterChange={handleFilterChange}
                />
              </div>

              {/* AI Data Chatbot - Now a floating widget in layout */}
            </div>

            {/* Footer Info */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 rounded-b-lg transition-colors">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: just now</p>
            </div>
          </div>

          {/* Best Sellers Card */}
          <div className="mt-6">
            <BestSellers items={bestSellersData} />
          </div>
        </div>
      </div>
    </div>
  );
}
