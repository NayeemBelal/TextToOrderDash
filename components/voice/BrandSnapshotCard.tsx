'use client';

import { useState, useEffect } from 'react';
import type { RestaurantConfig } from '@/lib/api';

interface BrandSnapshotCardProps {
  config: RestaurantConfig | null;
  onSave: (data: { name?: string; description?: string; address?: string; website?: string }) => Promise<void>;
}

export function BrandSnapshotCard({ config, onSave }: BrandSnapshotCardProps) {
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [draft, setDraft] = useState({ name: '', description: '', website: '', brandTone: 'Fresh, bold, casual' });

  useEffect(() => {
    if (config) {
      setDraft({
        name: config.name ?? '',
        description: config.description ?? '',
        website: config.website ?? '',
        brandTone: 'Fresh, bold, casual',
      });
    }
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({ name: draft.name, description: draft.description, website: draft.website });
      setEditing(false);
    } catch {
      setSaveError("Couldn't save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <h2 className="card-heading text-base">Brand</h2>
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
              disabled={isSaving}
              className="text-xs bg-capy-green text-white px-2.5 py-1 rounded-lg font-bold disabled:opacity-60"
            >
              {isSaving ? '…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0">
        {config === null ? (
          <div className="h-full px-4 pt-3 pb-4 flex flex-col gap-3">
            <div className="animate-pulse w-40 h-5 bg-gray-100 rounded" />
            <div className="animate-pulse w-full h-3 bg-gray-100 rounded" />
            <div className="animate-pulse w-full h-3 bg-gray-100 rounded" />
            <div className="animate-pulse w-3/4 h-3 bg-gray-100 rounded" />
          </div>
        ) : (
          <div className="h-full overflow-y-auto px-4 pb-4 pt-3 flex flex-col gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              {editing ? (
                <input
                  className="w-full border border-capy-border rounded-lg px-2 py-1 text-base text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green font-bold"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-lg text-capy-text leading-tight font-bold">{config.name}</p>
              )}
              {editing ? (
                <input
                  className="w-full border border-capy-border rounded-lg px-3 py-1 text-sm text-capy-muted focus:outline-none focus:ring-2 focus:ring-capy-green"
                  value={draft.website}
                  onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                  placeholder="yoursite.com"
                  disabled={isSaving}
                />
              ) : config.website ? (
                <a href={`https://${config.website}`} className="text-sm text-capy-green-dark hover:underline">{config.website}</a>
              ) : null}
            </div>

            <div>
              <p className="section-label mb-2">About</p>
              {editing ? (
                <textarea
                  className="w-full h-32 border border-capy-border rounded-xl px-3 py-2 text-base text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  disabled={isSaving}
                />
              ) : (
                <p className="text-base text-capy-text leading-relaxed">{config.description ?? '—'}</p>
              )}
            </div>

            <div className="mt-auto pt-3 border-t border-capy-border">
              <p className="section-label mb-1">Tone</p>
              {editing ? (
                <input
                  className="w-full border border-capy-border rounded-lg px-2 py-1 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                  value={draft.brandTone}
                  onChange={(e) => setDraft({ ...draft, brandTone: e.target.value })}
                  disabled={isSaving}
                />
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-capy-bg border border-capy-border text-capy-brown">
                  {draft.brandTone}
                </span>
              )}
            </div>

            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
          </div>
        )}

        {editing && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, white)' }}
          />
        )}
      </div>
    </div>
  );
}
