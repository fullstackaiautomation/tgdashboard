# Automations Tracking System

## Overview

The Automations Tracking System provides a comprehensive way to track all automation projects across your business areas in a centralized, Kanban-style board interface. It's designed to help you monitor the progress of automation implementations from concept to completion.

## Features

### Kanban Board Layout
- **Completion Levels**: Automations are organized into 6 columns:
  - Future Idea
  - Planning
  - In Progress
  - Finish Line
  - Review
  - Completed

### Filtering System
- **Primary Filter**: Area-based tabs (Full Stack, Huge Capital, S4, 808, Personal, Health, Golf, All)
- **Secondary Filters**:
  - Purpose (Sales, Data, Fulfillment, Marketing, Admin)
  - Priority (Low, Medium, High)

### Automation Details
Each automation tracks the following:

**Core Information**:
- **Name**: Unique identifier for the automation
- **Purpose**: What business function does it serve
- **Area**: Which business area it belongs to
- **Label**: Type of automation implementation (MCP, Skills, Agents, Workflow)
- **Platform**: Where it runs (n8n, Zapier, Claude Web, Claude Code)
- **Trigger Type**: How it initiates (Auto or Manual)

**Tracking**:
- **Integrations**: Multi-select list of connected systems
  - Asana, Excel, Google Sheets, Gmail, Google Drive
  - Claude, Slack, Shopify, GHL, CBOS, Klaviyo
  - Dashboard (+ ability to add custom integrations)
- **Completion Level**: Current status in pipeline
- **Priority**: Relative importance (Low/Medium/High)
- **Dates**:
  - Creation Date (auto-set)
  - Go Live Date (when automation launches)
  - Last Checked Date (last verification/maintenance)

## User Interface

### Main Board
Located under **Projects > Automations** in the sidebar, the board displays:
- 6 Kanban columns by completion level
- Color-coded columns for visual distinction
- Card count per column
- Drag-and-drop support to move automations between columns

### Automation Cards
Each card shows:
- Automation name (header)
- Priority badge (colored)
- Purpose tag
- Label tag
- Platform badge
- Trigger type indicator
- Integration badges (multi-colored chips)
- Key dates (Go Live, Last Checked)
- Edit and Delete action buttons

### Modals
- **Add/Edit Modal**: Form to create or update automations
  - All fields with proper validation
  - Integration multi-select with "Add" button
  - Optional project association
  - Date pickers for go-live and check dates

### Filters
- Area tabs (primary navigation)
- Purpose dropdown
- Priority dropdown
- "Add Automation" button

## Implementation Details

### Database
- Table: `automations` in Supabase
- RLS Policies: User-scoped data access
- Indexes: Optimized for area filtering and completion_level grouping

### Components
- **AutomationsBoard**: Main Kanban component with drag-drop support
- **AutomationCard**: Individual automation card display
- **AutomationModal**: Add/Edit form
- **AutomationFilters**: Filter and search controls
- **DraggableAutomationCard**: Drag-drop wrapper

### Hooks
- `useAutomations()` - Fetch all or area-filtered automations
- `useAutomationsByProject()` - Fetch by project
- `useAutomation()` - Fetch single automation
- `useCreateAutomation()` - Create new
- `useUpdateAutomation()` - Update existing
- `useDeleteAutomation()` - Delete automation
- `useUpdateAutomationLevel()` - Change completion level (used by drag-drop)

### State Management
- React Query for server state
- Local component state for filters and modals
- @dnd-kit for drag-and-drop functionality

## Navigation
Automations are accessible from:
1. Sidebar: Projects > Automations
2. App route: `/automations` (activeMainTab: 'automations')

## Usage Workflow

1. **Create Automation**: Click "+ Add Automation" button
2. **Fill Details**: Complete the form with automation information
3. **Organize**: Use filters to view automations by area
4. **Track Progress**: Drag cards between completion level columns
5. **Update Status**: Edit automation to change completion level
6. **Monitor**: Review dates, integrations, and priority

## Future Enhancements
- Custom integration creation and management
- Automation performance metrics
- Integration health monitoring
- Bulk operations (edit multiple, batch status update)
- Automation templates for common use cases
- Notifications for upcoming go-live dates
- Integration with external automation platforms (direct API links)

## Technical Notes
- Uses React 19.1.1 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- @dnd-kit for accessible drag-drop
- React Query for data management
- Supabase for backend

## Files
- `/src/types/automation.ts` - Type definitions
- `/src/hooks/useAutomations.ts` - Custom hooks
- `/src/components/automations/` - UI components
- `/supabase/migrations/20251028173057_create_automations_table.sql` - Database schema
