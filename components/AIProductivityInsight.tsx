'use client';

import { TimeFilterValue } from './RevenueDashboard';

interface AIProductivityInsightProps {
  activeFilter: TimeFilterValue;
  isLoading?: boolean;
}

// Calculate time saved based on the filter period
const calculateTimeSaved = (filter: TimeFilterValue): { hours: number; minutes: number } => {
  // Average time per order call: 3-5 minutes
  // AI handles orders instantly, saving that time
  const avgTimePerOrderMinutes = 4;

  // Estimate orders per period based on typical restaurant volume
  let estimatedOrders = 0;

  switch (filter) {
    case '1h':
      estimatedOrders = 12; // ~12 orders per hour during busy times
      break;
    case '24h':
      estimatedOrders = 85; // ~85 orders per day
      break;
    case '1w':
      estimatedOrders = 595; // ~85 orders/day × 7 days
      break;
    case '1m':
      estimatedOrders = 2550; // ~85 orders/day × 30 days
      break;
  }

  const totalMinutes = estimatedOrders * avgTimePerOrderMinutes;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
};

const getTimePeriodLabel = (filter: TimeFilterValue): string => {
  switch (filter) {
    case '1h':
      return 'this hour';
    case '24h':
      return 'today';
    case '1w':
      return 'this week';
    case '1m':
      return 'this month';
    default:
      return 'this period';
  }
};

const formatTimeSaved = (hours: number, minutes: number): string => {
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours}.${Math.round((minutes / 60) * 10)} hours`;
  }
};

export function AIProductivityInsight({ activeFilter, isLoading = false }: AIProductivityInsightProps) {
  const { hours, minutes } = calculateTimeSaved(activeFilter);
  const timeSavedText = formatTimeSaved(hours, minutes);
  const periodLabel = getTimePeriodLabel(activeFilter);

  if (isLoading) {
    return (
      <div className="w-full mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6 transition-colors">
        <div className="animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="flex-1">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-3"></div>
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes shimmer {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="w-full mt-6 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-6 transition-colors">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0 mt-0.5">
          ✨
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
            AI Productivity Insight
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Saved approximately{' '}
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              {timeSavedText}
            </span>
            {' '}of phone time {periodLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
