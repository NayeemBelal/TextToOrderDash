'use client';

import { useState, useEffect } from 'react';
import { apiFetch, RESTAURANT_ID, type Call } from '@/lib/api';
import { CallCard } from './CallCard';

interface CallFeedProps {
  compact?: boolean;
  filter?: string;
}

export function CallFeed({ compact = false, filter = '' }: CallFeedProps) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [staleSince, setStaleSince] = useState<number | null>(null);
  const [failCount, setFailCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const fetchCalls = async () => {
      try {
        const data = await apiFetch<{ calls: Call[] }>(
          `/api/calls?restaurant_id=${RESTAURANT_ID}&limit=20`
        );
        if (mounted) {
          setCalls(data.calls);
          setError(false);
          setFailCount(0);
          setStaleSince(null);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
          setFailCount((n) => {
            const next = n + 1;
            if (next >= 2) setStaleSince((s) => s ?? Date.now());
            return next;
          });
          if (calls.length === 0) setError(true);
        }
      }
    };

    fetchCalls();
    const id = setInterval(fetchCalls, 30_000);
    return () => { mounted = false; clearInterval(id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayed = filter
    ? calls.filter((c) => c.phoneNumber.includes(filter))
    : calls;

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error && calls.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <svg className="w-8 h-8 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
        <p className="text-sm font-semibold text-capy-text">Couldn&apos;t load call feed</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-1.5 text-xs font-semibold border border-capy-green text-capy-green-dark rounded-xl hover:bg-capy-green-light transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'}`}>
      {!compact && (
        <div className="flex items-center gap-3 mb-1">
          <h2 className="text-lg text-capy-text font-bold">Recent Calls</h2>
        </div>
      )}

      {displayed.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm font-semibold text-capy-text">No active calls</p>
          <p className="text-xs text-capy-muted mt-1">New orders will appear here as customers call in.</p>
        </div>
      )}

      {displayed.map((call) => (
        <CallCard key={call.id} call={call} compact={compact} />
      ))}

      {staleSince !== null && (
        <p className="text-xs text-capy-muted text-right opacity-60 mt-1">
          · Last updated {Math.round((Date.now() - staleSince) / 60000)}m ago
        </p>
      )}
    </div>
  );
}
