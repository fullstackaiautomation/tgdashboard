# 🚨 URGENT: Key Rotation Required

**Status:** DEFERRED - Cannot cause downtime right now
**Severity:** CRITICAL
**Discovery Date:** 2025-10-13
**Public Repository:** YES - Keys are exposed in public Git history

---

## Summary

During Story 3.2 implementation, we discovered that **REAL SUPABASE KEYS** (including service role key) are exposed in the public Git repository history from the initial commit.

### What's Exposed

**Commit:** `ea9649cec597a502139b600be801bade84e80136` (Oct 5, 2025)
**File:** `.env` file was committed with real credentials
**Keys Exposed:**
- `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key)
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **BYPASSES ALL RLS SECURITY**
- `SUPABASE_DB_PASSWORD`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PROJECT_ID`

### Current Mitigation

✅ `.env` is now in `.gitignore` (no new commits will leak keys)
✅ Security check script exists (`.ai/scripts/security-check.sh`)
✅ GitHub Actions security check runs on every deployment
✅ `.env.example` has placeholders only

❌ **Keys in Git history are STILL THE CURRENT ACTIVE KEYS**
❌ **Anyone with access to public repo can read entire database**

---

## Action Plan (When Downtime Is Acceptable)

### Step 1: Rotate Keys in Supabase Dashboard

1. Go to: https://app.supabase.com/project/rnlijzolilwweptwbakv/settings/api
2. Click "API Keys" tab (not "Legacy API Keys")
3. **Rotate Service Role Key:**
   - Click "Generate new key" or "Reset" for service_role key
   - Copy new key immediately
4. **Rotate Anon/Public Key:**
   - Click "Generate new key" or "Reset" for anon public key
   - Copy new key immediately

### Step 2: Update Local Environment

Update `.env` file with new keys:
```bash
VITE_SUPABASE_PROJECT_ID="rnlijzolilwweptwbakv"
VITE_SUPABASE_PUBLISHABLE_KEY="<NEW_ANON_KEY_HERE>"
VITE_SUPABASE_URL="https://rnlijzolilwweptwbakv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="<NEW_SERVICE_ROLE_KEY_HERE>"
SUPABASE_DB_PASSWORD="<CURRENT_PASSWORD>"
```

### Step 3: Update GitHub Secrets

1. Go to: Repository → Settings → Secrets and variables → Actions
2. Update:
   - `VITE_SUPABASE_URL` (if changed)
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (new anon key)
   - Add `SUPABASE_SERVICE_ROLE_KEY` (new service role key) if needed

### Step 4: Test Application

```bash
npm run dev
```

Verify:
- Login works
- Tasks load correctly
- All features functional

### Step 5: Clean Git History

**BACKUP FIRST:** Create a full copy of the repository before proceeding.

**Option A: Using BFG Repo-Cleaner (Recommended)**
```bash
# Install BFG (Windows)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone fresh copy
git clone --mirror https://github.com/your-username/tg-dashboard.git tg-dashboard-clean.git
cd tg-dashboard-clean.git

# Remove .env files from history
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files .env.local

# Cleanup
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (REWRITES HISTORY)
git push --force --all
```

**Option B: Using git-filter-repo**
```bash
# Install: pip install git-filter-repo

# Remove .env from history
git filter-repo --path .env --invert-paths
git filter-repo --path .env.local --invert-paths

# Force push
git push --force --all
```

### Step 6: Verify History is Clean

```bash
# Check .env was removed
git log --all --full-history -- .env
# Should return: nothing

# Search for any remaining keys
git log -p | grep -E "eyJhbGciOiJI"
# Should return: nothing
```

### Step 7: Check Supabase Logs for Unauthorized Access

1. Go to Supabase Dashboard → Logs
2. Check API logs for suspicious activity between Oct 5, 2025 - rotation date
3. Look for:
   - Unexpected IP addresses
   - Large data exports
   - Unusual queries
   - Failed authentication attempts

---

## Estimated Downtime

- **Key Rotation:** 5 minutes (immediate invalidation of old keys)
- **Testing:** 10 minutes
- **Git History Cleanup:** 15 minutes
- **Total:** ~30 minutes of potential downtime

---

## Why This Is Critical

The **service role key bypasses ALL Row Level Security (RLS)**. Anyone with this key can:
- Read all data in your database (tasks, finances, personal info)
- Modify any data
- Delete records
- Create admin users
- Access other users' data (if multi-tenant in future)

This is **more severe** than a leaked password because it's full database access.

---

## Temporary Workarounds (Until Rotation)

1. **Monitor Supabase logs daily** for suspicious activity
2. **Limit sensitive data entry** until keys are rotated
3. **Watch for unusual database behavior** (slow queries, unexpected changes)
4. **Consider RLS policy audit** to ensure policies are actually enforced

---

## Related Story

This remediation work is part of:
**Story 3.2: GitHub Secret Scanning & API Key Protection**
- File: `docs/stories/3.2.github-secret-scanning-protection.md`
- Tasks 6-8 cover history scanning, cleaning, and key rotation

---

## Notes

- Story 3.1 already identified this issue but keys were never rotated
- Current `.env` file still uses the exposed keys from Oct 5, 2025
- Repository is **public**, meaning anyone can see the history
- Security check script exists but doesn't prevent historical exposure

---

**When you're ready to proceed, run:**
```bash
# In Claude Code, say:
"Continue with key rotation from URGENT-KEY-ROTATION-NEEDED.md"
```
