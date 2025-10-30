# 3. Project Structure

### Recommended Directory Structure

```
tg-dashboard/
├── public/                          # Static assets
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                     # Application entry point
│   ├── App.tsx                      # Root component with auth routing
│   │
│   ├── components/                  # React components
│   │   ├── auth/                    # Authentication components
│   │   │   ├── Auth.tsx            # Login/signup form
│   │   │   └── ProtectedRoute.tsx  # Route guard component
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx          # Top navigation bar
│   │   │   ├── Sidebar.tsx         # Side navigation menu
│   │   │   └── Dashboard.tsx       # Main dashboard layout
│   │   │
│   │   ├── daily/                   # Daily section components
│   │   │   ├── TodoList.tsx        # Daily todo list (existing)
│   │   │   ├── Schedule.tsx        # Daily schedule view
│   │   │   ├── DeepWorkTimer.tsx   # Deep work timer panel
│   │   │   ├── Goals.tsx           # Daily goals tracking
│   │   │   └── Review.tsx          # Daily review view
│   │   │
│   │   ├── tasks/                   # Tasks hub components
│   │   │   ├── TasksHub.tsx        # Central tasks page
│   │   │   ├── TaskCard.tsx        # Individual task card
│   │   │   ├── TaskFilters.tsx     # Business/status filters
│   │   │   └── TaskForm.tsx        # Task create/edit form
│   │   │
│   │   ├── business/                # Business section components
│   │   │   ├── BusinessDashboard.tsx    # Business overview
│   │   │   ├── ProjectCard.tsx          # Project display card
│   │   │   ├── PhaseCard.tsx            # Phase display card
│   │   │   ├── ProgressBar.tsx          # Progress visualization
│   │   │   └── TimeInvestmentCard.tsx   # Time tracking card
│   │   │
│   │   ├── content/                 # Content section components
│   │   │   ├── ContentLibrary.tsx  # Content library (existing)
│   │   │   └── TeeUpWithTG.tsx     # Golf content section
│   │   │
│   │   ├── health/                  # Health section components
│   │   │   ├── HealthDashboard.tsx
│   │   │   ├── WorkoutTracker.tsx
│   │   │   └── MealPlanner.tsx
│   │   │
│   │   ├── finance/                 # Finance section components
│   │   │   ├── FinanceDashboard.tsx     # (existing)
│   │   │   ├── NetworthCard.tsx
│   │   │   ├── TransactionsList.tsx
│   │   │   └── BudgetTracker.tsx
│   │   │
│   │   ├── life/                    # Life section components
│   │   │   ├── LifeDashboard.tsx
│   │   │   ├── Journal.tsx
│   │   │   └── BrainDumps.tsx
│   │   │
│   │   ├── golf/                    # Golf section components
│   │   │   ├── GolfDashboard.tsx
│   │   │   ├── Scorecard.tsx
│   │   │   └── StrokesGained.tsx
│   │   │
│   │   ├── review/                  # Review dashboard components
│   │   │   ├── ReviewDashboard.tsx
│   │   │   ├── AreaSummaryCard.tsx
│   │   │   └── AlertsPanel.tsx
│   │   │
│   │   ├── shared/                  # Shared/reusable components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── ProgressRing.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── Tabs.tsx
│   │   │
│   │   └── ui/                      # UI primitives (if using Shadcn/UI)
│   │       ├── dialog.tsx
│   │       ├── dropdown-menu.tsx
│   │       ├── select.tsx
│   │       └── tooltip.tsx
│   │
│   ├── hooks/                       # Custom React hooks
│   │   ├── useAuth.ts              # Authentication hook
│   │   ├── useTasks.ts             # Tasks CRUD operations
│   │   ├── useProjects.ts          # Projects CRUD operations
│   │   ├── useRealtimeSync.ts      # Supabase real-time subscription
│   │   ├── useDeepWork.ts          # Deep work timer logic
│   │   └── useProgress.ts          # Progress calculation hook
│   │
│   ├── lib/                         # Library configurations
│   │   ├── supabase.ts             # Supabase client (existing)
│   │   ├── queryClient.ts          # React Query client config
│   │   └── utils.ts                # Utility functions
│   │
│   ├── types/                       # TypeScript type definitions
│   │   ├── task.ts                 # Task types (rename from .tsx)
│   │   ├── content.ts              # Content types (existing)
│   │   ├── project.ts              # Project/Phase types
│   │   ├── business.ts             # Business types
│   │   ├── health.ts               # Health types
│   │   ├── finance.ts              # Finance types
│   │   ├── user.ts                 # User/Auth types
│   │   └── database.ts             # Supabase database types (auto-generated)
│   │
│   ├── styles/                      # Global styles
│   │   ├── globals.css             # Global CSS + Tailwind imports
│   │   └── theme.css               # CSS custom properties (theme variables)
│   │
│   └── utils/                       # Utility functions
│       ├── date.ts                 # Date formatting utilities
│       ├── progress.ts             # Progress calculation logic
│       ├── sync.ts                 # Sync conflict resolution
│       └── validation.ts           # Form validation helpers
│
├── .env.example                     # Environment variables template
├── .env.local                       # Local environment variables (gitignored)
├── .gitignore                       # Git ignore rules
├── index.html                       # HTML entry point
├── package.json                     # Dependencies
├── postcss.config.js               # PostCSS configuration
├── tailwind.config.js              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                  # Vite configuration
```

### Architectural Decisions

**Feature-Based Organization:** Components organized by dashboard section (daily/, business/, health/, etc.) aligns with the 7 main areas from PRD.

**Shared Components:** Reusable UI components in `components/shared/` for elements used across multiple sections.

**Hooks Directory:** Custom hooks centralized in `hooks/` for reusability and easier testing of business logic.

**Types Organization:** All TypeScript types in `types/` as `.ts` files (not `.tsx`). Use `database.ts` auto-generated from Supabase schema.

---
