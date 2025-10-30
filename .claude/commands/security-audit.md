# Security Audit Command

Perform a comprehensive security review of the tg-dashboard codebase before production deployment.

## Checklist

1. **Scan for Hardcoded Secrets**
   - Search src/ directory for JWT tokens (pattern: `eyJhbGciOiJI`)
   - Search for Supabase URLs (pattern: `https://*.supabase.co`)
   - Search for OpenAI API keys (pattern: `sk-proj-`, `sk-`)
   - Search for common secret patterns: `password=`, `api_key=`, `secret=`, `private_key`
   - Flag any hardcoded credentials found with file path and line number

2. **Verify Environment Variable Usage**
   - Check `src/lib/supabase.ts` uses `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`
   - Verify no `SUPABASE_SERVICE_ROLE_KEY` references in src/ directory (should only be in GitHub Secrets)
   - Confirm all environment variables use `VITE_` prefix for client-side access
   - Check `.env` and `.env.local` are in `.gitignore`
   - Verify `.env.example` exists with placeholder values only

3. **Check RLS Policy Configuration**
   - Review Supabase table list in `src/types/` directory
   - Verify all data tables have RLS policies (user_id = auth.uid())
   - Flag any tables that may be missing RLS protection
   - Check for proper authentication flow in `src/App.tsx`

4. **Review Authentication Implementation**
   - Verify `src/App.tsx` implements session management with `supabase.auth.getSession()`
   - Check for protected routes (unauthenticated users redirected to login)
   - Verify logout clears session and redirects properly
   - Review authentication error handling

5. **Scan for Sensitive Data in Logs**
   - Search for `console.log` statements that may expose sensitive data
   - Patterns to check: `console.log.*password`, `console.log.*token`, `console.log.*account`
   - Flag any suspicious logging for manual review
   - Verify production build removes debug logging

6. **Check Git History**
   - Run `git log --all --full-history -- .env .env.local` to verify no env files committed
   - Search git history for accidentally committed secrets
   - Recommend git-filter-repo cleanup if secrets found

7. **Verify Deployment Configuration**
   - Check `.github/workflows/deploy.yml` includes security check step
   - Verify GitHub Actions secrets properly configured
   - Confirm HTTPS enforcement on custom domain
   - Review build output (dist/) for accidentally included secrets

8. **Generate Security Report**
   - Summarize findings by severity: Critical, High, Medium, Low
   - Provide remediation steps for each issue found
   - Reference `.ai/security-checklist.md` for detailed verification steps
   - Recommend running `.ai/scripts/security-check.sh` for automated checks

## Output Format

```markdown
# Security Audit Report
**Date:** [YYYY-MM-DD]
**Auditor:** Claude Code Agent
**Status:** [PASS / FAIL / WARNINGS]

## Critical Issues (Block Deployment)
- [List any hardcoded API keys, exposed service role keys, or disabled RLS]

## High Priority Issues
- [List any missing RLS policies, weak authentication, or secret patterns]

## Medium Priority Issues
- [List any console.log with sensitive data, missing .gitignore entries]

## Low Priority Issues
- [List any recommendations for security hardening]

## Remediation Recommendations
[Provide specific steps to fix each issue found]

## Next Steps
1. Fix all Critical and High issues before deployment
2. Run `.ai/scripts/security-check.sh` to verify fixes
3. Complete `.ai/security-checklist.md` manual review
4. Update security audit log in checklist document
```

## Usage

Run this command in Claude Code before any production deployment:

```
/security-audit
```

Claude will automatically scan the codebase and generate a security report with findings and recommendations.
