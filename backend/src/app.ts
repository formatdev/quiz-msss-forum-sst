import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyRequest } from 'fastify';
import fastifyStatic from '@fastify/static';
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
  const backendDistDir = path.dirname(fileURLToPath(import.meta.url));
  const frontendDistDir = path.resolve(backendDistDir, '..', '..', 'frontend', 'dist');

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

  if (fs.existsSync(frontendDistDir)) {
    await app.register(fastifyStatic, {
      root: frontendDistDir,
      prefix: '/',
      index: ['index.html']
    });

    app.setNotFoundHandler(async (request, reply) => {
      const pathname = new URL(request.url, 'http://localhost').pathname;
      if (pathname.startsWith('/api/')) {
        reply.code(404).send({
          message: `Route ${request.method}:${request.url} not found`,
          error: 'Not Found',
          statusCode: 404
        });
        return;
      }
      if (path.extname(pathname)) {
        reply.code(404).send({
          message: `Route ${request.method}:${request.url} not found`,
          error: 'Not Found',
          statusCode: 404
        });
        return;
      }
      return reply.type('text/html').sendFile('index.html');
    });
  }

  return app;
}
