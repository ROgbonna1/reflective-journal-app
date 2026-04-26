import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../index';
import { createTestDb, randomUUID } from '../test/setup';

import * as sessions from './sessions';
import * as skills from './skills';

describe('skills repo', () => {
  let db: Db;
  let sessionId: string;

  beforeEach(async () => {
    db = createTestDb();
    sessionId = randomUUID();
    await sessions.create(db, { id: sessionId, date: '2026-04-25', sessionType: 'class' });
  });

  it('create defaults pendingCategorization to true (save-first)', async () => {
    const skill = await skills.create(db, {
      id: randomUUID(),
      name: 'Hip-bump sweep',
      sessionId,
    });
    expect(skill.pendingCategorization).toBe(true);
  });

  it('listBySession returns only that session, newest-first', async () => {
    const otherSessionId = randomUUID();
    await sessions.create(db, {
      id: otherSessionId,
      date: '2026-04-20',
      sessionType: 'open_mat',
    });

    const a = await skills.create(db, {
      id: randomUUID(),
      name: 'A',
      sessionId,
      createdAt: '2026-04-25T10:00:00.000Z',
    });
    const b = await skills.create(db, {
      id: randomUUID(),
      name: 'B',
      sessionId,
      createdAt: '2026-04-25T11:00:00.000Z',
    });
    await skills.create(db, {
      id: randomUUID(),
      name: 'OTHER',
      sessionId: otherSessionId,
    });

    const list = await skills.listBySession(db, sessionId);
    expect(list.map((s) => s.id)).toEqual([b.id, a.id]);
  });

  it('foreign key blocks insert for unknown session', async () => {
    await expect(
      skills.create(db, { id: randomUUID(), name: 'orphan', sessionId: randomUUID() })
    ).rejects.toThrow();
  });
});
