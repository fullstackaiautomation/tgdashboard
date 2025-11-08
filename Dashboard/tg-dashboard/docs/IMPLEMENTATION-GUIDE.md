# Implementation Guide

## Development Workflow

### Before Adding New Features

1. **Review relevant documentation**:
   - **`docs/TIMEZONE-POLICY.md`** - **READ FIRST if working with dates/times**
   - **`docs/ARCHITECTURE.md`** - Understand the current structure
   - `FINANCE_SETUP_INSTRUCTIONS.md` - Finance module state & plans
   - `START-HERE.md` - Recent work summary

2. **Check existing types** in `src/types/`

3. **Review existing hooks** for reusable patterns in `src/hooks/`

4. **Consider impact on real-time sync** if modifying tasks/business data

5. **If adding date/time features**, follow **[TIMEZONE-POLICY.md](TIMEZONE-POLICY.md)** exactly

## Task Types & Areas

### Task Areas (Life Domains)

```
- 'Full Stack'
- 'S4'
- '808'
- 'Personal'
- 'Huge Capital'
- 'Golf'
- 'Health'
```

### Effort Levels

```
- '$$$ Printer $$$'
- '$ Makes Money $'
- '-$ Save Dat $-'
- ':( No Money ):'
- '8) Vibing (8'
```

### Priority Levels

```
- 'Low'
- 'Medium'
- 'High'
```

### Recurring Types

```
- 'none'
- 'daily'
- 'daily_weekdays'
- 'weekly'
- 'monthly'
- 'custom'
```

## Progress Calculation

Progress is calculated hierarchically using dedicated hooks:

### Hierarchy
1. **Task level**: `hours_worked / hours_projected * 100`
2. **Phase level**: Average of all tasks in phase
3. **Project level**: Average of all phases in project
4. **Business level**: Average of all projects in business

### Implementation Hooks
- `usePhaseProgress.ts` - Calculates phase-level progress
- `useProjectProgress.ts` - Calculates project-level progress
- `useBusinessProgress.ts` - Calculates business-level progress

**Pattern Example**:
```typescript
const phaseProgress = usePhaseProgress(phaseId);
const projectProgress = useProjectProgress(projectId);
const businessProgress = useBusinessProgress(businessId);
```

## Date/Time & Timezone Handling

### ⚠️ CRITICAL

The application uses **LOCAL TIMEZONE** throughout the frontend and **UTC** in the database.

### Quick Rules

1. **Database**: Always use `TIMESTAMPTZ` for timestamps, `DATE` for calendar dates
2. **Frontend**: Always use helpers from `src/utils/dateHelpers.ts`
3. **Never**: Use `new Date().toISOString().split('T')[0]` or direct `new Date('YYYY-MM-DD')`

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

### Required Reading

- **[TIMEZONE-POLICY.md](TIMEZONE-POLICY.md)** - Complete timezone standards and guidelines
- **[TIMEZONE-AUDIT-REPORT.md](TIMEZONE-AUDIT-REPORT.md)** - Full audit of all date/time handling

## Working with Supabase

### Edge Functions

Located in `supabase/functions/`:

**Deploy a function**:
```bash
supabase functions deploy function-name
```

**View logs**:
```bash
supabase functions logs function-name --follow
```

**Available Functions**:
- `analyze-content` - Uses Anthropic Claude API to analyze URLs
  - Auto-fills: title, summary, creator, time estimate, tags, value rating
  - Requires `ANTHROPIC_API_KEY` in Supabase secrets

### Real-time Subscriptions

Supabase real-time subscriptions enable instant updates:

**Implementation**: `useRealtimeSync` hook in `src/hooks/useRealtimeSync.ts`

**Subscribed tables**:
- `tasks`
- `businesses`
- `projects`
- `phases`

**Latency**: Sub-500ms for updates across the app

### Setting Supabase Secrets

For Edge Functions that use external APIs:

```bash
supabase secrets set ANTHROPIC_API_KEY=your_anthropic_key
```

## Common Implementation Patterns

### CRUD with Custom Hooks

Each major entity has a dedicated hook:

```typescript
// In src/hooks/useTasks.ts
const { tasks, addTask, updateTask, deleteTask } = useTasks();

// Use in components
useEffect(() => {
  // Tasks automatically update on real-time changes
}, [tasks]);

await updateTask(taskId, { status: 'completed' });
```

### Accessing Global State

Global state managed in `App.tsx`:

```typescript
// In any component
const [activeMainTab, setActiveMainTab] = useState('tasks');
const [selectedFilters, setSelectedFilters] = useState({
  area: null,
  priority: 'High',
  status: 'in_progress'
});
```

### Progress Tracking

Always use the dedicated progress hooks:

```typescript
import { usePhaseProgress } from '@/hooks/usePhaseProgress';

function PhaseCard({ phaseId }) {
  const progress = usePhaseProgress(phaseId);
  return <ProgressBar percent={progress} />;
}
```

### Undo Functionality

30-second undo window for task edits:

```typescript
import { useUndo } from '@/hooks/useUndo';

const { state, undo } = useUndo(initialState);

// Update state
setState(newState);

// Can undo within 30 seconds
if (undoAvailable) {
  undo();
}
```

## Finance Dashboard Implementation

### Balance Snapshot System

Balances are stored as snapshots by date:

```typescript
// Store balance for a specific date
const snapshot = {
  account_id: accountId,
  date: '2025-10-26', // YYYY-MM-DD format
  balance: 1500.50
};

// Retrieve balance for a date range
const balances = await supabase
  .from('balance_snapshots')
  .select('*')
  .eq('account_id', accountId)
  .gte('date', startDate)
  .lte('date', endDate);
```

### 4-Column Layout

Organized by account type with real-time calculation:

1. **Cash** - Liquid assets
2. **Investments** - Long-term assets
3. **Credit Cards** - Liabilities
4. **Loans/Taxes** - Long-term liabilities

### Number Formatting

Inputs use text type with comma formatting:

```typescript
// Store: "1,234.56"
// Display: formatted with commas
// Calculate: parse to numeric
const value = parseFloat(display.replace(/,/g, ''));
```

### Calculations

All totals computed client-side from current state:

```typescript
const total = accounts.reduce((sum, account) => {
  return sum + (account.balance || 0);
}, 0);
```

See `FINANCE_SETUP_INSTRUCTIONS.md` for detailed documentation.

## Content Library AI Analysis

### Overview

URL-based content management with AI-powered enrichment:

- **Supabase Edge Function**: `analyze-content`
- **AI Provider**: Anthropic Claude API
- **Auto-fills**: title, summary, creator, time estimate, tags, value rating
- **Cost**: ~$0.004 per URL analysis

### Adding Content

```typescript
// URL is analyzed automatically
const { data } = await supabase
  .from('content_items')
  .insert({
    url: 'https://example.com/article',
    user_id: currentUser.id
  })
  .select();

// Response includes AI-generated fields:
// - title
// - summary
// - creator
// - time_estimate
// - tags (array)
// - value_rating (optional)
```

## Authentication

### Development

Currently uses hardcoded credentials in `App.tsx`:

```typescript
const [email, setEmail] = useState('tgrassmick@gmail.com')
const [password, setPassword] = useState('Grassmick1')
```

⚠️ **Note**: This should be updated for production deployment.

### Production Considerations

- Implement OAuth (Google, GitHub)
- Use environment variables for credentials
- Implement password reset flow
- Add email verification

## Code Organization Principles

1. **Separation of Concerns**: Components handle UI, hooks handle logic
2. **Type Safety**: Use TypeScript types for all data
3. **Reusability**: Extract common patterns to hooks and utility functions
4. **Real-time First**: Leverage Supabase subscriptions for data consistency
5. **Progress Hierarchies**: Always cascade progress from bottom-up
6. **Timezone Awareness**: Use date helpers, never hardcode timezone logic

## Recent Development Sessions

Check these files for context:
- `START-HERE.md` - Quick start and recent completion summary
- `MORNING-SUMMARY.md` - Detailed overnight work summary
- `EPIC_1_AND_2_COMPLETE.md` - Epic completion details
- `FILES-CREATED-OVERNIGHT.md` - File creation log
