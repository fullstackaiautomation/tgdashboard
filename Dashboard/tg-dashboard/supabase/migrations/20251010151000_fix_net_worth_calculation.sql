-- Fix Net Worth Calculation
-- Formula: Net Worth = Cash + Investments - Credit Cards - Loans - Taxes
-- All debt values are stored as POSITIVE numbers and then SUBTRACTED

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
      -- Total Assets: Cash + Investments (stored as positive)
      COALESCE(SUM(balance) FILTER (WHERE category = 'asset'), 0) as assets,

      -- Total Debt: Credit Cards + Loans + Taxes (stored as positive, will be subtracted)
      COALESCE(SUM(balance) FILTER (WHERE category = 'liability'), 0) as debt,

      -- Cash on Hand (all assets except physical assets)
      COALESCE(SUM(balance) FILTER (WHERE category = 'asset' AND subcategory != 'physical_asset'), 0) as cash_hand,

      -- Credit Cards Owed
      COALESCE(SUM(balance) FILTER (WHERE subcategory = 'credit_card'), 0) as cc_owed,

      -- Owed Cash (all debt except auto loan)
      COALESCE(SUM(balance) FILTER (WHERE category = 'liability' AND subcategory != 'auto_loan'), 0) as cash_owed
    FROM latest_balances
  )
  SELECT
    assets,
    debt as total_liabilities,
    -- Net Worth = Cash Total + Investments Total - Credit Cards - Loans - Taxes
    (assets - debt) as net_worth,
    cash_hand,
    cc_owed,
    cash_owed,
    (cash_hand - cash_owed) as cash_total
  FROM calculations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
