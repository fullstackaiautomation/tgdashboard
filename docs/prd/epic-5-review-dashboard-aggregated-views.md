# Epic 5: Review Dashboard & Aggregated Views

**Epic Goal:** Create a unified Review page that aggregates read-only activity across all main modules (Daily, Business Projects, Tasks Hub, Content Library, Finances) plus Health area focus, providing the "what's up" snapshot for 1-2 click visibility into the entire life ecosystem. This becomes the default morning landing page—replacing the need to check email/Slack first—by showing everything important at a glance: tasks due today, project progress, health status, financial metrics, and areas needing attention. The Review dashboard is the culmination of all previous epics, synthesizing task sync, progress visualization, and time allocation into a single command center view.

**Architecture Note:** This epic creates a NEW Review page (`/review` route) that displays module-based cards. Existing module pages (Daily, Business Projects, Tasks Hub, Content Library, Finances) are NOT modified.

### Story 5.1: Review Dashboard Page Structure & Navigation

As someone starting my day,
I want a Review dashboard that shows all main modules in a single view,
so that I can see my entire life ecosystem status in 1-2 clicks without navigating to individual pages.

#### Acceptance Criteria

1. Review page displays 6 main module cards in organized grid layout: Daily, Business Projects, Tasks Hub, Content Library, Finances, Health Focus
2. Each module card shows: module name, color-coded icon, high-level status summary, and last updated timestamp
3. Review page is accessible from main navigation with prominent placement (e.g., first menu item or dedicated "Review" button)
4. Review dashboard is READ-ONLY: no editing capabilities, only viewing aggregated data with links to detail pages
5. Page loads in <2 seconds despite aggregating data from all modules using optimized queries and caching
6. One-click navigation from any module card to its detailed page (e.g., click Business Projects card → navigate to Business Projects page)
7. Visual hierarchy: modules with urgent items (overdue tasks, warnings, alerts) are highlighted with red/yellow borders
8. Review page adapts to mobile/tablet screens with responsive card layout (stacks vertically on narrow screens)

### Story 5.2: Daily Area Summary Card

As someone planning execution each day,
I want the Daily area card to show today's critical information,
so that I can immediately see what needs to be accomplished today without opening Daily page.

#### Acceptance Criteria

1. Daily card displays:
   - Tasks due today count (e.g., "8 tasks due today")
   - Daily completion % (tasks completed / total tasks for today)
   - Deep Work hours logged today vs. daily target (e.g., "2h / 6h target")
   - Next scheduled item from today's Schedule (e.g., "Next: Client call at 2pm")
2. Visual progress ring or bar showing daily completion %
3. Color coding: green if on track (>50% complete by current time of day), yellow if behind, red if falling significantly behind
4. "Due Tomorrow" preview: count of tasks due tomorrow for planning awareness
5. Overdue tasks indicator: if any overdue tasks exist, prominent red badge with count
6. Quick action: "Plan Today" button navigates directly to Daily To-Do List page
7. Daily card shows most recent Deep Work session: "Last session: 2h on Huge Capital (30 min ago)"

### Story 5.3: Business Projects Card

As someone managing multiple business projects,
I want the Business Projects card to show aggregate status across all projects,
so that I can identify which projects need attention without checking each individually.

#### Acceptance Criteria

1. Business Projects card displays aggregate across all projects from Business Projects module:
   - Total active projects count
   - Overall completion % (average across all projects)
   - Total active tasks across all projects
   - Projects needing attention count
2. Card shows project summary statistics:
   - Projects in progress count
   - Stalled projects (no activity 7+ days) count with warning
   - Overdue tasks across all projects count
   - Next upcoming deadline
3. Projects with warnings are flagged: stalled, overdue tasks, blocked
4. Quick action: clicking card navigates to Business Projects page
5. Visual indicator shows priority projects (most urgent)
6. Card shows: "Next deadline: Project X deliverable in 3 days"

### Story 5.4: Health Focus & Content Library Cards

As someone balancing business and personal wellness,
I want Health and Content Library cards to show status alongside business cards,
so that wellness and learning have visibility and don't get neglected.

#### Acceptance Criteria

1. **Health Focus card** displays (Health area from time tracking):
   - Hours invested this week vs. weekly target (e.g., "3h / 5h target") ⚠️
   - Days since last Health area Deep Work session
   - Recent activity: "Last health session: 2 days ago"
   - Warning if health hours below 80% of weekly target
   - Health area time trend (small sparkline chart)
2. **Content Library card** displays (Content Library module data):
   - Library items count (reading/watching queue)
   - Items completed this week
   - Recent content activity: "Last library item completed: 1 day ago"
   - Next high-priority item to review
3. Cards use consistent visual design with color coding
4. Cards show "No recent activity" state when no activity in 7+ days
5. Click Health card → navigate to Time Analytics filtered to Health area
6. Click Content card → navigate to Content Library page

### Story 5.5: Finances Area Summary Card

As a business owner tracking financial health,
I want the Finances area card to show high-level financial metrics,
so that I can monitor financial status alongside operational metrics.

#### Acceptance Criteria

1. Finances card displays:
   - Current net worth value (if tracked)
   - Monthly revenue total (across all businesses)
   - Monthly expenses total
   - Budget status: spending vs. budget (e.g., "82% of monthly budget used")
2. Visual indicator: green if under budget, yellow if approaching limit (>90%), red if over budget
3. Recent transactions count: "15 new transactions this week"
4. Investment performance if tracked: "Portfolio: +5% this month"
5. Budget category breakdown: quick view of top 3 spending categories this month
6. Financial goals progress: if savings goals exist, show progress bar (e.g., "Emergency fund: $8K / $10K target")
7. Quick action: "Review Transactions" button navigates to Finances page
8. Alert for unusual spending: if any category exceeds typical spending by 50%+, show warning

### Story 5.6: Review Dashboard Intelligence & Alerts

As a busy operator with limited attention,
I want the Review dashboard to highlight what needs attention most urgently,
so that I can focus on critical items without analyzing every metric.

#### Acceptance Criteria

1. "Needs Attention" section at top of Review dashboard showing prioritized alerts:
   - Overdue tasks (sorted by days overdue)
   - Stalled projects (no activity 7+ days)
   - Health neglect warnings (below target for 2+ weeks)
   - Budget overruns or financial anomalies
   - Businesses with zero hours this week
2. Alert severity levels: 🔴 Critical (immediate action), 🟡 Warning (review soon), 🔵 Info (FYI)
3. Each alert is actionable: click to navigate directly to the item needing attention
4. "All Clear" state: if no alerts, display positive message: "✅ Everything on track - no urgent items"
5. Alert dismissal: ability to acknowledge alerts that are expected/acceptable (e.g., "808 has zero hours this week - intentional")
6. Weekly summary: collapsible section showing week-over-week changes:
   - Completion % change: "65% this week (up from 58% last week)"
   - Time allocation shifts: "15% more hours on Huge Capital this week"
   - Progress velocity: "Completed 12 more tasks than last week"
7. Smart recommendations: "Based on current progress, you'll complete Huge Capital project by Friday - on track for deadline"
8. Morning briefing mode: Review dashboard shows different view in morning vs. evening (morning: today's focus, evening: tomorrow's plan)
9. Customizable alerts: ability to set custom thresholds for warnings (e.g., "Alert me if any business gets <2h per week")
