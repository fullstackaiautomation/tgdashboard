-- Create "No Project Identified" projects for each area
-- This will help organize tasks that haven't been assigned to a specific project yet

DO $$
DECLARE
  v_business RECORD;
  v_project_id UUID;
BEGIN
  -- Loop through all businesses (areas)
  FOR v_business IN SELECT id, name, user_id FROM businesses
  LOOP
    -- Check if "No Project Identified" already exists for this business
    IF NOT EXISTS (
      SELECT 1 FROM projects
      WHERE business_id = v_business.id
      AND name = 'No Project Identified'
    ) THEN
      -- Create the "No Project Identified" project
      INSERT INTO projects (id, user_id, business_id, name, description, status, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_business.user_id,
        v_business.id,
        'No Project Identified',
        'Tasks that need to be organized into projects',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id INTO v_project_id;

      -- Optionally create a default phase for this project
      INSERT INTO phases (id, user_id, project_id, name, description, status, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_business.user_id,
        v_project_id,
        'Unorganized',
        'Tasks waiting to be organized',
        'active',
        NOW(),
        NOW()
      );

      RAISE NOTICE 'Created "No Project Identified" project for area: %', v_business.name;
    END IF;
  END LOOP;
END $$;

-- Now update all tasks that have a business_id but no project_id
-- to link them to their area's "No Project Identified" project
UPDATE tasks t
SET
  project_id = p.id,
  phase_id = ph.id,
  updated_at = NOW()
FROM businesses b
JOIN projects p ON p.business_id = b.id AND p.name = 'No Project Identified'
JOIN phases ph ON ph.project_id = p.id AND ph.name = 'Unorganized'
WHERE t.business_id = b.id
  AND t.project_id IS NULL;

-- Also handle tasks that have an area but no business_id
-- First link them to the corresponding business, then to the "No Project Identified" project
UPDATE tasks t
SET
  business_id = b.id,
  project_id = p.id,
  phase_id = ph.id,
  updated_at = NOW()
FROM businesses b
JOIN projects p ON p.business_id = b.id AND p.name = 'No Project Identified'
JOIN phases ph ON ph.project_id = p.id AND ph.name = 'Unorganized'
WHERE t.area = b.name
  AND t.business_id IS NULL
  AND t.project_id IS NULL;

-- Report how many tasks were updated
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM tasks t
  JOIN projects p ON t.project_id = p.id
  WHERE p.name = 'No Project Identified';

  RAISE NOTICE 'Total tasks linked to "No Project Identified" projects: %', v_count;
END $$;