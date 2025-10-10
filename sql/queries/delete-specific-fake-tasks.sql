-- Delete specific fake/sample tasks by name
-- Safe and targeted deletion

-- First, preview what will be deleted
SELECT id, task_name, created_at, business_id
FROM tasks
WHERE task_name IN (
  'Train Staff',
  'Create wireframes',
  'design system components',
  'setup React project',
  'build auth flow',
  'setup React Native',
  'build home screen',
  'launchsocial media ads',
  'email campaign',
  'setup airbyte connectors',
  'install conveyor systems',
  'design API architecture',
  'build core features'
)
ORDER BY task_name;

-- Count how many will be deleted
SELECT COUNT(*) as fake_tasks_to_delete
FROM tasks
WHERE task_name IN (
  'Train Staff',
  'Create wireframes',
  'design system components',
  'setup React project',
  'build auth flow',
  'setup React Native',
  'build home screen',
  'launchsocial media ads',
  'email campaign',
  'setup airbyte connectors',
  'install conveyor systems',
  'design API architecture',
  'build core features'
);

-- If the above looks correct, run this to delete:
DELETE FROM tasks
WHERE task_name IN (
  'Train Staff',
  'Create wireframes',
  'design system components',
  'setup React project',
  'build auth flow',
  'setup React Native',
  'build home screen',
  'launchsocial media ads',
  'email campaign',
  'setup airbyte connectors',
  'install conveyor systems',
  'design API architecture',
  'build core features'
);

-- Verify deletion
SELECT COUNT(*) as remaining_tasks FROM tasks;
