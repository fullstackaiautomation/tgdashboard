-- Finance System Schema
-- Tracks accounts and weekly balance snapshots for net worth calculation

-- Account Types Table
CREATE TABLE IF NOT EXISTS account_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('asset', 'liability')),
  subcategory TEXT CHECK (subcategory IN ('cash', 'investment', 'physical_asset', 'credit_card', 'personal_loan', 'auto_loan', 'tax')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type_id UUID REFERENCES account_types(id),
  category TEXT CHECK (category IN ('asset', 'liability')) NOT NULL,
  subcategory TEXT CHECK (subcategory IN ('cash', 'investment', 'physical_asset', 'credit_card', 'personal_loan', 'auto_loan', 'tax')) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  credit_limit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_name)
);

-- Add credit_limit column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'accounts' AND column_name = 'credit_limit'
  ) THEN
    ALTER TABLE accounts ADD COLUMN credit_limit NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Balance Snapshots Table (Weekly tracking)
CREATE TABLE IF NOT EXISTS balance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL,
  snapshot_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_category ON accounts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_user_date ON balance_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_balance_snapshots_account_date ON balance_snapshots(account_id, snapshot_date DESC);

-- RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON accounts;
CREATE POLICY "Users can manage their own accounts"
  ON accounts FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE balance_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own balance snapshots" ON balance_snapshots;
CREATE POLICY "Users can manage their own balance snapshots"
  ON balance_snapshots FOR ALL
  USING (auth.uid() = user_id);

-- Function: Get Net Worth Summary for a specific date
CREATE OR REPLACE FUNCTION get_net_worth_summary(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_assets NUMERIC,
  total_liabilities NUMERIC,
  net_worth NUMERIC,
  cash_on_hand NUMERIC,
  credit_cards_owed NUMERIC,
  owed_cash NUMERIC,
  cash_total NUMERIC
) AS $$
DECLARE
  v_car_value NUMERIC;
  v_auto_loan NUMERIC;
BEGIN
  RETURN QUERY
  WITH latest_balances AS (
    SELECT
      a.id,
      a.account_name,
      a.category,
      a.subcategory,
      COALESCE(bs.balance, 0) as balance
    FROM accounts a
    LEFT JOIN LATERAL (
      SELECT balance
      FROM balance_snapshots
      WHERE account_id = a.id
        AND snapshot_date <= p_date
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) bs ON true
    WHERE a.user_id = p_user_id
      AND a.is_active = true
  ),
  calculations AS (
    SELECT
      -- Total Assets (all positive accounts)
      COALESCE(SUM(balance) FILTER (WHERE category = 'asset'), 0) as assets,

      -- Total Liabilities (all negative accounts)
      COALESCE(SUM(balance) FILTER (WHERE category = 'liability'), 0) as liabilities,

      -- Cash on Hand (all assets except car)
      COALESCE(SUM(balance) FILTER (WHERE category = 'asset' AND subcategory != 'physical_asset'), 0) as cash_hand,

      -- Credit Cards Owed
      COALESCE(SUM(balance) FILTER (WHERE subcategory = 'credit_card'), 0) as cc_owed,

      -- Owed Cash (all liabilities except auto loan)
      COALESCE(SUM(balance) FILTER (WHERE category = 'liability' AND subcategory != 'auto_loan'), 0) as cash_owed
    FROM latest_balances
  )
  SELECT
    assets,
    liabilities,
    assets - liabilities as net_worth,
    cash_hand,
    cc_owed,
    cash_owed,
    cash_hand - cash_owed as cash_total
  FROM calculations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get Balance History (for charts)
CREATE OR REPLACE FUNCTION get_balance_history(p_user_id UUID, p_days INTEGER DEFAULT 90)
RETURNS TABLE (
  snapshot_date DATE,
  net_worth NUMERIC,
  total_assets NUMERIC,
  total_liabilities NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bs.snapshot_date,
    COALESCE(SUM(CASE WHEN a.category = 'asset' THEN bs.balance ELSE -bs.balance END), 0) as net_worth,
    COALESCE(SUM(bs.balance) FILTER (WHERE a.category = 'asset'), 0) as total_assets,
    COALESCE(SUM(bs.balance) FILTER (WHERE a.category = 'liability'), 0) as total_liabilities
  FROM balance_snapshots bs
  INNER JOIN accounts a ON bs.account_id = a.id
  WHERE bs.user_id = p_user_id
    AND bs.snapshot_date >= CURRENT_DATE - p_days
  GROUP BY bs.snapshot_date
  ORDER BY bs.snapshot_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
