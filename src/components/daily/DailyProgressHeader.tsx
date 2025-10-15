/**
 * DailyProgressHeader - Daily progress overview with ring indicator
 * Story 2.5: Daily Goals Progress Tracking (Task 2)
 */

import type { FC } from 'react';
import { format } from 'date-fns';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { useDailyStreak } from '@/hooks/useDailyStreak';
import { ProgressRing } from '@/components/shared/ProgressRing';
import { Flame } from 'lucide-react';

interface DailyProgressHeaderProps {
  date?: Date;
  className?: string;
}

/**
 * Get motivational message based on progress
 */
const getMotivationalMessage = (progress: number | null): string => {
  if (progress === null) return "No tasks planned today";
  if (progress === 0) return "Let's get started!";
  if (progress < 34) return "Good start, keep going!";
  if (progress < 67) return "Good progress, keep going!";
  if (progress < 100) return "Almost there!";
  return "All done! Great work!";
};

/**
 * DailyProgressHeader - Shows daily completion ring and streak
 * Displays large progress ring, percentage, motivational message, and streak indicator
 *
 * @param date - Date to show progress for (defaults to today)
 */
export const DailyProgressHeader: FC<DailyProgressHeaderProps> = ({
  date = new Date(),
  className = '',
}) => {
  const { data: dailyProgress, isLoading: progressLoading } = useDailyProgress(date);
  const { data: streak, isLoading: streakLoading } = useDailyStreak();

  if (progressLoading) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-48 h-48 bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const progress = dailyProgress?.dailyProgress ?? 0;
  const hasStreak = !streakLoading && streak && streak.streakActive && streak.currentStreak > 0;

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Progress Ring */}
        <div className="flex-shrink-0">
          <ProgressRing progress={progress}>
            <div className="text-center">
              <div className="text-4xl font-bold text-white">
                {progress.toFixed(0)}%
              </div>
              {dailyProgress && dailyProgress.totalCount > 0 && (
                <div className="text-sm text-gray-400 mt-1">
                  {dailyProgress.completedCount} of {dailyProgress.totalCount}
                </div>
              )}
            </div>
          </ProgressRing>
        </div>

        {/* Progress Details */}
        <div className="flex-1 text-center md:text-left">
          {/* Date */}
          <div className="text-sm text-gray-400 uppercase mb-1">
            {format(date, 'EEEE, MMMM d, yyyy')}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Daily Progress
          </h2>

          {/* Motivational Message */}
          <p className={`text-lg mb-4 ${
            progress === null || progress === 0 ? 'text-gray-400' :
            progress < 33 ? 'text-red-400' :
            progress < 67 ? 'text-yellow-400' :
            progress < 100 ? 'text-green-400' :
            'text-green-400'
          }`}>
            {getMotivationalMessage(progress)}
          </p>

          {/* Streak Indicator */}
          {hasStreak && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-950/30 border border-orange-500 rounded-lg">
              <Flame className="text-orange-500" size={20} />
              <span className="text-orange-300 font-semibold">
                {streak!.currentStreak}-day streak!
              </span>
              {streak!.currentStreak === streak!.longestStreak && streak!.longestStreak > 1 && (
                <span className="text-xs text-orange-400 ml-2">
                  (Personal best!)
                </span>
              )}
            </div>
          )}

          {/* No Tasks Message */}
          {dailyProgress?.totalCount === 0 && (
            <div className="text-sm text-gray-500 mt-2">
              No tasks scheduled for today. Take a break or add some tasks!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
