-- Migration: create sessions table
-- Satisfies: Requirements 3, 13

CREATE TABLE sessions (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  timer_id          uuid        NOT NULL REFERENCES timers(id) ON DELETE CASCADE,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time        timestamptz NOT NULL,
  end_time          timestamptz,
  duration_seconds  integer     CHECK (duration_seconds > 0),
  source            text        NOT NULL CHECK (source IN ('automatic', 'manual')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT end_after_start CHECK (end_time IS NULL OR end_time > start_time)
);

-- Enforce at most one active session per user (end_time IS NULL)
CREATE UNIQUE INDEX one_active_session_per_user
  ON sessions (user_id)
  WHERE end_time IS NULL;
