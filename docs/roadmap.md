# MVP Roadmap

Sequencing from "data layer in place" → working MVP on device.

> **Build order: vertical-slice first.** The original plan was to land all
> infrastructure (Settings + key plumbing, mock UI shells) before any
> end-to-end feature. We changed direction after Phase 2 in favor of
> shipping a real, usable feature first — Reflection capture + feed, no
> LLM — to validate the full stack on the simplest flow before the
> LLM-coupled work lands. The save-first invariant in `domain-model.md`
> § Offline behavior is the design hook that makes this possible: LLM
> features are pure enrichment, never blockers on persistence.
>
> **▸ Right now:** **Phase 3 — Reflection capture + feed (no LLM)**


## Status snapshot

```
DONE      │ Domain model + design docs
          │ 14 seeded games
          │ Stream A — categorizer prototype  (9/10 exact, 10/10 acceptable)
          │ Perspective-anchoring prompt rule
          │ Phase 1 — Expo scaffold + tab navigation         (B1)
          │ Phase 2 — Data layer (SQLite + Drizzle + 24 tests) (B2)
──────────┼─────────────────────────────────────────────────────────────────
▸ NEXT    │ Phase 3 — Reflection capture + feed (no LLM, vertical slice)
──────────┼─────────────────────────────────────────────────────────────────
QUEUED    │ Phase 4 — Settings + LLM key plumbing            (B4)
          │ Phase 5 — Skill capture + Game browse (manual categorization)
          │ Phase 6 — LLM enrichment (auto-categorizer + reflection-link suggester)
          │ Phase 7 — MVP cut + polish
──────────┼─────────────────────────────────────────────────────────────────
DEFERRED  │ See `domain-model.md` § v1 scope → "Deferred"
```


## Dependency map

```
       ┌──────────────────────────────────────┐
       │  Phase 1 ✓  Expo scaffold (B1)       │
       └────────────────┬─────────────────────┘
                        ▼
       ┌──────────────────────────────────────┐
       │  Phase 2 ✓  Data layer (B2)          │
       │  schema · migrations · seeds · repos │
       └────────────────┬─────────────────────┘
                        ▼
       ╔══════════════════════════════════════╗
       ║  Phase 3 — Reflection capture + feed ║   ◄── you are here
       ║  no LLM, full vertical slice         ║
       ╚════════════════╤═════════════════════╝
                        ▼
       ┌──────────────────────────────────────┐
       │  Phase 4 — B4  Settings + LLM key    │
       └────────────────┬─────────────────────┘
                        ▼
       ┌──────────────────────────────────────┐
       │  Phase 5 — Skill capture +           │
       │  Game browse (manual categorization) │
       └────────────────┬─────────────────────┘
                        │
                        │ ports categorizer module
                        ▼
       ┌──────────────────────────────────────┐
       │  Phase 6 — LLM enrichment            │
       │  auto-categorizer + link suggester   │
       └────────────────┬─────────────────────┘
                        ▼
       ┌──────────────────────────────────────┐
       │  Phase 7 — MVP cut + polish          │
       └────────────────┬─────────────────────┘
                        ▼
                  ╔═══════════╗
                  ║    MVP    ║
                  ╚═══════════╝
```

> The B-task labels in `workstreams.md` (B1–B4) were defined for an
> original parallel-contributor plan. With a single contributor, the
> roadmap above is the authoritative build order; B# numbers are now
> just task references, not a sequence.


## Phase checklists

Each phase has a **definition of done (DoD)** at the bottom. Don't move on
until the previous phase is shippable in isolation.

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

### Phase 2 — Data layer  (B2)  ✓ DONE

- [x] Drizzle schema for: `TrainingSession`, `Skill`, `Game`, `SkillInGame`, `Reflection`, `ReflectionSkill`, `ReflectionGame`. Game grew `slug` and `typical_roles` columns vs. the original doc — both surfaced as needed by the categorizer; `domain-model.md` § Game updated in the same change.
- [x] Drizzle-kit configured for migrations; `npm run db:generate` regenerates SQL from the schema
- [x] `seeds/games.json` mirrors `docs/seeded-games.md` (slug, name, description, typicalRoles)
- [x] Idempotent first-run seed loader (`db/seed.ts`) — uses `INSERT OR IGNORE` keyed on the unique `slug` column
- [x] Repository functions per entity: create + reads (no update/delete yet — added when a screen needs them, per CLAUDE.md "no abstractions beyond what the task requires")
- [x] Query helpers: `getGameWithSkills(gameId)` lives in `db/queries.ts`; `listSkillsBySession(sessionId)` lives in `db/repos/skills.ts` as `listBySession`
- [x] In-memory test infrastructure (better-sqlite3 + Vitest) — 24 passing tests across all repos + queries + seed
- [x] Migrations run on app boot via `useDbReady()` hook; native splash stays visible until ready
- [x] Verified end-to-end on device: fresh install boots, `[db] ready — 14 games seeded` confirmed in Metro logs

**DoD met:** fresh install creates the DB, seeds the 14 games, repos can read them.

### Phase 3 — Reflection capture + feed  (no LLM)

The first user-visible feature. Scoped tightly: **standalone reflections only**, no session attachment, no skill/game links. That keeps the slice narrow and avoids needing the session-creation UI before Phase 5 needs it anyway.

- [x] Reflection capture screen — body textarea, mood / energy / intensity rating rows (1–5 dots)
- [x] Save button → `reflections.create(db, { id, body, mood, energy, intensity })`; navigates back via `router.back()`
- [x] Capture screen presents as an iOS modal (Stack.Screen `presentation: 'modal'`)
- [x] Reflection feed (replaces placeholder at `app/(tabs)/reflect/index.tsx`) — list newest-first using `reflections.listRecent(db)`
- [x] Each feed row: body preview (3-line clamp), `M / E / I` rating summary, relative timestamp ("2d ago")
- [x] Empty state ("No reflections yet — tap + to write your first") with primary CTA button
- [x] Loading state — render null while initial fetch resolves (DB read is sub-50ms; flash-of-spinner avoided deliberately)
- [x] "+" entry point in the header on the feed; refetch on focus via `useFocusEffect` so saves are immediately visible
- [x] Removed the temporary `[db] ready` log in `hooks/use-db-ready.ts` — reflection feed reading the DB is now the running proof the layer works
- [ ] **Visual polish pass.** Functionality verified on device 2026-04-25; user flagged "UI is off." Specifics in `dev-log.md` § Pick up here. First task on resume.
- [ ] Verified end-to-end on device (gated on the polish pass)
- [ ] ~~Light component test for the capture form~~ — deferred. RN component tests would need a `jest-expo` setup; not in scope for this slice. Tracked here so it isn't lost.

**DoD:** you can write a reflection on your phone and it persists across app restarts. The reflection appears in the feed sorted by date.

### Phase 4 — Settings + LLM key plumbing  (B4)

Lives behind a Settings sub-screen under the Profile tab (per the architecture call we made before kicking it off).

- [ ] Settings screen at `app/(tabs)/profile/settings.tsx` — masked key input, save / clear / replace
- [ ] Expo SecureStore wrapper at `app/lib/secure-storage.ts` (read / write / delete)
- [ ] `useAnthropicKey()` hook returning `string | null`, used by Phase 6's call sites
- [ ] "Test connection" button — fires a 1-token Haiku call (~$0.0001) and reports green check / red x
- [ ] "No key set" state surfaced gracefully (banner or settings hint, depending on context)

**DoD:** paste your Anthropic key into Settings, tap "Test connection," get a green check.

### Phase 5 — Skill capture + Game browse  (DB-wired, manual categorization)

Wires Skills + Games to real DB data. LLM still not in the picture — categorization is manual until Phase 6.

- [ ] Session create flow — minimal form (date, gym, sessionType, gi/nogi); `sessions.create(db, ...)`. Reused by Skill capture and (later) by Reflection-with-session.
- [ ] Skill capture screen — form (name, description, session picker), Save with `pendingCategorization: true`
- [ ] Manual "add to game" UI — after saving a skill, pick game(s) + role(s) and persist via `skillInGames.createMany`
- [ ] Game list (replaces placeholder at `app/(tabs)/games/index.tsx`) — list 14 seeded games + any user-created
- [ ] Game detail at `app/(tabs)/games/[gameId].tsx` — uses `getGameWithSkills`, renders skills grouped by role
- [ ] Skill detail screen (read-only) — shows description, session, filed games

**DoD:** you can log a skill, manually file it under one or more games with roles, and browse the game's filed skills grouped by role.

### Phase 6 — LLM enrichment  (auto-categorizer + reflection-link suggester)

Layers AI on top of the working DB-wired flows from Phases 3 and 5. Both LLM features are pure enrichment — never blocks a save.

- [ ] Port `scripts/categorizer/` → `app/lib/categorizer/` (preserve the `SkillCategorizer` interface; swap dotenv → SecureStore for the key, expo-crypto for IDs)
- [ ] Read existing games from the DB at categorize time, not from `SEEDED_GAMES`
- [ ] Skill capture: form → save Skill (still with `pending_categorization: true`) → call `categorize()` → review sheet → user accepts → `skillInGames.createMany` → flip `pending_categorization` to false
- [ ] "Categorize now" button on any skill with `pending_categorization = true` (manual retry, used when offline at save time)
- [ ] Build the reflection-link suggester per `domain-model.md` (skill_links + game_links)
- [ ] Reflection capture (when re-extending Phase 3 to support links): post-save → call suggester → confirm-links sheet → `reflectionSkills` / `reflectionGames`
- [ ] Decide standalone-reflection context (last 7–14 days of skills + all games?) — open question #2 in `domain-model.md`
- [ ] Reflection capture also gains the session picker here (so a reflection can attach to a session)

**DoD:** logging a skill auto-fills its game(s) with the right role(s); writing a reflection auto-suggests linked skills/games.

### Phase 7 — MVP cut + polish

- [ ] All empty / loading / error states pass a quick QA pass on every flow
- [ ] Reflection feed gains filtering by session/game (small extension of Phase 3)
- [ ] You can use the app for a real training week without falling back to notes apps

**DoD:** you've used it on your own phone for one full BJJ week without escape hatches.


## Keeping this doc accurate

- Tick the boxes in the same PR that lands the work.
- Update the **Status snapshot** at the top when a phase moves.
- If you discover a missed task, add it to the phase rather than starting a new doc.
- If a task is dropped on purpose, move it to `domain-model.md` § v1 scope → "Deferred" with a one-line reason — the audit trail matters more than a clean checklist.
