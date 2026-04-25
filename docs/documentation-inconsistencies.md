# Documentation Inconsistencies

This file tracks known inconsistencies between planning docs so they can be
resolved deliberately instead of getting lost during implementation.

## Seeded games count

`docs/domain-model.md` lists the v1 scope as including a "Pre-seeded BJJ game
taxonomy (~20 common games)".

`docs/seeded-games.md` defines the actual v1 starter taxonomy as 14 games:

- Closed Guard
- Half Guard (Bottom)
- Butterfly Guard
- Spider Guard
- Lasso Guard
- De La Riva
- X-Guard
- Deep Half Guard
- Passing Game (Top)
- Mount
- Side Control / Top
- Back Control
- Leg Lock Game
- Standing / Takedowns

## Suggested resolution

Treat `docs/seeded-games.md` as the more specific source of truth for the v1
seed list, and update `docs/domain-model.md` from "~20 common games" to "14
common games" unless the intended v1 scope is expanded.
