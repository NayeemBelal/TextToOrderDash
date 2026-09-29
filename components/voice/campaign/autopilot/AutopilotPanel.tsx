"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveSlot,
  fetchAutopilot,
  planAutopilot,
  saveAutopilot,
  sendSample,
  type AutopilotDashboard,
  type AutopilotSettings,
} from "@/lib/autopilotApi";
import { Skeleton } from "@/components/ui/Skeleton";
import { AutopilotBucket } from "./AutopilotBucket";
import { AutopilotSettingsForm } from "./AutopilotSettingsForm";

function ago(iso?: string): string {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Chip({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "accent" | "amber" }) {
  const cls =
    tone === "accent"
      ? "bg-capy-accent-light text-capy-accent"
      : tone === "amber"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        : "bg-capy-surface-2 text-capy-muted";
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cls}`}>{children}</span>;
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="section-label !text-[10px]">{label}</p>
      <p className="text-lg font-bold text-capy-text tabular-nums leading-tight mt-0.5">{value}</p>
      {sub && <p className="text-[11px] text-capy-muted leading-snug">{sub}</p>}
    </div>
  );
}

type ProjectionDay = { date: string; sends: number; due: number; projected: boolean };

/** Four weeks from today: how many people we contact each day (real buckets
 * this week, the same placement dry-run beyond it) against how many become
 * due that day — so a spike of 51 due on Monday shows up as 17/17/17 over
 * the next send days rather than as a scary bar. */
function ContactVsDue({ days, timezone }: { days: ProjectionDay[]; timezone?: string }) {
  const shown = days.filter((d, i) => d.sends || d.due || days.slice(i).some((x) => x.sends || x.due));
  const last = shown.map((d, i) => (d.sends || d.due ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
  const trimmed = shown.slice(0, last + 1);
  if (!trimmed.length) return null;
  const max = Math.max(...trimmed.map((d) => Math.max(d.sends, d.due)), 1);
  const totalSends = trimmed.reduce((n, d) => n + d.sends, 0);
  const totalDue = trimmed.reduce((n, d) => n + d.due, 0);
  const bar = (n: number) => `${n ? Math.max(4, (n / max) * 64) : 0}px`;
  return (
    <div className="app-card p-4">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h3 className="card-heading">Contacting vs. becoming due</h3>
        <p className="text-[11px] text-capy-muted">Next {trimmed.length} days{timezone ? ` (${timezone})` : ""}</p>
      </div>
      <div className="mt-2 flex items-center gap-4 text-[11px] text-capy-muted flex-wrap">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-capy-green" /> Contacting · {totalSends}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-capy-green/40 border border-dashed border-capy-green" /> Projected send
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-capy-accent/60" /> Become due · {totalDue}
        </span>
      </div>
      <div className="mt-3 flex items-end gap-1 h-28 overflow-x-auto" role="img" aria-label="Customers contacted and becoming due, by day">
        {trimmed.map((d) => {
          const day = new Date(`${d.date}T12:00:00`);
          const weekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div key={d.date} className="flex flex-col items-center justify-end gap-1 h-full min-w-[2.25rem] flex-1" title={`${d.date}: contacting ${d.sends}${d.projected ? " (projected)" : ""}, ${d.due} become due`}>
              <div className="flex items-end gap-0.5 w-full h-16">
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  {d.sends > 0 && <span className="text-[10px] font-semibold text-capy-text tabular-nums leading-none mb-0.5">{d.sends}</span>}
                  <div
                    className={`w-full rounded-t ${d.projected ? "bg-capy-green/40 border border-b-0 border-dashed border-capy-green" : "bg-capy-green"}`}
                    style={{ height: bar(d.sends) }}
                  />
                </div>
                <div className="flex-1 flex flex-col items-center justify-end h-full">
                  {d.due > 0 && <span className="text-[10px] font-semibold text-capy-muted tabular-nums leading-none mb-0.5">{d.due}</span>}
                  <div className="w-full rounded-t bg-capy-accent/60" style={{ height: bar(d.due) }} />
                </div>
              </div>
              <span className={`text-[10px] tabular-nums ${weekend ? "text-capy-muted/60" : "text-capy-muted"}`}>
                {day.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-capy-muted leading-snug">
        Solid bars are this week&apos;s planned sends. Dashed bars are where waiting customers will land on your send days once they&apos;re in view — the nightly plan schedules them then.
      </p>
    </div>
  );
}

export function AutopilotPanel({ restaurantId, onExit }: { restaurantId: string; onExit: () => void }) {
  const [data, setData] = useState<AutopilotDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "save" | "plan" | "approve" | "toggle">(null);
  const [error, setError] = useState<{ msg: string; where: string } | null>(null);

  const load = useCallback(() => {
    fetchAutopilot(restaurantId)
      .then(setData)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Couldn't load Autopilot."));
  }, [restaurantId]);

  useEffect(load, [load]);

  const run = async (kind: NonNullable<typeof busy>, fn: () => Promise<AutopilotDashboard>) => {
    setBusy(kind);
    setError(null);
    try {
      const next = await fn();
      setData(next);
      const r = next.run as { error?: string } | null | undefined;
      if (r?.error) setError({ msg: r.error, where: kind });
    } catch (e) {
      setError({ msg: e instanceof Error ? e.message : "Something went wrong. Try again.", where: kind });
    } finally {
      setBusy(null);
    }
  };

  const save = (patch: Partial<AutopilotSettings>, kind: NonNullable<typeof busy> = "save") =>
    run(kind, () => saveAutopilot(restaurantId, { ...data!.settings!, ...patch }));

  if (loadError) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <button onClick={onExit} className="text-sm font-semibold text-capy-muted hover:text-capy-text">← Campaigns</button>
        <p className="mt-4 text-sm text-red-600 dark:text-red-300">{loadError}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (!data.available || !data.settings) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <button onClick={onExit} className="text-sm font-semibold text-capy-muted hover:text-capy-text">← Campaigns</button>
        <p className="mt-4 text-sm text-capy-muted">Autopilot isn&apos;t available for this restaurant yet.</p>
      </div>
    );
  }

  const s = data.settings;
  const st = data.state ?? {};
  const live = s.mode === "live";
  const slots = data.slots ?? [];
  const history = data.history ?? [];
  const pz = st.personalization;
  const nextSlot = slots[0];
  const planned = slots.reduce((n, sl) => n + sl.size, 0);

  const setMode = (mode: "preview" | "live") => {
    if (mode === s.mode) return;
    if (
      mode === "live" &&
      !window.confirm(
        `Live sends real texts to real customers at each send time${s.require_approval ? " you approve" : ""}. Turn on Live for this restaurant?`,
      )
    )
      return;
    save({ mode }, "toggle");
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <button onClick={onExit} className="text-sm font-semibold text-capy-muted hover:text-capy-text">← Campaigns</button>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-capy-text" style={{ fontFamily: "Tektur, sans-serif" }}>
              Autopilot
            </h2>
            <Chip tone="accent">Beta</Chip>
            {data.admin_only && <Chip tone="amber">Only Belan admins see this</Chip>}
          </div>
          <p className="text-xs text-capy-muted mt-0.5 max-w-2xl">
            Texts each customer a game when they&apos;re due: never sooner than {s.gap_days} days after their last text,
            game or coupon from you, at most {s.bucket_size} per send, with a first line written for them.
          </p>
        </div>

        {/* Status */}
        <div className="app-card p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={s.enabled}
                aria-label="Autopilot on or off"
                disabled={busy !== null}
                onClick={() => save({ enabled: !s.enabled }, "toggle")}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${s.enabled ? "bg-capy-green" : "bg-capy-border"}`}
              >
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${s.enabled ? "translate-x-6" : "translate-x-1"}`} />
              </button>
              <div>
                <p className="text-sm font-bold text-capy-text">{s.enabled ? "Autopilot is on" : "Autopilot is off"}</p>
                <p className="text-[11px] text-capy-muted">
                  {busy === "toggle" ? "Updating and re-planning…" : s.enabled ? `Planned ${ago(st.last_planned_at)}` : "Turn on to plan this week's sends"}
                </p>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="inline-flex rounded-xl border border-capy-border p-0.5 bg-capy-surface" role="radiogroup" aria-label="Mode">
                {(["preview", "live"] as const).map((m) => {
                  const disabled = busy !== null || (m === "live" && !data.live_allowed);
                  return (
                    <button
                      key={m}
                      role="radio"
                      aria-checked={s.mode === m}
                      disabled={disabled}
                      title={m === "live" && !data.live_allowed ? "Live sending isn't switched on for this restaurant yet" : undefined}
                      onClick={() => setMode(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${s.mode === m ? (m === "live" ? "bg-capy-green text-white" : "bg-capy-card text-capy-text shadow-sm") : "text-capy-muted hover:text-capy-text"}`}
                    >
                      {m === "preview" ? "Preview" : "Live"}
                    </button>
                  );
                })}
              </div>
              <button onClick={() => run("plan", () => planAutopilot(restaurantId))} disabled={busy !== null || !s.enabled} className="btn-secondary !py-1.5 !px-3 !text-xs">
                {busy === "plan" ? "Planning…" : "Plan now"}
              </button>
            </div>
          </div>

          {s.enabled && (
            <div
              className={`rounded-xl px-3 py-2 text-xs leading-snug ${live ? "bg-capy-green-light text-capy-green-dark" : "bg-capy-surface text-capy-muted"}`}
            >
              {live
                ? s.require_approval
                  ? "Live: a send goes out at its time only after you approve it below."
                  : "Live: sends go out automatically at their times."
                : "Preview: everything below is planned and written, but nothing is sent. Use “Text me this” to see a message on your phone."}
              {!data.live_allowed && " Live sending isn't switched on for this restaurant yet."}
            </div>
          )}

          {s.enabled && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
              <Stat
                label="Next send"
                value={nextSlot ? <span className="text-base">{nextSlot.local_label}</span> : "—"}
                sub={nextSlot ? `${nextSlot.size} customer${nextSlot.size === 1 ? "" : "s"} · ${nextSlot.game_name}` : "No one is due this week"}
              />
              <Stat label="This week" value={planned} sub={`in ${slots.length} send${slots.length === 1 ? "" : "s"} · of ${st.audience ?? "—"} on the list`} />
              <Stat
                label="Waiting"
                value={st.waiting?.total ?? 0}
                sub={st.waiting ? `${st.waiting.not_due} not due yet${st.waiting.full ? ` · ${st.waiting.full} over the cap` : ""}` : undefined}
              />
              <Stat
                label="AI first lines"
                value={pz ? `${pz.ai}/${planned || pz.ai + pz.name + pz.template}` : "—"}
                sub={st.llm ? `$${st.llm.cost_usd.toFixed(3)} this plan · ${st.duration_s ?? "—"}s` : s.personalize ? undefined : "Off"}
              />
            </div>
          )}

          {st.error && <p className="text-xs text-red-600 dark:text-red-300">Last plan failed: {st.error}</p>}
          {error && error.where !== "save" && <p className="text-sm text-red-600 dark:text-red-300">{error.msg}</p>}
        </div>

        {/* Sends */}
        {s.enabled && (
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="card-heading">This week&apos;s sends</h3>
              <span className="text-[11px] text-capy-muted">Highlighted text is the personalized line</span>
            </div>
            {slots.length === 0 ? (
              <div className="app-card px-6 py-8 text-center">
                <p className="text-sm font-semibold text-capy-text">No one is due this week</p>
                <p className="text-xs text-capy-muted mt-1">Everyone heard from you in the last {s.gap_days} days. Tonight&apos;s plan will pick up whoever comes due.</p>
              </div>
            ) : (
              slots.map((sl, i) => (
                <AutopilotBucket
                  key={sl.round_id}
                  slot={sl}
                  live={live}
                  busy={busy !== null}
                  defaultOpen={i === 0 && sl.size <= 12}
                  onApprove={(approved) => run("approve", () => approveSlot(restaurantId, sl.round_id, approved))}
                  onSample={async (cid) => {
                    const phone = s.test_phone || window.prompt("Send the test text to which phone number?") || "";
                    if (!phone) throw new Error("Add your phone under Rules → “Your phone for test texts”.");
                    await sendSample(restaurantId, sl.round_id, cid, phone);
                  }}
                />
              ))
            )}
          </div>
        )}

        {s.enabled && <ContactVsDue days={st.projection ?? []} timezone={data.timezone} />}

        <AutopilotSettingsForm data={data} saving={busy === "save"} error={error?.where === "save" ? error.msg : null} onSave={(next) => save(next)} />

        {history.length > 0 && (
          <div className="app-card overflow-hidden">
            <div className="px-4 py-3 border-b border-capy-border">
              <h3 className="card-heading">Sent by Autopilot</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    {["When", "Game", "Texted", "Replied", "Winners", "Coupons used"].map((h) => (
                      <th key={h} className="section-label !text-[10px] px-4 py-2 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-capy-border/60">
                  {history.map((h) => (
                    <tr key={h.round_id}>
                      <td className="px-4 py-2.5 whitespace-nowrap text-capy-text">{h.local_label}</td>
                      <td className="px-4 py-2.5 text-capy-muted">{h.game_name}</td>
                      <td className="px-4 py-2.5 tabular-nums text-capy-text">{h.recipients}</td>
                      <td className="px-4 py-2.5 tabular-nums text-capy-text">
                        {h.replies}
                        {h.recipients > 0 && <span className="text-capy-muted text-xs"> ({Math.round((h.replies / h.recipients) * 100)}%)</span>}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-capy-text">{h.winners}</td>
                      <td className="px-4 py-2.5 tabular-nums text-capy-text">{h.coupons_used}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
