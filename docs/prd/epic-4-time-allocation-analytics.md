# Epic 4: Time Allocation & Analytics

**Epic Goal:** Enhance Deep Work log integration to provide comprehensive time allocation analytics across all 7 life areas (Full Stack, S4, 808, Personal, Huge Capital, Golf, Health), enabling data-driven decisions about where time is being invested and identifying when health goals are being neglected. Build visual analytics showing time distribution, area-level tracking, and alerts when allocation falls below target thresholds. This transforms the Deep Work timer from simple time tracking into strategic intelligence that prevents burnout and ensures balanced attention across work and life areas.

**Architecture Note:** This epic creates a NEW "Time Analytics" page (`/analytics` route) to visualize time allocation. Existing Tasks Hub and Business Projects pages are NOT modified.

### Story 4.1: Deep Work Log Time Allocation Calculation

As someone managing multiple life areas,
I want the Deep Work log to automatically calculate time invested per area,
so that I can see where my hours are actually going without manual time tracking.

#### Acceptance Criteria

1. Each Deep Work session is tagged with: Area (one of 7: Full Stack, S4, 808, Personal, Huge Capital, Golf, Health), Project (if applicable), Task, and Labels (e.g., "Internal Build", "$$$ Printer $$$")
2. Time allocation calculation aggregates Deep Work sessions by area: Total hours per area per day/week/month
3. Time allocation displayed in multiple views:
   - Daily: "Today you spent 3h on Full Stack, 2h on Huge Capital, 1h on Health"
   - Weekly: Bar chart showing hours per area across the week
   - Monthly: Trend line showing time distribution over 30 days
4. All 7 areas are tracked with equal visibility (no business vs. life separation)
5. "Unallocated time" category captures hours not tagged to specific area (should be minimized)
6. Time allocation data is filterable: view by date range, by area, by project, by label
7. Calculations update in real-time as new Deep Work sessions are logged
8. Export functionality allows downloading time allocation report as CSV for client invoicing or personal analysis

### Story 4.2: Area-Level Time Investment Analytics (New Page)

As someone balancing 7 life areas,
I want a dedicated analytics page showing time invested per area,
so that I can ensure balanced attention across work and life without modifying existing pages.

#### Acceptance Criteria

1. NEW page at `/analytics` route displays area-level time investment dashboard
2. Each of 7 areas (Full Stack, S4, 808, Personal, Huge Capital, Golf, Health) shows "Time Invested" card with:
   - Total hours (all-time)
   - Hours this week
   - Hours this month
   - Average hours per week over last 4 weeks
3. Area-level time allocation breakdown by projects within that area (pie chart or bar chart)
4. Alert indicator if area has received zero hours for 7+ consecutive days: "⚠️ No time allocated this week"
5. Area comparison view shows all 7 areas side-by-side with time investment bars for relative comparison
6. "Time Budget" feature allows setting target hours per area per week, with visual indicator showing actual vs. target
7. Historical time trends: line graph showing hours invested in each area over last 3 months
8. Labels within area (e.g., "Internal Build", "Bug Fix", "Client Meeting") show time breakdown for internal analysis
9. This is a NEW page - existing Business Projects page is NOT modified

### Story 4.3: Health Goal Time Allocation Monitoring

As someone balancing intense business work with long-term health,
I want alerts when health time allocation falls below targets,
so that health goals don't get neglected during busy consulting periods.

#### Acceptance Criteria

1. Health area has configurable time allocation target: e.g., "Minimum 5 hours per week on Health"
2. Dashboard displays Health time allocation prominently: "Health: 3h this week (Target: 5h) - ⚠️ 2h below target"
3. Daily view shows health time today vs. daily target (e.g., "0h Health today, target 45min")
4. Visual warning indicator (red/yellow) appears on Daily page and Review dashboard when health hours fall below 80% of weekly target
5. Health time breakdown shows: Workouts, Meal Planning, Other health activities
6. Streak tracking: "7 consecutive weeks meeting health time target" for positive reinforcement
7. Health neglect risk score: if health hours drop below 50% of target for 2+ consecutive weeks, prominent alert: "⚠️ Health neglected - schedule workout time"
8. End-of-week summary includes health time retrospective: "This week: 3h Health (down from 6h last week)"
9. Health time can be quickly scheduled from alert: click "Schedule Health Time" button to add workout block to tomorrow's Daily Schedule

### Story 4.4: Time Allocation Visual Analytics Dashboard

As a data-driven operator,
I want visual analytics showing time allocation patterns and trends,
so that I can identify productivity patterns and optimize how I distribute attention across my portfolio.

#### Acceptance Criteria

1. Analytics dashboard accessible from main navigation showing comprehensive time allocation visualizations
2. Weekly heatmap: color-coded grid showing hours per business per day (darker = more hours)
3. Business distribution pie chart: % of total time spent on each business over selected date range
4. Life balance pie chart: % of time on Business vs. Health vs. Content vs. Personal vs. Golf
5. Trend analysis: line graph showing how time allocation across businesses has shifted over last 3 months
6. "Focus time" metric: % of total hours logged as Deep Work sessions (vs. untracked time)
7. Peak productivity analysis: what times of day have most Deep Work sessions logged (morning/afternoon/evening breakdown)
8. Project-level time tracking: for each project, show total hours invested and hours per phase
9. Label analysis: time spent on different activity types (e.g., "Internal Build": 20h, "Client Meetings": 5h, "Bug Fixes": 8h)
10. Comparison view: current week vs. last week time allocation side-by-side to spot dramatic shifts

### Story 4.5: Time Allocation Targets & Planning

As a strategic operator,
I want to set time allocation targets for each business and life area,
so that I can proactively plan balanced attention rather than reactively discovering imbalances.

#### Acceptance Criteria

1. Settings page allows defining weekly time targets for each business: "Full Stack: 10h, Huge Capital: 8h, S4: 6h, 808: 4h, Service SaaS: 5h"
2. Settings page allows defining life area time targets: "Health: 5h, Content: 3h, Golf: 2h, Personal: 5h"
3. Dashboard displays "Planned vs. Actual" comparison: visual bars showing target hours vs. actual hours logged
4. Weekly planning view shows time budget allocation: "You have 40h available this week, allocated 33h, 7h unallocated"
5. Over-allocation warning: if targets exceed realistic capacity (e.g., 60h/week), display warning: "⚠️ Target allocation exceeds sustainable capacity"
6. Target adjustment recommendations: "You're consistently spending 12h on Huge Capital but target is 8h - update target?"
7. Monthly target review: end-of-month summary shows adherence to targets with suggestions for next month
8. Targets can be adjusted dynamically: "This week, increase Huge Capital to 12h due to urgent project" (temporary override)
9. Time allocation forecast: based on current Deep Work sessions logged, predict if weekly targets will be met

### Story 4.6: Deep Work Session Insights & Optimization

As someone optimizing execution velocity,
I want insights from Deep Work session patterns,
so that I can improve focus, reduce context switching, and maximize productive output.

#### Acceptance Criteria

1. Session analytics show: average session length, total sessions per day, longest session, shortest session
2. Context switching metric: number of different businesses/projects worked on per day (lower is better for deep focus)
3. Focus quality score: ratio of planned Deep Work sessions vs. unplanned/reactive work
4. Session completion tracking: % of sessions that achieved their stated goal/task
5. Interruption tracking: ability to mark Deep Work session as "interrupted" with reason, analytics show interruption frequency
6. Optimal session length analysis: compare productivity (tasks completed) across different session lengths to find personal sweet spot
7. Business context switching cost: visualize time lost when switching between businesses mid-day vs. dedicating full days to one business
8. Recommendation engine: "Based on your patterns, you're most productive with 90-minute sessions on Full Stack AI in the morning"
9. Deep Work streak tracking: consecutive days with at least one Deep Work session (motivational gamification)
10. Session notes analysis: ability to review notes across all sessions for a project to see progress narrative
