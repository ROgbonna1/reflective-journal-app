# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a **docs-led** project in early implementation. Only one piece of code exists: the standalone LLM categorizer prototype under `scripts/categorizer/` (Stream A in the workstream plan). The Expo/React Native app (Stream B — `app/`, `db/`, `seeds/`, root `package.json`) is **not yet scaffolded**. Don't assume those directories exist; check before referencing them.

`/docs` is the single source of truth for design, schema, and scope. Read the relevant doc before writing code or proposing changes, and update the doc in the same change when behavior, schema, or scope shifts. The README states this rule and `feedback_docs_source_of_truth` reinforces it.

Key docs:
- `docs/domain-model.md` — entities, ASCII flow diagrams, LLM prompt shapes, v1 scope, **Resolved decisions log** (read this before changing anything that smells like a previously-settled design question)
- `docs/seeded-games.md` — the 14 pre-seeded BJJ games; descriptions double as LLM grounding text
- `docs/workstreams.md` — Stream A / Stream B split, file boundaries, task claim process, current status table
- `docs/documentation-inconsistencies.md` — log inconsistencies you spot but can't fix in your current change

## Commands

All commands today live in the categorizer sub-project. Run from `scripts/categorizer/`:

```sh
npm install                    # one-time
cp .env.example .env           # then fill in ANTHROPIC_API_KEY
npm test                       # runs run-tests.ts via tsx against test-skills.json
```

`npm test` exits non-zero unless the run hits the quality bar (`>= 8/10` exact game+role AND `>= 9/10` acceptable game). To test a single skill, edit `test-skills.json` or call `categorize()` directly from a one-off script — there is no per-case filter flag.

There is **no root-level `package.json`, build, lint, or test runner yet**. When B1 lands it will add the Expo scaffold at the repo root.

## Architecture — the parts that span files

### Two-stream file ownership (avoid merge collisions)

| Stream    | Touches                                                          |
|-----------|------------------------------------------------------------------|
| Stream A  | `scripts/` (standalone Node TS), `docs/` for prompt iteration    |
| Stream B  | repo root, `app/`, `db/`, `seeds/`                               |

If a change genuinely needs both (e.g., porting `categorize()` into the Expo app), pause and sync — see `docs/workstreams.md`.

### Categorizer prototype (`scripts/categorizer/`)

Self-contained Node TS sub-project with its own `package.json` so it doesn't conflict with the future Expo scaffold at the repo root. ESM (`"type": "module"` → `.js` import specifiers in TS source). Run via `tsx`, no build step.

Pipeline: `run-tests.ts` loads fixtures → calls `categorize(skill, SEEDED_GAMES)` → compares top suggestion to expected `primary_game`/`primary_role`. The function in `categorize.ts` builds a system prompt (instructions + games payload, with `cache_control: ephemeral` on the system block) and sends it to Claude with `output_config.format = json_schema`. The schema is defined inline in `categorize.ts` and the matching TS types are in `types.ts` — keep these two in sync.

`SkillCategorizer` is intentionally an **interface boundary**. The function takes `model`, `apiKey`, and `client` options so the implementation is swappable (per `docs/domain-model.md` "LLM choice"). When porting into the app, preserve this shape rather than inlining Anthropic calls into screens.

### Tight coupling: seeded games ↔ categorizer prompt

`scripts/categorizer/games.ts` mirrors `docs/seeded-games.md`. Each game's `description` is fed to the LLM as grounding text — editing a description **changes categorization behavior**. When B2 adds `seeds/games.json`, that file becomes a third mirror; all three need to move together. The header comment in `games.ts` flags this.

### Save-first / AI-as-enrichment

The schema has `Skill.pending_categorization: bool` because the LLM call must **never block a save**. Offline or API errors save the skill immediately and queue it. Reflection link suggestions are similarly optional. Don't introduce code paths that gate persistence on a successful LLM round-trip.

### Anchor decisions before re-litigating

Several design questions are resolved in `docs/domain-model.md` → "Resolved decisions log" (Game is an entity not a tag; no `Concept` entity in v1; reflections are session-optional; no backend service in v1; etc.). If a change seems to push against one of these, surface it as a deliberate revision to the doc, not a silent code-level departure.

## Conventions

- **Branches:** `<task-id>/<short-slug>` (e.g., `b1/expo-scaffold`).
- **PR titles:** prefix with the task ID in brackets (e.g., `[B2] Drizzle schema + game seed`).
- **Commits:** terse one-line subject, optional body for the *why*. Match the existing style in `git log`.
- **Docs in the same PR** as any change that invalidates them. If you can't fix a cross-doc inconsistency in the current PR, add an entry to `docs/documentation-inconsistencies.md`.

## Environment quirks

- `scripts/categorizer/run-tests.ts` calls `dotenv.config({ override: true })` deliberately — sandboxed shells (including Claude Code's Bash tool) pre-define `ANTHROPIC_API_KEY=""`, and default dotenv won't overwrite an already-set var. Don't "simplify" this back to `import "dotenv/config"`; the test will fail under the sandbox.
- `.env` is gitignored; `.env.example` is the template.
