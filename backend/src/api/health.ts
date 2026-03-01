import type { FastifyInstance } from 'fastify';
import { getEnv } from '../config/env.js';
import { getDb } from '../db/client.js';
import { metrics } from '../observability/metrics.js';

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/health', async () => {
    const env = getEnv();
    let activeQuestions = -1;
    try {
      const row = getDb()
        .prepare('SELECT COUNT(*) AS count FROM questions WHERE is_active = 1')
        .get() as { count: number };
      activeQuestions = row.count ?? 0;
    } catch {
      activeQuestions = -1;
    }

    return {
      status: 'ok',
      time: new Date().toISOString(),
      dbPath: env.DB_PATH,
      activeQuestions,
      metrics: metrics.snapshot()
    };
  });
}
