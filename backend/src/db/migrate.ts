import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './client.js';
import { logger } from '../observability/logger.js';

function ensureMigrationsTable(): void {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

export function runMigrations(): void {
  ensureMigrationsTable();
  const db = getDb();
  const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  const appliedRows = db.prepare('SELECT name FROM schema_migrations').all() as { name: string }[];
  const applied = new Set(appliedRows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
    db.prepare('INSERT INTO schema_migrations(name, applied_at) VALUES (?, ?)')
      .run(file, new Date().toISOString());
    logger.info('migration_applied', { file });
  }
}
