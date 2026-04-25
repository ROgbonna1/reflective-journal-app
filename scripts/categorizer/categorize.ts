import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import {
  CategorizationResult,
  ROLE_VALUES,
  SeededGame,
  SkillInput,
} from "./types.js";

const INSTRUCTIONS = `You categorize Brazilian Jiu-Jitsu techniques into the user's existing strategic "games", with a role within each game.

A "game" is a strategic system organized around a position or theme (e.g., "Closed Guard Game", "Lasso Guard Game", "Passing Game"). A skill plays a role within a game:
- guard: holding/retaining the position itself (also used for top-position retention like mount or side control)
- sweep: bottom-to-top reversal
- attack: submission or finishing sequence
- pass: getting through opponent's guard
- escape: getting out of a bad position
- transition: bridging move between positions
- setup: grip fight, angle, off-balance, prep work
- concept: a principle/cue tied to the position (frames, posture, pressure, etc.)

Rules:
1. Return at most 3 categorizations, sorted by confidence descending.
2. Only include suggestions with confidence >= 0.4. If nothing fits >= 0.4 and the skill seems to belong to a system not in the existing games, suggest a new game via new_game_suggestion. Otherwise return an empty categorizations array.
3. The same skill may genuinely fit multiple games (e.g., a sweep that bridges two systems, a leg-lock entry from DLR). When confident, suggest both.
4. Respect session context: if the session is no-gi, suppress or down-weight gi-only games (Spider Guard, Lasso Guard).
5. Match user's existing games when possible. Only suggest a new game when nothing fits well.
6. confidence: 0.0-1.0, where 1.0 is "obvious fit", 0.7 is "clear fit, minor ambiguity", 0.5 is "plausible but debatable role/game", 0.4 is "edge case worth surfacing".
7. game_slug must exactly match one of the slugs in the existing games list.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    categorizations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          game_slug: {
            type: "string",
            description: "Slug of an existing game.",
          },
          role: {
            type: "string",
            enum: ROLE_VALUES as unknown as string[],
          },
          confidence: { type: "number" },
          reasoning: {
            type: "string",
            description: "One sentence explaining why this game and role fit.",
          },
        },
        required: ["game_slug", "role", "confidence", "reasoning"],
        additionalProperties: false,
      },
    },
    new_game_suggestion: {
      anyOf: [
        {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            rationale: { type: "string" },
          },
          required: ["name", "description", "rationale"],
          additionalProperties: false,
        },
        { type: "null" },
      ],
    },
  },
  required: ["categorizations", "new_game_suggestion"],
  additionalProperties: false,
};

function buildSystemPrompt(games: SeededGame[]): string {
  const gamesPayload = games.map((g) => ({
    slug: g.slug,
    name: g.name,
    description: g.description,
    typical_roles: g.typicalRoles,
  }));
  return `${INSTRUCTIONS}\n\nExisting games:\n${JSON.stringify(gamesPayload, null, 2)}`;
}

function buildUserMessage(skill: SkillInput): string {
  return [
    `Skill: ${skill.name}`,
    skill.description ? `Mechanics / cue: ${skill.description}` : null,
    skill.session?.giOrNogi
      ? `Session: ${skill.session.giOrNogi === "gi" ? "Gi" : "No-gi"}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export interface CategorizerOptions {
  model?: string;
  apiKey?: string;
  client?: Anthropic;
}

export async function categorize(
  skill: SkillInput,
  games: SeededGame[],
  options: CategorizerOptions = {},
): Promise<CategorizationResult> {
  const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!options.client && !apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.",
    );
  }

  const client = options.client ?? new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: options.model ?? "claude-haiku-4-5",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: buildSystemPrompt(games),
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: RESPONSE_SCHEMA,
      },
    },
    messages: [{ role: "user", content: buildUserMessage(skill) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Categorizer response had no text content");
  }
  return JSON.parse(textBlock.text) as CategorizationResult;
}
