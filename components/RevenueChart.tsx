'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { TimeFilterValue, RevenueDataPoint, ViewMode } from './ItemAnalytics';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  activeFilter: TimeFilterValue;
  viewMode?: ViewMode;
  onValueChange?: (value: number | null) => void;
  color?: string;
  bare?: boolean;
}

export function RevenueChart({ data, activeFilter, viewMode = 'revenue', onValueChange, color = '#2563EB', bare = false }: RevenueChartProps) {
  const [activePoint, setActivePoint] = useState<RevenueDataPoint | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Format data for Recharts
  const chartData = data.map((d) => ({
    timestamp: d.timestamp.getTime(),
    revenue: d.revenue,
    orders: d.orders,
    displayTime: formatTime(d.timestamp, activeFilter),
  }));

  // Determine if value is growing overall
  const currentValue = viewMode === 'revenue' ? data[data.length - 1]?.revenue : data[data.length - 1]?.orders;
  const startValue = viewMode === 'revenue' ? data[0]?.revenue : data[0]?.orders;
  const isGrowing = data.length > 1 && currentValue > startValue;

  function formatTime(date: Date, filter: TimeFilterValue): string {
    if (filter === '1h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (filter === '24h') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric' });
    }
    if (filter === '1w') {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function formatValue(value: number): string {
    if (viewMode === 'orders') {
      return `${Math.round(value).toLocaleString('en-US')} orders`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const value = viewMode === 'revenue' ? data.revenue : data.orders;
      return (
        <div className="bg-white dark:bg-gray-950 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-800 shadow-lg">
          <p className="text-gray-900 dark:text-white text-base font-semibold mb-0.5">
            {formatValue(value)}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            {data.displayTime}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle mouse/touch interaction
  const handleChartInteraction = (e: any) => {
    if (e && e.activePayload && e.activePayload[0]) {
      const payload = e.activePayload[0].payload;
      const value = viewMode === 'revenue' ? payload.revenue : payload.orders;
      setActivePoint(payload);
      setIsScrubbing(true);
      if (onValueChange) {
        onValueChange(value);
      }
    }
  };

  const handleChartLeave = () => {
    setIsScrubbing(false);
    setActivePoint(null);
    if (onValueChange) {
      onValueChange(null);
    }
  };

  return (
    <div className={bare ? 'h-full touch-none' : 'relative'}>
      <div
        className={bare ? 'h-full' : 'border border-capy-border rounded-lg p-4 bg-white transition-colors touch-none'}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
          <ResponsiveContainer width="100%" height={bare ? '100%' : 480}>
          {viewMode === 'revenue' ? (
            <LineChart
              data={chartData}
              onMouseMove={handleChartInteraction}
              onMouseLeave={handleChartLeave}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                className="dark:stroke-gray-800"
                vertical={false}
              />

              <XAxis
                dataKey="displayTime"
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                className="dark:stroke-gray-600"
                tickLine={false}
                axisLine={{ stroke: '#D1D5DB' }}
              />

              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                className="dark:stroke-gray-600"
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(2)}`}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: '#6B7280',
                  strokeWidth: 1,
                }}
                wrapperStyle={{ outline: 'none' }}
              />

              <Line
                type="monotone"
                dataKey="revenue"
                stroke={color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: color }}
                animationDuration={400}
              />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              onMouseMove={handleChartInteraction}
              onMouseLeave={handleChartLeave}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E5E7EB"
                className="dark:stroke-gray-800"
                vertical={false}
              />

              <XAxis
                dataKey="displayTime"
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                className="dark:stroke-gray-600"
                tickLine={false}
                axisLine={{ stroke: '#D1D5DB' }}
              />

              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                className="dark:stroke-gray-600"
                tickLine={false}
                axisLine={false}
                width={40}
                tickFormatter={(value) => value.toString()}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  fill: 'rgba(107, 114, 128, 0.1)',
                }}
                wrapperStyle={{ outline: 'none' }}
              />

              <Bar
                dataKey="orders"
                fill={color}
                radius={[4, 4, 0, 0]}
                animationDuration={400}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
