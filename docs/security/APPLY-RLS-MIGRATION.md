## RLS Migration Instructions

**CRITICAL SECURITY FIX REQUIRED**

Your current database has insecure RLS policies that allow ANY authenticated user to access ANY data. This needs to be fixed immediately.

### What's Wrong?

Current policies on `tasks`, `businesses`, `projects`, and `phases` tables use:
```sql
USING (true)  -- ❌ INSECURE - allows all authenticated users
```

They should use:
```sql
USING (auth.uid() = user_id)  -- ✅ SECURE - only allows own data
```

### Steps to Apply the Fix

#### 1. Open Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/rnlijzolilwweptwbakv/sql

#### 2. Run the Migration

Copy and paste the entire contents of:
```
supabase/migrations/20251013000000_fix_all_rls_policies.sql
```

Click **"Run"** button

Expected result:
- Many lines starting with "CREATE POLICY"
- No errors
- Should complete in 1-2 seconds

#### 3. Verify the Migration Worked

In the same SQL Editor, run this query:
```sql
SELECT * FROM rls_policy_audit;
```

Expected result: ALL tables should show `✅ Complete` status

#### 4. Run the Audit Script

Copy and paste the entire contents of:
```
.ai/scripts/audit-rls-status.sql
```

Click **"Run"** button

This will give you 5 different reports showing:
- Part 1: Which tables have RLS enabled
- Part 2: Policy counts per table
- Part 3: Detailed policy list
- Part 4: Tables with user_id column
- Part 5: Summary of what needs work

**Save the output** - we'll need it for the audit report.

#### 5. Test Your Application

1. Go to your running application: http://localhost:5000
2. Sign in with your account
3. Try viewing tasks - should work normally
4. Try creating a task - should work normally
5. Try viewing business projects - should work normally

If anything is broken, immediately tell me and we'll debug.

#### 6. Run Comprehensive RLS Tests

In Supabase SQL Editor, run:
```
.ai/scripts/test-rls-policies.sql
```

This runs 7 automated tests to verify RLS is working correctly.

Expected: All tests should show `✅ PASS`

#### 7. Confirm Completion

Once all steps are complete, tell me:
- "Migration applied successfully"
- Paste the output from the audit script (Part 5 - Summary)
- Confirm app is working normally

### What This Migration Does

1. **Fixes insecure policies** on tasks, businesses, projects, phases
2. **Adds RLS policies** to any tables missing them (content_items, daily_pages, etc.)
3. **Creates audit view** (rls_policy_audit) for ongoing monitoring
4. **Preserves existing secure policies** on deep_work_sessions, notes, accounts, balance_snapshots

### Why This is Critical

Without proper RLS policies:
- If you ever add a second user (test account, family member, etc.), they could see ALL your data
- If there's a bug in your authentication, data could leak
- This violates Story 3.3 acceptance criteria
- This is a fundamental security requirement

### Zero Downtime

This migration is safe to run on a live database:
- Uses `DROP POLICY IF EXISTS` (won't fail if policy doesn't exist)
- Uses `DO $$ BEGIN ... END $$` blocks for conditional logic
- Doesn't modify table structures, only policies
- Should complete in 1-2 seconds
- Your app will continue working during migration

### Next Steps After Migration

Once migration is confirmed working:
1. We'll generate the RLS audit report
2. We'll mark Story 3.3 as complete
3. We'll move on to Story 3.4 and 3.5 (pending your decisions)
4. We'll implement Story 3.6 (Data Integrity & Backup)

---

**Ready to apply? Let's do this!**
