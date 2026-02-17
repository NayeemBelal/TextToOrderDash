'use client';

import { useRouter } from 'next/navigation';

export interface BestSellerItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  trend: number; // percentage change
}

interface BestSellersProps {
  items: BestSellerItem[];
  className?: string;
}

export function BestSellers({ items, className = '' }: BestSellersProps) {
  const router = useRouter();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handleItemClick = (itemId: string) => {
    router.push(`/items/${itemId}`);
  };

  return (
    <div className={`bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm transition-colors ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Best Sellers
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Top performing items this month
            </p>
          </div>
          <button
            onClick={() => router.push('/items')}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            View All
          </button>
        </div>

        {/* Leaderboard */}
        <div className="space-y-3">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className="w-full group"
            >
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all cursor-pointer">
                {/* Rank Badge */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  ${index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : ''}
                  ${index === 1 ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' : ''}
                  ${index === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : ''}
                  ${index > 2 ? 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400' : ''}
                `}>
                  {index + 1}
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0 text-left">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{item.orders.toLocaleString()} orders</span>
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.revenue)}
                    </span>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
