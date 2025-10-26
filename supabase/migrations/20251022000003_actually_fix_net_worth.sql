-- Actually fix net worth calculation
-- The issue was we were negating when we shouldn't have
-- Net Worth should be: Total Assets - Total Debt
-- When debt > assets, this naturally gives a negative number

DROP FUNCTION IF EXISTS get_finances_area_summary(UUID);

CREATE OR REPLACE FUNCTION get_finances_area_summary(p_user_id UUID)
RETURNS TABLE (
  net_worth NUMERIC,
  monthly_revenue NUMERIC,
  monthly_expenses NUMERIC,
  monthly_budget NUMERIC,
  budget_usage_percentage NUMERIC,
  budget_status TEXT,
  transactions_this_week INTEGER,
  portfolio_value NUMERIC,
  portfolio_monthly_return NUMERIC,
  top_categories JSONB,
  active_goals JSONB,
  unusual_spending JSONB
) AS $$
DECLARE
  v_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  v_week_start DATE := CURRENT_DATE - INTERVAL '7 days';
  v_prev_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
  v_total_assets NUMERIC;
  v_total_debt NUMERIC;
  v_net_worth NUMERIC;
BEGIN
  -- Calculate total assets (cash + investments)
  SELECT COALESCE(SUM(bs.balance), 0) INTO v_total_assets
  FROM finance_accounts a
  LEFT JOIN LATERAL (
    SELECT balance
    FROM balance_snapshots
    WHERE account_id = a.id
      AND user_id = p_user_id
    ORDER BY snapshot_date DESC
    LIMIT 1
  ) bs ON true
  WHERE a.user_id = p_user_id
    AND a.account_type IN ('cash', 'investment')
    AND a.is_active = true;

  -- Calculate total debt (credit cards + loans + taxes)
  SELECT COALESCE(SUM(bs.balance), 0) INTO v_total_debt
  FROM finance_accounts a
  LEFT JOIN LATERAL (
    SELECT balance
    FROM balance_snapshots
    WHERE account_id = a.id
      AND user_id = p_user_id
    ORDER BY snapshot_date DESC
    LIMIT 1
  ) bs ON true
  WHERE a.user_id = p_user_id
    AND a.account_type IN ('credit_card', 'loan', 'tax')
    AND a.is_active = true;

  -- Calculate net worth: assets minus debt
  -- If assets = 19535 and debt = 28721, this gives -9186
  v_net_worth := v_total_assets - v_total_debt;

  -- Debug: Raise notice to see actual values
  RAISE NOTICE 'Total Assets: %, Total Debt: %, Net Worth: %', v_total_assets, v_total_debt, v_net_worth;

  RETURN QUERY
  WITH monthly_financials AS (
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'), 0) as revenue,
      COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) as expenses,
      COUNT(*) FILTER (WHERE transaction_date >= v_week_start) as txn_count
    FROM transactions
    WHERE user_id = p_user_id
      AND transaction_date >= v_month_start
  ),
  budget_data AS (
    SELECT COALESCE(bs.monthly_budget, 0) as budget_amount
    FROM (SELECT 1) dummy
    LEFT JOIN budget_settings bs ON bs.user_id = p_user_id
  ),
  investment_perf AS (
    SELECT
      COALESCE(SUM(bs_current.balance), 0) as portfolio,
      CASE
        WHEN COALESCE(SUM(bs_prev.balance), 0) > 0 THEN
          ROUND(
            ((COALESCE(SUM(bs_current.balance), 0) - COALESCE(SUM(bs_prev.balance), 0))
            / COALESCE(SUM(bs_prev.balance), 1)) * 100,
            2
          )
        ELSE 0
      END as monthly_return
    FROM finance_accounts a
    LEFT JOIN LATERAL (
      SELECT balance
      FROM balance_snapshots
      WHERE account_id = a.id
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) bs_current ON true
    LEFT JOIN LATERAL (
      SELECT balance
      FROM balance_snapshots
      WHERE account_id = a.id
        AND snapshot_date <= v_prev_month_end
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) bs_prev ON true
    WHERE a.user_id = p_user_id
      AND a.account_type = 'investment'
      AND a.is_active = true
  ),
  top_spend AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', t.category,
          'amount', t.amount,
          'percentage', ROUND((t.amount / NULLIF(mf.expenses, 0)) * 100, 1)
        ) ORDER BY t.amount DESC
      ),
      '[]'::JSONB
    ) as categories
    FROM (
      SELECT
        COALESCE(category, 'Uncategorized') as category,
        SUM(amount) as amount
      FROM transactions
      WHERE user_id = p_user_id
        AND transaction_type = 'expense'
        AND transaction_date >= v_month_start
      GROUP BY category
      ORDER BY SUM(amount) DESC
      LIMIT 3
    ) t
    CROSS JOIN monthly_financials mf
  ),
  goals AS (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'name', goal_name,
          'current', current_amount,
          'target', target_amount,
          'progress', ROUND((current_amount / NULLIF(target_amount, 0)) * 100, 1),
          'deadline', deadline
        ) ORDER BY (current_amount / NULLIF(target_amount, 1)) DESC
      ),
      '[]'::JSONB
    ) as goals_json
    FROM financial_goals
    WHERE user_id = p_user_id
      AND active = true
    LIMIT 3
  ),
  unusual AS (
    WITH category_averages AS (
      SELECT
        category,
        AVG(monthly_total) as avg_monthly
      FROM (
        SELECT
          category,
          DATE_TRUNC('month', transaction_date) as month,
          SUM(amount) as monthly_total
        FROM transactions
        WHERE user_id = p_user_id
          AND transaction_type = 'expense'
          AND transaction_date >= CURRENT_DATE - INTERVAL '4 months'
          AND transaction_date < v_month_start
        GROUP BY category, DATE_TRUNC('month', transaction_date)
      ) monthly_spending
      GROUP BY category
    ),
    current_month_spending AS (
      SELECT
        category,
        SUM(amount) as current_total
      FROM transactions
      WHERE user_id = p_user_id
        AND transaction_type = 'expense'
        AND transaction_date >= v_month_start
      GROUP BY category
    )
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', cms.category,
          'current', cms.current_total,
          'typical', ca.avg_monthly,
          'increase_percentage', ROUND(((cms.current_total - ca.avg_monthly) / NULLIF(ca.avg_monthly, 0)) * 100, 1)
        )
      ),
      '[]'::JSONB
    ) as unusual_json
    FROM current_month_spending cms
    INNER JOIN category_averages ca ON cms.category = ca.category
    WHERE cms.current_total > ca.avg_monthly * 1.5
    ORDER BY (cms.current_total - ca.avg_monthly) DESC
    LIMIT 2
  )
  SELECT
    v_net_worth as net_worth,
    mf.revenue,
    mf.expenses,
    bd.budget_amount,
    ROUND((mf.expenses / NULLIF(bd.budget_amount, 0)) * 100, 1) as usage_pct,
    CASE
      WHEN bd.budget_amount = 0 THEN 'no_budget'
      WHEN (mf.expenses / NULLIF(bd.budget_amount, 1)) < 0.8 THEN 'under'
      WHEN (mf.expenses / NULLIF(bd.budget_amount, 1)) < 0.9 THEN 'approaching'
      WHEN (mf.expenses / NULLIF(bd.budget_amount, 1)) <= 1.0 THEN 'caution'
      ELSE 'over'
    END as status,
    mf.txn_count::INTEGER,
    CASE WHEN ip.portfolio > 0 THEN ip.portfolio ELSE NULL END as portfolio,
    CASE WHEN ip.portfolio > 0 THEN ip.monthly_return ELSE NULL END as monthly_return,
    ts.categories,
    g.goals_json,
    u.unusual_json
  FROM monthly_financials mf
  CROSS JOIN budget_data bd
  CROSS JOIN investment_perf ip
  CROSS JOIN top_spend ts
  CROSS JOIN goals g
  CROSS JOIN unusual u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;