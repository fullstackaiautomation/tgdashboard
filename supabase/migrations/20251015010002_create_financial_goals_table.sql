-- Financial Goals Table for savings goals tracking
-- Required for financial goals progress in Finances Area Card

CREATE TABLE IF NOT EXISTS financial_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  active BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_active ON financial_goals(user_id, active);
CREATE INDEX IF NOT EXISTS idx_financial_goals_user_deadline ON financial_goals(user_id, deadline);

-- RLS Policies
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own goals" ON financial_goals;
CREATE POLICY "Users can manage their own goals"
  ON financial_goals FOR ALL
  USING (auth.uid() = user_id);
