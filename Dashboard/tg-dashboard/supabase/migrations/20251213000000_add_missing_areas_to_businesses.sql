-- Add Personal, Health, and Golf areas to businesses table
-- These will complete the 7 areas to match the Area type

-- First, get a user_id to use (use the first existing business's user_id)
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id from an existing business entry
  SELECT user_id INTO v_user_id FROM businesses LIMIT 1;

  -- If no businesses exist, get the user_id from tasks or any auth user
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM tasks WHERE user_id IS NOT NULL LIMIT 1;
  END IF;

  -- Only proceed if we have a user_id
  IF v_user_id IS NOT NULL THEN
    -- Insert Personal if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'personal' OR name = 'Personal') THEN
      INSERT INTO businesses (id, user_id, name, slug, color, description, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        'Personal',
        'personal',
        '#ec4899', -- pink
        'Personal life projects and goals',
        NOW(),
        NOW()
      );
    END IF;

    -- Insert Health if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'health' OR name = 'Health') THEN
      INSERT INTO businesses (id, user_id, name, slug, color, description, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        'Health',
        'health',
        '#14b8a6', -- teal
        'Health and wellness initiatives',
        NOW(),
        NOW()
      );
    END IF;

    -- Insert Golf if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE slug = 'golf' OR name = 'Golf') THEN
      INSERT INTO businesses (id, user_id, name, slug, color, description, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        v_user_id,
        'Golf',
        'golf',
        '#f97316', -- orange
        'Golf improvement and related projects',
        NOW(),
        NOW()
      );
    END IF;
  END IF;
END $$;

-- Update any tasks that have area='Personal', 'Health', or 'Golf' but no business_id
-- to link them to the new business entries
UPDATE tasks t
SET business_id = b.id
FROM businesses b
WHERE t.area = b.name
  AND t.business_id IS NULL
  AND b.name IN ('Personal', 'Health', 'Golf');

-- Create a function to ensure area and business stay in sync
CREATE OR REPLACE FUNCTION sync_task_area_with_business()
RETURNS TRIGGER AS $$
BEGIN
  -- If business_id is set, update area to match
  IF NEW.business_id IS NOT NULL THEN
    SELECT name INTO NEW.area
    FROM businesses
    WHERE id = NEW.business_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to keep area and business in sync
DROP TRIGGER IF EXISTS sync_task_area_trigger ON tasks;
CREATE TRIGGER sync_task_area_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION sync_task_area_with_business();