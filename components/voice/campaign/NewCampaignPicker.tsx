"use client";

export type NewCampaignChoice = "classic" | "everyone_wins" | "promo";

const OPTIONS: {
  key: NewCampaignChoice;
  emoji: string;
  title: string;
  desc: string;
  tag?: string;
  accent: string;
}[] = [
  {
    key: "classic",
    emoji: "🎯",
    title: "Game campaign",
    desc: "Trivia, pick-a-number, dice and more. Winners get the prize; everyone else can get a consolation discount.",
    tag: "Most popular",
    accent: "bg-capy-accent-light",
  },
  {
    key: "everyone_wins",
    emoji: "🎉",
    title: "Everyone-wins game",
    desc: "Same games, no losers — every reply wins the prize. The fastest way to fill a slow night.",
    accent: "bg-capy-green-light",
  },
  {
    key: "promo",
    emoji: "📣",
    title: "Promotional message",
    desc: "Write your own one-off or scheduled text, with an optional instant coupon.",
    accent: "bg-amber-100 dark:bg-amber-500/15",
  },
];

/** Modal shown from “New campaign”: which of the three campaign types to build. */
export function NewCampaignPicker({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (choice: NewCampaignChoice) => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full sm:max-w-lg bg-capy-card rounded-t-3xl sm:rounded-3xl shadow-xl p-5 sm:p-6 space-y-4 animate-[slideup_0.18s_ease-out]">
        <style>{`@keyframes slideup{from{transform:translateY(16px);opacity:.6}to{transform:none;opacity:1}}`}</style>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-capy-text" style={{ fontFamily: "Tektur, sans-serif" }}>
              What do you want to send?
            </h2>
            <p className="text-xs text-capy-muted mt-0.5">You can test any of these on your own phone before it goes out.</p>
          </div>
          <button onClick={onClose} className="text-capy-muted hover:text-capy-text -mr-1 p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2.5">
          {OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onPick(o.key)}
              className="w-full text-left flex items-start gap-3.5 p-3.5 rounded-2xl border border-capy-border hover:border-capy-green hover:shadow-card-hover transition-all group"
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${o.accent}`}>
                {o.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-capy-text">{o.title}</span>
                  {o.tag && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-capy-green-light text-capy-green-dark">
                      {o.tag}
                    </span>
                  )}
                </span>
                <span className="block text-xs text-capy-muted mt-0.5 leading-relaxed">{o.desc}</span>
              </span>
              <svg className="w-4 h-4 text-capy-muted group-hover:text-capy-green-dark mt-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
