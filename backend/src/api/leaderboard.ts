import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LeaderboardService } from '../services/leaderboard-service.js';

const LeaderboardQuerySchema = z.object({
  lang: z.enum(['fr', 'de', 'en']).optional()
});

export async function registerLeaderboardRoutes(app: FastifyInstance): Promise<void> {
  const service = new LeaderboardService();

  app.get('/api/leaderboard', async (request, reply) => {
    const query = LeaderboardQuerySchema.safeParse(request.query);
    if (!query.success) {
      reply.code(400).send({ error: 'invalid_request' });
      return;
    }
    const summary = service.getSummary('default-event', 10, query.data.lang ?? 'fr');
    return {
      entries: summary.entries,
      maxScore: summary.maxScore,
      scoreDistribution: summary.scoreDistribution,
      questionResults: summary.questionResults
    };
  });
}
