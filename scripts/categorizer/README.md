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

First baseline run: **9 / 10 exact** (game + role) and **9 / 10 acceptable**
(right game, role debatable). Quality bar (≥ 8 / ≥ 9) cleared.

The one miss is a real prompt-iteration signal — captured under
*Known prompt-iteration items* below.

## Known prompt-iteration items

### Top-vs-bottom perspective anchoring

**Symptom:** *"Top half guard underhook to mount"* (a top-player passing
sequence) was filed under `half-guard-bottom / transition` instead of
`passing-game / pass`. The model latched on to the word "underhook" — a
classic bottom-half-guard cue — even though the surrounding description
clearly describes the top player escaping the half guard.

**Hypothesis:** the prompt doesn't tell the model that "from top X" or
"from bottom X" should anchor the categorization to the practitioner's
side, overriding any role-keyword associations.

**Possible prompt addition:** something like *"When the skill names a side
('top half guard', 'bottom mount'), file it under the game representing
that side's experience, even if cues like 'underhook' or 'frame' are more
strongly associated with the opposite side."*

Try, re-run `npm test`, see whether case 10 flips while the other 9 stay
green.

## Dev-environment note

`run-tests.ts` calls `dotenv.config({ override: true })` (rather than the
default `import "dotenv/config"`) because some sandboxed shells — including
Claude Code's Bash tool — pre-define `ANTHROPIC_API_KEY=""` to prevent key
leakage, and `dotenv` refuses to overwrite an already-set env var by
default. The override flag makes `.env` win.
