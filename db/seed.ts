import gamesSeed from '../seeds/games.json';

import type { Db } from './index';
import { games, type Role } from './schema';

interface GameSeed {
  slug: string;
  name: string;
  description: string;
  typicalRoles: Role[];
}

export interface SeedOptions {
  // Caller supplies the UUID generator so this module stays
  // environment-agnostic (expo-crypto in the app, node:crypto in tests).
  generateId: () => string;
}

/**
 * Idempotent seed loader. Inserts the 14 canonical BJJ games on first run
 * and is a no-op on subsequent runs (uses INSERT OR IGNORE keyed on the
 * unique `slug` column). Safe to call on every app boot.
 *
 * If a v1.1 ships with a 15th seeded game, just add it to seeds/games.json
 * and on next launch only the new entry inserts.
 */
export async function seedGames(db: Db, options: SeedOptions): Promise<void> {
  const seeds = gamesSeed as GameSeed[];
  const now = new Date().toISOString();

  await db
    .insert(games)
    .values(
      seeds.map((s) => ({
        id: options.generateId(),
        slug: s.slug,
        name: s.name,
        description: s.description,
        typicalRoles: JSON.stringify(s.typicalRoles),
        isSeeded: true,
        createdAt: now,
      }))
    )
    .onConflictDoNothing({ target: games.slug });
}
