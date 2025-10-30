# Epic 3: Security & Data Integrity Foundation

**Epic Goal:** Establish production-ready security protocols to protect sensitive client financial data and ensure the dashboard can be safely deployed with confidential information from consulting clients (bank statements, MCA applications, financial metrics). Implement systematic pre-deployment security checklist, verify Supabase Row Level Security policies, eliminate API key exposure risks, and validate data integrity across the synchronization system. This epic prevents catastrophic security breaches that could destroy reputation and consulting business while ensuring reliable data handling.

### Story 3.1: Pre-Deployment Security Checklist Implementation

As a consultant handling sensitive client financial data,
I want a mandatory security checklist that must pass before any production deployment,
so that I never accidentally expose API keys, credentials, or client data.

#### Acceptance Criteria

1. Security checklist document created in repository at `.ai/security-checklist.md` with all verification steps
2. Checklist includes sections:
   - GitHub secret scanning verification
   - Environment variables audit (no keys in client code)
   - Supabase RLS policy verification
   - API endpoint authentication check
   - Client data encryption at rest verification
   - Deployment configuration review
3. GitHub Actions deployment workflow includes automated security check step that fails build if issues detected
4. Checklist includes Claude Code security audit command that can be run pre-deployment
5. Manual checklist sign-off required before merge to main branch (documented in PR template)
6. Checklist tracks completion date, auditor (you), and findings/remediation actions
7. Failed checklist items block deployment with clear error messages explaining what needs fixing
8. Checklist is versioned and updated as new security requirements emerge

### Story 3.2: GitHub Secret Scanning & API Key Protection

As a developer using Claude Code for rapid development,
I want automated detection of accidentally committed secrets,
so that API keys and credentials never make it to the repository even during "vibe coding" sessions.

#### Acceptance Criteria

1. GitHub secret scanning is enabled on the repository with notifications to your email
2. Pre-commit hook (using Husky or similar) scans for common secret patterns before allowing commits:
   - API keys (Supabase, OpenAI, etc.)
   - Database connection strings
   - Environment variable values (.env file content)
   - Private keys and certificates
3. `.gitignore` includes all sensitive file patterns: `.env`, `.env.local`, `*.key`, `credentials.json`
4. All API keys and secrets are stored in environment variables only, loaded via `.env` file (never committed)
5. Example `.env.example` file shows required variables with placeholder values, safe to commit
6. Repository audit scans entire git history for accidentally committed secrets from before scanning was enabled
7. If secrets are found in history, repository is cleaned using `git filter-repo` or BFG Repo-Cleaner and all exposed keys are rotated immediately
8. Documentation in README explains how to set up environment variables for local development

### Story 3.3: Supabase Row Level Security (RLS) Policies

As a solo user with sensitive data,
I want all database tables protected by Row Level Security policies,
so that even if authentication is compromised, data access is restricted to only my user account.

#### Acceptance Criteria

1. Every Supabase table has RLS enabled (no exceptions)
2. RLS policies enforce user_id matching: users can only read/write rows where `user_id = auth.uid()`
3. Tables include: `tasks`, `projects`, `phases`, `businesses`, `daily_pages`, `deep_work_sessions`, `health_goals`, `content_items`, `finance_records`, `life_items`, `golf_scores`
4. Sensitive client data tables (financial records, project details) have additional encryption at rest via Supabase encryption features
5. RLS policies are tested with automated script that attempts unauthorized access and verifies denial
6. Service role key (bypasses RLS) is stored securely in GitHub Secrets, never in client code or committed files
7. Anon key (used by frontend) has appropriate permissions via RLS, cannot access other users' data
8. RLS policy audit report generated showing all tables, their policies, and last verification date
9. Database migration scripts include RLS policy creation alongside table creation (never deployed without RLS)

### Story 3.4: Client Data Encryption & Handling Protocols

As a consultant with access to client financial data,
I want explicit protocols for handling sensitive information in the dashboard,
so that client data is protected throughout its lifecycle and I can demonstrate security compliance.

#### Acceptance Criteria

1. Sensitive client data fields (bank account numbers, financial metrics, company names) are encrypted at rest using Supabase encryption
2. Client financial documents (bank statements, MCA applications) are NOT stored in the dashboard database - only references/metadata stored
3. Actual sensitive documents stored in encrypted cloud storage (Supabase Storage with encryption) with access logs
4. Dashboard displays masked versions of sensitive data (e.g., "****5678" for account numbers) with option to reveal only when needed
5. Data retention policy documented: client data automatically purged 90 days after project completion (configurable)
6. Audit log tracks all access to sensitive client data: user, timestamp, data accessed, action performed
7. Client data tagging system allows marking projects/tasks as "Confidential" with visual indicators and additional access controls
8. Export/download functionality for client data includes watermarking and access tracking
9. Security practices documentation created for client presentation: "How We Protect Your Data" one-pager

### Story 3.5: Authentication & Session Security

As the sole user of this dashboard,
I want secure authentication that prevents unauthorized access,
so that my business data and client information remain private even if my device is compromised.

#### Acceptance Criteria

1. Supabase authentication configured with email + password (minimum 12 characters, complexity requirements)
2. Session timeout after 24 hours of inactivity, requires re-authentication
3. "Remember me" functionality uses secure, httpOnly cookies (not localStorage for sensitive tokens)
4. Login attempts are rate-limited: max 5 failed attempts per 15 minutes, then temporary account lock with email notification
5. Two-factor authentication (2FA) available as optional enhancement using Supabase Auth 2FA features
6. Password reset flow includes email verification and link expiration (15 minutes)
7. Active session monitoring: dashboard displays "Last login: [timestamp]" and allows viewing active sessions
8. Logout functionality clears all local storage, session storage, and cookies completely
9. Authentication errors display user-friendly messages without revealing system details (no "user not found" vs "wrong password" distinction)

### Story 3.6: Data Integrity Validation & Backup

As someone relying on the dashboard for cognitive offload,
I want assurance that my data is never lost or corrupted during sync operations,
so that I can trust the dashboard as my "external brain" without fear of losing critical information.

#### Acceptance Criteria

1. Sync operations include integrity checks: verify task counts before/after sync, log discrepancies
2. Database constraints prevent orphaned records: tasks cannot exist without parent project/phase (foreign key constraints with ON DELETE CASCADE)
3. Unique constraints prevent duplicate tasks during sync race conditions
4. Automated daily backup of Supabase database to external storage (GitHub repo or cloud storage) with 30-day retention
5. Backup restoration procedure documented and tested: can restore from backup within 1 hour if needed
6. Sync conflict detection: if same task modified simultaneously in multiple locations, conflict is detected and user is prompted to resolve
7. Data validation on all input fields: task titles (max 200 chars), dates (valid format), percentages (0-100 range)
8. Corrupted data detection script runs weekly: checks for null required fields, invalid foreign keys, orphaned records
9. Point-in-time recovery capability using Supabase backups: can restore to any point within last 7 days if data corruption occurs
10. Manual backup button in dashboard settings allows on-demand full data export to JSON file
