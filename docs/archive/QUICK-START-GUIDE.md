# 🚀 Quick Start Guide - Get Up and Running in 10 Minutes

## Step 1: Run SQL Migrations (5 minutes)

Open your Supabase SQL Editor and run these 3 files **in order**:

### 1. Add Unique Constraints
**File:** `add-unique-task-constraint.sql`
```sql
-- Copy the entire contents of add-unique-task-constraint.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```
**What it does:** Prevents duplicate tasks in the same phase

---

### 2. Add Foreign Key Constraints
**File:** `add-referential-integrity-constraints.sql`
```sql
-- Copy the entire contents of add-referential-integrity-constraints.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```
**What it does:** Prevents orphaned tasks, maintains data integrity

---

### 3. Seed Sample Data
**File:** `seed-sample-data.sql`
```sql
-- Copy the entire contents of seed-sample-data.sql
-- Paste into Supabase SQL Editor
-- Click "Run"
```
**What it does:** Creates test businesses, projects, phases, and 15 sample tasks

**Expected Result:**
```
Businesses: 4
Projects: 5
Phases: 11
Tasks (Business): 15
```

---

## Step 2: Test the App (5 minutes)

### Open the App
Go to: **http://localhost:5000**

### Test Tasks Hub
1. Click "Tasks Hub" tab
2. You should see 15+ tasks (your existing tasks + new sample tasks)
3. Try these features:
   - ✅ Click any task title → edit it → press Enter
   - ✅ Click description → add/edit description
   - ✅ Change status with dropdown
   - ✅ Change due date with date picker
   - ✅ Click × to delete a task
   - ✅ See "Change saved | Undo" toast → click Undo

### Test Business Projects
1. Click "Business Projects" tab
2. Select "Full Stack Solutions" from dropdown
3. You should see:
   - 2 projects: "Client Portal v2" and "Mobile App Launch"
   - Multiple phases in each project
   - Tasks in each phase
4. Try these features:
   - ✅ Expand/collapse projects and phases
   - ✅ Click "+ Add Task" in any phase
   - ✅ Create a new task
   - ✅ Go back to Tasks Hub → new task appears instantly!

### Test Bidirectional Sync
1. Open **TWO browser tabs** both at http://localhost:5000
2. **Tab 1:** Go to Tasks Hub
3. **Tab 2:** Go to Business Projects → Full Stack Solutions → Client Portal v2
4. **In Tab 1:** Edit any task
5. **In Tab 2:** Watch it update within 500ms! 🎉
6. **In Tab 2:** Add a new task in a phase
7. **In Tab 1:** Watch it appear instantly! 🎉

---

## What You'll See

### Tasks Hub Features:
- ✅ All tasks from all sources in one view
- ✅ Filter by business/area or status
- ✅ Inline editing for everything
- ✅ Undo within 30 seconds
- ✅ Real-time sync across tabs
- ✅ Color-coded by business/area
- ✅ Project › Phase hierarchy display

### Business Projects Features:
- ✅ Select business from dropdown
- ✅ Expandable project cards
- ✅ Phases with sequence numbers
- ✅ Task counts per phase
- ✅ Add tasks directly in phases
- ✅ Real-time updates

---

## Sample Data Overview

### Businesses (4):
1. **Full Stack Solutions** (Green #10b981)
   - Custom software development
2. **Huge Capital** (Purple #a855f7)
   - Marketing agency
3. **S4 Analytics** (Blue #3b82f6)
   - Data analytics platform
4. **808 Commerce** (Orange #f97316)
   - E-commerce fulfillment

### Projects (5):
- Client Portal v2 (Full Stack)
- Mobile App Launch (Full Stack)
- Q1 Marketing Campaign (Huge Capital)
- Analytics Dashboard (S4)
- Warehouse Automation (808)

### Sample Tasks (15):
- Various statuses: Not started, In progress, Done
- Various due dates (some overdue for testing)
- Tasks across all businesses and projects

---

## Troubleshooting

### "No tasks showing in Tasks Hub"
- Make sure you ran `copy-tasks-from-tg-to-do-list.sql` earlier
- Check that `seed-sample-data.sql` ran successfully
- Refresh your browser

### "Business Dashboard is empty"
- Make sure you ran `seed-sample-data.sql`
- Select a business from the dropdown
- Refresh your browser

### "Sync not working"
- Check browser console for errors (F12)
- Look for `[Real-time]` logs
- Make sure you're logged in to Supabase
- Refresh both tabs

### "Can't create duplicate task"
- This is expected! Unique constraints are working
- Try creating a task with a different name
- Or create it in a different phase

---

## Next Steps

Once everything is working:

1. **Explore the UI**
   - Try all the inline editing features
   - Test the undo functionality
   - Move tasks between projects/phases

2. **Create Your Own Data**
   - Add your real businesses
   - Create your real projects
   - Organize tasks into phases

3. **Continue Development**
   - Stories 1.4-1.6 are ready to implement
   - Or start working on Epic 2 (Progress Tracking)
   - Or customize the UI to your liking

---

## Need Help?

Check these files:
- `MORNING-SUMMARY.md` - Full overnight work summary
- `docs/stories/1.1.tasks-hub-page-structure.md` - Story 1.1 details
- `docs/stories/1.2.bidirectional-sync-business-to-tasks.md` - Story 1.2 details
- `docs/stories/1.3.bidirectional-sync-tasks-to-business.md` - Story 1.3 details

**Everything is ready to go! Just run the 3 SQL files and start testing.** 🎉
