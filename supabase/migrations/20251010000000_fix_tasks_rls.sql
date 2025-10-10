-- Fix RLS policies for tasks table
-- This migration ensures authenticated users can CRUD tasks

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- Enable RLS on tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for authenticated users
CREATE POLICY "Users can view all tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (true);

-- Also ensure related tables have proper RLS policies
-- Businesses
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all businesses" ON businesses;
DROP POLICY IF EXISTS "Users can insert businesses" ON businesses;
DROP POLICY IF EXISTS "Users can update businesses" ON businesses;
DROP POLICY IF EXISTS "Users can delete businesses" ON businesses;

CREATE POLICY "Users can view all businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (true);

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can insert projects" ON projects;
DROP POLICY IF EXISTS "Users can update projects" ON projects;
DROP POLICY IF EXISTS "Users can delete projects" ON projects;

CREATE POLICY "Users can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Phases
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all phases" ON phases;
DROP POLICY IF EXISTS "Users can insert phases" ON phases;
DROP POLICY IF EXISTS "Users can update phases" ON phases;
DROP POLICY IF EXISTS "Users can delete phases" ON phases;

CREATE POLICY "Users can view all phases"
  ON phases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert phases"
  ON phases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update phases"
  ON phases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete phases"
  ON phases FOR DELETE
  TO authenticated
  USING (true);
