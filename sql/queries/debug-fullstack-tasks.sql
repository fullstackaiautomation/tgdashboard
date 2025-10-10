-- Check what slug Full Stack tasks actually have
SELECT 
  t.id,
  t.task_name,
  t.business_id,
  b.name as business_name,
  b.slug as business_slug
FROM tasks t
LEFT JOIN businesses b ON t.business_id = b.id
WHERE b.name ILIKE '%full stack%'
LIMIT 5;

-- Also check all business slugs
SELECT id, name, slug FROM businesses;
