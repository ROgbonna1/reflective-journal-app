import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { reflections } from '../schema';

export type Reflection = typeof reflections.$inferSelect;

export interface CreateReflectionInput {
  id: string;
  body: string;
  /** Nullable — standalone reflections (rest day, weekly thinking) are allowed. */
  sessionId?: string;
  mood?: number; // 1-5
  energy?: number; // 1-5
  intensity?: number; // 1-5
  createdAt?: string;
}

export async function getById(db: Db, id: string): Promise<Reflection | null> {
  const [row] = await db.select().from(reflections).where(eq(reflections.id, id)).limit(1);
  return row ?? null;
}

export async function listRecent(db: Db, limit = 50): Promise<Reflection[]> {
  return db.select().from(reflections).orderBy(desc(reflections.createdAt)).limit(limit);
}

export async function listBySession(db: Db, sessionId: string): Promise<Reflection[]> {
  return db
    .select()
    .from(reflections)
    .where(eq(reflections.sessionId, sessionId))
    .orderBy(desc(reflections.createdAt));
}

export async function create(db: Db, input: CreateReflectionInput): Promise<Reflection> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const [row] = await db
    .insert(reflections)
    .values({
      id: input.id,
      body: input.body,
      sessionId: input.sessionId ?? null,
      mood: input.mood ?? null,
      energy: input.energy ?? null,
      intensity: input.intensity ?? null,
      createdAt,
    })
    .returning();
  return row;
}
