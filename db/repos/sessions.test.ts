import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../index';
import { createTestDb, randomUUID } from '../test/setup';

import * as sessions from './sessions';

describe('sessions repo', () => {
  let db: Db;

  beforeEach(() => {
    db = createTestDb();
  });

  it('create + getById round-trip', async () => {
    const id = randomUUID();
    const created = await sessions.create(db, {
      id,
      date: '2026-04-25',
      sessionType: 'class',
      gym: 'Gracie Barra',
      giOrNogi: 'gi',
    });
    expect(created.id).toBe(id);
    expect(created.gym).toBe('Gracie Barra');

    const fetched = await sessions.getById(db, id);
    expect(fetched).not.toBeNull();
    expect(fetched!.sessionType).toBe('class');
  });

  it('listRecent returns sessions newest-first by date', async () => {
    await sessions.create(db, {
      id: randomUUID(),
      date: '2026-04-20',
      sessionType: 'class',
    });
    await sessions.create(db, {
      id: randomUUID(),
      date: '2026-04-25',
      sessionType: 'open_mat',
    });
    await sessions.create(db, {
      id: randomUUID(),
      date: '2026-04-22',
      sessionType: 'private',
    });

    const recent = await sessions.listRecent(db);
    expect(recent.map((s) => s.date)).toEqual(['2026-04-25', '2026-04-22', '2026-04-20']);
  });

  it('getById returns null for unknown id', async () => {
    expect(await sessions.getById(db, randomUUID())).toBeNull();
  });
});
