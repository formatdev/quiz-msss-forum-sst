import fs from 'node:fs';
import path from 'node:path';
import { getEnv, resetEnvForTests } from '../backend/src/config/env.js';
import { getDb, resetDbForTests } from '../backend/src/db/client.js';
import { runMigrations } from '../backend/src/db/migrate.js';
import type { LanguageCode } from '../backend/src/i18n/fallback.js';

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

function getArgValue(name: string): string | null {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) {
    return direct.slice(name.length + 1);
  }
  const index = process.argv.findIndex((arg) => arg === name);
  if (index >= 0 && process.argv[index + 1]) {
    return process.argv[index + 1];
  }
  return null;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
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
    if (question.type === 'multiple' && question.correctAnswers.length < 1) {
      issues.push(`Question ${question.id} is type "multiple" but has no correct answers.`);
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
    for (const [choiceKey, choiceLabel] of Object.entries(translation.choices ?? {})) {
      if (!choiceLabel?.trim()) {
        issues.push(
          `Question ${question.id} translation "${lang}" has empty label for choice "${choiceKey}".`
        );
      }
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

function seedQuestions(questions: SeedQuestion[], deactivateMissing: boolean): void {
  runMigrations();
  const db = getDb();
  const nowIso = new Date().toISOString();

  db.exec('BEGIN');
  try {
    for (const [index, question] of questions.entries()) {
      const image = question.imageKey ?? question.imagePrompt ?? null;
      const normalizedCorrectAnswers = JSON.stringify(unique(question.correctAnswers));
      db.prepare(
        `
        INSERT INTO questions (
          id, type, topic_tag, image_key, display_order, is_active, correct_option_keys_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          type = excluded.type,
          topic_tag = excluded.topic_tag,
          image_key = excluded.image_key,
          display_order = excluded.display_order,
          is_active = 1,
          correct_option_keys_json = excluded.correct_option_keys_json,
          updated_at = excluded.updated_at
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

      db.prepare('DELETE FROM question_translations WHERE question_id = ?').run(question.id);
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

    if (deactivateMissing) {
      const ids = questions.map((question) => question.id);
      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ');
        db.prepare(
          `
          UPDATE questions
          SET is_active = 0, updated_at = ?
          WHERE id NOT IN (${placeholders})
          `
        ).run(nowIso, ...ids);
      }
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function main(): void {
  const inputArg = getArgValue('--input') ?? './data/questions.seed.json';
  const dbPathArg = getArgValue('--db-path');
  const deactivateMissing = process.argv.includes('--deactivate-missing');
  const resolvedInput = path.resolve(inputArg);

  if (dbPathArg) {
    process.env.DB_PATH = dbPathArg;
    resetEnvForTests();
    resetDbForTests();
  }

  const questions = parseSeedFile(resolvedInput);
  seedQuestions(questions, deactivateMissing);

  const env = getEnv();
  process.stdout.write(
    `Seeded ${questions.length} questions into ${path.resolve(env.DB_PATH)} from ${resolvedInput}\n`
  );
  if (!deactivateMissing) {
    process.stdout.write(
      'Note: questions not present in the seed file remain active unless you pass --deactivate-missing.\n'
    );
  }
}

main();
