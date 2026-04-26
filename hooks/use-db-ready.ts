import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { randomUUID } from 'expo-crypto';
import { useEffect, useState } from 'react';

import { db } from '@/db';
import migrations from '@/db/migrations';
import { seedGames } from '@/db/seed';

interface DbReadyState {
  ready: boolean;
  error: Error | null;
}

/**
 * Drives the boot-time DB lifecycle: run pending migrations, then run
 * idempotent seed loaders. Returns `ready: true` only when both steps
 * succeed, so the caller can gate the UI on a single boolean.
 */
export function useDbReady(): DbReadyState {
  const { success: migrated, error: migrationError } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [seedError, setSeedError] = useState<Error | null>(null);

  useEffect(() => {
    if (!migrated) return;
    seedGames(db, { generateId: randomUUID })
      .then(() => setSeeded(true))
      .catch((err: unknown) => {
        setSeedError(err instanceof Error ? err : new Error(String(err)));
      });
  }, [migrated]);

  return {
    ready: migrated && seeded,
    error: migrationError ?? seedError,
  };
}
