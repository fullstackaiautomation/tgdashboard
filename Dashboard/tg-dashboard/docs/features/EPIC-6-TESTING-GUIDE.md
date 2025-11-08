# Epic 6 Testing Guide: Real-time Sync Verification

**Purpose**: Quick guide to verify Master Calendar and Daily Schedule are syncing in real-time.

---

## Quick Test (5 minutes)

### Setup
1. Open your app in browser: `npm run dev`
2. Open a second browser window (or incognito window)
3. Login to both windows with the same account
4. **Window A**: Navigate to Calendar & Scheduling page (Master Calendar)
5. **Window B**: Navigate to Tasks page, Daily Schedule tab

### Test 1: Create Time Block in Master Calendar

**In Window A (Master Calendar):**
1. Drag a task to a time slot, OR
2. Click on a calendar time slot to create a new time block

**Expected in Window B (Daily Schedule):**
- ✅ New time block appears within 500ms
- ✅ Shows correct task name, time, and duration
- ✅ No page refresh required

**Console logs to verify:**
```
[Real-time] Task Time Blocks subscription status: SUBSCRIBED
[Real-time] Task Time Blocks change detected: { eventType: 'INSERT', ... }
```

### Test 2: Update Time Block in Daily Schedule

**In Window B (Daily Schedule):**
1. Click on an existing time block
2. Edit the time or duration
3. Save changes

**Expected in Window A (Master Calendar):**
- ✅ Time block updates within 500ms
- ✅ Position/size changes to match new time
- ✅ No page refresh required

### Test 3: Delete Time Block in Master Calendar

**In Window A (Master Calendar):**
1. Click on a time block
2. Delete it

**Expected in Window B (Daily Schedule):**
- ✅ Time block disappears within 500ms
- ✅ No page refresh required

### Test 4: Resize Time Block in Master Calendar

**In Window A (Master Calendar):**
1. Hover over a time block
2. Grab the resize handle (top or bottom edge)
3. Drag to resize
4. Release

**Expected in Window A (immediate):**
- ✅ Block resizes with 15-minute snapping
- ✅ Time range updates

**Expected in Window B (within 500ms):**
- ✅ Duration updates to match new size
- ✅ Time range updates

---

## Subscription Verification

### Check Real-time Subscriptions are Active

**Open Browser Console** (F12) → Console tab

**Look for these messages on page load:**
```
[Real-time] Tasks subscription status: SUBSCRIBED
[Real-time] Deep Work subscription status: SUBSCRIBED
[Real-time] Task Time Blocks subscription status: SUBSCRIBED ← NEW in Epic 6
```

**If you see these, real-time sync is working!**

### Check Supabase Dashboard

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Database** → **Replication**
4. You should see active subscriptions for `task_time_blocks`

---

## Troubleshooting

### Time blocks not syncing

**Check:**
1. Are both browser windows logged in with the same user?
2. Is there an error in the browser console?
3. Is the Supabase subscription active? (Check console for "SUBSCRIBED")
4. Try refreshing both pages and re-testing

**Common issues:**
- Network firewall blocking WebSocket connections
- Ad blocker interfering with Supabase real-time
- Browser tab backgrounded (some browsers throttle background tabs)

### Console shows subscription errors

**Look for:**
```
[Real-time] Task Time Blocks subscription status: CHANNEL_ERROR
```

**Solutions:**
- Check Supabase project status (not paused)
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`
- Check network connectivity
- Try logging out and back in

### Changes appear but slowly (> 1 second)

**Possible causes:**
- Network latency (normal on slow connections)
- Large number of time blocks (query refetch takes longer)
- Browser tab backgrounded

**Check:**
- Network tab in DevTools (check Supabase query times)
- Try on faster network connection
- Close other browser tabs

---

## Expected Performance

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Subscription connect | 100-500ms | On page load |
| INSERT detected | 100-300ms | Supabase → Client |
| Query refetch | 50-100ms | Client → Supabase |
| UI update | 10-50ms | React re-render |
| **Total user latency** | **150-400ms** | Create → Appears in other view |

**If you're seeing < 500ms, that's excellent!**
**If you're seeing > 1s, investigate network or query performance.**

---

## What to Look For (Success Indicators)

✅ **Real-time sync is working if:**
1. Console shows "SUBSCRIBED" for all 3 channels
2. Changes in Window A appear in Window B within 500ms
3. No errors in console
4. No page refresh required
5. Works bidirectionally (both directions)

❌ **Real-time sync has issues if:**
1. Console shows "CHANNEL_ERROR" or "TIMED_OUT"
2. Changes require manual page refresh
3. Changes appear only in one direction
4. Console errors related to Supabase or subscriptions

---

## Recommended Testing Schedule

**After deployment:**
- Day 1: Test all 4 scenarios above
- Week 1: Monitor for console errors during normal use
- Month 1: Check Supabase Dashboard for subscription metrics

**Ongoing:**
- Test sync after any Supabase schema changes
- Test sync after any hook modifications
- Test sync on different browsers (Chrome, Firefox, Safari)

---

## Next Steps After Verification

Once you've verified real-time sync is working:

1. ✅ Mark Epic 6 as production-ready
2. 📝 Document any performance issues encountered
3. 📊 Monitor Supabase real-time metrics in dashboard
4. 🎯 Plan future enhancements (Epic 7+)

---

## Support

**Questions or issues?**
- Check [EPIC-6-COMPLETION-SUMMARY.md](completed-epics/EPIC-6-COMPLETION-SUMMARY.md) for full implementation details
- Review [TIMEZONE-POLICY.md](TIMEZONE-POLICY.md) for date/time handling guidelines
- Check Supabase logs for server-side errors

**Happy syncing! 🎉**
