# SQL Organization

This folder contains all SQL scripts organized by purpose.

## Folder Structure

```
sql/
├── migrations/          # Schema and structure changes (run in order)
│   ├── 001-xxx.sql     # Initial schemas
│   ├── 010-xxx.sql     # Early migrations
│   ├── 020-xxx.sql     # Story 2.1 migrations
│   ├── 030-xxx.sql     # Story 1.4 migrations
│   ├── 040-xxx.sql     # Story 1.6 migrations
│   └── data/           # Data migrations and backfills
└── queries/            # Utility queries for debugging/analysis
```

## Migration Files (Run in Numerical Order)

### Initial Schemas (001-009)
- `001-tasks-hub-schema.sql` - Core tasks table and relationships
- `002-content-library-schema.sql` - Content library tables
- `003-schedule-log-table.sql` - Schedule tracking

### Early Migrations (010-019)
- `010-add-unique-task-constraint.sql` - Prevent duplicate tasks
- `011-add-referential-integrity-constraints.sql` - FK constraints
- `012-add-dashboard-areas-column.sql` - Dashboard areas field
- `013-add-content-library-ai-fields.sql` - AI analysis fields
- `014-content-library-enhancements.sql` - Content library improvements

### Story 2.1: Progress Tracking (020-029)
- `020-add-progress-percentage.sql` - Task progress column
- `021-add-project-progress.sql` - Project-level progress

### Story 1.4: Daily Scheduling (030-039)
- `030-add-daily-scheduling-columns.sql` - Scheduled date/time, recurrence

### Story 1.6: Performance (040-049)
- `040-optimize-indexes.sql` - Database indexes for performance
- `041-create-error-logs-table.sql` - Error logging table

## Data Migrations

These scripts migrate or populate data. Run as needed:

- `migrate-tasks.sql` - Initial task migration
- `migrate-existing-tasks.sql` - Migrate existing tasks
- `migrate-my-tasks.sql` - Personal task migration
- `copy-tasks-from-tg-to-do-list.sql` - Import from old system
- `backfill-tasks.sql` - Backfill task data
- `seed-sample-data.sql` - Sample data for testing
- `sync-progress-from-status.sql` - Sync progress from status field
- `sync-progress-from-status-v2.sql` - Updated progress sync
- `force-update-progress.sql` - Force progress recalculation

## Running Migrations

### In Supabase Dashboard
1. Go to SQL Editor
2. Run migration files in numerical order (001, 002, 003, etc.)
3. Verify each completes successfully before proceeding

### Checking Applied Migrations
You can track which migrations you've run by maintaining a notes file or checking table structure with:
```sql
\d tasks  -- View table structure
SELECT indexname FROM pg_indexes WHERE tablename = 'tasks';  -- View indexes
```

## Tips

- Always backup your database before running migrations
- Test migrations on a development database first
- Run migrations in order - they may depend on previous changes
- Data migrations can be run multiple times (they're idempotent where possible)
