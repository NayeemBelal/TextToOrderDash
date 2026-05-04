'use client';

import { useState } from 'react';
import type { Call } from '@/lib/api';

interface CallCardProps {
  call: Call;
  compact?: boolean;
}

export function CallCard({ call, compact = false }: CallCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-capy-bg rounded-xl border border-capy-border hover:shadow-sm transition-shadow ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Time + number row */}
          <div className={`flex items-center flex-wrap ${compact ? 'gap-2' : 'gap-4'}`}>
            <span className="text-xs text-capy-muted flex-shrink-0 font-bold">
              {call.timeLabel}
            </span>
            <span className="text-xs text-capy-text truncate">
              {call.customerName ? `${call.customerName} · ` : ''}{call.phoneNumber}
            </span>
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-2 pt-2 border-t border-capy-border text-xs text-capy-muted space-y-0.5">
              <div><span className="font-bold text-capy-text">Duration:</span> {call.duration}</div>
              {call.statuses.length > 0 && (
                <div><span className="font-bold text-capy-text">Status:</span> {call.statuses.join(', ')}</div>
              )}
            </div>
          )}
        </div>

        {/* Details toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 text-xs text-capy-muted hover:text-capy-text transition-colors flex items-center gap-0.5 mt-0.5"
        >
          {expanded ? 'Hide' : 'Details'}
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
