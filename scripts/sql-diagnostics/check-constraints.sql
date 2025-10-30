-- Check existing foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('tasks', 'projects', 'phases', 'businesses', 'deep_work_sessions', 'notes', 'accounts', 'balance_snapshots')
ORDER BY tc.table_name, kcu.column_name;

-- Check for CHECK constraints
SELECT
    con.conname AS constraint_name,
    rel.relname AS table_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
    AND con.contype = 'c'
    AND rel.relname IN ('tasks', 'projects', 'phases', 'businesses', 'deep_work_sessions', 'notes', 'accounts', 'balance_snapshots')
ORDER BY rel.relname, con.conname;
