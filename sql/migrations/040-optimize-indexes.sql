-- Story 1.6: Tasks Hub Performance Optimization
-- Create indexes for improved query performance

-- Composite index for common query pattern (user + status + date)
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_date ON tasks(user_id, status, due_date);

-- Index for scheduled date filtering (Story 1.4)
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_date ON tasks(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- Index for life area queries
CREATE INDEX IF NOT EXISTS idx_tasks_life_area ON tasks(life_area_id) WHERE life_area_id IS NOT NULL;

-- Index for project queries
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id) WHERE project_id IS NOT NULL;

-- Index for phase queries
CREATE INDEX IF NOT EXISTS idx_tasks_phase ON tasks(phase_id) WHERE phase_id IS NOT NULL;

-- Partial index for active tasks only (most common query)
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(user_id, due_date) WHERE status != 'Done';

-- Index for overdue task queries (without CURRENT_DATE to avoid immutability issue)
-- Note: Queries will filter due_date at runtime - this index speeds up the lookup
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(user_id, due_date, progress_percentage)
WHERE progress_percentage < 100;

-- Comments
COMMENT ON INDEX idx_tasks_user_status_date IS 'Composite index for filtering tasks by user, status, and due date';
COMMENT ON INDEX idx_tasks_active IS 'Partial index for active (non-completed) tasks';
COMMENT ON INDEX idx_tasks_overdue IS 'Partial index for incomplete tasks with due dates (runtime filter for overdue)';

-- Analyze table to update query planner statistics
ANALYZE tasks;

-- Query to check all existing indexes on tasks table
-- Run this to verify indexes are created:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'tasks' ORDER BY indexname;
