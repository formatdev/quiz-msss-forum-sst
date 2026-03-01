import Fastify, { type FastifyRequest } from 'fastify';
import { registerHealthRoutes } from './api/health.js';
import { registerSessionRoutes } from './api/sessions.js';
import { registerAnswerRoutes } from './api/answers.js';
import { registerResultRoutes } from './api/results.js';
import { registerLeaderboardRoutes } from './api/leaderboard.js';
import { registerAdminRoutes } from './api/admin.js';
import { metrics } from './observability/metrics.js';
import { logger } from './observability/logger.js';

export async function buildApp() {
  const app = Fastify({ logger: false });

  app.addHook('onRequest', async (request) => {
    (request as FastifyRequest & { _startedAt?: number })._startedAt = Date.now();
    metrics.increment('request_count');
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = (request as FastifyRequest & { _startedAt?: number })._startedAt ?? Date.now();
    const latency = Date.now() - startedAt;
    metrics.observe('request_latency_ms', latency);
    logger.info('request_complete', {
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      latencyMs: latency
    });
  });

  await registerHealthRoutes(app);
  await registerSessionRoutes(app);
  await registerAnswerRoutes(app);
  await registerResultRoutes(app);
  await registerLeaderboardRoutes(app);
  await registerAdminRoutes(app);
  return app;
}
