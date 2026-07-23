"use client";

import { useEffect, useState } from "react";
import {
  COUPON_TYPE_LABEL,
  customerLabel,
  fetchOrderDetail,
  formatUSD,
  type OrderDetail,
} from "@/lib/marketingAnalyticsApi";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  restaurantId: string;
  cloverOrderId: string | null; // null = closed
  onClose: () => void;
}

interface LineItem {
  name: string;
  qty: number;
  priceCents: number;
}

function readLineItems(detail: OrderDetail): LineItem[] {
  const els = detail.order_snapshot?.lineItems?.elements ?? [];
  return els.map((e) => {
    // Fold size/add-on modifiers into the line price so the Items list sums to the
    // Subtotal (the backend computes subtotal the same way: base price + modifiers).
    const mods = (e.modifications?.elements ?? []).reduce((s, m) => s + (m.amount || 0), 0);
    return {
      name: e.name || "Item",
      qty: e.unitQty ? Math.max(1, Math.round(e.unitQty / 1)) : 1,
      priceCents: (e.price || 0) + mods,
    };
  });
}

function paymentMethod(detail: OrderDetail): string | null {
  const p = detail.order_snapshot?.payments?.elements?.[0];
  return p ? "Card / POS" : null;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${strong ? "font-semibold text-capy-text" : "text-capy-muted"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${strong ? "font-bold text-capy-text" : "text-capy-text"}`}>{value}</span>
    </div>
  );
}

/** Slide-over with the full detail of one order-from-marketing. */
export function OrderDetailDrawer({ restaurantId, cloverOrderId, onClose }: Props) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const open = cloverOrderId != null;

  useEffect(() => {
    if (!cloverOrderId) return;
    setDetail(null);
    setError("");
    setLoading(true);
    fetchOrderDetail(restaurantId, cloverOrderId)
      .then(setDetail)
      .catch(() => setError("Could not load this order."))
      .finally(() => setLoading(false));
  }, [restaurantId, cloverOrderId]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cust = detail ? customerLabel(detail.customers ?? detail.customer) : null;
  const items = detail ? readLineItems(detail) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-[slidein_0.18s_ease-out]">
        <style>{`@keyframes slidein{from{transform:translateX(16px);opacity:.6}to{transform:none;opacity:1}}`}</style>

        <div className="flex items-center justify-between px-5 py-4 border-b border-capy-border">
          <h2 className="text-base font-bold text-capy-text">Order details</h2>
          <button onClick={onClose} className="text-capy-muted hover:text-capy-text" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {detail && (
            <>
              <section>
                <p className="text-lg font-bold text-capy-text">{cust?.phone}</p>
                {cust?.name && <p className="text-sm text-capy-muted">{cust.name}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-capy-green-light text-capy-green-dark font-medium">
                    {COUPON_TYPE_LABEL[detail.coupon_type]}
                    {detail.discount_percent ? ` · ${detail.discount_percent}% off` : ""}
                  </span>
                  {detail.prize_code && (
                    <span className="text-xs text-capy-muted font-mono">{detail.prize_code}</span>
                  )}
                </div>
                {detail.paid_at && (
                  <p className="text-xs text-capy-muted mt-2">
                    Paid {new Date(detail.paid_at).toLocaleString("en-US")}
                  </p>
                )}
                {detail.flagged && (
                  <p className="mt-2 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    ⚠ More than one marketing coupon was applied to this order — review at the register.
                  </p>
                )}
              </section>

              <section className="border-t border-capy-border pt-4">
                <p className="text-xs uppercase tracking-wide text-capy-muted font-medium mb-2">Items</p>
                {items.length === 0 ? (
                  <p className="text-sm text-capy-muted">No line items on this order.</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-capy-text">
                          {it.qty > 1 ? `${it.qty}× ` : ""}
                          {it.name}
                        </span>
                        <span className="text-sm text-capy-text tabular-nums">{formatUSD(it.priceCents)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="border-t border-capy-border pt-4">
                <Row label="Subtotal" value={formatUSD(detail.subtotal_cents)} />
                <Row label="Discount" value={`-${formatUSD(detail.discount_amount_cents)}`} />
                {detail.tax_cents > 0 && <Row label="Tax" value={formatUSD(detail.tax_cents)} />}
                <Row label="Total collected" value={formatUSD(detail.order_total_cents)} strong />
                {paymentMethod(detail) && (
                  <p className="text-xs text-capy-muted mt-2">Paid via {paymentMethod(detail)}</p>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
