import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../index';
import { seedGames } from '../seed';
import { createTestDb, randomUUID } from '../test/setup';

import * as games from './games';

describe('games repo', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });
  });

  it('list returns all seeded games with parsed typicalRoles', async () => {
    const all = await games.list(db);
    expect(all).toHaveLength(14);
    const closedGuard = all.find((g) => g.slug === 'closed-guard');
    expect(closedGuard).toBeDefined();
    expect(closedGuard!.typicalRoles).toEqual([
      'guard',
      'sweep',
      'attack',
      'transition',
      'setup',
      'concept',
    ]);
  });

  it('getBySlug returns the game with the right name', async () => {
    const game = await games.getBySlug(db, 'passing-game');
    expect(game).not.toBeNull();
    expect(game!.name).toBe('Passing Game (Top)');
  });

  it('getBySlug returns null for unknown slug', async () => {
    const game = await games.getBySlug(db, 'nonexistent');
    expect(game).toBeNull();
  });

  it('getById round-trips with create', async () => {
    const id = randomUUID();
    const created = await games.create(db, {
      id,
      slug: 'rubber-guard',
      name: 'Rubber Guard',
      description: 'A high-guard variant.',
      typicalRoles: ['guard', 'attack'],
      isSeeded: false,
    });
    expect(created.id).toBe(id);
    expect(created.isSeeded).toBe(false);

    const fetched = await games.getById(db, id);
    expect(fetched).not.toBeNull();
    expect(fetched!.typicalRoles).toEqual(['guard', 'attack']);
  });
});
