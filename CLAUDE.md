# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**tg-dashboard** is a comprehensive personal productivity and financial management application built with React, TypeScript, Vite, and Supabase. The application integrates multiple modules for task management, business project tracking, content library management, daily scheduling, and personal finance tracking.

## Tech Stack

- **Frontend**: React 19.1.1, TypeScript 5.9.3
- **Build Tool**: Vite 7.1.7
- **Backend/Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 3.4.1
- **AI Integration**: Anthropic Claude SDK (@anthropic-ai/sdk)
- **State Management**: React Query (@tanstack/react-query)
- **Drag & Drop**: @dnd-kit
- **Date Utilities**: date-fns

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 5000 by default)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Preview production build
npm preview
```

## Architecture Overview

### Main Application Areas (Tabs)

The application is organized into 5 main tabs managed in `App.tsx`:

1. **Daily** (`activeMainTab: 'daily'`)
   - Sub-tabs: Todo, Schedule, Deep Work
   - Daily task management and time blocking

2. **Tasks Hub** (`activeMainTab: 'tasks'`)
   - Central task management interface with filtering
   - Bidirectional sync with Business Projects
   - Enhanced task cards with inline editing
   - Undo functionality (30-second window)

3. **Business Projects** (`activeMainTab: 'business'`)
   - Business → Project → Phase → Task hierarchy
   - Progress tracking at each level
   - Real-time sync with Tasks Hub

4. **Content Library** (`activeMainTab: 'content'`)
   - URL-based content management
   - AI-powered analysis (title, summary, tags, value rating)
   - Integration with Supabase Edge Functions

5. **Finance** (`activeMainTab: 'finance'`)
   - Personal finance tracking dashboard
   - 4-column layout: Cash, Investments, Credit Cards, Loans/Taxes
   - Balance snapshot system by date
   - Real-time calculations and totals

### Core Directory Structure

```
src/
├── App.tsx                    # Main app component, state management, routing
├── main.tsx                   # Entry point, Supabase client setup
├── components/
│   ├── business/              # Business project management
│   │   ├── BusinessDashboard.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── PhaseCard.tsx
│   │   └── TaskForm.tsx
│   ├── content/               # Content library features
│   │   ├── ContentCard.tsx
│   │   ├── QuickAddModal.tsx
│   │   ├── EditModal.tsx
│   │   ├── DetailsModal.tsx
│   │   └── ValueRatingInput.tsx
│   ├── daily/                 # Daily planning & scheduling
│   │   ├── TodoList.tsx
│   │   └── Schedule.tsx
│   ├── finance/               # Finance dashboard
│   │   ├── FinanceDashboard.tsx
│   │   └── FinanceOverview.tsx
│   ├── shared/                # Reusable components
│   │   ├── ProgressIndicator.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── ProgressSlider.tsx
│   │   └── SyncStatusIndicator.tsx
│   ├── tasks/                 # Task management
│   │   ├── TasksHub.tsx
│   │   ├── TaskCard.tsx
│   │   ├── EnhancedTaskCard.tsx
│   │   ├── TaskFilters.tsx
│   │   ├── DateTimePicker.tsx
│   │   ├── DeepWorkTimer.tsx
│   │   └── TimeTrackingModal.tsx
│   ├── Auth.tsx
│   ├── Header.tsx
│   └── Sidebar.tsx
├── hooks/
│   ├── useBusinesses.ts       # Business CRUD operations
│   ├── useBusinessProgress.ts # Business-level progress calculations
│   ├── useFinance.ts          # Finance data & operations
│   ├── usePhaseProgress.ts    # Phase-level progress
│   ├── useProjectProgress.ts  # Project-level progress
│   ├── useProjects.ts         # Project CRUD operations
│   ├── useRealtimeSync.ts     # Supabase real-time subscriptions
│   ├── useTasks.ts            # Task CRUD operations
│   └── useUndo.ts             # Undo functionality for task edits
├── types/
│   ├── business.ts            # Business entity types
│   ├── content.ts             # Content library types
│   ├── finance.ts             # Finance types
│   ├── life-area.ts           # Life area enums
│   ├── project.ts             # Project & Phase types
│   └── task.ts                # Task types
├── lib/
│   └── supabase.ts            # Supabase client configuration
├── services/                  # API service layer
└── utils/                     # Utility functions
```

### Database Schema (Supabase)

Key tables managed via migrations in `supabase/migrations/`:

**Finance Tables:**
- `finance_accounts` - Account definitions (cash, investments, credit cards, loans, taxes)
- `balance_snapshots` - Historical balance data by date

**Business/Task Tables:**
- `businesses` - Business entities
- `projects` - Projects within businesses
- `phases` - Phases within projects
- `tasks` - Tasks linked to phases (or standalone)
- `deep_work_sessions` - Time tracking data

**Content Library:**
- `content_items` - URL-based content with AI analysis

### State Management Patterns

**Global State** (in `App.tsx`):
- Session/auth state
- Active tab selection (`activeMainTab`, `activeSubTab`)
- Task list and scheduling state
- Deep work timer state
- Selected filters (area, date, status, etc.)

**Custom Hooks** (in `src/hooks/`):
- Data fetching with React Query
- Real-time subscriptions with Supabase
- CRUD operations
- Progress calculations

**Real-time Sync**:
- `useRealtimeSync` hook manages Supabase real-time subscriptions
- Bidirectional sync between Tasks Hub and Business Projects
- Sub-500ms latency for updates

## Key Features & Implementation Notes

### Tasks Hub & Business Sync

The Tasks Hub and Business Projects modules maintain bidirectional sync:
- Tasks created in Business Projects appear immediately in Tasks Hub
- Tasks edited in Tasks Hub reflect in Business Projects
- Progress cascades: Task → Phase → Project → Business
- Uses Supabase real-time subscriptions for live updates

### Finance Dashboard

- **Balance Snapshot System**: Balances are stored as snapshots by date, allowing historical tracking
- **4-Column Layout**: Organized by account type with real-time calculation
- **Number Formatting**: Inputs use text type with comma formatting (1,234.56)
- **Calculations**: All totals computed client-side from current state
- See `FINANCE_SETUP_INSTRUCTIONS.md` for detailed documentation

### Content Library AI Analysis

- Supabase Edge Function: `analyze-content`
- Uses Anthropic Claude API to analyze URLs
- Auto-fills: title, summary, creator, time estimate, tags, value rating
- Cost: ~$0.004 per URL analysis

### Undo Functionality

- 30-second window to undo task edits
- Implemented via `useUndo` hook
- Stores previous state before mutations

## Environment Configuration

Required environment variables in `.env`:

```
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_PASSWORD=your_db_password
```

**Supabase Secrets** (for Edge Functions):
```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
```

## Date/Time & Timezone Handling

**CRITICAL:** The application uses **LOCAL TIMEZONE** throughout the frontend and **UTC** in the database.

### Quick Rules

1. **Database**: Always use `TIMESTAMPTZ` for timestamps, `DATE` for calendar dates
2. **Frontend**: Always use helpers from `src/utils/dateHelpers.ts`
3. **Never**: Use `new Date().toISOString().split('T')[0]` or direct `new Date('YYYY-MM-DD')`

### Required Reading

- **[TIMEZONE-POLICY.md](docs/TIMEZONE-POLICY.md)** - Complete timezone standards and guidelines
- **[TIMEZONE-AUDIT-REPORT.md](docs/TIMEZONE-AUDIT-REPORT.md)** - Full audit of all date/time handling

### Common Patterns

```typescript
import { formatDateString, getTodayNoon, parseLocalDate } from '@/utils/dateHelpers';

// ✅ Get today's date as YYYY-MM-DD
const today = formatDateString(getTodayNoon());

// ✅ Parse user-entered date
const dateObj = parseLocalDate('2025-10-15');

// ✅ Create timestamp for logging
const timestamp = new Date().toISOString();

// ✅ Display timestamp
{format(new Date(timestamp), 'MMM d, yyyy h:mm a')}
```

**See [TIMEZONE-POLICY.md](docs/TIMEZONE-POLICY.md) for complete guidelines.**

---

## Development Workflow

### Before Adding New Features

1. Review relevant documentation files:
   - **`docs/TIMEZONE-POLICY.md`** - **READ FIRST if working with dates/times**
   - `FINANCE_SETUP_INSTRUCTIONS.md` - Finance module state & plans
   - `START-HERE.md` - Recent work summary
   - `IMPLEMENTATION_SUMMARY.md` - Implementation details

2. Check existing types in `src/types/`

3. Review existing hooks for reusable patterns

4. Consider impact on real-time sync if modifying tasks/business data

5. **If adding date/time features**, follow [TIMEZONE-POLICY.md](docs/TIMEZONE-POLICY.md) exactly

### Database Migrations

Migrations are in `supabase/migrations/` with timestamp-based naming:
```
20251009220000_create_finance_tables.sql
20251009220001_add_credit_limit.sql
20251009220002_seed_finance_accounts.sql
```

Deploy migrations:
```bash
supabase db push
```

### Supabase Edge Functions

Located in `supabase/functions/`:

Deploy a function:
```bash
supabase functions deploy function-name
```

View logs:
```bash
supabase functions logs function-name --follow
```

## TypeScript Configuration

Project uses TypeScript 5.9.3 with project references:
- `tsconfig.json` - Root config with references
- `tsconfig.app.json` - App-specific config
- `tsconfig.node.json` - Node/build tool config

## Testing & Debugging

### Common Dev Server Issues

- **Port in use**: Vite will auto-increment from 5000 → 5001 → 5002
- **Database connection**: Verify Supabase credentials in `.env`
- **Real-time not syncing**: Check Supabase dashboard for active subscriptions

### SQL Files for Testing

Example SQL files for seeding test data:
- `seed-sample-data.sql` - Sample businesses and tasks

Run via Supabase SQL Editor or:
```bash
supabase db execute --file path/to/file.sql
```

## Important Implementation Details

### Task Types & Areas

**Areas** (Life domains):
- 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health'

**Effort Levels**:
- '$$$ Printer $$$' | '$ Makes Money $' | '-$ Save Dat $-' | ':( No Money ):' | '8) Vibing (8'

**Priority**:
- 'Low' | 'Medium' | 'High'

**Recurring Types**:
- 'none' | 'daily' | 'daily_weekdays' | 'weekly' | 'monthly' | 'custom'

### Progress Calculation

Progress is calculated hierarchically:
1. **Task level**: `hours_worked / hours_projected * 100`
2. **Phase level**: Average of all tasks in phase
3. **Project level**: Average of all phases in project
4. **Business level**: Average of all projects in business

Implemented in dedicated hooks:
- `usePhaseProgress.ts`
- `useProjectProgress.ts`
- `useBusinessProgress.ts`

## Authentication

Currently uses hardcoded credentials in `App.tsx` for development:
```typescript
const [email, setEmail] = useState('tgrassmick@gmail.com')
const [password, setPassword] = useState('Grassmick1')
```

**Note**: This should be updated for production deployment.

## Recent Development Sessions

Check these files for context on recent work:
- `START-HERE.md` - Quick start and recent completion summary
- `MORNING-SUMMARY.md` - Detailed overnight work summary
- `EPIC_1_AND_2_COMPLETE.md` - Epic completion details
- `FILES-CREATED-OVERNIGHT.md` - File creation log

## Known Issues & Future Work

See `FINANCE_SETUP_INSTRUCTIONS.md` for planned finance features:
- Historical data & trends
- Budget tracking
- Income tracking
- Goals & projections
- Transaction management
- Reports & analytics
- Mobile responsiveness

## Quick Reference

**Default Development Server**: http://localhost:5000

**Main Entry Point**: `src/main.tsx` → `src/App.tsx`

**Supabase Client**: `src/lib/supabase.ts`

**Database Migrations**: `supabase/migrations/`

**Edge Functions**: `supabase/functions/`
