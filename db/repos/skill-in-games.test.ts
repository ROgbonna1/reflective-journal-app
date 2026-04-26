import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../index';
import { seedGames } from '../seed';
import { createTestDb, randomUUID } from '../test/setup';

import * as games from './games';
import * as sessions from './sessions';
import * as skillInGames from './skill-in-games';
import * as skills from './skills';

describe('skill-in-games repo', () => {
  let db: Db;
  let skillId: string;
  let closedGuardId: string;
  let halfGuardId: string;

  beforeEach(async () => {
    db = createTestDb();
    await seedGames(db, { generateId: () => randomUUID() });

    const sessionId = randomUUID();
    await sessions.create(db, { id: sessionId, date: '2026-04-25', sessionType: 'class' });

    skillId = randomUUID();
    await skills.create(db, { id: skillId, name: 'Hip-bump sweep', sessionId });

    closedGuardId = (await games.getBySlug(db, 'closed-guard'))!.id;
    halfGuardId = (await games.getBySlug(db, 'half-guard-bottom'))!.id;
  });

  it('createMany + listBySkill returns all categorizations for a skill', async () => {
    await skillInGames.createMany(db, [
      { skillId, gameId: closedGuardId, role: 'sweep', aiSuggested: true, aiConfidence: 0.95 },
      {
        skillId,
        gameId: halfGuardId,
        role: 'transition',
        aiSuggested: true,
        aiConfidence: 0.6,
      },
    ]);

    const linked = await skillInGames.listBySkill(db, skillId);
    expect(linked).toHaveLength(2);
    const closed = linked.find((l) => l.gameId === closedGuardId);
    expect(closed!.role).toBe('sweep');
    expect(closed!.aiConfidence).toBe(0.95);
  });

  it('listByGame returns all skills in a game', async () => {
    await skillInGames.createMany(db, [
      { skillId, gameId: closedGuardId, role: 'sweep', aiSuggested: true, aiConfidence: 0.95 },
    ]);
    const inGame = await skillInGames.listByGame(db, closedGuardId);
    expect(inGame).toHaveLength(1);
    expect(inGame[0].skillId).toBe(skillId);
  });

  it('createMany of empty array is a no-op', async () => {
    const result = await skillInGames.createMany(db, []);
    expect(result).toEqual([]);
  });

  it('cascade-deletes when the parent skill is deleted', async () => {
    await skillInGames.createMany(db, [
      { skillId, gameId: closedGuardId, role: 'sweep', aiSuggested: true },
    ]);
    // Direct delete via raw SQL (no skills.delete() repo function yet).
    const { skills: skillsTable } = await import('../schema');
    const { eq } = await import('drizzle-orm');
    await db.delete(skillsTable).where(eq(skillsTable.id, skillId));

    const orphans = await skillInGames.listByGame(db, closedGuardId);
    expect(orphans).toHaveLength(0);
  });
});
