import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

/**
 * Domain enums — stored as TEXT in SQLite, narrowed at the type level via
 * Drizzle's `enum` option. Source of truth for the role values is shared
 * with the categorizer prototype (scripts/categorizer/types.ts).
 */
export const SESSION_TYPES = ['class', 'open_mat', 'private', 'comp_prep', 'sparring'] as const;
export type SessionType = (typeof SESSION_TYPES)[number];

export const GI_OR_NOGI = ['gi', 'nogi'] as const;
export type GiOrNogi = (typeof GI_OR_NOGI)[number];

export const ROLES = [
  'guard',
  'sweep',
  'attack',
  'pass',
  'escape',
  'transition',
  'setup',
  'concept',
] as const;
export type Role = (typeof ROLES)[number];

export const trainingSessions = sqliteTable('training_sessions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(), // ISO YYYY-MM-DD
  gym: text('gym'),
  instructor: text('instructor'),
  sessionType: text('session_type', { enum: SESSION_TYPES }).notNull(),
  giOrNogi: text('gi_or_nogi', { enum: GI_OR_NOGI }),
  durationMin: integer('duration_min'),
  partners: text('partners'),
});

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sessionId: text('session_id')
    .notNull()
    .references(() => trainingSessions.id),
  pendingCategorization: integer('pending_categorization', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(), // ISO UTC
});

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  // Stable human-readable identifier. Categorizer uses slug to refer to games
  // in LLM prompts (so the LLM can return a deterministic string we can
  // resolve back to an id). Seeded games use canonical slugs from
  // docs/seeded-games.md; user-created games auto-slugify from name.
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  // JSON-stringified Role[]. Used as LLM grounding for which roles are
  // typical for a game. Nullable for user-created games.
  typicalRoles: text('typical_roles'),
  isSeeded: integer('is_seeded', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull(),
});

export const skillInGames = sqliteTable(
  'skill_in_games',
  {
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ROLES }).notNull(),
    notes: text('notes'),
    aiSuggested: integer('ai_suggested', { mode: 'boolean' }).notNull(),
    aiConfidence: real('ai_confidence'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.skillId, t.gameId, t.role] }),
  })
);

export const reflections = sqliteTable('reflections', {
  id: text('id').primaryKey(),
  // Nullable: standalone reflections (rest day, weekly thinking) are allowed.
  sessionId: text('session_id').references(() => trainingSessions.id),
  body: text('body').notNull(),
  mood: integer('mood'), // 1-5
  energy: integer('energy'), // 1-5
  intensity: integer('intensity'), // 1-5
  createdAt: text('created_at').notNull(),
});

export const reflectionSkills = sqliteTable(
  'reflection_skills',
  {
    reflectionId: text('reflection_id')
      .notNull()
      .references(() => reflections.id, { onDelete: 'cascade' }),
    skillId: text('skill_id')
      .notNull()
      .references(() => skills.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reflectionId, t.skillId] }),
  })
);

export const reflectionGames = sqliteTable(
  'reflection_games',
  {
    reflectionId: text('reflection_id')
      .notNull()
      .references(() => reflections.id, { onDelete: 'cascade' }),
    gameId: text('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.reflectionId, t.gameId] }),
  })
);
