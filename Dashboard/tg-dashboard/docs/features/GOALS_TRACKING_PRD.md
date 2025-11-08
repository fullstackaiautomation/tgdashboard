# Goals & Progress Tracking Feature - PRD

**Status**: Ready for Implementation
**Created**: October 25, 2025
**Feature Owner**: John (PM)
**Target Launch**: Q4 2025 / Q1 2026

---

## Executive Summary

This feature introduces a comprehensive **Goals & Progress Tracking system** to the tg-dashboard, enabling users to define meaningful life and project goals across multiple areas, break them down into measurable weekly/monthly targets, and automatically track progress through daily task completion and manual check-ins.

### Key Value Prop
- **Connect strategy to execution**: Define what matters most, then see daily progress toward those goals
- **Holistic progress view**: One place to see how Health, Relationships, Finance, and Projects are advancing
- **Automatic progress syncing**: Tasks automatically contribute to goal metrics
- **Reflection & accountability**: Weekly check-ins create habits of progress review
- **Integrated insights**: Goals inform task prioritization; tasks feed into goal metrics

---

## Product Goals

1. **Enable goal-setting across life domains**: Support both personal (Health, Relationships, Finance) and project goals (Full Stack, Huge Capital, S4)
2. **Break down ambition into actionable metrics**: Users define what "success" looks like numerically
3. **Automate progress tracking**: Tasks flow into goals; no manual metric logging required
4. **Foster weekly accountability**: Scheduled check-ins encourage reflection and course correction
5. **Visualize momentum**: Clear progress bars and trend indicators show forward motion

---

## User Workflows

### Workflow 1: Set Up a Goal (e.g., Health)

**Actor**: User setting annual health goal

**Goal Statement**: "Be physically fit and proud of how I look"

**Metric**: 10-15% body fat

**Activities**:
- Workout 4x/week
- Stretch 5 min daily
- Walk 30 min daily
- Maintain healthy eating

**Timeline**: By June 1, 2026

**Steps**:
1. Navigate to Review → Goals & Progress
2. Select "Health" area from filter
3. Click "Create Goal"
4. Fill in:
   - Goal statement
   - Target date (6/1/2026)
   - Primary metric (Body Fat %)
   - Weekly targets (4x workouts, 5 stretches, 30 min walks daily)
5. Optionally link related tasks (existing or new)
6. System auto-creates check-in schedule (every Sunday)

---

### Workflow 2: Link Tasks to Goal Targets

**Actor**: User configuring which tasks feed into health goal

**Steps**:
1. In goal details, find "Link Tasks" section
2. Select existing tasks matching targets:
   - "Workout (Strength)" → counts toward "4x weekly workouts"
   - "Yoga session" → counts toward "4x weekly workouts"
   - "Walk" → counts toward "30 min daily walks"
   - "Meal prep" → counts toward "eating healthy"
3. Each task has a contribution type:
   - **Count-based**: "Workout" = 1 count (need 4/week)
   - **Duration-based**: "Walk" = auto-tracks duration, need 30 min/day
   - **Metric-based**: "Weight log task" → pulls from finance module (body fat %)

---

### Workflow 3: Daily Task Completion Auto-Updates Goals

**Actor**: User checking off daily tasks

**Steps**:
1. User completes tasks in Daily → Todo or Tasks Hub
2. System automatically:
   - Marks workout count (1/4 for week)
   - Logs walk duration (if timed)
   - Updates stretch count (1/5 for day)
3. Goals card shows:
   - Weekly progress: "Workouts: 3/4" (visual bar)
   - Daily progress: "Stretches: 1/5" (visual bar)
   - Walk duration: "20/30 min today"

---

### Workflow 4: Weekly Check-In (Every Sunday)

**Actor**: User reflecting on progress

**Steps**:
1. Dashboard shows "Weekly Check-In" prompt on Sunday
2. User opens check-in form for selected area (e.g., Health)
3. Form shows:
   - **Target Metrics**:
     - Workouts: 4/4 ✅ (completed)
     - Stretches: 28/35 ⚠️ (80%)
     - Walk duration: 180/210 min ⚠️ (85%)
     - Body fat: 13% ✅ (within 10-15% range)
   - **Overall Score**: 87% targets hit
   - **Questions**:
     - "How are you feeling about this week?" (text)
     - "Is the pace sustainable?" (Yes/No/Need adjustment)
     - "Any obstacles or wins to note?" (text)
4. User submits check-in
5. System records:
   - Timestamp
   - Metrics snapshot (weekly actuals vs targets)
   - Qualitative notes
   - Overall sentiment

---

### Workflow 5: Monthly Review

**Actor**: User reviewing monthly progress trend

**Steps**:
1. Navigate to goal detail page
2. View "Monthly Summary" tab:
   - Weekly breakdown (4 check-ins)
   - Metric trends (visualized as sparklines)
   - Notes from each week
   - Momentum indicator: "On track" / "Falling behind" / "Crushing it"
3. Edit monthly targets if needed (e.g., reduce workouts if life got hectic)

---

### Workflow 6: Large Project Goal (e.g., Huge Capital Dashboard V1)

**Actor**: User managing project goal with deadline

**Goal**: Complete Huge Capital Dashboard V1
**Deadline**: 1/30/2026
**Success Criteria**: All identified projects & phases migrated into new dashboard
**Breakdown**: Linked to tasks/phases in Business Projects module

**Steps**:
1. Create project goal with deadline
2. Goal auto-links to Business Project "Huge Capital"
3. System tracks:
   - Phase completion %
   - Task completion % within project
   - Days remaining (countdown)
4. Check-ins (weekly) measure:
   - Tasks completed toward goal (automatically from phase)
   - Qualitative notes on blockers/momentum

---

### Workflow 7: Finance Goals

**Actor**: User managing multiple finance goals

**Goals**:
1. "Pay off all debt" (ongoing)
2. "Save $42K (6 months living expenses)" (target: TBD)

**Tracking**:
1. System pulls data from Finance module (balance snapshots)
2. Shows:
   - Current debt total (auto-updated from accounts)
   - Savings total (auto-updated from savings account)
   - Monthly trend (sparkline)
3. Check-ins add context:
   - "Is progress sustainable?"
   - "Any income changes?"
   - "Major expenses or wins?"

---

### Workflow 8: Relationships Goal

**Actor**: User tracking relationship health

**Goal**: "Be a good person in my relationships"

**Activities** (tracked manually in check-ins):
- Phone calls with family/friends
- Dates planned for Cheyanne
- Acts of service/help

**Steps**:
1. Create qualitative goal (no numeric target)
2. Each week, check-in captures:
   - "Who did you connect with?" (Cheyanne, Family, Friends)
   - "What did you do?" (date, call, helped with X)
   - "How did it feel?" (text)
3. View monthly summary of activities/connections
4. System suggests: "Haven't called mom in 2 weeks?"

---

## Data Model

### Goals Table (`goals`)

```sql
goals:
  - id (UUID, PK)
  - user_id (UUID, FK)
  - area (Enum: 'Health' | 'Relationships' | 'Finance' | 'Full Stack' | 'Huge Capital' | 'S4')
  - goal_statement (TEXT) -- e.g., "Be physically fit and proud of my look"
  - target_date (DATE) -- e.g., 2026-06-01
  - primary_metric (VARCHAR) -- e.g., "Body Fat %"
  - metric_unit (VARCHAR) -- e.g., "%", "count", "duration_min"
  - metric_type (Enum: 'numeric' | 'qualitative') -- is this trackable or more reflective?
  - status (Enum: 'active' | 'achieved' | 'paused' | 'abandoned')
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

### Goal Targets Table (`goal_targets`)

```sql
goal_targets:
  - id (UUID, PK)
  - goal_id (UUID, FK) → goals.id
  - target_name (VARCHAR) -- e.g., "Workout 4x per week"
  - frequency (Enum: 'daily' | 'weekly' | 'monthly')
  - target_value (NUMERIC) -- e.g., 4
  - target_unit (VARCHAR) -- e.g., "count", "min", "pounds"
  - linked_task_ids (UUID[]) -- tasks that contribute to this target
  - contribution_type (Enum: 'count' | 'duration' | 'metric') -- how does task feed in?
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)
```

### Weekly Check-Ins Table (`goal_checkins`)

```sql
goal_checkins:
  - id (UUID, PK)
  - goal_id (UUID, FK) → goals.id
  - checkin_date (DATE) -- Sunday of week
  - targets_hit (NUMERIC) -- how many of the week's targets were achieved
  - targets_total (NUMERIC) -- total targets for the week
  - overall_percentage (NUMERIC) -- (targets_hit / targets_total) * 100
  - metric_snapshot (JSONB) -- snapshot of all metrics for the week
  - qualitative_feedback (TEXT) -- user's notes
  - feeling_question (VARCHAR) -- answer to "How are you feeling?"
  - sustainability_question (VARCHAR) -- "Is this sustainable?" (yes/no/adjust)
  - obstacles_notes (TEXT) -- challenges encountered
  - created_at (TIMESTAMPTZ)
```

### Goal-Task Links Table (`goal_task_links`)

```sql
goal_task_links:
  - id (UUID, PK)
  - goal_id (UUID, FK) → goals.id
  - task_id (UUID, FK) → tasks.id
  - target_id (UUID, FK) → goal_targets.id
  - contribution_type (Enum: 'count' | 'duration')
  - created_at (TIMESTAMPTZ)
```

---

## Feature Specifications

### 1. Goals List View (In Review Dropdown)

**Location**: Main Sidebar → Review → Goals & Progress

**Layout**:
```
[Filter Bar: Health | Relationships | Finance | Full Stack | Huge Capital | S4 | All]

[Selected Area = Health]

┌─────────────────────────────────┐
│ Be physically fit & proud       │
│ Target: 6/1/2026 (7 months left)│
│ Primary Metric: 10-15% body fat │
│                                 │
│ Weekly Status: 87% on track    │
│ Targets Completed: 3/4         │
│ [Progress Bar]                  │
│                                 │
│ Last Check-in: Oct 19 (6d ago) │
│ [View Details] [Edit]          │
└─────────────────────────────────┘

[Create New Goal Button]
```

### 2. Goal Detail View (Drill-Down)

**Route**: `/review/goals/:goalId`

**Sections**:

#### A. Goal Summary Card
- Goal statement
- Target date with countdown
- Primary metric
- Current status badge (On Track / At Risk / Achieved)

#### B. Weekly Targets Section
- Table of all targets:
  | Target | Frequency | Target | Actual | Status |
  |--------|-----------|--------|--------|--------|
  | Workouts | Weekly | 4 | 3 | 75% |
  | Stretches | Daily | 5 | 4 | 80% |
  | Walks | Daily | 30 min | 25 min | 83% |
  | Body Fat | Monthly | 10-15% | 13% | ✅ |

#### C. Linked Tasks Section
- Shows all tasks contributing to this goal
- Ability to add/remove task links
- Contribution type label (Count/Duration/Metric)

#### D. Weekly Progress Snapshot (Current Week)
- Visual showing % of targets hit
- Breakdown: 3/4 targets completed
- Days remaining in week

#### E. Monthly Trend Chart
- Sparkline showing 4 weeks of check-in data
- "On track" vs "Falling behind" trend line
- Momentum indicator

#### F. Check-Ins History
- List of past check-ins (most recent first)
- Date, overall %, qualitative feedback excerpt
- [View Full Check-in] expandable

### 3. Goal Creation/Edit Form

**Fields**:
- Goal statement (text input)
- Area (dropdown: Health, Relationships, Finance, Full Stack, Huge Capital, S4)
- Target date (date picker)
- Primary metric (text input, e.g., "10-15% body fat")
- Metric type (numeric or qualitative)
- [Add Target] button to create weekly/monthly targets

**Target Sub-Form**:
- Target name (e.g., "Workout 4x/week")
- Frequency (dropdown: daily, weekly, monthly)
- Target value (numeric input)
- Target unit (text input: count, min, pounds, %, etc.)
- [Link Tasks] button

**Task Linking Sub-Form**:
- Search/select existing tasks
- Choose contribution type:
  - Count: Each completion = +1
  - Duration: Sum task duration
  - Metric: Pull from external source (finance, etc.)
- [Add Link] [Remove Link] buttons

### 4. Weekly Check-In Modal

**Trigger**:
- Automatic prompt on Sunday
- Or user clicks "Check In Now" button

**Form**:
```
HEALTH GOAL - Weekly Check-In
Week of Oct 20-26, 2025

[Target Metrics Progress]
Workouts: 4/4 ✅
Stretches: 28/35 ⚠️ (80%)
Walks: 210/210 min ✅
Body Fat: 13% ✅

OVERALL SCORE: 87% targets hit

[Questions]
Q1: "How are you feeling this week?"
[Text Input]

Q2: "Is the pace sustainable?"
○ Yes  ○ No  ○ Need to adjust

Q3: "Any obstacles or wins to note?"
[Text Input]

[Save Check-In] [Cancel]
```

**Post-Submit**:
- Show confirmation: "Check-in saved for Oct 26"
- Display suggested insights based on pattern
- If below 75% targets: "Would you like to adjust targets for next week?"

### 5. Monthly Summary View

**Tab in Goal Detail**:
```
OCTOBER SUMMARY

Week 1 (Oct 1-5):   75% targets hit 📝
Week 2 (Oct 8-12):  80% targets hit 📝
Week 3 (Oct 15-19): 87% targets hit 📝
Week 4 (Oct 22-26): 92% targets hit 📝

[Trend Chart: Upward trend ↗️]

Notes Summary:
- "Felt great starting the week, got tired mid-week"
- "Workout consistency improved"
- "Need more walking on weekends"

[Next Month Targets] [Archive Month]
```

---

## UI/UX Design Notes

### Visual Hierarchy
- **Goal statement** (largest, top)
- **Target date + countdown** (prominent, secondary)
- **Weekly progress bar** (center, high-contrast)
- **Target breakdowns** (detailed, secondary)

### Progress Visualization
- **Color coding**:
  - Green: On track (75%+)
  - Yellow: Caution (50-74%)
  - Red: At risk (<50%)
  - Blue: Achieved/Exceeded

- **Badges**:
  - ✅ Completed
  - ⚠️ At risk
  - 📈 On track
  - 🎯 Exceeded

### Responsive Design
- **Desktop**: 2-column layout (goal list + detail)
- **Tablet**: Single column, stacked cards
- **Mobile**: Full-screen goal detail, back button to list

---

## Integration Points

### 1. Task System Integration
- When task is completed → check if it's linked to a goal
- If linked:
  - Increment count OR
  - Add duration OR
  - Trigger metric refresh (if finance-linked)
- Real-time update of goal progress in sidebar/header (if goal details open)

### 2. Business Projects Integration
- Project goals auto-link to Business Project module
- Goal detail shows:
  - Linked project name
  - Phase completion %
  - Task completion % in project
  - Countdown to project deadline

### 3. Finance Module Integration
- Finance goals pull data from balance_snapshots
- Goal metric shows current savings/debt balance
- Monthly check-in can reference finance snapshot

### 4. Daily Dashboard Integration
- Daily view shows current goal targets
- Quick access to check if on track for daily targets
- Weekend reminder: "Check-in Sunday for your goals"

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Create goal-related tables in Supabase
- [ ] Build types for goals, targets, check-ins
- [ ] Create hooks: `useGoals`, `useGoalTargets`, `useGoalCheckIns`
- [ ] Set up real-time subscriptions

### Phase 2: UI Foundation (Week 2-3)
- [ ] Goal list view component
- [ ] Goal creation/edit form
- [ ] Goal detail view scaffold
- [ ] Integrate into Review dropdown

### Phase 3: Task Integration (Week 3-4)
- [ ] Goal-task linking UI
- [ ] Task completion → goal update logic
- [ ] Progress recalculation on task changes

### Phase 4: Check-In System (Week 4-5)
- [ ] Weekly check-in modal
- [ ] Check-in form with questions
- [ ] Historical check-in list
- [ ] Sunday notification/reminder

### Phase 5: Analytics & Trends (Week 5-6)
- [ ] Monthly summary view
- [ ] Trend visualization (sparklines, momentum)
- [ ] Insight generation (e.g., "You've hit 85% of targets 4 weeks in a row")

### Phase 6: Polish & Launch (Week 6-7)
- [ ] Test data seeding
- [ ] Integration testing (task → goal sync)
- [ ] Performance optimization (real-time updates)
- [ ] Documentation & deployment

---

## Success Metrics

- **Feature Adoption**: 80%+ of goals created by user within first month
- **Check-In Completion**: 90%+ of weekly check-ins submitted on schedule
- **Task-to-Goal Sync**: <500ms latency for task completion → goal update
- **User Sentiment**: "Goals feature helped me stay accountable" (survey)
- **Engagement**: 5+ logins/week to view goals & progress

---

## Open Questions / Future Considerations

1. **Goal Sharing**: Should goals be shareable (e.g., shared with Cheyanne)?
2. **Smart Insights**: Should system suggest which areas need focus based on low performance?
3. **Goal Templates**: Pre-built templates for common goals (fitness, finance, etc.)?
4. **Mobile App**: How should goals look on mobile? Simplified view?
5. **Archive & History**: Should completed goals be archived or always visible?
6. **Custom Frequencies**: Support for "every 2 weeks" or "bi-monthly" check-ins?
7. **Gamification**: Streaks, badges, or achievements for goal milestones?

---

## Appendix: Sample Goals & Targets

### Health Goal
```
Goal: Be physically fit and proud of how I look
Area: Health
Target Date: 2026-06-01
Primary Metric: 10-15% body fat

Targets:
  - Workout 4x/week (count-based, linked to workout tasks)
  - Stretch 5 min daily (count-based, linked to stretch tasks)
  - Walk 30 min daily (duration-based, linked to walk task)
  - Eat healthy (qualitative, logged in check-in)

Check-In Schedule: Every Sunday
```

### Finance Goal
```
Goal: Save 6 months of living expenses
Area: Finance
Target Date: 2026-12-31
Primary Metric: $42K in savings

Targets:
  - Savings balance: $42K (metric-based, pulls from finance module)
  - Monthly contribution: $3,500/month

Check-In Schedule: Every Sunday
Linked to: Finance module balance snapshots
```

### Project Goal
```
Goal: Complete Huge Capital Dashboard V1
Area: Huge Capital
Target Date: 2026-01-30
Primary Metric: All identified projects & phases migrated

Targets:
  - Phase 1 completion: 100%
  - Phase 2 completion: 100%
  - Phase 3 completion: 100%
  - Phase 4 completion: 100%

Check-In Schedule: Every Sunday
Linked to: Business Project "Huge Capital Dashboard"
```

### Relationships Goal
```
Goal: Be a good person in my relationships
Area: Relationships
Target Date: Ongoing
Primary Metric: Qualitative (engagement quality)

Targets (Weekly):
  - Connect with family: 1+ interaction
  - Time with Cheyanne: 2+ quality interactions
  - Help a friend: 1+ act of service

Check-In Schedule: Every Sunday
Qualitative only (no automatic tracking)
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 25, 2025 | John (PM) | Initial PRD based on user requirements |
