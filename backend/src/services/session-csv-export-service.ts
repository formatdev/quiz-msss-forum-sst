import { getDb } from '../db/client.js';

type ExportRow = {
  session_id: string;
  nickname: string | null;
  lang: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_score: number;
  max_score: number;
  percentage_score: number;
  total_duration_ms: number;
  answers_count: number;
};

type QuestionIdRow = {
  id: string;
};

type SessionAnswerRow = {
  session_id: string;
  question_id: string;
  selected_option_keys_json: string;
  is_correct: number;
};

function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  const raw = String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replaceAll('"', '""')}"`;
  }
  return raw;
}

function parseSelectedKeys(rawJson: string): string {
  try {
    const parsed = JSON.parse(rawJson) as unknown;
    if (!Array.isArray(parsed)) {
      return '';
    }
    const values = parsed
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);
    return values.join(', ');
  } catch {
    return '';
  }
}

function buildAnswerMatrix(rows: SessionAnswerRow[]): Map<string, Map<string, { answer: string; correct: 0 | 1 }>> {
  const matrix = new Map<string, Map<string, { answer: string; correct: 0 | 1 }>>();
  for (const row of rows) {
    if (!matrix.has(row.session_id)) {
      matrix.set(row.session_id, new Map());
    }
    matrix.get(row.session_id)?.set(row.question_id, {
      answer: parseSelectedKeys(row.selected_option_keys_json),
      correct: row.is_correct ? 1 : 0
    });
  }
  return matrix;
}

function buildCsv(rows: ExportRow[], questionIds: string[], answerRows: SessionAnswerRow[]): string {
  const baseHeader = [
    'session_id',
    'nickname',
    'lang',
    'status',
    'started_at',
    'completed_at',
    'total_score',
    'max_score',
    'percentage_score',
    'total_duration_ms',
    'answers_count'
  ];
  const questionHeader = questionIds.flatMap((questionId) => [`${questionId}-answer`, `${questionId}-correct`]);
  const header = [...baseHeader, ...questionHeader];
  const answerMatrix = buildAnswerMatrix(answerRows);

  const lines = rows.map((row) =>
    [
      row.session_id,
      row.nickname ?? '',
      row.lang,
      row.status,
      row.started_at,
      row.completed_at ?? '',
      row.total_score,
      row.max_score,
      Number(row.percentage_score.toFixed(2)),
      row.total_duration_ms,
      row.answers_count,
      ...questionIds.flatMap((questionId) => {
        const answer = answerMatrix.get(row.session_id)?.get(questionId);
        return [answer?.answer ?? '', answer?.correct ?? 0];
      })
    ]
      .map((value) => escapeCsv(value))
      .join(',')
  );

  return [header.join(','), ...lines].join('\n');
}

export function buildSessionExportCsv(): string {
  const db = getDb();
  const questions = db
    .prepare(
      `
      SELECT id
      FROM questions
      ORDER BY display_order ASC, id ASC
      `
    )
    .all() as QuestionIdRow[];
  const questionIds = questions.map((question) => question.id);

  const rows = db
    .prepare(
      `
      SELECT
        s.id AS session_id,
        s.nickname AS nickname,
        s.lang AS lang,
        s.status AS status,
        s.started_at AS started_at,
        s.completed_at AS completed_at,
        s.total_score AS total_score,
        s.max_score AS max_score,
        s.percentage_score AS percentage_score,
        s.total_duration_ms AS total_duration_ms,
        COUNT(sa.id) AS answers_count
      FROM sessions s
      LEFT JOIN session_answers sa
        ON sa.session_id = s.id
      GROUP BY
        s.id,
        s.nickname,
        s.lang,
        s.status,
        s.started_at,
        s.completed_at,
        s.total_score,
        s.max_score,
        s.percentage_score,
        s.total_duration_ms
      ORDER BY s.started_at DESC
      `
    )
    .all() as ExportRow[];

  const answerRows = db
    .prepare(
      `
      SELECT
        session_id,
        question_id,
        selected_option_keys_json,
        is_correct
      FROM session_answers
      `
    )
    .all() as SessionAnswerRow[];

  return buildCsv(rows, questionIds, answerRows);
}
