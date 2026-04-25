export type Role =
  | "guard"
  | "sweep"
  | "attack"
  | "pass"
  | "escape"
  | "transition"
  | "setup"
  | "concept";

export const ROLE_VALUES: readonly Role[] = [
  "guard",
  "sweep",
  "attack",
  "pass",
  "escape",
  "transition",
  "setup",
  "concept",
];

export interface SeededGame {
  slug: string;
  name: string;
  description: string;
  typicalRoles: Role[];
}

export interface SkillInput {
  name: string;
  description?: string;
  session?: {
    giOrNogi?: "gi" | "nogi";
  };
}

export interface Categorization {
  game_slug: string;
  role: Role;
  confidence: number;
  reasoning: string;
}

export interface NewGameSuggestion {
  name: string;
  description: string;
  rationale: string;
}

export interface CategorizationResult {
  categorizations: Categorization[];
  new_game_suggestion: NewGameSuggestion | null;
}
