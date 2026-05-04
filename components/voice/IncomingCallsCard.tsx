'use client';

import { useState, useRef, useEffect } from 'react';
import { CallFeed } from './CallFeed';

export function IncomingCallsCard() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  const handleClose = () => {
    setSearchOpen(false);
    setQuery('');
  };

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden min-h-0 h-full shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        {searchOpen ? (
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-4 h-4 text-capy-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by phone number…"
              className="flex-1 text-sm text-capy-text bg-transparent outline-none placeholder:text-capy-muted"
            />
            <button onClick={handleClose} className="text-capy-muted hover:text-capy-text transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <h2 className="card-heading text-base">Incoming Calls</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="text-capy-muted hover:text-capy-text transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-capy-green animate-pulse" />
                <span className="text-xs text-capy-green-dark font-bold">Live</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        <CallFeed compact filter={query} />
      </div>
    </div>
  );
}
