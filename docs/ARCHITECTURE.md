# Architecture Overview

## Main Application Areas (Tabs)

The application is organized into 5 main tabs managed in `App.tsx`:

### 1. Daily (`activeMainTab: 'daily'`)
- **Sub-tabs**: Todo, Schedule, Deep Work
- **Purpose**: Daily task management and time blocking
- **Features**: Daily planning, time scheduling, deep work timer

### 2. Tasks Hub (`activeMainTab: 'tasks'`)
- **Purpose**: Central task management interface with filtering
- **Features**:
  - Bidirectional sync with Business Projects
  - Enhanced task cards with inline editing
  - Undo functionality (30-second window)
  - Advanced filtering and search
- **Real-time**: Updates appear instantly across the app

### 3. Business Projects (`activeMainTab: 'business'`)
- **Hierarchy**: Business → Project → Phase → Task
- **Features**:
  - Progress tracking at each level
  - Real-time sync with Tasks Hub
  - Hierarchical task organization
- **Real-time**: Sub-500ms latency for updates

### 4. Content Library (`activeMainTab: 'content'`)
- **Purpose**: URL-based content management
- **Features**:
  - AI-powered analysis (title, summary, tags, value rating)
  - Integration with Supabase Edge Functions
  - Automatic content enrichment
- **AI Provider**: Anthropic Claude API via Edge Function

### 5. Finance (`activeMainTab: 'finance'`)
- **Purpose**: Personal finance tracking dashboard
- **Layout**: 4-column organization (Cash, Investments, Credit Cards, Loans/Taxes)
- **Features**:
  - Balance snapshot system by date
  - Real-time calculations and totals
  - Historical balance tracking
- **Calculations**: All totals computed client-side from current state

## Core Directory Structure

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

## State Management Patterns

### Global State (in `App.tsx`)
- Session/auth state
- Active tab selection (`activeMainTab`, `activeSubTab`)
- Task list and scheduling state
- Deep work timer state
- Selected filters (area, date, status, etc.)

### Custom Hooks (in `src/hooks/`)
- Data fetching with React Query
- Real-time subscriptions with Supabase
- CRUD operations
- Progress calculations

### Real-time Sync
- `useRealtimeSync` hook manages Supabase real-time subscriptions
- Bidirectional sync between Tasks Hub and Business Projects
- Sub-500ms latency for updates

## Key Architectural Patterns

### Tasks Hub & Business Sync

The Tasks Hub and Business Projects modules maintain bidirectional sync:
- Tasks created in Business Projects appear immediately in Tasks Hub
- Tasks edited in Tasks Hub reflect in Business Projects
- Progress cascades: Task → Phase → Project → Business
- Uses Supabase real-time subscriptions for live updates

### Progress Calculation (Hierarchical)

Progress is calculated at multiple levels:
1. **Task level**: `hours_worked / hours_projected * 100`
2. **Phase level**: Average of all tasks in phase
3. **Project level**: Average of all phases in project
4. **Business level**: Average of all projects in business

Implemented in dedicated hooks:
- `usePhaseProgress.ts`
- `useProjectProgress.ts`
- `useBusinessProgress.ts`

### Finance Dashboard

- **Balance Snapshot System**: Balances are stored as snapshots by date, allowing historical tracking
- **4-Column Layout**: Organized by account type with real-time calculation
- **Number Formatting**: Inputs use text type with comma formatting (1,234.56)
- **Calculations**: All totals computed client-side from current state

### Content Library AI Analysis

- **Supabase Edge Function**: `analyze-content`
- **AI Provider**: Anthropic Claude API
- **Auto-fills**: title, summary, creator, time estimate, tags, value rating
- **Cost**: ~$0.004 per URL analysis

### Undo Functionality

- 30-second window to undo task edits
- Implemented via `useUndo` hook
- Stores previous state before mutations
