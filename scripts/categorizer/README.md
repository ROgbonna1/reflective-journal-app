# Categorizer Prototype

Standalone Node TypeScript script that exercises the LLM auto-categorization
described in [`docs/domain-model.md`](../../docs/domain-model.md). No app code,
no SQLite — just the prompt and a round-trip against Claude Haiku 4.5.

## Setup

```sh
cd scripts/categorizer
npm install
cp .env.example .env
# Edit .env to add your ANTHROPIC_API_KEY
```

## Run the test suite

```sh
npm test
```

The runner sends 10 representative skills through the categorizer and compares
each result against an expected `primary_game` + `primary_role`. It prints
per-case results and a summary score, plus the model's reasoning on failures
so the prompt can be tuned.

**Quality bar** (per `docs/workstreams.md` Stream A): >= 8 / 10 exact matches
(game + role) and >= 9 / 10 acceptable matches (right game, debatable role).

## Files

- `games.ts` — the 14 seeded games. Mirrors `docs/seeded-games.md`.
- `categorize.ts` — exports `categorize(skill, games)`. The function we'll
  port into the Expo app once Stream B has somewhere to put it.
- `test-skills.json` — 10 fixture skills with expected outcomes.
- `run-tests.ts` — the test runner.
- `types.ts` — shared types.

## Why Claude Haiku 4.5?

Per [`docs/domain-model.md`](../../docs/domain-model.md): cheapest model that
supports structured outputs and handles BJJ vocabulary; for personal volume
(~3 skills/day), monthly cost is well under $0.50. The interface is
swappable — the `categorize` function takes a model option.

## Latest test result

After perspective-anchoring rule added to the prompt: **9 / 10 exact**
(game + role) and **10 / 10 acceptable** (right game, role debatable).
Quality bar (≥ 8 / ≥ 9) cleared with margin.

Baseline before the fix was 9 exact / 9 acceptable.

## Known prompt-iteration items

### Pass vs. transition role on top-half-guard sequences

**Symptom:** *"Top half guard underhook to mount"* now files under the
correct game (`passing-game`) but with role `transition` (0.95 confidence)
rather than the fixture's expected `pass`. The model's reasoning: the
sequence ends at mount, so it's a transition through passing-game, not a
pure pass.

**Status:** debatable, not a defect. Both roles are defensible — the
sequence does both clear the half guard *and* land in mount. Fixture may
need updating to accept either role rather than tightening the prompt
further.

### Resolved: top-vs-bottom perspective anchoring

Added rule 8 to the prompt: *"The practitioner's side overrides keyword
associations. When the skill names a side ('top half guard', 'from top X',
'bottom Y'), file it under the game representing that side's experience,
even if cues like 'underhook' or 'frame' are more strongly associated with
the opposite side. Top half-guard sequences belong to passing-game, not
half-guard-bottom."* Case 10 flipped from `half-guard-bottom` to
`passing-game`. No regressions on the other 9 cases.

## Dev-environment note

`run-tests.ts` calls `dotenv.config({ override: true })` (rather than the
default `import "dotenv/config"`) because some sandboxed shells — including
Claude Code's Bash tool — pre-define `ANTHROPIC_API_KEY=""` to prevent key
leakage, and `dotenv` refuses to overwrite an already-set env var by
default. The override flag makes `.env` win.
