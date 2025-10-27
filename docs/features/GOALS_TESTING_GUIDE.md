# Goals & Progress Tracking Feature - Testing Guide

## Phase 6 & 7 Completion Summary

The Goals & Progress Tracking system has been fully implemented with:
- Goal creation and management across 6 life areas
- Real-time progress calculation from linked tasks
- Weekly Sunday check-in reminders and collection
- Monthly trend analysis with improving/declining/stable indicators
- Integration into the Review Dashboard

## Testing the Goals Feature

### Prerequisites
- Application running: `http://localhost:5001` (or configured dev port)
- Logged in with valid Supabase credentials
- Review Dashboard is accessible

### 1. Goal Creation & Area Filtering

**Test Steps:**
1. Navigate to Review Dashboard
2. Click "Add Goal" button in the Goals section
3. Select "Health" from the Area dropdown
4. Enter goal statement: "Run 3x per week for 8 weeks"
5. Set target date (8 weeks from now)
6. Fill in metric: "Weekly runs" / "runs"
7. Click "Create Goal"

**Expected Results:**
- Goal appears in the Health area filter
- Overall progress shows 0% (no linked tasks yet)
- Goal card displays in the 2-column grid
- Linked Tasks counter shows 0/0

**Test Other Areas:**
- Repeat for: Finance, Relationships, Full Stack, Huge Capital, S4
- Verify area filter buttons at top work correctly
- "All Areas" button shows all goals

### 2. Task-to-Goal Linking

**Test Steps:**
1. Create a goal in Health area
2. Go to Tasks Hub
3. Create a new task "Morning 5K run" in Health area
4. Edit the task and link it to the Health goal (if UI supports it)
5. Complete the task (mark as Done)

**Expected Results:**
- Goal progress updates from 0% to 50% (1 of 2 tasks done)
- "Linked Tasks" counter updates in real-time
- Goal progress bar shows the new percentage
- Color coding changes (green/yellow/red based on threshold)

### 3. Progress Calculation

**Test Steps:**
1. Create a goal with multiple linked tasks
2. Mark tasks as Done one by one
3. Observe progress updates in real-time

**Expected Results:**
- Progress = (completed_tasks / total_linked_tasks) * 100
- Update happens within 5 seconds (due to 5s staleTime in useGoalProgress)
- Progress bar animates smoothly
- Percentage in goal card updates instantly

**Example:**
- 5 linked tasks
- Complete 1 task → 20% progress
- Complete 2 more tasks → 60% progress
- Complete 2 more tasks → 100% progress

### 4. Sunday Check-In Banner

**Test Steps:**
1. Ensure today is Sunday (or mock the system date to Sunday)
2. Have at least one goal needing a check-in
3. Navigate to Review Dashboard

**Expected Results:**
- CheckInBanner appears at top with amber styling
- Shows count of goals needing check-in
- "Check In Now" button is clickable
- Banner only shows on Sundays when check-ins are needed

### 5. Check-In Modal

**Test Steps:**
1. Click "Check In Now" button in the banner (or on the goal card)
2. Modal opens showing:
   - Goal statement at top
   - Week date (Sunday date)
   - Target metrics progress display
   - Overall score percentage
3. Fill in reflection questions:
   - "How are you feeling about this week?"
   - "Is this pace sustainable?" (radio: yes/no/adjust)
   - "Any obstacles or wins to note?"
4. Click "Save Check-In"

**Expected Results:**
- Check-in data is saved with:
  - targets_hit: calculated from completed tasks
  - targets_total: total linked tasks
  - overall_percentage: targets_hit/targets_total * 100
  - feeling_question, sustainability_question, obstacles_notes
- Modal closes on success
- Goals list refreshes
- Check-in appears in history for that goal

### 6. Monthly Trend Visualization

**Test Steps:**
1. On a goal card, click "This Month's Trend" dropdown
2. Observe the monthly trend card showing:
   - Check-In count for the month
   - Average progress percentage
   - Best week progress percentage
   - Trend indicator (Improving ↗ / Declining ↘ / Stable →)
   - Insight message based on trend

**Expected Results:**
- Trend calculation based on first/second half of month averages:
  - Improving: second half avg > first half + 5%
  - Declining: second half avg < first half - 5%
  - Stable: within 5% range
- Insight message is contextually appropriate
- Card shows "No check-ins this month yet" if empty

### 7. Seed Data Verification

**Test Steps:**
1. After fresh database setup, check if example goals exist
2. Look for goals like "Run 3x per week for 8 weeks" and "Save $5,000 over 3 months"

**Expected Results:**
- Two example goals are created in Health and Finance areas
- Each has corresponding targets (weekly, monthly)
- Goals appear in Review Dashboard
- Progress shows 0% (no tasks linked in seed)

### 8. Performance Testing

**Test Metrics:**
- Goal fetch time: < 500ms
- Progress calculation: < 500ms
- Check-in submission: < 1s
- UI response to task completion: < 500ms

**How to Test:**
1. Open browser DevTools → Network tab
2. Complete a linked task
3. Observe progress update response time
4. Check React Query cache invalidation logs

## Integration Test: Complete Workflow

### Scenario: Weekly Goal Review Process

1. **Monday:** Create a "Run 3x per week" goal
2. **Tuesday-Thursday:** Create 3 related tasks, complete 2
3. **Sunday Morning:** Check for check-in banner
4. **Sunday:** Complete check-in form with weekly reflection
5. **Next Sunday:** Review trend (improving from 67% to 100%)

**Success Criteria:**
- ✅ Progress updates in real-time
- ✅ Check-in banner appears only on Sunday
- ✅ Check-in modal calculates targets_hit correctly
- ✅ Monthly trend shows improvement
- ✅ No errors in console

## Known Limitations & Notes

1. **Task Linking:** Currently manual through goal_task_links table
2. **Check-In History:** Last 12 check-ins are fetched and stored
3. **Timezone:** Uses local timezone for date calculations
4. **Area Validation:** Goals must match one of 6 defined areas
5. **Real-time Sync:** React Query staleTime is 5s (configurable)

## Debugging Tips

### Check-In Banner Not Showing
- Verify `today.getDay() === 0` (Sunday = 0)
- Check if goals exist with `status = 'active'`
- Verify no check-in exists for today's Sunday date
- Check browser console for useGoalsNeedingCheckIn errors

### Progress Not Updating
- Verify tasks are linked in goal_task_links table
- Check if task status is exactly 'Done'
- Verify React Query is invalidating on task mutation
- Check network tab for query response

### Check-In Form Errors
- Ensure textarea fields are not empty
- Verify goal has at least one target
- Check if goal_checkins table insert succeeds
- Look for duplicate check-in errors (UNIQUE constraint)

## Files Modified/Created

**Phase 6 - Check-In System:**
- `src/components/goals/CheckInBanner.tsx` - Sunday check-in reminder
- `src/hooks/useWeeklyCheckIns.ts` - Check-in hooks and logic
- `src/pages/ReviewDashboard.tsx` - Integration with banner

**Phase 6 & 7 - Trends & Polish:**
- `src/components/goals/MonthlyTrendCard.tsx` - Trend visualization
- `src/components/goals/GoalProgressCard.tsx` - Trend expansion
- `supabase/migrations/20251025000001_seed_goals_example.sql` - Seed data

**Updated Components:**
- `src/components/goals/CheckInModal.tsx` - Actual target data calculation
- `src/components/goals/GoalProgressBar.tsx` - Existing, no changes
- `src/components/goals/GoalForm.tsx` - Existing, no changes

## Next Steps for Users

1. Create their first goal in their primary life area
2. Link existing tasks to that goal
3. Complete tasks and observe progress
4. On Sunday, complete the check-in reflection
5. View monthly trends to track consistency

---

**Last Updated:** 2025-10-25
**Status:** ✅ Phase 6 & 7 Complete
