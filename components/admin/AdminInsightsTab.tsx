"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchInsightsSends,
  fetchJoinFunnel,
  type InsightsRange,
  type JoinFunnelRow,
  type SendStatsRow,
} from "@/lib/insightsApi";
import { Skeleton } from "@/components/ui/Skeleton";

const RANGES: { key: InsightsRange; label: string }[] = [
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
];

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const KIND_LABEL: Record<SendStatsRow["source_kind"], string> = {
  round: "Game",
  promo: "Promo",
  reminder: "Reminder",
};

function pct(rate: number | null): string {
  return rate == null ? "—" : `${Math.round(rate * 100)}%`;
}

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function whenLabel(row: SendStatsRow): string {
  if (row.fired_local_dow == null || row.fired_local_hour == null) return "—";
  const h = row.fired_local_hour;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${DOW[row.fired_local_dow]} ${hour12}${h < 12 ? "am" : "pm"}`;
}

function replyLatency(seconds: number | null): string {
  if (seconds == null) return "—";
  if (seconds < 90) return `${seconds}s`;
  return `${Math.round(seconds / 60)}m`;
}

function Tile({ label, value, sub, loading }: {
  label: string; value: string; sub?: string; loading?: boolean;
}) {
  return (
    <div className="bg-capy-card rounded-2xl border border-capy-border p-4 flex flex-col gap-1 shadow-sm">
      <p className="text-xs text-capy-muted font-medium uppercase tracking-wide leading-none">{label}</p>
      {loading ? (
        <Skeleton className="h-7 md:h-8 w-24 mt-1" />
      ) : (
        <>
          <p className="text-2xl md:text-3xl font-bold text-capy-text leading-tight mt-1 tabular-nums">{value}</p>
          {sub && <p className="text-[11px] text-capy-muted leading-tight">{sub}</p>}
        </>
      )}
    </div>
  );
}

/**
 * Super-admin Insights: the what's-working / what's-not view.
 * Sends table = one report card per fired round/promo/reminder (send_stats,
 * rebuilt nightly). Funnel table = QR scans → form starts → submits →
 * opt-ins per restaurant + src tag, from the web beacon.
 */
export function AdminInsightsTab() {
  const [range, setRange] = useState<InsightsRange>("30d");
  const [sends, setSends] = useState<SendStatsRow[] | null>(null);
  const [funnels, setFunnels] = useState<JoinFunnelRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([fetchInsightsSends(range), fetchJoinFunnel(range)])
      .then(([s, f]) => {
        if (cancelled) return;
        setSends(s.sends);
        setFunnels(f.funnels);
      })
      .catch(() => !cancelled && setError("Couldn't load insights."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const totals = useMemo(() => {
    if (!sends) return null;
    const sum = (fn: (r: SendStatsRow) => number) => sends.reduce((a, r) => a + fn(r), 0);
    const sent = sum((r) => r.sent_count);
    const delivered = sum((r) => r.delivered_count);
    const replies = sum((r) => r.reply_count);
    return {
      sends: sends.length,
      sent,
      deliveryRate: sent ? delivered / sent : null,
      replies,
      replyRate: delivered ? replies / delivered : null,
      redeemed: sum((r) => r.coupons_redeemed),
      revenueExTax: sum((r) => r.attributed_revenue_ex_tax_cents),
      discountCost: sum((r) => r.discount_cost_cents),
      optouts: sum((r) => r.optouts_24h),
    };
  }, [sends]);

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Insights</h2>
            <p className="text-xs text-capy-muted">
              Every send as a report card, plus the QR sign-up funnel
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-capy-border p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  range === r.key
                    ? "bg-capy-bg text-capy-text font-semibold"
                    : "text-capy-muted hover:text-capy-text"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-capy-card border border-capy-border rounded-2xl p-4 text-sm text-capy-muted">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Tile label="Sends" value={`${totals?.sends ?? 0}`} sub={`${totals?.sent ?? 0} messages`} loading={loading} />
          <Tile label="Delivery" value={pct(totals?.deliveryRate ?? null)} sub={`${totals?.optouts ?? 0} opt-outs within 24h`} loading={loading} />
          <Tile label="Replies" value={`${totals?.replies ?? 0}`} sub={`${pct(totals?.replyRate ?? null)} of delivered`} loading={loading} />
          <Tile
            label="Net revenue"
            value={usd((totals?.revenueExTax ?? 0) - (totals?.discountCost ?? 0))}
            sub={`${usd(totals?.revenueExTax ?? 0)} ex-tax − ${usd(totals?.discountCost ?? 0)} discounts`}
            loading={loading}
          />
        </div>

        {/* ── Send report cards ─────────────────────────────────────────── */}
        <div className="bg-capy-card rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-sm font-semibold text-capy-text">Sends</h3>
            <p className="text-[11px] text-capy-muted">
              Newest first. Click a row for the message that was sent.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-capy-muted">
                  <th className="px-4 py-2 text-left font-medium">Send</th>
                  <th className="px-2 py-2 text-left font-medium">When</th>
                  <th className="px-2 py-2 text-right font-medium">Sent</th>
                  <th className="px-2 py-2 text-right font-medium">Delivered</th>
                  <th className="px-2 py-2 text-right font-medium">Replies</th>
                  <th className="px-2 py-2 text-right font-medium">Redeemed</th>
                  <th className="px-2 py-2 text-right font-medium">Net rev</th>
                  <th className="px-4 py-2 text-right font-medium">Opt-outs</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-t border-capy-border">
                      <td className="px-4 py-2.5" colSpan={8}><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))}
                {!loading && sends?.length === 0 && (
                  <tr className="border-t border-capy-border">
                    <td className="px-4 py-6 text-center text-capy-muted" colSpan={8}>
                      No sends in this range.
                    </td>
                  </tr>
                )}
                {!loading &&
                  sends?.map((row) => {
                    const key = `${row.source_kind}:${row.source_id}`;
                    const open = expanded === key;
                    return (
                      <FragmentRow
                        key={key}
                        row={row}
                        open={open}
                        onToggle={() => setExpanded(open ? null : key)}
                      />
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── QR / join funnel ──────────────────────────────────────────── */}
        <div className="bg-capy-card rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 pt-3 pb-2">
            <h3 className="text-sm font-semibold text-capy-text">Sign-up funnel</h3>
            <p className="text-[11px] text-capy-muted">
              QR page views → form starts → submits → opt-ins, per restaurant and src tag.
              Views count from the day the beacon shipped.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-capy-muted">
                  <th className="px-4 py-2 text-left font-medium">Restaurant</th>
                  <th className="px-2 py-2 text-left font-medium">Src</th>
                  <th className="px-2 py-2 text-right font-medium">Views</th>
                  <th className="px-2 py-2 text-right font-medium">Form starts</th>
                  <th className="px-2 py-2 text-right font-medium">Submits</th>
                  <th className="px-2 py-2 text-right font-medium">Opt-ins</th>
                  <th className="px-4 py-2 text-right font-medium">View → opt-in</th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-t border-capy-border">
                      <td className="px-4 py-2.5" colSpan={7}><Skeleton className="h-4 w-full" /></td>
                    </tr>
                  ))}
                {!loading && funnels?.length === 0 && (
                  <tr className="border-t border-capy-border">
                    <td className="px-4 py-6 text-center text-capy-muted" colSpan={7}>
                      No funnel events yet — they start flowing once the join-page beacon is live.
                    </td>
                  </tr>
                )}
                {!loading &&
                  funnels?.map((f) => (
                    <tr key={`${f.restaurant_id}:${f.src}`} className="border-t border-capy-border">
                      <td className="px-4 py-2.5 text-capy-text">{f.restaurant_name}</td>
                      <td className="px-2 py-2.5 text-capy-muted">{f.src}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{f.views}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{f.form_starts}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{f.submits}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums font-semibold text-capy-text">{f.opted_in}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{pct(f.view_to_optin_rate)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ row, open, onToggle }: {
  row: SendStatsRow; open: boolean; onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="border-t border-capy-border cursor-pointer hover:bg-capy-bg/60 transition-colors"
        onClick={onToggle}
      >
        <td className="px-4 py-2.5">
          <div className="flex flex-col">
            <span className="text-capy-text font-medium">
              {KIND_LABEL[row.source_kind]}
              {row.game_type ? ` · ${row.game_type}` : ""}
              {row.discount_percent != null ? ` · ${row.discount_percent}%` : ""}
            </span>
            <span className="text-[11px] text-capy-muted">{row.restaurant_name}</span>
          </div>
        </td>
        <td className="px-2 py-2.5 text-capy-muted whitespace-nowrap">{whenLabel(row)}</td>
        <td className="px-2 py-2.5 text-right tabular-nums">{row.sent_count}</td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.delivered_count} <span className="text-capy-muted text-xs">({pct(row.delivery_rate)})</span>
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.reply_count}
          {row.median_reply_seconds != null && (
            <span className="text-capy-muted text-xs"> · {replyLatency(row.median_reply_seconds)}</span>
          )}
        </td>
        <td className="px-2 py-2.5 text-right tabular-nums">
          {row.coupons_redeemed}/{row.coupons_minted}
        </td>
        <td className={`px-2 py-2.5 text-right tabular-nums font-semibold ${row.net_revenue_cents < 0 ? "text-red-500" : "text-capy-text"}`}>
          {usd(row.net_revenue_cents)}
        </td>
        <td className={`px-4 py-2.5 text-right tabular-nums ${row.optouts_24h > 0 ? "text-red-500" : "text-capy-muted"}`}>
          {row.optouts_24h}
        </td>
      </tr>
      {open && (
        <tr className="border-t border-capy-border bg-capy-bg/40">
          <td className="px-4 py-3" colSpan={8}>
            <div className="text-xs text-capy-muted space-y-1">
              <p className="whitespace-pre-wrap text-capy-text">
                {row.message_text || "Message copy not captured for this send."}
              </p>
              <p>
                {row.winners} winners · {row.losers} losers
                {row.capped_losers > 0 ? ` · ${row.capped_losers} capped (no coupon)` : ""}
                {" · "}
                {row.coupons_consumed} used on orders · {row.attributed_orders} orders ·{" "}
                {usd(row.attributed_revenue_ex_tax_cents)} ex-tax − {usd(row.discount_cost_cents)} discounts
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
