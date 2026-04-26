import { eq } from 'drizzle-orm';

import * as gamesRepo from './repos/games';
import type { Db } from './index';
import { skillInGames, skills, type Role } from './schema';

import type { Skill } from './repos/skills';

export interface SkillInGameDetail {
  skill: Skill;
  role: Role;
  notes: string | null;
  aiSuggested: boolean;
  aiConfidence: number | null;
}

export interface GameWithSkills {
  game: gamesRepo.Game;
  skills: SkillInGameDetail[];
}

/**
 * Cross-entity query: a game plus every skill filed under it, with each
 * skill's role and AI-suggested flag attached. The UI groups by `role` at
 * render time (see `domain-model.md` Flow 3 — Browse a game).
 */
export async function getGameWithSkills(db: Db, gameId: string): Promise<GameWithSkills | null> {
  const game = await gamesRepo.getById(db, gameId);
  if (!game) return null;

  const rows = await db
    .select()
    .from(skillInGames)
    .innerJoin(skills, eq(skillInGames.skillId, skills.id))
    .where(eq(skillInGames.gameId, gameId));

  const skillRows: SkillInGameDetail[] = rows.map((r) => ({
    skill: r.skills,
    role: r.skill_in_games.role,
    notes: r.skill_in_games.notes,
    aiSuggested: r.skill_in_games.aiSuggested,
    aiConfidence: r.skill_in_games.aiConfidence,
  }));

  return { game, skills: skillRows };
}
