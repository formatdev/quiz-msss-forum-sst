import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { SessionService } from '../services/session-service.js';

const StartSessionSchema = z.object({
  lang: z.enum(['fr', 'de', 'en']),
  nickname: z.string().max(32).optional(),
  resumeSessionId: z.string().uuid().optional()
});

const SessionParamSchema = z.object({
  sessionId: z.string().uuid()
});

export async function registerSessionRoutes(app: FastifyInstance): Promise<void> {
  const service = new SessionService();

  app.post('/api/sessions', async (request, reply) => {
    const parsed = StartSessionSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({
        error: 'invalid_request',
        details: parsed.error.flatten()
      });
      return;
    }

    const result = service.startSession(parsed.data);
    reply.code(201).send({
      sessionId: result.sessionId,
      totalQuestions: result.totalQuestions,
      startedAt: result.startedAt,
      resumed: result.resumed
    });
  });

  app.get('/api/sessions/:sessionId/question', async (request, reply) => {
    const parsed = SessionParamSchema.safeParse(request.params);
    if (!parsed.success) {
      reply.code(400).send({ error: 'invalid_session_id' });
      return;
    }

    const result = service.getNextQuestion(parsed.data.sessionId);
    if (result.status === 'not_found') {
      reply.code(404).send({ error: 'session_not_found' });
      return;
    }
    if (result.status === 'complete') {
      reply.code(204).send();
      return;
    }
    reply.code(200).send(result.question);
  });
}
