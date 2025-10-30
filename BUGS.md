# Bugs & Troubleshooting Guide

This document tracks all bugs encountered during development and their solutions. Use this as a reference when you encounter issues.

---

## Common Dev Server Issues

### Port in Use

**Issue**: Dev server won't start on port 5000

**Error Message**:
```
Port 5000 is in use
```

**Solutions**:
1. Let Vite auto-increment to next available port (5001, 5002, etc.)
2. Kill process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```
3. Configure different port in `vite.config.ts`:
   ```typescript
   export default {
     server: {
       port: 5001
     }
   }
   ```

### Development Server Keeps Crashing

**Issue**: Dev server crashes frequently

**Checklist**:
1. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```
2. Check for ESLint errors:
   ```bash
   npm run lint
   ```
3. Clear Vite cache:
   ```bash
   rm -rf node_modules/.vite
   ```
4. Restart dev server:
   ```bash
   npm run dev
   ```

## Database Connection Issues

### Cannot Connect to Supabase

**Issue**: Database connection errors

**Error Messages**:
```
Error: FetchError: request to https://... failed
FATAL: Ident authentication failed for user
```

**Checklist**:
1. **Verify `.env` variables**:
   ```bash
   # Check that all required vars are set
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_PUBLISHABLE_KEY
   ```

2. **Check Supabase project status**:
   - Go to Supabase dashboard
   - Verify project is running (not paused)
   - Check project health

3. **Verify network access**:
   - Check if your IP is whitelisted (Settings → Database → IP Whitelist)
   - Try disabling VPN temporarily
   - Check firewall rules

4. **Test connection**:
   ```bash
   # If using local Supabase
   supabase status
   ```

### Real-time Subscriptions Not Working

**Issue**: Changes in other tabs/windows don't sync

**Checklist**:
1. Check Supabase dashboard for active subscriptions
2. Verify `useRealtimeSync` hook is properly mounted
3. Check browser console for errors
4. Ensure user has read permissions on tables
5. Restart dev server

**Common Causes**:
- Network connectivity issues
- Supabase project paused
- RLS policies blocking reads
- Subscription not properly cleaned up

### Migrations Won't Deploy

**Issue**: `supabase db push` fails

**Solutions**:

1. **Check migration syntax**:
   ```bash
   # Validate SQL
   supabase db push --dry-run
   ```

2. **Check for conflicts**:
   - Remove conflicting migrations
   - Rebase migrations if using version control

3. **Reset and retry** (⚠️ destructive):
   ```bash
   # For local database only!
   supabase db reset
   supabase db push
   ```

4. **Check migration logs**:
   ```bash
   supabase migration list
   ```

## Authentication Issues

### Stuck on Login Screen

**Issue**: Can't log in to the application

**Checklist**:
1. Verify credentials in `App.tsx` are correct:
   ```typescript
   const [email, setEmail] = useState('tgrassmick@gmail.com')
   const [password, setPassword] = useState('Grassmick1')
   ```

2. Check Supabase user exists:
   - Go to Supabase dashboard
   - Check **Authentication** → **Users**
   - Verify user email matches

3. Check browser console for errors:
   - Press F12 to open DevTools
   - Check Console tab for error messages

4. Try resetting auth state:
   - Clear browser local storage: F12 → Application → Local Storage
   - Clear cookies
   - Refresh page

### Session Expires Unexpectedly

**Issue**: Session dies after short period

**Solutions**:
1. Check Supabase JWT expiry settings
2. Implement token refresh logic
3. Check for browser privacy settings blocking cookies

## Data Issues

### Tasks Not Syncing Between Tabs

**Issue**: Changes in Tasks Hub don't appear in Business Projects

**Checklist**:
1. Verify real-time subscriptions are active
2. Check network tab for failed requests
3. Verify task IDs match between modules
4. Check user_id is consistent

**Debug Steps**:
```typescript
// In console, check subscriptions
supabase.getChannels() // Should show active channels
```

### Progress Calculations Wrong

**Issue**: Progress percentages don't match expected values

**Checklist**:
1. Verify hours_projected > 0 (avoid division by zero)
2. Check hours_worked ≤ hours_projected
3. Verify all tasks in phase have hours_projected set
4. Check progress hooks use correct formulas

**Formula Validation**:
```typescript
// Task: hours_worked / hours_projected * 100
// Phase: Average of all tasks in phase
// Project: Average of all phases in project
// Business: Average of all projects in business
```

### Finance Balances Showing Incorrect Values

**Issue**: Balance snapshots not calculating correctly

**Checklist**:
1. Verify date is in YYYY-MM-DD format
2. Check no duplicate snapshots for same date
3. Verify balance is numeric (not string)
4. Check timezone conversion isn't affecting dates

**Debug Query**:
```sql
-- View balance snapshots for debugging
SELECT * FROM balance_snapshots
WHERE account_id = 'your-account-id'
ORDER BY date DESC;
```

## Performance Issues

### App Feels Slow

**Issue**: UI is sluggish or laggy

**Checklist**:
1. Check browser DevTools Performance tab
2. Look for excessive re-renders:
   ```typescript
   // Add to component
   console.log('MyComponent rendered');
   ```
3. Verify React Query caching is working
4. Check for unnecessary API calls

**Optimization Tips**:
- Use `useMemo` for expensive calculations
- Use `useCallback` for event handlers
- Implement pagination for large lists
- Profile with React DevTools Profiler

### Network Requests Slow

**Issue**: Database queries take too long

**Solutions**:
1. Add database indexes on frequently queried columns
2. Use pagination instead of fetching all rows
3. Optimize Supabase RLS policies
4. Check for N+1 query problems

## TypeScript & Build Issues

### TypeScript Errors - Content Library Type Mismatches

**Issue**: Type errors in Content Library components prevent build

**Error Example**:
```
error TS2322: Type 'boolean | null' is not assignable to type 'boolean | undefined'
error TS2322: Type '"Article"' is not assignable to type 'ContentSource'
```

**Root Cause**:
- ContentItem type defines `google_llm?: boolean` (required, not optional)
- QuickAddModal used invalid source type `'Article'` (not in ContentSource union)
- Valid ContentSource types: `'Website' | 'Twitter' | 'YouTube' | 'Instagram' | 'Other'`

**Solutions**:
1. **For boolean | null vs boolean | undefined mismatch**:
   - Change handler parameter to match component interface:
   ```typescript
   // WRONG
   const handleUpdateGoogleLLM = (id: string, value: boolean | undefined) => {}

   // CORRECT
   const handleUpdateGoogleLLM = (id: string, value: boolean | null) => {
     await updateContent(id, { google_llm: value || false })
   }
   ```

2. **For invalid source types**:
   - Always use valid ContentSource values: Website, Twitter, YouTube, Instagram, Other
   - Replace 'Article' with 'Website'
   ```typescript
   // WRONG
   let source: ContentSource = 'Article'

   // CORRECT
   let source: ContentSource = 'Website'
   ```

3. **Prevention**:
   - Check `src/types/content.ts` for ContentSource definition
   - Use TypeScript strict mode during development
   - Run `npx tsc --noEmit` before committing

**Files Affected** (Oct 30, 2025):
- [src/components/ContentLibrary.tsx:335-337](src/components/ContentLibrary.tsx#L335-L337)
- [src/components/content/QuickAddModal.tsx:60, 129, 137, 174](src/components/content/QuickAddModal.tsx)

---

### General TypeScript Errors

**Issue**: Type errors prevent build

**Solutions**:
1. Check specific error message
2. Install missing type definitions:
   ```bash
   npm install --save-dev @types/name
   ```
3. Update types in `src/types/`
4. Use `any` as last resort (with // @ts-ignore comments)

### Build Fails

**Issue**: `npm run build` fails

**Steps to debug**:
1. Check full error output
2. Clear cache:
   ```bash
   npm run build -- --force
   ```
3. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```
4. Check for ESLint errors:
   ```bash
   npm run lint
   ```

## GitHub Actions & Deployment Issues

### GitHub Actions Workflow Build Failures

**Issue**: GitHub Actions workflow fails even though local build succeeds

**Root Causes**:
1. **Workflow rebuilds instead of using pre-built files**
   - If deploying pre-built dist files, don't rebuild in CI
   - Remove build step from deploy workflow

2. **dist/ folder not found in artifact upload**
   - Check if dist/ is in .gitignore (will prevent commit)
   - For deployment repo: Remove dist from .gitignore
   - Commit actual dist/ folder to deployment repo

3. **Missing source files in deployment repo**
   - Deployment repo may only have dist files, not source
   - Workflow tries to build but package.json/src/ don't exist
   - Solution: Either provide source OR skip build step

**Solution** (Oct 30, 2025):
1. **For pre-built deployments**:
   ```yaml
   # In .github/workflows/deploy.yml - SKIP BUILD
   - name: Setup Pages
     uses: actions/configure-pages@v4

   - name: Upload artifact
     uses: actions/upload-pages-artifact@v3
     with:
       path: './dist'  # Uses existing dist folder

   # Don't include npm install or npm run build
   ```

2. **Fix .gitignore for deployment repo**:
   ```bash
   # Remove dist from .gitignore for deployment repos
   # Edit .gitignore and remove: dist
   git add -f dist/
   git commit -m "Add built dist files"
   ```

3. **Verification**:
   - Check repo has dist/ folder committed
   - Verify workflow file doesn't include build steps
   - Test with GitHub Actions "Re-run jobs"

**Files Affected** (Oct 30, 2025):
- `.github/workflows/deploy.yml` - Updated to skip build
- `.gitignore` - Removed dist exclusion for deployment repo

---

### GitHub Actions Workflow Scope Issues

**Issue**: Cannot push workflow files to repository

**Error**:
```
refusing to allow an OAuth App to create or update workflow without `workflow` scope
```

**Root Cause**:
- GitHub OAuth token/credentials don't have `workflow` scope
- Required for creating/modifying GitHub Actions workflow files

**Solution**:
- Use Personal Access Token (PAT) with `workflow` scope
- Cannot use standard OAuth tokens for workflow file modifications
- See [CLAUDE.md - Push Live Workflow](CLAUDE.md)

**Prevention**:
- When creating PAT, explicitly select `workflow` scope
- Document which credentials have which scopes
- Use environment-specific tokens

---

## Browser Compatibility

### Issues in Specific Browser

**Issue**: Works in Chrome but not Firefox/Safari

**Solutions**:
1. Check browser DevTools for errors
2. Verify polyfills for older browsers
3. Check CSS compatibility
4. Test in incognito/private mode

## Getting Help

### Check These Resources First

1. **Recent Development Sessions**:
   - `START-HERE.md` - Quick summary
   - `MORNING-SUMMARY.md` - Detailed overnight work
   - `EPIC_1_AND_2_COMPLETE.md` - Epic completion notes

2. **Documentation**:
   - [docs/IMPLEMENTATION-GUIDE.md](IMPLEMENTATION-GUIDE.md)
   - [docs/DATABASE.md](DATABASE.md)
   - [docs/ARCHITECTURE.md](ARCHITECTURE.md)

3. **Official Docs**:
   - Supabase: https://supabase.com/docs
   - React Query: https://tanstack.com/query/docs
   - Vite: https://vitejs.dev

### Debug Commands

```bash
# Check Supabase status
supabase status

# View Supabase logs
supabase functions logs analyze-content --follow

# Check environment variables
env | grep VITE

# Validate TypeScript
npx tsc --noEmit

# Run ESLint
npm run lint

# Check for security issues
npm audit
```

### Clearing Caches

Sometimes a clean slate helps:

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Clear browser cache
# Dev Tools → Network tab → Disable cache (while DevTools open)
```

## Report a Bug

When reporting an issue, include:

1. **Error message** (exact text)
2. **Steps to reproduce**
3. **Expected vs actual behavior**
4. **Environment**:
   - OS (Windows, macOS, Linux)
   - Browser & version
   - Node version (`node --version`)
   - npm version (`npm --version`)
5. **Relevant code** (if applicable)
6. **Screenshots** (if visual issue)

---

## Bug Template

Use this template when reporting a new bug:

```markdown
### B-00X: [Bug Title]
**Date Reported**: [DATE]
**Severity**: [Critical / High / Medium / Low]
**Status**: [New / In Progress / ✅ Resolved / ❌ Won't Fix]

**Description**:
[What is the bug? Clear description of the issue.]

**Error Message**:
\`\`\`
[Exact error text if applicable]
\`\`\`

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Environment**:
- OS: [Windows / macOS / Linux]
- Browser: [Chrome / Firefox / Safari]
- Node: [version]
- npm: [version]

**Root Cause**:
[Once identified, explain why this happens]

**Solution**:
[How to fix or work around the issue]

**Affected Files**:
- [src/components/file.tsx]

**Related Issues**:
[Links to related bugs or decisions]
```

---

## Bug Index

| # | Title | Severity | Status | Date |
|---|-------|----------|--------|------|
| [Add bugs as you encounter them] | | | | |

---

## Bug Statistics
- **Total Bugs Reported**: 0
- **Resolved**: 0
- **In Progress**: 0
- **Open**: 0
- **Won't Fix**: 0
