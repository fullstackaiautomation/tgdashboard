# Timezone & Date/Time Handling Audit Report

**Generated:** 2025-10-15
**Project:** tg-dashboard
**Purpose:** Comprehensive audit of all timezone and date/time handling across the application

---

## Executive Summary

This audit reveals **inconsistent timezone handling** across the tg-dashboard application, with a mix of:
- **Database**: PostgreSQL `TIMESTAMPTZ` (timezone-aware) and `DATE`/`TIME` (timezone-naive)
- **Frontend**: Local timezone with custom helpers + `date-fns` library
- **User Input**: HTML5 date/time inputs (local browser timezone)

### Critical Finding
**The application uses LOCAL TIMEZONE throughout the frontend but stores timestamps in UTC in the database.** This is generally correct, but there are **inconsistencies in how dates vs. datetimes are handled** that can cause off-by-one-day errors.

---

## Database Schema Analysis

### Timezone-Aware Columns (`TIMESTAMPTZ`)

All timestamp columns use `TIMESTAMPTZ`, which stores in **UTC** and converts based on server/client timezone:

| Table | Column | Type | Usage |
|-------|--------|------|-------|
| **tasks** | `due_date` | `TIMESTAMPTZ` | Task due dates |
| **tasks** | `completed_at` | `TIMESTAMPTZ` | Completion timestamp |
| **tasks** | `scheduled_start` | `TIMESTAMPTZ` | Scheduled start time |
| **tasks** | `scheduled_end` | `TIMESTAMPTZ` | Scheduled end time |
| **tasks** | `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| **tasks** | `updated_at` | `TIMESTAMPTZ` | Last update timestamp |
| **tasks** | `last_recurring_date` | `TIMESTAMPTZ` | Last recurrence date |
| **businesses** | `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| **businesses** | `updated_at` | `TIMESTAMPTZ` | Last update timestamp |
| **projects** | `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| **projects** | `updated_at` | `TIMESTAMPTZ` | Last update timestamp |
| **phases** | `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| **phases** | `updated_at` | `TIMESTAMPTZ` | Last update timestamp |
| **notes** | `created_at` | `TIMESTAMP WITH TIME ZONE` | Note creation |
| **notes** | `updated_at` | `TIMESTAMP WITH TIME ZONE` | Note last update |
| **deep_work_sessions** | `start_time` | `TIMESTAMPTZ` | Session start |
| **deep_work_sessions** | `end_time` | `TIMESTAMPTZ` | Session end |
| **deep_work_sessions** | `created_at` | `TIMESTAMPTZ` | Creation timestamp |
| **deep_work_sessions** | `updated_at` | `TIMESTAMPTZ` | Last update timestamp |

**Timezone Behavior**: All `TIMESTAMPTZ` columns:
- Store values in **UTC**
- Return values converted to the **client session timezone** (default: server timezone)
- Accept input in any timezone and convert to UTC

### Timezone-Naive Columns (`DATE` / `TIME`)

These columns do **NOT** have timezone awareness:

| Table | Column | Type | Usage |
|-------|--------|------|-------|
| **task_time_blocks** | `scheduled_date` | `DATE` | Calendar date (YYYY-MM-DD) |
| **task_time_blocks** | `start_time` | `TIME` | Time of day (HH:MM:SS) |
| **task_time_blocks** | `end_time` | `TIME` | Time of day (HH:MM:SS) |
| **balance_snapshots** | `snapshot_date` | `DATE` (inferred) | Finance snapshot date |
| **net_worth_log** | `snapshot_date` | `DATE` (inferred) | Net worth log date |

**Timezone Behavior**: `DATE` and `TIME` columns:
- Store values **as-is** without timezone conversion
- Suitable for "calendar dates" and "time of day" that should NOT shift based on timezone

---

## Frontend Date/Time Handling

### Date Utility Library: `date-fns@4.1.0`

The application uses `date-fns` for date manipulation. Key functions:

| Function | Timezone Behavior |
|----------|-------------------|
| `format()` | Uses **local timezone** |
| `parseISO()` | Parses ISO strings to **local timezone** |
| `startOfWeek()` | Operates in **local timezone** |
| `addDays()`, `addWeeks()` | Timezone-agnostic arithmetic |
| `isSameDay()` | Compares in **local timezone** |
| `differenceInMinutes()` | Timezone-agnostic |

**Note:** `date-fns` does NOT have built-in timezone support. All operations occur in the browser's local timezone.

### Custom Date Helpers (`src/utils/dateHelpers.ts`)

The application has custom utilities to handle date/time consistently:

```typescript
// Key helpers (all use LOCAL timezone)
parseLocalDate(dateString)      // Parse YYYY-MM-DD → Date at NOON local
parseLocalDateForDisplay()      // Parse YYYY-MM-DD → Date at MIDNIGHT local
formatDateString(date)          // Date → "YYYY-MM-DD" local
getTodayMidnight()              // Today at 00:00 local
getTodayNoon()                  // Today at 12:00 local (for storage)
isToday(dateString)             // Check if date is today (local)
isOverdue(dateString)           // Check if date is before today (local)
isTomorrow(dateString)          // Check if date is tomorrow (local)
```

**Design Philosophy:**
- **Storage dates at NOON** (12:00 local) to avoid DST boundary issues
- **Display dates at MIDNIGHT** (00:00 local) for calendar components
- **Always use local timezone** - no UTC conversion on frontend

---

## Component-by-Component Audit

### 1. Tasks Page

#### Add New Task ([AddTaskModal.tsx](../src/components/tasks/AddTaskModal.tsx))
- **Due Date Input**: HTML `type="date"` picker via [DateTimePicker.tsx](../src/components/tasks/DateTimePicker.tsx)
  - Uses `react-day-picker` Calendar component
  - Formats as `YYYY-MM-DD` using `formatDateString()`
  - Stores at MIDNIGHT local time, normalized to `YYYY-MM-DD`
  - **Timezone**: LOCAL

#### Task Card Pop-Up ([EnhancedTaskCard.tsx](../src/components/tasks/EnhancedTaskCard.tsx))
- **Displays**: Due date, created time, completed time
- **Formatting**: Uses `date-fns` `format()` in LOCAL timezone
- **Timezone**: LOCAL display

#### Created Time & Completed Time
- **Database**: `tasks.created_at`, `tasks.completed_at` as `TIMESTAMPTZ`
- **Set by**: Database trigger `NOW()` (server UTC time)
- **Display**: Formatted in LOCAL timezone via `date-fns`
- **Timezone**: UTC storage → LOCAL display

### 2. Daily Schedule ([Schedule.tsx](../src/components/daily/Schedule.tsx), [DailySchedulePanel.tsx](../src/components/tasks/DailySchedulePanel.tsx))
- **Date Selection**: HTML `type="date"` input
- **Time Display**: `date-fns format()`
- **Timezone**: LOCAL

### 3. Calendar & Scheduling

#### Master Calendar ([MasterCalendar.tsx](../src/components/calendar/MasterCalendar.tsx))
- **Date Range**: Week selection using `date-fns startOfWeek()`, `addDays()`
- **Time Blocks**: Reads from `task_time_blocks` table
  - `scheduled_date`: `DATE` (timezone-naive)
  - `start_time`/`end_time`: `TIME` (timezone-naive)
- **Display**: Uses `parseISO()` and `format()` from `date-fns`
- **Timezone**: LOCAL (date-fns operates in local timezone)

#### Task Scheduler ([TaskScheduler.tsx](../src/components/calendar/TaskScheduler.tsx))
- **Similar to Master Calendar**
- **Timezone**: LOCAL

### 4. Daily Time Tracker

#### Log Time Button ([DailyTime.tsx](../src/pages/DailyTime.tsx), [DeepWorkLogView.tsx](../src/components/daily-time/DeepWorkLogView.tsx))
- **Session Logging**: Writes to `deep_work_sessions` table
- **Start/End Times**: `deep_work_sessions.start_time/end_time` as `TIMESTAMPTZ`
- **Input**: Uses `new Date().toISOString()` (UTC)
- **Display**: Formatted in LOCAL via `date-fns`
- **Timezone**: UTC storage → LOCAL display

### 5. Projects

#### Due Date on Task Cards ([PhaseCard.tsx](../src/components/business/PhaseCard.tsx), [TaskForm.tsx](../src/components/business/TaskForm.tsx))
- **Input**: HTML `type="date"`
- **Storage**: `tasks.due_date` as `TIMESTAMPTZ`
- **Timezone**: LOCAL input → UTC storage → LOCAL display

### 6. Finance

#### Calendar Pop-Up ([FinanceOverview.tsx](../src/components/finance/FinanceOverview.tsx))
- **Date Selection**: Line 14: `new Date().toISOString().split('T')[0]` (gets YYYY-MM-DD)
- **Input**: HTML `type="date"` (line 223-226)
- **Storage**: `balance_snapshots.snapshot_date` as `DATE` (timezone-naive)
- **Timezone**: LOCAL browser date used directly

### 7. Deep Work Session Log

#### Add Session Time ([AddDeepWorkSessionModal.tsx](../src/components/tasks/AddDeepWorkSessionModal.tsx))
- **Start Time**: Uses `new Date().toISOString()` (UTC timestamp)
- **Database**: `deep_work_sessions.start_time` as `TIMESTAMPTZ`
- **Timezone**: UTC

#### Session Cards ([DeepWorkSessions.tsx](../src/components/tasks/DeepWorkSessions.tsx), [DeepWorkLogView.tsx](../src/components/daily-time/DeepWorkLogView.tsx))
- **Display**: `date-fns format()` in LOCAL timezone
- **Timezone**: UTC storage → LOCAL display

#### Deep Work Session Timer ([DeepWorkTimer.tsx](../src/components/deep-work/DeepWorkTimer.tsx))
- **Line 99**: `start_time: new Date().toISOString()` (UTC)
- **Line 63-66**: Elapsed time calculation using `new Date(activeSession.start_time).getTime()` and `Date.now()`
- **Timezone**: UTC storage, LOCAL calculation

### 8. Notes

#### Date on Note Cards ([NotesBoard.tsx](../src/components/notes/NotesBoard.tsx))
- **Display**: Line 368: `new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`
- **Timezone**: UTC → LOCAL display

---

## Identified Issues & Risks

### 🔴 **Critical Issues**

1. **Mixed Date vs. DateTime Handling**
   - Some components use `DATE` type (timezone-naive calendar dates)
   - Others use `TIMESTAMPTZ` (timezone-aware timestamps)
   - **Risk**: Off-by-one day errors when user timezone differs from server timezone

2. **Inconsistent Date Formatting**
   - Finance: `new Date().toISOString().split('T')[0]`
   - Tasks: Custom `formatDateString()` helper
   - Deep Work: `new Date().toISOString()`
   - **Risk**: Different code paths may produce different results for same date

### ⚠️ **Medium Issues**

3. **No Explicit Timezone Configuration**
   - Application assumes browser/server timezones are compatible
   - No timezone selector or awareness for users
   - **Risk**: Users in different timezones may see different dates for same data

4. **DST Boundary Issues (Partially Mitigated)**
   - Custom helpers use "noon" for storage to avoid DST issues
   - But not all code paths use these helpers
   - **Risk**: Tasks created near DST transitions may shift dates

5. **Date Picker Component Inconsistency**
   - `DateTimePicker.tsx` creates dates at MIDNIGHT for display but NOON for storage
   - Multiple normalization steps can accumulate errors
   - **Risk**: Visual selection may not match stored value

### ✅ **No Issues (Working Correctly)**

6. **Timestamp Storage & Display**
   - All `created_at`, `updated_at` timestamps correctly use `TIMESTAMPTZ`
   - Database `NOW()` function produces UTC timestamps
   - Frontend displays in local timezone via `date-fns`
   - **Status**: Working as expected

7. **Time-of-Day Storage**
   - `task_time_blocks` uses `DATE` + `TIME` (correct for calendar scheduling)
   - Avoids timezone shifts for scheduled events
   - **Status**: Correct design pattern

---

## Recommendations

### ✅ **Quick Wins (Immediate)**

1. **Standardize Date String Formatting**
   - Replace `new Date().toISOString().split('T')[0]` with `formatDateString(getTodayNoon())`
   - Use `parseLocalDate()` consistently for all date parsing
   - **Impact**: Ensures consistent date handling across all components

2. **Document Timezone Policy**
   - Create `docs/TIMEZONE-POLICY.md` with explicit rules
   - Add inline comments to all date/time manipulation code
   - **Impact**: Prevents future regressions

3. **Add Type Safety**
   - Create distinct types for `DateString` vs `ISODateTimeString`
   - Use TypeScript to enforce correct usage
   - **Impact**: Catch errors at compile time

### 🔧 **Medium-Term Improvements**

4. **Centralize Date Utilities**
   - Move ALL date operations to `src/utils/dateHelpers.ts`
   - Deprecate direct `new Date()` usage in components
   - **Impact**: Single source of truth for date logic

5. **Add Timezone Display**
   - Show user's detected timezone in UI (e.g., header)
   - Add timezone to all timestamp displays (e.g., "2:30 PM PST")
   - **Impact**: User awareness of timezone context

6. **Implement Date Validation**
   - Add validation to ensure dates are in expected format
   - Warn on DST boundary dates
   - **Impact**: Catch edge cases before they cause bugs

### 🚀 **Long-Term Enhancements**

7. **Consider Timezone Library**
   - Evaluate `date-fns-tz` for explicit timezone support
   - Or `luxon` / `dayjs` with timezone plugins
   - **Impact**: More robust timezone handling

8. **Per-User Timezone Settings**
   - Allow users to set preferred timezone
   - Store in user profile
   - Convert all displays to user timezone
   - **Impact**: Better multi-timezone support

9. **Audit & Test Suite**
   - Create test suite for timezone edge cases
   - Test DST transitions, midnight boundaries, leap years
   - **Impact**: Confidence in date handling correctness

---

## Date/Time Component Checklist

Based on your original list, here's the detailed breakdown:

### ✅ Tasks Page

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Add New Task** | LOCAL (browser) | User selection via `DateTimePicker` → `formatDateString()` → `due_date` | ✅ Uses local TZ consistently |
| **Daily Schedule** | LOCAL (browser) | `date-fns` `format()` from `scheduled_start/end` | ✅ UTC → Local display |
| **Task Card Pop Up** | LOCAL (browser) | `due_date`, `created_at`, `completed_at` via `date-fns` | ✅ UTC → Local display |
| **Created Time** | UTC (database) | `tasks.created_at` set by `NOW()` trigger | ✅ Correct |
| **Completed Time** | UTC (database) | `tasks.completed_at` set by application | ✅ Correct |

### ✅ Calendar & Scheduling

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Master Calendar** | LOCAL (browser) | `task_time_blocks.scheduled_date` (DATE) + `start_time/end_time` (TIME) | ⚠️ DATE/TIME are timezone-naive (correct for calendar) |
| **Task Scheduler** | LOCAL (browser) | Same as Master Calendar | ⚠️ Timezone-naive by design |

### ✅ Daily Time Tracker

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Log Time Button** | LOCAL (browser) | User interaction → `deep_work_sessions.start_time` (UTC) | ✅ Correct |

### ✅ Projects

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Due Date on Task Cards** | LOCAL (browser) | `tasks.due_date` (TIMESTAMPTZ) | ✅ UTC → Local display |

### ✅ Finance

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Calendar Pop Up** | LOCAL (browser) | HTML `type="date"` → `balance_snapshots.snapshot_date` (DATE) | ⚠️ Uses `toISOString().split('T')[0]` - should use helper |

### ✅ Deep Work Session Log

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Add Session Time** | UTC (ISO string) | `new Date().toISOString()` → `deep_work_sessions.start_time` | ✅ Correct |
| **Session Cards** | LOCAL (browser) | `date-fns format()` from `start_time`/`end_time` | ✅ UTC → Local display |

### ✅ Deep Work Session Timer

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Timer Start** | UTC (ISO string) | `new Date().toISOString()` | ✅ Correct |
| **Elapsed Time** | LOCAL (browser) | Client-side calculation | ✅ Correct |

### ✅ Notes

| Component | Timezone Setting | Date/Time Populates From | Status |
|-----------|------------------|--------------------------|--------|
| **Date on Note Cards** | LOCAL (browser) | `toLocaleDateString()` from `notes.updated_at` | ✅ UTC → Local display |

---

## Missing Components

The following were NOT found in the codebase during this audit:

- **Time Tracking Modal** (mentioned in original list but not found)
- **Daily Schedule Panel** (exists but similar to Daily Schedule)

---

## Conclusion

### Current State: **Mostly Functional with Inconsistencies**

The application's timezone handling is **generally correct** for single-timezone usage (user's browser timezone = server timezone), but has **risks for multi-timezone scenarios** and **some inconsistencies in date formatting**.

### Key Takeaways:

1. ✅ **Database timestamps (`TIMESTAMPTZ`)** are correctly stored in UTC
2. ✅ **Frontend display** correctly converts UTC → local timezone
3. ⚠️ **Calendar dates (`DATE`/`TIME`)** are timezone-naive by design (this is correct)
4. 🔴 **Date formatting** is inconsistent across components
5. 🔴 **No explicit timezone policy** documented for developers

### Recommended Next Steps:

1. Implement **Quick Win #1** (standardize date formatting) TODAY
2. Create **TIMEZONE-POLICY.md** documentation THIS WEEK
3. Add **type safety** for date strings THIS SPRINT
4. Plan **medium-term improvements** for next quarter

---

## Appendix: Complete Date/Time Locations

### Frontend Components (63 files found)
```
src/App.tsx
src/components/business/BusinessDashboard.tsx
src/components/business/ProjectCard.tsx
src/components/business/PhaseCard.tsx
src/components/business/PhaseTasksList.tsx
src/pages/DailyTime.tsx
src/components/daily/EndOfDaySummary.tsx
src/components/daily/TimeAllocation.tsx
src/components/daily/DueTodayCard.tsx
src/components/daily/DailyProgressHeader.tsx
src/pages/Planning.tsx
src/components/review/FinancesAreaCard.tsx
src/pages/DeepWorkInsights.tsx
src/components/calendar/MasterCalendar.tsx
src/components/daily-time/DeepWorkLogView.tsx
src/components/daily-time/DailyScheduleView.tsx
src/pages/Calendar.tsx
src/components/calendar/TaskScheduler.tsx
src/components/planning/TaskBasedAllocation.tsx
src/components/planning/PlannedVsActualDashboard.tsx
src/pages/TimeTargetsSettings.tsx
src/pages/TimeAnalytics.tsx
src/components/analytics/TimeAllocationTrendGraph.tsx
src/components/analytics/WeeklyHeatmap.tsx
src/components/analytics/DateRangeSelector.tsx
src/components/deep-work/DeepWorkTimer.tsx
src/components/tasks/DeepWorkSidebar.tsx
src/components/shared/LabelSelector.tsx
src/components/health/ScheduleHealthTimeButton.tsx
src/components/health/WeeklyHealthSummary.tsx
src/components/health/HealthTimeWarning.tsx
src/components/analytics/WeeklyTimeChart.tsx
src/components/analytics/MonthlyTimeTrend.tsx
src/components/analytics/AreaTimeTrend.tsx
src/components/analytics/AreaLabelBreakdown.tsx
src/components/tasks/DeepWorkSessions.tsx
src/components/tasks/AddDeepWorkSessionModal.tsx
src/components/Header.tsx
src/components/shared/MaskedField.tsx
src/components/tasks/TaskCard.tsx
src/components/tasks/AddTaskModal.tsx
src/components/tasks/TasksHub.tsx
src/components/tasks/EditDeepWorkSessionModal.tsx
src/components/business/EditTaskModal.tsx
src/components/notes/NotesBoard.tsx
src/components/tasks/DateTimePicker.tsx
src/components/tasks/EnhancedTaskCard.tsx
src/components/tasks/DailySchedulePanel.tsx
src/components/finance/FinanceOverview.tsx
src/components/ui/calendar.tsx
src/components/daily/TodoList.tsx
src/components/shared/SyncStatusIndicator.tsx
src/components/daily/Schedule.tsx
src/components/content/DetailsModal.tsx
src/components/ContentLibrary.tsx
src/components/TodoList.tsx
```

### Database Migrations (67 SQL files found)
```
sql/migrations/003-schedule-log-table.sql
sql/migrations/002-content-library-schema.sql
sql/migrations/001-tasks-hub-schema.sql
supabase/migrations/20251009220000_create_finance_tables.sql
supabase/migrations/20251010100000_create_deep_work_sessions.sql
supabase/migrations/20251010190000_create_notes.sql
supabase/migrations/20251014120000_recreate_deep_work_sessions.sql
supabase/migrations/20251014190000_create_calendar_scheduling.sql
... (+ 59 more migration files)
```

### Key Utilities
```
src/utils/dateHelpers.ts - Custom date helper functions
package.json - date-fns@4.1.0, react-day-picker@9.11.1
```

---

**End of Report**