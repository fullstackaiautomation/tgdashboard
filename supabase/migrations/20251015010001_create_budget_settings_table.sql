-- Budget Settings Table for tracking monthly budget limits
-- Required for budget status calculation in Finances Area Card

CREATE TABLE IF NOT EXISTS budget_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_budget NUMERIC NOT NULL DEFAULT 0,
  category_budgets JSONB DEFAULT '{}'::JSONB, -- { "Housing": 2000, "Food": 800, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own budget" ON budget_settings;
CREATE POLICY "Users can manage their own budget"
  ON budget_settings FOR ALL
  USING (auth.uid() = user_id);
