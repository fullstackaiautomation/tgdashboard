-- Finances Area Summary Function
-- Aggregates financial metrics for the Review Dashboard Finances card

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
  month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
  week_start DATE := CURRENT_DATE - INTERVAL '7 days';
  prev_month_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
  prev_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day';
BEGIN
  RETURN QUERY
  WITH net_worth_calc AS (
    -- Calculate net worth from latest balance snapshots
    SELECT
      COALESCE(SUM(
        CASE
          WHEN a.category = 'asset' THEN bs.balance
          WHEN a.category = 'liability' THEN -bs.balance
          ELSE 0
        END
      ), 0) as nw
    FROM accounts a
    LEFT JOIN LATERAL (
      SELECT balance
      FROM balance_snapshots
      WHERE account_id = a.id
        AND user_id = p_user_id
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) bs ON true
    WHERE a.user_id = p_user_id
      AND a.is_active = true
  ),
  monthly_financials AS (
    -- Calculate monthly revenue, expenses, and weekly transaction count
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'), 0) as revenue,
      COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) as expenses,
      COUNT(*) FILTER (WHERE transaction_date >= week_start) as txn_count
    FROM transactions
    WHERE user_id = p_user_id
      AND transaction_date >= month_start
  ),
  budget AS (
    -- Get monthly budget setting
    SELECT COALESCE(monthly_budget, 0) as budget
    FROM budget_settings
    WHERE user_id = p_user_id
  ),
  investment_perf AS (
    -- Calculate investment portfolio value and monthly return
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
    FROM accounts a
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
        AND snapshot_date <= prev_month_end
      ORDER BY snapshot_date DESC
      LIMIT 1
    ) bs_prev ON true
    WHERE a.user_id = p_user_id
      AND a.subcategory = 'investment'
      AND a.is_active = true
  ),
  top_spend AS (
    -- Get top 3 spending categories with percentages
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'category', category,
          'amount', amount,
          'percentage', ROUND((amount / NULLIF(mf.expenses, 0)) * 100, 1)
        ) ORDER BY amount DESC
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
        AND transaction_date >= month_start
      GROUP BY category
      ORDER BY SUM(amount) DESC
      LIMIT 3
    ) t
    CROSS JOIN monthly_financials mf
  ),
  goals AS (
    -- Get active financial goals with progress
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
    -- Detect unusual spending (50%+ above 3-month average per category)
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
          AND transaction_date < month_start
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
        AND transaction_date >= month_start
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
    nw.nw,
    mf.revenue,
    mf.expenses,
    b.budget,
    ROUND((mf.expenses / NULLIF(b.budget, 0)) * 100, 1) as usage_pct,
    CASE
      WHEN b.budget = 0 THEN 'no_budget'
      WHEN (mf.expenses / NULLIF(b.budget, 1)) < 0.8 THEN 'under'
      WHEN (mf.expenses / NULLIF(b.budget, 1)) < 0.9 THEN 'approaching'
      WHEN (mf.expenses / NULLIF(b.budget, 1)) <= 1.0 THEN 'caution'
      ELSE 'over'
    END as status,
    mf.txn_count::INTEGER,
    CASE WHEN ip.portfolio > 0 THEN ip.portfolio ELSE NULL END as portfolio,
    CASE WHEN ip.portfolio > 0 THEN ip.monthly_return ELSE NULL END as monthly_return,
    ts.categories,
    g.goals_json,
    u.unusual_json
  FROM net_worth_calc nw
  CROSS JOIN monthly_financials mf
  CROSS JOIN budget b
  CROSS JOIN investment_perf ip
  CROSS JOIN top_spend ts
  CROSS JOIN goals g
  CROSS JOIN unusual u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
