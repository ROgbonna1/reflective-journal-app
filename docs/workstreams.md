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

**Touches:** `scripts/categorize.ts`, `scripts/test-skills.json`,
prompt-iteration notes (anywhere under `scripts/` or `docs/`).

**Status:** in design — flow alignment underway.


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
| A    | Reuben         | in design   | —   |
| B1   | _(unclaimed)_  |             |     |
| B2   | _(unclaimed)_  |             |     |
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
