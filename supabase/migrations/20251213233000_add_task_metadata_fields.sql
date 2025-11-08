-- Add new metadata fields to tasks table

-- Add energy_level column
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS energy_level TEXT;

COMMENT ON COLUMN tasks.energy_level IS 'Energy level required for task: Deep Work or Admin';

-- Add hours_accuracy column (display-only, calculated field)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS hours_accuracy NUMERIC;

COMMENT ON COLUMN tasks.hours_accuracy IS 'Absolute difference between hours_projected and hours_worked. Auto-calculated when task is completed.';

-- Add estimation_accuracy column (display-only, auto-populated on completion)
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS estimation_accuracy TEXT;

COMMENT ON COLUMN tasks.estimation_accuracy IS 'Estimation accuracy: Overestimated, Underestimated, or Accurate. Auto-populated when task is marked complete.';
