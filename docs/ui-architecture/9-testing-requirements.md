# 9. Testing Requirements

### Testing Strategy: Manual Testing with Convenience Methods

Per PRD requirements, this project uses **manual testing** instead of automated test suites.

### Development Test Helpers

```typescript
// src/utils/testHelpers.ts

export async function seedTestData() {
  const { data: { user } } = await supabase.auth.getUser();
  // Seed businesses, projects, tasks...
  console.log('✅ Test data seeded successfully');
}

export async function clearTestData() {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('tasks').delete().eq('user_id', user.id);
  console.log('✅ Test data cleared');
}

export async function debugState() {
  const { data: tasks } = await supabase.from('tasks').select('*');
  console.log('🔍 Current Database State', tasks);
}

export async function testSyncLatency(taskId: string) {
  const startTime = performance.now();
  await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId);
  // Measure real-time sync latency...
  console.log(`⏱️ Sync latency: ${latency}ms`);
}
```

### Browser Console Access (Development Only)

```typescript
// src/main.tsx
if (import.meta.env.DEV) {
  import('./utils/testHelpers').then((helpers) => {
    (window as any).__test = {
      seedData: helpers.seedTestData,
      clearData: helpers.clearTestData,
      debug: helpers.debugState,
      testSync: helpers.testSyncLatency,
    };
  });
}

// Usage in browser console:
// __test.seedData()
// __test.debug()
// __test.testSync('task-id')
```

### Manual Testing Workflow

1. **Feature Testing:** Execute feature → Verify across affected pages → Check console for errors
2. **Cross-Page Sync:** Test in 2+ tabs → Verify real-time updates → Measure sync latency (<500ms)
3. **Data Integrity:** CRUD operations → Verify with `__test.debug()` → Check for orphaned records
4. **Performance:** Seed 100+ tasks → Measure page load (<2s) → Monitor React Query cache
5. **Security Checklist:** GitHub secret scan → DevTools network inspection → RLS policy verification
6. **Edge Cases:** Empty states, loading states, error states, concurrent edits, overdue tasks

---
