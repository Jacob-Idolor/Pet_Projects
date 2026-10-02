-- Session IDs are private bearer references. No public database access or payload logging.
CREATE TABLE IF NOT EXISTS delivery_jobs (
  session_id TEXT PRIMARY KEY,
  first_event_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER,
  sent_at INTEGER
);
CREATE INDEX IF NOT EXISTS delivery_jobs_pending ON delivery_jobs(status, next_attempt_at);
