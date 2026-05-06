-- Migration: add is_active column to timers table
-- Allows users to archive timers without deleting them.
-- Archived timers are hidden from the dashboard but their sessions
-- remain visible in history and stats.

ALTER TABLE timers ADD COLUMN is_active boolean NOT NULL DEFAULT true;
