"use client";

import { useState } from "react";
import type { AutopilotRecipient, AutopilotSlot, OpenerSource, SlotStatus } from "@/lib/autopilotApi";

const STATUS_META: Record<SlotStatus, { label: string; cls: string }> = {
  preview: { label: "Preview · won't send", cls: "bg-capy-surface-2 text-capy-muted" },
  awaiting_approval: { label: "Needs your approval", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  approved: { label: "Approved · will send", cls: "bg-capy-green-light text-capy-green-dark" },
  scheduled: { label: "Scheduled", cls: "bg-capy-green-light text-capy-green-dark" },
  missed: { label: "Missed", cls: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300" },
};

const SOURCE_META: Record<OpenerSource, { label: string; cls: string }> = {
  ai: { label: "AI", cls: "bg-capy-accent-light text-capy-accent" },
  name: { label: "Name", cls: "bg-capy-surface-2 text-capy-text" },
  template: { label: "Template", cls: "bg-capy-surface-2 text-capy-muted" },
  pending: { label: "Writing…", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
};

const SEGMENT_LABEL: Record<string, string> = {
  new: "New",
  regular: "Regular",
  lapsed: "Lapsed",
  has_open_coupon: "Unused coupon",
  engaged: "Played recently",
  quiet: "Quiet",
};

const REASON_LABEL: Record<string, string> = {
  too_long: "AI line too long",
  no_sender: "AI line didn't name the restaurant",
  invented_item: "AI named an item they never ordered",
  price: "AI mentioned a price",
  promise: "AI promised something free",
  link: "AI included a link",
  number: "AI included a number",
  keyword: "AI used a reserved keyword",
  sensitive: "AI touched a sensitive topic",
  not_plain_text: "AI used special characters",
  multiline: "AI wrote more than one line",
  llm_error: "AI didn't answer in time",
  missing: "AI skipped this customer",
  budget: "Still writing — plan again",
  no_room: "No room in this game's text",
};

function touchLine(r: AutopilotRecipient): string {
  if (r.last_touch_days_ago === null) return r.last_touch_label;
  const d = r.last_touch_days_ago;
  return `${r.last_touch_label} · ${d === 0 ? "today" : d === 1 ? "yesterday" : `${d} days ago`}`;
}

function MessagePreview({ r }: { r: AutopilotRecipient }) {
  const hasOpener = !!r.opener && r.message.startsWith(r.opener);
  return (
    <div className="rounded-2xl rounded-tl-md bg-capy-surface px-3 py-2 text-[13px] leading-snug text-capy-text whitespace-pre-wrap break-words">
      {hasOpener ? (
        <>
          <mark className="bg-capy-accent-light text-capy-text rounded px-0.5">{r.opener}</mark>
          {r.message.slice(r.opener!.length)}
        </>
      ) : (
        r.message
      )}
    </div>
  );
}

function RecipientRow({
  r,
  onSample,
  sampleState,
}: {
  r: AutopilotRecipient;
  onSample: () => void;
  sampleState: "idle" | "sending" | "sent" | string;
}) {
  const [open, setOpen] = useState(false);
  const src = SOURCE_META[r.opener_source] ?? SOURCE_META.template;
  return (
    <li className="px-4 py-3">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left flex items-center gap-3 group" aria-expanded={open}>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-capy-text">{r.name || "No name"}</span>
            {r.last4 && <span className="text-xs text-capy-muted tabular-nums">••{r.last4}</span>}
            {r.segment && (
              <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-capy-surface-2 text-capy-muted">
                {SEGMENT_LABEL[r.segment] ?? r.segment}
              </span>
            )}
          </span>
          <span className="block text-xs text-capy-muted mt-0.5 truncate">{touchLine(r)}</span>
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${src.cls}`}>{src.label}</span>
        <span className="text-[11px] text-capy-muted tabular-nums w-14 text-right">
          {r.segments} seg{r.encoding !== "GSM-7" ? "*" : ""}
        </span>
        <svg className={`w-4 h-4 text-capy-muted transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="mt-3 space-y-2 max-w-xl">
          <MessagePreview r={r} />
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-capy-muted">
            <span className="tabular-nums">
              {r.message.length} characters · {r.segments} segment{r.segments === 1 ? "" : "s"} ({r.encoding})
            </span>
            {r.opener_reason && r.opener_source !== "ai" && (
              <span>Fell back: {REASON_LABEL[r.opener_reason] ?? r.opener_reason}</span>
            )}
            <button
              onClick={onSample}
              disabled={sampleState === "sending"}
              className="ml-auto text-xs font-semibold text-capy-green-dark hover:underline disabled:opacity-50"
            >
              {sampleState === "sending" ? "Sending…" : sampleState === "sent" ? "Sent ✓ — text me again" : "Text me this"}
            </button>
          </div>
          {sampleState !== "idle" && sampleState !== "sending" && sampleState !== "sent" && (
            <p className="text-xs text-red-600 dark:text-red-300">{sampleState}</p>
          )}
        </div>
      )}
    </li>
  );
}

export function AutopilotBucket({
  slot,
  live,
  busy,
  onApprove,
  onSample,
  defaultOpen,
}: {
  slot: AutopilotSlot;
  live: boolean;
  busy: boolean;
  onApprove: (approved: boolean) => void;
  onSample: (customerId: string) => Promise<void>;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [samples, setSamples] = useState<Record<string, string>>({});
  const meta = STATUS_META[slot.status];
  const maxSeg = Math.max(0, ...slot.recipients.map((r) => r.segments));
  const ai = slot.openers.ai ?? 0;

  const sample = async (cid: string) => {
    setSamples((s) => ({ ...s, [cid]: "sending" }));
    try {
      await onSample(cid);
      setSamples((s) => ({ ...s, [cid]: "sent" }));
    } catch (e) {
      setSamples((s) => ({ ...s, [cid]: e instanceof Error ? e.message : "Couldn't send the sample." }));
    }
  };

  return (
    <div className="app-card overflow-hidden">
      <div className="px-4 py-3.5 flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[12rem]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-capy-text">{slot.local_label}</span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${meta.cls}`}>{meta.label}</span>
          </div>
          <p className="text-xs text-capy-muted mt-0.5">
            {slot.game_name}
            {slot.prize ? ` · winner gets ${slot.prize}` : ""}
            {" · "}
            {ai} of {slot.size} personalized by AI
          </p>
        </div>
        <div className="text-right">
          <span className="block text-lg font-bold text-capy-text tabular-nums leading-tight">{slot.size}</span>
          <span className="block text-[11px] text-capy-muted">customer{slot.size === 1 ? "" : "s"}</span>
        </div>
        <div className="text-right min-w-[6.5rem]">
          <span className="block text-sm font-semibold text-capy-text tabular-nums leading-tight">
            {maxSeg} segment{maxSeg === 1 ? "" : "s"} each
          </span>
          {slot.template_segments > maxSeg && (
            <span className="block text-[11px] text-capy-green-dark">vs {slot.template_segments} as a regular campaign</span>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <button onClick={() => setOpen((o) => !o)} className="btn-secondary !py-1.5 !px-3 !text-xs">
          {open ? "Hide customers" : slot.size === 1 ? "See the message" : `See all ${slot.size} messages`}
        </button>
        {live && slot.status === "awaiting_approval" && (
          <button onClick={() => onApprove(true)} disabled={busy} className="btn-primary !py-1.5 !px-3 !text-xs">
            Approve this send
          </button>
        )}
        {live && slot.status === "approved" && (
          <button onClick={() => onApprove(false)} disabled={busy} className="btn-secondary !py-1.5 !px-3 !text-xs">
            Un-approve
          </button>
        )}
      </div>

      {open && (
        <ul className="border-t border-capy-border divide-y divide-capy-border/60">
          {slot.recipients.map((r) => (
            <RecipientRow key={r.customer_id} r={r} onSample={() => sample(r.customer_id)} sampleState={samples[r.customer_id] ?? "idle"} />
          ))}
        </ul>
      )}
    </div>
  );
}
