# MVP Roadmap

Sequencing from "categorizer prototype validated" → working MVP on device.
The B-tasks are defined in [`workstreams.md`](./workstreams.md); this doc
orders them and adds the LLM-port and reflection-suggester work that has to
land before we have a real app.

> **▸ Right now:** **Phase 2a — Data layer (B2)** + **Phase 2b — Settings + LLM key (B4)** in parallel


## Status snapshot

```
DONE      │ Domain model + design docs
          │ 14 seeded games
          │ Stream A — categorizer prototype  (9/10 exact, 10/10 acceptable)
          │ Perspective-anchoring prompt rule
          │ Phase 1 — Expo scaffold + tab navigation         (B1)
──────────┼─────────────────────────────────────────────────────────────────
▸ NEXT    │ Phase 2a — Data layer (SQLite + Drizzle)         (B2)
          │ Phase 2b — Settings + LLM key plumbing           (B4) ║ parallel
──────────┼─────────────────────────────────────────────────────────────────
QUEUED    │ Phase 3  — Capture UI shells                     (B3)
          │ Phase 4  — Port categorizer + wire skill capture
          │ Phase 5  — Reflection-link suggester + wire reflect
          │ Phase 6  — Browse polish + MVP cut
──────────┼─────────────────────────────────────────────────────────────────
DEFERRED  │ See `domain-model.md` § v1 scope → "Deferred"
```


## Dependency map

```
       ┌────────────────────────────────────┐
       │  Stream A (DONE)                   │
       │  categorizer module                │
       └──────────────────┬─────────────────┘
                          │ ports into app at Phase 4
                          ▼
   ┌──────────────────────────────────────────┐
   │  Phase 1 — B1  (DONE)                    │
   │  Expo scaffold + tab navigation          │
   └──────────╤═══════════╤═══════════════╤═══┘
              │           │               │
              ▼           ▼               ▼
   ╔══════════════╗ ╔══════════════╗ ┌──────────────┐
   ║ Phase 2a     ║ ║ Phase 2b     ║ │ Phase 3      │
   ║ B2 — DB +    ║ ║ B4 — Settings║ │ B3 — Capture │
   ║ migrations + ║ ║ + SecureStore║ │ UI shells    │
   ║ seed loader  ║ ║ key plumbing ║ │ (mock data)  │
   ╚══════╤═══════╝ ╚══════╤═══════╝ └──────┬───────┘
          ▲ you are here   ▲ also here      │
          │                │                │
          └────────┬───────┴────────────────┘
                   ▼
       ┌──────────────────────────────────┐
       │ Phase 4                          │
       │ Port categorize() into app       │
       │ Wire skill capture end-to-end    │
       └──────────────────┬───────────────┘
                          ▼
       ┌──────────────────────────────────┐
       │ Phase 5                          │
       │ Reflection-link suggester        │
       │ Wire reflection capture          │
       └──────────────────┬───────────────┘
                          ▼
       ┌──────────────────────────────────┐
       │ Phase 6                          │
       │ Browse polish + MVP cut          │
       └──────────────────┬───────────────┘
                          ▼
                    ╔═══════════╗
                    ║    MVP    ║
                    ╚═══════════╝
```


## Phase checklists

Each phase has a **definition of done (DoD)** at the bottom. Don't move on
until the previous phase is usable in isolation.

### Phase 1 — Expo scaffold + tab navigation  (B1)  ✓ DONE

- [x] `package.json`, `tsconfig.json`, `app.json` at repo root (Expo SDK 54)
- [x] Expo Router bottom tabs: **Home / Games / Reflect / Profile**
- [x] Stack navigator inside Games / Reflect / Profile (Home is single-screen for now)
- [x] Theming primitive (light + dark via `useColorScheme` + `Colors`)
- [x] ESLint + Prettier configured; `typecheck`, `lint`, `format:check` all green
- [x] `.nvmrc` pinning Node 20.19.4 (Expo SDK 54 requirement)
- [x] README section on running locally (Expo Go)
- [x] App boots on iPhone via Expo Go; all four tabs switch and render

**DoD met:** app launches on the phone and the tab bar works.

### Phase 2a — Data layer  (B2)

- [x] Drizzle schema for: `TrainingSession`, `Skill`, `Game`, `SkillInGame`, `Reflection`, `ReflectionSkill`, `ReflectionGame`. Game grew `slug` and `typical_roles` columns vs. the original doc — both surfaced as needed by the categorizer; `domain-model.md` § Game updated in the same change.
- [x] Drizzle-kit configured for migrations; `npm run db:generate` regenerates SQL from the schema
- [x] `seeds/games.json` mirrors `docs/seeded-games.md` (slug, name, description, typicalRoles)
- [x] Idempotent first-run seed loader (`db/seed.ts`) — uses `INSERT OR IGNORE` keyed on the unique `slug` column
- [x] Repository functions per entity: create + reads (no update/delete yet — added when a screen needs them, per CLAUDE.md "no abstractions beyond what the task requires")
- [x] Query helpers: `getGameWithSkills(gameId)` lives in `db/queries.ts`; `listSkillsBySession(sessionId)` lives in `db/repos/skills.ts` as `listBySession`
- [x] In-memory test infrastructure (better-sqlite3 + Vitest) — 24 passing tests across all repos + queries + seed
- [x] Migrations run on app boot via `useDbReady()` hook; native splash stays visible until ready
- [ ] Verified end-to-end on device: fresh install boots, seeds 14 games

**DoD:** fresh install creates the DB, seeds the 14 games, repos can read them.

### Phase 2b — Settings + LLM key plumbing  (B4)  ║ parallel with 2a

- [ ] Settings screen: masked key input, save / clear / replace
- [ ] Expo SecureStore wrapper (read / write / delete)
- [ ] "Test connection" button that hits Anthropic with a no-op and reports pass/fail
- [ ] "No key set" state surfaced gracefully across the app

**DoD:** paste your Anthropic key into Settings, tap "Test connection," get a green check.

### Phase 3 — Capture UI shells  (B3)  ║ parallel with 2a/2b once Phase 1 lands

- [ ] Skill capture screen (form fields + "Save & categorize")
- [ ] Reflection capture screen (body + mood / energy / intensity sliders)
- [ ] Game list (mock games) and Game detail (mock skills grouped by role)
- [ ] Reflection feed screen
- [ ] Empty / loading / error states sketched
- [ ] Component tests for non-trivial render logic

**DoD:** every screen is reachable with mock data; nothing wired to the DB yet.

### Phase 4 — Port categorizer + wire skill capture

- [ ] Move `categorize()` into `app/lib/categorizer/` (preserve the interface; swap dotenv → SecureStore for the key)
- [ ] Read the user's existing games from the DB instead of hardcoded `SEEDED_GAMES`
- [ ] Skill capture: form → save Skill row → call `categorize()` → review sheet → persist accepted `SkillInGame` rows
- [ ] Offline path: save with `pending_categorization = true`; banner on next foreground
- [ ] Manual categorization fallback when API key missing or call fails

**DoD:** logging a real skill from class produces correctly categorized `SkillInGame` rows.

### Phase 5 — Reflection-link suggester + wire reflection capture

- [ ] Build the second prompt (skill_links + game_links) per `domain-model.md`
- [ ] Reflection capture: form → save Reflection → call suggester → confirm-links sheet → persist `ReflectionSkill` / `ReflectionGame`
- [ ] Decide standalone-reflection context (last 7–14 days of skills + all games?) — open question #2 in `domain-model.md`, resolve here

**DoD:** writing a reflection produces correct links to the skills and games it mentions.

### Phase 6 — Browse polish + MVP cut

- [ ] Game detail renders skills grouped by role from the DB
- [ ] Reflection feed renders chronologically, filterable by session/game
- [ ] Empty / loading / error states pass a quick QA pass on every flow
- [ ] You can use the app for a real training week without escape hatches

**DoD:** you've used it on your own phone for one full BJJ week without falling back to notes apps.


## Keeping this doc accurate

- Tick the boxes in the same PR that lands the work.
- Update the **Status snapshot** at the top when a phase moves.
- If you discover a missed task, add it to the phase rather than starting a new doc.
- If a task is dropped on purpose, move it to `domain-model.md` § v1 scope → "Deferred" with a one-line reason — the audit trail matters more than a clean checklist.
