import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from './index';
import { getGameWithSkills } from './queries';
import * as games from './repos/games';
import * as sessions from './repos/sessions';
import * as skillInGames from './repos/skill-in-games';
import * as skills from './repos/skills';
import { seedGames } from './seed';
import { createTestDb, randomUUID } from './test/setup';

describe('getGameWithSkills', () => {
  let db: Db;

  beforeEach(async () => {
    db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });
  });

  it('returns null when the game does not exist', async () => {
    expect(await getGameWithSkills(db, randomUUID())).toBeNull();
  });

  it('returns the game and every skill filed under it (with role)', async () => {
    const sessionId = randomUUID();
    await sessions.create(db, { id: sessionId, date: '2026-04-25', sessionType: 'class' });
    const closedGuard = (await games.getBySlug(db, 'closed-guard'))!;

    const sweepId = randomUUID();
    const attackId = randomUUID();
    await skills.create(db, { id: sweepId, name: 'Hip bump', sessionId });
    await skills.create(db, { id: attackId, name: 'Triangle', sessionId });

    await skillInGames.createMany(db, [
      {
        skillId: sweepId,
        gameId: closedGuard.id,
        role: 'sweep',
        aiSuggested: true,
        aiConfidence: 0.95,
      },
      {
        skillId: attackId,
        gameId: closedGuard.id,
        role: 'attack',
        aiSuggested: false,
      },
    ]);

    const result = await getGameWithSkills(db, closedGuard.id);
    expect(result).not.toBeNull();
    expect(result!.game.slug).toBe('closed-guard');
    expect(result!.skills).toHaveLength(2);

    const sweepEntry = result!.skills.find((s) => s.role === 'sweep');
    const attackEntry = result!.skills.find((s) => s.role === 'attack');
    expect(sweepEntry!.skill.name).toBe('Hip bump');
    expect(attackEntry!.skill.name).toBe('Triangle');
  });

  it('returns the game with empty skills when nothing is filed yet', async () => {
    const closedGuard = (await games.getBySlug(db, 'closed-guard'))!;
    const result = await getGameWithSkills(db, closedGuard.id);
    expect(result!.skills).toEqual([]);
  });
});
