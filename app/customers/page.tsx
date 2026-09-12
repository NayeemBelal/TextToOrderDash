"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSelectedRestaurant } from "@/lib/selected-restaurant-context";
import {
  fetchTimeline,
  searchCustomers,
  syncCustomerPos,
  type CustomerHit,
  type EventCategory,
  type PosSyncResult,
  type TimelineEvent,
  type TimelineResponse,
} from "@/lib/customersApi";
import { CATEGORY_STYLE, TimelineEventCard } from "@/components/customers/TimelineEventCard";
import { Skeleton } from "@/components/ui/Skeleton";

const PAGE_SIZE = 60;
const FILTERS: (EventCategory | "all")[] = ["all", "order", "coupon", "game", "message", "consent", "referral"];

function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : phone;
}

function relative(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 30) return `${Math.floor(d / 30)}mo ago`;
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(today) - start(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: d.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

function money(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="app-card px-4 py-3">
      <p className="section-label">{label}</p>
      <p className="text-xl font-bold text-capy-text mt-0.5 tabular-nums" style={{ fontFamily: "Tektur, sans-serif" }}>{value}</p>
      {sub && <p className="text-[11px] text-capy-muted mt-0.5">{sub}</p>}
    </div>
  );
}

const SOURCE_LABEL: Record<string, string> = {
  web_form: "via QR sign-up", referral: "via a friend's link", blast: "replied YES", import: "imported", organic: "texted in",
};

function CustomersPageInner() {
  const restaurantId = useSelectedRestaurant();
  const router = useRouter();
  const params = useSearchParams();
  const initialId = params.get("customer");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<EventCategory | "all">("all");

  const [sync, setSync] = useState<{ state: "idle" | "checking" | "done"; result?: PosSyncResult }>({ state: "idle" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Search ──
  useEffect(() => {
    if (!restaurantId) return;
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setSearching(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchCustomers(restaurantId, q);
        setResults(res.customers);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, restaurantId]);

  // ── Timeline ──
  const load = useCallback(
    async (customerId: string, offset = 0) => {
      if (!restaurantId) return;
      const first = offset === 0;
      if (first) setLoading(true); else setLoadingMore(true);
      setError(null);
      try {
        const res = await fetchTimeline(restaurantId, customerId, offset, PAGE_SIZE);
        setData(res);
        setEvents((prev) => (first ? res.events : [...prev, ...res.events]));
      } catch {
        setError("Couldn't load this customer's history. Please try again.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [restaurantId],
  );

  // Ask the POS for anything new the moment a customer is opened, then
  // re-read the timeline if orders arrived. Cheap: the backend throttles.
  const checkPos = useCallback(
    async (customerId: string, force = false) => {
      if (!restaurantId) return;
      setSync({ state: "checking" });
      try {
        const r = await syncCustomerPos(restaurantId, customerId, force);
        setSync({ state: "done", result: r });
        if (r.new_orders > 0) await load(customerId, 0);
      } catch {
        setSync({ state: "done", result: { status: "error", new_orders: 0, last_synced_at: null } });
      }
    },
    [restaurantId, load],
  );

  useEffect(() => {
    if (!selectedId || !restaurantId) return;
    setEvents([]);
    setData(null);
    setFilter("all");
    load(selectedId, 0).then(() => checkPos(selectedId));
  }, [selectedId, restaurantId, load, checkPos]);

  const select = (c: CustomerHit) => {
    setShowResults(false);
    setQuery(c.name);
    setSelectedId(c.id);
    router.replace(`/customers?customer=${c.id}`);
  };

  const visible = useMemo(() => (filter === "all" ? events : events.filter((e) => e.category === filter)), [events, filter]);
  const groups = useMemo(() => {
    const out: { day: string; items: TimelineEvent[] }[] = [];
    for (const ev of visible) {
      const day = dayLabel(ev.timestamp);
      const last = out[out.length - 1];
      if (last && last.day === day) last.items.push(ev);
      else out.push({ day, items: [ev] });
    }
    return out;
  }, [visible]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of events) c[e.category] = (c[e.category] ?? 0) + 1;
    return c;
  }, [events]);

  if (!restaurantId) {
    return <div className="h-full flex items-center justify-center p-6 text-sm text-capy-muted">No restaurant linked to this account.</div>;
  }

  const s = data?.summary;
  const consent = s?.consent;
  const posStatus = sync.state === "checking"
    ? "Checking your POS for new orders…"
    : sync.result?.status === "synced"
      ? sync.result.new_orders > 0 ? `${sync.result.new_orders} new order${sync.result.new_orders === 1 ? "" : "s"} pulled from your POS` : "Up to date with your POS"
      : sync.result?.status === "fresh"
        ? "Up to date with your POS"
        : sync.result?.status === "not_in_pos"
          ? "No POS profile found for this number yet"
          : sync.result?.status === "no_pos"
            ? "POS not connected — showing Belan activity only"
            : sync.result?.status === "error"
              ? "Couldn't reach your POS — showing what we have"
              : "";

  return (
    <div className="h-full flex flex-col bg-capy-bg">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Header + search */}
          <div className="mb-5">
            <h1 className="text-xl font-bold text-capy-text" style={{ fontFamily: "Tektur, sans-serif" }}>Customers</h1>
            <p className="text-xs text-capy-muted mt-0.5">Search a phone number or name to see everything: texts, replies, games, coupons and orders — in order.</p>
          </div>

          <div className="relative mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-capy-muted">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Phone number or name…"
                inputMode="search"
                className="w-full pl-11 pr-10 py-3 rounded-2xl border border-capy-border bg-capy-card text-capy-text placeholder:text-capy-muted shadow-card focus:outline-none focus:ring-2 focus:ring-capy-green text-base"
              />
              {searching && (
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  <div className="w-4 h-4 border-2 border-capy-green border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            {showResults && query.trim().length >= 1 && (
              <div className="absolute z-20 mt-2 w-full app-card overflow-hidden">
                {results.length === 0 && !searching ? (
                  <div className="px-4 py-3 text-sm text-capy-muted">No customers match &ldquo;{query}&rdquo;.</div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => select(c)}
                      className="w-full text-left px-4 py-3 hover:bg-capy-surface flex items-center gap-3 border-b border-capy-border/60 last:border-0"
                    >
                      <span className="w-8 h-8 rounded-full bg-capy-surface-2 flex items-center justify-center text-xs font-bold text-capy-muted shrink-0">
                        {(c.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium text-capy-text truncate">{c.name}</span>
                        <span className="block text-xs text-capy-muted">{formatPhone(c.phone)}{c.last_activity_at ? ` · active ${relative(c.last_activity_at)}` : ""}</span>
                      </span>
                      {c.opt_in_status && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${c.opt_in_status === "opted_in" ? "bg-capy-green-light text-capy-green-dark" : "bg-capy-surface-2 text-capy-muted"}`}>
                          {c.opt_in_status === "opted_in" ? "On list" : c.opt_in_status === "opted_out" ? "Opted out" : "Pending"}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          )}

          {error && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-sm text-red-700 dark:text-red-300">{error}</div>}

          {!loading && !error && selectedId && data && s && (
            <div className="space-y-4">
              {/* Customer card */}
              <div className="app-card p-5">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-capy-accent-light text-capy-accent flex items-center justify-center text-xl font-bold shrink-0" style={{ fontFamily: "Tektur, sans-serif" }}>
                    {(data.customer.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-capy-text truncate" style={{ fontFamily: "Tektur, sans-serif" }}>{data.customer.name}</p>
                    <p className="text-sm text-capy-muted font-mono">{formatPhone(data.customer.phone)}{data.customer.email ? ` · ${data.customer.email}` : ""}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${consent?.status === "opted_in" ? "bg-capy-green-light text-capy-green-dark" : consent?.status === "opted_out" ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" : "bg-capy-surface-2 text-capy-muted"}`}>
                        {consent?.status === "opted_in" ? "On your text list" : consent?.status === "opted_out" ? "Opted out" : "Not on your list"}
                        {consent?.status === "opted_in" && consent.source ? ` · ${SOURCE_LABEL[consent.source] ?? consent.source}` : ""}
                      </span>
                      {s.first_seen && <span className="text-[11px] text-capy-muted">First seen {new Date(s.first_seen).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
                      {s.last_activity && <span className="text-[11px] text-capy-muted">· Last activity {relative(s.last_activity)}</span>}
                    </div>
                  </div>
                </div>
                {/* POS sync line */}
                <div className="mt-4 pt-3 border-t border-capy-border flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-capy-muted flex items-center gap-2">
                    {sync.state === "checking" ? <span className="w-3 h-3 border-2 border-capy-green border-t-transparent rounded-full animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-capy-green" />}
                    {posStatus}
                    {data.pos_sync.last_synced_at && sync.state !== "checking" && <span className="text-capy-muted/70">· checked {relative(sync.result?.last_synced_at ?? data.pos_sync.last_synced_at)}</span>}
                  </p>
                  {data.pos_sync.pos_connected && (
                    <button onClick={() => checkPos(selectedId, true)} disabled={sync.state === "checking"} className="text-xs font-semibold text-capy-green-dark hover:underline disabled:opacity-50">
                      Refresh from POS
                    </button>
                  )}
                </div>
              </div>

              {/* Summary tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat label="Lifetime spend" value={money(s.lifetime_spend_cents)} sub={`${s.orders} order${s.orders === 1 ? "" : "s"}${s.last_order_at ? ` · last ${relative(s.last_order_at)}` : ""}`} />
                <Stat label="Coupons" value={`${s.coupons_used}/${s.coupons_issued}`} sub={`used · ${s.coupons_active} active`} />
                <Stat label="Games" value={`${s.games_won}/${s.games_played}`} sub="won · played" />
                <Stat label="Texts" value={`${s.texts_sent}`} sub={`sent · ${s.texts_received} replies`} />
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {FILTERS.map((f) => {
                  const active = filter === f;
                  const n = f === "all" ? events.length : counts[f] ?? 0;
                  if (f !== "all" && n === 0) return null;
                  const style = f === "all" ? null : CATEGORY_STYLE[f];
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors flex items-center gap-1.5 ${
                        active ? "bg-capy-text text-capy-card border-capy-text" : "bg-capy-card border-capy-border text-capy-muted hover:text-capy-text"
                      }`}
                    >
                      {style && <span className="w-2 h-2 rounded-full" style={{ background: style.color }} />}
                      {f === "all" ? "Everything" : style!.label}
                      <span className="opacity-60 tabular-nums">{n}</span>
                    </button>
                  );
                })}
              </div>

              {/* Timeline */}
              {groups.length === 0 ? (
                <div className="app-card text-center py-12 text-capy-muted text-sm">Nothing here yet for this filter.</div>
              ) : (
                <div className="space-y-6">
                  {groups.map((g) => (
                    <section key={g.day}>
                      <div className="sticky top-0 z-10 py-1.5 mb-3 bg-capy-bg/90 backdrop-blur-sm">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-capy-muted px-2 py-1 rounded-md bg-capy-surface-2">{g.day}</span>
                      </div>
                      <div className="space-y-3 pl-1">
                        {g.items.map((ev, i) => (
                          <TimelineEventCard key={`${ev.type}-${ev.timestamp}-${i}`} ev={ev} />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              {data.has_more && filter === "all" && (
                <div className="flex justify-center pt-2">
                  <button onClick={() => load(selectedId, events.length)} disabled={loadingMore} className="btn-secondary">
                    {loadingMore ? "Loading…" : "Load older events"}
                  </button>
                </div>
              )}
            </div>
          )}

          {!selectedId && !loading && (
            <div className="app-card text-center py-16 px-6">
              <div className="text-4xl mb-3">🔎</div>
              <p className="text-sm font-semibold text-capy-text">Look up a customer</p>
              <p className="text-xs text-capy-muted mt-1 max-w-sm mx-auto">
                Type any part of a phone number or name. You&apos;ll get their whole story with your restaurant, and we&apos;ll check your POS for their latest orders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense>
      <CustomersPageInner />
    </Suspense>
  );
}
