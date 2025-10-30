# Recurring Tasks System Deployment Guide

## Overview

The recurring tasks system has been fully implemented and deployed to production. This document provides:
1. **Deployment Status** - Current state of the implementation
2. **Setup Instructions** - How to configure the cron job trigger
3. **How It Works** - Technical details of the system
4. **Testing** - How to verify functionality

## Deployment Status

✅ **COMPLETED:**
- Edge Function created: `supabase/functions/generate-recurring-tasks/index.ts`
- Function deployed to Supabase (project: `rnlijzolilwweptwbakv`)
- Frontend recurring task creation in `AddTaskModal.tsx`
- Recurring task generator utility in `src/utils/recurringTaskGenerator.ts`

⏳ **PENDING:**
- Cron job trigger setup in Supabase Dashboard
- Testing the weekly auto-generation in production

## How the System Works

### User-Initiated Recurring Task Creation (COMPLETE)

When a user creates a recurring task in the UI:

1. **Form Input**: User fills out task details and checks "Make recurring"
2. **Pattern Selection**: User selects from: Weekdays (M-F), Weekly, Biweekly, Monthly
3. **Generation**: The `generateWeekTasks()` utility creates task instances for the **current week**
   - **Weekdays pattern**: Creates 5 tasks (Monday-Friday of current week)
   - **Weekly pattern**: Creates 1 task (Monday of current week)
   - **Biweekly pattern**: Creates 1 task (Monday of current week, every 2 weeks)
   - **Monthly pattern**: Creates 1 task (Monday of current week, monthly)
4. **Naming**: Each task gets the date appended (e.g., "Daily Standup 10/27")

**Example Timeline:**
- **Today (10/26)**: User creates "Daily Standup" as recurring (weekdays)
  - Creates: "Daily Standup 10/28", "Daily Standup 10/29", "Daily Standup 10/30", "Daily Standup 10/31", "Daily Standup 11/01"
  - Due dates: 10/28, 10/29, 10/30, 10/31, 11/01

### Automated Weekly Generation (DEPLOYMENT PENDING)

Each week, the Edge Function automatically generates the next week's tasks:

1. **Trigger**: Cron job runs weekly (suggested: Sunday 11:59 PM or Monday 12:01 AM)
2. **Execution**: Edge Function queries all tasks with `recurring_type` set
3. **Generation**: For each parent task, creates instances for the upcoming week
4. **Properties**: Copies all properties (description, effort_level, automation, hours_projected, business_id, project_id, phase_id)
5. **Linking**: Links each new task to parent via `recurring_parent_id`

**Example Timeline (Continued):**
- **11/02 (Sunday) at 11:59 PM**: Cron job runs
  - Queries the "Daily Standup" parent task
  - Creates: "Daily Standup 11/04", "Daily Standup 11/05", "Daily Standup 11/06", "Daily Standup 11/07", "Daily Standup 11/08"
  - Due dates: 11/04, 11/05, 11/06, 11/07, 11/08
- **11/09 (Sunday) at 11:59 PM**: Cycle repeats for week of 11/10-11/14

### Non-Recurring Tasks (Unchanged)

Regular (non-recurring) tasks still use the due date selected in the form's date picker. This system does NOT affect non-recurring task creation.

## Cron Job Setup Instructions

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select the project: **tg-dashboard** (project ID: `rnlijzolilwweptwbakv`)
3. Navigate to: **Edge Functions** (in left sidebar)
4. Click on: **generate-recurring-tasks**

### Step 2: Configure the Cron Trigger

1. On the function details page, look for **"Cron settings"** or **"Triggers"** section
2. Click **"Add Trigger"** → Select **"Cron"**
3. Set the schedule:
   - **Option A (Recommended)**: `0 23 * * 0` - Every Sunday at 11:59 PM UTC
   - **Option B**: `0 0 * * 1` - Every Monday at 12:00 AM UTC
   - **Option C (Conservative)**: `0 12 * * 1` - Every Monday at 12:00 PM UTC

4. Select timezone (or use UTC)
5. Click **"Save"**

### Cron Schedule Reference

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *

0 23 * * 0  = Every Sunday at 23:00 (11 PM UTC)
0 0  * * 1  = Every Monday at 00:00 (12 AM UTC)
0 12 * * 1  = Every Monday at 12:00 (12 PM UTC)
```

## Edge Function Details

### File Location
`supabase/functions/generate-recurring-tasks/index.ts`

### Function Signature
```typescript
Deno.serve(async (req) => { ... })
```

### Authorization
- Requires Bearer token in `Authorization` header
- Supabase automatically handles this for cron triggers

### Query Logic
```sql
SELECT * FROM tasks_hub
WHERE recurring_type IS NOT NULL
AND recurring_type != 'null'
```

### Generation Algorithm
For each parent task:
1. Get current week's Sunday
2. Calculate next week's Sunday (Sunday + 7 days)
3. Based on `recurring_type`:
   - **daily_weekdays/weekdays**: Generate M-F (days 1-5 of week)
   - **weekly**: Generate Monday only (day 1)
   - **biweekly**: Generate Monday only with 2-week interval
   - **monthly**: Generate Monday only with 1-month interval
4. Strip old date from task name: regex `/ \d{2}\/\d{2}\/\d{2}$/`
5. Append new date in MM/DD/YY format
6. Insert all new tasks at once

### Response Format
```json
{
  "success": true,
  "tasksCreated": 10,
  "tasks": [
    "Daily Standup 11/04 (2025-11-04T00:00:00.000Z)",
    "Daily Standup 11/05 (2025-11-05T00:00:00.000Z)",
    ...
  ]
}
```

## Testing

### Test 1: Manual Cron Trigger (Before Automation)

You can test the function before setting up the automated cron:

1. In Supabase Dashboard → Edge Functions → generate-recurring-tasks
2. Click the **"Invoke"** button
3. You should see:
   - Tasks created for next week
   - Success response with count and details
   - No errors in logs

### Test 2: Check Created Tasks

After triggering:
1. Go to **SQL Editor** in Supabase
2. Run:
```sql
SELECT task_name, due_date, recurring_type, recurring_parent_id
FROM tasks_hub
WHERE recurring_parent_id IS NOT NULL
ORDER BY due_date DESC
LIMIT 10;
```

Expected: You should see newly created tasks linked to parent tasks via `recurring_parent_id`

### Test 3: Verify Parent Task Properties

Check that copied properties match parent:
```sql
SELECT
  p.task_name as parent_name,
  p.effort_level,
  p.automation,
  p.hours_projected,
  c.task_name as child_name,
  c.effort_level as child_effort,
  c.automation as child_automation,
  c.hours_projected as child_hours
FROM tasks_hub p
LEFT JOIN tasks_hub c ON c.recurring_parent_id = p.id
WHERE p.recurring_type IS NOT NULL
LIMIT 5;
```

Expected: All properties should match between parent and child tasks

## Troubleshooting

### Issue: Function Not Running on Schedule

**Symptoms:**
- No new tasks created at expected time
- Logs show no execution

**Solution:**
1. Verify cron schedule in Supabase Dashboard
2. Check timezone is correct (should be UTC)
3. Check that at least one parent task has `recurring_type` set
4. View function logs in Dashboard

### Issue: Tasks Creating for Wrong Week

**Symptoms:**
- Tasks created for next week instead of current week
- Off-by-one week errors

**Solution:**
- This has been fixed in the current code
- Verify you're running the latest version deployed (v2)
- Check `getCurrentWeekSunday()` calculation in function

### Issue: Duplicate Tasks

**Symptoms:**
- Same date appears multiple times

**Solution:**
- Function should only run once per week
- Verify cron schedule not set to run more frequently
- Check for manual invocations

### Issue: Missing Properties on New Tasks

**Symptoms:**
- New tasks lack description, automation, etc.

**Solution:**
1. Verify parent task has these properties set
2. Check function logs for errors during insert
3. Ensure `tasks_hub` table columns exist
4. May need to add `recurring_parent_id` column if it doesn't exist (see below)

## Database Schema Updates

### Required Column (If Not Exists)

Check if `recurring_parent_id` exists in `tasks_hub`:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks_hub' AND column_name = 'recurring_parent_id';
```

If missing, create migration:

```sql
ALTER TABLE tasks_hub
ADD COLUMN recurring_parent_id UUID REFERENCES tasks_hub(id) ON DELETE CASCADE;

CREATE INDEX idx_tasks_hub_recurring_parent_id
ON tasks_hub(recurring_parent_id);
```

### Existing Columns Required

These should already exist:
- `recurring_type` - Type of recurrence (daily_weekdays, weekly, biweekly, monthly)
- `recurring_interval` - Interval multiplier (1, 2, etc.)

## Deployment Checklist

- [x] Edge Function created and tested
- [x] Function deployed to Supabase
- [x] Frontend task creation updated
- [x] Recurring task generator utility complete
- [ ] Cron trigger configured in Supabase Dashboard
- [ ] Manually tested cron execution
- [ ] Verified task creation for next week
- [ ] Monitored first automated run
- [ ] Updated team on deployment status

## File References

**Frontend:**
- `src/components/tasks/AddTaskModal.tsx` - User-facing recurring task form
- `src/utils/recurringTaskGenerator.ts` - Generation logic

**Backend:**
- `supabase/functions/generate-recurring-tasks/index.ts` - Edge Function

**Database:**
- `tasks_hub` table - Stores all tasks including recurring metadata
- Required columns: `recurring_type`, `recurring_interval`, `recurring_parent_id`

## Support

For issues or questions:
1. Check Supabase Dashboard → Edge Functions → Logs
2. Review this deployment guide
3. Check the troubleshooting section above
4. Review the source code comments for additional details

---

**Deployment Date:** October 26, 2025
**Function Status:** ✅ Deployed (Project: rnlijzolilwweptwbakv)
**Next Step:** Configure cron trigger in Supabase Dashboard
