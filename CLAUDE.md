# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This is a **docs-led** project. Three layers of code exist:

1. **Categorizer prototype** under `scripts/categorizer/` — standalone Node TS sub-project, validated against the quality bar (9/10 exact, 10/10 acceptable). Will be ported into the Expo app at Phase 6 of the roadmap; until then it's the canonical reference for the prompt and grounding data.
2. **Expo app at the repo root** — `app/`, `components/`, `hooks/`, `constants/`, scaffold from `create-expo-app` (SDK 54). Bottom tabs: Home / Games / Reflect / Profile. Most tab content is placeholder text waiting for Phase 3+ to wire real screens.
3. **On-device data layer** under `db/` — Drizzle schema + migrations + seed loader + repos. Boots cleanly on device with all 14 games seeded.

`/docs` is the single source of truth for design, schema, scope, and **build sequence**. Read the relevant doc before writing code or proposing changes, and update the doc in the same change when behavior, schema, or scope shifts. The README states this rule and `feedback_docs_source_of_truth` reinforces it.

Key docs:
- `docs/roadmap.md` — phase-by-phase build plan with status snapshot, dependency map, and per-phase checklists. **Authoritative build order** (the B# task numbers in workstreams.md are now just task references, not a sequence).
- `docs/dev-log.md` — chronological audit trail of meaningful work and decisions. Each session ends with a "Pick up here" section. Read this when resuming after a break to see what was in flight and what's known to be broken.
- `docs/domain-model.md` — entities, ASCII flow diagrams, LLM prompt shapes, v1 scope, **Resolved decisions log** (read this before changing anything that smells like a previously-settled design question)
- `docs/seeded-games.md` — the 14 pre-seeded BJJ games; descriptions double as LLM grounding text
- `docs/workstreams.md` — original Stream A / Stream B split and B-task definitions; useful as task references but build order lives in roadmap.md
- `docs/documentation-inconsistencies.md` — log inconsistencies you spot but can't fix in your current change

## Commands

Run from the **repo root** for app-level work:

```sh
npm start                      # Metro bundler + Expo Go QR
npm run typecheck              # tsc --noEmit
npm run lint                   # expo lint (eslint-config-expo flat)
npm run format                 # prettier --write
npm run format:check           # prettier --check
npm test                       # vitest run (db/repos + queries + seed)
npm run db:generate            # drizzle-kit generate + scripts/build-migrations.mjs
```

The categorizer prototype is its own sub-project; run from `scripts/categorizer/`:

```sh
npm install                    # one-time
cp .env.example .env           # then fill in ANTHROPIC_API_KEY
npm test                       # runs run-tests.ts via tsx against test-skills.json
```

The categorizer's `npm test` exits non-zero unless the run hits the quality bar (`>= 8/10` exact game+role AND `>= 9/10` acceptable game). To test a single skill, edit `test-skills.json`.

## Architecture — the parts that span files

### Build sequence is vertical-slice-first

After Phase 2 (data layer), we shipped Reflection capture + feed end-to-end before any LLM-coupled work. The save-first invariant on `Skill.pending_categorization` is what makes this safe — the LLM is enrichment, never a precondition for persistence. See `docs/roadmap.md` for the authoritative phase order.

The **B-task labels in `workstreams.md` (B1–B4)** were defined for an original parallel-contributor plan; the actual single-contributor build order lives in `roadmap.md`. Don't sequence work by B# numbering.

### Categorizer prototype (`scripts/categorizer/`)

Self-contained Node TS sub-project with its own `package.json` so it doesn't conflict with the future Expo scaffold at the repo root. ESM (`"type": "module"` → `.js` import specifiers in TS source). Run via `tsx`, no build step.

Pipeline: `run-tests.ts` loads fixtures → calls `categorize(skill, SEEDED_GAMES)` → compares top suggestion to expected `primary_game`/`primary_role`. The function in `categorize.ts` builds a system prompt (instructions + games payload, with `cache_control: ephemeral` on the system block) and sends it to Claude with `output_config.format = json_schema`. The schema is defined inline in `categorize.ts` and the matching TS types are in `types.ts` — keep these two in sync.

`SkillCategorizer` is intentionally an **interface boundary**. The function takes `model`, `apiKey`, and `client` options so the implementation is swappable (per `docs/domain-model.md` "LLM choice"). When porting into the app, preserve this shape rather than inlining Anthropic calls into screens.

### Tight coupling: seeded games ↔ categorizer prompt

Three files mirror the same 14-game taxonomy and **must move together**:

1. `docs/seeded-games.md` — the human-readable canon
2. `seeds/games.json` — what the app's seed loader consumes on first boot
3. `scripts/categorizer/games.ts` — what the standalone categorizer prototype consumes

Each game's `description` is fed to the LLM as grounding text — editing a description **changes categorization behavior**. When the categorizer ports into the app at Phase 6, `scripts/categorizer/games.ts` retires and `seeds/games.json` becomes the runtime source. Until then, all three are mirrors.

### Save-first / AI-as-enrichment

The schema has `Skill.pending_categorization: bool` because the LLM call must **never block a save**. Offline or API errors save the skill immediately and queue it. Reflection link suggestions are similarly optional. Don't introduce code paths that gate persistence on a successful LLM round-trip.

### Anchor decisions before re-litigating

Several design questions are resolved in `docs/domain-model.md` → "Resolved decisions log" (Game is an entity not a tag; no `Concept` entity in v1; reflections are session-optional; no backend service in v1; etc.). If a change seems to push against one of these, surface it as a deliberate revision to the doc, not a silent code-level departure.

## Conventions

- **Branches:** `<task-id>/<short-slug>` (e.g., `b1/expo-scaffold`, `p3/reflection-capture`). For phases that don't map to a B-task, use `pN/...` matching the roadmap phase number.
- **PR titles & commit subjects:** prefix with the task or phase ID in brackets (e.g., `[B2] Drizzle schema + game seed`, `[P3] Reflection capture screen`). Both `[Bn]` and `[Pn]` are fine.
- **Commits:** terse one-line subject, optional body for the *why*. Match the existing style in `git log`.
- **Docs in the same PR** as any change that invalidates them. If you can't fix a cross-doc inconsistency in the current PR, add an entry to `docs/documentation-inconsistencies.md`.

## Environment quirks

- `scripts/categorizer/run-tests.ts` calls `dotenv.config({ override: true })` deliberately — sandboxed shells (including Claude Code's Bash tool) pre-define `ANTHROPIC_API_KEY=""`, and default dotenv won't overwrite an already-set var. Don't "simplify" this back to `import "dotenv/config"`; the test will fail under the sandbox.
- `.env` is gitignored; `.env.example` is the template.
- **Drizzle Expo migrations are bundled via a build script, not babel-plugin-inline-import.** `scripts/build-migrations.mjs` reads `db/migrations/*.sql` and writes `db/migrations/index.ts` with the SQL inlined as plain string literals under the `m{idx}`-padded key Drizzle's expo-sqlite migrator expects. babel-plugin-inline-import didn't run reliably under SDK 54's Metro pipeline; this avoids the question. `npm run db:generate` chains drizzle-kit + this script. The generated index is auto-updated; don't edit it by hand.
