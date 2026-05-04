"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch, RESTAURANT_ID, type Caller } from "@/lib/api";

type Step = "recipients" | "message" | "send";

const STEPS: { id: Step; label: string }[] = [
  { id: "recipients", label: "Recipients" },
  { id: "message", label: "Message" },
  { id: "send", label: "Send" },
];

const STATUS_LABEL: Record<string, string> = {
  "order-intent": "Ordered",
  forwarded: "Forwarded",
  "robo-caller": "Robo",
  "no-outcome": "No outcome",
};

const STATUS_COLOR: Record<string, string> = {
  "order-intent": "bg-capy-green-light text-capy-green-dark",
  forwarded: "bg-slate-100 text-slate-600",
  "robo-caller": "bg-red-50 text-red-500",
  "no-outcome": "bg-slate-100 text-capy-muted",
};

function StepIndicator({ current }: { current: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  done
                    ? "bg-capy-green text-white"
                    : active
                      ? "bg-capy-text text-white"
                      : "bg-slate-100 text-capy-muted"
                }`}
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                {done ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 ${active ? "text-capy-text font-semibold" : done ? "text-capy-green-dark" : "text-capy-muted"}`}
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-16 h-px mx-2 mb-4 transition-all ${i < currentIdx ? "bg-capy-green" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}


export function VoiceMarketingTab() {
  const [step, setStep] = useState<Step>("recipients");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [callers, setCallers] = useState<Caller[]>([]);

  useEffect(() => {
    apiFetch<{ callers: Caller[] }>(`/api/callers?restaurant_id=${RESTAURANT_ID}`)
      .then((d) => setCallers(d.callers))
      .catch(() => {});
  }, []);

  const filteredCallers = useMemo(
    () => search ? callers.filter((c) => c.phoneNumber.includes(search)) : callers,
    [callers, search],
  );

  const allFilteredSelected =
    filteredCallers.length > 0 &&
    filteredCallers.every((c) => selected.has(c.phoneNumber));

  const toggleAll = () => {
    if (allFilteredSelected) {
      const next = new Set(selected);
      filteredCallers.forEach((c) => next.delete(c.phoneNumber));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filteredCallers.forEach((c) => next.add(c.phoneNumber));
      setSelected(next);
    }
  };

  const toggleOne = (phone: string) => {
    const next = new Set(selected);
    if (next.has(phone)) next.delete(phone);
    else next.add(phone);
    setSelected(next);
  };

  const charCount = message.length;
  const segments = Math.ceil(charCount / 160) || 1;
  const canAdvanceRecipients = selected.size > 0;
  const canAdvanceMessage = message.trim().length > 0;

  const handleReset = () => {
    setStep("recipients");
    setSelected(new Set());
    setMessage("");
    setSearch("");
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col p-4 gap-4">
      {/* Step: Recipients */}
      {step === "recipients" && (
        <div className="flex-1 min-h-0 bg-white rounded-2xl border border-capy-border shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-capy-border flex-shrink-0">
            <div>
              <p className="card-heading">Select Recipients</p>
              <p className="text-xs text-capy-muted mt-0.5">Choose the customers who will receive this message</p>
            </div>
            <span className="text-xs font-semibold text-capy-green-dark bg-capy-green-light px-2.5 py-1 rounded-full">
              {selected.size} selected
            </span>
          </div>

          <div className="px-5 py-3 border-b border-capy-border flex-shrink-0">
            <div className="flex items-center gap-2 bg-slate-50 border border-capy-border rounded-xl px-3 py-2">
              <svg className="w-3.5 h-3.5 text-capy-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search phone numbers…"
                className="flex-1 bg-transparent text-sm text-capy-text placeholder:text-capy-muted outline-none"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-capy-muted hover:text-capy-text">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="px-5 py-2.5 border-b border-capy-border flex items-center gap-3 flex-shrink-0 bg-slate-50/50">
            <button
              onClick={toggleAll}
              className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                allFilteredSelected ? "bg-capy-text border-capy-text" : "border-capy-border bg-white hover:border-slate-400"
              }`}
            >
              {allFilteredSelected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-xs font-semibold text-capy-muted" style={{ fontFamily: "Tektur, sans-serif" }}>
              {allFilteredSelected ? "Deselect all" : `Select all (${filteredCallers.length})`}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredCallers.length === 0 && (
              <p className="text-xs text-capy-muted text-center py-8">No callers yet</p>
            )}
            {filteredCallers.map((caller, i) => {
              const isSelected = selected.has(caller.phoneNumber);
              const statusLabel = STATUS_LABEL[caller.lastStatus] ?? caller.lastStatus;
              const statusColor = STATUS_COLOR[caller.lastStatus] ?? "bg-slate-100 text-capy-muted";
              return (
                <button
                  key={caller.phoneNumber}
                  onClick={() => toggleOne(caller.phoneNumber)}
                  className={`w-full flex items-center gap-3 px-5 py-3 border-b border-capy-border/60 text-left transition-colors ${isSelected ? "bg-slate-50" : "hover:bg-slate-50/50"}`}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-capy-text border-capy-text" : "border-capy-border"}`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-capy-text truncate">
                      {caller.customerName ? `${caller.customerName} · ` : ""}{caller.phoneNumber}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="px-5 py-4 border-t border-capy-border flex items-center justify-between flex-shrink-0 bg-white">
            <p className="text-xs text-capy-muted">
              {selected.size === 0 ? "Select at least one recipient" : `${selected.size} of ${callers.length} customers selected`}
            </p>
            <button
              onClick={() => setStep("message")}
              disabled={!canAdvanceRecipients}
              className="px-5 py-2.5 bg-capy-text text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              Continue
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Step: Message */}
      {step === "message" && (
        <div className="flex-1 min-h-0">
          <div className="flex-1 min-h-0 h-full bg-white rounded-2xl border border-capy-border shadow-sm flex flex-col overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-capy-border flex-shrink-0">
              <p className="card-heading">Write Your Message</p>
              <p className="text-xs text-capy-muted mt-0.5">This will be sent as an SMS to {selected.size} customers</p>
            </div>
            <div className="flex-1 flex flex-col px-5 py-4 gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hi! We're running a special this week — come visit us and mention this text for 15% off your next order!"
                maxLength={480}
                className="flex-1 resize-none bg-slate-50 border border-capy-border rounded-xl px-4 py-3 text-sm text-capy-text placeholder:text-capy-muted outline-none focus:border-slate-400 transition-colors leading-relaxed"
              />
              <div className="flex items-center justify-between text-xs text-capy-muted">
                <span>{segments} SMS segment{segments > 1 ? "s" : ""}</span>
                <span className={charCount > 320 ? "text-amber-500 font-medium" : ""}>{charCount} / 480 chars</span>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-capy-border flex items-center justify-between flex-shrink-0 bg-white">
              <button onClick={() => setStep("recipients")} className="px-4 py-2.5 text-sm text-capy-muted hover:text-capy-text transition-colors font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={() => setStep("send")}
                disabled={!canAdvanceMessage}
                className="px-5 py-2.5 bg-capy-text text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ fontFamily: "Tektur, sans-serif" }}
              >
                Review
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Send */}
      {step === "send" && (
        <div className="flex-1 min-h-0 h-full bg-white rounded-2xl border border-capy-border shadow-sm flex flex-col overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-capy-border flex-shrink-0">
            <p className="card-heading">Review & Send</p>
            <p className="text-xs text-capy-muted mt-0.5">Everything looks good? Send your broadcast.</p>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded-xl px-3 py-3 border border-capy-border">
                <p className="section-label">Recipients</p>
                <p className="text-2xl font-bold text-capy-text mt-0.5" style={{ fontFamily: "Tektur, sans-serif" }}>{selected.size}</p>
                <p className="text-xs text-capy-muted">customers</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-3 border border-capy-border">
                <p className="section-label">Segments</p>
                <p className="text-2xl font-bold text-capy-text mt-0.5" style={{ fontFamily: "Tektur, sans-serif" }}>{Math.ceil(message.length / 160) || 1}</p>
                <p className="text-xs text-capy-muted">per message</p>
              </div>
              <div className="bg-slate-50 rounded-xl px-3 py-3 border border-capy-border">
                <p className="section-label">Delivery</p>
                <p className="text-sm font-bold text-capy-text mt-0.5" style={{ fontFamily: "Tektur, sans-serif" }}>Immediate</p>
                <p className="text-xs text-capy-muted">~1 min</p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl border border-capy-border p-4">
              <p className="section-label mb-2">Message</p>
              <p className="text-sm text-capy-text leading-relaxed">{message}</p>
              <p className="text-xs text-capy-muted mt-2">{message.length} characters</p>
            </div>
            <div className="bg-slate-50 rounded-xl border border-capy-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-capy-border flex items-center justify-between">
                <p className="section-label">Recipients</p>
                <button onClick={() => setStep("recipients")} className="text-xs text-capy-muted hover:text-capy-text transition-colors">Edit</button>
              </div>
              <div className="max-h-40 overflow-y-auto">
                {Array.from(selected).map((phone) => (
                  <div key={phone} className="flex items-center gap-2.5 px-4 py-2 border-b border-capy-border/60 last:border-0">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-capy-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-capy-text">{phone}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="px-5 py-4 border-t border-capy-border flex-shrink-0 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={() => setStep("message")} className="px-4 py-2.5 text-sm text-capy-muted hover:text-capy-text transition-colors font-medium flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <div className="flex flex-col items-end gap-1">
                <button
                  disabled
                  className="px-6 py-2.5 bg-capy-green/40 text-white text-sm font-semibold rounded-xl cursor-not-allowed flex items-center gap-2"
                  style={{ fontFamily: "Tektur, sans-serif" }}
                  title="Broadcast sending coming soon"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Broadcast
                </button>
                <p className="text-xs text-capy-muted">Coming soon — broadcast API in progress</p>
              </div>
            </div>
            <button onClick={handleReset} className="w-full text-xs text-capy-muted hover:text-capy-text text-center transition-colors">
              Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
