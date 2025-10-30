-- Fix duplicate sequence_order values in phases table
-- This will renumber phases within each project to ensure unique sequence_order

-- First, let's create a temporary table with corrected sequence numbers
WITH numbered_phases AS (
  SELECT
    id,
    project_id,
    ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at, id) as new_sequence
  FROM phases
)
-- Update the phases table with the new sequence numbers
UPDATE phases
SET sequence_order = numbered_phases.new_sequence
FROM numbered_phases
WHERE phases.id = numbered_phases.id
  AND phases.sequence_order != numbered_phases.new_sequence;

-- Add a unique constraint to prevent this from happening again
-- This ensures each project has unique sequence_order values for its phases
ALTER TABLE phases
DROP CONSTRAINT IF EXISTS unique_project_phase_sequence;

ALTER TABLE phases
ADD CONSTRAINT unique_project_phase_sequence
UNIQUE (project_id, sequence_order);