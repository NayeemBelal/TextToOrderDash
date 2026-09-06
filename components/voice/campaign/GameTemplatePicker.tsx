"use client";

import { useEffect, useState } from "react";
import {
  getGameTemplates,
  setVertical as saveVertical,
  VERTICAL_LABELS,
  type GameTemplate,
  type GameTemplatesResponse,
  type Vertical,
} from "@/lib/gameTemplatesApi";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  restaurantId: string;
  /** Slug of the game currently in this slot, so the matching card reads as selected. */
  currentType?: string;
  /** Everyone-wins campaigns override each game's own rules, so a template's
   *  timed entry window and winner limit don't apply in that mode. */
  everyoneWins?: boolean;
  onPick: (template: GameTemplate) => void;
  /** Opens the from-scratch creator instead of picking a curated game. */
  onBuildYourOwn: () => void;
  onClose: () => void;
}

const DEFERRED_NOTE =
  "Players get a “you’re entered” text right away; the winner is announced when entries close.";

/**
 * Pick a ready-to-run game from the curated catalog.
 *
 * The catalog is tagged by merchant vertical, so a fragrance house is shown
 * "Guess the Note" before the generic number draws. The saved vertical drives
 * the default list; the chips let an owner browse another category's games
 * (and save it, since a merchant who keeps browsing "Fragrance" almost
 * certainly is one).
 *
 * Picking a template fills the slot completely — game, spec, suggested prize
 * and all its SMS copy — and everything stays editable afterwards, so this is
 * a starting point rather than a commitment.
 */
export function GameTemplatePicker({
  restaurantId,
  currentType,
  everyoneWins = false,
  onPick,
  onBuildYourOwn,
  onClose,
}: Props) {
  const [data, setData] = useState<GameTemplatesResponse | null>(null);
  const [browsing, setBrowsing] = useState<Vertical | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getGameTemplates(restaurantId, browsing ?? undefined)
      .then((r) => {
        if (cancelled) return;
        setData(r);
        setError(null);
      })
      .catch(() => !cancelled && setError("Couldn't load games. Try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [restaurantId, browsing]);

  // Browsing another vertical and liking it enough to pick from it is a
  // strong signal about what this merchant sells — save it so the catalog
  // opens on the right category next time.
  const handlePick = (template: GameTemplate) => {
    if (data && browsing && browsing !== data.saved_vertical) {
      saveVertical(restaurantId, browsing).catch(() => {
        /* cosmetic — the pick itself already worked */
      });
    }
    onPick(template);
  };

  const activeVertical = browsing ?? data?.vertical;

  return (
    <div className="px-4 pb-4 border-t border-capy-border pt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-capy-muted font-medium">
          Ready-to-run games
        </p>
        <button
          onClick={onClose}
          className="text-xs text-capy-muted hover:text-capy-text transition-colors"
        >
          Close
        </button>
      </div>

      {data && data.verticals.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
          {data.verticals.map((v) => (
            <button
              key={v}
              onClick={() => setBrowsing(v)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                activeVertical === v
                  ? "bg-capy-green text-white"
                  : "border border-capy-border text-capy-muted hover:border-capy-green hover:text-capy-green-dark"
              }`}
            >
              {VERTICAL_LABELS[v] ?? v}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="space-y-2 mt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && !loading && (
        <p className="text-xs text-red-600 py-3">{error}</p>
      )}

      {!loading && !error && data && (
        <div className="space-y-2">
          {data.templates.map((template) => {
            const selected = template.spec.type === currentType;
            return (
              <button
                key={template.id}
                onClick={() => handlePick(template)}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  selected
                    ? "border-capy-green bg-capy-green-light"
                    : "border-capy-border hover:border-capy-green"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-xs font-semibold text-capy-text"
                    style={{ fontFamily: "Tektur, sans-serif" }}
                  >
                    {template.name}
                  </p>
                  {template.deferred && !everyoneWins && (
                    <span
                      title={DEFERRED_NOTE}
                      className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-capy-border/40 text-capy-muted"
                    >
                      timed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-capy-muted mt-1 leading-relaxed">
                  {template.tagline}
                </p>
                <p className="text-[10px] text-capy-muted/80 font-mono mt-1.5 truncate">
                  {everyoneWins ? "everyone who replies wins" : template.summary}
                </p>
              </button>
            );
          })}

          <button
            onClick={onBuildYourOwn}
            className="w-full p-3 rounded-xl border-2 border-dashed border-capy-border text-left hover:border-capy-green transition-all"
          >
            <p
              className="text-xs font-semibold text-capy-text"
              style={{ fontFamily: "Tektur, sans-serif" }}
            >
              + Build your own
            </p>
            <p className="text-[11px] text-capy-muted mt-1">
              Write the question, set the answer, and choose how players win.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
