PRAGMA foreign_keys = OFF;

BEGIN IMMEDIATE;

CREATE TABLE questions_new (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('single','multiple','multiple_exact')),
  topic_tag TEXT NOT NULL,
  image_key TEXT,
  display_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  correct_option_keys_json TEXT NOT NULL DEFAULT '[]'
);

INSERT INTO questions_new (
  id,
  type,
  topic_tag,
  image_key,
  display_order,
  is_active,
  created_at,
  updated_at,
  correct_option_keys_json
)
SELECT
  id,
  type,
  topic_tag,
  image_key,
  display_order,
  is_active,
  created_at,
  updated_at,
  correct_option_keys_json
FROM questions;

DROP TABLE questions;
ALTER TABLE questions_new RENAME TO questions;

COMMIT;

PRAGMA foreign_keys = ON;
