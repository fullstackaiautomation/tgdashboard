-- Migration: Add user_id to existing tasks
-- Run this in Supabase SQL Editor

-- Step 1: Check if user_id column exists, if not add it
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Update all existing tasks to have the current authenticated user's ID
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- To find your user ID, run: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- Option A: If you know your user ID, uncomment and update this:
-- UPDATE tasks SET user_id = 'YOUR_USER_ID_HERE' WHERE user_id IS NULL;

-- Option B: If you're logged in and want to assign to current user (run this in authenticated context):
-- UPDATE tasks SET user_id = auth.uid() WHERE user_id IS NULL;

-- Step 3: Verify the update
SELECT COUNT(*) as total_tasks,
       COUNT(user_id) as tasks_with_user_id
FROM tasks;
