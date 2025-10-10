import { useState } from 'react';
import type { FC } from 'react';
// import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';

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
  const initialDate = scheduledDate ? new Date(scheduledDate) : undefined;
  const [selectedDate, _setSelectedDate] = useState<Date | undefined>(initialDate);

  const handleSelect = (date: Date | undefined) => {
    if (!date) return;

    // Format date as YYYY-MM-DD using local timezone (not UTC)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    console.log('📅 DateTimePicker selected:', { date, formattedDate });
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
