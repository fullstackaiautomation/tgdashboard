-- Seed example goals and data for testing
-- NOTE: This migration seeds test data. In production, remove or modify as needed.

-- Get current user ID (first user in auth)
DO $$
DECLARE
  v_user_id uuid;
  v_goal_id_health uuid;
  v_goal_id_finance uuid;
  v_target_id_1 uuid;
  v_target_id_2 uuid;
  v_task_id_1 uuid;
  v_task_id_2 uuid;
BEGIN
  -- Get the first user
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No users found. Skipping seed data.';
    RETURN;
  END IF;

  -- Check if example goals already exist
  IF EXISTS (SELECT 1 FROM goals WHERE goal_statement LIKE 'Example:%' LIMIT 1) THEN
    RAISE NOTICE 'Example goals already exist. Skipping seed data.';
    RETURN;
  END IF;

  -- Create example Health goal
  INSERT INTO goals (
    user_id,
    area,
    goal_statement,
    target_date,
    primary_metric,
    metric_unit,
    metric_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Health',
    'Run 3x per week for 8 weeks',
    (CURRENT_DATE + INTERVAL '8 weeks')::date,
    'Weekly runs',
    'runs',
    'numeric',
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_goal_id_health;

  -- Create targets for Health goal
  INSERT INTO goal_targets (
    goal_id,
    target_name,
    target_value,
    frequency,
    created_at
  ) VALUES
  (v_goal_id_health, 'Weekly runs', 3, 'weekly', NOW()),
  (v_goal_id_health, 'Monthly consistency', 12, 'monthly', NOW());

  -- Get the first target ID
  SELECT id INTO v_target_id_1 FROM goal_targets WHERE goal_id = v_goal_id_health LIMIT 1;

  -- Create example Finance goal
  INSERT INTO goals (
    user_id,
    area,
    goal_statement,
    target_date,
    primary_metric,
    metric_unit,
    metric_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Finance',
    'Save $5,000 over 3 months',
    (CURRENT_DATE + INTERVAL '3 months')::date,
    'Amount saved',
    'dollars',
    'numeric',
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO v_goal_id_finance;

  -- Create targets for Finance goal
  INSERT INTO goal_targets (
    goal_id,
    target_name,
    target_value,
    frequency,
    created_at
  ) VALUES
  (v_goal_id_finance, 'Monthly savings target', 1667, 'monthly', NOW()),
  (v_goal_id_finance, 'Total target', 5000, 'monthly', NOW());

  -- Note: Task linking is optional and users will create tasks separately
  -- and manually link them to goals through the UI

  -- Create a sample check-in for the Health goal (if today is Sunday)
  IF EXTRACT(DOW FROM CURRENT_DATE) = 0 THEN
    INSERT INTO goal_checkins (
      goal_id,
      checkin_date,
      targets_hit,
      targets_total,
      overall_percentage,
      feeling_question,
      sustainability_question,
      obstacles_notes,
      metric_snapshot,
      created_at
    ) VALUES (
      v_goal_id_health,
      (CURRENT_DATE - INTERVAL '7 days')::date,
      2,
      3,
      67,
      'Felt good this week! Managed to get 2 runs in despite work being busy.',
      'yes',
      'Weather was nice this week which helped motivation. Next week I want to add a third run.',
      jsonb_build_object('targets_hit', 2, 'targets_total', 3),
      (NOW() - INTERVAL '7 days')
    );
  END IF;

  RAISE NOTICE 'Successfully seeded example goals';
END $$;
