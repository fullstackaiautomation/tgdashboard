-- Tasks Hub Database Schema
-- Story 1.1: Tasks Hub Page Structure & Data Model

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_businesses_user_id ON businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own businesses"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own businesses"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
  ON businesses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_business_id ON projects(business_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PHASES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phases_user_id ON phases(user_id);
CREATE INDEX IF NOT EXISTS idx_phases_project_id ON phases(project_id);
CREATE INDEX IF NOT EXISTS idx_phases_status ON phases(status);

ALTER TABLE phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own phases"
  ON phases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phases"
  ON phases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phases"
  ON phases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own phases"
  ON phases FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- LIFE_AREAS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS life_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_life_areas_user_id ON life_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_life_areas_category ON life_areas(category);

ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own life areas"
  ON life_areas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own life areas"
  ON life_areas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life areas"
  ON life_areas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life areas"
  ON life_areas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TASKS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Task Details
  task_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Not started',
  priority TEXT DEFAULT 'Medium',

  -- Relationships (nullable - task can be business OR life area, not both)
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  phase_id UUID REFERENCES phases(id) ON DELETE SET NULL,
  life_area_id UUID REFERENCES life_areas(id) ON DELETE SET NULL,

  -- Legacy area field for backward compatibility
  area TEXT,
  task_type TEXT,

  -- Effort and Automation
  automation TEXT,
  effort_level TEXT,

  -- Time tracking
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  past_due BOOLEAN DEFAULT FALSE,
  hours_projected NUMERIC,
  hours_worked NUMERIC,
  scheduled_start TIMESTAMPTZ,
  scheduled_end TIMESTAMPTZ,

  -- Recurring tasks
  recurring_type TEXT DEFAULT 'none',
  recurring_interval INTEGER DEFAULT 1,
  recurring_days INTEGER[],
  last_recurring_date TIMESTAMPTZ,
  is_recurring_template BOOLEAN DEFAULT FALSE,
  original_recurring_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,

  -- Checklist (JSONB for flexibility)
  checklist JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_business_id ON tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_phase_id ON tasks(phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_life_area_id ON tasks(life_area_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_user_status_due ON tasks(user_id, status, due_date);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_phases_updated_at BEFORE UPDATE ON phases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_life_areas_updated_at BEFORE UPDATE ON life_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
