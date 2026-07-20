"use client";

import { Navbar, Sidebar } from "@/components";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { marketingApiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// ── Types (mirror belan-marketing-backend /api/marketing/customers/*) ────────
interface CustomerHit {
  id: string;
  phone: string | null;
  name: string;
}

interface TimelineEvent {
  type: string;
  category: "consent" | "message" | "coupon" | "game" | "order";
  timestamp: string;
  title: string;
  detail: string | null;
  emphasis: boolean;
  icon: string;
  meta: Record<string, unknown>;
}

interface TimelineResponse {
  customer: { id: string; name: string; phone: string | null };
  events: TimelineEvent[];
  total: number;
  offset: number;
  limit: number;
  has_more: boolean;
}

const PAGE_SIZE = 40;

// Accent color per event category — drives the timeline marker + rail.
const CATEGORY_COLOR: Record<TimelineEvent["category"], string> = {
  consent: "#8b5cf6", // violet
  message: "#94a3b8", // slate (granular / low emphasis)
  coupon: "#f59e0b", // amber
  game: "#ec4899", // pink
  order: "#10b981", // green
};

function formatAbsolute(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 30) return `${Math.floor(d / 30)}mo ago`;
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "just now";
}

function formatPhone(phone: string | null): string {
  if (!phone) return "";
  const d = phone.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  if (ten.length === 10)
    return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
  return phone;
}

export default function CustomersPage() {
  const router = useRouter();
  const { restaurantId, signOut } = useAuth();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [selected, setSelected] = useState<CustomerHit | null>(null);
  const [data, setData] = useState<TimelineResponse | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // ── Debounced search ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ restaurant_id: restaurantId, q });
        const res = await marketingApiFetch<{ customers: CustomerHit[] }>(
          `/api/marketing/customers/search?${params}`,
        );
        setResults(res.customers);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, restaurantId]);

  // ── Load a customer's timeline ────────────────────────────────────────────
  const loadTimeline = useCallback(
    async (customer: CustomerHit, offset = 0) => {
      if (!restaurantId) return;
      const first = offset === 0;
      first ? setLoadingTimeline(true) : setLoadingMore(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          restaurant_id: restaurantId,
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        const res = await marketingApiFetch<TimelineResponse>(
          `/api/marketing/customers/${customer.id}/timeline?${params}`,
        );
        setData(res);
        setEvents((prev) => (first ? res.events : [...prev, ...res.events]));
      } catch {
        setError("Couldn't load this customer's history. Please try again.");
      } finally {
        setLoadingTimeline(false);
        setLoadingMore(false);
      }
    },
    [restaurantId],
  );

  const selectCustomer = (c: CustomerHit) => {
    setSelected(c);
    setShowResults(false);
    setQuery(c.name);
    setEvents([]);
    setData(null);
    loadTimeline(c, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar onSignOut={handleSignOut} />
        <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Customer History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Search a phone number or name to see everything that customer has
              done — opt-ins, games, coupons, and orders.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Search by phone number or name…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              {searching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Results dropdown */}
            {showResults && query.trim().length >= 2 && (
              <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg overflow-hidden">
                {results.length === 0 && !searching ? (
                  <div className="px-4 py-3 text-sm text-gray-400">
                    No customers found.
                  </div>
                ) : (
                  results.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-900 last:border-0"
                    >
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {c.name}
                      </span>
                      <span className="text-sm text-gray-400 shrink-0">
                        {formatPhone(c.phone)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          {loadingTimeline && (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {!loadingTimeline && !error && selected && data && (
            <div>
              {/* Customer header card */}
              <div className="mb-6 p-5 rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-lg font-bold text-violet-600 dark:text-violet-300">
                    {(data.customer.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {data.customer.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPhone(data.customer.phone)} · {data.total} event
                      {data.total === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No marketing history yet for this customer.
                </div>
              ) : (
                <ol className="relative">
                  {events.map((ev, i) => {
                    const color = CATEGORY_COLOR[ev.category] ?? "#94a3b8";
                    const isLast = i === events.length - 1;
                    return (
                      <li key={`${ev.type}-${ev.timestamp}-${i}`} className="relative flex gap-4 pb-6">
                        {/* Rail */}
                        {!isLast && (
                          <span
                            className="absolute left-[19px] top-10 bottom-0 w-px bg-gray-200 dark:bg-gray-800"
                            aria-hidden
                          />
                        )}
                        {/* Marker */}
                        <span
                          className={`relative z-[1] flex items-center justify-center rounded-full shrink-0 ${
                            ev.emphasis ? "w-10 h-10 text-lg" : "w-10 h-10 text-base opacity-90"
                          }`}
                          style={{
                            backgroundColor: ev.emphasis ? `${color}22` : "transparent",
                            border: `2px solid ${ev.emphasis ? color : "#cbd5e1"}`,
                          }}
                        >
                          {ev.icon}
                        </span>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className={`${
                                ev.emphasis
                                  ? "font-semibold text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-gray-300"
                              } leading-snug`}
                            >
                              {ev.title}
                            </p>
                            <time
                              className="text-xs text-gray-400 shrink-0 whitespace-nowrap"
                              title={formatAbsolute(ev.timestamp)}
                            >
                              {formatRelative(ev.timestamp)}
                            </time>
                          </div>
                          {ev.detail && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                              {ev.detail}
                            </p>
                          )}
                          <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-0.5">
                            {formatAbsolute(ev.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              {/* Load more */}
              {data.has_more && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => selected && loadTimeline(selected, events.length)}
                    disabled={loadingMore}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading…" : "Load older events"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Empty initial state */}
          {!selected && !loadingTimeline && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">🔎</div>
              <p className="text-sm">
                Search for a customer above to see their full history.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
