import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../index';
import { createTestDb, randomUUID } from '../test/setup';

import * as reflections from './reflections';
import * as sessions from './sessions';

describe('reflections repo', () => {
  let db: Db;

  beforeEach(() => {
    db = createTestDb();
  });

  it('create allows null sessionId (standalone reflection)', async () => {
    const r = await reflections.create(db, {
      id: randomUUID(),
      body: 'Rest day thinking.',
    });
    expect(r.sessionId).toBeNull();
  });

  it('create + getById round-trip with mood/energy/intensity', async () => {
    const id = randomUUID();
    await reflections.create(db, {
      id,
      body: 'Felt sharp today.',
      mood: 4,
      energy: 3,
      intensity: 5,
    });
    const fetched = await reflections.getById(db, id);
    expect(fetched!.mood).toBe(4);
    expect(fetched!.energy).toBe(3);
    expect(fetched!.intensity).toBe(5);
  });

  it('listRecent returns newest-first by createdAt', async () => {
    await reflections.create(db, {
      id: randomUUID(),
      body: 'A',
      createdAt: '2026-04-20T10:00:00.000Z',
    });
    await reflections.create(db, {
      id: randomUUID(),
      body: 'B',
      createdAt: '2026-04-25T10:00:00.000Z',
    });
    await reflections.create(db, {
      id: randomUUID(),
      body: 'C',
      createdAt: '2026-04-22T10:00:00.000Z',
    });

    const recent = await reflections.listRecent(db);
    expect(recent.map((r) => r.body)).toEqual(['B', 'C', 'A']);
  });

  it('listBySession returns only that session', async () => {
    const sessionId = randomUUID();
    await sessions.create(db, { id: sessionId, date: '2026-04-25', sessionType: 'class' });

    await reflections.create(db, { id: randomUUID(), body: 'in session', sessionId });
    await reflections.create(db, { id: randomUUID(), body: 'standalone' });

    const list = await reflections.listBySession(db, sessionId);
    expect(list).toHaveLength(1);
    expect(list[0].body).toBe('in session');
  });
});
