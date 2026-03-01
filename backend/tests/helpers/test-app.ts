import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { resetEnvForTests } from '../../src/config/env.js';
import { getDb, resetDbForTests } from '../../src/db/client.js';
import { runMigrations } from '../../src/db/migrate.js';

type SetupResult = {
  app: FastifyInstance;
  dbPath: string;
  close: () => Promise<void>;
};

function seedDefaultQuestion(): void {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO questions (
      id, type, topic_tag, image_key, display_order, is_active, correct_option_keys_json, created_at, updated_at
    )
    VALUES (?, 'single', ?, NULL, 1, 1, ?, ?, ?)
    `
  ).run('q-001', 'health-basics', JSON.stringify(['A']), now, now);
  db.prepare(
    `
    INSERT INTO question_translations (question_id, lang, question_text, explanation_text, option_texts_json)
    VALUES (?, 'fr', ?, ?, ?)
    `
  ).run(
    'q-001',
    'Question FR de test',
    'Explication FR de test',
    JSON.stringify({ A: 'Choix A', B: 'Choix B' })
  );
}

export async function setupTestApp({ seedQuestion = true } = {}): Promise<SetupResult> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'quiz-msss-test-'));
  const dbPath = path.join(tmpDir, 'quiz.db');

  process.env.NODE_ENV = 'test';
  process.env.DB_PATH = dbPath;
  process.env.APP_BASE_URL = 'http://localhost:3000';
  process.env.EXPORT_RATE_LIMIT_PER_MIN = '100';
  process.env.RESUME_TIMEOUT_SECONDS = '120';

  resetDbForTests();
  resetEnvForTests();
  runMigrations();
  if (seedQuestion) {
    seedDefaultQuestion();
  }

  const app = await buildApp();
  await app.ready();

  return {
    app,
    dbPath,
    close: async () => {
      await app.close();
      resetDbForTests();
      resetEnvForTests();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };
}
