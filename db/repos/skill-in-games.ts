import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { skillInGames, type Role } from '../schema';

export type SkillInGame = typeof skillInGames.$inferSelect;

export interface CreateSkillInGameInput {
  skillId: string;
  gameId: string;
  role: Role;
  aiSuggested: boolean;
  aiConfidence?: number;
  notes?: string;
}

export async function listBySkill(db: Db, skillId: string): Promise<SkillInGame[]> {
  return db.select().from(skillInGames).where(eq(skillInGames.skillId, skillId));
}

export async function listByGame(db: Db, gameId: string): Promise<SkillInGame[]> {
  return db.select().from(skillInGames).where(eq(skillInGames.gameId, gameId));
}

export async function createMany(db: Db, inputs: CreateSkillInGameInput[]): Promise<SkillInGame[]> {
  if (inputs.length === 0) return [];
  return db
    .insert(skillInGames)
    .values(
      inputs.map((i) => ({
        skillId: i.skillId,
        gameId: i.gameId,
        role: i.role,
        aiSuggested: i.aiSuggested,
        aiConfidence: i.aiConfidence ?? null,
        notes: i.notes ?? null,
      }))
    )
    .returning();
}
