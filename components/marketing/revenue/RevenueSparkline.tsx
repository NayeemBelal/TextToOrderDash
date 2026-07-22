"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { type SummaryPoint } from "@/lib/marketingAnalyticsApi";

const GREEN = "#22C55E";

/** Minimal no-axes revenue trend line for the admin restaurant grid. */
export function RevenueSparkline({ series }: { series: SummaryPoint[] }) {
  const hasData = series.some((p) => p.revenue_cents > 0);
  if (!hasData) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-capy-muted">
        No revenue yet
      </div>
    );
  }
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparklineFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="revenue_cents"
            stroke={GREEN}
            strokeWidth={2}
            fill="url(#sparklineFill)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
