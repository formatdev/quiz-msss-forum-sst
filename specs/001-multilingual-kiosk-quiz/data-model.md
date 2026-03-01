# Data Model: Multilingual Touchscreen Quiz Kiosk App

## Entity: Question
- Purpose: Canonical question definition independent of language.
- Fields:
  - `id` (string, PK, immutable)
  - `type` (enum: `single`, `multiple`)
  - `topic_tag` (string, indexed)
  - `image_key` (string, nullable)
  - `display_order` (integer, > 0)
  - `is_active` (boolean, default `true`)
  - `created_at` (datetime)
  - `updated_at` (datetime)
- Validation rules:
  - `id` must be unique and stable across imports.
  - `type` must be `single` or `multiple`.
  - `display_order` must be positive.

## Entity: QuestionOption
- Purpose: Option set for a question with correctness marker.
- Fields:
  - `id` (string, PK)
  - `question_id` (FK -> `Question.id`, indexed)
  - `option_key` (string, e.g., `A`, `B`, `C`, `D`)
  - `is_correct` (boolean)
  - `display_order` (integer)
- Validation rules:
  - Each (`question_id`, `option_key`) pair unique.
  - `single` questions must have exactly one `is_correct=true`.
  - `multiple` questions must have at least one `is_correct=true`.

## Entity: QuestionTranslation
- Purpose: Localized text for question prompt, options, and explanation.
- Fields:
  - `id` (integer, PK)
  - `question_id` (FK -> `Question.id`, indexed)
  - `lang` (enum: `fr`, `de`, `en`)
  - `question_text` (text)
  - `explanation_text` (text)
  - `option_texts_json` (JSON map: `option_key` -> localized label)
- Validation rules:
  - Unique (`question_id`, `lang`).
  - `fr` translation required for every question.
  - Runtime fallback: any missing `de`/`en` field falls back to corresponding `fr` field.

## Entity: QuizSession
- Purpose: Anonymous gameplay session lifecycle.
- Fields:
  - `id` (string UUID, PK)
  - `lang` (enum: `fr`, `de`, `en`)
  - `nickname` (string, nullable, max 32)
  - `started_at` (datetime, indexed)
  - `completed_at` (datetime, nullable, indexed)
  - `total_score` (integer, default 0)
  - `max_score` (integer, default 0)
  - `percentage_score` (numeric(5,2), default 0)
  - `total_duration_ms` (integer, default 0)
  - `status` (enum: `in_progress`, `completed`, `abandoned`)
- Validation rules:
  - `nickname` optional and sanitized.
  - No personal data beyond optional nickname.
  - `completed_at` required when status is `completed`.

## Entity: SessionAnswer
- Purpose: Per-question response details and scoring.
- Fields:
  - `id` (integer, PK)
  - `session_id` (FK -> `QuizSession.id`, indexed)
  - `question_id` (FK -> `Question.id`, indexed)
  - `selected_option_keys_json` (JSON array)
  - `is_correct` (boolean)
  - `awarded_points` (integer, default 0)
  - `max_points` (integer, default 1)
  - `answered_at` (datetime)
  - `duration_ms` (integer)
- Validation rules:
  - Unique (`session_id`, `question_id`).
  - `selected_option_keys_json` cannot be empty.
  - `awarded_points` must be between 0 and `max_points`.

## Entity: ExportAudit
- Purpose: Operational audit trail for public export requests.
- Fields:
  - `id` (integer, PK)
  - `requested_at` (datetime, indexed)
  - `format` (enum: `csv`, `xlsx`)
  - `success` (boolean)
  - `rate_limited` (boolean, default `false`)
  - `source_ip_hash` (string, nullable)
- Validation rules:
  - Must not store raw credentials or personal data.

## Derived View: LeaderboardEntry
- Source: Completed `QuizSession` rows.
- Sort order:
  1. `total_score` descending
  2. `percentage_score` descending
  3. `total_duration_ms` ascending
  4. `completed_at` ascending
- Returned fields:
  - rank, nickname (or anonymous alias), total_score, max_score, percentage_score.

## Relationships
- `Question` 1:N `QuestionOption`
- `Question` 1:N `QuestionTranslation`
- `QuizSession` 1:N `SessionAnswer`
- `Question` 1:N `SessionAnswer`

## State Transitions

### QuizSession
- `in_progress` -> `completed`: all questions answered and final scoring persisted.
- `in_progress` -> `abandoned`: timeout/reset/event interruption with no completion.
- `completed` and `abandoned` are terminal states.

## Import/Seed Notes
- Word-derived JSON is transformed into:
  - `Question`
  - `QuestionOption`
  - `QuestionTranslation`
- Seed operation is idempotent:
  - upsert by stable question id and option key.
