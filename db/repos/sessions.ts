import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { trainingSessions, type GiOrNogi, type SessionType } from '../schema';

export type Session = typeof trainingSessions.$inferSelect;

export interface CreateSessionInput {
  id: string;
  date: string; // ISO YYYY-MM-DD
  sessionType: SessionType;
  gym?: string;
  instructor?: string;
  giOrNogi?: GiOrNogi;
  durationMin?: number;
  partners?: string;
}

export async function getById(db: Db, id: string): Promise<Session | null> {
  const [row] = await db
    .select()
    .from(trainingSessions)
    .where(eq(trainingSessions.id, id))
    .limit(1);
  return row ?? null;
}

export async function listRecent(db: Db, limit = 30): Promise<Session[]> {
  return db.select().from(trainingSessions).orderBy(desc(trainingSessions.date)).limit(limit);
}

export async function create(db: Db, input: CreateSessionInput): Promise<Session> {
  const [row] = await db
    .insert(trainingSessions)
    .values({
      id: input.id,
      date: input.date,
      sessionType: input.sessionType,
      gym: input.gym ?? null,
      instructor: input.instructor ?? null,
      giOrNogi: input.giOrNogi ?? null,
      durationMin: input.durationMin ?? null,
      partners: input.partners ?? null,
    })
    .returning();
  return row;
}
