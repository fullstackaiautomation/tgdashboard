# Pull Request

## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Security enhancement
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing Performed
- [ ] Tested locally in development environment
- [ ] Verified build succeeds (`npm run build`)
- [ ] Checked for TypeScript errors (`npm run typecheck` or similar)
- [ ] Tested authentication flow (if applicable)
- [ ] Verified database migrations (if applicable)

---

## 🔒 Security Checklist Sign-off

**REQUIRED BEFORE MERGE:** Complete this section for all PRs, especially those touching:
- Authentication/authorization
- Environment variables
- API integrations
- Database schema
- Financial data handling

### Security Items

- [ ] **No hardcoded API keys or secrets** in code changes
- [ ] **Environment variables** properly used (`.env` not committed, `VITE_` prefix for client vars)
- [ ] **No service role key** references in client code (`SERVICE_ROLE` grep returns nothing)
- [ ] **.gitignore** includes sensitive file patterns (`.env`, `.env.local`, `*.key`)
- [ ] **RLS policies** exist for any new database tables
- [ ] **Authentication checks** in place for protected routes/endpoints
- [ ] **No sensitive data** in console.log statements or error messages
- [ ] **Ran security check script:** `.ai/scripts/security-check.sh` → **PASSED** ✅

### Security Audit Details

**Security Auditor:** [Your Name]
**Audit Date:** [YYYY-MM-DD]
**Full Checklist:** See [.ai/security-checklist.md](.ai/security-checklist.md)

### Findings & Remediation

**Issues Found:**
- [ ] No security issues found ✅
- [ ] Issues found and remediated (list below):

**Remediation Actions Taken:**
- Action 1 (if any issues found)
- Action 2

---

## Screenshots / Video
(If applicable, add screenshots or video demonstrating the changes)

## Deployment Notes
- [ ] Database migrations need to be run (list migration files)
- [ ] Environment variables need to be updated (list vars)
- [ ] GitHub Actions secrets need to be configured (list secrets)
- [ ] Custom domain DNS changes required
- [ ] No deployment changes required

## Checklist Before Merge
- [ ] Code follows project conventions and standards
- [ ] All tests pass locally
- [ ] Security checklist completed and signed off
- [ ] Documentation updated (if needed)
- [ ] Reviewed `.ai/security-checklist.md` if touching sensitive areas

---

**Note:** PRs modifying authentication, environment variables, or handling client data MUST have security sign-off completed before merge approval.
