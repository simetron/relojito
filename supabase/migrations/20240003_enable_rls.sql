-- Migration: enable RLS and create policies
-- Satisfies: Requirement 13 (AC 5)

-- Timers RLS
ALTER TABLE timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own timers"
  ON timers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sessions RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
