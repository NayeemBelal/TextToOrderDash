'use client';

import { useEffect, useState } from 'react';

type ViewMode = 'revenue' | 'orders';

interface RevenueHeroProps {
  revenue: number;
  delta: number;
  comparisonLabel: string;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
}

export function RevenueHero({ revenue, delta, comparisonLabel, viewMode = 'revenue', onViewModeChange }: RevenueHeroProps) {
  const [displayRevenue, setDisplayRevenue] = useState(revenue);

  useEffect(() => {
    setDisplayRevenue(revenue);
  }, [revenue]);

  const formatValue = (value: number): string => {
    if (viewMode === 'orders') {
      return Math.round(value).toLocaleString('en-US');
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="mb-8">
      {/* Label and Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {viewMode === 'revenue' ? 'Total Revenue' : 'Total Orders'}
        </div>

        {/* Compact View Mode Toggle */}
        {onViewModeChange && (
          <div className="inline-flex rounded-full border border-gray-200 dark:border-gray-800 p-0.5 bg-gray-50 dark:bg-gray-900">
            <button
              onClick={() => onViewModeChange('revenue')}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${
                  viewMode === 'revenue'
                    ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Revenue
            </button>
            <button
              onClick={() => onViewModeChange('orders')}
              className={`
                px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                ${
                  viewMode === 'orders'
                    ? 'bg-white dark:bg-gray-950 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              Orders
            </button>
          </div>
        )}
      </div>

      {/* Main Revenue/Orders Number */}
      <div>
        <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">
          {formatValue(displayRevenue)}
        </div>
      </div>
    </div>
  );
}
