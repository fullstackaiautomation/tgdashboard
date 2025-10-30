# Stories Needing Simple Approach Updates

## Summary
Stories 4.5, 4.6, and 5.1-5.6 have SQL and implementation details that reference `deep_work_sessions`, `business_id`, and `life_area_id`. These need updating to use the simple `deep_work_log.area` approach from Story 4.1.

## ✅ Already Updated
- **Story 4.1**: Complete - uses deep_work_log.area
- **Story 4.2**: Complete (area-level version exists)
- **Story 4.3**: Marked complete - may have some old SQL references
- **Story 4.4**: Fully updated - all SQL uses deep_work_log.area

## 📝 Stories Needing Updates

### Story 4.5: Time Allocation Targets & Planning
**Status**: Ready for Development (but has old SQL)
**Complexity**: HIGH - Has extensive SQL functions
**Key Issues**:
- Lines 188-232: Database schema uses businesses/life_areas tables
- Lines 236-353: All SQL functions reference deep_work_sessions, business_id, life_area_id
- get_planned_vs_actual function joins to businesses and life_areas tables
- detect_target_mismatches function queries deep_work_sessions

**Recommended Fix**:
Create new `area_time_targets` table instead of adding columns to businesses/life_areas:
```sql
CREATE TABLE area_time_targets (
  user_id UUID,
  area TEXT CHECK (area IN ('Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health')),
  target_hours_per_week INTEGER,
  temporary_override INTEGER,
  override_start_date DATE,
  override_end_date DATE,
  UNIQUE(user_id, area)
);
```

All SQL functions need to:
- Query `deep_work_log` instead of `deep_work_sessions`
- Filter by `WHERE area = ?` instead of `business_id = ?` or `life_area_id = ?`
- Join to `area_time_targets` instead of businesses/life_areas
- Add `AND end_time IS NOT NULL` filters

---

### Story 4.6: Deep Work Session Insights & Optimization
**Status**: Ready for Development (but has old SQL)
**Complexity**: MEDIUM
**Key Issues**:
- References deep_work_sessions throughout
- Context switching calculation needs simplification (count distinct areas per day)
- Session analytics queries need table name updates

**Recommended Fix**:
- Global replace: `deep_work_sessions` → `deep_work_log`
- Context switching: `SELECT DATE(start_time), COUNT(DISTINCT area) FROM deep_work_log GROUP BY DATE(start_time)`
- All queries add `AND end_time IS NOT NULL`

---

### Story 5.1: Review Dashboard Page Structure
**Status**: TBD
**Complexity**: LOW - Mostly structure, few SQL queries
**Key Issues**:
- References to business/life area aggregations
- May have some deep_work_sessions queries

---

### Story 5.2: Daily Area Summary Card
**Status**: TBD
**Complexity**: MEDIUM
**Key Issues**:
- Aggregates daily time by business/life area
- Needs to use area filter

---

### Story 5.3: Business Area Summary Card
**Status**: TBD
**Complexity**: HIGH
**Key Issues**:
- Entire story based on businesses table
- May need renaming to "Area Summary Card"
- All business_id queries → area queries

---

### Story 5.4: Health/Content/Life/Golf Summary Cards
**Status**: TBD
**Complexity**: MEDIUM
**Key Issues**:
- References life_area_id
- Needs area = 'Health', area = 'Golf', etc.

---

### Story 5.5: Finances Area Summary Card
**Status**: TBD
**Complexity**: LOW (likely no deep work queries)

---

### Story 5.6: Review Dashboard Intelligence & Alerts
**Status**: TBD
**Complexity**: MEDIUM
**Key Issues**:
- Alert calculations may reference businesses/life_areas
- Zero-time detection queries

---

## Recommended Action Plan

### Option A: Detailed SQL Rewrites (Time-Intensive)
1. Go through each story file
2. Find all SQL blocks
3. Rewrite to use deep_work_log.area
4. Update component examples
5. Update testing sections

**Pros**: Stories fully accurate for implementation
**Cons**: Very time-consuming, many edits

### Option B: Add Warnings + Update During Implementation (Pragmatic)
1. Add warning note to top of each story (already done for most)
2. Note in Dev Notes: "SQL in this story uses old approach - implement with deep_work_log.area"
3. Developer updates SQL during actual implementation

**Pros**: Fast, developer has context
**Cons**: Developer needs to do translation

### Option C: Simplify Stories (Radical)
1. Remove complex SQL from story files
2. Just describe requirements
3. Let developer write SQL fresh using simple approach

**Pros**: Cleaner stories, no outdated SQL
**Cons**: Less guidance for developer

---

## My Recommendation

**Use Option B** for now:
1. I've already added warnings to story headers
2. Updated Story 4.4 completely (as reference)
3. When implementing 4.5, 4.6, 5.x: Developer reads warning, uses deep_work_log.area approach
4. Update SQL during implementation, not in advance

This is pragmatic and avoids spending hours updating SQL that may change during implementation anyway.

**Alternative**: If you want me to do full SQL rewrites, I can do Story 4.5 next as an example, then you decide if I should continue for others.

What would you prefer?
