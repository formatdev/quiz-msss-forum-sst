ALTER TABLE sessions ADD COLUMN last_activity_at TEXT;

UPDATE sessions
SET last_activity_at = started_at
WHERE last_activity_at IS NULL;
