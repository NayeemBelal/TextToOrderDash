// Shared game content for the gamified SMS marketing feature.
// Keep these consistent with the backend source of truth
// (campaign_scheduler GAME_TEMPLATES) — gotcha G9.

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

// Builds the trivia SMS body exactly as the backend sends it.
// Keeps [PRIZE] as a placeholder for buildMessagePreview-style substitution.
export function buildTriviaMessage(trivia: TriviaConfig): string {
  return `🍕 Trivia time! ${trivia.question}\nA) ${trivia.choices.A}\nB) ${trivia.choices.B}\nC) ${trivia.choices.C}\nReply A, B, or C — get it right and win [PRIZE]!`;
}

export const GAME_DEFINITIONS: Record<
  GameType,
  { label: string; emoji: string; template: string }
> = {
  "pick-number": {
    label: "Pick a Number 1–100",
    emoji: "🎲",
    template:
      "🎲 Pick a number between 1–100 for your chance to win [PRIZE]! Reply with your number.",
  },
  trivia: {
    label: "Food Trivia",
    emoji: "🍕",
    template: buildTriviaMessage(DEFAULT_TRIVIA),
  },
  "guess-letter": {
    label: "Guess the Letter A–Z",
    emoji: "🔤",
    template:
      "🔤 Guess a letter between A–Z for your chance to win [PRIZE]! Reply with your letter.",
  },
  "roll-dice": {
    label: "Roll the Dice",
    emoji: "🎰",
    template:
      "🎰 Text a number 1–6. If it matches our roll, you win [PRIZE]. Everyone gets something though!",
  },
};

export const DEFAULT_GAME_ORDER: GameType[] = [
  "pick-number",
  "roll-dice",
  "trivia",
  "guess-letter",
];
