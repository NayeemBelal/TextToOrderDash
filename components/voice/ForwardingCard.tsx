'use client';

import { useState, useEffect } from 'react';
import type { RestaurantConfig } from '@/lib/api';

interface ForwardingCardProps {
  config: RestaurantConfig | null;
  onSave: (data: { forwardingNumber: string }) => Promise<void>;
}

export function ForwardingCard({ config, onSave }: ForwardingCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (config) setDraft(config.forwardingNumber ?? '');
  }, [config]);

  const digitsOnly = draft.replace(/\D/g, '');
  const isValid = digitsOnly.length === 10;

  const handleSave = async () => {
    if (!isValid) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({ forwardingNumber: draft });
      setEditing(false);
    } catch {
      setSaveError("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <div>
          <h2 className="card-heading text-base">Call Forwarding</h2>
          <p className="text-xs text-capy-muted mt-0.5">When the AI cannot handle a call, it forwards to this number</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-capy-brown hover:text-capy-text transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditing(false); setSaveError(''); }} className="text-xs text-capy-muted hover:text-capy-text">Cancel</button>
            <button
              onClick={handleSave}
              disabled={isSaving || !isValid}
              className="text-xs bg-capy-green text-white px-2.5 py-1 rounded-lg font-bold disabled:opacity-60"
            >
              {isSaving ? '…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {config === null ? (
          <div className="animate-pulse w-48 h-8 bg-gray-100 rounded-xl" />
        ) : editing ? (
          <>
            <input
              type="tel"
              className="w-full border border-capy-border rounded-xl px-3 py-2 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green font-mono"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              disabled={isSaving}
            />
            {!isValid && draft.length > 0 && (
              <p className="text-xs text-capy-muted mt-1">Enter a valid 10-digit US number</p>
            )}
            {saveError && <p className="text-red-500 text-xs mt-1">{saveError}</p>}
          </>
        ) : (
          <span className="block font-mono text-sm text-capy-text bg-slate-50 border border-capy-border px-3 py-2 rounded-xl">
            {config.forwardingNumber ?? '—'}
          </span>
        )}
      </div>
    </div>
  );
}
