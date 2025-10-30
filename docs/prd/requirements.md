# Requirements

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
