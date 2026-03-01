import type { FastifyReply, FastifyRequest } from 'fastify';
import { getEnv } from '../../config/env.js';

type RateRecord = {
  windowStartMs: number;
  count: number;
};

const records = new Map<string, RateRecord>();

export async function exportRateLimit(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const env = getEnv();
  const ip = request.ip ?? 'unknown';
  const key = `${ip}:exports`;
  const now = Date.now();
  const oneMinute = 60_000;
  const max = env.EXPORT_RATE_LIMIT_PER_MIN;

  const current = records.get(key);
  if (!current || now - current.windowStartMs >= oneMinute) {
    records.set(key, { windowStartMs: now, count: 1 });
    return;
  }

  if (current.count >= max) {
    reply.code(429).send({
      error: 'rate_limited',
      message: 'Too many export requests, please try again later.'
    });
    return;
  }

  current.count += 1;
}
