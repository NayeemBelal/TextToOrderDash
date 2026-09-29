"use client";

import { useEffect, useState } from "react";
import {
  GAME_KEYS,
  MAX_MESSAGE_CHARS,
  WEEKDAYS,
  gameSettingsFor,
  type AutopilotDashboard,
  type AutopilotSettings,
  type GameSettings,
  type Weekday,
} from "@/lib/autopilotApi";

/** A winner/loser reply the owner is editing: the placeholders it may use and
 * the one it must keep. Mirrors validate_submission on the backend. */
function MessageInput({
  id,
  label,
  value,
  fallback,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  fallback: string;
  onChange: (v: string) => void;
}) {
  const shown = value || fallback;
  const missingLink = !!value && !value.includes("{link}");
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="section-label block">
          {label}
        </label>
        <span className="text-[11px] text-capy-muted tabular-nums">
          {value ? `${value.length}/${MAX_MESSAGE_CHARS}` : "Default"}
          {value && (
            <>
              {" · "}
              <button type="button" onClick={() => onChange("")} className="font-semibold text-capy-green-dark hover:underline">
                Use default
              </button>
            </>
          )}
        </span>
      </div>
      <textarea
        id={id}
        rows={2}
        maxLength={MAX_MESSAGE_CHARS}
        value={shown}
        onFocus={(e) => {
          if (!value) e.currentTarget.select();
        }}
        onChange={(e) => onChange(e.target.value === fallback ? "" : e.target.value)}
        className={`card-input !py-1.5 w-full text-[13px] leading-snug ${value ? "" : "text-capy-muted"}`}
      />
      <p className={`text-[11px] leading-snug ${missingLink ? "text-red-600 dark:text-red-300" : "text-capy-muted"}`}>
        {missingLink
          ? "Keep {link} — that's the customer's coupon."
          : "Placeholders: {first_name} {prize} {discount} {expiry} {link}. Keep {link}."}
      </p>
    </div>
  );
}

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

function NumberInput({ id, value, onChange, min, max, suffix, disabled }: { id: string; value: number; onChange: (n: number) => void; min: number; max: number; suffix?: string; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        disabled={disabled}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="card-input !py-1.5 w-24 tabular-nums disabled:opacity-50"
      />
      {suffix && <span className="text-xs text-capy-muted">{suffix}</span>}
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-capy-green text-white text-xs font-bold tabular-nums">{n}</span>
        <div>
          <h4 className="text-sm font-bold text-capy-text">{title}</h4>
          {hint && <p className="text-[11px] text-capy-muted leading-snug">{hint}</p>}
        </div>
      </div>
      <div className="sm:pl-9 space-y-5">{children}</div>
    </section>
  );
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  const d = new Date(2000, 0, 1, h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** One game's terms. Every field shows what the game will actually run with;
 * edits become that game's own overrides. */
function GameCard({
  game,
  values,
  onChange,
  onCopyToAll,
  canCopy,
  window: [winStart, winEnd],
  timezone,
}: {
  game: { id: string; name: string; tagline: string; deferred: boolean; default_winner_message?: string; default_loser_message?: string };
  values: GameSettings;
  onChange: <K extends keyof GameSettings>(k: K, v: GameSettings[K]) => void;
  onCopyToAll: () => void;
  canCopy: boolean;
  window: [string, string];
  timezone?: string;
}) {
  const p = (k: string) => `ap-${game.id}-${k}`;
  return (
    <div className="rounded-xl border border-capy-border bg-capy-surface/40 p-4 space-y-4">
      <div className="flex items-start gap-2 flex-wrap">
        <div className="flex-1 min-w-[10rem]">
          <p className="text-sm font-bold text-capy-text">{game.name}</p>
          <p className="text-[11px] text-capy-muted leading-snug">{game.tagline}</p>
        </div>
        {canCopy && (
          <button type="button" onClick={onCopyToAll} className="text-[11px] font-semibold text-capy-green-dark hover:underline">
            Use these for every game
          </button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Field label="Send time" htmlFor={p("time")} hint={`${timezone ?? "Restaurant"} time, ${to12h(winStart)}–${to12h(winEnd)}.`}>
          <input id={p("time")} type="time" min={winStart} max={winEnd} value={values.send_time} onChange={(e) => onChange("send_time", e.target.value)} className="card-input !py-1.5 w-36" />
        </Field>
        <Field label="Coupon good for" htmlFor={p("exp")}>
          <NumberInput id={p("exp")} value={values.coupon_expiry_hours} onChange={(n) => onChange("coupon_expiry_hours", n)} min={2} max={336} suffix="hours" />
        </Field>
        <Field label="Replies close after" htmlFor={p("win-h")} hint={game.deferred ? "This game draws its winner when its own entry window closes." : undefined}>
          <NumberInput id={p("win-h")} value={values.reply_window_hours} onChange={(n) => onChange("reply_window_hours", n)} min={1} max={72} suffix="hours" disabled={game.deferred} />
        </Field>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 items-end">
        <Field label={values.everyone_wins ? "Everyone gets" : "Winner prize"} htmlFor={p("win")}>
          <NumberInput id={p("win")} value={values.winner_percent} onChange={(n) => onChange("winner_percent", n)} min={5} max={100} suffix="% off" />
        </Field>
        <Field label="Everyone else" htmlFor={p("cons")} hint={values.everyone_wins ? "Not used: every reply wins the full prize." : undefined}>
          <NumberInput id={p("cons")} value={values.consolation_percent} onChange={(n) => onChange("consolation_percent", n)} min={0} max={50} suffix="% off" disabled={values.everyone_wins} />
        </Field>
        <Switch id={p("everyone")} checked={values.everyone_wins} onChange={(v) => onChange("everyone_wins", v)} label="Everyone wins" hint="Any reply gets the full prize, right or wrong." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MessageInput
          id={p("winner-msg")}
          label={values.everyone_wins ? "Reply to every player" : "Reply to winners"}
          value={values.winner_message}
          fallback={game.default_winner_message ?? ""}
          onChange={(v) => onChange("winner_message", v)}
        />
        {!values.everyone_wins && (
          <MessageInput
            id={p("loser-msg")}
            label="Reply to everyone else"
            value={values.loser_message}
            fallback={game.default_loser_message ?? ""}
            onChange={(v) => onChange("loser_message", v)}
          />
        )}
      </div>
    </div>
  );
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
  const setGame = <K extends keyof GameSettings>(id: string, k: K, v: GameSettings[K]) =>
    setDraft((d) => ({ ...d, game_settings: { ...(d.game_settings ?? {}), [id]: { ...(d.game_settings?.[id] ?? {}), [k]: v } } }));
  const copyToAll = (fromId: string) =>
    setDraft((d) => {
      const src = gameSettingsFor(d, fromId);
      const full = Object.fromEntries(GAME_KEYS.map((k) => [k, src[k]])) as Partial<GameSettings>;
      const next = { ...(d.game_settings ?? {}) };
      for (const id of d.games) next[id] = { ...full };
      return { ...d, game_settings: next };
    });

  const [winStart, winEnd] = data.send_window ?? ["10:00", "19:30"];
  const dirty = JSON.stringify(draft) !== JSON.stringify(data.settings);
  const groups = data.groups ?? [];
  const catalog = data.catalog ?? [];
  const chosen = draft.games.map((id) => catalog.find((g) => g.id === id)).filter((g): g is NonNullable<typeof g> => !!g);

  return (
    <form
      className="app-card p-4 sm:p-5 space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
    >
      <div>
        <h3 className="card-heading">Rules</h3>
        <p className="text-xs text-capy-muted mt-0.5">
          Saving re-plans this week right away and replaces every scheduled send, including ones you&apos;ve approved. Buckets are also rebuilt every night.
        </p>
      </div>

      <Step n={1} title="When to send, and to whom" hint="Days and spacing are shared. Each send plays one game; everyone gets the first game before the list moves on to the next.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Days between Belan texts" htmlFor="ap-gap" hint="A customer gets a game no sooner than this many days after their last text, game, coupon or coupon use from you. Their plain orders don't count.">
            <NumberInput id="ap-gap" value={draft.gap_days} onChange={(n) => set("gap_days", n)} min={1} max={90} suffix="days" />
          </Field>
          <Field label="Customers per send" htmlFor="ap-size" hint={`Start small while testing. Up to ${data.max_bucket ?? 100}.`}>
            <NumberInput id="ap-size" value={draft.bucket_size} onChange={(n) => set("bucket_size", n)} min={1} max={data.max_bucket ?? 100} suffix="max per send" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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

        <Field label="Games to rotate" hint="Played in this order: every customer gets the first game, then the second, and so on — each send day plays whichever game its customers are up to. Every player gets a coupon: winners the prize, everyone else the consolation.">
          <div className="flex flex-wrap gap-1.5">
            {catalog.map((g) => {
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
      </Step>

      <Step n={2} title="Each game's terms" hint="Send time, prizes and coupon life are set per game. A game you take out of the rotation keeps its settings.">
        {chosen.length === 0 ? (
          <p className="text-xs text-capy-muted">Pick at least one game above.</p>
        ) : (
          <div className="space-y-3">
            {chosen.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                values={gameSettingsFor(draft, g.id)}
                onChange={(k, v) => setGame(g.id, k, v)}
                onCopyToAll={() => copyToAll(g.id)}
                canCopy={chosen.length > 1}
                window={[winStart, winEnd]}
                timezone={data.timezone}
              />
            ))}
          </div>
        )}
      </Step>

      <Step n={3} title="Everything else">
        <div className="grid gap-4 sm:grid-cols-2">
          <Switch id="ap-ai" checked={draft.personalize} onChange={(v) => set("personalize", v)} label="Personalize with AI" hint="Swaps the greeting for a line written from each customer's history. Never adds an SMS segment." />
          <Switch id="ap-approve" checked={draft.require_approval} onChange={(v) => set("require_approval", v)} label="Approve each send" hint="In Live, a send waits for your OK. Unapproved sends are skipped." />
        </div>

        <Field label="Your phone for test texts" htmlFor="ap-phone" hint="“Text me this” sends a customer's exact message here as a playable test.">
          <input id="ap-phone" type="tel" placeholder="(214) 555-0100" value={draft.test_phone} onChange={(e) => set("test_phone", e.target.value)} className="card-input !py-1.5 max-w-xs" />
        </Field>
      </Step>

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
