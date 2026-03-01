CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK(type IN ('single','multiple')),
  topic_tag TEXT NOT NULL,
  image_key TEXT,
  display_order INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_translations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id TEXT NOT NULL,
  lang TEXT NOT NULL CHECK(lang IN ('fr','de','en')),
  question_text TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  option_texts_json TEXT NOT NULL,
  UNIQUE(question_id, lang),
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  lang TEXT NOT NULL CHECK(lang IN ('fr','de','en')),
  nickname TEXT,
  event_id TEXT NOT NULL DEFAULT 'default-event',
  started_at TEXT NOT NULL,
  completed_at TEXT,
  total_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  percentage_score REAL NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK(status IN ('in_progress','completed','abandoned'))
);

CREATE TABLE IF NOT EXISTS session_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_keys_json TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  awarded_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL DEFAULT 1,
  answered_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  UNIQUE(session_id, question_id),
  FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS export_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  requested_at TEXT NOT NULL,
  format TEXT NOT NULL CHECK(format IN ('csv','xlsx')),
  success INTEGER NOT NULL,
  rate_limited INTEGER NOT NULL DEFAULT 0,
  source_ip_hash TEXT
);
