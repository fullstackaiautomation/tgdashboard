import { useState } from 'react';
import type { FC } from 'react';
import { Calendar, Clock, X } from 'lucide-react';

interface DateTimePickerProps {
  scheduledDate?: string | null;
  scheduledTime?: string | null;
  onSchedule: (date: string | null, time: string | null) => void;
  onClose: () => void;
}

/**
 * DateTimePicker - Component for scheduling tasks to specific dates and times
 */
export const DateTimePicker: FC<DateTimePickerProps> = ({
  scheduledDate,
  scheduledTime,
  onSchedule,
  onClose,
}) => {
  const [date, setDate] = useState(scheduledDate || '');
  const [time, setTime] = useState(scheduledTime || '');

  const handleSave = () => {
    onSchedule(date || null, time || null);
    onClose();
  };

  const handleClear = () => {
    onSchedule(null, null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-lg shadow-xl p-6 w-96 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Schedule Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Picker */}
        <div className="space-y-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Calendar className="w-4 h-4" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Time Picker */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Clock className="w-4 h-4" />
              Time (optional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClear}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
