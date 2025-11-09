import * as React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { formatDateString, parseLocalDate } from '@/utils/dateHelpers';

interface CalendarDialogProps {
  value: string | null;
  onChange: (date: string | null) => void;
  label?: string;
  placeholder?: string;
  disableFutureDates?: boolean;
}

export const CalendarDialog: React.FC<CalendarDialogProps> = ({
  value,
  onChange,
  label = 'Select Date',
  placeholder = 'Pick a date',
  disableFutureDates = true,
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? parseLocalDate(value) : undefined;

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD in local timezone (not UTC)
      const formatted = formatDateString(date);
      onChange(formatted);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal text-xs bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700 hover:text-gray-200"
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {value ? formatDateString(parseLocalDate(value) || new Date()) : placeholder}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          className="z-50 rounded-md border border-gray-700 bg-gray-900 p-3 shadow-lg"
          sideOffset={4}
          align="start"
        >
          <Calendar
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            disabled={disableFutureDates ? (date) => date > new Date() : undefined}
            className="text-xs [--cell-size:2rem] [&_.rdp-caption_label]:text-gray-200 [&_.rdp-button_previous]:text-gray-400 [&_.rdp-button_next]:text-gray-400 [&_.rdp-button]:text-gray-300 [&_.rdp-months]:text-gray-300 [&_.rdp-weekday]:text-gray-400"
          />
          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
            className="w-full mt-3 text-xs bg-gray-800 text-red-400 border-gray-600 hover:bg-gray-700 hover:text-red-300"
          >
            Clear Date
          </Button>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
};
