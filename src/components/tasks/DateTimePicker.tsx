import { useState, useEffect } from 'react';
import type { FC } from 'react';
// import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { formatDateString, parseLocalDateForDisplay } from '@/utils/dateHelpers';
import styles from './DateTimePicker.module.css';

interface DateTimePickerProps {
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  onSchedule: (date: string | null, time: string | null) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

/**
 * DateTimePicker - Compact calendar popup without modal wrapper
 */
export const DateTimePicker: FC<DateTimePickerProps> = ({
  scheduledDate,
  onSchedule,
  onClose,
  anchorEl,
}) => {
  // Calculate position based on anchor element
  const [position, setPosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });

  useEffect(() => {
    if (anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPosition({
        top: `${rect.bottom + 8}px`,
        left: `${rect.left}px`,
        transform: 'none',
      });
    }
  }, [anchorEl]);

  // Use the consistent date parsing helper for display
  // Convert null to undefined for useState compatibility
  const initialDate = parseLocalDateForDisplay(scheduledDate) || undefined;

  if (initialDate) {
    console.log('🔍 DateTimePicker init:', {
      input: scheduledDate,
      created: initialDate,
      check: initialDate.toLocaleDateString()
    });
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
        className={styles.calendarContainer}
        onClick={(e) => e.stopPropagation()}
        style={position}
      >
        <div className={styles.calendarWrapper}>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
};
