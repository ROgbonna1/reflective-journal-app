import dotenv from "dotenv";
// override: true so .env wins over a pre-set empty ANTHROPIC_API_KEY (e.g. when
// running inside a sandbox that defines it as "" to prevent key leakage).
dotenv.config({ override: true });

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { SEEDED_GAMES } from "./games.js";
import { categorize } from "./categorize.js";
import {
  CategorizationResult,
  Categorization,
  SkillInput,
} from "./types.js";

interface TestCase {
  name: string;
  description?: string;
  session?: SkillInput["session"];
  expected: {
    primary_game: string;
    primary_role: string;
    acceptable_games: string[];
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const fixturesPath = join(__dirname, "test-skills.json");
  const cases: TestCase[] = JSON.parse(readFileSync(fixturesPath, "utf-8"));

  let exactMatches = 0;
  let acceptableMatches = 0;

  for (let i = 0; i < cases.length; i++) {
    const tc = cases[i];
    const idx = i + 1;
    process.stdout.write(`[${idx}/${cases.length}] ${tc.name}\n`);

    let result: CategorizationResult;
    try {
      result = await categorize(
        { name: tc.name, description: tc.description, session: tc.session },
        SEEDED_GAMES,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      process.stdout.write(`  [ERROR] ${msg}\n\n`);
      continue;
    }

    const top: Categorization | undefined = result.categorizations[0];
    if (!top) {
      process.stdout.write(`  [FAIL] no suggestions\n`);
      if (result.new_game_suggestion) {
        process.stdout.write(
          `         new_game_suggestion: ${result.new_game_suggestion.name} — ${result.new_game_suggestion.rationale}\n`,
        );
      }
      process.stdout.write("\n");
      continue;
    }

    const isExact =
      top.game_slug === tc.expected.primary_game &&
      top.role === tc.expected.primary_role;
    const isAcceptable = tc.expected.acceptable_games.includes(top.game_slug);
    if (isExact) exactMatches++;
    if (isAcceptable) acceptableMatches++;

    const tag = isExact ? "[EXACT] " : isAcceptable ? "[ACCEPT]" : "[FAIL]  ";
    process.stdout.write(
      `  ${tag} top: ${top.game_slug} / ${top.role} (${top.confidence.toFixed(2)})\n`,
    );

    if (!isExact) {
      process.stdout.write(
        `           expected: ${tc.expected.primary_game} / ${tc.expected.primary_role}\n`,
      );
      process.stdout.write(`           reasoning: ${top.reasoning}\n`);
    }

    for (const c of result.categorizations.slice(1)) {
      process.stdout.write(
        `           also: ${c.game_slug} / ${c.role} (${c.confidence.toFixed(2)})\n`,
      );
    }
    if (result.new_game_suggestion) {
      process.stdout.write(
        `           new_game_suggestion: ${result.new_game_suggestion.name}\n`,
      );
    }
    process.stdout.write("\n");
  }

  const total = cases.length;
  process.stdout.write("---\n");
  process.stdout.write("Score:\n");
  process.stdout.write(
    `  Exact matches:    ${exactMatches}/${total}  (game + role)\n`,
  );
  process.stdout.write(
    `  Acceptable game:  ${acceptableMatches}/${total}  (right game, role debatable)\n`,
  );
  process.stdout.write(
    "  Quality bar:      >= 8 exact AND >= 9 acceptable\n",
  );

  const passed = exactMatches >= 8 && acceptableMatches >= 9;
  process.stdout.write(`  Status:           ${passed ? "PASSED" : "FAILED"}\n`);

  if (!passed) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
