import fs from 'node:fs';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { setupTestApp } from '../helpers/test-app.js';
import { getDb } from '../../src/db/client.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe('admin initialize', () => {
  it('creates a dump, clears runtime data, and reseeds questions', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    const sessionRes = await request(setup.app.server).post('/api/sessions').send({ lang: 'fr' });
    expect(sessionRes.status).toBe(201);

    const initRes = await request(setup.app.server).post('/api/admin/initialize').send({});
    expect(initRes.status).toBe(200);
    expect(initRes.body.dumpFile).toContain('quiz-db-dump-');
    expect(typeof initRes.body.dumpPath).toBe('string');
    expect(fs.existsSync(initRes.body.dumpPath)).toBe(true);
    expect(initRes.body.csvDumpFile).toContain('quiz-db-export-');
    expect(typeof initRes.body.csvDumpPath).toBe('string');
    expect(fs.existsSync(initRes.body.csvDumpPath)).toBe(true);
    expect(initRes.body.seededQuestions).toBeGreaterThan(0);
    expect(initRes.body.clearedSessions).toBeGreaterThan(0);

    const db = getDb();
    const sessionsCount = db.prepare('SELECT COUNT(*) AS count FROM sessions').get() as { count: number };
    const answersCount = db
      .prepare('SELECT COUNT(*) AS count FROM session_answers')
      .get() as { count: number };
    const questionsCount = db.prepare('SELECT COUNT(*) AS count FROM questions').get() as { count: number };

    expect(sessionsCount.count).toBe(0);
    expect(answersCount.count).toBe(0);
    expect(questionsCount.count).toBeGreaterThan(0);
  });
});
