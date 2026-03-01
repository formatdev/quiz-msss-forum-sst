import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from '../db/client.js';
import { getEnv } from '../config/env.js';
import type { LanguageCode } from '../i18n/fallback.js';
import { buildSessionExportCsv } from './session-csv-export-service.js';

type SeedTranslation = {
  question: string;
  explanation: string;
  choices: Record<string, string>;
};

type SeedQuestion = {
  id: string;
  type: 'single' | 'multiple';
  topicTag: string;
  imageKey?: string;
  imagePrompt?: string;
  translations: Partial<Record<LanguageCode, SeedTranslation>>;
  correctAnswers: string[];
};

export type InitializeResult = {
  dumpPath: string;
  dumpFile: string;
  csvDumpPath: string;
  csvDumpFile: string;
  seedPath: string;
  seededQuestions: number;
  clearedSessions: number;
};

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const defaultSeedPath = path.resolve(backendRoot, '..', 'data', 'questions.seed.json');

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function quoteSqlString(raw: string): string {
  return `'${raw.replaceAll("'", "''")}'`;
}

function validateQuestion(question: SeedQuestion): string[] {
  const issues: string[] = [];

  if (!question.id?.trim()) {
    issues.push('Each question must have a non-empty id.');
    return issues;
  }
  if (!question.topicTag?.trim()) {
    issues.push(`Question ${question.id} must have a non-empty topicTag.`);
  }
  if (!question.translations.fr) {
    issues.push(`Question ${question.id} is missing required FR translation.`);
    return issues;
  }

  const canonicalChoiceKeys = Object.keys(question.translations.fr.choices ?? {});
  if (canonicalChoiceKeys.length < 2) {
    issues.push(`Question ${question.id} must have at least 2 FR choices.`);
  }

  if (!Array.isArray(question.correctAnswers) || question.correctAnswers.length === 0) {
    issues.push(`Question ${question.id} must have at least one correct answer.`);
  } else {
    const hasAnyWildcard = question.correctAnswers.some(
      (answer) => answer?.trim().toLowerCase() === 'any'
    );
    if (hasAnyWildcard && question.correctAnswers.length !== 1) {
      issues.push(`Question ${question.id} uses "Any" and cannot include other correct answers.`);
    }
    if (question.type === 'single' && question.correctAnswers.length !== 1) {
      issues.push(
        `Question ${question.id} is type "single" but has ${question.correctAnswers.length} correct answers.`
      );
    }
  }

  for (const correct of question.correctAnswers) {
    if (correct?.trim().toLowerCase() === 'any') {
      continue;
    }
    if (!canonicalChoiceKeys.includes(correct)) {
      issues.push(
        `Question ${question.id} has correct answer "${correct}" not present in FR choices.`
      );
    }
  }

  for (const [lang, translation] of Object.entries(question.translations)) {
    if (!translation) {
      continue;
    }
    const currentKeys = Object.keys(translation.choices ?? {});
    for (const canonicalKey of canonicalChoiceKeys) {
      if (!currentKeys.includes(canonicalKey)) {
        issues.push(
          `Question ${question.id} translation "${lang}" is missing choice "${canonicalKey}".`
        );
      }
    }
    for (const currentKey of currentKeys) {
      if (!canonicalChoiceKeys.includes(currentKey)) {
        issues.push(
          `Question ${question.id} translation "${lang}" has unexpected choice "${currentKey}".`
        );
      }
    }
    if (!translation.question?.trim()) {
      issues.push(`Question ${question.id} translation "${lang}" has empty question text.`);
    }
    if (!translation.explanation?.trim()) {
      issues.push(`Question ${question.id} translation "${lang}" has empty explanation text.`);
    }
  }

  return issues;
}

function parseSeedFile(filePath: string): SeedQuestion[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as SeedQuestion[];
  if (!Array.isArray(parsed)) {
    throw new Error('Seed file root must be an array.');
  }

  const allIds = parsed.map((question) => question.id);
  const ids = unique(allIds);
  const issues: string[] = [];
  if (ids.length !== parsed.length) {
    const duplicateIds = [...new Set(allIds.filter((id, idx) => allIds.indexOf(id) !== idx))];
    issues.push(`Seed file contains duplicate question ids: ${duplicateIds.join(', ')}`);
  }

  for (const question of parsed) {
    issues.push(...validateQuestion(question));
  }

  if (issues.length > 0) {
    throw new Error(`Seed validation failed with ${issues.length} issue(s):\n- ${issues.join('\n- ')}`);
  }

  return parsed;
}

function clearDataAndSeedQuestions(questions: SeedQuestion[]): number {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const sessionCountRow = db.prepare('SELECT COUNT(*) AS count FROM sessions').get() as { count: number };
  const clearedSessions = Number(sessionCountRow.count) || 0;

  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`
      DELETE FROM session_answers;
      DELETE FROM sessions;
      DELETE FROM export_audit;
      DELETE FROM question_translations;
      DELETE FROM questions;
    `);

    for (const [index, question] of questions.entries()) {
      const image = question.imageKey ?? question.imagePrompt ?? null;
      const normalizedCorrectAnswers = JSON.stringify(unique(question.correctAnswers));

      db.prepare(
        `
        INSERT INTO questions (
          id, type, topic_tag, image_key, display_order, is_active, correct_option_keys_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        `
      ).run(
        question.id,
        question.type,
        question.topicTag,
        image,
        index + 1,
        normalizedCorrectAnswers,
        nowIso,
        nowIso
      );

      for (const [lang, translation] of Object.entries(question.translations)) {
        if (!translation) {
          continue;
        }
        db.prepare(
          `
          INSERT INTO question_translations (
            question_id, lang, question_text, explanation_text, option_texts_json
          ) VALUES (?, ?, ?, ?, ?)
          `
        ).run(
          question.id,
          lang,
          translation.question,
          translation.explanation,
          JSON.stringify(translation.choices)
        );
      }
    }

    db.exec('COMMIT');
    return clearedSessions;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export class AdminInitializeService {
  initialize(seedPath = defaultSeedPath): InitializeResult {
    const questions = parseSeedFile(seedPath);
    const env = getEnv();
    const dbPath = path.resolve(env.DB_PATH);
    const dumpDir = path.join(path.dirname(dbPath), 'dumps');
    fs.mkdirSync(dumpDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dumpFile = `quiz-db-dump-${timestamp}.sqlite`;
    const dumpPath = path.join(dumpDir, dumpFile);
    const csvDumpFile = `quiz-db-export-${timestamp}.csv`;
    const csvDumpPath = path.join(dumpDir, csvDumpFile);

    const db = getDb();
    db.exec(`VACUUM INTO ${quoteSqlString(dumpPath)}`);
    const csv = buildSessionExportCsv();
    fs.writeFileSync(csvDumpPath, csv, 'utf8');

    const clearedSessions = clearDataAndSeedQuestions(questions);

    return {
      dumpPath,
      dumpFile,
      csvDumpPath,
      csvDumpFile,
      seedPath: path.resolve(seedPath),
      seededQuestions: questions.length,
      clearedSessions
    };
  }
}
