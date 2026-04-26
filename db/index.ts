import { drizzle } from 'drizzle-orm/expo-sqlite';
import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import * as SQLite from 'expo-sqlite';

import * as schema from './schema';

export const DATABASE_NAME = 'journal.db';

// Open the on-device SQLite file once. Subsequent imports of `db` get the
// same connection (module-level singleton). Foreign keys are enforced —
// SQLite's default is OFF, which would silently let cascade rules be
// ignored.
const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);
expoDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(expoDb, { schema });
export { schema };

/**
 * Repos accept this widened type rather than the concrete
 * ExpoSQLiteDatabase so they also work against better-sqlite3 in tests.
 * `await db.foo()` works under both modes — sync results are unwrapped by
 * await as no-ops.
 */
export type Db = BaseSQLiteDatabase<'sync' | 'async', unknown, typeof schema>;
