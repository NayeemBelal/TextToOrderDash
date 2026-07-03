// Shared game content for the gamified SMS marketing feature.
// Keep these consistent with the backend source of truth
// (campaign_scheduler GAME_TEMPLATES) — gotcha G9.

export type GameType = "pick-number" | "trivia" | "guess-letter" | "roll-dice";

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
    template:
      "🍕 Trivia time! [QUESTION] Reply A, B, or C. Get it right and win [PRIZE]!",
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
