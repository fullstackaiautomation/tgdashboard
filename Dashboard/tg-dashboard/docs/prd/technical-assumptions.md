# Technical Assumptions

### Repository Structure

**Monorepo** - Single private GitHub repository for the entire dashboard application

### Service Architecture

**Single-page application (SPA) with Supabase backend** - React frontend communicating with Supabase PostgreSQL database, authentication, and real-time subscriptions. Serverless architecture leveraging Supabase's managed backend services eliminates need for custom API layer.

**Rationale:** Supabase handles database, auth, and real-time sync out of the box, allowing focus on dashboard functionality rather than infrastructure. Real-time subscriptions enable bidirectional task synchronization between pages without custom WebSocket implementation.

### Testing Requirements

**Manual testing with convenience methods** - No formal automated test suite for MVP. Rely on systematic manual testing aided by development convenience methods (database seeders, state inspection tools, test data generators).

**Rationale:** Given solo development with Claude Code and time-sensitive opportunity window, automated test overhead doesn't justify ROI for personal-use dashboard. Security checklist and manual verification provide sufficient quality assurance.

### Additional Technical Assumptions and Requests

- **Tech Stack (current implementation):**
  - Frontend: React-based SPA
  - Backend: Supabase (PostgreSQL + Auth + Real-time)
  - Hosting: GitHub repository with GitHub Actions deployment
  - Domain: GoDaddy (https://tgdashboard.fullstackaiautomation.com)

- **Development Approach:** "Vibe coding" with Claude Code (AI-assisted rapid development) paired with systematic security guardrails via pre-deployment checklists

- **Security Architecture:**
  - All API keys/secrets in environment variables only (never client-side code)
  - Supabase Row Level Security (RLS) policies on all database tables
  - GitHub secret scanning enabled
  - Mandatory pre-deployment security checklist before production pushes
  - Client financial data encrypted at rest

- **Real-time Sync:** Supabase real-time subscriptions power bidirectional task synchronization between Tasks hub and Business/Daily/Health pages

- **State Management:** Client-side state management (React Context/hooks) for UI state; Supabase handles persistence and sync

- **Performance Targets:**
  - Page load <2s
  - Task sync latency <500ms
  - Database queries <100ms response time
  - Support 100+ concurrent active tasks

- **Deployment:** GitHub Actions automated deployment pipeline to production domain
