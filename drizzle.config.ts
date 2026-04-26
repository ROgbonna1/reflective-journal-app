import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'sqlite',
  // Driver omitted because we generate migrations only; the runtime driver is
  // expo-sqlite (on device) or better-sqlite3 (in tests), each set up at
  // runtime in db/index.ts and the test harness respectively.
} satisfies Config;
