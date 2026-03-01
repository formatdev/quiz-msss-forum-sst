import { buildApp } from './app.js';
import { getEnv } from './config/env.js';
import { runMigrations } from './db/migrate.js';
import { logger } from './observability/logger.js';

async function start(): Promise<void> {
  const env = getEnv();
  runMigrations();
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info('server_started', { port: env.PORT, env: env.NODE_ENV });
}

start().catch((error) => {
  logger.error('server_start_failed', {
    message: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
