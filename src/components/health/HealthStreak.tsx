import { type FC } from 'react';
import { Flame, Trophy, Target } from 'lucide-react';
import { useHealthTimeStreak } from '@/hooks/useHealthTimeMonitoring';

/**
 * HealthStreak - Displays consecutive weeks meeting health target
 *
 * Features:
 * - Shows current streak with flame icon
 * - Progress bar with milestone markers (4, 8, 12 weeks)
 * - Celebration for reaching milestones
 * - Motivational messaging for positive reinforcement
 */
export const HealthStreak: FC = () => {
  const { data: streak, isLoading } = useHealthTimeStreak();

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg shadow p-6 border border-orange-700/50 animate-pulse">
        <div className="h-12 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (streak === undefined || streak === null) {
    return null;
  }

  const milestones = [4, 8, 12];
  const nextMilestone = milestones.find(m => m > streak) || 12;
  const weeksToNext = nextMilestone - streak;

  // Determine celebration level
  const isCelebrating = streak >= 4;
  const celebrationIcon =
    streak >= 12 ? '🎆' :
    streak >= 8 ? '🎉' :
    streak >= 4 ? '⭐' :
    null;

  return (
    <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg shadow p-6 border border-orange-700/50">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <div>
              <div className="text-4xl font-bold text-orange-400">
                {streak}
              </div>
              <div className="text-sm text-gray-400">
                {streak === 1 ? 'week' : 'weeks'}
              </div>
            </div>
          </div>
          <p className="text-gray-300 font-medium">
            Consecutive weeks meeting health target
          </p>
        </div>

        {isCelebrating && celebrationIcon && (
          <div className="text-5xl animate-bounce">
            {celebrationIcon}
          </div>
        )}
      </div>

      {/* Milestone Progress */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Milestones</span>
          {streak < 12 && (
            <span>{weeksToNext} {weeksToNext === 1 ? 'week' : 'weeks'} to {nextMilestone} weeks</span>
          )}
        </div>

        <div className="flex gap-2">
          {milestones.map((milestone, index) => {
            const isReached = streak >= milestone;
            const isCurrent = streak < milestone && (index === 0 || streak >= milestones[index - 1]);

            return (
              <div key={milestone} className="flex-1">
                <div
                  className={`
                    h-3 rounded-full transition-all duration-500 relative overflow-hidden
                    ${isReached ? 'bg-orange-500' : 'bg-gray-700'}
                  `}
                  title={`${milestone} weeks`}
                >
                  {isCurrent && (
                    <div
                      className="absolute inset-0 bg-orange-600 transition-all duration-500"
                      style={{
                        width: `${((streak - (milestones[index - 1] || 0)) / (milestone - (milestones[index - 1] || 0))) * 100}%`
                      }}
                    />
                  )}
                </div>
                <div className={`text-xs text-center mt-1 ${isReached ? 'text-orange-400 font-medium' : 'text-gray-500'}`}>
                  {milestone}w
                  {isReached && index === milestones.length - 1 && (
                    <Trophy className="w-3 h-3 inline ml-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivational Messages */}
      <div className="mt-4 pt-4 border-t border-orange-700/30">
        {streak === 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Target className="w-4 h-4" />
            <span>Start your streak by meeting your health target this week!</span>
          </div>
        )}
        {streak > 0 && streak < 4 && (
          <div className="flex items-center gap-2 text-sm text-orange-400">
            <Target className="w-4 h-4" />
            <span>Keep going! {4 - streak} more {4 - streak === 1 ? 'week' : 'weeks'} to your first milestone.</span>
          </div>
        )}
        {streak >= 4 && streak < 8 && (
          <div className="text-sm text-orange-400 font-medium">
            ⭐ Great consistency! You're building a healthy habit.
          </div>
        )}
        {streak >= 8 && streak < 12 && (
          <div className="text-sm text-orange-400 font-medium">
            🎉 Impressive! Health is clearly a priority for you.
          </div>
        )}
        {streak >= 12 && (
          <div className="text-sm text-orange-400 font-medium">
            🎆 Outstanding! {streak} weeks of consistency is remarkable!
          </div>
        )}
      </div>
    </div>
  );
};
