-- Migration: create timers table
-- Satisfies: Requirements 2, 10, 13

CREATE TABLE timers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 32),
  color       text        NOT NULL CHECK (color ~ '^#[0-9a-fA-F]{6}$'),
  icon        text        NOT NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
