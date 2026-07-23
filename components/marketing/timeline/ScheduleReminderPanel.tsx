"use client";

import { useEffect, useState } from "react";
import {
  previewReminder,
  scheduleReminder,
  sendTestReminder,
  fetchReminders,
  cancelReminder,
  formatUSDFromDollars,
  type ReminderSource,
  type ReminderPreview,
  type ScheduledReminder,
} from "@/lib/timelineApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeFuture, toISODate } from "./dateUtils";

const DEFAULT_MESSAGE =
  "{restaurant_name}: your {offer} expires soon! Grab it here: {link} Reply STOP to opt out.";

const PLACEHOLDERS = "{restaurant_name} {discount} {name} {code} {link} {offer}";

interface Props {
  restaurantId: string;
  source: ReminderSource;
  expiryStart: string;
  expiryEnd: string;
  timezone: string;
  onClose: () => void;
}

export function ScheduleReminderPanel({ restaurantId, source, expiryStart, expiryEnd, timezone, onClose }: Props) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const today = toISODate(new Date());
  const [sendDate, setSendDate] = useState(today);
  const [sendHour, setSendHour] = useState("12");
  const [sendMinute, setSendMinute] = useState("00");
  const [sendAmPm, setSendAmPm] = useState("PM");

  const [preview, setPreview] = useState<ReminderPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduledReminder[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(true);

  const [testPhone, setTestPhone] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);
      previewReminder(restaurantId, source, expiryStart, expiryEnd, message)
        .then((p) => !cancelled && setPreview(p))
        .catch(() => !cancelled && setPreviewError("Couldn't estimate cost."))
        .finally(() => !cancelled && setPreviewLoading(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [restaurantId, source, expiryStart, expiryEnd, message]);

  const loadReminders = () => {
    setRemindersLoading(true);
    fetchReminders(restaurantId)
      .then((r) => setScheduled(r.reminders))
      .catch(() => {})
      .finally(() => setRemindersLoading(false));
  };

  useEffect(() => {
    loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const to24h = () => {
    let h = parseInt(sendHour, 10) % 12;
    if (sendAmPm === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${sendMinute}`;
  };

  const handleSchedule = async () => {
    setScheduling(true);
    setScheduleError(null);
    try {
      await scheduleReminder({
        restaurant_id: restaurantId,
        source,
        expiry_start: expiryStart,
        expiry_end: expiryEnd,
        message,
        send_date: sendDate,
        send_time: to24h(),
      });
      loadReminders();
    } catch {
      setScheduleError("Couldn't schedule the reminder. Try again.");
    } finally {
      setScheduling(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) return;
    setTestSending(true);
    setTestStatus(null);
    try {
      await sendTestReminder({
        restaurant_id: restaurantId,
        phone: testPhone,
        source,
        expiry_start: expiryStart,
        expiry_end: expiryEnd,
        message,
      });
      setTestStatus("Sent! Check your phone.");
    } catch {
      setTestStatus(
        "Test failed — that number may not have a matching, un-consumed coupon expiring in this period.",
      );
    } finally {
      setTestSending(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelReminder(restaurantId, id);
      loadReminders();
    } catch {
      /* transient — user can retry */
    }
  };

  const tzAbbr = (() => {
    try {
      return (
        new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "short" })
          .formatToParts(new Date())
          .find((p) => p.type === "timeZoneName")?.value ?? timezone
      );
    } catch {
      return timezone;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-[slidein_0.18s_ease-out]">
        <style>{`@keyframes slidein{from{transform:translateX(16px);opacity:.6}to{transform:none;opacity:1}}`}</style>

        <div className="flex items-center justify-between px-5 py-4 border-b border-capy-border">
          <h2 className="text-base font-bold text-capy-text">
            Schedule reminder — {source === "optin" ? "Opt-in coupons" : "Game coupons"}
          </h2>
          <button onClick={onClose} className="text-capy-muted hover:text-capy-text" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="section-label mb-1">Message</p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-capy-border rounded-xl px-3 py-2 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green resize-none"
            />
            <p className="font-mono text-[11px] text-capy-muted mt-1 truncate">{PLACEHOLDERS}</p>
          </div>

          <div className="border-t border-capy-border pt-3 space-y-2">
            <p className="section-label">Send a test text</p>
            <div className="flex gap-2">
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="flex-1 px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              />
              <button
                onClick={handleSendTest}
                disabled={testSending || !testPhone.trim()}
                className="px-4 py-2 rounded-xl bg-capy-text text-white text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
              >
                {testSending ? "Sending…" : "Send test"}
              </button>
            </div>
            <p className="text-[11px] text-capy-muted">
              The number must already have a matching, un-consumed coupon expiring in the period currently
              open (so the placeholders reflect a real coupon).
            </p>
            {testStatus && (
              <div
                className={`text-xs px-3 py-2 rounded-xl ${
                  testStatus.startsWith("Sent")
                    ? "bg-capy-green-light text-capy-green-dark"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {testStatus}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-label">Send at</p>
              <span className="text-xs text-capy-muted bg-slate-100 px-2.5 py-1 rounded-full">
                {tzAbbr} · {timezone}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
              <input
                type="date"
                value={sendDate}
                min={today}
                onChange={(e) => setSendDate(e.target.value)}
                className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              />
              <select
                value={sendHour}
                onChange={(e) => setSendHour(e.target.value)}
                className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={String(h)}>{h}</option>
                ))}
              </select>
              <span className="text-xs text-capy-muted">:</span>
              <select
                value={sendMinute}
                onChange={(e) => setSendMinute(e.target.value)}
                className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              >
                {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0")).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={sendAmPm}
                onChange={(e) => setSendAmPm(e.target.value)}
                className="bg-white border border-capy-border rounded-lg px-2 py-1 text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green"
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-capy-border shadow-sm p-4 space-y-3">
            <p className="section-label">Cost estimate</p>
            {previewError && <p className="text-xs text-red-600">{previewError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-capy-muted">Recipients</p>
                {previewLoading ? (
                  <Skeleton className="h-5 w-10 mt-0.5" />
                ) : (
                  <p className="text-sm font-bold text-capy-text">{preview?.recipient_count ?? 0}</p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-capy-muted">Outbound cost</p>
                {previewLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-sm font-bold text-capy-text">
                    {preview ? formatUSDFromDollars(preview.outbound_cost) : "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-capy-muted">Worst case (all reply)</p>
                {previewLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-sm font-bold text-capy-text">
                    {preview ? formatUSDFromDollars(preview.worst_case_cost) : "—"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] text-capy-muted">Telnyx balance</p>
                {previewLoading ? (
                  <Skeleton className="h-5 w-16 mt-0.5" />
                ) : (
                  <p className="text-sm font-bold text-capy-text">
                    {preview?.account_balance ? formatUSDFromDollars(preview.account_balance.balance) : "—"}
                  </p>
                )}
              </div>
            </div>
            {!previewLoading && preview && preview.account_balance &&
              parseFloat(preview.account_balance.balance) < preview.worst_case_cost && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  Your Telnyx balance may not cover this if everyone replies — consider topping up first.
                </p>
              )}
          </div>

          {scheduleError && <p className="text-xs text-red-600">{scheduleError}</p>}

          <button
            onClick={handleSchedule}
            disabled={scheduling || previewLoading || (preview?.recipient_count ?? 0) === 0}
            className="w-full py-2.5 rounded-xl bg-capy-green text-white text-sm font-semibold hover:bg-capy-green-dark disabled:opacity-50 transition-colors"
          >
            {scheduling ? "Scheduling…" : "Schedule reminder"}
          </button>

          <div>
            <p className="section-label mb-2">Scheduled reminders</p>
            {remindersLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : scheduled.length === 0 ? (
              <p className="text-xs text-capy-muted">Nothing scheduled yet.</p>
            ) : (
              <div className="divide-y divide-capy-border/60 border border-capy-border rounded-xl overflow-hidden">
                {scheduled.map((r) => (
                  <div key={r.id} className="flex items-center justify-between px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-capy-text truncate">
                        {r.source === "optin" ? "Opt-in" : "Game"} · {r.recipient_count_estimate ?? 0} recipients
                      </p>
                      <p className="text-[11px] text-capy-muted">
                        {r.status === "pending" ? relativeFuture(r.send_at) : r.status}
                      </p>
                    </div>
                    {r.status === "pending" && (
                      <button
                        onClick={() => handleCancel(r.id)}
                        className="p-1.5 rounded-lg text-capy-muted hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                        title="Cancel"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
