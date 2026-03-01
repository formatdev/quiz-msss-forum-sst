import { getDb } from '../db/client.js';
import { QuestionRepository } from '../repositories/question-repository.js';
import { scoreQuestion } from '../scoring/score.js';
import { metrics } from '../observability/metrics.js';
import { LeaderboardService, type LeaderboardEntry } from './leaderboard-service.js';
import type { LanguageCode } from '../i18n/fallback.js';

const QUESTION_MAX_POINTS = 1;
const PARTIAL_POINTS = 0.5;

type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

type SessionRow = {
  id: string;
  lang: LanguageCode;
  status: SessionStatus;
  started_at: string;
  last_activity_at: string | null;
  event_id: string;
  total_score: number;
  max_score: number;
  percentage_score: number;
};

type AggregateRow = {
  total_score: number;
  max_score: number;
  total_duration_ms: number;
};

type ScoreDistributionRow = {
  correct_count: number;
  users: number;
};

function roundToHalfPoint(value: number): number {
  return Math.round(value * 2) / 2;
}

function getAwardedPoints(ratio: number): number {
  if (ratio >= 1) {
    return QUESTION_MAX_POINTS;
  }
  if (ratio > 0) {
    return PARTIAL_POINTS;
  }
  return 0;
}

function isAnyCorrectMode(correctKeys: string[]): boolean {
  return correctKeys.length === 1 && correctKeys[0]?.trim().toLowerCase() === 'any';
}

export type SubmitAnswerInput = {
  sessionId: string;
  questionId: string;
  selectedKeys: string[];
};

export type SubmitAnswerResult =
  | { status: 'not_found' }
  | { status: 'invalid_question' }
  | { status: 'already_answered' }
  | { status: 'invalid_selection' }
  | {
      status: 'ok';
      payload: {
        correct: boolean;
        awardedPoints: number;
        maxPoints: number;
        hasMoreQuestions: boolean;
        correctKeys: string[];
        explanation: string;
        friendlyFeedback: string;
      };
    };

export type SessionResult =
  | { status: 'not_found' }
  | { status: 'in_progress' }
  | {
      status: 'ok';
      payload: {
        score: number;
        maxScore: number;
        percentage: number;
        scoreDistribution: Array<{ correctCount: number; users: number }>;
        questionResults: Array<{
          questionId: string;
          questionNumber: number;
          questionText: string;
          totalPoints: number;
        }>;
        leaderboard: LeaderboardEntry[];
      };
    };

function getFeedback(lang: LanguageCode, correct: boolean): string {
  if (correct) {
    if (lang === 'de') return 'Super! Du hast die richtige Antwort gefunden.';
    if (lang === 'en') return 'Great job! You picked the correct answer.';
    return 'Bravo! Tu as trouve la bonne reponse.';
  }
  if (lang === 'de') return 'Gute Idee! Schau dir die Erklarung an und versuch es weiter.';
  if (lang === 'en') return 'Nice try! Check the explanation and keep going.';
  return 'Bien essaye! Lis l explication et continue.';
}

function computeDurationMs(previousActivity: string | null, fallbackStart: string): number {
  const from = previousActivity ?? fallbackStart;
  const duration = Date.now() - new Date(from).getTime();
  if (!Number.isFinite(duration) || duration < 0) {
    return 0;
  }
  return duration;
}

function isDuplicateSessionAnswerError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return (
    message.includes('unique') &&
    message.includes('session_answers') &&
    message.includes('session_id') &&
    message.includes('question_id')
  );
}

export class AnswerService {
  constructor(
    private readonly questionRepository = new QuestionRepository(),
    private readonly leaderboardService = new LeaderboardService()
  ) {}

  submitAnswer(input: SubmitAnswerInput): SubmitAnswerResult {
    const db = getDb();
    const nowIso = new Date().toISOString();

    const session = db
      .prepare(
        `
        SELECT
          id,
          lang,
          status,
          started_at,
          last_activity_at,
          event_id,
          total_score,
          max_score,
          percentage_score
        FROM sessions
        WHERE id = ?
        `
      )
      .get(input.sessionId) as SessionRow | undefined;

    if (!session || session.status !== 'in_progress') {
      return { status: 'not_found' };
    }

    const question = this.questionRepository.findQuestionAnswerContext(
      input.sessionId,
      input.questionId,
      session.lang
    );

    if (!question) {
      return { status: 'invalid_question' };
    }
    if (question.alreadyAnswered) {
      return { status: 'already_answered' };
    }

    const uniqueKeys = [...new Set(input.selectedKeys.map((key) => key.trim()).filter(Boolean))];
    if (uniqueKeys.length === 0) {
      return { status: 'invalid_selection' };
    }
    const validChoiceSet = new Set(question.validChoiceKeys);
    const hasInvalidChoice = uniqueKeys.some((key) => !validChoiceSet.has(key));
    if (hasInvalidChoice) {
      return { status: 'invalid_selection' };
    }

    const anyCorrectMode = isAnyCorrectMode(question.correctKeys);
    const ratio = anyCorrectMode ? 1 : scoreQuestion(question.type, uniqueKeys, question.correctKeys);
    const awardedPoints = getAwardedPoints(ratio);
    const isCorrect = awardedPoints >= QUESTION_MAX_POINTS;
    const durationMs = computeDurationMs(session.last_activity_at, session.started_at);

    try {
      db.prepare(
        `
        INSERT INTO session_answers (
          session_id,
          question_id,
          selected_option_keys_json,
          is_correct,
          awarded_points,
          max_points,
          answered_at,
          duration_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      ).run(
        input.sessionId,
        input.questionId,
        JSON.stringify(uniqueKeys),
        isCorrect ? 1 : 0,
        awardedPoints,
        QUESTION_MAX_POINTS,
        nowIso,
        durationMs
      );
    } catch (error) {
      if (isDuplicateSessionAnswerError(error)) {
        return { status: 'already_answered' };
      }
      throw error;
    }
    db.prepare('UPDATE sessions SET last_activity_at = ? WHERE id = ?').run(nowIso, input.sessionId);

    const hasMoreQuestions = this.questionRepository.hasRemainingQuestion(input.sessionId);
    if (!hasMoreQuestions) {
      this.completeSession(input.sessionId, nowIso);
    }

    return {
      status: 'ok',
      payload: {
        correct: isCorrect,
        awardedPoints,
        maxPoints: QUESTION_MAX_POINTS,
        hasMoreQuestions,
        correctKeys: question.correctKeys,
        explanation: question.explanation,
        friendlyFeedback: getFeedback(session.lang, isCorrect)
      }
    };
  }

  getSessionResult(sessionId: string): SessionResult {
    const db = getDb();
    const session = db
      .prepare(
        `
        SELECT
          id,
          lang,
          status,
          started_at,
          last_activity_at,
          event_id,
          total_score,
          max_score,
          percentage_score
        FROM sessions
        WHERE id = ?
        `
      )
      .get(sessionId) as SessionRow | undefined;

    if (!session) {
      return { status: 'not_found' };
    }
    if (session.status === 'in_progress') {
      return { status: 'in_progress' };
    }

    return {
      status: 'ok',
      payload: {
        score: session.total_score,
        maxScore: session.max_score,
        percentage: Number(session.percentage_score.toFixed(2)),
        scoreDistribution: this.getScoreDistribution(session.event_id, session.max_score),
        questionResults: this.leaderboardService.getQuestionResults(
          session.event_id,
          session.max_score,
          session.lang
        ),
        leaderboard: this.leaderboardService.getTopEntries(session.event_id, 10)
      }
    };
  }

  private completeSession(sessionId: string, completedAtIso: string): void {
    const db = getDb();
    const aggregate = db
      .prepare(
        `
        SELECT
          COALESCE(SUM(awarded_points), 0) AS total_score,
          COUNT(*) AS max_score,
          COALESCE(SUM(duration_ms), 0) AS total_duration_ms
        FROM session_answers
        WHERE session_id = ?
        `
      )
      .get(sessionId) as AggregateRow;

    const totalScore = roundToHalfPoint(Number(aggregate.total_score) || 0);
    const maxScore = Number(aggregate.max_score) || 0;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

    db.prepare(
      `
      UPDATE sessions
      SET
        status = 'completed',
        completed_at = ?,
        last_activity_at = ?,
        total_score = ?,
        max_score = ?,
        percentage_score = ?,
        total_duration_ms = ?
      WHERE id = ?
      `
    ).run(
      completedAtIso,
      completedAtIso,
      totalScore,
      maxScore,
      percentage,
      aggregate.total_duration_ms,
      sessionId
    );
    metrics.increment('session_completed');
  }

  private getScoreDistribution(eventId: string, maxScore: number): Array<{ correctCount: number; users: number }> {
    if (maxScore <= 0) {
      return [];
    }

    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          ROUND(total_score, 1) AS correct_count,
          COUNT(*) AS users
        FROM sessions
        WHERE status = 'completed'
          AND event_id = ?
          AND max_score = ?
        GROUP BY ROUND(total_score, 1)
        `
      )
      .all(eventId, maxScore) as ScoreDistributionRow[];

    const countsByScore = new Map<number, number>();
    for (const row of rows) {
      const score = roundToHalfPoint(Number(row.correct_count));
      if (!Number.isFinite(score) || score < 0 || score > maxScore) {
        continue;
      }
      countsByScore.set(score, Number(row.users) || 0);
    }

    return Array.from({ length: maxScore * 2 + 1 }, (_, index) => {
      const correctCount = roundToHalfPoint(index / 2);
      return {
        correctCount,
        users: countsByScore.get(correctCount) ?? 0
      };
    });
  }
}
