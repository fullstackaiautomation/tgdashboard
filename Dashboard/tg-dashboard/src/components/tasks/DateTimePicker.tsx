import { useState } from 'react';
import type { FC } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateString, parseLocalDateForDisplay } from '@/utils/dateHelpers';

interface DateTimePickerProps {
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  onSchedule: (date: string | null, time: string | null) => void;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
  hoursProjected?: number | null;
}

/**
 * DateTimePicker - Dialog-based calendar picker with time selection (Kibo UI pattern)
 */
export const DateTimePicker: FC<DateTimePickerProps> = ({
  scheduledDate,
  scheduledTime,
  onSchedule,
  onClose,
  hoursProjected,
}) => {
  // Use the consistent date parsing helper for display
  const initialDate = parseLocalDateForDisplay(scheduledDate) || undefined;

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate);
  const [selectedTime, setSelectedTime] = useState<string>(scheduledTime || '09:00');
  const [hasTimeSelected, setHasTimeSelected] = useState<boolean>(!!scheduledTime);

  const handleSelectDate = (date: Date | undefined) => {
    if (!date) return;

    // Normalize to midnight local time for consistency
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0, 0, 0, 0
    );

    setSelectedDate(localDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(e.target.value);
  };

  const handleScheduleWithTime = () => {
    if (!selectedDate) return;

    // Format date as YYYY-MM-DD using local timezone
    const formattedDate = formatDateString(selectedDate);

    console.log('📅 DateTimePicker scheduled with time:', {
      date: formattedDate,
      time: selectedTime,
      hoursProjected,
    });

    onSchedule(formattedDate, selectedTime);
    onClose();
  };

  const handleScheduleDateOnly = () => {
    if (!selectedDate) return;

    // Format date as YYYY-MM-DD using local timezone
    const formattedDate = formatDateString(selectedDate);

    console.log('📅 DateTimePicker scheduled (date only):', {
      date: formattedDate,
    });

    onSchedule(formattedDate, null);
    onClose();
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setSelectedTime('09:00');
    setHasTimeSelected(false);
    onSchedule(null, null);
    onClose();
  };

  // Generate time slots in 12-hour format with AM/PM
  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
    const period = i < 12 ? 'AM' : 'PM';
    const hourStr = String(hour).padStart(2, '0');
    const displayTime = `${hourStr}:00 ${period}`;
    const militaryTime = `${String(i).padStart(2, '0')}:00`;
    return { display: displayTime, military: militaryTime };
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-3xl p-0 bg-slate-950 border-slate-800">
        <DialogHeader className="p-4 md:p-6 border-b border-slate-800">
          <DialogTitle className="text-white text-lg font-semibold">Book Appointment</DialogTitle>
        </DialogHeader>

        <div className="p-4 md:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 max-h-[70vh] overflow-y-auto">
          {/* Left: Calendar */}
          <div className="flex flex-col shrink-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              classNames={{
                caption_label: "text-slate-300 font-semibold text-sm",
                weekday: "text-slate-400 font-medium text-xs",
                today: "bg-slate-700 text-slate-100",
                outside: "text-slate-500",
                disabled: "text-slate-600 opacity-50",
              }}
            />
          </div>

          {/* Right: Time Selection */}
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Available Times</h3>
            <div className="grid grid-cols-2 gap-2 overflow-y-auto pr-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.military}
                  onClick={() => {
                    setSelectedTime(slot.military);
                    setHasTimeSelected(true);
                  }}
                  className={`px-2 py-1 text-xs font-medium transition-colors w-full ${
                    selectedTime === slot.military && hasTimeSelected
                      ? 'bg-white text-slate-900 hover:bg-gray-100'
                      : 'bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                  variant="ghost"
                >
                  {slot.display}
                </Button>
              ))}
            </div>

            {hoursProjected && hasTimeSelected && (
              <p className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-700">
                Duration: {hoursProjected} hour{hoursProjected !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-800 space-y-2">
          {selectedDate && hasTimeSelected && (
            <Button
              onClick={handleScheduleWithTime}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium border border-slate-700 text-sm"
            >
              Schedule at {selectedTime}
            </Button>
          )}
          {selectedDate && (
            <Button
              onClick={handleScheduleDateOnly}
              className={`w-full font-medium text-sm ${
                hasTimeSelected
                  ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                  : 'bg-white hover:bg-gray-100 text-slate-900'
              }`}
            >
              {hasTimeSelected ? 'Set Date Only' : 'Set Date'}
            </Button>
          )}
          <Button
            onClick={handleClear}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 font-medium text-sm"
          >
            Clear
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
