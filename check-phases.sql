-- Check phase sequence_order values
SELECT
  p.id,
  p.name,
  p.sequence_order,
  pr.name as project_name
FROM phases p
JOIN projects pr ON p.project_id = pr.id
ORDER BY pr.name, p.sequence_order;