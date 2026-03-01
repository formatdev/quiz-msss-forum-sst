import type { LanguageCode } from '../i18n/fallback.js';
import { getDb } from '../db/client.js';

export type QuestionView = {
  questionId: string;
  type: 'single' | 'multiple';
  prompt: string;
  choices: Array<{ key: string; label: string }>;
  imageKey: string | null;
  progress: {
    current: number;
    total: number;
  };
};

export type QuestionAnswerContext = {
  questionId: string;
  type: 'single' | 'multiple';
  explanation: string;
  correctKeys: string[];
  validChoiceKeys: string[];
  alreadyAnswered: boolean;
};

type RawQuestionRow = {
  question_id: string;
  type: 'single' | 'multiple';
  image_key: string | null;
  question_text: string | null;
  option_texts_json: string | null;
  answered_count: number;
  total_count: number;
};

type RawAnswerContextRow = {
  question_id: string;
  type: 'single' | 'multiple';
  explanation_text: string | null;
  option_texts_json: string | null;
  correct_option_keys_json: string;
  already_answered: number;
};

export class QuestionRepository {
  countActiveQuestions(): number {
    const db = getDb();
    const row = db
      .prepare('SELECT COUNT(*) AS count FROM questions WHERE is_active = 1')
      .get() as { count: number };
    return row.count ?? 0;
  }

  findNextQuestion(sessionId: string, lang: LanguageCode): QuestionView | null {
    const db = getDb();
    const row = db
      .prepare(
        `
        WITH answered AS (
          SELECT COUNT(*) AS answered_count
          FROM session_answers
          WHERE session_id = ?
        ),
        total AS (
          SELECT COUNT(*) AS total_count
          FROM questions
          WHERE is_active = 1
        )
        SELECT
          q.id AS question_id,
          q.type AS type,
          q.image_key AS image_key,
          COALESCE(qt_req.question_text, qt_fr.question_text) AS question_text,
          COALESCE(qt_req.option_texts_json, qt_fr.option_texts_json) AS option_texts_json,
          (SELECT answered_count FROM answered) AS answered_count,
          (SELECT total_count FROM total) AS total_count
        FROM questions q
        LEFT JOIN session_answers sa
          ON sa.question_id = q.id AND sa.session_id = ?
        LEFT JOIN question_translations qt_req
          ON qt_req.question_id = q.id AND qt_req.lang = ?
        LEFT JOIN question_translations qt_fr
          ON qt_fr.question_id = q.id AND qt_fr.lang = 'fr'
        WHERE q.is_active = 1
          AND sa.id IS NULL
        ORDER BY q.display_order ASC
        LIMIT 1
        `
      )
      .get(sessionId, sessionId, lang) as RawQuestionRow | undefined;

    if (!row) {
      return null;
    }

    const choicesMap = JSON.parse(row.option_texts_json ?? '{}') as Record<string, string>;
    const choices = Object.entries(choicesMap).map(([key, label]) => ({ key, label }));
    const current = Math.min(row.total_count || 0, (row.answered_count || 0) + 1);

    return {
      questionId: row.question_id,
      type: row.type,
      prompt: row.question_text ?? '',
      choices,
      imageKey: row.image_key,
      progress: {
        current,
        total: row.total_count ?? 0
      }
    };
  }

  findQuestionAnswerContext(
    sessionId: string,
    questionId: string,
    lang: LanguageCode
  ): QuestionAnswerContext | null {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT
          q.id AS question_id,
          q.type AS type,
          COALESCE(qt_req.explanation_text, qt_fr.explanation_text) AS explanation_text,
          COALESCE(qt_req.option_texts_json, qt_fr.option_texts_json) AS option_texts_json,
          q.correct_option_keys_json AS correct_option_keys_json,
          EXISTS(
            SELECT 1
            FROM session_answers sa
            WHERE sa.session_id = ?
              AND sa.question_id = q.id
          ) AS already_answered
        FROM questions q
        LEFT JOIN question_translations qt_req
          ON qt_req.question_id = q.id AND qt_req.lang = ?
        LEFT JOIN question_translations qt_fr
          ON qt_fr.question_id = q.id AND qt_fr.lang = 'fr'
        WHERE q.id = ?
          AND q.is_active = 1
        LIMIT 1
        `
      )
      .get(sessionId, lang, questionId) as RawAnswerContextRow | undefined;

    if (!row) {
      return null;
    }

    const choices = JSON.parse(row.option_texts_json ?? '{}') as Record<string, string>;
    const correctKeys = JSON.parse(row.correct_option_keys_json ?? '[]') as string[];

    return {
      questionId: row.question_id,
      type: row.type,
      explanation: row.explanation_text ?? '',
      correctKeys,
      validChoiceKeys: Object.keys(choices),
      alreadyAnswered: Boolean(row.already_answered)
    };
  }

  hasRemainingQuestion(sessionId: string): boolean {
    const db = getDb();
    const row = db
      .prepare(
        `
        SELECT EXISTS(
          SELECT 1
          FROM questions q
          LEFT JOIN session_answers sa
            ON sa.question_id = q.id
           AND sa.session_id = ?
          WHERE q.is_active = 1
            AND sa.id IS NULL
        ) AS has_remaining
        `
      )
      .get(sessionId) as { has_remaining: number };

    return Boolean(row.has_remaining);
  }
}
