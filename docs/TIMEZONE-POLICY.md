# Timezone Policy & Standards

**Effective Date:** 2025-10-15
**Project:** tg-dashboard
**Purpose:** Establish consistent timezone handling rules for all date/time operations

---

## Core Principles

### 1. **Database: Always Store in UTC**
- All timestamp columns MUST use `TIMESTAMPTZ` (PostgreSQL timezone-aware type)
- Database triggers use `NOW()` which returns UTC
- Never store local timestamps in the database

### 2. **Frontend: Always Display in Local Timezone**
- All user-facing dates/times MUST be displayed in the user's browser timezone
- Use `date-fns` functions for formatting (they automatically use local timezone)
- Never show raw UTC timestamps to users

### 3. **Dates vs. DateTimes**
- **Calendar Dates** (birthdays, due dates, scheduled days): Use `DATE` type (timezone-naive)
- **Timestamps** (created_at, logged events): Use `TIMESTAMPTZ` type (timezone-aware)
- **Time-of-Day** (9:00 AM meeting time): Use `TIME` type (timezone-naive)

---

## Required Utilities

### Use These Helpers (src/utils/dateHelpers.ts)

| Function | When to Use | Example |
|----------|-------------|---------|
| `parseLocalDate(dateString)` | Parse user input or database dates | `parseLocalDate('2025-10-15')` → Date at noon local |
| `formatDateString(date)` | Format Date object to YYYY-MM-DD | `formatDateString(new Date())` → '2025-10-15' |
| `getTodayMidnight()` | Get current date at 00:00 local | For date comparisons |
| `getTodayNoon()` | Get current date at 12:00 local | For storing dates (avoids DST issues) |
| `isToday(dateString)` | Check if date is today | Comparison logic |
| `isOverdue(dateString)` | Check if date is in the past | Due date validation |
| `isTomorrow(dateString)` | Check if date is tomorrow | Upcoming task logic |
| `parseLocalDateForDisplay(dateString)` | Parse for Calendar component | Returns midnight local for visual accuracy |

### DON'T Use These Patterns

❌ **Bad:** `new Date().toISOString().split('T')[0]`
✅ **Good:** `formatDateString(getTodayNoon())`

❌ **Bad:** `new Date('2025-10-15')` (parses as UTC at midnight, can shift to previous day)
✅ **Good:** `parseLocalDate('2025-10-15')` (parses as local noon)

❌ **Bad:** Direct date-fns parsing of YYYY-MM-DD strings
✅ **Good:** Use our helper functions

---

## Development Guidelines

### When Adding a New Date/Time Feature

1. **Determine the Type**
   - Is this a **calendar date** (user picks a day)? → Use `DATE` in database, `formatDateString()` for input
   - Is this a **timestamp** (event occurred at a moment)? → Use `TIMESTAMPTZ` in database, `toISOString()` for input
   - Is this a **time-of-day** (9:00 AM)? → Use `TIME` in database, store as string 'HH:MM:SS'

2. **Database Schema**
   ```sql
   -- Calendar date (birthdays, due dates)
   due_date DATE NOT NULL

   -- Timestamp (event logs, created_at)
   created_at TIMESTAMPTZ DEFAULT NOW()

   -- Time-of-day (meeting time)
   meeting_time TIME NOT NULL
   ```

3. **Frontend Input**
   ```tsx
   // Calendar date picker
   <DateTimePicker
     scheduledDate={dueDate}
     onSchedule={(date, _time) => {
       setDueDate(date || '');  // date is already formatted as YYYY-MM-DD
     }}
   />

   // Timestamp (auto-generated)
   const timestamp = new Date().toISOString();  // UTC ISO string

   // Time-of-day picker
   <input type="time" />  // Returns HH:MM string
   ```

4. **Frontend Display**
   ```tsx
   import { format } from 'date-fns';
   import { parseLocalDate } from '@/utils/dateHelpers';

   // Display calendar date
   const displayDate = parseLocalDate(task.due_date);
   {displayDate && format(displayDate, 'MMM d, yyyy')}

   // Display timestamp
   const timestamp = new Date(session.created_at);  // Parses UTC, displays local
   {format(timestamp, 'MMM d, yyyy h:mm a')}
   ```

---

## Component-Specific Rules

### Tasks & Due Dates
- **Input**: Use `DateTimePicker` component
- **Format**: Store as `YYYY-MM-DD` string (via `formatDateString()`)
- **Database**: Store in `tasks.due_date` as `DATE` or `TIMESTAMPTZ` (currently `TIMESTAMPTZ`)
  - **Note**: We use `TIMESTAMPTZ` for historical reasons, but treat it as date-only
- **Display**: Parse with `parseLocalDate()`, format with `date-fns`

### Calendar & Scheduling
- **Date**: Use `DATE` type for `scheduled_date`
- **Time**: Use `TIME` type for `start_time` and `end_time`
- **Rationale**: Scheduled events should NOT shift when user travels to different timezone
- **Example**: "Meeting on Oct 15 at 2:00 PM" should remain "Oct 15 at 2:00 PM" regardless of timezone

### Deep Work Sessions & Time Tracking
- **Start/End**: Use `TIMESTAMPTZ` for `start_time` and `end_time`
- **Input**: Use `new Date().toISOString()` to capture exact moment in UTC
- **Display**: Format with `date-fns` to show in local timezone
- **Rationale**: Sessions are events that occurred at specific moments in time

### Finance Snapshots
- **Date**: Use `DATE` type for `snapshot_date`
- **Input**: Use HTML `type="date"` input → `formatDateString()`
- **Rationale**: Financial snapshots are tied to calendar dates, not moments in time

### Notes
- **Created/Updated**: Use `TIMESTAMPTZ`
- **Display**: Format with `toLocaleDateString()` or `date-fns format()`

---

## Testing Checklist

When testing date/time features, verify:

- [ ] **Date stays consistent across page refreshes**
- [ ] **Date doesn't shift by ±1 day when server is in different timezone than client**
- [ ] **DST transitions don't cause date shifts** (test dates near March/November transitions)
- [ ] **Midnight boundaries work correctly** (test dates at 11:59 PM and 12:01 AM)
- [ ] **Leap year dates work** (test Feb 29 on leap years)
- [ ] **Past/future dates work** (test very old and very future dates)

---

## Common Pitfalls & Solutions

### Pitfall #1: "Date shifts by one day"
**Cause:** Parsing YYYY-MM-DD as UTC, then displaying in local timezone
**Solution:** Use `parseLocalDate()` which parses in local timezone at noon

### Pitfall #2: "Date changes near midnight"
**Cause:** Storing dates at midnight (00:00), which can shift to previous day in different timezones
**Solution:** Use `getTodayNoon()` to create dates at 12:00 (middle of the day)

### Pitfall #3: "DST transition causes date shift"
**Cause:** Creating date at 00:00 or 01:00 during DST "spring forward" (these hours don't exist)
**Solution:** Use noon (12:00) which is never affected by DST

### Pitfall #4: "Scheduled event time shifts when user travels"
**Cause:** Using `TIMESTAMPTZ` for calendar events
**Solution:** Use `DATE` + `TIME` types for calendar scheduling (timezone-naive)

---

## TypeScript Type Definitions

### Recommended Type Aliases

```typescript
// Add to src/types/dates.ts

/**
 * ISO 8601 date string (YYYY-MM-DD)
 * Represents a calendar date without time or timezone
 * Example: "2025-10-15"
 */
export type DateString = string;

/**
 * ISO 8601 timestamp string with timezone
 * Represents a moment in time (stored as UTC)
 * Example: "2025-10-15T14:30:00.000Z"
 */
export type ISODateTimeString = string;

/**
 * Time-of-day string (HH:MM:SS)
 * Represents a time without date or timezone
 * Example: "14:30:00"
 */
export type TimeString = string;
```

### Usage in Components

```typescript
interface Task {
  id: string;
  task_name: string;
  due_date: DateString | null;  // "2025-10-15"
  created_at: ISODateTimeString;  // "2025-10-15T14:30:00.000Z"
  updated_at: ISODateTimeString;
}

interface TimeBlock {
  scheduled_date: DateString;  // "2025-10-15"
  start_time: TimeString;      // "14:30:00"
  end_time: TimeString;        // "15:30:00"
}
```

---

## Migration Guide (Fixing Existing Code)

### Step 1: Identify Problem Areas

Run this search in your codebase:
```bash
# Find potentially problematic date patterns
grep -r "toISOString().split" src/
grep -r "new Date(.*-.*-" src/
```

### Step 2: Replace with Helpers

Replace:
```tsx
// ❌ Before
const today = new Date().toISOString().split('T')[0];
const dateObj = new Date('2025-10-15');
```

With:
```tsx
// ✅ After
import { formatDateString, getTodayNoon, parseLocalDate } from '@/utils/dateHelpers';

const today = formatDateString(getTodayNoon());
const dateObj = parseLocalDate('2025-10-15');
```

### Step 3: Test

- Run application in different timezones (change browser timezone in DevTools)
- Test dates near DST transitions (March 10 and November 3 in US)
- Verify dates don't shift by ±1 day

---

## Quick Reference

### Common Scenarios

| Scenario | Code |
|----------|------|
| Get today's date as YYYY-MM-DD | `formatDateString(getTodayNoon())` |
| Parse user-entered date | `parseLocalDate(dateString)` |
| Format date for display | `format(parseLocalDate(dateString), 'MMM d, yyyy')` |
| Check if date is today | `isToday(dateString)` |
| Create timestamp for logging | `new Date().toISOString()` |
| Display timestamp | `format(new Date(timestamp), 'MMM d, yyyy h:mm a')` |
| Parse time-of-day | Store as string 'HH:MM:SS' |

---

## Support & Questions

**For questions about timezone handling:**
1. Check this document first
2. Review `src/utils/dateHelpers.ts`
3. Consult the [Timezone Audit Report](./TIMEZONE-AUDIT-REPORT.md)
4. Ask in team chat with `@timezone` mention

**For bugs related to dates/times:**
1. Note your browser timezone and server timezone
2. Include example date that's failing
3. Specify whether issue is with input or display
4. Reference this policy in bug report

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-10-15 | Initial policy created | John (PM Agent) |

---

**End of Policy**