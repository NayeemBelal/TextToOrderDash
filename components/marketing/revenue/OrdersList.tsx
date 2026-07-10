"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  COUPON_TYPE_LABEL,
  customerLabel,
  fetchOrders,
  formatUSD,
  type CouponType,
  type OrderListItem,
} from "@/lib/marketingAnalyticsApi";

const POLL_MS = 45_000; // "real-time within ~1 min" — refresh the top of the list

const CHIP: Record<CouponType, string> = {
  optin: "bg-slate-100 text-slate-600",
  winner: "bg-capy-green-light text-capy-green-dark",
  loser: "bg-amber-100 text-amber-700",
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  restaurantId: string;
  types: CouponType[];
  onSelect: (cloverOrderId: string) => void;
}

/** Scrollable, newest-first list of paid orders-from-marketing. Polls for new ones. */
export function OrdersList({ restaurantId, types, onSelect }: Props) {
  const [items, setItems] = useState<OrderListItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Keep the latest types for the interval poll without re-subscribing each render.
  const typesRef = useRef(types);
  typesRef.current = types;

  const loadFirst = useCallback(async () => {
    setLoading(true);
    try {
      const page = await fetchOrders(restaurantId, typesRef.current, 0);
      setItems(page.items);
      setNextCursor(page.next_cursor);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Reload whenever the filter changes.
  useEffect(() => {
    void loadFirst();
  }, [loadFirst, types]);

  // Poll the first page and merge in anything new (dedupe by order id).
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const page = await fetchOrders(restaurantId, typesRef.current, 0);
        setItems((prev) => {
          const seen = new Set(prev.map((o) => o.clover_order_id));
          const fresh = page.items.filter((o) => !seen.has(o.clover_order_id));
          return fresh.length ? [...fresh, ...prev] : prev;
        });
      } catch {
        /* transient — next tick retries */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [restaurantId]);

  const loadMore = async () => {
    if (nextCursor == null) return;
    setLoadingMore(true);
    try {
      const page = await fetchOrders(restaurantId, typesRef.current, nextCursor);
      setItems((prev) => [...prev, ...page.items]);
      setNextCursor(page.next_cursor);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-capy-border shadow-sm flex flex-col overflow-hidden">
      <div className="px-5 pt-4 pb-3 border-b border-capy-border flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-capy-green animate-pulse" />
        <h3 className="text-sm font-semibold text-capy-text">Real-time orders</h3>
      </div>

      {loading ? (
        <div className="px-5 py-10 text-center text-sm text-capy-muted">Loading orders…</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-capy-muted">
          No orders from marketing yet. They&apos;ll appear here as coupons get used.
        </div>
      ) : (
        <div className="divide-y divide-capy-border max-h-[520px] overflow-y-auto">
          {items.map((o) => {
            const { name, phone } = customerLabel(o.customer);
            return (
              <button
                key={o.clover_order_id}
                onClick={() => onSelect(o.clover_order_id)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-capy-bg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-capy-text truncate">{phone}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${CHIP[o.coupon_type]}`}>
                      {COUPON_TYPE_LABEL[o.coupon_type]}
                    </span>
                    <span className="text-xs text-capy-muted truncate">
                      {name ? `${name} · ` : ""}
                      {relativeTime(o.paid_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-capy-text tabular-nums">
                    {formatUSD(o.order_total_cents)}
                  </p>
                  <p className="text-xs text-capy-muted tabular-nums">
                    -{formatUSD(o.discount_amount_cents)}
                  </p>
                </div>
                <svg className="w-4 h-4 text-capy-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}

          {nextCursor != null && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 text-sm text-capy-muted hover:text-capy-text transition-colors disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
