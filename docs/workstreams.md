# Workstreams

Two parallel tracks so both contributors can move without stepping on each
other. **Stream A** is in flight (LLM categorizer). **Stream B** is a menu of
independent tasks the colleague can claim in any order.

## Conflict avoidance — file boundaries

| Stream    | Touches                                                          |
|-----------|------------------------------------------------------------------|
| Stream A  | `scripts/` (standalone Node TS), `docs/` for prompt iteration    |
| Stream B  | project root (`package.json`, `tsconfig`, `app.json`), `app/`, `db/`, `seeds/` |

The two streams' files don't overlap. If something genuinely needs both
(e.g., porting the categorizer into the Expo app), pause and sync — decide
who lands first.


## Stream A — LLM Categorizer  (owner: Reuben)

**Goal:** prove auto-categorization actually meets the quality bar before
wiring it into the app.

**Scope:**
- Design prompt + structured output schema
- Standalone script: `scripts/categorize.ts` (Node TS, no app code)
- Test set: ~10 representative skills covering bottom guards, top game,
  passing, mount, leg locks, gi-only and no-gi
- Iterate prompt until top suggestion is correct on ≥ 8/10 skills (game +
  role) and acceptable on ≥ 9/10
- Final deliverable: a clean `categorize()` function ready to port into the
  Expo app once Stream B has somewhere to put it

**Touches:** `scripts/categorizer/` (self-contained Node TS sub-project with
its own `package.json` so it doesn't conflict with B1's Expo scaffold at the
project root).

**Status:** quality bar cleared with margin — **9 / 10 exact**, **10 / 10
acceptable** against `claude-haiku-4-5` after adding a perspective-anchoring
rule to the prompt (top-vs-bottom phrasing now anchors to the practitioner's
side, fixing the one miss from the baseline run). Multi-game suggestions
working as designed (e.g. SLX-from-butterfly correctly fanned out into both
`butterfly-guard` and `x-guard`). The remaining gap is a debatable role
call (`pass` vs `transition` on a top-half-to-mount skill), tracked in
`scripts/categorizer/README.md`. Module is ready to port into the Expo app
once B1 lands.


## Stream B — App Foundation  (for Quantamentals to pick from)

Tasks ordered roughly by dependency. **B1 is the recommended starting
point** — everything else benefits from it.

### B1. Expo project scaffold + navigation   [recommended first]

**Goal:** a runnable Expo TS app on device, with the four tabs from
`docs/domain-model.md` wired to placeholder screens.

**Deliverables:**
- `package.json`, `tsconfig.json`, `app.json` (Expo current SDK)
- Bottom-tab navigator: **Home / Games / Reflect / Profile**
- Stack navigators inside each tab (empty placeholders are fine)
- Theming primitive (light + dark)
- ESLint + Prettier configured
- README section on running locally (Expo Go or dev client)
- One screenshot of the running app in the PR description

**Touches:** project root, `app/`. No DB, no LLM, no real screens yet.

### B2. Data layer — SQLite + Drizzle ORM

**Depends on:** B1 (or shipped together if kept tight).

**Goal:** schema matching `docs/domain-model.md` exactly; working
migrations; the 14 seeded games loaded on first run.

**Deliverables:**
- Drizzle schema for: `TrainingSession`, `Skill`, `Game`, `SkillInGame`,
  `Reflection`, `ReflectionSkill`, `ReflectionGame` — fields, types,
  nullability per the doc
- Drizzle-kit configured for migrations
- `seeds/games.json` derived from `docs/seeded-games.md` (slug, name,
  description, typical_roles, `is_seeded: true`)
- Idempotent first-run seed loader (won't duplicate on re-run)
- Repository module per entity with CRUD + a couple of queries the UI
  will need:
  - `getGameWithSkills(gameId)` → skills grouped by role
  - `listSkillsBySession(sessionId)`
- Unit tests for repos against an in-memory DB

**Touches:** `db/`, `seeds/`, plus a small wiring change in `app/` to run
the migration on boot.

### B3. Quick-capture UI shells (no business logic yet)

**Depends on:** B1.

**Goal:** the screens from the flows in `docs/domain-model.md`, rendered
with mock data. Real persistence comes later.

**Deliverables:**
- Skill capture screen — form fields + "Save & categorize" button (wired
  to a no-op for now)
- Reflection capture screen — body + mood / energy / intensity sliders
- Game list (mock games) and Game detail (mock skills grouped by role)
- Reflection feed screen
- Empty / loading / error states sketched
- Component tests for any non-trivial render logic

**Touches:** `app/screens/`, `app/components/`.

### B4. Settings + LLM API key plumbing

**Depends on:** B1.

**Goal:** Settings screen with the LLM API key field, stored securely,
testable.

**Deliverables:**
- Settings screen: key input (masked), save / clear / replace
- Wrapper around Expo SecureStore for read / write / delete
- "Test connection" button that hits Anthropic with a noop and reports
  pass/fail (can be stubbed until Stream A's `categorize` lands)
- "No key set" state surfaced gracefully across the app

**Touches:** `app/screens/Settings/`, `app/lib/secure-storage.ts`.


## Considerations for project lead (architecture/backend)

Before implementation of B2/B4 is finalized, align on these architecture
questions to avoid rework:

1. **No-backend vs thin backend now:** Do we keep v1 as pure on-device
   (`SQLite` + direct Anthropic calls), or stand up a minimal backend now for
   key proxying, request observability, and future sync readiness?
2. **If backend exists, what framework/runtime:** Should we standardize on
   `Node + Fastify`, `Node + NestJS`, or `Cloudflare Workers`/serverless for a
   thin API layer?
3. **LLM call path ownership:** Should categorization stay client-side only, or
   should we route it through a backend boundary for retries, rate limiting,
   and prompt/version control?
4. **Data model portability:** Should repository contracts in B2 be designed as
   local-first adapters that can map directly to a future server API without
   changing screen-level call sites?
5. **ID and timestamp standards:** Do we lock UUID generation and timestamp
   format now (ISO UTC everywhere) to prevent migration friction if sync is
   added later?
6. **Migration authority:** In a future sync scenario, does SQLite migration
   remain app-driven only, or should backend schema/versioning become the
   authority with compatibility checks on startup?
7. **Seeded taxonomy ownership:** Are seeded games treated as app-bundled
   constants only, or should we support backend-delivered taxonomy updates in
   the future (versioned seed packs)?
8. **Testing boundary:** For B2, are in-memory repository tests sufficient for
   now, or do we require contract tests that emulate a future backend DTO/API
   shape?
9. **Security posture for API keys:** Is storing user-provided keys only in
   SecureStore the long-term plan, or should backend-issued scoped tokens be a
   near-term requirement?


## How to claim a task

1. Pick a task above.
2. Open a **draft PR** on day one with the title prefixed by the task ID:
   `[B1] Expo scaffold + tab navigation`. The draft PR doubles as a claim.
3. Add a one-paragraph description of your approach.
4. Update the **Status** table below so the other contributor sees the
   claim. Push the doc update in the same draft PR.


## Status

| Task | Owner          | Status      | PR  |
|------|----------------|-------------|-----|
| A    | Reuben         | done — quality bar cleared (9/10 exact, 10/10 acceptable after perspective fix); ready to port | — |
| B1   | Reuben         | done — Expo SDK 54 + Expo Router scaffold landed; tabs verified on device | — |
| B2   | Reuben         | done — schema + migrations + seeds + repos + 24 passing vitest tests; DoD pending device verify | — |
| B3   | _(unclaimed)_  |             |     |
| B4   | _(unclaimed)_  |             |     |


## Conventions

- **Branch names:** `<task-id>/<short-slug>`, e.g. `b1/expo-scaffold`.
- **PR titles:** start with the task ID in brackets, e.g. `[B2] Drizzle
  schema + game seed`.
- **Commits:** follow the repo's existing terse style; one-line subject,
  optional body explaining the why. Co-author trailers are encouraged when
  pairing.
- **Docs:** if your change invalidates anything in `docs/`, update the doc
  in the same PR. `/docs` is the single source of truth.
- **Inconsistencies between docs:** add an entry to
  `docs/documentation-inconsistencies.md` if you spot one but can't fix it
  in your current PR.
