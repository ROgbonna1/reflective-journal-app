# Reflective Journal App — Domain Model & Application Flows

A personal mobile app for cataloging Brazilian Jiu-Jitsu training. Two capture
loops, one structured library:

- **Skills** — atomic techniques learned in class. The app uses an LLM to
  auto-categorize each skill into one or more **games** (strategic systems),
  with a role within each game.
- **Reflections** — per-class freeform journal entries. Ad-hoc cadence.
  Reflections can link to the specific skills and games they discuss.
- **Games** — strategic systems (closed guard game, lasso game, top half guard
  game, etc.) that act as the primary browsing axis. Each game contains skills
  playing different roles (guard / sweep / attack / pass / escape / transition).

Single user, iPhone, local-first.


## Tech direction (working assumptions)

| Concern              | Choice                                          | Rationale |
|----------------------|-------------------------------------------------|-----------|
| App framework        | Expo (managed) + React Native + TypeScript      | Personal app, no App Store; EAS Build avoids Xcode pain |
| Local storage        | SQLite via `expo-sqlite` + Drizzle ORM          | Structured queries (filter by tag, role, date range) |
| LLM categorization   | Claude API (Haiku 4.5) behind an interface      | See "LLM choice" — cheapest & simplest for personal volume, swappable |
| Distribution         | Expo dev client / TestFlight                    | Single device, no store distribution |
| Sync                 | None in v1                                      | Add iCloud or Supabase later if needed |


## Entities

### TrainingSession
A single class or training event. Both skills and reflections attach here.

| Field          | Type      | Notes |
|----------------|-----------|-------|
| id             | uuid      | PK |
| date           | date      | required |
| gym            | string?   | optional |
| instructor     | string?   | optional |
| session_type   | enum      | class / open_mat / private / comp_prep / sparring |
| gi_or_nogi     | enum?     | gi / nogi |
| duration_min   | int?      | optional |
| partners       | string?   | comma-separated freeform for v1 |

### Skill
An atomic technique or move learned in a session.

| Field                    | Type      | Notes |
|--------------------------|-----------|-------|
| id                       | uuid      | PK |
| name                     | string    | e.g. "Knee-cut pass with cross-face" |
| description              | text?     | mechanics, coach's cues, what made it click |
| session_id               | uuid      | FK → TrainingSession |
| pending_categorization   | bool      | true if saved without LLM categorization (offline / API error) |
| created_at               | timestamp ||

### Game
A strategic system. Pre-seeded set ships with the app; user can add custom games.

| Field          | Type      | Notes |
|----------------|-----------|-------|
| id             | uuid      | PK |
| name           | string    | e.g. "Closed guard game" |
| description    | text?     | optional summary |
| is_seeded      | bool      | true for pre-seeded, false for user-created |
| created_at     | timestamp ||

### SkillInGame  (join, with role)
A skill can play different roles in different games.

| Field          | Type      | Notes |
|----------------|-----------|-------|
| skill_id       | uuid      | FK → Skill |
| game_id        | uuid      | FK → Game |
| role           | enum      | guard / sweep / attack / pass / escape / transition / setup / concept |
| notes          | text?     | optional, e.g. "primary sub off this sweep" |
| ai_suggested   | bool      | did the categorization come from the LLM? |
| ai_confidence  | float?    | 0–1, when ai_suggested = true |

PK: `(skill_id, game_id, role)` — same skill *can* play multiple roles in the
same game (rare, but allowed).

### Reflection
Journal entry. Ad-hoc cadence — no scheduled prompts in v1. Usually attached to
a class, but standalone reflections (no session) are allowed for rest-day or
weekly thinking.

| Field          | Type      | Notes |
|----------------|-----------|-------|
| id             | uuid      | PK |
| session_id     | uuid?     | FK → TrainingSession, **nullable** (standalone reflections allowed) |
| body           | text      | required |
| mood           | int?      | 1–5 |
| energy         | int?      | 1–5 |
| intensity      | int?      | 1–5 |
| created_at     | timestamp ||

### ReflectionSkill, ReflectionGame  (join tables)
A reflection can mention multiple skills and games.

| Field            | Type | Notes |
|------------------|------|-------|
| reflection_id    | uuid | FK |
| skill_id / game_id | uuid | FK |


## Relationship diagram

```
                     ┌────────────────────────┐
                     │    TrainingSession     │
                     │  (one class / event)   │
                     └──┬──────────────────┬──┘
                        │                  │
                     1:n│                  │1:n  (session_id nullable;
                        │                  │     standalone reflections OK)
                        ▼                  ▼
              ┌─────────────────┐    ┌─────────────────┐
              │      Skill      │    │   Reflection    │
              │  (atomic move)  │    │  (journal note) │
              └────────┬────────┘    └────────┬────────┘
                       │                      │
                       │                      │
                  n:n  │                  n:n │  n:n
                       │   ┌──────────────────┤
                       │   │                  │
                       │   │                  │
       SkillInGame     │   │ ReflectionSkill  │  ReflectionGame
       ───────────     │   │ ──────────────   │  ──────────────
       skill_id        │   │ reflection_id    │  reflection_id
       game_id         │   │ skill_id         │  game_id
       role            │   │                  │
       notes           │   │                  │
       ai_suggested    │   │                  │
       ai_confidence   │   │                  │
                       │   │                  │
                       ▼   ▼                  ▼
                     ┌─────────────────────────────┐
                     │            Game             │
                     │     (strategic system)      │
                     └─────────────────────────────┘
```

Cardinality cheat-sheet:

| Relationship                          | Cardinality |
|---------------------------------------|-------------|
| TrainingSession → Skill               | 1 : n       |
| TrainingSession → Reflection          | 1 : n  (reflection.session_id nullable) |
| Skill ↔ Game (via SkillInGame)        | n : n       |
| Reflection ↔ Skill (via join)         | n : n       |
| Reflection ↔ Game (via join)          | n : n       |


## Application flows

### Flow 1 — Log a skill (with LLM auto-categorization)

```
   Home
     │
     │  tap "Log a skill"
     ▼
┌────────────────────────────────────────────────────┐
│  Skill Capture                                     │
│  ────────────────────────────────────────────      │
│  Name:         [____________________________]     │
│  Description:  [                            ]     │
│                [                            ]     │
│  Session:      [Today's class @ Gym X       ▾]    │
│                (auto if today exists, else +)     │
│                                                    │
│  [ Categorize with AI ]      [ Skip & save ]      │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼  tap "Categorize with AI"
┌────────────────────────────────────────────────────┐
│  LLM call                                          │
│  ────────────────────────────────────────────      │
│  Input:                                            │
│    • skill name + description                      │
│    • user's existing games (id, name, summary)     │
│    • role taxonomy                                 │
│  Output (structured JSON):                         │
│    [ { game_id, role, confidence, reasoning } ]    │
│    + optional new_game_suggestion                  │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│  Review                                            │
│  ────────────────────────────────────────────      │
│  Suggested:                                        │
│    [✓]  Closed Guard Game · sweep        (0.92)    │
│    [✓]  Half Guard Game   · transition   (0.61)    │
│    [ ]  Lasso Guard Game  · sweep        (0.40)    │
│                                                    │
│  [ + Add another game ]                            │
│  [ + Create new game from suggestion ]             │
│                                                    │
│  [ Cancel ]                       [ Save skill ]   │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
   Persist:  Skill row + SkillInGame rows
             (ai_suggested = true on accepted suggestions,
              false on user-edited or manually-added entries)
```

### Flow 2 — Reflect on a class

```
   Home
     │
     │  tap "Reflect"
     ▼
┌────────────────────────────────────────────────────┐
│  Reflection Capture                                │
│  ────────────────────────────────────────────      │
│  Session:  [Today's class @ Gym X            ▾]    │
│                                                    │
│  How did it go?                                    │
│  [                                            ]    │
│  [                                            ]    │
│  [                                            ]    │
│                                                    │
│  Mood:      [ ○ ○ ● ○ ○ ]                          │
│  Energy:    [ ○ ● ○ ○ ○ ]                          │
│  Intensity: [ ○ ○ ○ ● ○ ]                          │
│                                                    │
│  [ Suggest linked skills/games ]                   │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│  LLM scans body + recent skills/games for that     │
│  session, returns likely mentions                  │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────┐
│  Confirm Links                                     │
│  ────────────────────────────────────────────      │
│  Skills:                                           │
│    [✓]  Knee-cut pass with cross-face              │
│    [✓]  Hip-bump sweep                             │
│    [ ]  Triangle from closed guard                 │
│                                                    │
│  Games:                                            │
│    [✓]  Top half guard game                        │
│    [✓]  Closed guard game                          │
│                                                    │
│  [ + Add manually ]                  [ Save ]      │
└──────────────────────┬─────────────────────────────┘
                       │
                       ▼
   Persist:  Reflection + ReflectionSkill + ReflectionGame
```

### Flow 3 — Browse a game

```
   Games tab
       │
       ▼
┌────────────────────────────────────┐
│  Your Games                        │
│  ────────────────────────────────  │
│  Closed Guard               (12)   │
│  Half Guard (Top)            (8)   │
│  Lasso Guard                 (5)   │
│  De La Riva                  (3)   │
│  Knee Shield Half Guard      (2)   │
│  ...                               │
│  [ + New game ]                    │
└──────────┬─────────────────────────┘
           │  tap "Closed Guard"
           ▼
┌────────────────────────────────────┐
│  Closed Guard Game                 │
│  ────────────────────────────────  │
│  GUARD (2)                         │
│   • Posture & frames               │
│   • Underhook control              │
│                                    │
│  SWEEPS (5)                        │
│   • Hip bump                       │
│   • Scissor                        │
│   • Flower / pendulum              │
│   • Hook (sit-up)                  │
│   • Lumberjack                     │
│                                    │
│  ATTACKS (4)                       │
│   • Triangle                       │
│   • Armbar                         │
│   • Cross-collar choke             │
│   • Omoplata                       │
│                                    │
│  TRANSITIONS (1)                   │
│   • To butterfly                   │
│                                    │
│  REFLECTIONS LINKED (7)            │
│   • Apr 22 — "Triangle setup..."   │
│   • Apr 18 — "Closed guard felt..."│
└────────────────────────────────────┘
```

### Flow 4 — Top-level navigation

```
┌──────────────────────────────────────────────────┐
│                                                  │
│                                                  │
│                Screen content                    │
│                                                  │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│   Home    │   Games    │   Reflect   │  Profile  │
└──────────────────────────────────────────────────┘

Home      → quick capture cards + recent activity feed
Games     → game list → game detail (skills grouped by role)
Reflect   → chronological reflection feed, filterable by session/game
Profile   → settings, game management, export, LLM key
```


## LLM categorization

### Skill categorization — prompt shape

```
System: You categorize Brazilian Jiu-Jitsu techniques into the user's
        existing strategic "games", with a role within each game.

Input:
  Skill: { name, description }
  Existing games: [ { id, name, description } ]
  Role taxonomy: guard | sweep | attack | pass | escape |
                 transition | setup | concept

Output (structured JSON):
  {
    "categorizations": [
      { "game_id", "role", "confidence" (0-1), "reasoning" }
    ],
    "new_game_suggestion": {
      "name", "description", "rationale"
    } | null
  }
```

### Reflection-link suggestion — prompt shape

```
Input:
  Reflection body
  Recent skills (last 30 days) — id + name
  Existing games — id + name

Output (structured JSON):
  {
    "skill_links":  [ { "skill_id", "confidence" } ],
    "game_links":   [ { "game_id",  "confidence" } ]
  }
```

### LLM choice (v1)

You asked about open-source models for cost. For personal volume
(~3 skills/day, ~1 reflection/day):

| Option                     | Approx. monthly cost | Eng effort | Quality |
|----------------------------|----------------------|------------|---------|
| Claude Haiku 4.5 API       | < $0.50              | trivial    | excellent |
| Claude Sonnet 4.6 API      | < $2                 | trivial    | excellent |
| Self-hosted OSS (Modal etc)| $5–$30+ idle         | moderate   | good (Llama/Qwen) |
| On-device CoreML (small)   | $0                   | high       | mixed for nuanced classification |

**Recommendation: Claude Haiku 4.5 in v1**, behind an interface like:

```
interface SkillCategorizer {
  categorize(skill: SkillInput, games: Game[])
    : Promise<CategorizationResult>;
}
```

so swapping to a self-hosted or on-device model later is a one-day change,
not a rewrite. For personal volume the API is genuinely cheaper than
self-hosting, with no ops burden.

### API key handling

- User provides their own Anthropic API key during first-run setup.
- Stored on-device in **Expo SecureStore** (iOS Keychain) — encrypted at rest,
  per-device.
- Replaceable in Settings.
- Key never leaves the device except as the `x-api-key` header on direct calls
  to `api.anthropic.com`. **No backend service.**
- If the key is missing or invalid, the app still works fully — every flow
  that uses the LLM has a manual fallback (see Offline behavior below).

### Offline behavior

Save-first architecture: AI is pure enrichment, it **never blocks a save**.

```
   Skill capture (offline OR API error)
              │
              ▼
   Save Skill to SQLite immediately
              │
              ▼
   Mark skill.pending_categorization = true
              │
              ▼
   On next foreground with network:
     - Show banner: "3 skills pending categorization"
     - User taps → batch-categorize via LLM
     - Or auto-run silently if user opts in
```

- **Skill.pending_categorization** (bool) — added to the schema. True means
  this skill has not yet been processed by the LLM. Cleared once at least one
  SkillInGame row exists (whether AI-suggested or user-added).
- **Reflection link suggestion** is always optional. If offline or API errors,
  the user can save without links and add them later (manually or via
  retry).
- **All reads, browse, search, and editing** work fully offline against
  SQLite. The only thing that needs network is the LLM call.


## v1 scope

**In scope**
- Entities: TrainingSession, Skill, Game, SkillInGame, Reflection, join tables
- Pre-seeded BJJ game taxonomy (~20 common games)
- Skill capture flow with LLM auto-categorization
- Reflection capture flow with LLM-suggested skill/game links
- Game detail browse view (skills grouped by role)
- Reflection feed
- Local SQLite, no sync

**Deferred**
- Notifications / scheduled reflection prompts (nice, not required)
- Cloud sync / multi-device
- Media attachments (photos, voice memos)
- Visual analytics ("gaps", training-frequency heatmap)
- Goal-setting / priority entity
- Skill-progress status (learning → mastered)
- Skill hierarchy / variants


## Resolved decisions log

A short record of decisions made during planning, so future-us can see *why*
the model looks the way it does:

- **`Game` is a first-class entity, not a tag.** User explicitly thinks in
  "games" (closed guard game, lasso game). Drives the SkillInGame join with a
  role.
- **No `Concept` entity in v1.** Concepts cross games, modeling them properly
  requires another entity + two joins + UI surface. The `role=concept` slot on
  SkillInGame catches the rare position-tied principle. Reflections cover
  cross-cutting principle thinking. Revisit once we know how often pure
  principles get logged.
- **Reflections are session-optional.** Standalone reflections (rest day,
  weekly thinking) are allowed.
- **One reflection per session is *not* enforced** — schema allows multiple,
  no UX restriction. Realistic, since you might write a quick post-class note
  and a deeper one later.
- **LLM = Claude Haiku 4.5** behind a swappable `SkillCategorizer` interface.
  Cheaper than self-hosting for personal volume. User-provided key, on-device.
- **No backend service.** Everything is on-device + direct LLM calls.

## Open questions

1. **Pre-seeded games list** — see `docs/seeded-games.md` (drafted separately
   so each game's description can double as LLM grounding text).
2. **Auto-categorize on save vs explicit "Categorize" tap?** Doc currently
   shows explicit tap. Could also auto-fire on save with a quick review
   sheet. Try one, iterate.
3. **Standalone reflections — what does "Suggest links" use as context?** No
   session means no "skills from that session" seed. Likely use last 7-14
   days of skills + all games. Decide when implementing.
