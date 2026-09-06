// Shared game content for the gamified SMS marketing feature.
//
// The SOURCE OF TRUTH for message templates is the backend
// (`GET /api/marketing/campaign-config`, services/campaign_templates.py) —
// the wizard prefills its editors from that endpoint. The FALLBACK_* constants
// below are verbatim copies used only until the prefill fetch resolves (or if
// it fails); drift here only affects previews, never what actually sends
// (gotcha G9, downgraded from send-copy drift to preview drift).
//
// Placeholder vocabulary (matches the backend renderer):
//   game message : {restaurant_name} {prize}; trivia also {question} {choices}
//   winner reply : {first_name} {prize} {code} {link} {expiry}
//   loser reply  : {first_name} {discount} {code} {link} {expiry}

// The four original games. A game's type is now a free-form slug (the curated
// catalog and the creator both mint their own), so this is the set of games
// with SPECIAL handling in this file — not the set of games that can exist.
export type LegacyGameType =
  | "pick-number"
  | "trivia"
  | "guess-letter"
  | "roll-dice";

/** Any game's slug. Legacy slugs are the ones with fallback copy below. */
export type GameType = LegacyGameType | (string & {});

// ── The game creator's vocabulary ──────────────────────────────────────────
//
// Mirrors services/game_engine.py. A game is three independent choices:
// what the player texts back, how that reply is graded, and how many people
// can win. The backend normalizes whatever we send (it never rejects a spec,
// it substitutes defaults), so these types describe the shape the editors
// produce, not a contract we have to get exactly right.

/** What the customer texts back. */
export type AnswerFormat = "number" | "letter" | "choice" | "text" | "any";

/** How a reply is graded. `closest` and `random` are DEFERRED — the winner
 *  isn't known until the round's entry window closes, so players get an
 *  acknowledgement first and the result later. */
export type WinRule = "match-draw" | "exact" | "closest" | "random" | "everyone";

/** How many winners a round allows. */
export type WinnerCap = "first" | "all" | "top-n";

export const DEFERRED_WIN_RULES: WinRule[] = ["closest", "random"];

export function isDeferredRule(rule: WinRule | undefined): boolean {
  return !!rule && DEFERRED_WIN_RULES.includes(rule);
}

export interface GameSpec {
  type: string;
  label: string;
  answer_format: AnswerFormat;
  win_rule: WinRule;
  winner_cap: WinnerCap;
  winner_limit: number | null;
  prompt: string | null;
  question: string | null;
  choices: Record<string, string> | null;
  answer: string | null;
  accepted_answers: string[];
  range: { min: number; max: number } | null;
  target: number | null;
  window_minutes: number | null;
}

/** Human labels for the creator's dropdowns. */
export const ANSWER_FORMAT_LABELS: Record<AnswerFormat, string> = {
  number: "A number",
  letter: "A letter (A–Z)",
  choice: "Multiple choice",
  text: "A word or phrase",
  any: "Anything at all",
};

export const WIN_RULE_LABELS: Record<WinRule, string> = {
  "match-draw": "Match our secret pick",
  exact: "Get the answer right",
  closest: "Closest guess wins",
  random: "Random draw from all entries",
  everyone: "Everyone who replies wins",
};

export const WIN_RULE_HELP: Record<WinRule, string> = {
  "match-draw":
    "We pick a value at random when the game sends. Anyone who texts the same thing wins.",
  exact: "You set the right answer. Anyone who texts it wins.",
  closest:
    "You set the real number. When entries close, whoever guessed nearest wins — players get a \u201cyou\u2019re entered\u201d text first.",
  random:
    "Every reply goes in a hat. Winners are drawn when entries close — players get a \u201cyou\u2019re entered\u201d text first.",
  everyone: "No wrong answers — every reply wins the prize.",
};

export const WINNER_CAP_LABELS: Record<WinnerCap, string> = {
  first: "One winner",
  all: "Everyone who qualifies",
  "top-n": "A set number of winners",
};

/** The spec the four legacy games have always played, for seeding the
 *  creator when an owner opens one of them. Matches LEGACY_GAMES in
 *  services/game_engine.py. */
export const LEGACY_SPECS: Record<LegacyGameType, Partial<GameSpec>> = {
  "pick-number": {
    type: "pick-number",
    answer_format: "number",
    win_rule: "match-draw",
    winner_cap: "first",
    range: { min: 1, max: 100 },
  },
  "roll-dice": {
    type: "roll-dice",
    answer_format: "number",
    win_rule: "match-draw",
    winner_cap: "first",
    range: { min: 1, max: 6 },
  },
  "guess-letter": {
    type: "guess-letter",
    answer_format: "letter",
    win_rule: "match-draw",
    winner_cap: "first",
  },
  trivia: {
    type: "trivia",
    answer_format: "choice",
    win_rule: "exact",
    winner_cap: "all",
  },
};

export interface TriviaConfig {
  question: string;
  choices: { A: string; B: string; C: string };
  answer: "A" | "B" | "C";
}

// Mirrors the backend's default trivia — used when the creator hasn't
// customized a trivia game (the backend falls back to this wholesale).
export const DEFAULT_TRIVIA: TriviaConfig = {
  question: "What's the most ordered food in America?",
  choices: { A: "Pizza", B: "Burgers", C: "Tacos" },
  answer: "A",
};

// Renders the {choices} placeholder the way the backend does.
export function buildTriviaChoices(trivia: TriviaConfig): string {
  return `A) ${trivia.choices.A}\nB) ${trivia.choices.B}\nC) ${trivia.choices.C}`;
}

export const FALLBACK_GAME_MESSAGES: Record<LegacyGameType, string> = {
  "pick-number":
    "Hey! It's {restaurant_name}!\n\n🎲 Pick a number between 1–100 for your chance to win {prize}! Reply with your number.",
  trivia:
    "Hey! It's {restaurant_name}!\n\n🍕 Trivia time! {question}\n{choices}\nReply A, B, or C — get it right and win {prize}!",
  "guess-letter":
    "Hey! It's {restaurant_name}!\n\n🔤 Guess a letter between A–Z for your chance to win {prize}! Reply with your letter.",
  "roll-dice":
    "Hey! It's {restaurant_name}!\n\n🎰 Text a number 1–6. If it matches our roll, you win {prize}. Everyone gets something though!",
};

// "Everyone wins" mode: same games, guaranteed-prize copy (no "chance to win").
// Mirrors the backend's DEFAULT_EVERYONE_WINS_GAME_MESSAGES; preview fallback
// only — the authoritative copy comes from campaign-config's
// everyone_wins_game_messages.
export const FALLBACK_EVERYONE_WINS_GAME_MESSAGES: Record<LegacyGameType, string> = {
  "pick-number":
    "Hey! It's {restaurant_name}!\n\n🎉 Pick a number between 1–100 and WIN {prize} — everyone's a winner today! Reply with your number to claim.",
  trivia:
    "Hey! It's {restaurant_name}!\n\n🎉 {question}\n{choices}\nReply A, B, or C — everyone wins {prize} today!",
  "guess-letter":
    "Hey! It's {restaurant_name}!\n\n🎉 Guess a letter between A–Z and WIN {prize} — everyone's a winner today! Reply with your letter to claim.",
  "roll-dice":
    "Hey! It's {restaurant_name}!\n\n🎉 Text a number 1–6 and WIN {prize} — everyone wins today! Reply to claim.",
};

export const FALLBACK_WINNER_MESSAGE =
  "🏆 {first_name}, you won {prize}! Tap to redeem in store ({expiry}): {link}";

export const FALLBACK_LOSER_MESSAGE =
  "Not this time, but you still get {discount}% off your next order! Tap to claim ({expiry}): {link}";

// Deferred games acknowledge the entry and announce the winner later; this is
// the copy for that first text. Mirrors DEFAULT_ENTRY_MESSAGE in
// services/campaign_templates.py.
export const FALLBACK_ENTRY_MESSAGE =
  "You're in, {first_name}! \ud83c\udf40 We'll text the winner {draw_time}. Good luck!";

export const GAME_DEFINITIONS: Record<
  LegacyGameType,
  { label: string; emoji: string }
> = {
  "pick-number": { label: "Pick a Number 1–100", emoji: "🎲" },
  trivia: { label: "Food Trivia", emoji: "🍕" },
  "guess-letter": { label: "Guess the Letter A–Z", emoji: "🔤" },
  "roll-dice": { label: "Roll the Dice", emoji: "🎰" },
};

export const DEFAULT_GAME_ORDER: LegacyGameType[] = [
  "pick-number",
  "roll-dice",
  "trivia",
  "guess-letter",
];

/** Emoji + label for any game, curated or hand-built. Legacy games keep the
 *  icons owners already recognise; everything else falls back to its own
 *  label and a generic controller. */
export function gameDisplay(
  type: GameType,
  label?: string | null,
): { label: string; emoji: string } {
  const legacy = GAME_DEFINITIONS[type as LegacyGameType];
  if (legacy) return legacy;
  return { label: label || type, emoji: "\ud83c\udfae" };
}

/** Renders the {choices} placeholder for any multiple-choice spec. */
export function buildSpecChoices(spec?: Partial<GameSpec> | null): string {
  const choices = spec?.choices ?? {};
  return Object.entries(choices)
    .map(([key, value]) => `${key}) ${value}`)
    .join("\n");
}

/** Renders the {range} placeholder: what the player is allowed to text. */
export function describeAnswerSpace(spec?: Partial<GameSpec> | null): string {
  switch (spec?.answer_format) {
    case "number": {
      const r = spec.range;
      return r && r.max > r.min ? `${r.min}\u2013${r.max}` : "a number";
    }
    case "letter":
      return "A\u2013Z";
    case "choice":
      return Object.keys(spec.choices ?? {}).join(", ");
    default:
      return "";
  }
}
