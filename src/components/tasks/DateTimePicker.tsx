import { useState } from 'react';
import type { FC } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
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
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

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

  // Convert 24-hour format to 12-hour format for display
  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const hour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const period = hours < 12 ? 'AM' : 'PM';
    return `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Convert 12-hour format back to 24-hour format
  const convertTo24Hour = (time12: string): string | null => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;

    let [, hours, minutes, period] = match;
    let hour = parseInt(hours, 10);
    const min = minutes;

    if (period.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${min}`;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-sm p-0 bg-slate-950 border-slate-800 rounded-lg">
        <div className="p-4 flex flex-col gap-4">
          {/* Calendar */}
          <div className="flex flex-col shrink-0">
            <style>{`
              [role="presentation"] .rdp-caption {
                display: flex !important;
                justify-content: space-between !important;
                align-items: center !important;
                height: auto !important;
                gap: 0 !important;
              }
              [role="presentation"] .rdp-caption_label {
                display: flex !important;
                align-items: center !important;
              }
              [role="presentation"] .rdp-head_cell {
                width: 28px !important;
                height: 28px !important;
              }
              [role="presentation"] .rdp-cell {
                width: 28px !important;
                height: 28px !important;
              }
              [role="presentation"] .rdp-day {
                width: 28px !important;
                height: 28px !important;
              }
              [role="presentation"] .rdp-button {
                width: 28px !important;
                height: 28px !important;
                padding: 0 !important;
              }
            `}</style>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelectDate}
              classNames={{
                root: "w-full",
                months: "w-full space-y-0",
                month: "space-y-0 w-full",
                caption: "flex justify-between items-center mb-4 px-0",
                caption_label: "text-slate-200 font-semibold text-base flex items-center",
                head_row: "grid grid-cols-7 gap-2 mb-3",
                head_cell: "text-slate-400 font-medium text-xs w-7 text-center",
                row: "grid grid-cols-7 gap-2",
                cell: "w-7 h-7 text-center",
                day: "w-7 h-7 flex items-center justify-center text-slate-300 text-sm rounded-md hover:bg-slate-700 cursor-pointer transition-colors",
                day_today: "bg-slate-700 text-slate-100 font-medium",
                day_outside: "text-slate-600",
                day_disabled: "text-slate-600 opacity-50 cursor-not-allowed",
                day_selected: "bg-blue-600 text-white font-semibold hover:bg-blue-700",
                button_previous: "text-slate-400 hover:text-slate-200 h-7 w-7 p-0 flex items-center justify-center text-base font-bold",
                button_next: "text-slate-400 hover:text-slate-200 h-7 w-7 p-0 flex items-center justify-center text-base font-bold",
              }}
            />
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleClear}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-sm py-2 h-auto rounded-md"
            >
              Clear
            </Button>
            <Button
              onClick={handleScheduleDateOnly}
              disabled={!selectedDate}
              className={`w-full font-medium text-sm py-2 h-auto rounded-md ${
                selectedDate
                  ? 'bg-white hover:bg-gray-100 text-slate-900'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              Set Date Only
            </Button>
          </div>

          {/* Time Input & Picker - Calendar Standard 4 Style */}
          <div className="space-y-3">
            <button
              onClick={() => setShowTimePicker(!showTimePicker)}
              className="w-full flex items-center gap-2 bg-slate-900/30 rounded-lg px-4 py-3 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => {
                  e.stopPropagation();
                  setSelectedTime(e.target.value);
                  setHasTimeSelected(true);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent text-slate-200 font-medium outline-none cursor-pointer"
              />
              <div className="text-white text-lg">
                🕐
              </div>
            </button>

            {/* Three-Column Time Picker - Dropdown */}
            {showTimePicker && (
            <div className="flex gap-3 rounded-lg border border-slate-700 bg-slate-900/30 p-3">
              {/* Hour Column - 12-hour format */}
              <ScrollArea className="h-24 flex-1 rounded-lg bg-slate-800/50">
                <div className="flex flex-col gap-2 p-2">
                  {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((displayHour) => {
                    let hour24 = displayHour === 12 ? 0 : displayHour;
                    const [currentHour] = selectedTime.split(':').map(Number);
                    const currentDisplay = currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour;
                    const isSelected = currentDisplay === displayHour;
                    const hour = String(hour24).padStart(2, '0');

                    return (
                      <button
                        key={`hour-${displayHour}`}
                        onClick={() => {
                          const [, minutes] = selectedTime.split(':');
                          const [, period] = selectedTime.split(':');
                          const [currentHourStr] = selectedTime.split(':');
                          const currentPeriod = parseInt(currentHourStr) < 12 ? 'AM' : 'PM';

                          let newHour = hour24;
                          if (currentPeriod === 'PM' && displayHour !== 12) {
                            newHour = displayHour + 12;
                          } else if (currentPeriod === 'AM' && displayHour === 12) {
                            newHour = 0;
                          }

                          setSelectedTime(`${String(newHour).padStart(2, '0')}:${minutes}`);
                          setHasTimeSelected(true);
                        }}
                        className={`py-2 px-3 rounded text-sm font-semibold transition-colors w-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {displayHour}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Minute Column - 15 min intervals */}
              <ScrollArea className="h-24 flex-1 rounded-lg bg-slate-800/50">
                <div className="flex flex-col gap-2 p-2">
                  {['00', '15', '30', '45'].map((minute) => {
                    const isSelected = selectedTime.split(':')[1] === minute;

                    return (
                      <button
                        key={`minute-${minute}`}
                        onClick={() => {
                          const [hours] = selectedTime.split(':');
                          setSelectedTime(`${hours}:${minute}`);
                          setHasTimeSelected(true);
                        }}
                        className={`py-2 px-3 rounded text-sm font-semibold transition-colors w-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {minute}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* AM/PM Column */}
              <ScrollArea className="h-24 flex-1 rounded-lg bg-slate-800/50">
                <div className="flex flex-col gap-2 p-2">
                  {['AM', 'PM'].map((period) => {
                    const [hours] = selectedTime.split(':').map(Number);
                    const currentPeriod = hours < 12 ? 'AM' : 'PM';
                    const isSelected = currentPeriod === period;

                    return (
                      <button
                        key={period}
                        onClick={() => {
                          let [hours, minutes] = selectedTime.split(':').map(Number);
                          if (period === 'PM' && hours < 12) {
                            hours += 12;
                          } else if (period === 'AM' && hours >= 12) {
                            hours -= 12;
                          }
                          setSelectedTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
                          setHasTimeSelected(true);
                        }}
                        className={`py-2 px-3 rounded text-sm font-semibold transition-colors w-full ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
            )}
          </div>
        </div>

        {selectedDate && hasTimeSelected && (
          <div className="px-4 pb-4">
            <Button
              onClick={handleScheduleWithTime}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2 h-auto rounded-md"
            >
              Schedule at {formatTime12Hour(selectedTime)}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
