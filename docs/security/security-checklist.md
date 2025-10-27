# Pre-Deployment Security Checklist v1.0.0

**Last Updated:** 2025-10-15
**Purpose:** Mandatory security verification before production deployment
**Auditor:** TG / Claude Code Dev Agent
**Repository:** tg-dashboard (private)

---

## Quick Security Check Commands

```bash
# Run all automated checks
bash .ai/scripts/security-check.sh

# Verify RLS policies
psql $DATABASE_URL -f .ai/scripts/verify-rls.sql

# Test pre-commit hook
bash .ai/tests/test-secret-detection.sh

# Scan for secrets in codebase
grep -r "eyJhbGciOiJI" src/ --include="*.ts" --include="*.tsx"
```

---

## 1. GitHub Secret Scanning

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Verification Steps
- [ ] Navigate to GitHub repository Settings → Security → Code security and analysis
- [ ] Verify "Secret scanning" feature is enabled
- [ ] Verify "Push protection" is enabled (blocks commits with secrets)
- [ ] Check for alerts in Security tab → Secret scanning
- [ ] Verify email notifications configured for secret scanning alerts

### Verification Commands
```bash
# Manual check - visit GitHub UI
open https://github.com/[username]/tg-dashboard/settings/security_analysis

# Run automated security check
bash .ai/scripts/security-check.sh
```

### Pass Criteria
- ✅ Secret scanning enabled
- ✅ Push protection enabled
- ✅ Zero active secret scanning alerts
- ✅ Email notifications configured

### Remediation (if needed)
If secrets found: Rotate keys immediately → Clean git history → Force push

---

## 2. Environment Variables Audit

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Required Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL (safe for client)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (safe for client, RLS protected)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (GitHub Secrets ONLY)
- `SUPABASE_DB_PASSWORD` - Database password (GitHub Secrets ONLY)

### Verification Steps
- [ ] Verify .env file is in .gitignore
- [ ] Verify .env.example exists with placeholders only
- [ ] Verify no hardcoded Supabase URLs in src/: `grep -r "https://.*\.supabase\.co" src/`
- [ ] Verify no hardcoded JWT keys in src/: `grep -r "eyJhbGciOiJI" src/`
- [ ] Verify no service role key in src/: `grep -r "SERVICE_ROLE" src/`
- [ ] Verify all client code uses `import.meta.env.VITE_*` pattern

### Verification Commands
```bash
# Check .env in .gitignore
grep "^\.env$" .gitignore

# Check .env.example exists and is safe
cat .env.example | grep -v "your-" && echo "FAIL: Real values in .env.example"

# Scan for hardcoded secrets
bash .ai/scripts/security-check.sh

# Verify git history clean
git log --all --full-history -- .env
```

### Pass Criteria
- ✅ .env in .gitignore
- ✅ .env.example has placeholders only
- ✅ No hardcoded secrets in src/
- ✅ .env never committed to git history

---

## 3. Supabase RLS Policies

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Tables Requiring RLS
- tasks
- projects
- phases
- businesses
- deep_work_log
- area_time_targets
- user_settings
- content_items
- transactions
- budget_settings
- financial_goals

### Verification Steps
- [ ] Run RLS verification SQL script
- [ ] Verify ALL tables have `rowsecurity = true`
- [ ] Verify each table has at least 1 policy
- [ ] Verify policies filter by `user_id` or `auth.uid()`
- [ ] Test RLS: Login as different user, verify data isolation

### Verification Commands
```sql
-- Run in Supabase SQL Editor or via psql
\i .ai/scripts/verify-rls.sql

-- Expected output: All tables show rls_enabled = true, policy_count >= 1
```

### Pass Criteria
- ✅ All 11 tables have RLS enabled
- ✅ Each table has user_id policies
- ✅ Test confirms data isolation between users

---

## 4. API Endpoint Authentication

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Verification Steps
- [ ] Verify Supabase client uses anon key (not service role)
- [ ] Verify all queries go through Supabase client (not direct DB)
- [ ] Check `src/lib/supabase.ts` configuration
- [ ] Verify auth headers included in all requests

### Verification Commands
```bash
# Check Supabase client config
cat src/lib/supabase.ts | grep -A 5 "createClient"

# Verify uses VITE_SUPABASE_ANON_KEY
grep "VITE_SUPABASE_ANON_KEY" src/lib/supabase.ts
```

### Pass Criteria
- ✅ Uses anon key (not service role)
- ✅ All queries through Supabase client
- ✅ Auth headers present

---

## 5. Client Data Encryption at Rest

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Verification Steps
- [ ] Verify Supabase encryption at rest (default AES-256)
- [ ] Check sensitive columns (financial data) are encrypted
- [ ] Verify no sensitive data in localStorage unencrypted
- [ ] Verify TLS/SSL for all connections

### Notes
- Supabase encrypts all data at rest by default (AES-256)
- Database credentials encrypted in transit (TLS/SSL)
- RLS policies provide access control on top of encryption

### Pass Criteria
- ✅ Supabase encryption confirmed (default)
- ✅ No sensitive data in localStorage
- ✅ HTTPS enforced for all connections

---

## 6. Deployment Configuration Review

**Status:** [ ] Not Verified [ ] Verified [ ] Issues Found

### Verification Steps
- [ ] Verify GitHub Pages deployment uses HTTPS
- [ ] Verify custom domain has HTTPS enabled
- [ ] Check GitHub Actions secrets properly configured
- [ ] Verify no secrets in dist/ folder after build
- [ ] Verify no debug endpoints in production
- [ ] Check security headers (if configurable)

### Verification Commands
```bash
# Build and scan output
npm run build
grep -r "eyJhbGciOiJI" dist/
grep -r "SERVICE_ROLE" dist/

# Visit production URL
curl -I https://tgdashboard.fullstackaiautomation.com
```

### Security Headers (Optional)
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Pass Criteria
- ✅ HTTPS enforced
- ✅ No secrets in build output
- ✅ GitHub Actions secrets configured
- ✅ No debug endpoints accessible

---

## Checklist Execution Log

| Date | Version | Auditor | Status | Findings | Remediation |
|------|---------|---------|--------|----------|-------------|
| 2025-10-15 | v1.0.0 | James (Dev) | Initial | Checklist created | N/A |
|  |  |  |  |  |  |

---

## Security Incident Response Process

### If API Key is Exposed
1. **Immediate:** Rotate key in Supabase Dashboard (Settings → API)
2. **Check Logs:** Review access during exposure window
3. **Update:** GitHub Secrets with new keys
4. **Redeploy:** Application with new keys
5. **Document:** Incident log with timeline

### If RLS Bypass Discovered
1. **Immediate:** Disable affected operations
2. **Audit:** Check data access logs
3. **Fix:** Update RLS policies
4. **Test:** Verify fix prevents unauthorized access
5. **Document:** Policy changes

### If Client Data Leaked
1. **Assess:** Determine scope of exposure
2. **Notify:** Affected parties if required
3. **Document:** Timeline and impact
4. **Remediate:** Fix vulnerability, rotate credentials
5. **Review:** Root cause analysis

### Severity Levels
- **Critical:** Client data exposed, DB credentials leaked
- **High:** API keys exposed, RLS bypassed
- **Medium:** Config issues, debug endpoints
- **Low:** Non-sensitive disclosure

---

## Pass/Fail Criteria

### ✅ PASS - Ready for Deployment
- All 6 sections verified with checkmarks
- Zero secrets in codebase and git history
- All RLS policies enabled and tested
- Environment variables properly configured
- No hardcoded credentials

### ❌ FAIL - Block Deployment
- Any secrets found in git history
- Missing RLS policies
- Hardcoded credentials in source
- .env file committed
- Service role key in client code

---

**Review Cadence:**
- Before each deployment: Run automated checks
- Monthly: Manual checklist review
- Quarterly: Full security audit
- After incidents: Immediate review and update

**Version History:** See `.ai/security-checklist-changelog.md`
