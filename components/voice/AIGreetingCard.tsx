'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { RestaurantConfig } from '@/lib/api';

const VOICES = [
  { id: 'Mark',   name: 'Mark',   gender: 'male'   as const, accent: 'American' },
  { id: 'Monika', name: 'Monika', gender: 'female' as const, accent: 'American' },
  { id: 'Daniel', name: 'Daniel', gender: 'male'   as const, accent: 'British'  },
  { id: 'Lily',   name: 'Lily',   gender: 'female' as const, accent: 'British'  },
];

interface AIGreetingCardProps {
  config: RestaurantConfig | null;
  onSave: (data: { aiGreeting?: string; aiVoiceId?: string }) => Promise<void>;
}

export function AIGreetingCard({ config, onSave }: AIGreetingCardProps) {
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (config) {
      setDraft(config.aiGreeting ?? '');
      setSelectedVoice(config.aiVoiceId ?? VOICES[0].id);
    }
  }, [config]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setVoiceOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleVoiceOpen = () => {
    if (!voiceOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', top: rect.bottom + 2, left: rect.left, width: rect.width, zIndex: 9999 });
    }
    setVoiceOpen(!voiceOpen);
  };

  const handlePlay = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setPlaying(playing === id ? null : id);
    if (playing !== id) setTimeout(() => setPlaying(null), 2000);
  };

  const handleSave = async () => {
    if (!draft.trim()) return;
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({ aiGreeting: draft, aiVoiceId: selectedVoice });
      setEditing(false);
    } catch {
      setSaveError("Couldn't save changes. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const currentVoice = VOICES.find((v) => v.id === selectedVoice) ?? VOICES[0];

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <h3 className="card-heading text-base">AI Phone Greeting</h3>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-capy-brown hover:text-capy-text transition-colors flex-shrink-0"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => { setEditing(false); setSaveError(''); }} className="text-xs text-capy-muted hover:text-capy-text transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={isSaving || !draft.trim()}
              className="text-xs bg-capy-green text-white px-2.5 py-1 rounded-lg font-bold disabled:opacity-60"
            >
              {isSaving ? '…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {config === null ? (
          <>
            <div className="animate-pulse w-full h-20 bg-gray-100 rounded-xl" />
            <div className="animate-pulse w-32 h-4 bg-gray-100 rounded mt-2" />
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-capy-green-light text-capy-green-dark text-xs font-semibold rounded-full w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-capy-green" />
              Default AI Phone Greeting
            </span>

            {editing ? (
              <>
                <textarea
                  className="flex-1 border border-capy-border rounded-xl px-4 py-3 text-sm text-capy-text leading-relaxed focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
                  rows={4}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={isSaving}
                />
                {!draft.trim() && <p className="text-xs text-capy-muted">Greeting can&apos;t be empty</p>}
                <p className="text-xs text-capy-muted text-right">{draft.length} / 300</p>
              </>
            ) : (
              <div className="flex-1 bg-capy-bg rounded-xl px-4 py-3 text-sm text-capy-text leading-relaxed italic border-l-2 border-capy-green pl-4">
                &ldquo;{config.aiGreeting ?? 'No greeting set'}&rdquo;
              </div>
            )}

            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}

            <div className="mt-auto pt-3 border-t border-capy-border">
              <p className="section-label mb-2">Voice</p>
              <button
                ref={triggerRef}
                onClick={handleVoiceOpen}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-capy-border rounded-lg bg-white hover:border-capy-text transition-colors text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-capy-text font-semibold">{currentVoice.name}</span>
                  <span className="text-xs text-capy-muted">· {currentVoice.accent}</span>
                </div>
                <svg className={`w-4 h-4 text-capy-muted transition-transform ${voiceOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>

      {voiceOpen && typeof window !== 'undefined' && createPortal(
        <div ref={dropdownRef} style={dropdownStyle} className="bg-white border border-capy-border shadow-lg rounded-lg max-h-60 overflow-y-auto">
          {VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playing === voice.id;
            return (
              <div
                key={voice.id}
                onClick={() => { setSelectedVoice(voice.id); setVoiceOpen(false); }}
                className={`flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-capy-green-light' : 'hover:bg-capy-bg'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${isSelected ? 'bg-capy-green border-capy-green' : 'border-capy-muted'}`} />
                  <div className="min-w-0">
                    <p className={`text-sm ${isSelected ? 'font-semibold text-capy-text' : 'text-capy-text'}`}>{voice.name}</p>
                    <p className="text-xs text-capy-muted">{voice.accent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-capy-muted">{voice.gender === 'female' ? '♀' : '♂'}</span>
                  <button
                    onClick={(e) => handlePlay(e, voice.id)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${isPlaying ? 'bg-capy-green border-capy-green text-white' : 'border-capy-border text-capy-muted hover:border-capy-text hover:text-capy-text'}`}
                  >
                    {isPlaying ? (
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    ) : (
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
