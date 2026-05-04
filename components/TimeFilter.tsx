'use client';

import { TimeFilterValue } from './ItemAnalytics';

interface TimeFilterProps {
  activeFilter: TimeFilterValue;
  onFilterChange: (filter: TimeFilterValue) => void;
}

const filters: { label: string; value: TimeFilterValue }[] = [
  { label: '1H', value: '1h' },
  { label: '24H', value: '24h' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
];

export function TimeFilter({ activeFilter, onFilterChange }: TimeFilterProps) {
  return (
    <div>
      {/* Compact horizontal pill container - positioned like X-axis */}
      <div className="flex items-center justify-center gap-1.5 overflow-x-auto scrollbar-hide">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`
              flex-shrink-0 px-3 py-1.5 rounded-full font-medium text-xs
              transition-all duration-200
              ${
                activeFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
              }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
