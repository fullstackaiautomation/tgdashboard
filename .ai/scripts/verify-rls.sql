-- RLS Policy Verification Script
-- Verifies that all tables have Row Level Security enabled

SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    (
        SELECT COUNT(*) 
        FROM pg_policies 
        WHERE schemaname = t.schemaname 
        AND tablename = t.tablename
    ) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
AND tablename IN (
    'tasks',
    'projects',
    'phases',
    'businesses',
    'deep_work_log',
    'area_time_targets',
    'user_settings',
    'content_items',
    'transactions',
    'budget_settings',
    'financial_goals'
)
ORDER BY tablename;

-- Expected output: All tables should have rls_enabled = true and policy_count >= 1
