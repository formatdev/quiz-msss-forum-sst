import crypto from 'node:crypto';
import { getDb } from '../db/client.js';
import { getEnv } from '../config/env.js';
import { normalizeLanguage, type LanguageCode } from '../i18n/fallback.js';
import { QuestionRepository } from '../repositories/question-repository.js';
import { metrics } from '../observability/metrics.js';

export type StartSessionInput = {
  lang: string;
  nickname?: string;
  resumeSessionId?: string;
};

export type StartSessionResult = {
  sessionId: string;
  totalQuestions: number;
  startedAt: string;
  resumed: boolean;
};

type SessionRow = {
  id: string;
  lang: LanguageCode;
  started_at: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  last_activity_at: string | null;
};

export class SessionService {
  constructor(private readonly questionRepository = new QuestionRepository()) {}

  startSession(input: StartSessionInput): StartSessionResult {
    const db = getDb();
    const nowIso = new Date().toISOString();
    const lang = normalizeLanguage(input.lang);
    const resumeTimeoutMs = getEnv().RESUME_TIMEOUT_SECONDS * 1000;
    const nickname = input.nickname?.trim().slice(0, 32);

    if (input.resumeSessionId) {
      const candidate = db
        .prepare(
          `
          SELECT id, lang, started_at, status, last_activity_at
          FROM sessions
          WHERE id = ?
          `
        )
        .get(input.resumeSessionId) as SessionRow | undefined;

      if (candidate && candidate.status === 'in_progress') {
        const last = candidate.last_activity_at ?? candidate.started_at;
        const ageMs = Date.now() - new Date(last).getTime();
        if (ageMs <= resumeTimeoutMs) {
          db.prepare('UPDATE sessions SET last_activity_at = ? WHERE id = ?').run(nowIso, candidate.id);
          const totalQuestions = this.questionRepository.countActiveQuestions();
          return {
            sessionId: candidate.id,
            totalQuestions,
            startedAt: candidate.started_at,
            resumed: true
          };
        }
        db.prepare(
          "UPDATE sessions SET status = 'abandoned', completed_at = ?, last_activity_at = ? WHERE id = ?"
        ).run(nowIso, nowIso, candidate.id);
      }
    }

    const sessionId = crypto.randomUUID();
    db.prepare(
      `
      INSERT INTO sessions (
        id, lang, nickname, started_at, last_activity_at, status
      ) VALUES (?, ?, ?, ?, ?, 'in_progress')
      `
    ).run(sessionId, lang, nickname ?? null, nowIso, nowIso);
    metrics.increment('session_started');

    return {
      sessionId,
      totalQuestions: this.questionRepository.countActiveQuestions(),
      startedAt: nowIso,
      resumed: false
    };
  }

  getNextQuestion(sessionId: string) {
    const db = getDb();
    const session = db
      .prepare('SELECT id, lang, status FROM sessions WHERE id = ?')
      .get(sessionId) as { id: string; lang: LanguageCode; status: string } | undefined;

    if (!session) {
      return { status: 'not_found' as const, question: null };
    }
    if (session.status === 'completed') {
      return { status: 'complete' as const, question: null };
    }
    if (session.status !== 'in_progress') {
      return { status: 'not_found' as const, question: null };
    }

    const question = this.questionRepository.findNextQuestion(session.id, session.lang);
    const nowIso = new Date().toISOString();
    db.prepare('UPDATE sessions SET last_activity_at = ? WHERE id = ?').run(nowIso, session.id);

    if (!question) {
      return { status: 'complete' as const, question: null };
    }

    return { status: 'ok' as const, question };
  }
}
