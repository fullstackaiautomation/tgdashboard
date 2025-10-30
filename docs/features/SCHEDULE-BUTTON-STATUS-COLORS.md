# Schedule Button Status Colors

**Feature**: Color-coded Schedule button to show task scheduling status
**Date**: October 15, 2025
**Status**: ✅ Complete

---

## Overview

Added visual feedback to task cards showing whether a task has been scheduled on the Master Calendar. The Schedule button now changes color and text based on three states:

1. **Blue "Schedule"** - Task not yet scheduled on calendar
2. **Yellow "Scheduled"** - Task has one or more time blocks on Master Calendar
3. **Green "Completed"** - Task is marked as complete (100% progress)

---

## Implementation

### Files Created

**[src/hooks/useTaskTimeBlocks.ts](../src/hooks/useTaskTimeBlocks.ts)**
- `useTaskHasTimeBlocks(taskId)` - Hook to check if task has any time blocks
- `useTaskTimeBlocks(taskId)` - Hook to get all time blocks for a task
- Query caching with 30-second stale time
- Real-time updates via React Query invalidation

### Files Modified

**[src/components/tasks/TaskCard.tsx](../src/components/tasks/TaskCard.tsx)**
- Added `useTaskHasTimeBlocks` import and usage
- Added Schedule Status Button in compact badges section
- Color logic:
  ```typescript
  isCompleted ? 'bg-green-600 text-white' :
  hasTimeBlocks ? 'bg-yellow-500 text-gray-900' :
  'bg-blue-600 text-white'
  ```

**[src/components/calendar/TaskScheduler.tsx](../src/components/calendar/TaskScheduler.tsx)**
- Added `useTaskHasTimeBlocks` import
- Updated `DraggableTaskCard` component to use color-coded buttons
- Same color logic as TaskCard (blue → yellow → green)
- Completed tasks show green "Completed" button (disabled)

---

## Button States

### State 1: Not Scheduled (Blue)

**Appearance**: Blue background, white text
**Text**: "Schedule"
**Condition**: `!isCompleted && !hasTimeBlocks`
**Meaning**: Task has no time blocks scheduled on Master Calendar

### State 2: Scheduled (Yellow)

**Appearance**: Yellow background, dark gray text
**Text**: "Scheduled"
**Condition**: `!isCompleted && hasTimeBlocks`
**Meaning**: Task has at least one time block on Master Calendar
**Real-time**: Changes to yellow immediately when time block is created

### State 3: Completed (Green)

**Appearance**: Green background, white text
**Text**: "Completed"
**Condition**: `isCompleted` (progress === 100)
**Meaning**: Task is marked as complete
**Priority**: Overrides scheduled state (completed tasks always show green)

---

## User Workflow

1. **Create task** → Blue "Schedule" button appears
2. **Drag task to Master Calendar** → Button changes to Yellow "Scheduled" within 500ms
3. **Mark task complete** → Button changes to Green "Completed"

**Reverse workflow:**
- Delete time block from calendar → Yellow "Scheduled" changes back to Blue "Schedule"
- Unmark task as complete → Green "Completed" changes back to Yellow "Scheduled" (if has time blocks) or Blue "Schedule" (if no time blocks)

---

## Real-time Sync

The button updates automatically via Epic 6's real-time sync:

1. **User creates time block** → Supabase INSERT event
2. **useRealtimeSync invalidates** → `task-has-time-blocks` query
3. **useTaskHasTimeBlocks refetches** → Returns `true`
4. **TaskCard re-renders** → Button changes to yellow "Scheduled"

**Latency**: ~150-400ms (same as Epic 6 real-time sync)

---

## Code Example

```typescript
// Hook usage in TaskCard.tsx
const { data: hasTimeBlocks = false } = useTaskHasTimeBlocks(task.id);

// Button rendering
<Button
  variant="ghost"
  size="sm"
  disabled
  className={`h-6 px-3 text-xs font-medium rounded-md ${
    isCompleted
      ? 'bg-green-600 text-white cursor-default'
      : hasTimeBlocks
      ? 'bg-yellow-500 text-gray-900 cursor-default'
      : 'bg-blue-600 text-white cursor-default'
  }`}
>
  {isCompleted ? 'Completed' : hasTimeBlocks ? 'Scheduled' : 'Schedule'}
</Button>
```

---

## Query Optimization

**Query Key**: `['task-has-time-blocks', taskId]`
**Stale Time**: 30 seconds
**Strategy**: Check existence only (LIMIT 1)
**Performance**: Very fast - single row lookup with index on `task_id`

**Database Query**:
```sql
SELECT id FROM task_time_blocks
WHERE task_id = $1
LIMIT 1;
```

**Result**: Boolean (`true` if rows found, `false` otherwise)

---

## Testing

### Manual Testing Checklist

- [x] Blue "Schedule" button shows on new task
- [x] Yellow "Scheduled" button shows when time block created
- [x] Green "Completed" button shows when task marked complete
- [x] Button updates in real-time (< 500ms)
- [x] Build passes with no errors

### Test Scenarios

**Scenario 1: Schedule task**
1. Create new task
2. Verify blue "Schedule" button
3. Drag to Master Calendar
4. Verify button changes to yellow "Scheduled" within 500ms

**Scenario 2: Complete scheduled task**
1. Task with yellow "Scheduled" button
2. Mark task as complete (100% progress)
3. Verify button changes to green "Completed"

**Scenario 3: Unschedule task**
1. Task with yellow "Scheduled" button
2. Delete time block from Master Calendar
3. Verify button changes back to blue "Schedule" within 500ms

---

## Build Status

```
✓ 3195 modules transformed
✓ Built in 11.22s
✓ No TypeScript errors
```

---

## Integration with Epic 6

This feature builds on Epic 6's real-time sync infrastructure:

- Uses same `useRealtimeSync` subscription for `task_time_blocks`
- Leverages React Query invalidation on time block changes
- Consistent <500ms update latency
- No additional subscriptions needed

---

## Future Enhancements

Potential improvements:

- [ ] Click button to jump to Master Calendar and highlight time blocks
- [ ] Show time block count (e.g., "Scheduled (3)")
- [ ] Show next scheduled time (e.g., "Scheduled: Tomorrow 9am")
- [ ] Add animation/transition when button changes color
- [ ] Add tooltip showing all scheduled times on hover

---

## Summary

Successfully implemented color-coded Schedule button that provides instant visual feedback on task scheduling status. The feature integrates seamlessly with Epic 6's real-time sync and requires zero additional subscriptions or database queries beyond the lightweight existence check.

**User benefit**: At a glance, users can see which tasks are scheduled, which need scheduling, and which are completed, without having to open the Master Calendar.

---

**Completed by**: Claude Code
**Date**: October 15, 2025
**Build Status**: ✅ Passing
