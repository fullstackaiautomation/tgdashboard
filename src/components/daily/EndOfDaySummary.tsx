/**
 * EndOfDaySummary - End of day recap with reflection prompt
 * Story 2.5: Daily Goals Progress Tracking (Task 7)
 */

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { useDailyProgress } from '@/hooks/useDailyProgress';
import { useDeepWorkProgress } from '@/hooks/useDeepWorkProgress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';
import { ChevronRight, Calendar } from 'lucide-react';

interface EndOfDaySummaryProps {
  date?: Date;
  onPlanTomorrow?: () => void;
  className?: string;
}

/**
 * Check if current time is after 6pm local time
 */
const isAfterSixPM = (): boolean => {
  const now = new Date();
  return now.getHours() >= 18; // 6pm = 18:00
};

/**
 * EndOfDaySummary - Evening recap showing day's accomplishments
 * Displays after 6pm with tasks completed, deep work hours, and reflection prompt
 *
 * @param date - Date to summarize (defaults to today)
 * @param onPlanTomorrow - Callback for "Plan Tomorrow" button
 */
export const EndOfDaySummary: FC<EndOfDaySummaryProps> = ({
  date = new Date(),
  onPlanTomorrow,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [reflection, setReflection] = useState('');

  // Check time and update visibility
  useEffect(() => {
    setIsVisible(isAfterSixPM());

    // Check every minute
    const interval = setInterval(() => {
      setIsVisible(isAfterSixPM());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const dateString = format(date, 'yyyy-MM-dd');
  const { data: dailyProgress } = useDailyProgress(date);
  const { data: deepWorkProgress } = useDeepWorkProgress(date);

  // Query businesses worked on today
  const { data: businessesWorked = [] } = useQuery({
    queryKey: ['businesses-worked', dateString],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('deep_work_log')
        .select('area')
        .eq('user_id', user.id)
        .gte('start_time', dayStart.toISOString())
        .lte('start_time', dayEnd.toISOString())
        .not('end_time', 'is', null);

      if (error) throw error;

      // Get unique areas
      const uniqueAreas = Array.from(new Set((data || []).map(s => s.area).filter(Boolean)));
      return uniqueAreas;
    },
    enabled: isVisible,
    staleTime: 5 * 60 * 1000,
  });

  // Don't show if it's not evening yet
  if (!isVisible) {
    return null;
  }

  const completedCount = dailyProgress?.completedCount ?? 0;
  const totalCount = dailyProgress?.totalCount ?? 0;
  const hoursWorked = deepWorkProgress?.hoursWorked ?? 0;
  const completionPercent = dailyProgress?.dailyProgress ?? 0;

  return (
    <div className={`bg-gradient-to-br from-blue-950/30 to-purple-950/30 rounded-lg p-6 border-2 border-blue-500/50 ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-2xl font-bold text-white mb-1">Day Complete</h3>
        <p className="text-sm text-gray-400">
          {format(date, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Tasks Completed */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase mb-1">Tasks</div>
          <div className="text-2xl font-bold text-white">
            {completedCount}<span className="text-gray-500 text-lg">/{totalCount}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">{completionPercent.toFixed(0)}% complete</div>
        </div>

        {/* Deep Work Hours */}
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase mb-1">Deep Work</div>
          <div className="text-2xl font-bold text-white">{hoursWorked.toFixed(1)}h</div>
          <div className="text-xs text-gray-400 mt-1">logged today</div>
        </div>

        {/* Areas Worked */}
        <div className="bg-gray-900/50 rounded-lg p-4 col-span-2">
          <div className="text-xs text-gray-400 uppercase mb-1">Areas Worked On</div>
          {businessesWorked.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {businessesWorked.map((area) => (
                <span
                  key={area}
                  className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/30"
                >
                  {area}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-1">No work logged</div>
          )}
        </div>
      </div>

      {/* Reflection Prompt */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          What went well today? (Optional)
        </label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Reflect on your accomplishments, challenges, or learnings..."
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          Daily reflections help track patterns and improve over time
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onPlanTomorrow}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          <Calendar size={18} />
          Plan Tomorrow
          <ChevronRight size={18} />
        </button>

        {reflection.trim() && (
          <button
            onClick={() => {
              // TODO: Save reflection to database
              console.log('Saving reflection:', reflection);
              setReflection('');
            }}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            Save Reflection
          </button>
        )}
      </div>
    </div>
  );
};
