# Reflective Journal App

A personal mobile app for cataloging Brazilian Jiu-Jitsu training. Two capture
loops, one structured library:

- **Skills** — atomic techniques learned in class. The app uses an LLM to
  auto-categorize each skill into one or more *games* (strategic systems),
  with a role within each game.
- **Reflections** — per-class (or standalone) journal entries that link to
  the skills and games they discuss.
- **Games** — strategic systems (closed guard, lasso guard, half guard, etc.)
  used as the primary browsing axis.

Single user, iPhone, local-first. React Native (Expo) + SQLite + Claude API
for categorization.

## Documentation is the source of truth

Design decisions and domain logic live in [`/docs`](./docs). Read those first
before writing code or proposing changes; update them in the same change when
behavior, schema, or scope shifts.

- [docs/domain-model.md](./docs/domain-model.md) — entities, relationships,
  application flows (with ASCII diagrams), LLM prompt shapes, v1 scope,
  resolved decisions log, open items
- [docs/seeded-games.md](./docs/seeded-games.md) — the 14 pre-seeded BJJ games
  shipped on first launch (each description doubles as LLM grounding text)
- [docs/roadmap.md](./docs/roadmap.md) — phase-by-phase plan from current
  state to MVP, with dependency map and per-phase checklists
- [docs/workstreams.md](./docs/workstreams.md) — parallel work tracks, task
  menu, claim process, and conventions
- [docs/documentation-inconsistencies.md](./docs/documentation-inconsistencies.md)
  — running tracker for cross-doc inconsistencies

## Status

Stream A (LLM categorizer) is done and validated. **Phase 1 (B1 — Expo
scaffold + tab navigation) has landed**: the app boots with Home / Games /
Reflect / Profile tabs as placeholder screens. Next up is Phase 2a (B2 —
data layer). See [docs/roadmap.md](./docs/roadmap.md) for the full
sequence and [docs/workstreams.md](./docs/workstreams.md) for B-task
definitions.

## Run on iPhone (dev)

Install [Expo Go](https://apps.apple.com/app/expo-go/id982107779) on your
phone, make sure your phone and laptop are on the same Wi-Fi, then:

```sh
npm install              # one-time
npm start                # starts the Metro bundler
```

A QR code appears in the terminal. Scan it with the iPhone Camera app —
Expo Go opens and loads the app. Edits hot-reload automatically.

Other useful commands:

```sh
npm run typecheck        # tsc --noEmit
npm run lint             # ESLint via expo lint
npm run format           # Prettier write
npm run format:check     # Prettier check (used in CI later)
```

The categorizer prototype is a separate sub-project — see
[scripts/categorizer/README.md](./scripts/categorizer/README.md) to run it.
