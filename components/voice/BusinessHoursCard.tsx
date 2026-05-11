'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch, type BusinessHours } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];

const DAY_LABELS: Record<Day, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

function todayKey(): Day {
  return DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];
}

function todayDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

function parseOverrideTime(val: string | null | undefined): { open: string; close: string; closed: boolean } {
  if (!val) return { open: '09:00', close: '21:00', closed: true };
  const parts = val.split('-');
  if (parts.length === 2) return { open: parts[0], close: parts[1], closed: false };
  return { open: '09:00', close: '21:00', closed: false };
}

// Convert 12h time like "11:00 AM" or "12:00 AM" → "HH:MM" 24h string
function to24h(t: string): string {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return t.trim();
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = m[3].toUpperCase();
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${min}`;
}

// Parse either "HH:MM-HH:MM" (override format) or "H:MM AM – H:MM AM" (Google format)
function parseGoogleHours(val: string | undefined): { open: string; close: string; closed: boolean } {
  if (!val) return { open: '09:00', close: '21:00', closed: true };
  // Try override format first: "11:00-00:00"
  const direct = val.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (direct) return { open: direct[1], close: direct[2], closed: false };
  // Try Google Places format: "11:00 AM – 12:00 AM" or "11:00 AM - 12:00 AM"
  const parts = val.split(/\s*[–—-]\s*/);
  if (parts.length === 2) {
    const open = to24h(parts[0]);
    const close = to24h(parts[1]);
    if (open && close) return { open, close, closed: false };
  }
  return { open: '09:00', close: '21:00', closed: false };
}

function to12h(t: string): string {
  const m = t.match(/^(\d{2}):(\d{2})$/);
  if (!m) return t;
  let h = parseInt(m[1], 10);
  const min = m[2];
  const ampm = h < 12 ? 'AM' : 'PM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${min} ${ampm}`;
}

function formatHoursDisplay(val: string | undefined): string {
  if (!val) return 'Not available';
  const direct = val.match(/^(\d{2}:\d{2})-(\d{2}:\d{2})$/);
  if (direct) return `${to12h(direct[1])} – ${to12h(direct[2])}`;
  return val;
}

function formatGoogleHours(val: string | undefined): string {
  if (!val) return 'Not available';
  return formatHoursDisplay(val);
}

export function BusinessHoursCard() {
  const { restaurantId } = useAuth();
  const [hours, setHours] = useState<BusinessHours | null>(null);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Edit state — per-day overrides
  const [draftOverride, setDraftOverride] = useState<Record<Day, { open: string; close: string; closed: boolean }>>(() =>
    Object.fromEntries(DAYS.map(d => [d, { open: '09:00', close: '21:00', closed: false }])) as Record<Day, { open: string; close: string; closed: boolean }>
  );
  const [draftTimezone, setDraftTimezone] = useState('UTC');
  const [closureDate, setClosureDate] = useState(todayDateStr());
  const [closureMessage, setClosureMessage] = useState('');
  const [isAddingClosure, setIsAddingClosure] = useState(false);

  const fetchHours = useCallback(() => {
    if (!restaurantId) return;
    apiFetch<BusinessHours>(`/api/business-hours?restaurant_id=${restaurantId}`)
      .then(setHours)
      .catch(() => {});
  }, [restaurantId]);

  useEffect(() => { fetchHours(); }, [fetchHours]);

  // Initialise draft from fetched data when editing opens
  useEffect(() => {
    if (!editing || !hours) return;
    const override = hours.hoursOverride ?? {};
    setDraftTimezone(hours.timezone ?? 'UTC');
    setDraftOverride(
      Object.fromEntries(
        DAYS.map(d => {
          if (d in override) return [d, parseOverrideTime(override[d])];
          return [d, parseGoogleHours(hours.googleHours?.[d])];
        })
      ) as Record<Day, { open: string; close: string; closed: boolean }>
    );
  }, [editing, hours]);

  const handleSave = async () => {
    if (!restaurantId) return;
    setIsSaving(true);
    setSaveError('');
    try {
      const hoursOverride: Record<string, string | null> = {};
      for (const d of DAYS) {
        const v = draftOverride[d];
        const google = parseGoogleHours(hours?.googleHours?.[d]);
        const sameAsGoogle = !v.closed && !google.closed && v.open === google.open && v.close === google.close;
        if (!sameAsGoogle) {
          hoursOverride[d] = v.closed ? null : `${v.open}-${v.close}`;
        }
      }
      await apiFetch(`/api/restaurant/hours?restaurant_id=${restaurantId}`, {
        method: 'PATCH',
        body: JSON.stringify({ hoursOverride, timezone: draftTimezone }),
      });
      setEditing(false);
      fetchHours();
    } catch {
      setSaveError("Couldn't save hours. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddClosure = async () => {
    if (!restaurantId || !closureDate) return;
    setIsAddingClosure(true);
    try {
      await apiFetch(`/api/restaurant/closure?restaurant_id=${restaurantId}`, {
        method: 'POST',
        body: JSON.stringify({ date: closureDate, message: closureMessage || undefined }),
      });
      setClosureDate(todayDateStr());
      setClosureMessage('');
      fetchHours();
    } catch {
      setSaveError("Couldn't add closure. Try again.");
    } finally {
      setIsAddingClosure(false);
    }
  };

  const handleRemoveClosure = async (date: string) => {
    if (!restaurantId) return;
    try {
      await apiFetch(`/api/restaurant/closure?restaurant_id=${restaurantId}&date=${date}`, {
        method: 'DELETE',
      });
      fetchHours();
    } catch {
      setSaveError("Couldn't remove closure. Try again.");
    }
  };

  const effectiveHours = (day: Day): string => {
    const override = hours?.hoursOverride?.[day];
    if (override !== undefined) return override === null ? 'Closed' : formatHoursDisplay(override);
    return formatGoogleHours(hours?.googleHours?.[day]);
  };

  const today = todayKey();
  const isOpenToday = hours?.isOpen;
  const specialClosures = hours?.specialClosures ?? [];

  return (
    <div className="bg-white rounded-2xl border border-capy-border flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-capy-border flex-shrink-0">
        <div>
          <h2 className="card-heading text-base">Business Hours</h2>
          <p className="text-xs text-capy-muted mt-0.5">
            From Google Maps · override per day or mark dates as closed
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hours && (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isOpenToday
                ? 'bg-capy-green-light text-capy-green-dark border-capy-green'
                : 'bg-red-50 text-red-600 border-red-200'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isOpenToday ? '#16a34a' : '#dc2626' }} />
              {isOpenToday ? 'Open now' : 'Closed now'}
            </span>
          )}
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-capy-brown hover:text-capy-text transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Override
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
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-4">
        {hours === null ? (
          <div className="space-y-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="animate-pulse flex justify-between">
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-36 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : editing ? (
          <>
            {/* Timezone */}
            <div>
              <p className="section-label mb-2">TIMEZONE</p>
              <input
                type="text"
                value={draftTimezone}
                onChange={e => setDraftTimezone(e.target.value)}
                placeholder="e.g. America/Chicago"
                className="w-full border border-capy-border rounded-xl px-3 py-2 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              />
            </div>

            {/* Per-day overrides */}
            <div>
              <p className="section-label mb-2">WEEKLY HOURS OVERRIDE</p>
              <div className="space-y-2">
                {DAYS.map(day => {
                  const v = draftOverride[day];
                  return (
                    <div key={day} className="flex items-center gap-2">
                      <span className="w-24 text-sm text-capy-text shrink-0">{DAY_LABELS[day]}</span>
                      <label className="flex items-center gap-1 text-xs text-capy-muted shrink-0">
                        <input
                          type="checkbox"
                          checked={v.closed}
                          onChange={e => setDraftOverride(prev => ({ ...prev, [day]: { ...v, closed: e.target.checked } }))}
                          className="accent-capy-green"
                        />
                        Closed
                      </label>
                      {!v.closed && (
                        <>
                          <input
                            type="time"
                            value={v.open}
                            onChange={e => setDraftOverride(prev => ({ ...prev, [day]: { ...v, open: e.target.value } }))}
                            className="border border-capy-border rounded-lg px-2 py-1 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                          />
                          <span className="text-xs text-capy-muted">–</span>
                          <input
                            type="time"
                            value={v.close}
                            onChange={e => setDraftOverride(prev => ({ ...prev, [day]: { ...v, close: e.target.value } }))}
                            className="border border-capy-border rounded-lg px-2 py-1 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
                          />
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDraftOverride(prev => ({ ...prev, [day]: parseGoogleHours(hours?.googleHours?.[day]) }))}
                        className="ml-auto text-xs text-capy-muted hover:text-capy-brown transition-colors shrink-0"
                        title="Restore Google Maps hours"
                      >
                        Reset
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            {saveError && <p className="text-red-500 text-xs">{saveError}</p>}
          </>
        ) : (
          <>
            {/* Read-only weekly view */}
            <div className="space-y-1.5">
              {DAYS.map(day => (
                <div key={day} className={`flex justify-between text-sm px-3 py-1.5 rounded-xl ${day === today ? 'bg-capy-green-light' : ''}`}>
                  <span className={`font-medium ${day === today ? 'text-capy-green-dark' : 'text-capy-text'}`}>
                    {DAY_LABELS[day]}
                    {day === today && <span className="ml-1 text-xs font-normal">(today)</span>}
                  </span>
                  <span className={`${day === today ? 'text-capy-green-dark font-medium' : 'text-capy-muted'}`}>
                    {effectiveHours(day)}
                  </span>
                </div>
              ))}
            </div>

            {hours?.closedMessage && (
              <p className="text-xs text-red-500 mt-1 px-1">{hours.closedMessage}</p>
            )}
          </>
        )}

        {/* Special closures — always visible */}
        <div className="border-t border-capy-border pt-4">
          <p className="section-label mb-2">SPECIAL CLOSURES</p>

          {specialClosures.length > 0 && (
            <ul className="space-y-1.5 mb-3">
              {specialClosures.map(c => (
                <li key={c.date} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <div>
                    <span className="text-sm font-medium text-red-700">{c.date}</span>
                    {c.message && <span className="ml-2 text-xs text-red-500">{c.message}</span>}
                  </div>
                  <button
                    onClick={() => handleRemoveClosure(c.date)}
                    className="text-xs text-red-400 hover:text-red-600 ml-2"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add closure form */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={closureDate}
              onChange={e => setClosureDate(e.target.value)}
              className="border border-capy-border rounded-xl px-3 py-1.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={closureMessage}
              onChange={e => setClosureMessage(e.target.value)}
              className="flex-1 border border-capy-border rounded-xl px-3 py-1.5 text-sm text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
            />
            <button
              onClick={handleAddClosure}
              disabled={isAddingClosure || !closureDate}
              className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-xl font-bold disabled:opacity-60 whitespace-nowrap"
            >
              {isAddingClosure ? '…' : 'Mark Closed'}
            </button>
          </div>
          {saveError && !editing && <p className="text-red-500 text-xs mt-1">{saveError}</p>}
        </div>
      </div>
    </div>
  );
}
