# Story Updates Summary - Simple deep_work_log.area Approach

## Stories Updated for Simple Approach

### ✅ Story 4.4 - Complete
- All SQL functions updated to use `deep_work_log.area`
- Removed business_id/life_area_id references
- Updated component examples

### 📝 Stories Needing Updates

**Story 4.5 - Time Allocation Targets & Planning**
Key changes needed:
- Line 151: Update "deep_work_sessions table with business_id, life_area_id" → "deep_work_log table with area (TEXT)"
- Lines 188-232: Replace businesses/life_areas tables with single `area_time_targets` table
- Lines 266-311: Update detect_target_mismatches to query deep_work_log by area
- All `deep_work_sessions` → `deep_work_log`
- All `AND end_time IS NOT NULL` filters needed

**Story 4.6 - Deep Work Session Insights**
- Update all `deep_work_sessions` → `deep_work_log`
- Context switching = count distinct areas per day (simpler!)
- No business_id or life_area_id references

**Story 5.1-5.6 - Review Dashboard Stories**
- Update all references to use `deep_work_log.area`
- Remove business/life_area table joins

## Global Find/Replace Patterns

1. `deep_work_sessions` → `deep_work_log`
2. `business_id` → `area` (where querying time data)
3. `life_area_id` → `area`
4. Add `AND end_time IS NOT NULL` to all duration queries
5. Remove JOINs to businesses/life_areas tables when querying time data

## New Schema Approach for Story 4.5

Instead of:
```sql
ALTER TABLE businesses ADD COLUMN time_target_hours_per_week INTEGER;
ALTER TABLE life_areas ADD COLUMN time_target_hours_per_week INTEGER;
```

Use:
```sql
CREATE TABLE area_time_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area TEXT NOT NULL CHECK (area IN ('Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health')),
  target_hours_per_week INTEGER NOT NULL CHECK (target_hours_per_week >= 0 AND target_hours_per_week <= 168),
  temporary_override INTEGER DEFAULT NULL,
  override_start_date DATE DEFAULT NULL,
  override_end_date DATE DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, area)
);
```

This allows target setting without businesses/life_areas tables!
