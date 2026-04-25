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
- [docs/workstreams.md](./docs/workstreams.md) — parallel work tracks, task
  menu, claim process, and conventions
- [docs/documentation-inconsistencies.md](./docs/documentation-inconsistencies.md)
  — running tracker for cross-doc inconsistencies

## Status

Implementation kicked off with parallel workstreams. See
[docs/workstreams.md](./docs/workstreams.md) for active tasks and what's
available to claim.
