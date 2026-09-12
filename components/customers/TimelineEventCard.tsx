"use client";

import { useState } from "react";
import type { EventCategory, TimelineEvent } from "@/lib/customersApi";

export const CATEGORY_STYLE: Record<EventCategory, { color: string; label: string; ring: string }> = {
  order: { color: "#10b981", label: "Orders", ring: "ring-emerald-500/30" },
  coupon: { color: "#f59e0b", label: "Coupons", ring: "ring-amber-500/30" },
  game: { color: "#ec4899", label: "Games", ring: "ring-pink-500/30" },
  message: { color: "#64748b", label: "Texts", ring: "ring-slate-500/30" },
  consent: { color: "#8b5cf6", label: "List", ring: "ring-violet-500/30" },
  referral: { color: "#06b6d4", label: "Referrals", ring: "ring-cyan-500/30" },
};

function money(cents: unknown): string {
  const n = typeof cents === "number" ? cents : 0;
  return `$${(n / 100).toFixed(2)}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function DeliveryPill({ delivery }: { delivery?: string }) {
  if (!delivery) return null;
  const map: Record<string, string> = {
    delivered: "bg-capy-green-light text-capy-green-dark",
    failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    sent: "bg-capy-surface-2 text-capy-muted",
  };
  const label = delivery === "delivered" ? "Delivered" : delivery === "failed" ? "Not delivered" : "Sent";
  return <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${map[delivery] ?? map.sent}`}>{label}</span>;
}

/** A message bubble: ours on the left, theirs on the right — reads like the thread. */
function MessageBubble({ ev }: { ev: TimelineEvent }) {
  const inbound = ev.type === "sms_received";
  const failed = ev.type === "sms_failed";
  return (
    <div className={`flex ${inbound ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] sm:max-w-[80%] ${inbound ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className="flex items-center gap-2 text-[11px] text-capy-muted">
          {!inbound && <span className="font-medium">{ev.title}</span>}
          {inbound && <span className="font-medium">They replied</span>}
          {!inbound && !failed && <DeliveryPill delivery={ev.meta.delivery as string | undefined} />}
          <span>{formatTime(ev.timestamp)}</span>
        </div>
        <div
          className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words rounded-2xl ${
            inbound
              ? "bg-capy-accent text-white rounded-br-sm"
              : failed
                ? "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-bl-sm"
                : "bg-capy-card border border-capy-border text-capy-text rounded-bl-sm"
          }`}
        >
          {ev.detail || ev.title}
          {failed && ev.meta.error ? <span className="block mt-1 text-[11px] opacity-80">{String(ev.meta.error)}</span> : null}
        </div>
      </div>
    </div>
  );
}

interface Item { name?: string; price_cents?: number; modifiers?: { name?: string; amount_cents?: number }[] }

/** A receipt-style order card with the line items folded away by default. */
function OrderCard({ ev }: { ev: TimelineEvent }) {
  const [open, setOpen] = useState(false);
  const items = (ev.meta.items as Item[] | undefined) ?? [];
  const state = (ev.meta.state as string) ?? "paid";
  const code = ev.meta.prize_code as string | undefined;
  return (
    <div className="app-card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-capy-surface transition-colors">
        <span className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-lg shrink-0">🧾</span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-capy-text">{state === "paid" ? "Order" : state === "refunded" ? "Refunded order" : "Open order"}</span>
            {code && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">Used {code}</span>}
          </span>
          <span className="block text-xs text-capy-muted truncate mt-0.5">
            {(ev.meta.item_count as number) || items.length} item{((ev.meta.item_count as number) || items.length) === 1 ? "" : "s"} · {formatTime(ev.timestamp)}
          </span>
        </span>
        <span className="text-right shrink-0">
          <span className="block text-base font-bold text-capy-text tabular-nums">{money(ev.meta.total_cents)}</span>
          {typeof ev.meta.discount_cents === "number" && (ev.meta.discount_cents as number) > 0 && (
            <span className="block text-[11px] text-capy-green-dark tabular-nums">saved {money(ev.meta.discount_cents)}</span>
          )}
        </span>
        <svg className={`w-4 h-4 text-capy-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-capy-border px-4 py-3 space-y-1.5">
          {items.length === 0 ? (
            <p className="text-xs text-capy-muted">Item details weren&apos;t included by the POS.</p>
          ) : (
            items.map((it, i) => (
              <div key={i} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-capy-text">
                  {it.name}
                  {it.modifiers && it.modifiers.length > 0 && (
                    <span className="block text-[11px] text-capy-muted">{it.modifiers.map((m) => m.name).filter(Boolean).join(", ")}</span>
                  )}
                </span>
                <span className="tabular-nums text-capy-muted">{money(it.price_cents)}</span>
              </div>
            ))
          )}
          <div className="border-t border-capy-border/60 pt-2 mt-2 text-xs text-capy-muted space-y-0.5">
            {typeof ev.meta.subtotal_cents === "number" && <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(ev.meta.subtotal_cents)}</span></div>}
            {typeof ev.meta.discount_cents === "number" && (ev.meta.discount_cents as number) > 0 && <div className="flex justify-between"><span>Discount</span><span className="tabular-nums">-{money(ev.meta.discount_cents)}</span></div>}
            {typeof ev.meta.tax_cents === "number" && (ev.meta.tax_cents as number) > 0 && <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">{money(ev.meta.tax_cents)}</span></div>}
            <div className="flex justify-between font-semibold text-capy-text"><span>Total</span><span className="tabular-nums">{money(ev.meta.total_cents)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Everything else: a compact milestone row with a coloured marker. */
function MilestoneRow({ ev }: { ev: TimelineEvent }) {
  const style = CATEGORY_STYLE[ev.category] ?? CATEGORY_STYLE.message;
  return (
    <div className="flex items-start gap-3">
      <span
        className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${ev.emphasis ? "ring-4" : "ring-2"} ${style.ring}`}
        style={{ background: `${style.color}1f` }}
      >
        {ev.icon}
      </span>
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-start justify-between gap-3">
          <p className={`text-sm leading-snug ${ev.emphasis ? "font-semibold text-capy-text" : "text-capy-text"}`}>{ev.title}</p>
          <span className="text-[11px] text-capy-muted shrink-0 whitespace-nowrap pt-0.5">{formatTime(ev.timestamp)}</span>
        </div>
        {ev.detail && <p className="text-xs text-capy-muted mt-0.5 break-words leading-relaxed">{ev.detail}</p>}
      </div>
    </div>
  );
}

export function TimelineEventCard({ ev }: { ev: TimelineEvent }) {
  if (ev.category === "message") return <MessageBubble ev={ev} />;
  if (ev.type === "order_placed") return <OrderCard ev={ev} />;
  return <MilestoneRow ev={ev} />;
}
