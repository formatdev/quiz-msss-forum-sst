import { getDb } from '../db/client.js';
import type { LanguageCode } from '../i18n/fallback.js';

export type LeaderboardEntry = {
  sessionId: string;
  rank: number;
  nickname: string;
  score: number;
  maxScore: number;
  percentage: number;
};

export type ScoreDistributionBucket = {
  correctCount: number;
  users: number;
};

export type QuestionResultBucket = {
  questionId: string;
  questionNumber: number;
  questionText: string;
  totalPoints: number;
};

export type LeaderboardSummary = {
  entries: LeaderboardEntry[];
  maxScore: number;
  scoreDistribution: ScoreDistributionBucket[];
  questionResults: QuestionResultBucket[];
};

type LeaderboardRow = {
  id: string;
  nickname: string | null;
  total_score: number;
  max_score: number;
  percentage_score: number;
};

type MaxScoreRow = {
  max_score: number;
};

type ScoreDistributionRow = {
  correct_count: number;
  users: number;
};

type QuestionResultRow = {
  question_id: string;
  question_number: number;
  question_text: string | null;
  total_points: number;
};

function roundToHalfPoint(value: number): number {
  return Math.round(value * 2) / 2;
}

export class LeaderboardService {
  getTopEntries(eventId = 'default-event', limit = 10): LeaderboardEntry[] {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          id,
          nickname,
          total_score,
          max_score,
          percentage_score
        FROM sessions
        WHERE status = 'completed'
          AND event_id = ?
        ORDER BY
          total_score DESC,
          completed_at ASC,
          total_duration_ms ASC,
          id ASC
        LIMIT ?
        `
      )
      .all(eventId, limit) as LeaderboardRow[];

    return rows.map((row, index) => ({
      sessionId: row.id,
      rank: index + 1,
      nickname: row.nickname?.trim() || 'Anonymous',
      score: row.total_score,
      maxScore: row.max_score,
      percentage: Number(row.percentage_score.toFixed(2))
    }));
  }

  getSummary(eventId = 'default-event', limit = 10, lang: LanguageCode = 'fr'): LeaderboardSummary {
    const db = getDb();
    const entries = this.getTopEntries(eventId, limit);
    const maxScoreRow = db
      .prepare(
        `
        SELECT COALESCE(MAX(max_score), 0) AS max_score
        FROM sessions
        WHERE status = 'completed'
          AND event_id = ?
        `
      )
      .get(eventId) as MaxScoreRow | undefined;
    const maxScore = Number(maxScoreRow?.max_score ?? 0);

    if (maxScore <= 0) {
      return {
        entries,
        maxScore: 0,
        scoreDistribution: [],
        questionResults: []
      };
    }

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

    const scoreDistribution = Array.from({ length: maxScore * 2 + 1 }, (_, index) => {
      const correctCount = roundToHalfPoint(index / 2);
      return {
        correctCount,
        users: countsByScore.get(correctCount) ?? 0
      };
    });

    return {
      entries,
      maxScore,
      scoreDistribution,
      questionResults: this.getQuestionResults(eventId, maxScore, lang)
    };
  }

  getQuestionResults(
    eventId = 'default-event',
    maxScore = 0,
    lang: LanguageCode = 'fr'
  ): QuestionResultBucket[] {
    if (maxScore <= 0) {
      return [];
    }

    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT
          q.id AS question_id,
          q.display_order AS question_number,
          COALESCE(qt_req.question_text, qt_fr.question_text, q.id) AS question_text,
          COALESCE(SUM(CASE WHEN s.id IS NOT NULL THEN sa.awarded_points ELSE 0 END), 0) AS total_points
        FROM questions q
        LEFT JOIN question_translations qt_req
          ON qt_req.question_id = q.id
         AND qt_req.lang = ?
        LEFT JOIN question_translations qt_fr
          ON qt_fr.question_id = q.id
         AND qt_fr.lang = 'fr'
        LEFT JOIN session_answers sa
          ON sa.question_id = q.id
        LEFT JOIN sessions s
          ON s.id = sa.session_id
         AND s.status = 'completed'
         AND s.event_id = ?
         AND s.max_score = ?
        WHERE q.is_active = 1
        GROUP BY
          q.id,
          q.display_order,
          COALESCE(qt_req.question_text, qt_fr.question_text, q.id)
        ORDER BY q.display_order ASC, q.id ASC
        `
      )
      .all(lang, eventId, maxScore) as QuestionResultRow[];

    return rows.map((row) => ({
      questionId: row.question_id,
      questionNumber: Number(row.question_number) || 0,
      questionText: row.question_text ?? row.question_id,
      totalPoints: roundToHalfPoint(Number(row.total_points) || 0)
    }));
  }
}
