# Development Log

Chronological record of meaningful work and decisions.
[`roadmap.md`](./roadmap.md) is the forward-looking plan; this doc is
the audit trail. New entries go at the top.

---

## 2026-04-25 — Phase 2 verified, Phase 3 built, build-sequence redirect

### What shipped (on `origin/main`)

- **Phase 2 — Data layer (B2)** — fully verified on device. Schema for
  all 7 entities, Drizzle migrations, idempotent seed loader for the
  14 games, repos with create + read functions, in-memory test suite
  (24 tests). Game schema grew `slug` and `typical_roles` columns
  (gap from the original `domain-model.md`, doc updated).
- **Build-sequence redirect.** Original plan was layered (B4 →
  B3 mock UI → categorizer port). Redirected to vertical-slice first:
  ship Reflection capture + feed end-to-end with no LLM, then layer
  LLM enrichment on top. Driven by the realization that we had enough
  infra to ship a real feature; the original plan was overly
  mechanical. Roadmap restructured into 7 linear phases.

### Phase 3 — Reflection capture + feed  (committed `fa20984`)

Functional and pushed:

- Capture screen (modal): body textarea (autofocus, multi-line) + three
  1–5 rating dots (mood / energy / intensity). Save in the header,
  disabled until body has content.
- Feed screen: `FlatList` over `reflections.listRecent(db)`, empty state
  with primary CTA, header `+` button, refetch on focus via
  `useFocusEffect` so saves are immediately visible.
- Each row: 3-line body preview, `M / E / I` rating summary (skips unset
  fields), relative timestamp.
- Removed the temporary `[db] ready — N games seeded` log from
  `useDbReady` — feed reading the DB is now the running proof.

**UI polish pending.** Functionality works on device. User flagged
"UI is off" before stopping for the night; specifics TBD. See "Pick up
here" below.

### Bugs hit and fixed during the day

- **`babel-plugin-inline-import` doesn't work under Expo SDK 54's
  Metro pipeline.** Caused "Missing migration" on device while Vitest
  tests passed (different code path: better-sqlite3 reads SQL from
  disk). Fix: replaced with a small Node script
  (`scripts/build-migrations.mjs`) that inlines SQL strings into
  `db/migrations/index.ts` at `db:generate` time. No bundler magic.
- **Drizzle's expo-sqlite migrator looks up SQL by `m{idx}` zero-padded
  to 4 digits, not by the journal tag.** Even after the inline fix,
  lookup still returned undefined. The error message prints the tag
  for human readability — sent me chasing the wrong key. Patched the
  build script to emit `m0000`-style keys. Documented in `CLAUDE.md`
  → Environment quirks.
- **`Object.groupBy` is Node 21+** — used in a Vitest test, broke
  under our pinned Node 20.19.4. Replaced with manual `.find()`.

### Decisions made (or reconfirmed)

- **No backend for v1 confirmed; revisit later.** Discussed
  building it in Go. The categorizer is ~150 lines and easy to port,
  Anthropic has a Go SDK — so it's not a one-way door. The resolved
  decision in `domain-model.md` (no backend in v1) holds.
  `workstreams.md` Q4 ("design B2 repos as adapters") motivated
  keeping repo functions clean so a future swap is mechanical.
- **Test stack: Vitest + better-sqlite3 in-memory.** `node:test` +
  `tsx` considered but fiddlier; Vitest's zero-config TS support
  won out.
- **Repos as plain functions, not classes.** Imported as
  `import * as games from '@/db/repos/games'`. The function signature
  is the adapter boundary; no class ceremony.
- **Vertical-slice first build order** (covered in "What shipped").
- **Phase 4 architecture pre-decided:** Settings lives behind a Profile
  sub-screen (not the Profile root). "Test connection" uses a
  1-token Haiku call (~$0.0001), not the free `/v1/models` endpoint —
  exercises the actual call path. SecureStore wrapper at
  `app/lib/secure-storage.ts`.

### Doc state at end of day

Single source of truth maintained — every change reflected in `/docs`:

- `docs/roadmap.md` — restructured for vertical-slice ordering
- `docs/workstreams.md` — note added at top: build order lives in
  roadmap.md, not in B# numbering
- `docs/domain-model.md` — Game entity gained `slug` and `typical_roles`
- `CLAUDE.md` — repo state updated (categorizer + scaffold + DB
  layer all exist now), conventions accept `[Pn]` prefixes alongside
  `[Bn]`, environment quirks gained the Drizzle migration build
  script note
- `README.md` — Status section reflects Phases 1–2 done, Phase 3 next

### Pick up here when you resume

1. **First action — investigate Phase 3 UI polish.** User reported
   "UI is off" without specifics before stopping. Likely candidates:
   - Modal header / "Save" button placement, sizing, or color contrast
   - Rating dots: spacing, fill color in dark mode, hit target size
   - `KeyboardAvoidingView` behavior — does the keyboard cover the
     Save button on smaller phones?
   - `FlatList` content insets vs. the tab bar (clipping at the bottom)
   - Empty-state button — currently a hand-rolled bordered Pressable;
     might want it to look more like a real iOS primary button
   - Body `TextInput` border / typography
   - Files to look at: `app/(tabs)/reflect/new.tsx` (capture form),
     `app/(tabs)/reflect/index.tsx` (feed)
   - Ask the user *which* screens look wrong before guessing.
2. **Sanity checks before and after**: from the repo root,
   `npm run typecheck && npm run lint && npm run format:check && npm test`
   — all four were green at session end.
3. **Verify on device once polished**, then tick the "Verified
   end-to-end on device" box in `roadmap.md` § Phase 3.
4. **Move to Phase 4 — Settings + LLM key plumbing (B4)** per
   `roadmap.md`. Pre-decisions above.

### Environment notes for cold-start

- Node 20.19.4 (`.nvmrc`); shell loads nvm from `.zprofile`. If
  `node -v` shows something else in a fresh shell, run
  `. ~/.nvm/nvm.sh && nvm use`.
- `npm start` from the repo root → Metro QR; scan with iPhone Camera
  to open in Expo Go. The first launch holds the splash longer
  (migrations + seed run).
- `[db] ready — N games seeded` log is gone — Phase 3's feed reading
  the DB is the running proof now.
- The Phase 3 commit (`fa20984`) is on `origin/main` despite the
  pending UI polish — the commit message is honest about the slice
  scope.
