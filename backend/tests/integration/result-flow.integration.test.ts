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

describe('result flow', () => {
  it('evaluates answer, returns explanation, and exposes final result with leaderboard', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    const sessionRes = await request(setup.app.server)
      .post('/api/sessions')
      .send({ lang: 'fr', nickname: 'Player 1' });
    expect(sessionRes.status).toBe(201);

    const sessionId = sessionRes.body.sessionId as string;

    const questionRes = await request(setup.app.server).get(`/api/sessions/${sessionId}/question`);
    expect(questionRes.status).toBe(200);
    expect(questionRes.body.questionId).toBe('q-001');

    const answerRes = await request(setup.app.server)
      .post(`/api/sessions/${sessionId}/answers`)
      .send({ questionId: 'q-001', selectedKeys: ['A'] });
    expect(answerRes.status).toBe(200);
    expect(answerRes.body.correct).toBe(true);
    expect(answerRes.body.awardedPoints).toBe(1);
    expect(answerRes.body.maxPoints).toBe(1);
    expect(answerRes.body.hasMoreQuestions).toBe(false);
    expect(answerRes.body.correctKeys).toEqual(['A']);
    expect(answerRes.body.explanation).toContain('Explication');

    const nextRes = await request(setup.app.server).get(`/api/sessions/${sessionId}/question`);
    expect(nextRes.status).toBe(204);

    const resultRes = await request(setup.app.server).get(`/api/sessions/${sessionId}/result`);
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.score).toBe(1);
    expect(resultRes.body.maxScore).toBe(1);
    expect(resultRes.body.percentage).toBe(100);
    expect(resultRes.body.leaderboard).toHaveLength(1);
    expect(resultRes.body.leaderboard[0]).toMatchObject({
      rank: 1,
      nickname: 'Player 1',
      score: 1,
      maxScore: 1
    });
  });

  it('treats "Any" as all answers correct', async () => {
    const setup = await setupTestApp();
    cleanup = setup.close;

    getDb().prepare('UPDATE questions SET correct_option_keys_json = ? WHERE id = ?').run(
      JSON.stringify(['Any']),
      'q-001'
    );

    const sessionRes = await request(setup.app.server)
      .post('/api/sessions')
      .send({ lang: 'fr', nickname: 'Player Any' });
    expect(sessionRes.status).toBe(201);

    const sessionId = sessionRes.body.sessionId as string;

    const answerRes = await request(setup.app.server)
      .post(`/api/sessions/${sessionId}/answers`)
      .send({ questionId: 'q-001', selectedKeys: ['B'] });
    expect(answerRes.status).toBe(200);
    expect(answerRes.body.correct).toBe(true);
    expect(answerRes.body.awardedPoints).toBe(1);
    expect(answerRes.body.maxPoints).toBe(1);
    expect(answerRes.body.hasMoreQuestions).toBe(false);
    expect(answerRes.body.correctKeys).toEqual(['Any']);

    const resultRes = await request(setup.app.server).get(`/api/sessions/${sessionId}/result`);
    expect(resultRes.status).toBe(200);
    expect(resultRes.body.score).toBe(1);
    expect(resultRes.body.maxScore).toBe(1);
    expect(resultRes.body.percentage).toBe(100);
  });
});
