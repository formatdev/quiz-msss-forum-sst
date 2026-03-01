import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import { metrics } from '../observability/metrics.js';
import { AdminInitializeService } from '../services/admin-initialize-service.js';
import { buildSessionExportCsv } from '../services/session-csv-export-service.js';
import { exportRateLimit } from './middleware/rate-limit.js';

function insertAudit(success: boolean): void {
  const db = getDb();
  db.prepare(
    `
    INSERT INTO export_audit (requested_at, format, success, rate_limited, source_ip_hash)
    VALUES (?, 'csv', ?, 0, NULL)
    `
  ).run(new Date().toISOString(), success ? 1 : 0);
}

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  const initializeService = new AdminInitializeService();

  app.get('/api/admin/export.csv', { preHandler: exportRateLimit }, async (_request, reply) => {
    try {
      const csv = buildSessionExportCsv();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      metrics.increment('export_downloaded');
      insertAudit(true);
      reply
        .code(200)
        .header('Content-Type', 'text/csv; charset=utf-8')
        .header('Content-Disposition', `attachment; filename="quiz-sessions-${timestamp}.csv"`)
        .send(csv);
    } catch {
      insertAudit(false);
      reply.code(500).send({ error: 'export_failed' });
    }
  });

  app.post('/api/admin/initialize', async (_request, reply) => {
    try {
      const result = initializeService.initialize();
      metrics.increment('admin_initialized');
      reply.code(200).send(result);
    } catch (error) {
      reply.code(500).send({
        error: 'initialize_failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
