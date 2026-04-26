import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['db/**/*.test.ts'],
    // Default node environment is fine — these tests hit better-sqlite3
    // in-memory, no React or DOM needed.
  },
});
