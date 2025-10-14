-- RLS-Enabled Table Migration Template
-- Use this template when creating ANY new table in the database
-- NEVER create a table without RLS policies
--
-- Replace [TABLE_NAME] with your actual table name (e.g., tasks, projects, etc.)
-- Replace [fields] with your actual column definitions

-- =============================================================================
-- STEP 1: Create the table
-- =============================================================================
CREATE TABLE IF NOT EXISTS [TABLE_NAME] (
  -- Required columns
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Your custom fields here
  -- [field_name] [data_type] [constraints],
  -- [field_name] [data_type] [constraints],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create indexes for performance
-- =============================================================================
-- ALWAYS index user_id for RLS policy performance
CREATE INDEX IF NOT EXISTS idx_[TABLE_NAME]_user_id ON [TABLE_NAME](user_id);

-- Add additional indexes as needed for your queries
-- CREATE INDEX IF NOT EXISTS idx_[TABLE_NAME]_[field] ON [TABLE_NAME]([field]);

-- =============================================================================
-- STEP 3: Enable Row Level Security
-- =============================================================================
ALTER TABLE [TABLE_NAME] ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: Create RLS Policies (ALL 4 REQUIRED)
-- =============================================================================

-- SELECT Policy: Users can only view their own rows
CREATE POLICY "[TABLE_NAME]_select_policy"
  ON [TABLE_NAME] FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT Policy: Users can only insert rows for themselves
CREATE POLICY "[TABLE_NAME]_insert_policy"
  ON [TABLE_NAME] FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE Policy: Users can only update their own rows
CREATE POLICY "[TABLE_NAME]_update_policy"
  ON [TABLE_NAME] FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE Policy: Users can only delete their own rows
CREATE POLICY "[TABLE_NAME]_delete_policy"
  ON [TABLE_NAME] FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 5: Add documentation comments
-- =============================================================================
COMMENT ON TABLE [TABLE_NAME] IS '[Brief description of what this table stores]';
COMMENT ON COLUMN [TABLE_NAME].user_id IS 'References auth.users - enforced by RLS policies';

-- =============================================================================
-- STEP 6: Create updated_at trigger (optional but recommended)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_[TABLE_NAME]_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_[TABLE_NAME]_timestamp
  BEFORE UPDATE ON [TABLE_NAME]
  FOR EACH ROW
  EXECUTE FUNCTION update_[TABLE_NAME]_updated_at();

-- =============================================================================
-- VERIFICATION QUERIES (run after migration)
-- =============================================================================

-- Verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = '[TABLE_NAME]';
-- Expected: rowsecurity = true

-- Verify all 4 policies exist:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = '[TABLE_NAME]' ORDER BY cmd;
-- Expected: 4 rows (DELETE, INSERT, SELECT, UPDATE)

-- Verify policies use auth.uid():
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = '[TABLE_NAME]';
-- Expected: All policies should reference 'auth.uid() = user_id'

-- =============================================================================
-- EXAMPLE USAGE
-- =============================================================================

/*
-- Example: Creating a "bookmarks" table

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_url CHECK (url ~* '^https?://')
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING GIN(tags);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_policy"
  ON bookmarks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_policy"
  ON bookmarks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update_policy"
  ON bookmarks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_policy"
  ON bookmarks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE bookmarks IS 'User bookmarks with tags and favorites';
*/

-- =============================================================================
-- SECURITY CHECKLIST
-- =============================================================================
-- [ ] Table has user_id column
-- [ ] user_id has NOT NULL constraint
-- [ ] user_id references auth.users(id)
-- [ ] user_id has ON DELETE CASCADE
-- [ ] user_id is indexed
-- [ ] RLS is enabled (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
-- [ ] SELECT policy exists with USING (auth.uid() = user_id)
-- [ ] INSERT policy exists with WITH CHECK (auth.uid() = user_id)
-- [ ] UPDATE policy exists with USING and WITH CHECK (auth.uid() = user_id)
-- [ ] DELETE policy exists with USING (auth.uid() = user_id)
-- [ ] No policies use USING (true) or WITH CHECK (true)
-- [ ] All policies target 'authenticated' role
-- [ ] Verification queries run successfully
-- [ ] Table appears in rls_policy_audit view with ✅ Complete status
