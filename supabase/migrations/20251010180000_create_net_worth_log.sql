-- Create net_worth_log table to track historical snapshots of net worth and account totals
CREATE TABLE IF NOT EXISTS net_worth_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,

  -- Summary totals
  net_worth DECIMAL(12, 2) NOT NULL,
  cash_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  investments_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  credit_cards_owed DECIMAL(12, 2) NOT NULL DEFAULT 0,
  credit_cards_available DECIMAL(12, 2) NOT NULL DEFAULT 0,
  loans_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  taxes_owed DECIMAL(12, 2) NOT NULL DEFAULT 0,

  -- Detailed breakdown (JSONB for flexibility)
  cash_accounts JSONB DEFAULT '[]'::jsonb,
  investment_accounts JSONB DEFAULT '[]'::jsonb,
  credit_card_accounts JSONB DEFAULT '[]'::jsonb,
  loan_accounts JSONB DEFAULT '[]'::jsonb,
  tax_accounts JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one snapshot per user per date
  CONSTRAINT unique_user_snapshot_date UNIQUE (user_id, snapshot_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_net_worth_log_user_id ON net_worth_log(user_id);
CREATE INDEX IF NOT EXISTS idx_net_worth_log_snapshot_date ON net_worth_log(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_net_worth_log_user_date ON net_worth_log(user_id, snapshot_date DESC);

-- Enable RLS
ALTER TABLE net_worth_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own net worth history"
  ON net_worth_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own net worth snapshots"
  ON net_worth_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own net worth snapshots"
  ON net_worth_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own net worth snapshots"
  ON net_worth_log FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_net_worth_log_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_net_worth_log_updated_at
  BEFORE UPDATE ON net_worth_log
  FOR EACH ROW
  EXECUTE FUNCTION update_net_worth_log_updated_at();

-- Add comments for documentation
COMMENT ON TABLE net_worth_log IS 'Stores historical snapshots of net worth and account balances over time';
COMMENT ON COLUMN net_worth_log.snapshot_date IS 'The date this snapshot represents';
COMMENT ON COLUMN net_worth_log.cash_accounts IS 'Array of {name, balance} for cash accounts';
COMMENT ON COLUMN net_worth_log.investment_accounts IS 'Array of {name, balance} for investment accounts';
COMMENT ON COLUMN net_worth_log.credit_card_accounts IS 'Array of {name, balance, limit, available} for credit cards';
COMMENT ON COLUMN net_worth_log.loan_accounts IS 'Array of {name, balance, original_amount} for loans';
COMMENT ON COLUMN net_worth_log.tax_accounts IS 'Array of {name, balance} for tax liabilities';
