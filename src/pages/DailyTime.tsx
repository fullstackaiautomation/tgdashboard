/**
 * DailyTime - Daily progress tracking with planned vs actual time
 *
 * Top: Daily progress overview (Story 2.5)
 * Middle: Side-by-side view of planned vs actual time
 * Bottom: End of day summary (appears after 6pm)
 */

import { type FC, useState } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyScheduleView } from '@/components/daily-time/DailyScheduleView';
import { DeepWorkLogView } from '@/components/daily-time/DeepWorkLogView';
import { DailyProgressHeader } from '@/components/daily/DailyProgressHeader';
import { DueTodayCard } from '@/components/daily/DueTodayCard';
import { TimeAllocation } from '@/components/daily/TimeAllocation';
import { EndOfDaySummary } from '@/components/daily/EndOfDaySummary';
import { useDeepWorkProgress } from '@/hooks/useDeepWorkProgress';
import { ProgressBar } from '@/components/shared/ProgressBar';

export const DailyTime: FC = () => {
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const { data: deepWorkProgress } = useDeepWorkProgress(selectedDate);

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

  const handlePlanTomorrow = () => {
    setSelectedDate(startOfDay(addDays(new Date(), 1)));
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

      {/* Daily Progress Overview (Story 2.5) */}
      <div className="mb-6">
        <DailyProgressHeader date={selectedDate} />
      </div>

      {/* Top Row: Due Today Card + Deep Work Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Due Today Card */}
        <DueTodayCard date={selectedDate} />

        {/* Deep Work Progress Card */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-bold text-white mb-4">Deep Work Progress</h3>

          {deepWorkProgress && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {deepWorkProgress.hoursWorked.toFixed(1)}h of {deepWorkProgress.hoursGoal.toFixed(1)}h goal
                </span>
                <span className={`text-sm font-semibold ${
                  deepWorkProgress.deepWorkProgress < 33 ? 'text-red-400' :
                  deepWorkProgress.deepWorkProgress < 67 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {deepWorkProgress.deepWorkProgress.toFixed(0)}%
                </span>
              </div>
              <ProgressBar progress={deepWorkProgress.deepWorkProgress} size="md" showLabel={false} />

              <div className="mt-4 text-sm text-gray-500">
                {deepWorkProgress.deepWorkProgress >= 100 ? (
                  <p className="text-green-400">✅ Goal achieved! Great work!</p>
                ) : deepWorkProgress.deepWorkProgress >= 80 ? (
                  <p className="text-yellow-400">Almost there! Keep going!</p>
                ) : (
                  <p>{(deepWorkProgress.hoursGoal - deepWorkProgress.hoursWorked).toFixed(1)}h remaining to reach goal</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Time Allocation */}
      <div className="mb-6">
        <TimeAllocation date={selectedDate} />
      </div>

      {/* Side-by-side layout: Planned Schedule vs Deep Work Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: Planned Schedule */}
        <DailyScheduleView selectedDate={selectedDate} />

        {/* Right: Deep Work Log (Actual) */}
        <DeepWorkLogView selectedDate={selectedDate} />
      </div>

      {/* End of Day Summary (only visible after 6pm) */}
      <EndOfDaySummary date={selectedDate} onPlanTomorrow={handlePlanTomorrow} />
    </div>
  );
};
