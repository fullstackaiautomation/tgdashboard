# Epic 2: Progress Visualization System

**Epic Goal:** Implement comprehensive progress tracking throughout the dashboard to provide at-a-glance visibility into completion status across all projects, phases, and tasks. Calculate and display percentage complete at Task, Phase, and Project levels with visual indicators (progress bars, color coding, completion percentages) embedded throughout Business pages, Daily views, and Review dashboard. This delivers motivational fuel during intense execution periods and ensures nothing important falls through the cracks by making progress (or lack thereof) immediately visible.

### Story 2.1: Task-Level Progress Calculation & Display

As a consultant tracking detailed work,
I want individual tasks to show completion status with visual indicators,
so that I can quickly see which tasks are done, in progress, or not started without reading details.

#### Acceptance Criteria

1. Tasks support completion status: Not Started (0%), In Progress (1-99%), Completed (100%)
2. Task cards display progress with visual indicator: checkbox (not started), partial fill or progress ring (in progress), checkmark (completed)
3. In Progress tasks allow setting custom % complete (e.g., 25%, 50%, 75%) via slider or numeric input
4. Task completion status updates in real-time across all pages (Business, Tasks Hub, Daily) via existing sync mechanism
5. Completed tasks are visually distinct: strikethrough text, green checkmark icon, or dimmed opacity
6. Overdue tasks (due date passed, status < 100%) display red warning indicator
7. Task cards on all pages show the progress indicator consistently (same visual language throughout dashboard)
8. Bulk actions allow marking multiple tasks complete simultaneously from Tasks Hub

### Story 2.2: Phase-Level Progress Calculation

As a project manager tracking multi-phase projects,
I want phases to automatically calculate completion percentage based on their tasks,
so that I can see phase progress without manually tracking individual task counts.

#### Acceptance Criteria

1. Phase completion % is calculated as: (Sum of completed task %) / (Total number of tasks in phase)
2. Example: Phase with 4 tasks at [100%, 100%, 50%, 0%] shows 62.5% complete
3. Phase cards display progress bar showing calculated % complete with numerical percentage label
4. Progress bar uses color gradient: red (0-33%), yellow (34-66%), green (67-100%)
5. Phases with no tasks show "No tasks" state (not 0% or 100%)
6. Phase progress updates in real-time when tasks are added, removed, or status changes
7. Phase cards show task count summary: "3 of 8 tasks complete" alongside % bar
8. Clicking phase progress bar drills down to show constituent task list with individual statuses

### Story 2.3: Project-Level Progress Calculation & Visualization

As a multi-business operator,
I want projects to show overall completion based on all phases and tasks,
so that I can quickly assess project health and communicate status to clients.

#### Acceptance Criteria

1. Project completion % is calculated as: (Sum of all phase completion %) / (Number of phases)
2. Projects without phases calculate directly from tasks: (Completed tasks) / (Total tasks) × 100
3. Project cards on Business pages display large progress bar with % complete prominently shown
4. Project header includes visual milestone markers if key deliverables are defined (optional, not blocking)
5. Project cards use same color gradient as phases: red/yellow/green based on % complete
6. Projects display estimated completion date based on current velocity (tasks completed per day × remaining tasks)
7. Stalled projects (no task progress in 7+ days) display warning indicator: "⚠️ No recent activity"
8. Project progress visualization is prominent enough for screenshots in client case studies

### Story 2.4: Business Area Progress Dashboard

As a consultant managing 5 businesses simultaneously,
I want each Business page to show aggregate progress across all projects,
so that I can see business-level health and identify which businesses need attention.

#### Acceptance Criteria

1. Each Business page (Full Stack AI, Service SaaS, Huge Capital, S4, 808) displays aggregate metrics at top:
   - Total projects count
   - Overall completion % (average of all project %)
   - Active tasks count vs. completed tasks count
   - Hours invested (from Deep Work log)
2. Business page shows list of projects sorted by % complete (least complete first to highlight what needs attention)
3. Business area cards in Tasks Hub and Daily pages display mini progress indicator showing business health
4. Business filter buttons in Daily To-Do List show completion % next to task count (e.g., "Huge Capital (7) - 45%")
5. Stalled businesses (no task activity in 14+ days) are flagged prominently
6. Business comparison view shows all 5 businesses side-by-side with progress bars for relative comparison
7. Color coding remains consistent: business-specific colors with progress gradient overlay

### Story 2.5: Daily Goals Progress Tracking

As someone planning each evening for next day,
I want Daily pages to show progress toward daily goals,
so that I can see if I'm on track to complete planned work and adjust accordingly.

#### Acceptance Criteria

1. Daily To-Do List displays daily completion %: (Completed tasks today) / (Total tasks for today) × 100
2. Daily page header shows progress ring or bar visualizing daily completion
3. "Due Today" card shows progress: "2 of 8 tasks complete - 25%"
4. Deep Work section shows daily deep work goal progress: hours worked vs. hours planned
5. Daily page displays time allocation breakdown: % of day spent per business area (calculated from Deep Work log)
6. Daily progress updates in real-time as tasks are completed throughout the day
7. End-of-day summary (visible in evening planning) shows: tasks completed, deep work hours logged, businesses worked on
8. Streak tracking: consecutive days achieving >80% daily completion (motivational gamification)

### Story 2.6: Review Dashboard Progress Aggregation

As a multi-business operator,
I want the Review page to aggregate progress across ALL areas in one unified view,
so that I can see my entire life ecosystem status in 1-2 clicks without navigating to individual pages.

#### Acceptance Criteria

1. Review dashboard displays 7 main area cards (DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF) with progress indicators
2. Each area card shows:
   - Area name with color coding
   - Overall completion % (aggregate of all tasks/goals in that area)
   - Active items count
   - Recent activity timestamp ("Last updated 2 hours ago")
3. Business area card drills down to show 5 businesses with individual progress bars
4. Review dashboard is READ-ONLY (no editing, only viewing aggregated data)
5. Review page loads in <2 seconds despite aggregating data from all areas
6. Visual hierarchy: areas needing attention (low %, overdue items) are highlighted with red/yellow warning colors
7. Review page includes "Weekly Progress" section showing trend: completion % today vs. 7-day average
8. One-click navigation from any Review area card to detailed page for that area
