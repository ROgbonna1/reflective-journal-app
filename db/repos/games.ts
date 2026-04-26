import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { games, type Role } from '../schema';

/**
 * Domain `Game` differs from the DB row in one place: `typicalRoles` is a
 * parsed `Role[]` rather than a JSON-encoded string. Callers always get the
 * parsed shape; the storage detail stays inside this module.
 */
export type Game = Omit<typeof games.$inferSelect, 'typicalRoles'> & {
  typicalRoles: Role[] | null;
};

export interface CreateGameInput {
  id: string;
  slug: string;
  name: string;
  description?: string;
  typicalRoles?: Role[];
  isSeeded: boolean;
  createdAt?: string;
}

function rowToGame(row: typeof games.$inferSelect): Game {
  return {
    ...row,
    typicalRoles: row.typicalRoles ? (JSON.parse(row.typicalRoles) as Role[]) : null,
  };
}

export async function list(db: Db): Promise<Game[]> {
  const rows = await db.select().from(games);
  return rows.map(rowToGame);
}

export async function getById(db: Db, id: string): Promise<Game | null> {
  const [row] = await db.select().from(games).where(eq(games.id, id)).limit(1);
  return row ? rowToGame(row) : null;
}

export async function getBySlug(db: Db, slug: string): Promise<Game | null> {
  const [row] = await db.select().from(games).where(eq(games.slug, slug)).limit(1);
  return row ? rowToGame(row) : null;
}

export async function create(db: Db, input: CreateGameInput): Promise<Game> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const [row] = await db
    .insert(games)
    .values({
      id: input.id,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      typicalRoles: input.typicalRoles ? JSON.stringify(input.typicalRoles) : null,
      isSeeded: input.isSeeded,
      createdAt,
    })
    .returning();
  return rowToGame(row);
}
