import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { setupTestApp } from '../helpers/test-app.js';

let cleanup: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (cleanup) {
    await cleanup();
    cleanup = null;
  }
});

describe('POST /api/sessions', () => {
  it('creates a session and returns session metadata', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    const res = await request(setup.app.server)
      .post('/api/sessions')
      .send({ lang: 'fr', nickname: 'KidTester' });

    expect(res.status).toBe(201);
    expect(res.body.sessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
    expect(res.body.totalQuestions).toBe(1);
    expect(typeof res.body.startedAt).toBe('string');
    expect(res.body.resumed).toBe(false);
  });

  it('returns validation error for unsupported language', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    const res = await request(setup.app.server).post('/api/sessions').send({ lang: 'it' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });
});
