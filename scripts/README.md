# Scripts Directory

Utility scripts for database diagnostics, migrations, and maintenance.

## Folders

### `/sql-diagnostics/`
SQL queries for troubleshooting and verification:
- `check-*.sql` - Check database state
- `verify-*.sql` - Verify configurations
- `debug-*.sql` - Debug queries

**Usage:**
```bash
# Run via Supabase SQL Editor or:
psql -h <host> -U <user> -d <db> -f scripts/sql-diagnostics/verify-rls.sql
```

### `/migrations/`
Database migration and data fix scripts:
- `*-migration.js` - Migration runners
- `fix-*.sql` - Data fix queries
- `reset-*.sql` - Reset scripts

**Usage:**
```bash
# Run migration scripts
node scripts/migrations/run-migration.js

# Apply SQL migrations
supabase db push
```

## Notes

- All diagnostic queries are read-only
- Migration scripts should be reviewed before running
- Keep this folder organized by purpose (diagnostics vs. migrations)