<!-- Powered by BMAD™ Core -->

# Epic 6: Dashboard Cleanup - Brownfield Enhancement

**Epic Goal:** Systematically refine and clean up all dashboard pages to improve user experience, fix UI inconsistencies, enhance visual polish, and improve usability across the entire application. This epic focuses on incremental improvements that make the dashboard more intuitive, visually consistent, and pleasant to use without requiring architectural changes.

## Epic Description

### Existing System Context

- **Current functionality**: The tg-dashboard application is a fully functional personal productivity and financial management system with 5 main modules (Daily Planning, Tasks Hub, Business Projects, Content Library, and Finance)
- **Technology stack**: React 19.1.1, TypeScript 5.9.3, Vite 7.1.7, Supabase (PostgreSQL), Tailwind CSS 3.4.1
- **Integration points**: All pages share state through App.tsx and use Supabase for data persistence with real-time sync

### Enhancement Details

**What's being added/changed:**
This epic serves as a container for page-specific cleanup and refinement stories. Each dashboard page will receive targeted improvements to address:
- Visual inconsistencies and styling issues
- UX friction points and usability problems
- Missing features that would improve workflow efficiency
- Component polish and interaction improvements
- Accessibility and responsive design gaps

**How it integrates:**
All cleanup work follows existing architectural patterns and integrates with the current component structure. Changes are isolated to specific pages and components, maintaining backward compatibility with the rest of the system.

**Success criteria:**
- Each dashboard page has a clean, consistent, and polished user interface
- Common UI patterns are used consistently across all pages
- User workflows feel smooth and intuitive
- Visual hierarchy and typography are clear and purposeful
- No obvious bugs or UI quirks remain

## Stories

Stories will be added incrementally as page-specific cleanup requirements are identified. Each story will follow this naming pattern:

**Story 6.X: [Page Name] Cleanup & Refinements**

### Planned Stories (to be created as needed):

1. **Story 6.1: Daily Planning Page Cleanup** - (To be created)
   - Todo List refinements
   - Schedule view improvements
   - Deep Work timer enhancements

2. **Story 6.2: Tasks Hub Page Cleanup** - (To be created)
   - Filter UI improvements
   - Task card polish
   - Search and sorting refinements

3. **Story 6.3: Business Projects Page Cleanup** - (To be created)
   - Project hierarchy visualization
   - Progress indicators
   - Navigation improvements

4. **Story 6.4: Content Library Page Cleanup** - (To be created)
   - Card layout refinements
   - Filter and search improvements
   - Quick add modal polish

5. **Story 6.5: Finance Page Cleanup** - (To be created)
   - Account card improvements
   - Balance input UX
   - Summary calculations display

6. **Story 6.6: Review Dashboard Page Cleanup** - (To be created)
   - Summary card polish
   - Filter bar improvements
   - Area-specific view refinements

7. **Story 6.7: Global Navigation & Header Cleanup** - (To be created)
   - Tab navigation improvements
   - Header consistency
   - Mobile responsive refinements

### How Stories Will Be Created

As the user provides specific cleanup requirements for each page, new detailed stories will be created in the `docs/stories/cleanup/` directory following the pattern:
- `6.1-daily-planning-cleanup.md`
- `6.2-tasks-hub-cleanup.md`
- etc.

Each story will include:
- Clear description of the cleanup items
- Detailed acceptance criteria
- Before/after specifications where applicable
- Component-level implementation guidance

## Compatibility Requirements

- [x] Existing APIs remain unchanged (cleanup is UI-focused)
- [x] Database schema changes are not required for UI cleanup
- [x] UI changes follow existing Tailwind CSS patterns and component architecture
- [x] Performance impact is minimal or positive (optimization-focused)
- [x] Real-time sync and data flow remain unchanged
- [x] All existing functionality continues to work as expected

## Risk Mitigation

**Primary Risk:** Introducing regressions or breaking existing functionality while making cleanup changes

**Mitigation:**
- Make small, isolated changes to specific components
- Test each change thoroughly in the running application
- Focus on one page at a time to contain scope
- Use existing component patterns and avoid architectural changes
- Maintain version control with clear commit messages for easy rollback

**Rollback Plan:**
- Each cleanup story will be committed separately
- Git history allows reverting individual changes without affecting other work
- Changes are additive/refinement-focused, not replacement-focused
- Test in development environment before deploying

## Risk Assessment

- **Risk to existing system:** LOW - Changes are primarily CSS, UI tweaks, and component refinements
- **Architectural impact:** NONE - No changes to data models, API contracts, or core architecture
- **Integration complexity:** LOW - Changes are isolated to specific pages/components
- **Testing complexity:** LOW - Manual testing of UI changes in development environment

## Definition of Done

- [ ] All identified cleanup items for each page are completed with acceptance criteria met
- [ ] Existing functionality verified through manual testing - no regressions
- [ ] Visual consistency achieved across all dashboard pages
- [ ] UI follows Tailwind CSS conventions and existing component patterns
- [ ] Code is clean, well-commented, and follows TypeScript best practices
- [ ] Git commits are atomic and well-documented for each cleanup item
- [ ] No console errors or warnings introduced by cleanup changes
- [ ] Responsive design works correctly on desktop and tablet viewports
- [ ] All pages load quickly and smoothly without performance degradation

## Progress Tracking

### Completed Stories
- None yet (epic just created)

### In Progress Stories
- None yet

### Upcoming Stories
- Stories will be added as user provides page-specific cleanup requirements

---

## Story Manager Handoff

**For future story development:**

When creating detailed user stories for this brownfield cleanup epic, please consider:

- This is enhancement work on an existing React/TypeScript/Tailwind CSS dashboard application
- Integration points: All pages use global state in App.tsx, Supabase for persistence, and shared component library
- Existing patterns to follow:
  - Tailwind CSS for styling (no custom CSS)
  - TypeScript with strict typing
  - Functional React components with hooks
  - Existing component patterns in src/components/
- Critical compatibility requirements:
  - Maintain existing data flow and real-time sync
  - Don't break existing features or workflows
  - Follow current architectural patterns
  - Use existing custom hooks and services
- Each story must include verification that existing functionality remains intact

The epic should maintain system integrity while delivering incremental UI polish and usability improvements across all dashboard pages.

## References

- **BMAD Task Workflow:** `.bmad-core/tasks/brownfield-create-epic.md`
- **Architecture Documentation:** `docs/ARCHITECTURE.md`
- **Database Schema:** `docs/DATABASE.md`
- **Implementation Guide:** `docs/IMPLEMENTATION-GUIDE.md`
- **Existing Epics:** `docs/prd/epic-1-*.md` through `epic-5-*.md`
