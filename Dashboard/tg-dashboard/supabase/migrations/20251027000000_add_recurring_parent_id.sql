-- Add recurring_parent_id column to tasks table for parent-child task relationships
-- This allows us to link child task instances back to their parent recurring task template

ALTER TABLE tasks
ADD COLUMN recurring_parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create index for efficient filtering of parent tasks
CREATE INDEX idx_tasks_recurring_parent_id ON tasks(recurring_parent_id);
