/**
 * DailyTime - Side-by-side view of planned vs actual time
 *
 * Left side: Daily Schedule (planned time blocks from task_time_blocks)
 * Right side: Deep Work Log (actual time spent - both productive and non-productive)
 */

import { type FC, useState } from 'react';
import { format, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyScheduleView } from '@/components/daily-time/DailyScheduleView';
import { DeepWorkLogView } from '@/components/daily-time/DeepWorkLogView';

export const DailyTime: FC = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));

  const handlePrevDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() - 1);
      return startOfDay(newDate);
    });
  };

  const handleNextDay = () => {
    setSelectedDate((prev) => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + 1);
      return startOfDay(newDate);
    });
  };

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CalendarIcon className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold">Daily Time Tracker</h1>
              <p className="text-gray-400">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-300" />
            </button>
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left: Planned Schedule */}
        <DailyScheduleView selectedDate={selectedDate} />

        {/* Right: Deep Work Log (Actual) */}
        <DeepWorkLogView selectedDate={selectedDate} />
      </div>
    </div>
  );
};
