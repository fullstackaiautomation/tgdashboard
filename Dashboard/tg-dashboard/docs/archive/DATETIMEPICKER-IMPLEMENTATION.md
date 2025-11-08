# DateTimePicker Implementation Reference

## Overview
A professional "Book Appointment" style date/time picker dialog inspired by Kibo UI patterns. This component enables users to select a date and optional time for task scheduling, with automatic time block creation integration.

## Files Modified

### 1. `src/components/tasks/DateTimePicker.tsx`
**Main component file** - Contains the dialog UI and state management

#### Key Features:
- Dialog-based interface with dark slate-950 theme
- Responsive layout (stacks on mobile, side-by-side on desktop)
- 24-hour time slots displayed in 12-hour AM/PM format
- Automatic time block creation when time is selected
- Duration display showing hours_projected

#### Dialog Styling:
```
Width: w-[95vw] max-w-3xl (95% viewport, max 48rem)
Background: bg-slate-950
Border: border-slate-800
```

#### Layout:
- **Desktop (lg+)**: Calendar left, 2-column time grid right
  - Gap: `lg:gap-6`
  - Flex direction: `lg:flex-row`
- **Mobile**: Stacks vertically
  - Gap: `gap-4`
  - Flex direction: `flex-col`

#### Calendar Section:
```tsx
classNames={{
  caption_label: "text-slate-300 font-semibold text-sm",
  weekday: "text-slate-400 font-medium text-xs",
  today: "bg-slate-700 text-slate-100",
  outside: "text-slate-500",
  disabled: "text-slate-600 opacity-50",
}}
```

#### Time Slots:
- Grid layout: `grid grid-cols-2 gap-2`
- Button sizing: `px-2 py-1 text-xs w-full`
- Max height scrollable: `max-h-80 overflow-y-auto`
- Color states:
  - Selected: `bg-white text-slate-900 hover:bg-gray-100`
  - Unselected: `bg-slate-900 border border-slate-700 text-slate-300`

#### Action Buttons:
- **"Schedule at [TIME]"**: Conditionally shown when both date and time selected
- **"Set Date Only"**: Shows when date selected (label changes based on time selection)
- **"Clear"**: Always available, resets all selections

#### State Management:
```typescript
const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
const [selectedTime, setSelectedTime] = useState<string>(scheduledTime || '09:00');
const [hasTimeSelected, setHasTimeSelected] = useState<boolean>(!!scheduledTime);
```

#### Time Slot Generation:
```typescript
const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
  const period = i < 12 ? 'AM' : 'PM';
  const hourStr = String(hour).padStart(2, '0');
  const displayTime = `${hourStr}:00 ${period}`;
  const militaryTime = `${String(i).padStart(2, '0')}:00`;
  return { display: displayTime, military: militaryTime };
});
```

---

### 2. `src/components/ui/calendar.tsx`
**Calendar component wrapper** - Provides styling overrides for react-day-picker

#### Changes Made:
- **Cell size**: Changed from `2rem` to `3rem` (32px → 48px)
- **Background**: Changed from `bg-background` to `bg-transparent`
- **CalendarDayButton styling**: Updated to use dark slate colors

#### Calendar Day Button Colors:
```typescript
className={cn(
  "data-[selected-single=true]:bg-white data-[selected-single=true]:text-slate-900 " +
  "data-[range-middle=true]:bg-slate-700 data-[range-middle=true]:text-slate-100 " +
  "data-[range-start=true]:bg-white data-[range-start=true]:text-slate-900 " +
  "data-[range-end=true]:bg-white data-[range-end=true]:text-slate-900 " +
  "text-slate-300 hover:bg-slate-800 hover:text-slate-100 " +
  // ... additional styling
)}
```

---

### 3. `src/components/tasks/TaskCard.tsx`
**Task card component** - Integrates DateTimePicker and time block creation

#### New Imports:
```typescript
import { useCreateTimeBlock } from '../../hooks/useCalendar';
import { DateTimePicker } from './DateTimePicker';
```

#### Key Function: `handleScheduleChange`
Handles both date-only and date+time scheduling:

```typescript
const handleScheduleChange = async (date: string | null, time: string | null) => {
  if (!date) {
    handleUpdate({ due_date: undefined });
    return;
  }

  // Parse YYYY-MM-DD and create local date at noon
  const [year, month, day] = date.split('-').map(Number);
  const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);

  // Update due date
  handleUpdate({ due_date: localDate.toISOString() });

  // If time selected, create time block
  if (time && task.hours_projected) {
    const [hours, minutes] = time.split(':').map(Number);
    const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    // Calculate end time
    const endDate = new Date(year, month - 1, day, hours, minutes);
    endDate.setHours(endDate.getHours() + task.hours_projected);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;

    // Create time block
    await createTimeBlock.mutateAsync({
      taskId: task.id,
      scheduledDate: localDate,
      startTime,
      endTime,
      plannedDurationMinutes: Math.round(task.hours_projected * 60),
    });
  }
};
```

#### DateTimePicker Integration:
```tsx
{showDateTimePicker && (
  <DateTimePicker
    scheduledDate={task.due_date}
    scheduledTime={null}
    onSchedule={handleScheduleChange}
    onClose={() => setShowDateTimePicker(false)}
    hoursProjected={task.hours_projected}
  />
)}
```

---

## Color Scheme (Dark Theme)

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Dialog Background | Very Dark Gray | `bg-slate-950` |
| Button Background | Dark Gray | `bg-slate-900` |
| Borders | Darker Gray | `border-slate-800` / `border-slate-700` |
| Primary Text | Light Gray | `text-slate-300` |
| Secondary Text | Medium Gray | `text-slate-400` |
| Highlight Text | Near White | `text-slate-100` |
| Selected Items | Pure White | `bg-white text-slate-900` |
| Today Indicator | Medium Gray | `bg-slate-700` |
| Disabled Text | Darkest Gray | `text-slate-600` |

---

## Usage Example

```tsx
// In parent component
const [showDateTimePicker, setShowDateTimePicker] = useState(false);

const handleSchedule = async (date: string | null, time: string | null) => {
  // Handle date/time selection
  // Creates time blocks if time selected and hours_projected exists
};

// Render picker
{showDateTimePicker && (
  <DateTimePicker
    scheduledDate={task.due_date}
    scheduledTime={null}
    onSchedule={handleSchedule}
    onClose={() => setShowDateTimePicker(false)}
    hoursProjected={task.hours_projected || null}
  />
)}
```

---

## Props Interface

```typescript
interface DateTimePickerProps {
  scheduledDate?: string | null;      // YYYY-MM-DD format
  scheduledTime?: string | null;      // HH:MM format (24-hour)
  onSchedule: (date: string | null, time: string | null) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;      // Unused - kept for compatibility
  hoursProjected?: number | null;     // Duration for time block creation
}
```

---

## Responsive Behavior

### Desktop (lg breakpoint and up)
- Dialog: 48rem max width, 95vw actual width
- Layout: Side-by-side (calendar left, times right)
- Calendar: Full size with 3rem cells
- Time grid: 2-column layout

### Mobile (below lg)
- Dialog: 95vw full width
- Layout: Stacked vertically
- Calendar: Full width, scrollable
- Time grid: 2-column layout (scrollable)

---

## Date/Time Handling

### Date Format
- **Input/Output**: YYYY-MM-DD (e.g., "2025-11-04")
- **Internal**: JavaScript Date objects (midnight local time)
- **Storage**: ISO 8601 format in database

### Time Format
- **Display**: 12-hour AM/PM (e.g., "02:00 PM")
- **Internal**: 24-hour military (e.g., "14:00")
- **Storage**: HH:MM:SS format (e.g., "14:00:00")

### Time Block Calculation
When both date and time are selected:
1. Parse start time (e.g., 14:00)
2. Add hours_projected to get end time (e.g., +2 hours = 16:00)
3. Handle day boundary wrapping (e.g., 23:00 + 2 hours = 01:00 next day)
4. Create time_block record with start_time and end_time

---

## Integration Points

### Related Hooks
- `useCreateTimeBlock()` - Creates time blocks in database
- `useUpdateTask()` - Updates task due_date
- `useTaskTimeBlocks()` - Fetches existing time blocks

### Related Components
- `TaskCard` - Parent component that renders DateTimePicker
- `Calendar` - react-day-picker wrapper
- Shadcn UI: `Dialog`, `Button`, `DialogHeader`, `DialogTitle`

---

## Browser Compatibility
- Modern browsers supporting ES2020+
- Date/time formatting uses native Intl API
- CSS Grid and Flexbox for layout

---

## Notes
- All dates are handled in local timezone
- Time blocks are automatically created with calculated duration
- Selected dates show white background for clear visibility
- Hover states provide visual feedback on all interactive elements
- Dialog can be closed by clicking outside or using the close button
