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

describe('GET /api/sessions/:sessionId/question', () => {
  it('returns localized next question with progress', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    const sessionRes = await request(setup.app.server).post('/api/sessions').send({ lang: 'fr' });
    const sessionId = sessionRes.body.sessionId as string;

    const res = await request(setup.app.server).get(`/api/sessions/${sessionId}/question`);
    expect(res.status).toBe(200);
    expect(res.body.questionId).toBe('q-001');
    expect(res.body.type).toBe('single');
    expect(res.body.prompt).toBe('Question FR de test');
    expect(res.body.choices).toEqual([
      { key: 'A', label: 'Choix A' },
      { key: 'B', label: 'Choix B' }
    ]);
    expect(res.body.progress).toEqual({ current: 1, total: 1 });
  });

  it('returns 204 when no active questions are available', async () => {
    const setup = await setupTestApp({ seedQuestion: false });
    cleanup = setup.close;

    const sessionRes = await request(setup.app.server).post('/api/sessions').send({ lang: 'fr' });
    const sessionId = sessionRes.body.sessionId as string;

    const res = await request(setup.app.server).get(`/api/sessions/${sessionId}/question`);
    expect(res.status).toBe(204);
  });
});
