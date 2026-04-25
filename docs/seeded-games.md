# Pre-seeded Games (v1 starter taxonomy)

The 14 games shipped with the app on first launch. Each game has a `slug`
(stable identifier), a display `name`, a `description`, and the set of
`typical_roles` that the LLM should consider when categorizing skills into it.

**Two purposes for this doc:**

1. Human reference for what each game is and what it covers.
2. The `description` field is loaded directly into the LLM categorization
   prompt as grounding for each existing game. Wording matters — keep
   descriptions concrete and disambiguating.

Pre-seeded games are stored with `is_seeded = true`. Users can add new games
(`is_seeded = false`) at any time, including via "Suggest a new game" during
skill capture.

## Role taxonomy reference

Used by `SkillInGame.role`:

| Role        | Meaning |
|-------------|---------|
| guard       | Holding/retaining the position itself (also used loosely for top-position retention — see open items below) |
| sweep       | Bottom-to-top reversal |
| attack      | Submission or finishing sequence |
| pass        | Getting through opponent's guard |
| escape      | Getting out of a bad position |
| transition  | Bridging move between positions |
| setup       | Grip fight, angle, off-balance, prep work |
| concept     | A principle/cue tied to this position (frames, posture, weight, etc.) |


## The 14 games

### 1. Closed Guard
- **slug:** `closed-guard`
- **description:** Bottom guard with both legs locked behind the opponent's back. The guarder controls posture, off-balance, and grips while attacking with sweeps and submissions. Top-player skills (posturing, opening the guard, escaping) belong under Passing Game (Top).
- **typical_roles:** guard, sweep, attack, transition, setup, concept

### 2. Half Guard (Bottom)
- **slug:** `half-guard-bottom`
- **description:** Bottom position with one of opponent's legs trapped between yours. Knee shield, dogfight, underhook game, deep-half entries from below. Top-half-guard skills file under Passing Game (Top); going under to deep half files under Deep Half Guard.
- **typical_roles:** guard, sweep, attack, transition, escape, setup, concept

### 3. Butterfly Guard
- **slug:** `butterfly-guard`
- **description:** Seated open guard with both feet hooked under opponent's thighs. Uses arm-drag, underhooks, and elevation for sweeps and transitions to X-guard or single-leg-X.
- **typical_roles:** guard, sweep, attack, transition, setup, concept

### 4. Spider Guard
- **slug:** `spider-guard`
- **description:** Open guard controlling both sleeves with feet pressing into opponent's biceps. Common transitions to lasso, triangle, omoplata. Distinct from Lasso Guard — foot stays *on* the bicep, not threaded through the arm.
- **typical_roles:** guard, sweep, attack, transition, setup, concept

### 5. Lasso Guard
- **slug:** `lasso-guard`
- **description:** One leg threaded inside-to-outside through the opponent's arm, with sleeve grip on the lasso side. Strong control. Sweeps, back takes, omoplata transitions. Often combined with a spider grip on the other side.
- **typical_roles:** guard, sweep, attack, transition, setup, concept

### 6. De La Riva
- **slug:** `de-la-riva`
- **description:** Open guard with an outside hook on opponent's far leg, typically with a sleeve or collar grip. Classic platform for sweeps, back takes, and modern leg-lock entries. Reverse DLR variants file here unless explicitly leg-lock-focused, in which case Leg Lock Game also applies.
- **typical_roles:** guard, sweep, attack, transition, setup, concept

### 7. X-Guard
- **slug:** `x-guard`
- **description:** Underneath open guard with both legs controlling one of opponent's legs in an X. Specialized for standing the opponent up and sweeping. Includes single-leg-X (SLX) entries; SLX skills can also fit Leg Lock Game depending on intent.
- **typical_roles:** guard, sweep, transition, setup, concept

### 8. Deep Half Guard
- **slug:** `deep-half-guard`
- **description:** Far-side bottom position underneath the opponent, often arrived at from half guard. Waiter sweep, roll-under sweeps, back takes.
- **typical_roles:** guard, sweep, transition, setup, concept

### 9. Passing Game (Top)
- **slug:** `passing-game`
- **description:** Top game played against any open or half guard. Knee cut, smash, toreando / leg drag, body-lock pass, over-under, long step. Concepts like staying heavy, killing the inside line, stapling hips live here.
- **typical_roles:** pass, transition, setup, concept

### 10. Mount
- **slug:** `mount`
- **description:** Top mount position. Submissions (armbar, ezekiel, mounted triangle, cross-collar), maintenance with grapevines or knees-tight, and S-mount / high-mount transitions. Bottom-of-mount escape skills file under their destination position (e.g. recovering Half Guard Bottom).
- **typical_roles:** guard (position-hold), attack, transition, setup, concept

### 11. Side Control / Top
- **slug:** `side-control-top`
- **description:** Top of side control, north-south, and knee-on-belly. Submissions (kimura, americana, paper cutter, far-side armbar), pressure maintenance, and transitions to mount, back, or knee-on-belly. Bottom-side escape skills file under their destination guard.
- **typical_roles:** guard (position-hold), attack, transition, setup, concept

### 12. Back Control
- **slug:** `back-control`
- **description:** Both sides of the back: taking, attacking, retaining, and defending. Seatbelt control, body triangle, RNC, bow-and-arrow, mata-leão setups, and back-defense escapes back to guard.
- **typical_roles:** guard (control), attack, escape, transition, setup, concept

### 13. Leg Lock Game
- **slug:** `leg-lock-game`
- **description:** Modern leg-attack system: ashi garami / single-leg-X, 50/50, saddle / inside sankaku, outside ashi. Heel hooks (inside and outside), kneebar, ankle locks (Achilles, toe hold). Entries, inversions to inside position, and breaking mechanics. Skills that involve leg entanglement *primarily for finishing legs* go here even if entered from another guard like DLR or X.
- **typical_roles:** guard (entanglement-control), attack, transition, escape, setup, concept

### 14. Standing / Takedowns
- **slug:** `standing-takedowns`
- **description:** Everything pre-mat-contact. Grip fighting (gi and no-gi tie-ups), takedown entries (single, double, ankle pick, foot sweeps, judo throws, snap-downs), guard pulls, and takedown defense (sprawl, whizzer, underhook). Pulling guard logs here as a transition *into* a specific bottom game.
- **typical_roles:** setup, transition, attack (takedown finish), escape (takedown defense), concept


## How this feeds the LLM

When the categorization prompt runs, this is roughly what gets sent in
the "existing games" payload:

```
[
  {
    "id": "<uuid>",
    "name": "Closed Guard",
    "description": "Bottom guard with both legs locked behind ..."
  },
  ...
]
```

So every word in `description` is doing work. If categorization quality
drops on a particular game, sharpen *that* description first.


## Adding new games

Users can create custom games at any time. The "Suggest a new game" hook in
the skill-capture flow uses the LLM to propose `name`, `description`, and a
`rationale` when no existing game fits well. New games default to
`is_seeded = false` and immediately become available in subsequent
categorizations.


## Open items

1. **Role naming for top positions.** "guard" reads naturally for bottom
   guards (closed guard, half guard, etc.) but stretches for Mount, Side
   Control, and Back Control where it really means "position-hold /
   retention". For v1 we keep the single role name and document the broader
   meaning. If the UI ever surfaces role labels prominently, consider
   renaming to `position` or splitting into `position` + `retention`.
2. **Overlap between Leg Lock Game and other guards.** SLX, 50/50, and DLR
   leg-lock entries can fit two games legitimately. The data model already
   supports a skill being filed in multiple games — the LLM should be
   willing to suggest both when warranted.
3. **No-gi vs gi sensitivity.** Several games (Spider, Lasso) are gi-only.
   The LLM has the session's `gi_or_nogi` available — use it to suppress
   gi-only games in no-gi categorization, or at least lower their confidence.
