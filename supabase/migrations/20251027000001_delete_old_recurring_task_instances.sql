-- Delete old recurring task instances that were created before parent/child system
-- These are tasks with:
-- - recurring_type is NOT NULL
-- - recurring_parent_id IS NULL (no parent link)
-- - task_name matches pattern "Name MM/DD/YY"
--
-- This cleanup is safe because:
-- - We're keeping non-recurring tasks
-- - We're keeping any tasks with a recurring_parent_id (the new child instances)
-- - The new parent/child system will regenerate instances properly

DELETE FROM tasks
WHERE
  recurring_type IS NOT NULL
  AND recurring_type != 'none'
  AND recurring_parent_id IS NULL
  AND task_name ~ ' \d{2}/\d{2}/\d{2}$'  -- Matches "Name MM/DD/YY" at end
  AND created_at < NOW() - INTERVAL '1 minute';  -- Only old ones, not fresh ones

-- Log the deletion
SELECT 'Cleanup complete - deleted old recurring task instances' AS status;
