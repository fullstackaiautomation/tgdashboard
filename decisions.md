# Architectural Decisions Log

This document logs all major architectural and design decisions made during development.

---

## Decision Log

### D-001: Documentation Structure Reorganization
**Date**: Oct 26, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Original CLAUDE.md was 397 lines, mixing reference material, workflows, and guidelines
- Hard to navigate and overwhelming for new developers
- Poor separation of concerns

**Decision**:
Split monolithic CLAUDE.md into focused, purpose-driven documentation files:
- **CLAUDE.md** - Lightweight entry point with links to detailed docs (70 lines)
- **ARCHITECTURE.md** - App structure, tabs, components, directory layout
- **DATABASE.md** - Schema, tables, migrations workflow
- **IMPLEMENTATION-GUIDE.md** - Development workflow, patterns, implementation details
- **SETUP.md** - Environment configuration, installation, dependencies
- **BUGS.md** - Common issues, debugging tips, troubleshooting

**Rationale**:
- Developers can find what they need quickly
- Each doc has a single, clear purpose
- Easier to maintain and update individual sections
- Better onboarding experience for new team members
- No information lost, just reorganized

**Impact**:
- ✅ Improved navigation
- ✅ Faster onboarding
- ✅ Better maintainability
- ✅ Clearer structure

**Trade-offs**:
- Multiple files instead of single reference document
- Requires updating links when docs are reorganized

---

### D-002: Note-Taking System for Project Tracking
**Date**: Oct 26, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Need systematic way to track completed tasks and progress
- Architectural decisions not being documented
- Bug reports scattered across different locations
- No clear history of what's been done

**Decision**:
Implement three-file note-taking system:
1. **progress.md** - Track all completed tasks, current status, and next steps
2. **decisions.md** - Log all architectural decisions with context
3. **docs/BUGS.md** - Document bugs encountered and solutions

**Rules**:
- Update progress.md after every development session
- Add bug reports to docs/BUGS.md when encountered
- Log architectural decisions to decisions.md before/after implementation
- Include date, author, status, problem, decision, rationale, and impact

**Rationale**:
- Maintains clear history of project development
- Documents "why" decisions were made, not just "what"
- Creates institutional knowledge repository
- Helps future developers understand design choices
- Facilitates debugging of recurring issues

**Impact**:
- ✅ Better project transparency
- ✅ Faster issue resolution (bugs already documented)
- ✅ Design decisions preserved for future reference
- ✅ Easier code reviews (understand the "why")

---

## Decision Templates

### For Future Decisions

**Copy and paste this template when logging a new decision:**

```markdown
### D-00X: [Decision Title]
**Date**: [DATE]
**Author**: Claude
**Status**: [In Progress / ✅ Implemented / ❌ Rejected]

**Problem**:
[What problem or challenge prompted this decision?]

**Decision**:
[What was decided? Be specific and clear.]

**Rationale**:
[Why this decision? What are the benefits?]

**Impact**:
- [Impact on codebase/architecture]
- [Impact on performance]
- [Impact on maintainability]

**Trade-offs**:
- [Any downsides or compromises?]

**Related Decisions**:
- [Links to related decisions, if any]
```

---

## Decision Index

| # | Title | Date | Status |
|---|-------|------|--------|
| D-001 | Documentation Structure Reorganization | Oct 26 | ✅ Implemented |
| D-002 | Note-Taking System for Project Tracking | Oct 26 | ✅ Implemented |
| D-003 | Project Folder Structure Cleanup | Oct 26 | ✅ Implemented |
| D-004 | Epic 6: Brownfield Cleanup Epic Creation | Oct 26 | ✅ Implemented |
| D-005 | Recurring Template Identification Strategy | Oct 27 | ✅ Implemented |
| D-006 | Monthly Recurring Task Day Selection | Oct 27 | ✅ Implemented |
| D-007 | Money Maker Level Naming & Styling | Oct 27 | ✅ Implemented |

---

### D-004: Epic 6: Brownfield Cleanup Epic Creation
**Date**: Oct 26, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Dashboard UI has accumulated small inconsistencies, polish issues, and usability friction across pages
- Need structured approach to incrementally improve UX without disrupting existing architecture
- No organized framework for page-specific cleanup and refinement work
- Risk of ad-hoc changes creating inconsistencies or regressions

**Decision**:
Create Epic 6: Dashboard Cleanup - Brownfield Enhancement following BMAD brownfield epic creation workflow:
1. Created comprehensive epic document at `docs/prd/epic-6-dashboard-cleanup.md`
2. Epic serves as container for incremental page-specific cleanup stories (6.1, 6.2, 6.3, etc.)
3. Stories will be created on-demand as user provides page-specific cleanup requirements
4. Created dedicated `docs/stories/cleanup/` directory for cleanup stories
5. Updated `docs/prd/epic-list.md` to include Epic 6

**Rationale**:
- Provides structured framework for ongoing UI polish without architectural disruption
- Allows incremental improvements page-by-page (Daily, Tasks, Business, Content, Finance, Review, Navigation)
- Maintains compatibility with existing system architecture
- Low-risk approach (UI-focused, no data model changes)
- Enables systematic tracking of cleanup work
- Follows BMAD best practices for brownfield enhancement work

**Impact**:
- ✅ Organized structure for UI refinement work
- ✅ Clear epic/story hierarchy for tracking cleanup progress
- ✅ Maintains architectural integrity while allowing polish
- ✅ Reduces risk of regressions through structured approach
- ✅ Framework ready to accept stories as requirements emerge
- ✅ Follows established BMAD brownfield patterns

**Trade-offs**:
- Additional documentation overhead (epic + individual stories)
- Need to create detailed stories before implementing changes
- Requires discipline to maintain incremental approach

**Related Decisions**:
- D-001: Documentation Structure - Epic follows established documentation patterns
- D-003: Project Folder Structure - Cleanup stories organized in dedicated folder

**Files Created**:
- `docs/prd/epic-6-dashboard-cleanup.md`
- `docs/stories/cleanup/` (directory)

**Files Modified**:
- `docs/prd/epic-list.md`

---

### D-005: Recurring Template Identification Strategy
**Date**: Oct 27, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Recurring filter was picking up individual recurring task instances instead of just parent templates
- Two different filtering implementations (TaskFilters and TasksHub) using different logic
- The `is_recurring_template` flag wasn't reliable as a sole indicator

**Decision**:
Implement dual-check identification strategy for recurring templates:
- Use `!task.due_date && !task.recurring_parent_id` as definitive check
- Parent templates: have no due date AND no parent link
- Child instances: have a due date AND may have parent link
- Apply same logic consistently across all filters and views

**Rationale**:
- Database structure guarantees: parent tasks created without due_date, children always have due_date
- Foreign key relationship (`recurring_parent_id`) provides authoritative parent-child link
- Dual check prevents edge cases and is more robust than single field checks
- Applied consistently across TaskFilters, TasksHub, and TaskCard components

**Impact**:
- ✅ Recurring filter now reliably shows only parent templates
- ✅ Filter logic consistent across entire application
- ✅ No false positives or false negatives
- ✅ Foundation for future features like bulk parent template operations

**Trade-offs**:
- Requires understanding of parent-child architecture
- More complex than single-field check but more reliable

**Related Decisions**:
- Parent/Child Recurring Task Architecture (Oct 27) - Establishes the data model

---

### D-006: Monthly Recurring Task Day Selection
**Date**: Oct 27, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Monthly recurring tasks need day-of-month specification (e.g., "15th of each month")
- Previous implementation only supported day-of-week selection
- No way to distinguish between weekly (day-of-week) and monthly (day-of-month) selection

**Decision**:
Implement conditional UI and date calculation for monthly recurring tasks:
1. Add `monthlyDayOfMonth` parameter to `RecurringTaskConfig` interface
2. Show number input (1-31) for monthly tasks instead of day-of-week picker
3. Weekly/Bi-Weekly show day-of-week buttons; Monthly shows day-of-month input
4. Generator calculates dates based on day-of-month with edge case handling
5. Pass `monthlyDayOfMonth` from AddTaskModal to generator for monthly tasks

**Rationale**:
- Users naturally think in terms of "15th each month" not "2nd Wednesday"
- Separate UI components prevent confusion between selection modes
- Edge case handling (Feb 31 → last day) improves reliability
- Input validation (1-31 range) ensures valid selections

**Impact**:
- ✅ Monthly recurring tasks now work as expected
- ✅ Clear UI distinction between frequency types
- ✅ No more confusion about which day is selected
- ✅ Edge cases handled gracefully
- ✅ Better user experience for monthly task creation

**Trade-offs**:
- Requires separate state variable (`recurringMonthlyDay`)
- More complex conditional rendering in AddTaskModal
- But provides significantly better UX

**Files Changed**:
- src/utils/recurringTaskGenerator.ts
- src/components/tasks/AddTaskModal.tsx
- src/types/task.ts

---

### D-007: Money Maker Level Naming & Styling
**Date**: Oct 27, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Effort level values were inconsistent with business naming conventions
- No consistent color coding across UI
- Automation options missing emoji icons
- Values not intuitive (e.g., "$$$ MoneyMaker" unclear about meaning)

**Decision**:
Standardize Money Maker levels and Automation options with consistent naming and visual styling:

**Money Maker Levels** (renamed for clarity):
- `$$$ Printer $$$` (green #22c55e) - generates revenue
- `$ Makes Money $` (lime #84cc16) - profitable
- `-$ Save Dat $-` (orange #f97316) - saves money/reduces costs
- `:( No Money ):` (red #ef4444) - no financial impact
- `8) Vibing (8` (purple #a855f7) - for enjoyment

**Automation Options** (with emojis & colors):
- 🤖 Automate (purple)
- 👥 Delegate (violet)
- ✋ Manual (orange)
- None (empty option)

**Implementation**:
1. Updated EffortLevel TypeScript type with new values
2. Updated AddTaskModal dropdown with colors and new labels
3. Updated TaskCard display to show new labels with colors
4. Consistent application across AddTaskModal, TaskCard, and Task creation

**Rationale**:
- Emojis improve visual recognition and clarity
- Color coding helps distinguish options at a glance
- New naming more intuitive and business-friendly
- Consistency across UI reduces cognitive load

**Impact**:
- ✅ Effort levels more intuitive and self-explanatory
- ✅ Better visual distinction between options
- ✅ Consistent styling across all views
- ✅ Improved user experience and decision-making

**Trade-offs**:
- Required migrating existing task data (effort_level field values)
- Type definition change could affect other code
- But net improvement in clarity and UX outweighs migration costs

**Files Changed**:
- src/types/task.ts
- src/components/tasks/AddTaskModal.tsx
- src/components/tasks/TaskCard.tsx

---

### D-003: Project Folder Structure Cleanup
**Date**: Oct 26, 2025
**Author**: Claude
**Status**: ✅ Implemented

**Problem**:
- Root directory cluttered with 25+ markdown files
- Duplicate/outdated files scattered throughout
- Inconsistent folder organization
- Difficult to navigate and find specific documentation

**Decision**:
Comprehensive cleanup and reorganization:
1. Delete 7 redundant files (srcApp.tsx, hours-summary-replacement.tsx, nul, etc.)
2. Move 5 outdated docs to docs/archive/
3. Create docs/features/ for feature-specific documentation
4. Organize PRD and UI docs into their folders
5. Consolidate SQL files and delete empty sql/ folder
6. Delete financial-dashboard/ subfolder

**Rationale**:
- Reduces cognitive load when navigating project
- Clear purpose for each folder and file location
- Easier onboarding for new developers
- Makes git diffs cleaner (fewer file movements)
- Maintains project hygiene for long-term maintainability

**Impact**:
- ✅ Root directory reduced from 25+ to 5 markdown files
- ✅ Clear file organization by purpose
- ✅ 8 documentation subfolders with logical structure
- ✅ Improved navigation and discoverability
- ✅ Removed 7 obsolete/duplicate files
- ✅ 1 new folder created (docs/features/)

**Trade-offs**:
- Existing internal links need updating (minimal impact)
- Some developers may need to relearn file locations
- One-time organizational effort upfront

**Related Decisions**:
- D-001: Documentation Structure - Foundation for this cleanup

---

## Future Decisions to Consider

- [ ] Authentication flow modernization (move away from hardcoded credentials)
- [ ] Mobile responsiveness implementation strategy
- [ ] Performance optimization approach for large datasets
- [ ] State management evolution (if needed beyond current React Query + hooks)
- [ ] Testing framework selection and implementation
- [ ] CI/CD pipeline setup

---

## Architecture Overview

Current architectural decisions shape the application as follows:

### State Management
- **Global State**: Managed in `App.tsx` (session, tab selection, filters)
- **Data Fetching**: React Query for server state
- **Real-time**: Supabase subscriptions for live updates
- **Undo**: Custom `useUndo` hook for task edits (30-second window)

### Data Synchronization
- **Bidirectional Sync**: Tasks Hub ↔ Business Projects via real-time subscriptions
- **Latency**: Sub-500ms for updates
- **Consistency**: Progress cascades hierarchically (Task → Phase → Project → Business)

### Database Design
- **Timestamps**: TIMESTAMPTZ for UTC storage, local timezone in frontend
- **Calendar Dates**: DATE type (no time component)
- **User Isolation**: user_id on all tables for multi-user support
- **Historical Data**: Balance snapshots for finance module

### Date/Time Handling
- **Frontend**: Local timezone throughout UI
- **Database**: UTC with TIMESTAMPTZ type
- **Helpers**: Centralized in `src/utils/dateHelpers.ts`
- **Policy**: Strict timezone policy documented in docs/TIMEZONE-POLICY.md

---

## Notes

- Decisions should be made collaboratively when possible
- Document the decision before or immediately after implementation
- Include links to related code/commits when applicable
- Review decisions quarterly to assess if they're still valid
