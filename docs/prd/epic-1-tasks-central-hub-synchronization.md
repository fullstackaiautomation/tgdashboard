# Epic 1: Tasks Central Hub & Synchronization

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
