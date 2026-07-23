"use client";

import { useEffect, useState } from "react";
import { useSelectedRestaurant } from "@/lib/selected-restaurant-context";
import {
  fetchTimelineSummary,
  type TimelinePeriod,
  type TimelineSummary,
  type ExpiringEvent,
} from "@/lib/timelineApi";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  periodBounds,
  shiftAnchor,
  formatPeriodLabel,
  toISODate,
  relativeTime,
  formatExpiryDateTime,
} from "./dateUtils";
import { ScheduleReminderPanel } from "./ScheduleReminderPanel";

const PERIODS: { key: TimelinePeriod; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
];

function LaneSkeleton() {
  return (
    <div className="divide-y divide-capy-border/60">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LaneRow({
  name,
  phone,
  sub,
  timeLabel,
  badge,
}: {
  name: string | null;
  phone: string | null;
  sub?: string;
  timeLabel: string;
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-capy-text truncate">
          {name || phone || "Unknown"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {sub && (
            <span className="text-xs text-capy-muted font-mono truncate">
              {sub}
            </span>
          )}
          {badge && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
      </div>
      <span className="text-xs text-capy-muted flex-shrink-0 text-right">
        {timeLabel}
      </span>
    </div>
  );
}

interface LaneProps {
  title: string;
  count: number;
  loading: boolean;
  children: React.ReactNode;
  emptyLabel: string;
  isEmpty: boolean;
  action?: React.ReactNode;
}

function Lane({ title, count, loading, children, emptyLabel, isEmpty, action }: LaneProps) {
  return (
    <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3.5 pb-3 border-b border-capy-border">
        <div className="flex items-center gap-2">
          <p className="card-heading">{title}</p>
          {!loading && (
            <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2.5 py-1 rounded-full">
              {count}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="max-h-[65vh] overflow-y-auto divide-y divide-capy-border/60">
        {loading ? (
          <LaneSkeleton />
        ) : isEmpty ? (
          <p className="text-xs text-capy-muted text-center py-8">{emptyLabel}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * Restaurant-wide, date-bucketed view: opt-ins created, game coupons created,
 * and coupons expiring, for a Day/Week/Month period. From the Expiring lane,
 * schedule a reminder SMS with a live Telnyx cost estimate.
 */
export function CouponTimelineTab() {
  const restaurantId = useSelectedRestaurant();
  const [period, setPeriod] = useState<TimelinePeriod>("day");
  const [anchor, setAnchor] = useState(() => new Date());
  const [summary, setSummary] = useState<TimelineSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedulingFor, setSchedulingFor] = useState<{
    source: ExpiringEvent["source"];
  } | null>(null);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    setLoading(true);
    fetchTimelineSummary(restaurantId, period, toISODate(anchor))
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setError("Couldn't load the timeline."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [restaurantId, period, anchor]);

  if (!restaurantId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-capy-muted">
        No restaurant linked to this account.
      </div>
    );
  }

  const [rangeStart, rangeEnd] = periodBounds(period, anchor);
  const expiringOptin = summary?.expiring.filter((e) => e.source === "optin") ?? [];
  const expiringCampaign = summary?.expiring.filter((e) => e.source === "campaign") ?? [];

  return (
    <div className="p-4">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Coupon Timeline</h2>
            <p className="text-xs text-capy-muted">
              Opt-ins, game coupons, and expirations over time
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-capy-border p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  period === p.key
                    ? "bg-capy-bg text-capy-text font-semibold"
                    : "text-capy-muted hover:text-capy-text"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setAnchor((a) => shiftAnchor(period, a, -1))}
            className="p-1.5 rounded-lg text-capy-muted hover:text-capy-text hover:bg-slate-50 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-capy-text" style={{ fontFamily: "Tektur, sans-serif" }}>
              {formatPeriodLabel(period, anchor)}
            </p>
            <button
              onClick={() => setAnchor(new Date())}
              className="text-[11px] text-capy-muted hover:text-capy-text underline"
            >
              Today
            </button>
          </div>
          <button
            onClick={() => setAnchor((a) => shiftAnchor(period, a, 1))}
            className="p-1.5 rounded-lg text-capy-muted hover:text-capy-text hover:bg-slate-50 transition-colors"
            aria-label="Next"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Lane
            title="Opt-Ins"
            count={summary?.opt_ins.length ?? 0}
            loading={loading}
            isEmpty={(summary?.opt_ins.length ?? 0) === 0}
            emptyLabel="No opt-ins in this period."
          >
            {summary?.opt_ins.map((e, i) => (
              <LaneRow
                key={`${e.customer_id}-${i}`}
                name={e.name}
                phone={e.phone}
                sub={e.phone ?? undefined}
                timeLabel={relativeTime(e.timestamp)}
              />
            ))}
          </Lane>

          <Lane
            title="Game Coupons"
            count={summary?.game_coupons.length ?? 0}
            loading={loading}
            isEmpty={(summary?.game_coupons.length ?? 0) === 0}
            emptyLabel="No game coupons issued in this period."
          >
            {summary?.game_coupons.map((e, i) => (
              <LaneRow
                key={`${e.customer_id}-${i}`}
                name={e.name}
                phone={e.phone}
                sub={e.prize_code}
                timeLabel={relativeTime(e.timestamp)}
                badge={e.is_winner ? "Winner" : e.is_winner === false ? "Consolation" : undefined}
              />
            ))}
          </Lane>

          <Lane
            title="Expiring"
            count={summary?.expiring.length ?? 0}
            loading={loading}
            isEmpty={(summary?.expiring.length ?? 0) === 0}
            emptyLabel="Nothing expiring in this period."
            action={
              (expiringOptin.length > 0 || expiringCampaign.length > 0) && !loading ? (
                <div className="flex items-center gap-3">
                  {expiringOptin.length > 0 && (
                    <button
                      onClick={() => setSchedulingFor({ source: "optin" })}
                      className="text-xs font-semibold text-capy-green-dark hover:underline"
                    >
                      Remind opt-ins
                    </button>
                  )}
                  {expiringCampaign.length > 0 && (
                    <button
                      onClick={() => setSchedulingFor({ source: "campaign" })}
                      className="text-xs font-semibold text-capy-green-dark hover:underline"
                    >
                      Remind game
                    </button>
                  )}
                </div>
              ) : undefined
            }
          >
            {summary?.expiring.map((e, i) => (
              <LaneRow
                key={`${e.customer_id}-${i}`}
                name={e.name}
                phone={e.phone}
                sub={e.prize_code}
                timeLabel={formatExpiryDateTime(e.timestamp)}
                badge={e.source === "optin" ? "Opt-in" : "Game"}
              />
            ))}
          </Lane>
        </div>
      </div>

      {schedulingFor && (
        <ScheduleReminderPanel
          restaurantId={restaurantId}
          source={schedulingFor.source}
          expiryStart={toISODate(rangeStart)}
          expiryEnd={toISODate(rangeEnd)}
          timezone={summary?.timezone ?? "America/Chicago"}
          onClose={() => setSchedulingFor(null)}
        />
      )}
    </div>
  );
}
