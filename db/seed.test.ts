import { describe, expect, it } from 'vitest';

import { games } from './schema';
import { seedGames } from './seed';
import { createTestDb, randomUUID } from './test/setup';

describe('seedGames', () => {
  it('inserts all 14 canonical games on first run', async () => {
    const db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });
    const rows = await db.select().from(games);
    expect(rows).toHaveLength(14);
    expect(rows.every((r) => r.isSeeded)).toBe(true);
  });

  it('is idempotent — second run does not duplicate', async () => {
    const db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });
    await seedGames(db, { generateId: () => randomUUID() });
    const rows = await db.select().from(games);
    expect(rows).toHaveLength(14);
  });

  it('persists every expected slug', async () => {
    const db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });
    const rows = await db.select().from(games);
    const slugs = new Set(rows.map((r) => r.slug));
    for (const expected of [
      'closed-guard',
      'half-guard-bottom',
      'butterfly-guard',
      'spider-guard',
      'lasso-guard',
      'de-la-riva',
      'x-guard',
      'deep-half-guard',
      'passing-game',
      'mount',
      'side-control-top',
      'back-control',
      'leg-lock-game',
      'standing-takedowns',
    ]) {
      expect(slugs.has(expected)).toBe(true);
    }
  });
});
