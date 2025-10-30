# Epic 6: Dashboard Cleanup Stories

This directory contains detailed user stories for page-specific cleanup and refinement work under **Epic 6: Dashboard Cleanup - Brownfield Enhancement**.

## Overview

Epic 6 is a container epic for incremental UI improvements across all dashboard pages. Stories are created on-demand as the user identifies specific cleanup requirements for each page.

**Parent Epic**: [docs/prd/epic-6-dashboard-cleanup.md](../../prd/epic-6-dashboard-cleanup.md)

## Story Naming Convention

Stories follow this pattern:
- **Story 6.1**: Daily Planning Page Cleanup
- **Story 6.2**: Tasks Hub Page Cleanup
- **Story 6.3**: Business Projects Page Cleanup
- **Story 6.4**: Content Library Page Cleanup
- **Story 6.5**: Finance Page Cleanup
- **Story 6.6**: Review Dashboard Page Cleanup
- **Story 6.7**: Global Navigation & Header Cleanup

File names: `6.1-daily-planning-cleanup.md`, `6.2-tasks-hub-cleanup.md`, etc.

## Target Pages

Each story targets one of the following dashboard areas:

### 1. Daily Planning (`activeMainTab: 'daily'`)
- Sub-tabs: Todo, Schedule, Deep Work
- Focus: Daily task management and time blocking

### 2. Tasks Hub (`activeMainTab: 'tasks'`)
- Focus: Central task management with filtering
- Features: Bidirectional sync, inline editing, advanced filters

### 3. Business Projects (`activeMainTab: 'business'`)
- Hierarchy: Business → Project → Phase → Task
- Focus: Progress tracking and hierarchical organization

### 4. Content Library (`activeMainTab: 'content'`)
- Focus: URL-based content management with AI analysis
- Features: Quick add, value rating, dashboard area filtering

### 5. Finance (`activeMainTab: 'finance'`)
- Layout: 4-column organization (Cash, Investments, Credit Cards, Loans/Taxes)
- Focus: Balance snapshot system and real-time calculations

### 6. Review Dashboard (`activeMainTab: 'review'`)
- Focus: Unified aggregated views across all areas
- Features: Summary cards, area filtering, read-only snapshots

### 7. Global Navigation & Header
- Focus: Tab navigation, header consistency, mobile responsiveness
- Components: Header.tsx, Sidebar.tsx, main navigation elements

## Story Structure

Each cleanup story should include:

1. **Story Title & Description**
   - Clear identification of the page being cleaned up
   - High-level summary of cleanup goals

2. **Cleanup Items**
   - Detailed list of specific improvements
   - Categorized by type (UI polish, bug fixes, UX improvements, feature additions)

3. **Acceptance Criteria**
   - Specific, testable criteria for each cleanup item
   - Before/after specifications where applicable
   - Visual consistency requirements

4. **Component-Level Guidance**
   - Which components need modification
   - File paths for components and hooks
   - Integration points to be aware of

5. **Testing Requirements**
   - Manual testing checklist
   - Regression testing to ensure no existing functionality breaks

## Workflow

1. **User provides page-specific cleanup requirements** → Documented in conversation
2. **Create detailed story** → Write story in this directory (e.g., `6.1-daily-planning-cleanup.md`)
3. **Implement cleanup items** → Make changes following existing patterns
4. **Test thoroughly** → Verify no regressions
5. **Update progress tracking** → Mark story as complete in epic document

## Guidelines

- **One page per story** - Keep cleanup focused and manageable
- **Incremental approach** - Small, safe changes that can be easily tested
- **Follow existing patterns** - Use established Tailwind CSS classes and component structures
- **No architectural changes** - Cleanup should not require data model or API changes
- **Test before moving on** - Verify each change works before proceeding to next item

## Current Stories

### Completed Stories
- None yet (epic just created)

### In Progress Stories
- None yet

### Planned Stories
Stories will be created as user provides cleanup requirements for specific pages.

## Related Documentation

- **Epic Document**: [docs/prd/epic-6-dashboard-cleanup.md](../../prd/epic-6-dashboard-cleanup.md)
- **Architecture Guide**: [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)
- **Implementation Guide**: [docs/IMPLEMENTATION-GUIDE.md](../../IMPLEMENTATION-GUIDE.md)
- **BMAD Workflow**: `.bmad-core/tasks/brownfield-create-epic.md`
