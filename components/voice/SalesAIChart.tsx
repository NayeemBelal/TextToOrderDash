"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SalesAIChart as SalesAIChartPayload } from "@/lib/api";

interface Props {
  chart: SalesAIChartPayload;
}

const ACCENT = "#10B981"; // capy-green family — matches the rest of the dash

function formatNumber(value: unknown): string {
  if (typeof value !== "number" || Number.isNaN(value)) return String(value ?? "");
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  }
  return value.toFixed(value % 1 === 0 ? 0 : 2);
}

function formatTime(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") return String(value ?? "");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  // Short bucket label: "May 12" — good enough for daily/weekly buckets, the
  // most common shape the LLM returns. Falls back to the raw string for
  // anything we can't parse.
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function SalesAIChart({ chart }: Props) {
  const { type, x_key, y_key, title, x_label, y_label, data } = chart;

  if (!Array.isArray(data) || data.length === 0) return null;

  const xFormatter = type === "time_series" ? formatTime : (v: unknown) => String(v ?? "");
  const yFormatter = formatNumber;

  return (
    <div className="w-full bg-white border border-capy-border rounded-2xl px-3 pt-3 pb-1 shadow-sm">
      {title && (
        <div className="text-[11px] uppercase tracking-wide text-capy-muted font-medium px-1 mb-1">
          {title}
        </div>
      )}
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === "time_series" ? (
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="salesAIFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey={x_key}
                tickFormatter={xFormatter}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                label={
                  x_label
                    ? { value: x_label, position: "insideBottom", offset: -2, fontSize: 10, fill: "#9CA3AF" }
                    : undefined
                }
              />
              <YAxis
                tickFormatter={yFormatter}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                width={36}
                label={
                  y_label
                    ? { value: y_label, angle: -90, position: "insideLeft", fontSize: 10, fill: "#9CA3AF" }
                    : undefined
                }
              />
              <Tooltip
                formatter={(value: unknown) => [yFormatter(value), y_label || y_key]}
                labelFormatter={(label: unknown) => xFormatter(label)}
                contentStyle={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey={y_key}
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#salesAIFill)"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey={x_key}
                tickFormatter={xFormatter}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                label={
                  x_label
                    ? { value: x_label, position: "insideBottom", offset: -2, fontSize: 10, fill: "#9CA3AF" }
                    : undefined
                }
              />
              <YAxis
                tickFormatter={yFormatter}
                tick={{ fontSize: 10, fill: "#6B7280" }}
                axisLine={false}
                tickLine={false}
                width={36}
                label={
                  y_label
                    ? { value: y_label, angle: -90, position: "insideLeft", fontSize: 10, fill: "#9CA3AF" }
                    : undefined
                }
              />
              <Tooltip
                formatter={(value: unknown) => [yFormatter(value), y_label || y_key]}
                contentStyle={{
                  background: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  fontSize: 11,
                }}
              />
              <Bar dataKey={y_key} fill={ACCENT} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
