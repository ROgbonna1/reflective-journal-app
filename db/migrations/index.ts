// Drizzle Expo SQLite migration bundle.
//
// Each entry maps a journal tag (the .sql filename without extension) to its
// SQL string. babel-plugin-inline-import replaces these imports with the file
// contents at build time, so the SQL is embedded in the JS bundle and
// available offline at runtime.
//
// When you add a new migration via `npm run db:generate`, add a matching
// import + entry below.

import journal from './meta/_journal.json';
import m0000_flimsy_zodiak from './0000_flimsy_zodiak.sql';

export default {
  journal,
  migrations: {
    '0000_flimsy_zodiak': m0000_flimsy_zodiak,
  },
};
