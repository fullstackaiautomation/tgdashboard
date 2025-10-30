# Epic 6: Master Calendar & Daily Schedule Synchronization - Brownfield Enhancement

## Epic Goal

Unify the Master Calendar and Daily Schedule systems to use a single source of truth (`task_time_blocks` table), enabling real-time bidirectional synchronization between the two views and providing consistent scheduled task display across the application.

## Epic Description

### Existing System Context

**Current relevant functionality:**
- **Master Calendar (Calendar & Scheduling page)**: Full-featured calendar system using the `task_time_blocks` table with:
  - Weekly/daily calendar views
  - Drag-and-drop task scheduling
  - Time block management (scheduled/in_progress/completed/cancelled statuses)
  - Detailed time tracking (start_time, end_time, planned vs actual duration)
  - Scheduling analytics and conflict detection

- **Daily Schedule Panel (Tasks page - DailySchedulePanel.tsx)**: Simple daily task scheduling using fields directly on the `tasks` table:
  - `scheduled_date` (string YYYY-MM-DD)
  - `scheduled_time` (string HH:MM)
  - No duration tracking
  - No time block management
  - No connection to task_time_blocks table

**Problem:** These are two completely separate, disconnected systems representing conceptually identical data (scheduled tasks). Changes in one do not reflect in the other, creating data inconsistency and user confusion.

**Technology stack:**
- React 19.1.1 + TypeScript 5.9.3
- Supabase PostgreSQL with real-time subscriptions
- React Query (@tanstack/react-query) for data management
- date-fns for date handling
- @dnd-kit for drag-and-drop
- Existing real-time sync infrastructure (useRealtimeSync hook)

**Integration points:**
- Both systems connect to the `tasks` table for task metadata
- Master Calendar uses `task_time_blocks` table (20251014190000_create_calendar_scheduling.sql)
- Daily Schedule currently reads/writes `scheduled_date` and `scheduled_time` directly on `tasks`
- Existing hooks: `useCalendar.ts`, `useTasks.ts`
- Real-time sync: Supabase subscriptions via `useRealtimeSync.ts`

### Enhancement Details

**What's being added/changed:**

1. **Data Model Unification**:
   - Make `task_time_blocks` the single source of truth for all scheduled tasks
   - Migrate existing `tasks.scheduled_date` and `tasks.scheduled_time` data to `task_time_blocks`
   - Mark `tasks.scheduled_date` and `tasks.scheduled_time` as deprecated (maintain for backward compatibility during transition)

2. **Daily Schedule Panel Refactoring**:
   - Update `DailySchedulePanel.tsx` to query `task_time_blocks` instead of task fields
   - Add support for time duration display (not just start time)
   - Add time block status indicators (scheduled/in_progress/completed)
   - Maintain drag-and-drop functionality but create time_blocks on drop

3. **Real-time Synchronization**:
   - Extend existing `useRealtimeSync` to subscribe to `task_time_blocks` table changes
   - Ensure both Calendar and Daily Schedule views update in real-time when time blocks change
   - Maintain sub-500ms latency for updates (existing system standard)

4. **Hooks Enhancement**:
   - Update `useTasks.ts` to include time block data when fetching tasks
   - Ensure `useCalendar.ts` hooks work seamlessly with Daily Schedule
   - Add helper functions for common time block operations

**How it integrates:**
- Extends existing calendar scheduling system (already production-ready)
- Leverages existing real-time sync infrastructure
- Uses established patterns from Business → Tasks Hub bidirectional sync (Epic 1)
- Maintains all existing Calendar page functionality unchanged
- Follows timezone policy from TIMEZONE-POLICY.md (use local timezone helpers from dateHelpers.ts)

**Success criteria:**
1. ✅ Master Calendar and Daily Schedule show identical scheduled tasks
2. ✅ Real-time sync works bidirectionally (changes in either view reflect instantly in the other)
3. ✅ All existing `tasks.scheduled_date`/`scheduled_time` data successfully migrated to `task_time_blocks`
4. ✅ Zero data loss during migration
5. ✅ Drag-and-drop scheduling works from both interfaces
6. ✅ Time duration and status tracking available in both views
7. ✅ Real-time update latency remains sub-500ms
8. ✅ No regression in existing Calendar page features
9. ✅ No regression in existing Tasks Hub functionality
10. ✅ Timezone handling follows established policy (local timezone throughout frontend, UTC in database)

## Stories

### Story 6.1: Data Migration - Scheduled Tasks to Time Blocks
**Goal:** Migrate all existing scheduled task data from `tasks` table to `task_time_blocks` without data loss.

**Scope:**
- Create migration script to move `tasks.scheduled_date` + `scheduled_time` → `task_time_blocks`
- Default duration: 60 minutes (1 hour) if not specified
- Default status: 'scheduled'
- Handle edge cases (null values, invalid times, duplicate entries)
- Verification queries to confirm data integrity
- Rollback plan for migration

**Acceptance Criteria:**
- All tasks with `scheduled_date` have corresponding `task_time_blocks` entries
- Data integrity verified (no orphaned records)
- Migration is idempotent (can be run multiple times safely)
- Zero data loss confirmed via comparison queries

### Story 6.2: Daily Schedule Panel - Time Blocks Integration
**Goal:** Refactor Daily Schedule Panel to use `task_time_blocks` as data source instead of task fields.

**Scope:**
- Update `DailySchedulePanel.tsx` to query from `task_time_blocks` via `useCalendar` hooks
- Display time duration (not just start time): "9:00 AM - 10:30 AM (1.5h)"
- Show time block status badges (scheduled/in_progress/completed)
- Update drag-and-drop to create `task_time_blocks` entries (not update task fields)
- Add remove-from-schedule functionality (delete time block, not task)
- Maintain existing UI/UX patterns and styling

**Acceptance Criteria:**
- Daily Schedule displays tasks from `task_time_blocks` table
- Time duration shown for each scheduled task
- Status indicators visible and color-coded
- Drag-and-drop creates time blocks successfully
- Remove from schedule works without deleting task
- Existing timezone helpers used correctly (formatDateString, getTodayNoon, etc.)
- No visual regression in Daily Schedule UI

### Story 6.3: Real-time Sync - Bidirectional Schedule Updates
**Goal:** Implement real-time synchronization so changes in either Calendar or Daily Schedule instantly reflect in both views.

**Scope:**
- Extend `useRealtimeSync` hook to subscribe to `task_time_blocks` table changes
- Update both `Calendar.tsx` and `DailySchedulePanel.tsx` to use real-time subscription
- Invalidate React Query caches on time block changes
- Test bidirectional scenarios:
  - Schedule task in Calendar → appears in Daily Schedule
  - Schedule task in Daily Schedule → appears in Calendar
  - Edit time block in Calendar → updates in Daily Schedule
  - Complete time block → status updates in both views
  - Delete time block → removes from both views
- Performance testing to maintain sub-500ms latency

**Acceptance Criteria:**
- Changes in Calendar reflect in Daily Schedule within 500ms
- Changes in Daily Schedule reflect in Calendar within 500ms
- No duplicate entries or race conditions
- Real-time subscription cleanup on component unmount
- React Query cache invalidation working correctly
- Performance benchmarks met (sub-500ms update latency)

## Compatibility Requirements

- [x] Existing `get_calendar_view()`, `get_daily_schedule()`, and other calendar functions remain unchanged
- [x] `tasks` table schema unchanged (no columns dropped)
- [x] `task_time_blocks` table schema unchanged (already supports all requirements)
- [x] Calendar page functionality unchanged (no breaking changes)
- [x] Tasks Hub core functionality unchanged
- [x] All existing hooks maintain backward compatibility
- [x] UI changes follow existing design patterns and color schemes
- [x] Performance impact is negligible (leverage existing real-time infrastructure)
- [x] Timezone handling follows TIMEZONE-POLICY.md throughout

## Risk Mitigation

### Primary Risks

1. **Data Loss During Migration**
   - **Mitigation:**
     - Create migration script with dry-run mode
     - Backup `tasks` table before migration
     - Verification queries to confirm all data migrated
     - Keep `scheduled_date` and `scheduled_time` columns intact (mark deprecated)
   - **Rollback:** Original data remains in `tasks` table, can revert UI changes

2. **Real-time Sync Performance Degradation**
   - **Mitigation:**
     - Reuse existing `useRealtimeSync` infrastructure (already proven)
     - Add indexed queries on `task_time_blocks.scheduled_date`
     - Implement debouncing for rapid updates
     - Performance testing before deployment
   - **Rollback:** Disable real-time subscriptions, fall back to polling

3. **Breaking Existing Calendar Functionality**
   - **Mitigation:**
     - No changes to Calendar.tsx core logic
     - Only add new Daily Schedule subscription
     - Comprehensive regression testing
     - Feature flag to enable/disable sync
   - **Rollback:** Remove real-time subscription, revert Daily Schedule changes

4. **Timezone Bugs**
   - **Mitigation:**
     - Use only approved helpers from `src/utils/dateHelpers.ts`
     - Follow TIMEZONE-POLICY.md strictly
     - Test with tasks scheduled across day boundaries
   - **Rollback:** Data stored in UTC (safe), only UI display affected

### Rollback Plan

**Story 6.1 Rollback:**
- Migration script has `--rollback` flag to delete created time blocks
- Original data intact in `tasks` table
- Can re-run migration after fixes

**Story 6.2 Rollback:**
- Git revert Daily Schedule Panel changes
- Re-enable direct `tasks` table queries
- Remove time block creation logic

**Story 6.3 Rollback:**
- Disable real-time subscription via feature flag
- Remove React Query cache invalidation
- Both views continue working independently

## Definition of Done

### Story 6.1 Complete When:
- [ ] Migration script created and tested on staging data
- [ ] All scheduled tasks migrated to `task_time_blocks`
- [ ] Verification queries confirm 100% data integrity
- [ ] Zero data loss confirmed
- [ ] Rollback plan tested and documented

### Story 6.2 Complete When:
- [ ] Daily Schedule Panel queries `task_time_blocks` table
- [ ] Time duration displayed for all scheduled tasks
- [ ] Status badges shown and color-coded correctly
- [ ] Drag-and-drop creates time blocks (not updates tasks)
- [ ] Remove-from-schedule functionality working
- [ ] No visual regressions
- [ ] Timezone handling verified correct

### Story 6.3 Complete When:
- [ ] Real-time sync working bidirectionally
- [ ] Calendar changes appear in Daily Schedule < 500ms
- [ ] Daily Schedule changes appear in Calendar < 500ms
- [ ] No duplicate entries or race conditions
- [ ] React Query cache invalidation working
- [ ] Performance benchmarks met
- [ ] Real-time subscription cleanup verified

### Epic 6 Complete When:
- [ ] All three stories completed with acceptance criteria met
- [ ] Integration testing confirms bidirectional sync working end-to-end
- [ ] No regression in Calendar page features
- [ ] No regression in Tasks Hub features
- [ ] Performance metrics within acceptable ranges
- [ ] Documentation updated (CLAUDE.md, TIMEZONE-POLICY references)
- [ ] Code review completed
- [ ] Ready for production deployment

---

## Technical Notes

### Existing Patterns to Follow

1. **Real-time Sync Pattern** (from Epic 1 - Business ↔ Tasks Hub sync):
   - Use `useRealtimeSync` hook with Supabase subscriptions
   - Invalidate React Query caches on changes
   - Handle subscription cleanup in useEffect return

2. **Timezone Handling** (from TIMEZONE-POLICY.md):
   ```typescript
   import { formatDateString, getTodayNoon, parseLocalDate } from '@/utils/dateHelpers';

   // ✅ Get today's date as YYYY-MM-DD
   const today = formatDateString(getTodayNoon());

   // ✅ Parse user-entered date
   const dateObj = parseLocalDate('2025-10-15');

   // ✅ Display timestamp
   {format(new Date(timestamp), 'MMM d, yyyy h:mm a')}
   ```

3. **Drag-and-Drop Pattern** (from MasterCalendar.tsx):
   - Use `@dnd-kit/core` for drag-drop
   - Create time blocks via `useCreateTimeBlock` hook
   - Handle drop events with date/time parsing

### Key Constraints

- **No Breaking Changes:** Calendar page must continue working exactly as before
- **Backward Compatibility:** Keep `tasks.scheduled_date` and `scheduled_time` for gradual migration
- **Performance:** Real-time updates must remain sub-500ms (existing system standard)
- **Data Integrity:** Zero data loss during migration is non-negotiable
- **Timezone Safety:** Follow TIMEZONE-POLICY.md exactly to avoid timezone bugs

### Dependencies

- Migration script (Story 6.1) must complete before UI changes (Story 6.2)
- UI refactoring (Story 6.2) must complete before real-time sync (Story 6.3)
- All stories depend on existing `task_time_blocks` table (already deployed)
- Existing `useRealtimeSync` infrastructure required for Story 6.3

---

## Handoff Notes

This epic extends the existing Calendar & Scheduling system to unify it with the Daily Schedule view on the Tasks page. The architecture is already in place (`task_time_blocks` table, calendar hooks, real-time sync infrastructure), so this is primarily integration work following established patterns.

**Key Success Factors:**
1. Follow the timezone policy religiously (use dateHelpers.ts)
2. Reuse existing real-time sync patterns from Epic 1
3. Maintain existing Calendar page functionality unchanged
4. Test migration thoroughly before UI changes
5. Validate bidirectional sync with comprehensive integration tests

**Critical References:**
- Calendar System: `src/pages/Calendar.tsx`, `src/components/calendar/MasterCalendar.tsx`
- Daily Schedule: `src/components/tasks/DailySchedulePanel.tsx`
- Time Block Hooks: `src/hooks/useCalendar.ts`
- Real-time Sync: `src/hooks/useRealtimeSync.ts`
- Migration SQL: `supabase/migrations/20251014190000_create_calendar_scheduling.sql`
- Timezone Policy: `docs/TIMEZONE-POLICY.md`
- Date Helpers: `src/utils/dateHelpers.ts`