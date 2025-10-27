# Database Schema & Migrations

## Overview

The application uses Supabase (PostgreSQL) as its backend database. The schema is organized into logical groups: Finance tables, Business/Task tables, and Content Library tables.

All migrations are version-controlled and stored in `supabase/migrations/`.

## Database Tables

### Finance Tables

#### `finance_accounts`
Defines account categories for the Finance dashboard.

**Columns**:
- `id` (UUID) - Primary key
- `name` (text) - Account type name
- `category` (text) - Account category (e.g., 'cash', 'investments', 'credit_cards', 'loans', 'taxes')
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

#### `balance_snapshots`
Historical balance data by date for each account.

**Columns**:
- `id` (UUID) - Primary key
- `account_id` (UUID) - Foreign key to finance_accounts
- `date` (DATE) - Balance date
- `balance` (numeric) - Account balance for that date
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp

**Notes**:
- Stores snapshots of account balances by date
- Enables historical tracking and trends
- Uses DATE for calendar dates, TIMESTAMPTZ for timestamps

### Business/Task Tables

#### `businesses`
Top-level business entities.

**Columns**:
- `id` (UUID) - Primary key
- `name` (text) - Business name
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

#### `projects`
Projects within a business.

**Columns**:
- `id` (UUID) - Primary key
- `business_id` (UUID) - Foreign key to businesses
- `name` (text) - Project name
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

#### `phases`
Phases within a project.

**Columns**:
- `id` (UUID) - Primary key
- `project_id` (UUID) - Foreign key to projects
- `name` (text) - Phase name
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

#### `tasks`
Tasks linked to phases or standalone tasks.

**Columns**:
- `id` (UUID) - Primary key
- `phase_id` (UUID) - Foreign key to phases (nullable for standalone tasks)
- `title` (text) - Task title
- `description` (text) - Task description
- `status` (text) - Task status (e.g., 'not_started', 'in_progress', 'completed')
- `area` (text) - Life area (e.g., 'Full Stack', 'Personal', 'Health')
- `effort_level` (text) - Effort level (e.g., '$$$ Printer $$$', '$ Makes Money $')
- `priority` (text) - Priority level (Low, Medium, High)
- `hours_projected` (numeric) - Estimated hours
- `hours_worked` (numeric) - Actual hours worked
- `due_date` (DATE) - Task due date
- `recurring_type` (text) - Recurrence pattern (none, daily, weekly, monthly, custom)
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

#### `deep_work_sessions`
Time tracking data for deep work sessions.

**Columns**:
- `id` (UUID) - Primary key
- `task_id` (UUID) - Foreign key to tasks
- `duration_minutes` (integer) - Session duration in minutes
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Session timestamp

### Content Library

#### `content_items`
URL-based content with AI analysis.

**Columns**:
- `id` (UUID) - Primary key
- `url` (text) - Content URL
- `title` (text) - Content title
- `summary` (text) - AI-generated summary
- `creator` (text) - Content creator/author
- `time_estimate` (integer) - Estimated time to consume (minutes)
- `tags` (text[]) - Tags from AI analysis
- `value_rating` (integer) - User rating (1-5)
- `user_id` (UUID) - Foreign key to users
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last updated timestamp

**Notes**:
- `tags` is an array type for flexible tagging
- All text fields are auto-populated by the `analyze-content` Edge Function

## Migrations Workflow

### Structure

Migrations are in `supabase/migrations/` with timestamp-based naming:

```
20251009220000_create_finance_tables.sql
20251009220001_add_credit_limit.sql
20251009220002_seed_finance_accounts.sql
```

Format: `YYYYMMDDHHMMSS_description.sql`

### Creating a Migration

1. Create a new `.sql` file with timestamp:
   ```bash
   touch supabase/migrations/$(date +%Y%m%d%H%M%S)_description.sql
   ```

2. Write SQL for your schema changes:
   ```sql
   -- Add new table
   CREATE TABLE my_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   -- Add indexes
   CREATE INDEX idx_my_table_name ON my_table(name);

   -- Update existing table
   ALTER TABLE existing_table ADD COLUMN new_column TEXT;
   ```

3. Deploy the migration:
   ```bash
   supabase db push
   ```

### Important Guidelines

1. **Always use TIMESTAMPTZ** for timestamps that need timezone awareness
2. **Use DATE** for calendar dates (no time component)
3. **Use UUID** for primary keys: `DEFAULT gen_random_uuid()`
4. **Add user_id** to all user-specific tables for multi-user support
5. **Add created_at and updated_at** to track data lifecycle
6. **Use meaningful indexes** on frequently queried columns
7. **Make migrations idempotent** where possible using `IF NOT EXISTS`

### Testing Migrations

Run migrations against a local Supabase instance:

```bash
# Push to local database
supabase db push

# Execute a specific SQL file for testing
supabase db execute --file path/to/file.sql

# Reset database (⚠️ destructive)
supabase db reset
```

### Rollback

Supabase doesn't have built-in rollback. If needed:

1. Create a new migration that reverses the changes
2. Document what was changed and why

Example:
```sql
-- Reverse of: add new column
ALTER TABLE my_table DROP COLUMN new_column;
```

## Real-time Subscriptions

Supabase supports real-time subscriptions for instant updates:

**Subscribed tables**:
- `tasks` - Updates appear instantly across all tabs
- `businesses` - Project updates sync in real-time
- `projects` - Phase updates sync in real-time
- `phases` - Task updates sync in real-time

**Implementation**: See `useRealtimeSync` hook in `src/hooks/useRealtimeSync.ts`

## Data Integrity Notes

- All user-specific data includes `user_id` for multi-user support
- Foreign keys maintain referential integrity
- Cascade deletes are configured appropriately
- Timestamps use TIMESTAMPTZ for proper timezone handling
