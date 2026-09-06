"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { previewGame, type GamePreviewResponse } from "@/lib/gameTemplatesApi";
import {
  ANSWER_FORMAT_LABELS,
  WINNER_CAP_LABELS,
  WIN_RULE_HELP,
  WIN_RULE_LABELS,
  isDeferredRule,
  type AnswerFormat,
  type GameSpec,
  type WinRule,
  type WinnerCap,
} from "@/components/voice/games";

interface Props {
  restaurantId: string;
  spec: Partial<GameSpec>;
  onChange: (patch: Partial<GameSpec>) => void;
  /** The slot's prize, so the live preview renders {prize} truthfully. */
  prize?: { type?: string; itemName?: string; percent?: number };
  /** The slot's current game text; omitted ⇒ preview the default copy. */
  gameMessage?: string;
  everyoneWins: boolean;
}

const CHOICE_KEYS = ["A", "B", "C", "D"] as const;

// Which rules can actually grade each kind of reply. Offering "closest guess"
// for a multiple-choice answer would just be a setting the backend silently
// rewrites, so the options are filtered instead.
const RULES_BY_FORMAT: Record<AnswerFormat, WinRule[]> = {
  number: ["match-draw", "exact", "closest", "random", "everyone"],
  letter: ["match-draw", "exact", "random", "everyone"],
  choice: ["exact", "random", "everyone"],
  text: ["exact", "random", "everyone"],
  any: ["random", "everyone"],
};

const WINDOW_PRESETS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 240, label: "4 hours" },
  { minutes: 480, label: "8 hours" },
  { minutes: 1440, label: "1 day" },
];

const inputClass =
  "w-full px-3 py-2 bg-slate-50 border border-capy-border rounded-xl text-xs text-capy-text focus:outline-none focus:ring-2 focus:ring-capy-green";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="section-label mb-1">{label}</p>
      {children}
      {hint && (
        <p className="text-[11px] text-capy-muted mt-1 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

/**
 * Author a game from scratch: what players text back, how it's graded, and
 * how many can win.
 *
 * The three choices are independent (see services/game_engine.py), which is
 * what makes "closest guess wins", "first 10 replies win" and classic trivia
 * the same feature rather than three. The backend normalizes whatever this
 * produces — it never rejects a game, it substitutes defaults — so the live
 * preview below is doing real work: it shows the spec as the engine actually
 * understood it, the SMS it would send, and anything the owner should fix
 * before launching.
 */
export function GameCreator({
  restaurantId,
  spec,
  onChange,
  prize,
  gameMessage,
  everyoneWins,
}: Props) {
  const [preview, setPreview] = useState<GamePreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const format = spec.answer_format ?? "number";
  const rule = spec.win_rule ?? "match-draw";
  const cap = spec.winner_cap ?? "first";
  const deferred = isDeferredRule(rule);
  const availableRules = RULES_BY_FORMAT[format] ?? RULES_BY_FORMAT.any;

  // Serialized so the effect re-runs on any spec edit without an exhaustive
  // dependency list over a dozen optional fields.
  const specKey = useMemo(
    () => JSON.stringify([spec, prize, gameMessage, everyoneWins]),
    [spec, prize, gameMessage, everyoneWins],
  );

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      previewGame({ restaurantId, spec, prize, gameMessage, everyoneWins })
        .then((r) => {
          setPreview(r);
          setPreviewError(false);
        })
        .catch(() => setPreviewError(true));
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, specKey]);

  // Changing what players reply with can invalidate the grading rule — swap
  // to the first rule that still makes sense rather than leaving a
  // combination the backend would quietly rewrite.
  const changeFormat = (next: AnswerFormat) => {
    const rules = RULES_BY_FORMAT[next];
    const patch: Partial<GameSpec> = { answer_format: next };
    if (!rules.includes(rule)) patch.win_rule = rules[0];
    if (next === "choice" && !spec.choices) {
      patch.choices = { A: "", B: "", C: "" };
      patch.answer = "A";
    }
    if (next === "number" && !spec.range) patch.range = { min: 1, max: 100 };
    onChange(patch);
  };

  const changeRule = (next: WinRule) => {
    const patch: Partial<GameSpec> = { win_rule: next };
    if (isDeferredRule(next) && !spec.window_minutes) patch.window_minutes = 120;
    // A closest-guess game is unbounded unless the owner bounds it: clearing
    // a leftover 1–100 range stops it rejecting the guesses it's asking for.
    if (next === "closest") patch.range = null;
    onChange(patch);
  };

  const changeCap = (next: WinnerCap) => {
    onChange({
      winner_cap: next,
      winner_limit: next === "top-n" ? (spec.winner_limit ?? 10) : null,
    });
  };

  const setChoice = (key: string, value: string) =>
    onChange({ choices: { ...(spec.choices ?? {}), [key]: value } });

  const removeChoice = (key: string) => {
    const next = { ...(spec.choices ?? {}) };
    delete next[key];
    onChange({
      choices: next,
      answer: spec.answer === key ? Object.keys(next)[0] : spec.answer,
    });
  };

  const filledChoices = Object.entries(spec.choices ?? {});
  const nextChoiceKey = CHOICE_KEYS.find((k) => !(k in (spec.choices ?? {})));

  return (
    <div className="space-y-3">
      <Field label="Game name" hint="Just for your dashboard — customers never see it.">
        <input
          type="text"
          value={spec.label ?? ""}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="e.g. Guess the Note"
          className={inputClass}
        />
      </Field>

      <Field
        label="What do players text back?"
        hint={
          format === "any"
            ? "Any reply counts as an entry — good for draws and giveaways."
            : undefined
        }
      >
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(ANSWER_FORMAT_LABELS) as AnswerFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => changeFormat(f)}
              className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                format === f
                  ? "border-capy-green bg-capy-green-light text-capy-green-dark"
                  : "border-capy-border text-capy-muted hover:border-capy-green"
              }`}
            >
              {ANSWER_FORMAT_LABELS[f]}
            </button>
          ))}
        </div>
      </Field>

      {(format === "choice" || format === "text" || rule === "closest") && (
        <Field label="Question">
          <input
            type="text"
            value={spec.question ?? ""}
            onChange={(e) => onChange({ question: e.target.value })}
            placeholder={
              rule === "closest"
                ? "e.g. How many bottles did we sell last month?"
                : "e.g. Which note leads our Oud Royale?"
            }
            className={inputClass}
          />
        </Field>
      )}

      {format === "choice" && (
        <Field label="Answer choices" hint="Tap a letter to mark the correct one.">
          <div className="space-y-2">
            {filledChoices.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <button
                  onClick={() => onChange({ answer: key })}
                  title="Mark as the correct answer"
                  className={`w-7 h-7 shrink-0 rounded-lg text-xs font-semibold transition-all ${
                    spec.answer === key
                      ? "bg-capy-green text-white"
                      : "border border-capy-border text-capy-muted hover:border-capy-green"
                  }`}
                >
                  {key}
                </button>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setChoice(key, e.target.value)}
                  placeholder={`Choice ${key}`}
                  className={`flex-1 ${inputClass}`}
                />
                {filledChoices.length > 2 && (
                  <button
                    onClick={() => removeChoice(key)}
                    className="text-capy-muted hover:text-red-500 text-sm px-1 shrink-0"
                    aria-label={`Remove choice ${key}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {nextChoiceKey && (
              <button
                onClick={() => setChoice(nextChoiceKey, "")}
                className="text-[11px] font-semibold text-capy-green-dark hover:underline"
              >
                + Add choice {nextChoiceKey}
              </button>
            )}
          </div>
        </Field>
      )}

      {format === "number" && rule !== "closest" && (
        <Field label="Number range">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={spec.range?.min ?? 1}
              onChange={(e) =>
                onChange({
                  range: {
                    min: Number(e.target.value),
                    max: spec.range?.max ?? 100,
                  },
                })
              }
              className={inputClass}
            />
            <span className="text-xs text-capy-muted shrink-0">to</span>
            <input
              type="number"
              value={spec.range?.max ?? 100}
              onChange={(e) =>
                onChange({
                  range: {
                    min: spec.range?.min ?? 1,
                    max: Number(e.target.value),
                  },
                })
              }
              className={inputClass}
            />
          </div>
        </Field>
      )}

      <Field label="How do players win?" hint={WIN_RULE_HELP[rule]}>
        <div className="space-y-1.5">
          {availableRules.map((r) => (
            <button
              key={r}
              onClick={() => changeRule(r)}
              className={`w-full px-3 py-2 rounded-xl border-2 text-left text-xs font-semibold transition-all ${
                rule === r
                  ? "border-capy-green bg-capy-green-light text-capy-green-dark"
                  : "border-capy-border text-capy-muted hover:border-capy-green"
              }`}
            >
              {WIN_RULE_LABELS[r]}
              {isDeferredRule(r) && (
                <span className="ml-1.5 font-normal opacity-70">· timed</span>
              )}
            </button>
          ))}
        </div>
      </Field>

      {rule === "exact" && format !== "choice" && (
        <Field
          label="Correct answer"
          hint={
            format === "text"
              ? "Capitals and extra spaces are ignored when we check replies."
              : undefined
          }
        >
          <input
            type={format === "number" ? "number" : "text"}
            value={spec.answer ?? ""}
            onChange={(e) => onChange({ answer: e.target.value })}
            placeholder={format === "letter" ? "e.g. Q" : "e.g. bergamot"}
            className={inputClass}
          />
        </Field>
      )}

      {rule === "exact" && format === "text" && (
        <Field
          label="Also accept"
          hint="Comma-separated spellings that should also count as correct."
        >
          <input
            type="text"
            value={(spec.accepted_answers ?? []).join(", ")}
            onChange={(e) =>
              onChange({
                accepted_answers: e.target.value
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g. bergamotte, bergamot orange"
            className={inputClass}
          />
        </Field>
      )}

      {rule === "closest" && (
        <Field
          label="The real number"
          hint="Players never see this — it's what their guesses are measured against."
        >
          <input
            type="number"
            value={spec.target ?? ""}
            onChange={(e) => onChange({ target: Number(e.target.value) })}
            placeholder="e.g. 350"
            className={inputClass}
          />
        </Field>
      )}

      {everyoneWins && (
        <p className="text-[11px] text-capy-muted leading-relaxed bg-slate-50 border border-capy-border rounded-xl px-3 py-2">
          This is an <span className="font-semibold">everyone wins</span>{" "}
          campaign, so every reply wins the prize — the grading rule and winner
          limit above don&apos;t apply. Switch the campaign type in step 3 to use
          them.
        </p>
      )}

      {!everyoneWins && (
        <Field label="How many can win?">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(WINNER_CAP_LABELS) as WinnerCap[]).map((c) => (
              <button
                key={c}
                onClick={() => changeCap(c)}
                className={`px-2 py-2 rounded-xl border-2 text-[11px] font-semibold transition-all ${
                  cap === c
                    ? "border-capy-green bg-capy-green-light text-capy-green-dark"
                    : "border-capy-border text-capy-muted hover:border-capy-green"
                }`}
              >
                {WINNER_CAP_LABELS[c]}
              </button>
            ))}
          </div>
          {cap === "top-n" && (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min={2}
                value={spec.winner_limit ?? 10}
                onChange={(e) => onChange({ winner_limit: Number(e.target.value) })}
                className={`w-24 ${inputClass}`}
              />
              <span className="text-xs text-capy-muted">winners</span>
            </div>
          )}
        </Field>
      )}

      {deferred && (
        <Field
          label="How long are entries open?"
          hint="Players get a “you’re entered” text straight away, then the winner text when this window closes."
        >
          <div className="flex flex-wrap gap-1.5">
            {WINDOW_PRESETS.map((w) => (
              <button
                key={w.minutes}
                onClick={() => onChange({ window_minutes: w.minutes })}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  (spec.window_minutes ?? 120) === w.minutes
                    ? "bg-capy-green text-white"
                    : "border border-capy-border text-capy-muted hover:border-capy-green"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* ── Live preview: the game as the backend actually understood it ── */}
      <div className="border-t border-capy-border pt-3 space-y-2">
        <p className="section-label">Preview</p>
        {previewError && (
          <p className="text-[11px] text-capy-muted">
            Couldn&apos;t reach the preview — your settings are still saved.
          </p>
        )}
        {preview && !previewError && (
          <>
            <div className="bg-slate-50 border border-capy-border rounded-xl px-3 py-2">
              <p className="text-xs text-capy-text italic whitespace-pre-line leading-relaxed">
                &ldquo;{preview.message}&rdquo;
              </p>
            </div>
            <p className="text-[10px] text-capy-muted font-mono">
              {preview.summary}
            </p>
            {preview.example_winning_answer && (
              <p className="text-[11px] text-capy-muted">
                Winning answer this round would be{" "}
                <span className="font-bold text-capy-text">
                  {preview.example_winning_answer}
                </span>
                {rule === "match-draw" && " (redrawn every time the game sends)"}
              </p>
            )}
            {preview.problems.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 space-y-1">
                {preview.problems.map((p) => (
                  <p key={p} className="text-[11px] text-amber-700">
                    • {p}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
