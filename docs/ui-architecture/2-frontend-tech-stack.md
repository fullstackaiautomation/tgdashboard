# 2. Frontend Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| **Framework** | React | 19.1.1 | Core UI framework for component-based architecture | Latest React version with improved concurrent rendering, stable performance, and excellent TypeScript support. Industry-standard choice for complex dashboards. |
| **UI Library** | Tailwind CSS | 3.4.1 | Utility-first CSS framework for rapid styling | Enables fast development with utility classes, built-in dark mode support, optimal for the project's dark theme aesthetic. Small production bundle via purging. |
| **State Management** | TanStack Query (React Query) | 5.90.2 | Server state synchronization and caching | Perfect complement to Supabase real-time subscriptions. Handles caching, background refetching, optimistic updates. Eliminates need for Redux/Zustand for server-synchronized state. |
| **Routing** | React Router | 6.x (recommended) | Client-side navigation | Enables deep linking, browser history, shareable URLs for business dashboards. Optional but recommended for multi-section navigation. |
| **Build Tool** | Vite | 7.1.7 | Development server and production bundler | Lightning-fast HMR, optimized builds, native ESM, superior to deprecated Create React App. Critical for "vibe coding" rapid iteration. |
| **Styling** | Tailwind CSS + CSS Variables | 3.4.1 | Utility-first styling with theme variables | Tailwind for components, CSS custom properties for global theme (colors, spacing). Supports dark mode and color-coded business areas. |
| **Testing** | Manual Testing | - | Quality assurance via manual verification | No automated test suite per PRD requirements. Relying on systematic manual testing and security checklists. |
| **Component Library** | Custom + Lucide Icons | 0.544.0 | UI components and iconography | Building custom components from scratch. Lucide provides modern icon set. **Consider:** Shadcn/UI for pre-built accessible components (modals, dropdowns, date pickers). |
| **Form Handling** | Controlled Components | - | Task editing, settings forms | Using controlled components (value + onChange). **Recommendation:** React Hook Form for complex forms with validation. |
| **Animation** | CSS Transitions | - | Progress bars, card animations | Using Tailwind's transition utilities. **Consider:** Framer Motion for complex progress animations and page transitions. |
| **Dev Tools** | TypeScript + ESLint | 5.9.3 / 9.36.0 | Type safety and code quality | TypeScript prevents runtime errors, ESLint enforces code standards. Critical for AI-assisted development to catch mistakes early. |
| **Date Handling** | date-fns | 4.1.0 | Date formatting and manipulation | Lightweight alternative to Moment.js, tree-shakeable, excellent for task due dates and scheduling. |
| **Backend Client** | Supabase JS | 2.58.0 | Database, auth, real-time subscriptions | Single SDK handles PostgreSQL queries, authentication, and real-time WebSocket connections. Eliminates need for custom API layer. |

---
