"use client";

import { useEffect, useState } from "react";
import { WEEKDAYS, type AutopilotDashboard, type AutopilotSettings, type Weekday } from "@/lib/autopilotApi";

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="section-label block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-capy-muted leading-snug">{hint}</p>}
    </div>
  );
}

function Switch({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-capy-green" : "bg-capy-border"}`}
      >
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold text-capy-text">{label}</span>
        {hint && <span className="block text-[11px] text-capy-muted leading-snug">{hint}</span>}
      </label>
    </div>
  );
}

function NumberInput({ id, value, onChange, min, max, suffix }: { id: string; value: number; onChange: (n: number) => void; min: number; max: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="card-input !py-1.5 w-24 tabular-nums"
      />
      {suffix && <span className="text-xs text-capy-muted">{suffix}</span>}
    </div>
  );
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function AutopilotSettingsForm({
  data,
  saving,
  error,
  onSave,
}: {
  data: AutopilotDashboard;
  saving: boolean;
  error: string | null;
  onSave: (s: AutopilotSettings) => void;
}) {
  const [draft, setDraft] = useState<AutopilotSettings>(data.settings!);
  useEffect(() => setDraft(data.settings!), [data.settings]);

  const set = <K extends keyof AutopilotSettings>(k: K, v: AutopilotSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const toggleDay = (day: Weekday) =>
    set("send_days", draft.send_days.includes(day) ? draft.send_days.filter((d) => d !== day) : WEEKDAYS.filter((d) => d === day || draft.send_days.includes(d)));
  const toggleGame = (id: string) =>
    set("games", draft.games.includes(id) ? draft.games.filter((g) => g !== id) : [...draft.games, id]);

  const [winStart, winEnd] = data.send_window ?? ["10:00", "19:30"];
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);
  const groups = data.groups ?? [];

  return (
    <form
      className="app-card p-4 sm:p-5 space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div>
        <h3 className="card-heading">Rules</h3>
        <p className="text-xs text-capy-muted mt-0.5">Saving re-plans this week right away. Buckets are also rebuilt every night.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Days between Belan texts" htmlFor="ap-gap" hint="A customer gets a game no sooner than this many days after their last text, game, coupon or coupon use from you. Their plain orders don't count.">
          <NumberInput id="ap-gap" value={draft.gap_days} onChange={(n) => set("gap_days", n)} min={1} max={90} suffix="days" />
        </Field>
        <Field label="Customers per send" htmlFor="ap-size" hint={`Start small while testing. Up to ${data.max_bucket ?? 100}.`}>
          <NumberInput id="ap-size" value={draft.bucket_size} onChange={(n) => set("bucket_size", n)} min={1} max={data.max_bucket ?? 100} suffix="max per send" />
        </Field>
      </div>

      <Field label="Send days">
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((d) => {
            const on = draft.send_days.includes(d);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${on ? "bg-capy-green text-white border-capy-green" : "bg-capy-card text-capy-text border-capy-border hover:bg-capy-surface"}`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Send time" htmlFor="ap-time" hint={`Restaurant time (${data.timezone ?? "local"}), between ${to12h(winStart)} and ${to12h(winEnd)}.`}>
          <input id="ap-time" type="time" min={winStart} max={winEnd} value={draft.send_time} onChange={(e) => set("send_time", e.target.value)} className="card-input !py-1.5 w-36" />
        </Field>
        <Field label="Who's included" htmlFor="ap-aud" hint="Pick a group to try Autopilot on a few people first.">
          <select
            id="ap-aud"
            className="card-input !py-1.5"
            value={draft.audience.type === "group" ? draft.audience.group_id : ""}
            onChange={(e) => set("audience", e.target.value ? { type: "group", group_id: e.target.value } : { type: "all" })}
          >
            <option value="">Everyone on your text list</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                Group: {g.name} ({g.member_count})
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Games to rotate" hint="One game per send, rotating by day. Every player gets a coupon: winners the prize, everyone else the consolation.">
        <div className="flex flex-wrap gap-1.5">
          {(data.catalog ?? []).map((g) => {
            const on = draft.games.includes(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                title={g.tagline}
                onClick={() => toggleGame(g.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${on ? "bg-capy-accent-light text-capy-accent border-capy-accent/40" : "bg-capy-card text-capy-text border-capy-border hover:bg-capy-surface"}`}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-5 grid-cols-2 sm:grid-cols-4">
        <Field label="Winner prize" htmlFor="ap-win">
          <NumberInput id="ap-win" value={draft.winner_percent} onChange={(n) => set("winner_percent", n)} min={5} max={100} suffix="% off" />
        </Field>
        <Field label="Everyone else" htmlFor="ap-cons">
          <NumberInput id="ap-cons" value={draft.consolation_percent} onChange={(n) => set("consolation_percent", n)} min={0} max={50} suffix="% off" />
        </Field>
        <Field label="Coupon good for" htmlFor="ap-exp">
          <NumberInput id="ap-exp" value={draft.coupon_expiry_hours} onChange={(n) => set("coupon_expiry_hours", n)} min={2} max={336} suffix="hours" />
        </Field>
        <Field label="Replies close after" htmlFor="ap-win-h">
          <NumberInput id="ap-win-h" value={draft.reply_window_hours} onChange={(n) => set("reply_window_hours", n)} min={1} max={72} suffix="hours" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Switch id="ap-ai" checked={draft.personalize} onChange={(v) => set("personalize", v)} label="Personalize with AI" hint="Swaps the greeting for a line written from each customer's history. Never adds an SMS segment." />
        <Switch id="ap-approve" checked={draft.require_approval} onChange={(v) => set("require_approval", v)} label="Approve each send" hint="In Live, a send waits for your OK. Unapproved sends are skipped." />
        <Switch id="ap-everyone" checked={draft.everyone_wins} onChange={(v) => set("everyone_wins", v)} label="Everyone wins the full prize" />
      </div>

      <Field label="Your phone for test texts" htmlFor="ap-phone" hint="“Text me this” sends a customer's exact message here as a playable test.">
        <input id="ap-phone" type="tel" placeholder="(214) 555-0100" value={draft.test_phone} onChange={(e) => set("test_phone", e.target.value)} className="card-input !py-1.5 max-w-xs" />
      </Field>

      {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving || !dirty} className="btn-primary">
          {saving ? "Saving and planning…" : "Save and re-plan"}
        </button>
        {dirty && !saving && (
          <button type="button" onClick={() => setDraft(data.settings!)} className="text-xs font-semibold text-capy-muted hover:text-capy-text">
            Discard changes
          </button>
        )}
      </div>
    </form>
  );
}
