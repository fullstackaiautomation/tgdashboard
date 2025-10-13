import { useState } from 'react';
import type { FC } from 'react';
// import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { formatDateString } from '@/utils/dateHelpers';

interface DateTimePickerProps {
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  onSchedule: (date: string | null, time: string | null) => void;
  onClose: () => void;
}

/**
 * DateTimePicker - Compact calendar popup without modal wrapper
 */
export const DateTimePicker: FC<DateTimePickerProps> = ({
  scheduledDate,
  onSchedule,
  onClose,
}) => {
  // CRITICAL FIX: Create Date explicitly from components to avoid timezone issues
  let initialDate: Date | undefined = undefined;

  if (scheduledDate) {
    // Parse YYYY-MM-DD string into components
    const [year, month, day] = scheduledDate.split('-').map(Number);

    if (year && month && day) {
      // Create date in LOCAL timezone at start of day
      // This is the ONLY reliable way to ensure Calendar displays correctly
      initialDate = new Date(year, month - 1, day);

      console.log('🔍 DateTimePicker init:', {
        input: scheduledDate,
        parsed: { year, month, day },
        created: initialDate,
        check: initialDate.toLocaleDateString()
      });
    }
  }

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // Normalize to midnight local time for consistency
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    );

    // Format date as YYYY-MM-DD using local timezone
    const formattedDate = formatDateString(localDate);

    console.log('📅 DateTimePicker selected:', {
      originalDate: date,
      localDate,
      formattedDate,
      dateComponents: {
        year: localDate.getFullYear(),
        month: localDate.getMonth() + 1,
        day: localDate.getDate()
      },
      isoString: localDate.toISOString(),
      localString: localDate.toLocaleDateString()
    });

    setSelectedDate(localDate);
    onSchedule(formattedDate, null);
    onClose();
  };

  const handleClear = () => {
    onSchedule(null, null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute bg-gray-800 rounded-lg shadow-2xl border border-gray-700 p-3"
        onClick={(e) => e.stopPropagation()}
        style={{
          // Position near the click point (adjust as needed)
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          className="rounded-md"
        />

        {/* Clear button at bottom */}
        <div className="pt-2 border-t border-gray-700 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="w-full text-gray-400 hover:text-gray-200"
          >
            Clear Date
          </Button>
        </div>
      </div>
    </div>
  );
};
