import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AnswerService } from '../services/answer-service.js';

const SessionParamSchema = z.object({
  sessionId: z.string().uuid()
});

export async function registerResultRoutes(app: FastifyInstance): Promise<void> {
  const service = new AnswerService();

  app.get('/api/sessions/:sessionId/result', async (request, reply) => {
    const params = SessionParamSchema.safeParse(request.params);
    if (!params.success) {
      reply.code(400).send({ error: 'invalid_session_id' });
      return;
    }

    const result = service.getSessionResult(params.data.sessionId);
    if (result.status === 'not_found') {
      reply.code(404).send({ error: 'session_not_found' });
      return;
    }
    if (result.status === 'in_progress') {
      reply.code(409).send({ error: 'session_in_progress' });
      return;
    }

    reply.code(200).send(result.payload);
  });
}
