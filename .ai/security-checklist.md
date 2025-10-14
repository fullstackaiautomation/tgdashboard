# Pre-Deployment Security Checklist

**Version:** v1.0.0
**Last Updated:** 2025-10-13
**Purpose:** Mandatory security verification before production deployment to prevent API key exposure, unauthorized data access, and client data breaches.

---

## Overview

This checklist must be completed and all items must PASS before deploying the tg-dashboard to production. The dashboard handles sensitive client financial data (bank statements, MCA applications, financial metrics) and requires rigorous security protocols.

**Auditor:** TG (Solo Developer)
**Review Cadence:** Every 3 months or after security incidents
**Blocking Policy:** Any FAIL blocks deployment until remediated

---

## 1. GitHub Secret Scanning Verification

**Purpose:** Ensure no API keys, credentials, or secrets exist in repository history

### Checks

- [ ] **GitHub secret scanning enabled**
  - Navigate to repository Settings → Security → Code security and analysis
  - Verify "Secret scanning" is enabled
  - **Pass Criteria:** Secret scanning shows as "Enabled"
  - **Verification:** Check GitHub Security tab → Secret scanning alerts

- [ ] **No secret scanning alerts**
  - Review Security → Secret scanning
  - **Pass Criteria:** Zero active alerts
  - **Remediation:** If secrets found, rotate keys immediately and clean git history with git-filter-repo

- [ ] **Historical scan complete**
  - Scan entire git history for accidentally committed secrets
  - **Verification Command:** `git log --all --full-history -- .env .env.local`
  - **Pass Criteria:** No .env files in git history
  - **Remediation:** Use `git filter-repo --path .env --invert-paths` to remove

- [ ] **Common secret patterns scanned**
  - **Verification Command:** `.ai/scripts/security-check.sh` (section 1)
  - **Pass Criteria:** No hardcoded Supabase keys, OpenAI keys, or database URLs found
  - **Patterns checked:** `eyJhbGciOiJI` (JWT tokens), `sb-*-auth-token`, `sk-proj-*` (OpenAI)

### Findings & Remediation
_Document any secrets found and remediation actions taken_

---

## 2. Environment Variables Audit

**Purpose:** Verify all API keys and secrets stored in environment variables only, never in source code

### Checks

- [ ] **.env file in .gitignore**
  - **Verification Command:** `grep "^\.env$" .gitignore`
  - **Pass Criteria:** `.env` present in .gitignore
  - **Remediation:** Add `.env` to .gitignore if missing

- [ ] **.env.local in .gitignore**
  - **Verification Command:** `grep "^\.env\.local$" .gitignore`
  - **Pass Criteria:** `.env.local` present in .gitignore
  - **Remediation:** Add `.env.local` to .gitignore if missing

- [ ] **.env.example exists with placeholders only**
  - **Verification:** Check `.env.example` file exists at repository root
  - **Pass Criteria:** File exists with placeholder values like `VITE_SUPABASE_URL=your-project-url-here`
  - **Verification Command:** `grep -i "eyJhbGciOiJI" .env.example` (should return nothing)

- [ ] **No hardcoded Supabase URLs in source code**
  - **Verification Command:** `grep -r "supabase\.co" src/ --include="*.ts" --include="*.tsx"`
  - **Pass Criteria:** No matches (all Supabase URLs loaded via environment variables)
  - **Remediation:** Replace hardcoded URLs with `import.meta.env.VITE_SUPABASE_URL`

- [ ] **No hardcoded API keys in source code**
  - **Verification Command:** `grep -r "eyJhbGciOiJI" src/ --include="*.ts" --include="*.tsx"`
  - **Pass Criteria:** No matches (no JWT tokens or Supabase keys in code)
  - **Remediation:** Move all keys to .env file

- [ ] **Service role key NOT in client code**
  - **Verification Command:** `grep -r "SERVICE_ROLE" src/ --include="*.ts" --include="*.tsx"`
  - **Pass Criteria:** No matches (service role key bypasses RLS, must never be in client code)
  - **Remediation:** Remove service role key from client code, use only in GitHub Secrets for Edge Functions

- [ ] **Only VITE_ prefixed env vars in client code**
  - **Verification:** Review src/lib/supabase.ts
  - **Pass Criteria:** Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` used
  - **Explanation:** Vite only exposes env vars with `VITE_` prefix to client code

- [ ] **Required environment variables documented**
  - **Required vars:**
    - `VITE_SUPABASE_URL` - Supabase project URL
    - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (safe for client-side)
    - `SUPABASE_SERVICE_ROLE_KEY` - GitHub Secrets only (for Edge Functions)
  - **Pass Criteria:** All vars present in .env.example with placeholders

- [ ] **Automated environment audit passes**
  - **Verification Command:** `.ai/scripts/security-check.sh`
  - **Pass Criteria:** Script exits with code 0 (all checks pass)

### Findings & Remediation
_Document any hardcoded keys found and remediation actions taken_

---

## 3. Supabase Row Level Security (RLS) Policies

**Purpose:** Ensure all database tables enforce user-level access control to prevent data leaks

### Checks

- [ ] **RLS enabled on all tables**
  - **Verification Command:** Run `.ai/scripts/verify-rls.sql` in Supabase SQL Editor
  - **Tables to verify:**
    - `tasks`, `projects`, `phases`, `businesses`
    - `daily_pages`, `deep_work_sessions`
    - `health_goals`, `content_items`
    - `finance_records`, `finance_accounts`, `balance_snapshots`
    - `life_items`, `golf_scores`
  - **Pass Criteria:** All tables show `rls_enabled = true`

- [ ] **User-scoped policies exist on all tables**
  - **Verification Command:** Same as above, check `policy_count >= 1` for each table
  - **Pass Criteria:** Each table has at least one policy enforcing `user_id = auth.uid()`
  - **Remediation:** Create RLS policies for tables missing them

- [ ] **Service role key stored securely**
  - **Verification:** Check GitHub Settings → Secrets and variables → Actions
  - **Pass Criteria:** `SUPABASE_SERVICE_ROLE_KEY` present in GitHub Secrets, not in code
  - **Explanation:** Service role key bypasses RLS, only use in secure environments (Edge Functions, CI/CD)

- [ ] **Anon key used in client code**
  - **Verification:** Check `src/lib/supabase.ts` uses `VITE_SUPABASE_ANON_KEY`
  - **Pass Criteria:** Client uses anon key, which respects RLS policies
  - **Explanation:** Anon key enforces RLS, service role key bypasses it

- [ ] **RLS policies tested**
  - **Test:** Attempt to access another user's data via Supabase client
  - **Pass Criteria:** Access denied due to RLS policy
  - **Manual Test Steps:**
    1. Log in as test user
    2. Try to query tasks with different user_id
    3. Verify query returns empty result (not error)

### Findings & Remediation
_Document any tables without RLS and remediation actions taken_

---

## 4. API Endpoint Authentication

**Purpose:** Verify all API calls include proper authentication headers

### Checks

- [ ] **Supabase client configured with auth**
  - **Verification:** Review `src/lib/supabase.ts`
  - **Pass Criteria:** Supabase client initialized with anon key
  - **Expected pattern:**
    ```typescript
    createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
    ```

- [ ] **Authentication state managed**
  - **Verification:** Check `src/App.tsx` for session management
  - **Pass Criteria:** Uses `supabase.auth.getSession()` and `onAuthStateChange`
  - **Explanation:** Ensures user is authenticated before accessing data

- [ ] **Protected routes implemented**
  - **Verification:** Check if unauthenticated users redirected to login
  - **Pass Criteria:** Dashboard components only accessible after login
  - **Manual Test:** Open app in incognito → verify redirected to Auth component

- [ ] **Edge Functions use proper authentication**
  - **Verification:** Review `supabase/functions/*/index.ts` files
  - **Pass Criteria:** Functions verify JWT token in Authorization header
  - **Pattern:** `const authHeader = req.headers.get('Authorization')`

### Findings & Remediation
_Document any unauthenticated endpoints and remediation actions taken_

---

## 5. Client Data Encryption at Rest

**Purpose:** Ensure sensitive financial data encrypted in database

### Checks

- [ ] **Supabase encryption enabled**
  - **Verification:** Check Supabase project settings
  - **Pass Criteria:** Database encryption at rest enabled (enabled by default on Supabase)
  - **Documentation:** https://supabase.com/docs/guides/platform/security

- [ ] **Sensitive fields identified**
  - **Fields requiring encryption:**
    - `finance_accounts.account_number`
    - `finance_accounts.routing_number`
    - `balance_snapshots.account_details`
    - Any client financial metrics in tasks/projects
  - **Pass Criteria:** Documented which fields contain sensitive data

- [ ] **HTTPS enforced for all connections**
  - **Verification:** Check Supabase project URL uses `https://`
  - **Pass Criteria:** All API calls use HTTPS (verified by Supabase client)
  - **Explanation:** Encryption in transit via TLS

- [ ] **No sensitive data in logs**
  - **Verification Command:** `grep -r "console\.log.*account" src/ --include="*.ts" --include="*.tsx"`
  - **Pass Criteria:** No console.log statements with account numbers or financial data
  - **Remediation:** Remove or sanitize console.log statements in production build

### Findings & Remediation
_Document any unencrypted sensitive data and remediation actions taken_

---

## 6. Deployment Configuration Review

**Purpose:** Verify production deployment configured securely

### Checks

- [ ] **HTTPS enforced on custom domain**
  - **Verification:** Visit https://tgdashboard.fullstackaiautomation.com
  - **Pass Criteria:** Site loads with HTTPS, no mixed content warnings
  - **Remediation:** Configure GoDaddy DNS with HTTPS/SSL certificate

- [ ] **GitHub Pages HTTPS enabled**
  - **Verification:** Check repository Settings → Pages → Enforce HTTPS
  - **Pass Criteria:** "Enforce HTTPS" checkbox enabled

- [ ] **Build output clean**
  - **Verification:** Check `dist/` folder after build
  - **Pass Criteria:** No `.env`, `.env.local`, or API keys in build output
  - **Verification Command:** `grep -r "eyJhbGciOiJI" dist/` (should return nothing)

- [ ] **GitHub Actions secrets configured**
  - **Verification:** Check Settings → Secrets and variables → Actions
  - **Required secrets:**
    - `SUPABASE_SERVICE_ROLE_KEY` (if using Edge Functions in CI/CD)
  - **Pass Criteria:** Secrets present and not logged in workflow output

- [ ] **No debug endpoints in production**
  - **Verification:** Review src/ for debug routes or test endpoints
  - **Pass Criteria:** No `/api/debug`, `/test`, or development-only routes
  - **Remediation:** Remove or gate behind environment check

- [ ] **Security headers configured**
  - **Headers to check:**
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Content-Security-Policy` (if configured)
  - **Verification:** Use browser dev tools → Network → Response Headers
  - **Pass Criteria:** Security headers present (or configure via GitHub Pages settings)

- [ ] **GitHub Actions workflow includes security check**
  - **Verification:** Check `.github/workflows/deploy.yml`
  - **Pass Criteria:** Workflow runs `.ai/scripts/security-check.sh` before deployment
  - **Explanation:** Automated security check blocks deployment if issues detected

### Findings & Remediation
_Document any insecure deployment configs and remediation actions taken_

---

## Security Incident Response

**Purpose:** Document procedures if security breach occurs

### Incident Types & Response

#### Critical: Client Data Exposed
- **Immediate Actions:**
  1. Take dashboard offline immediately
  2. Assess scope: which client data was exposed
  3. Notify affected clients within 24 hours
  4. Document timeline and impact
- **Post-Incident:**
  1. Root cause analysis
  2. Update security checklist with new checks
  3. Implement additional encryption/controls

#### High: API Keys Exposed
- **Immediate Actions:**
  1. Rotate exposed keys immediately (Supabase, OpenAI, etc.)
  2. Check Supabase logs for unauthorized access
  3. Verify no data exfiltration occurred
  4. Clean git history with git-filter-repo
- **Post-Incident:**
  1. Enable GitHub secret scanning alerts (if not already)
  2. Review pre-commit hooks
  3. Update security-check.sh with new patterns

#### Medium: RLS Bypass Discovered
- **Immediate Actions:**
  1. Verify service role key not exposed
  2. Audit RLS policies for gaps
  3. Check database audit logs for suspicious queries
- **Post-Incident:**
  1. Add automated RLS testing
  2. Review all tables for missing policies
  3. Update verify-rls.sql script

### Incident Log Template

| Date | Type | Severity | Impact | Response Actions | Resolution |
|------|------|----------|--------|------------------|------------|
| _Example: 2025-10-13_ | _API Key Exposed_ | _High_ | _Supabase anon key in git history_ | _Rotated key, cleaned history_ | _Resolved in 2 hours_ |

---

## Checklist Execution Log

**Purpose:** Track each security audit execution

| Date | Version | Auditor | Status | Findings | Remediation |
|------|---------|---------|--------|----------|-------------|
| 2025-10-13 | v1.0.0 | TG | Initial Creation | N/A | N/A |

---

## Notes

- This checklist must be completed before EVERY production deployment
- Failed items block deployment until remediated
- Update this checklist every 3 months or after security incidents
- See `.ai/security-checklist-changelog.md` for version history
- Run `/security-audit` in Claude Code for automated security review

---

## Quick Reference Commands

```bash
# Run full automated security check
./.ai/scripts/security-check.sh

# Verify RLS policies (run in Supabase SQL Editor)
# Copy contents of .ai/scripts/verify-rls.sql

# Scan git history for .env files
git log --all --full-history -- .env .env.local

# Check for hardcoded API keys
grep -r "eyJhbGciOiJI" src/ --include="*.ts" --include="*.tsx"

# Verify .env in .gitignore
grep "^\.env$" .gitignore

# Check build output for secrets
grep -r "eyJhbGciOiJI" dist/
```
