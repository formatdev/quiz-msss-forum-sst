CREATE INDEX IF NOT EXISTS idx_sessions_status_event_leaderboard
ON sessions (
  status,
  event_id,
  total_score DESC,
  completed_at ASC,
  total_duration_ms ASC,
  id ASC
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_event_maxscore_halfscore
ON sessions (
  status,
  event_id,
  max_score,
  ROUND(total_score, 1)
);

CREATE INDEX IF NOT EXISTS idx_sessions_status_event_maxscore_desc
ON sessions (
  status,
  event_id,
  max_score DESC
);
