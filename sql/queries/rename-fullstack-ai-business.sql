-- Rename "Full Stack AI" business to "Full Stack"

-- First, verify the business exists and check what it's called
SELECT id, name, slug FROM businesses WHERE name ILIKE '%full stack%';

-- Update the business name
UPDATE businesses 
SET name = 'Full Stack'
WHERE name = 'Full Stack AI';

-- Also update the slug to match (if needed)
UPDATE businesses 
SET slug = 'full-stack'
WHERE name = 'Full Stack' AND slug = 'fullstack-ai';

-- Verify the update
SELECT id, name, slug FROM businesses WHERE name = 'Full Stack';
