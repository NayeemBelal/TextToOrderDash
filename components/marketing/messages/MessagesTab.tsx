"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSelectedRestaurant } from "@/lib/selected-restaurant-context";
import {
  fetchSentMessages,
  fetchQueuedMessages,
  fetchScheduledMessages,
  fetchReconciliation,
  type SentMessage,
  type QueuedMessage,
  type ScheduledMessage,
  type Reconciliation,
} from "@/lib/messagesApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeTime, relativeFuture } from "@/components/marketing/timeline/dateUtils";

const POLL_MS = 20_000; // queued/about-to-send is time-sensitive — poll often

const KIND_LABEL: Record<string, string> = {
  optin: "Opt-in",
  campaign: "Game",
  reminder: "Reminder",
};

function DeliveryBadge({ status }: { status: string | null }) {
  if (status === "delivered") {
    return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-capy-green-light text-capy-green-dark">Delivered</span>;
  }
  if (status === "delivery_failed" || status === "sending_failed") {
    return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-red-100 text-red-700">Failed</span>;
  }
  return <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-500">Sent</span>;
}

function RowSkeletons({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-5 w-14 flex-shrink-0" />
        </div>
      ))}
    </>
  );
}

function SentRow({ m }: { m: SentMessage }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-capy-text truncate">{m.name || m.phone || "Unknown"}</p>
          <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600">
            {KIND_LABEL[m.kind] ?? m.kind}
          </span>
        </div>
        <p className="text-xs text-capy-muted truncate mt-0.5">{m.message}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <DeliveryBadge status={m.delivery_status} />
        <span className="text-[11px] text-capy-muted">{relativeTime(m.sent_at)}</span>
      </div>
    </div>
  );
}

function QueuedRow({ m }: { m: QueuedMessage }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-capy-text truncate">{m.name || m.phone || "Unknown"}</p>
        <p className="text-xs text-capy-muted truncate mt-0.5">{m.message}</p>
      </div>
      <span className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-700 flex-shrink-0">
        {m.status === "sending" ? "Sending" : "Queued"}
      </span>
    </div>
  );
}

function ScheduledRow({ m }: { m: ScheduledMessage }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-capy-text truncate">{m.label}</p>
        <p className="text-xs text-capy-muted mt-0.5">
          {m.recipient_estimate.toLocaleString()} recipient{m.recipient_estimate === 1 ? "" : "s"}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-capy-text tabular-nums">{relativeFuture(m.send_at)}</p>
        <p className="text-[11px] text-capy-muted">
          {new Date(m.send_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

/**
 * Full message history for this restaurant: what's already sent (with Telnyx
 * delivery confirmation), what's queued to go out in the next minute, and
 * what's scheduled for later (reminders + upcoming campaign rounds) — so
 * "there's a 7pm blast to 40 people coming" is visible well before it fires.
 */
export function MessagesTab() {
  const restaurantId = useSelectedRestaurant();

  const [sent, setSent] = useState<SentMessage[]>([]);
  const [sentCursor, setSentCursor] = useState<number | null>(0);
  const [sentLoading, setSentLoading] = useState(true);
  const [sentLoadingMore, setSentLoadingMore] = useState(false);

  const [queued, setQueued] = useState<QueuedMessage[] | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledMessage[] | null>(null);
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);

  const loadSentFirst = useCallback(() => {
    if (!restaurantId) return;
    setSentLoading(true);
    fetchSentMessages(restaurantId, 0)
      .then((p) => {
        setSent(p.items);
        setSentCursor(p.next_cursor);
      })
      .catch(() => {})
      .finally(() => setSentLoading(false));
  }, [restaurantId]);

  useEffect(() => {
    loadSentFirst();
  }, [loadSentFirst]);

  const loadMoreSent = async () => {
    if (!restaurantId || sentCursor == null) return;
    setSentLoadingMore(true);
    try {
      const page = await fetchSentMessages(restaurantId, sentCursor);
      setSent((prev) => [...prev, ...page.items]);
      setSentCursor(page.next_cursor);
    } finally {
      setSentLoadingMore(false);
    }
  };

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!restaurantId) return;
    const load = () => {
      fetchQueuedMessages(restaurantId).then((r) => setQueued(r.items)).catch(() => {});
      fetchScheduledMessages(restaurantId).then((r) => setScheduled(r.items)).catch(() => {});
    };
    load();
    pollRef.current = setInterval(load, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    fetchReconciliation(restaurantId, "7d").then(setReconciliation).catch(() => {});
  }, [restaurantId]);

  if (!restaurantId) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-sm text-capy-muted">
        No restaurant linked to this account.
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-capy-text">Messages</h2>
            <p className="text-xs text-capy-muted">Sent, queued, and scheduled SMS for this restaurant</p>
          </div>
          {reconciliation && (
            <div
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                reconciliation.status === "ok"
                  ? "bg-capy-green-light text-capy-green-dark"
                  : "bg-amber-100 text-amber-700"
              }`}
              title="Cross-checked against Telnyx's own usage reports for the last 7 days. Telnyx reporting can lag several hours, so a mismatch here isn't necessarily a problem."
            >
              Telnyx (7d): {reconciliation.telnyx_message_count} vs our {reconciliation.our_sent_count}
            </div>
          )}
        </div>

        {/* Queued — about to send within the next minute */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-capy-border flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <h3 className="text-sm font-semibold text-capy-text">Queued now</h3>
            {queued && (
              <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2 py-0.5 rounded-full ml-auto">
                {queued.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-capy-border/60">
            {queued === null ? (
              <RowSkeletons count={2} />
            ) : queued.length === 0 ? (
              <p className="text-xs text-capy-muted text-center py-6">Nothing in the queue right now.</p>
            ) : (
              queued.map((m) => <QueuedRow key={m.id} m={m} />)
            )}
          </div>
        </div>

        {/* Scheduled — future reminders and campaign rounds */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-capy-border flex items-center gap-2">
            <h3 className="text-sm font-semibold text-capy-text">Scheduled</h3>
            {scheduled && (
              <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2 py-0.5 rounded-full ml-auto">
                {scheduled.length}
              </span>
            )}
          </div>
          <div className="max-h-[50vh] overflow-y-auto divide-y divide-capy-border/60">
            {scheduled === null ? (
              <RowSkeletons count={3} />
            ) : scheduled.length === 0 ? (
              <p className="text-xs text-capy-muted text-center py-6">Nothing scheduled.</p>
            ) : (
              scheduled.map((m) => <ScheduledRow key={`${m.type}-${m.id}`} m={m} />)
            )}
          </div>
        </div>

        {/* Sent — full history, paginated */}
        <div className="bg-white rounded-2xl border border-capy-border shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-capy-border">
            <h3 className="text-sm font-semibold text-capy-text">Sent history</h3>
          </div>
          <div className="max-h-[65vh] overflow-y-auto divide-y divide-capy-border/60">
            {sentLoading ? (
              <RowSkeletons />
            ) : sent.length === 0 ? (
              <p className="text-xs text-capy-muted text-center py-8">No messages sent yet.</p>
            ) : (
              <>
                {sent.map((m) => (
                  <SentRow key={m.id} m={m} />
                ))}
                {sentCursor != null && (
                  <button
                    onClick={loadMoreSent}
                    disabled={sentLoadingMore}
                    className="w-full py-3 text-sm text-capy-muted hover:text-capy-text transition-colors disabled:opacity-50"
                  >
                    {sentLoadingMore ? "Loading…" : "Load more"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
