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
const API_BASE_URL = 'http://localhost:8000';

export type TimeFilterValue = '1h' | '24h' | '1w' | '1m' | 'custom';
export type ViewMode = 'revenue' | 'orders';

export interface RevenueDataPoint {
  timestamp: Date;
  revenue: number;
  orders: number;
}

interface RevenueDashboardProps {
  className?: string;
}

// Fetch revenue analytics from backend
const fetchRevenueData = async (filter: TimeFilterValue) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analytics/revenue?restaurant_id=${RESTAURANT_ID}&time_range=${filter}&timezone=UTC`
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
const fetchBestSellers = async (): Promise<BestSellerItem[]> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/analytics/best-sellers?restaurant_id=${RESTAURANT_ID}&time_range=1m&limit=5`
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
        fetchRevenueData('24h'),
        fetchBestSellers(),
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

    const { revenueData: newData, metadata: newMetadata } = await fetchRevenueData(filter);
    setRevenueData(newData);
    setMetadata(newMetadata);
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
