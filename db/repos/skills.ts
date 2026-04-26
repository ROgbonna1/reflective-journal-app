import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { skills } from '../schema';

export type Skill = typeof skills.$inferSelect;

export interface CreateSkillInput {
  id: string;
  name: string;
  sessionId: string;
  description?: string;
  /** Defaults to true (save-first invariant — LLM call may not have happened yet). */
  pendingCategorization?: boolean;
  createdAt?: string;
}

export async function getById(db: Db, id: string): Promise<Skill | null> {
  const [row] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
  return row ?? null;
}

export async function listBySession(db: Db, sessionId: string): Promise<Skill[]> {
  return db
    .select()
    .from(skills)
    .where(eq(skills.sessionId, sessionId))
    .orderBy(desc(skills.createdAt));
}

export async function create(db: Db, input: CreateSkillInput): Promise<Skill> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const [row] = await db
    .insert(skills)
    .values({
      id: input.id,
      name: input.name,
      description: input.description ?? null,
      sessionId: input.sessionId,
      pendingCategorization: input.pendingCategorization ?? true,
      createdAt,
    })
    .returning();
  return row;
}
