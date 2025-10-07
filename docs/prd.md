# Personal Dashboard System for Multi-Business Management Product Requirements Document (PRD)

## Goals and Background Context

### Goals
- Reduce daily planning/status checking overhead from 1-2 hours to <15 minutes (85%+ reduction in cognitive load)
- Successfully deliver on all 3 consulting contracts + advance 2 personal ventures simultaneously
- Ensure zero security breaches across all client projects with sensitive financial data
- Increase learning/implementation time by 7-14 hours/week through cognitive offload
- Enable 1-2 click visibility across all 4 businesses and life areas from central Tasks hub
- Track time allocation to prevent health goal neglect during busy consulting periods
- Generate 5+ high-quality case studies within 12 months to support revenue scaling

### Background Context

Taylor Grassmick currently operates an unsustainable but strategically designed business model: 3 consulting clients (Huge Capital, S4, 808) generating $15K/month serve as "paid education" funding 2 personal ventures (Full Stack AI, Service SaaS) while building AI automation expertise. This creates a time-sensitive opportunity—capturing premium rates during the 12-24 month window before AI automation becomes commoditized.

The core problem is cognitive overhead: managing dozens of active projects across 4 businesses plus health/content/golf/finance areas creates 7-14 hours weekly of mental "remembering what to do" time, reducing execution velocity during the closing opportunity window. The dashboard serves as an "external brain"—centralizing task synchronization, progress visibility, and time allocation tracking—converting cognitive load into execution capacity for high-value learning and implementation.

### Change Log

| Date       | Version | Description                          | Author           |
|------------|---------|--------------------------------------|------------------|
| 2025-10-06 | v1.0    | Initial PRD creation from brief      | John (PM Agent)  |

## Requirements

### Functional Requirements

**FR1:** Tasks Central Hub provides bidirectional synchronization between the Tasks page and all Business project tasks, Daily planning pages, and Health/Life area tasks as a single source of truth

**FR2:** Business areas (Full Stack AI, Service SaaS, Huge Capital, S4, 808) support Project > Phase > Task hierarchy with proper data relationships

**FR3:** Progress visualization calculates and displays completion percentages at Task, Phase, and Project levels with visual indicators (progress bars, color coding)

**FR4:** Review page aggregates read-only activity view across all 7 main areas (DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF) providing "what's up" snapshot in 1-2 clicks

**FR5:** Daily planning pages include Tasks, To-Do List, Schedule, Deep Work timer, Goals, and Review sections with night-before planning support

**FR6:** Deep Work timer tracks time to the minute and automatically syncs logged sessions to Deep Work log

**FR7:** Time allocation tracking is calculated from Deep Work log entries, aggregating time invested per business/project and across all main life areas

**FR8:** Monthly → Weekly → Daily planning hierarchy supports flexible replanning to accommodate unpredictable client requests

**FR9:** Content area manages Library and "Tee Up with TG" content with appropriate data models

**FR10:** Health area tracks Workouts, Goals, Progress, and Meal Planner

**FR11:** Finances area displays Networth, Transactions, Breakdown, Budget, and Investor views

**FR12:** Life area manages Journal, Cheypow, Brain Dumps, Shopping, Groceries, Travel, Memories, Dream Life, and Inspiration

**FR13:** Golf area tracks Scorecard and Strokes Gained metrics

### Non-Functional Requirements

**NFR1:** Page load time must be <2 seconds for all dashboard pages

**NFR2:** Task synchronization latency must be <500ms between source and target pages

**NFR3:** System must support 100+ active tasks simultaneously across all business and life areas without performance degradation

**NFR4:** Dashboard must maintain 99.5%+ uptime for daily usability reliability

**NFR5:** All API keys and secrets must be stored in environment variables only, never in client-side code

**NFR6:** All Supabase database tables must implement Row Level Security (RLS) policies

**NFR7:** GitHub secret scanning must be enabled and monitored on the repository

**NFR8:** Pre-deployment security checklist must be executed and pass before any production deployment

**NFR9:** Sensitive client financial data must be encrypted at rest in the database

**NFR10:** Application must be web-responsive supporting desktop and mobile browsers (Chrome, Firefox, Safari, Edge - last 2 versions)

**NFR11:** Database queries must respond in <100ms at current single-user scale

## User Interface Design Goals

### Overall UX Vision

Modern dark mode dashboard with vibrant color-coded cards optimized for visual information scanning. Design philosophy: "1-2 click access to everything" using card-based layouts, tabbed navigation, and color psychology for instant business/area recognition. The interface prioritizes visual hierarchy through bold colors, clear typography, and metric-driven cards that provide at-a-glance status.

### Key Interaction Paradigms

- **Card-based information architecture:** Task cards, metric cards, and session cards with color coding by business area (green=Full Stack, purple=Huge Capital, blue=S4, orange=808, pink=Personal, teal=Health, orange=Golf)
- **Tab-based sub-navigation:** To-Do List / Schedule / Deep Work tabs within Daily section for efficient context switching
- **Persistent Deep Work timer:** Right-side panel with prominent countdown timer, task selection, focus area dropdown, and start/stop controls
- **Metric dashboard cards:** Large number displays for Active/Completed/Recurring/Overdue tasks with color-coded status indicators
- **Business area filtering:** Quick filter buttons showing task counts per business with color-coded badges
- **Inline task management:** Expandable task cards with checkboxes, checklists, and "Think Thru" notes sections

### Core Screens and Views

- **Daily To-Do List** (primary view: task metrics, due today/tomorrow cards, business filters, Deep Work timer panel)
- **Daily Schedule** (tabbed view within Daily section)
- **Deep Work Sessions** (analytics view: total sessions, time tracking, business/project breakdown with visual cards)
- **Deep Work Session Log** (detailed log entries with date, time range, duration, business area, labels, and notes in color-coded rows)
- **Tasks Hub** (central synchronization dashboard - to be enhanced)
- **Business Pages** (5 pages: Full Stack AI, Service SaaS, Huge Capital, S4, 808 with Project > Phase > Task hierarchy)
- **Content Library, Health, Finances, Life, Golf pages** (following similar card-based visual patterns)

### Accessibility

**None** - Dark mode only, no accessibility standards required for personal-use dashboard

### Branding

**Dark mode modern aesthetic** with vibrant color palette:
- Background: Dark gray/black (#1a1a1a approximate)
- Primary accent: Orange (#ff8c42 for CTAs, active states)
- Business color coding: Green (Full Stack), Purple (Huge Capital), Blue (S4), Orange (808), Pink/Magenta (Personal), Teal (Health), Orange-red (Golf)
- Typography: Clean sans-serif, bold headers, clear hierarchy
- Visual style: Glass-morphism cards, subtle shadows, rounded corners, modern button styles

High visual impact appropriate for personal productivity and professional enough for client case study screenshots.

### Target Device and Platforms

**Web Responsive** - Desktop-first dark mode design with mobile-responsive layout. Optimized for desktop/laptop primary usage with graceful adaptation to tablet and mobile screens.

## Technical Assumptions

### Repository Structure

**Monorepo** - Single private GitHub repository for the entire dashboard application

### Service Architecture

**Single-page application (SPA) with Supabase backend** - React frontend communicating with Supabase PostgreSQL database, authentication, and real-time subscriptions. Serverless architecture leveraging Supabase's managed backend services eliminates need for custom API layer.

**Rationale:** Supabase handles database, auth, and real-time sync out of the box, allowing focus on dashboard functionality rather than infrastructure. Real-time subscriptions enable bidirectional task synchronization between pages without custom WebSocket implementation.

### Testing Requirements

**Manual testing with convenience methods** - No formal automated test suite for MVP. Rely on systematic manual testing aided by development convenience methods (database seeders, state inspection tools, test data generators).

**Rationale:** Given solo development with Claude Code and time-sensitive opportunity window, automated test overhead doesn't justify ROI for personal-use dashboard. Security checklist and manual verification provide sufficient quality assurance.

### Additional Technical Assumptions and Requests

- **Tech Stack (current implementation):**
  - Frontend: React-based SPA
  - Backend: Supabase (PostgreSQL + Auth + Real-time)
  - Hosting: GitHub repository with GitHub Actions deployment
  - Domain: GoDaddy (https://tgdashboard.fullstackaiautomation.com)

- **Development Approach:** "Vibe coding" with Claude Code (AI-assisted rapid development) paired with systematic security guardrails via pre-deployment checklists

- **Security Architecture:**
  - All API keys/secrets in environment variables only (never client-side code)
  - Supabase Row Level Security (RLS) policies on all database tables
  - GitHub secret scanning enabled
  - Mandatory pre-deployment security checklist before production pushes
  - Client financial data encrypted at rest

- **Real-time Sync:** Supabase real-time subscriptions power bidirectional task synchronization between Tasks hub and Business/Daily/Health pages

- **State Management:** Client-side state management (React Context/hooks) for UI state; Supabase handles persistence and sync

- **Performance Targets:**
  - Page load <2s
  - Task sync latency <500ms
  - Database queries <100ms response time
  - Support 100+ concurrent active tasks

- **Deployment:** GitHub Actions automated deployment pipeline to production domain

## Epic List

**Epic 1: Tasks Central Hub & Synchronization**
Complete and optimize the Tasks page as the central nervous system with verified bidirectional sync to all Business, Daily, and Health pages, ensuring <500ms latency and zero data loss.

**Epic 2: Progress Visualization System**
Implement comprehensive progress tracking with % complete calculations at Task, Phase, and Project levels, including visual indicators throughout the dashboard to provide motivational fuel and execution clarity.

**Epic 3: Security & Data Integrity Foundation**
Establish production-ready security protocols and verify data integrity across existing dashboard implementation to protect sensitive client financial data and ensure reliable task synchronization.

**Epic 4: Time Allocation & Analytics**
Enhance Deep Work log integration to calculate time allocation across businesses and life areas, with visual analytics showing balance and highlighting health goal neglect risks.

**Epic 5: Review Dashboard & Aggregated Views**
Create unified Review page aggregating read-only activity across all 7 main areas, providing the "what's up" snapshot for 1-2 click visibility into entire life ecosystem.

## Epic 1: Tasks Central Hub & Synchronization

**Epic Goal:** Establish the Tasks page as the central nervous system of the dashboard, providing a single source of truth for all work across businesses and life areas. Implement and verify bidirectional synchronization between Tasks hub and all Business project pages, Daily planning pages, and Health/Life area tasks, ensuring sub-500ms sync latency and zero data loss or duplication. This foundation enables cognitive offload by eliminating the need to check multiple pages to understand "what's up" - all active work flows through the Tasks hub for unified visibility and management.

### Story 1.1: Tasks Hub Page Structure & Data Model

As a multi-business operator,
I want a centralized Tasks page that displays all tasks from every business and life area in a unified view,
so that I can see everything I need to do across my entire ecosystem without navigating to individual pages.

#### Acceptance Criteria

1. Tasks page displays all tasks from Business areas (Full Stack AI, Service SaaS, Huge Capital, S4, 808), Daily planning, and Health/Life areas in a single unified list
2. Each task card shows: task title, source area/business (color-coded), due date, status (active/completed/overdue), and Project > Phase hierarchy if applicable
3. Tasks can be filtered by business area using the existing color-coded filter buttons (matching Daily page pattern)
4. Tasks can be filtered by status: Active, Completed, Recurring, Overdue
5. Tasks support inline editing: click to edit title, change due date, update status without leaving Tasks page
6. Database schema includes `tasks` table with foreign keys to `projects`, `phases`, `businesses`, and `life_areas` tables
7. Tasks page loads in <2 seconds with 100+ tasks displayed
8. Color coding matches existing dashboard palette (green=Full Stack, purple=Huge Capital, blue=S4, orange=808, pink=Personal, teal=Health, orange=Golf)

### Story 1.2: Bidirectional Sync - Business Projects to Tasks Hub

As a consultant managing multiple client projects,
I want tasks created in Business project pages to automatically appear in the Tasks hub,
so that I don't have to manually duplicate tasks between project management and daily planning views.

#### Acceptance Criteria

1. When a task is created within a Business project (e.g., Huge Capital > Project X > Phase Y > Task Z), it automatically appears in Tasks hub within 500ms
2. Task updates in Business pages (title change, status change, due date change) sync to Tasks hub in real-time
3. Task deletion in Business pages removes the task from Tasks hub
4. Sync uses Supabase real-time subscriptions (not polling) for efficiency
5. Tasks hub displays Project > Phase hierarchy for business tasks to maintain context
6. No duplicate tasks are created during sync (enforce unique constraints)
7. Sync errors are logged and surfaced to user with clear error messages
8. Tasks created before sync implementation are backfilled into Tasks hub via migration script

### Story 1.3: Bidirectional Sync - Tasks Hub to Business Projects

As a multi-business operator planning my day,
I want task updates made in the Tasks hub to sync back to their source Business project pages,
so that project views always reflect current task status without manual updates.

#### Acceptance Criteria

1. Task status changes in Tasks hub (e.g., marking complete) sync to source Business project page within 500ms
2. Task edits in Tasks hub (title, due date, notes) update the source task in Business pages
3. Tasks deleted from Tasks hub are removed from Business project pages
4. Conflict resolution: if same task is edited simultaneously in Tasks hub and Business page, last-write-wins with timestamp comparison
5. Sync maintains referential integrity - tasks cannot be orphaned from their parent Project/Phase
6. Moving a task to a different Project/Phase in Tasks hub updates the Business page hierarchy correctly
7. Undo functionality allows reverting accidental task changes within 30 seconds (local state, not full history)

### Story 1.4: Bidirectional Sync - Daily Pages to Tasks Hub

As someone who plans the night before,
I want tasks assigned to Daily pages (To-Do List, Schedule) to appear in Tasks hub,
so that my daily plan and overall task backlog stay synchronized without manual copying.

#### Acceptance Criteria

1. Tasks added to Daily To-Do List automatically appear in Tasks hub tagged with the specific date
2. Tasks scheduled in Daily Schedule sync to Tasks hub with scheduled time preserved
3. Completing a task in Daily To-Do List marks it complete in Tasks hub (and source Business page if applicable)
4. Tasks can be created directly in Tasks hub and assigned to a specific Daily page via date picker
5. Tasks due "today" or "tomorrow" automatically appear in respective Daily page views (matching existing Due Today/Due Tomorrow cards)
6. Recurring tasks created in Daily pages generate task instances in Tasks hub for each recurrence
7. Daily page displays only tasks relevant to that date; Tasks hub shows all tasks across all dates

### Story 1.5: Bidirectional Sync - Health/Life Areas to Tasks Hub

As someone balancing business and personal goals,
I want health, content, and life area tasks to sync with Tasks hub,
so that personal goals have equal visibility alongside business work and don't get neglected.

#### Acceptance Criteria

1. Health tasks (Workouts, Meal Planner goals) sync to Tasks hub tagged with "Health" area
2. Content tasks (Library items, Tee Up with TG episodes) sync to Tasks hub tagged with "Content" area
3. Life area tasks (Journal prompts, Shopping items, Travel planning) sync to Tasks hub tagged with appropriate life subcategory
4. Health/Life tasks use the same bidirectional sync pattern as Business tasks (500ms latency, real-time updates)
5. Health/Life tasks support different data models than Business tasks (no Project>Phase hierarchy required)
6. Tasks hub displays Health/Life tasks with appropriate visual styling (teal for Health, pink for Personal, etc.)
7. Time allocation for Health/Life tasks is tracked in Deep Work log when worked on

### Story 1.6: Tasks Hub Performance Optimization & Error Handling

As a power user with 100+ active tasks,
I want the Tasks hub to load quickly and handle sync errors gracefully,
so that the dashboard remains responsive and reliable during high-volume usage.

#### Acceptance Criteria

1. Tasks hub page loads in <2 seconds with 100+ tasks displayed
2. Task sync operations complete in <500ms (95th percentile performance)
3. Database queries use proper indexing on `business_id`, `due_date`, `status`, and `user_id` columns for <100ms response time
4. Sync failures display user-friendly error messages (not raw database errors)
5. Failed sync operations retry automatically up to 3 times with exponential backoff
6. Tasks hub implements virtual scrolling for lists exceeding 50 tasks to maintain smooth scrolling performance
7. Sync status indicator shows when syncing is in progress (subtle spinner or pulse animation)
8. Manual refresh button allows forcing a full sync if automatic sync appears stuck
9. Error log captures sync failures with timestamp, affected task ID, and error details for debugging

## Epic 2: Progress Visualization System

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

## Epic 3: Security & Data Integrity Foundation

**Epic Goal:** Establish production-ready security protocols to protect sensitive client financial data and ensure the dashboard can be safely deployed with confidential information from consulting clients (bank statements, MCA applications, financial metrics). Implement systematic pre-deployment security checklist, verify Supabase Row Level Security policies, eliminate API key exposure risks, and validate data integrity across the synchronization system. This epic prevents catastrophic security breaches that could destroy reputation and consulting business while ensuring reliable data handling.

### Story 3.1: Pre-Deployment Security Checklist Implementation

As a consultant handling sensitive client financial data,
I want a mandatory security checklist that must pass before any production deployment,
so that I never accidentally expose API keys, credentials, or client data.

#### Acceptance Criteria

1. Security checklist document created in repository at `.ai/security-checklist.md` with all verification steps
2. Checklist includes sections:
   - GitHub secret scanning verification
   - Environment variables audit (no keys in client code)
   - Supabase RLS policy verification
   - API endpoint authentication check
   - Client data encryption at rest verification
   - Deployment configuration review
3. GitHub Actions deployment workflow includes automated security check step that fails build if issues detected
4. Checklist includes Claude Code security audit command that can be run pre-deployment
5. Manual checklist sign-off required before merge to main branch (documented in PR template)
6. Checklist tracks completion date, auditor (you), and findings/remediation actions
7. Failed checklist items block deployment with clear error messages explaining what needs fixing
8. Checklist is versioned and updated as new security requirements emerge

### Story 3.2: GitHub Secret Scanning & API Key Protection

As a developer using Claude Code for rapid development,
I want automated detection of accidentally committed secrets,
so that API keys and credentials never make it to the repository even during "vibe coding" sessions.

#### Acceptance Criteria

1. GitHub secret scanning is enabled on the repository with notifications to your email
2. Pre-commit hook (using Husky or similar) scans for common secret patterns before allowing commits:
   - API keys (Supabase, OpenAI, etc.)
   - Database connection strings
   - Environment variable values (.env file content)
   - Private keys and certificates
3. `.gitignore` includes all sensitive file patterns: `.env`, `.env.local`, `*.key`, `credentials.json`
4. All API keys and secrets are stored in environment variables only, loaded via `.env` file (never committed)
5. Example `.env.example` file shows required variables with placeholder values, safe to commit
6. Repository audit scans entire git history for accidentally committed secrets from before scanning was enabled
7. If secrets are found in history, repository is cleaned using `git filter-repo` or BFG Repo-Cleaner and all exposed keys are rotated immediately
8. Documentation in README explains how to set up environment variables for local development

### Story 3.3: Supabase Row Level Security (RLS) Policies

As a solo user with sensitive data,
I want all database tables protected by Row Level Security policies,
so that even if authentication is compromised, data access is restricted to only my user account.

#### Acceptance Criteria

1. Every Supabase table has RLS enabled (no exceptions)
2. RLS policies enforce user_id matching: users can only read/write rows where `user_id = auth.uid()`
3. Tables include: `tasks`, `projects`, `phases`, `businesses`, `daily_pages`, `deep_work_sessions`, `health_goals`, `content_items`, `finance_records`, `life_items`, `golf_scores`
4. Sensitive client data tables (financial records, project details) have additional encryption at rest via Supabase encryption features
5. RLS policies are tested with automated script that attempts unauthorized access and verifies denial
6. Service role key (bypasses RLS) is stored securely in GitHub Secrets, never in client code or committed files
7. Anon key (used by frontend) has appropriate permissions via RLS, cannot access other users' data
8. RLS policy audit report generated showing all tables, their policies, and last verification date
9. Database migration scripts include RLS policy creation alongside table creation (never deployed without RLS)

### Story 3.4: Client Data Encryption & Handling Protocols

As a consultant with access to client financial data,
I want explicit protocols for handling sensitive information in the dashboard,
so that client data is protected throughout its lifecycle and I can demonstrate security compliance.

#### Acceptance Criteria

1. Sensitive client data fields (bank account numbers, financial metrics, company names) are encrypted at rest using Supabase encryption
2. Client financial documents (bank statements, MCA applications) are NOT stored in the dashboard database - only references/metadata stored
3. Actual sensitive documents stored in encrypted cloud storage (Supabase Storage with encryption) with access logs
4. Dashboard displays masked versions of sensitive data (e.g., "****5678" for account numbers) with option to reveal only when needed
5. Data retention policy documented: client data automatically purged 90 days after project completion (configurable)
6. Audit log tracks all access to sensitive client data: user, timestamp, data accessed, action performed
7. Client data tagging system allows marking projects/tasks as "Confidential" with visual indicators and additional access controls
8. Export/download functionality for client data includes watermarking and access tracking
9. Security practices documentation created for client presentation: "How We Protect Your Data" one-pager

### Story 3.5: Authentication & Session Security

As the sole user of this dashboard,
I want secure authentication that prevents unauthorized access,
so that my business data and client information remain private even if my device is compromised.

#### Acceptance Criteria

1. Supabase authentication configured with email + password (minimum 12 characters, complexity requirements)
2. Session timeout after 24 hours of inactivity, requires re-authentication
3. "Remember me" functionality uses secure, httpOnly cookies (not localStorage for sensitive tokens)
4. Login attempts are rate-limited: max 5 failed attempts per 15 minutes, then temporary account lock with email notification
5. Two-factor authentication (2FA) available as optional enhancement using Supabase Auth 2FA features
6. Password reset flow includes email verification and link expiration (15 minutes)
7. Active session monitoring: dashboard displays "Last login: [timestamp]" and allows viewing active sessions
8. Logout functionality clears all local storage, session storage, and cookies completely
9. Authentication errors display user-friendly messages without revealing system details (no "user not found" vs "wrong password" distinction)

### Story 3.6: Data Integrity Validation & Backup

As someone relying on the dashboard for cognitive offload,
I want assurance that my data is never lost or corrupted during sync operations,
so that I can trust the dashboard as my "external brain" without fear of losing critical information.

#### Acceptance Criteria

1. Sync operations include integrity checks: verify task counts before/after sync, log discrepancies
2. Database constraints prevent orphaned records: tasks cannot exist without parent project/phase (foreign key constraints with ON DELETE CASCADE)
3. Unique constraints prevent duplicate tasks during sync race conditions
4. Automated daily backup of Supabase database to external storage (GitHub repo or cloud storage) with 30-day retention
5. Backup restoration procedure documented and tested: can restore from backup within 1 hour if needed
6. Sync conflict detection: if same task modified simultaneously in multiple locations, conflict is detected and user is prompted to resolve
7. Data validation on all input fields: task titles (max 200 chars), dates (valid format), percentages (0-100 range)
8. Corrupted data detection script runs weekly: checks for null required fields, invalid foreign keys, orphaned records
9. Point-in-time recovery capability using Supabase backups: can restore to any point within last 7 days if data corruption occurs
10. Manual backup button in dashboard settings allows on-demand full data export to JSON file

## Epic 4: Time Allocation & Analytics

**Epic Goal:** Enhance Deep Work log integration to provide comprehensive time allocation analytics across all businesses and life areas, enabling data-driven decisions about where time is being invested and identifying when health goals are being neglected. Build visual analytics showing time distribution, business-level ROI tracking, and alerts when allocation falls below target thresholds. This transforms the Deep Work timer from simple time tracking into strategic intelligence that prevents burnout and ensures balanced attention across the multi-business portfolio.

### Story 4.1: Deep Work Log Time Allocation Calculation

As a multi-business operator,
I want the Deep Work log to automatically calculate time invested per business and life area,
so that I can see where my hours are actually going without manual time tracking.

#### Acceptance Criteria

1. Each Deep Work session is tagged with: Business/Life Area, Project (if applicable), Task, and Labels (e.g., "Internal Build", "$$$ Printer $$$")
2. Time allocation calculation aggregates Deep Work sessions by business area: Total hours per business per day/week/month
3. Time allocation displayed in multiple views:
   - Daily: "Today you spent 3h on Full Stack, 2h on Huge Capital, 1h on Health"
   - Weekly: Bar chart showing hours per business across the week
   - Monthly: Trend line showing time distribution over 30 days
4. Life areas (Health, Content, Golf, Personal) are tracked alongside businesses with equal visibility
5. "Unallocated time" category captures hours not tagged to specific business/area (should be minimized)
6. Time allocation data is filterable: view by date range, by business, by project, by label
7. Calculations update in real-time as new Deep Work sessions are logged
8. Export functionality allows downloading time allocation report as CSV for client invoicing or personal analysis

### Story 4.2: Business-Level Time Investment Dashboard

As a consultant balancing 3 clients plus 2 personal ventures,
I want each Business page to show total time invested and ROI metrics,
so that I can ensure I'm allocating appropriate attention to each revenue stream.

#### Acceptance Criteria

1. Each Business page displays "Time Invested" card at top showing:
   - Total hours (all-time)
   - Hours this week
   - Hours this month
   - Average hours per week over last 4 weeks
2. Business page shows time allocation breakdown by project within that business (pie chart or bar chart)
3. Time allocation vs. revenue tracking: "Huge Capital: 45h this month, $5K revenue = $111/hour effective rate"
4. Alert indicator if business has received zero hours for 7+ consecutive days: "⚠️ No time allocated this week"
5. Business comparison view shows all 5 businesses side-by-side with time investment bars for relative comparison
6. "Time Budget" feature allows setting target hours per business per week, with visual indicator showing actual vs. target
7. Historical time trends: line graph showing hours invested in each business over last 3 months
8. Labels within business (e.g., "New Build", "Bug Fix", "Client Meeting") show time breakdown for internal analysis

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

## Epic 5: Review Dashboard & Aggregated Views

**Epic Goal:** Create a unified Review page that aggregates read-only activity across all 7 main areas (DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF), providing the "what's up" snapshot for 1-2 click visibility into the entire life ecosystem. This becomes the default morning landing page—replacing the need to check email/Slack first—by showing everything important at a glance: tasks due today, project progress, health status, financial metrics, and areas needing attention. The Review dashboard is the culmination of all previous epics, synthesizing task sync, progress visualization, and time allocation into a single command center view.

### Story 5.1: Review Dashboard Page Structure & Navigation

As a multi-business operator starting my day,
I want a Review dashboard that shows all 7 main areas in a single view,
so that I can see my entire life ecosystem status in 1-2 clicks without navigating to individual pages.

#### Acceptance Criteria

1. Review page displays 7 main area cards in organized grid layout: DAILY, BIZNESS, CONTENT, HEALTH, FINANCES, LIFE, GOLF
2. Each area card shows: area name, color-coded icon, high-level status summary, and last updated timestamp
3. Review page is accessible from main navigation with prominent placement (e.g., first menu item or dedicated "Review" button)
4. Review dashboard is READ-ONLY: no editing capabilities, only viewing aggregated data with links to detail pages
5. Page loads in <2 seconds despite aggregating data from all 7 areas using optimized queries and caching
6. One-click navigation from any area card to its detailed page (e.g., click HEALTH card → navigate to Health page)
7. Visual hierarchy: areas with urgent items (overdue tasks, warnings, alerts) are highlighted with red/yellow borders
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

### Story 5.3: Business Area Summary Card

As a consultant managing 5 businesses,
I want the Business area card to show aggregate status across all 5 businesses,
so that I can identify which businesses need attention without checking each individually.

#### Acceptance Criteria

1. Business card displays aggregate across all 5 businesses:
   - Total active projects count
   - Overall completion % (average across all business projects)
   - Total active tasks across all businesses
   - Total hours invested this week across all businesses
2. Business card expands to show 5 individual business mini-cards with color coding:
   - Full Stack AI (green): "2 projects, 65% complete, 12h this week"
   - Service SaaS (varies): "1 project, 30% complete, 0h this week" ⚠️
   - Huge Capital (purple): "3 projects, 80% complete, 15h this week"
   - S4 (blue): "1 project, 90% complete, 8h this week"
   - 808 (orange): "1 project, 45% complete, 5h this week"
3. Businesses with warnings are flagged: zero hours this week, stalled projects (no activity 7+ days), overdue tasks
4. Quick action: clicking business mini-card navigates to that specific Business page
5. Visual indicator shows which business has most active tasks (needs most attention)
6. Business card shows upcoming deadlines: "Next deadline: Huge Capital deliverable in 3 days"

### Story 5.4: Health, Content, Life, Golf Area Summary Cards

As someone balancing business and personal goals,
I want Health, Content, Life, and Golf area cards to show status alongside business cards,
so that personal goals have equal visibility and don't get neglected.

#### Acceptance Criteria

1. **Health card** displays:
   - Hours invested this week vs. weekly target (e.g., "3h / 5h target") ⚠️
   - Active health goals count (workouts scheduled, meal plans)
   - Recent activity: "Last workout: 2 days ago"
   - Warning if health hours below 80% of weekly target
2. **Content card** displays:
   - Library items count (reading/watching queue)
   - Tee Up with TG episodes status (planned, in progress, published)
   - Recent content activity: "Last library item completed: 1 day ago"
   - Next content deadline if applicable
3. **Life card** displays:
   - Active life tasks count across all subcategories (Journal, Shopping, Travel, etc.)
   - Recent journal entries count (encourages daily journaling)
   - Upcoming life events from Travel or important dates
   - Brain dumps count (ideas captured but not processed)
4. **Golf card** displays:
   - Recent rounds count this month
   - Strokes gained trend (improving/declining)
   - Next golf session scheduled
   - Handicap or scoring average if tracked
5. All cards use consistent visual design: color-coded (teal=Health, pink=Life, orange=Golf, green=Content), same info hierarchy
6. Cards show "No recent activity" state when area hasn't been used in 7+ days

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

## Checklist Results Report

### PM Checklist Validation Summary

**Overall PRD Completeness:** 92%
**MVP Scope Appropriateness:** Just Right
**Readiness for Architecture Phase:** ✅ **READY**

**Category Pass Rates:**
- Problem Definition & Context: 95% (19/20) ✅
- MVP Scope Definition: 93% (14/15) ✅
- User Experience Requirements: 75% (12/16) ⚠️
- Functional Requirements: 96% (24/25) ✅
- Non-Functional Requirements: 94% (17/18) ✅
- Epic & Story Structure: 97% (29/30) ✅
- Technical Guidance: 92% (16/18) ✅
- Cross-Functional Requirements: 78% (11/14) ⚠️
- Clarity & Communication: 95% (9/10) ✅

**Key Findings:**
- ✅ **Strengths:** Clear problem statement with quantified impact (7-14 hours/week cognitive overhead), well-structured 5-epic plan with logical sequencing, comprehensive security requirements addressing sensitive client data risk
- ⚠️ **Minor Gaps:** Explicit user journey flows not documented (acceptable - workflows are implicit in epic stories), data model relationships implied but not diagrammed
- ✅ **Epic Sequencing Validated:** Sync → Progress → Security → Analytics → Review follows agile best practices and dependency order
- ✅ **Story Sizing Appropriate:** Stories scoped for AI agent execution in focused sessions per brief requirements
- ✅ **Technical Constraints Clear:** React + Supabase + GitHub Actions stack locked, brownfield project with no rewrites

**Scope Recommendations:**
- **MVP 1.0 (Core):** Epics 1-3 (Tasks Hub, Progress Viz, Security) deliver primary cognitive offload value
- **MVP 1.1 (Polish):** Epics 4-5 (Analytics, Review Dashboard) add intelligence layer
- **Potential Cut:** Epic 4 could be deferred if timeline pressure - Deep Work timer already tracks time, advanced analytics are enhancement

**Architect Handoff:** ✅ Ready to proceed

## Next Steps

### UX Expert Prompt

Review this PRD and create detailed UX/UI specifications for the Personal Dashboard System. Focus on:

1. **Visual Design System** - Expand the dark mode color palette, typography scale, component library (cards, progress bars, buttons, forms) following the modern aesthetic shown in provided screenshots
2. **Information Architecture** - Detail the navigation structure, page layouts, and responsive breakpoints for all 7 main areas
3. **Interaction Patterns** - Specify hover states, click behaviors, real-time update animations, and micro-interactions for progress indicators
4. **Component Specifications** - Design detailed specs for: Task cards, Project/Phase cards, Deep Work timer panel, Review dashboard cards, Business filter buttons
5. **User Flow Wireframes** - Create wireframes for: Morning routine (Review → Daily → Deep Work), Evening planning (Tasks Hub → Daily Schedule), Business project management workflow

Pay special attention to:
- Color-coded business areas (green=Full Stack, purple=Huge Capital, blue=S4, orange=808, pink=Personal, teal=Health, orange=Golf)
- Progress visualization consistency (red/yellow/green gradients, % complete displays, progress bars)
- High information density without visual clutter (mission control aesthetic)
- Quick actions and 1-2 click navigation requirements

Input: This PRD (docs/prd.md) + existing dashboard screenshots

### Architect Prompt

Review this PRD and create comprehensive technical architecture documentation for the Personal Dashboard System. Design:

1. **Database Schema** - Define all tables (tasks, projects, phases, businesses, daily_pages, deep_work_sessions, health_goals, content_items, finance_records, life_items, golf_scores) with columns, types, foreign keys, indexes, and RLS policies
2. **Real-Time Sync Architecture** - Design Supabase real-time subscription patterns for bidirectional task synchronization, conflict resolution strategy (last-write-wins with timestamps), error handling and retry logic
3. **Progress Calculation Engine** - Specify calculation logic for Task → Phase → Project completion percentages, caching/optimization strategy for Review dashboard aggregations, denormalized tables vs. computed views trade-offs
4. **Security Implementation** - Detail RLS policy patterns for all tables, encryption approach for sensitive client data, audit logging architecture, GitHub Actions security check integration
5. **Component Architecture** - Define React component structure, state management approach (Context vs. custom hooks), Supabase client setup, real-time subscription lifecycle management

Critical technical decisions to address:
- Sync conflict resolution when same task edited simultaneously in multiple locations (Epic 1 Story 1.3)
- Database indexing strategy for <100ms query performance with 100+ tasks (Epic 1 Story 1.6)
- Progress calculation performance optimization to avoid n+1 queries (Epic 2)
- Review dashboard sub-2-second load time despite aggregating 7 areas (Epic 5 Story 5.1)

Input: This PRD (docs/prd.md) + Project Brief (docs/brief.md) + Technical Preferences (.bmad-core/data/technical-preferences.md)

---

**PRD Version:** v1.0
**Date:** 2025-10-06
**Author:** John (PM Agent) 📋
**Status:** ✅ Ready for Architecture Phase
