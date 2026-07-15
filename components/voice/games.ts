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

export type GameType = "pick-number" | "trivia" | "guess-letter" | "roll-dice";

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

export const FALLBACK_GAME_MESSAGES: Record<GameType, string> = {
  "pick-number":
    "Hey! It's {restaurant_name}!\n\n🎲 Pick a number between 1–100 for your chance to win {prize}! Reply with your number.",
  trivia:
    "Hey! It's {restaurant_name}!\n\n🍕 Trivia time! {question}\n{choices}\nReply A, B, or C — get it right and win {prize}!",
  "guess-letter":
    "Hey! It's {restaurant_name}!\n\n🔤 Guess a letter between A–Z for your chance to win {prize}! Reply with your letter.",
  "roll-dice":
    "Hey! It's {restaurant_name}!\n\n🎰 Text a number 1–6. If it matches our roll, you win {prize}. Everyone gets something though!",
};

export const FALLBACK_WINNER_MESSAGE =
  "🏆 {first_name}, you won {prize}! Tap to redeem in store ({expiry}): {link}";

export const FALLBACK_LOSER_MESSAGE =
  "Not this time, but you still get {discount}% off your next order! Tap to claim ({expiry}): {link}";

export const GAME_DEFINITIONS: Record<
  GameType,
  { label: string; emoji: string }
> = {
  "pick-number": { label: "Pick a Number 1–100", emoji: "🎲" },
  trivia: { label: "Food Trivia", emoji: "🍕" },
  "guess-letter": { label: "Guess the Letter A–Z", emoji: "🔤" },
  "roll-dice": { label: "Roll the Dice", emoji: "🎰" },
};

export const DEFAULT_GAME_ORDER: GameType[] = [
  "pick-number",
  "roll-dice",
  "trivia",
  "guess-letter",
];
