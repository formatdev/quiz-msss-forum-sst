import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AnswerService } from '../services/answer-service.js';

const SessionParamSchema = z.object({
  sessionId: z.string().uuid()
});

const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedKeys: z.array(z.string().min(1)).min(1)
});

export async function registerAnswerRoutes(app: FastifyInstance): Promise<void> {
  const service = new AnswerService();

  app.post('/api/sessions/:sessionId/answers', async (request, reply) => {
    const params = SessionParamSchema.safeParse(request.params);
    const body = SubmitAnswerSchema.safeParse(request.body);

    if (!params.success || !body.success) {
      reply.code(400).send({
        error: 'invalid_request'
      });
      return;
    }

    const result = service.submitAnswer({
      sessionId: params.data.sessionId,
      questionId: body.data.questionId,
      selectedKeys: body.data.selectedKeys
    });

    if (result.status === 'not_found') {
      reply.code(404).send({ error: 'session_not_found' });
      return;
    }
    if (result.status === 'invalid_question') {
      reply.code(404).send({ error: 'question_not_found' });
      return;
    }
    if (result.status === 'already_answered') {
      reply.code(409).send({ error: 'question_already_answered' });
      return;
    }
    if (result.status === 'invalid_selection') {
      reply.code(400).send({ error: 'invalid_selection' });
      return;
    }

    reply.code(200).send(result.payload);
  });
}
