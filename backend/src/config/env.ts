import { z } from 'zod';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const defaultDbPath = path.join(backendRoot, 'data', 'quiz.db');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().default(defaultDbPath),
  EXPORT_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
  RESUME_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(120),
  APP_BASE_URL: z.string().url().default('http://localhost:3000')
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) {
    return cached;
  }
  cached = EnvSchema.parse(process.env);
  return cached;
}

export function resetEnvForTests(): void {
  cached = null;
}
