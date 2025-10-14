import { type FC, useState } from 'react';
import { Settings, Activity } from 'lucide-react';
import { HealthTimeAllocationCard } from '@/components/health/HealthTimeAllocationCard';
import { HealthStreak } from '@/components/health/HealthStreak';
import { HealthNeglectAlert } from '@/components/health/HealthNeglectAlert';
import { HealthTimeBreakdown } from '@/components/health/HealthTimeBreakdown';
import { WeeklyHealthSummary } from '@/components/health/WeeklyHealthSummary';
import { ScheduleHealthTimeCard } from '@/components/health/ScheduleHealthTimeButton';
import { TimeBudgetSettings } from '@/components/analytics/TimeBudgetSettings';

/**
 * Health - Comprehensive health time monitoring dashboard
 *
 * Layout:
 * 1. Health Neglect Alert (if applicable)
 * 2. Health Time Allocation Card (hero - weekly/daily progress)
 * 3. Health Streak (motivational)
 * 4. Schedule Health Time Card (quick action)
 * 5. Health Time Breakdown (activity analysis)
 * 6. Weekly Health Summary (trend analysis)
 *
 * Features:
 * - Real-time health time monitoring
 * - Streak tracking for consistency
 * - Risk detection for neglect
 * - Quick scheduling of health time
 * - Activity breakdown and trends
 * - Time budget configuration
 */
export const Health: FC = () => {
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  const handleScheduleHealthTime = () => {
    // TODO: Navigate to Daily page for tomorrow with pre-populated health time block
    // For now, just log the action
    console.log('Schedule health time clicked');
    // In a real implementation, this would:
    // 1. Navigate to Daily page
    // 2. Set date to tomorrow
    // 3. Pre-populate a 1-hour workout block at 7:00 AM
    // 4. Set area to 'Health'
    // 5. Pre-select "Workout" label
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-teal-500" />
            <h1 className="text-3xl font-bold text-gray-100">Health Dashboard</h1>
          </div>
          <p className="text-gray-400">
            Track your health time allocation and maintain consistency
          </p>
        </div>
        <button
          onClick={() => setShowBudgetSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Health Time Target
        </button>
      </div>

      {/* Time Budget Settings Modal */}
      <TimeBudgetSettings
        isOpen={showBudgetSettings}
        onClose={() => setShowBudgetSettings(false)}
      />

      <div className="space-y-6">
        {/* Section 1: Health Neglect Alert (if applicable) */}
        <HealthNeglectAlert onScheduleClick={handleScheduleHealthTime} />

        {/* Section 2 & 3: Hero Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Time Allocation Card */}
          <HealthTimeAllocationCard />

          {/* Health Streak */}
          <HealthStreak />
        </div>

        {/* Section 4: Quick Action Card */}
        <ScheduleHealthTimeCard onSchedule={handleScheduleHealthTime} />

        {/* Section 5: Health Time Breakdown */}
        <HealthTimeBreakdown />

        {/* Section 6: Weekly Health Summary */}
        <WeeklyHealthSummary />
      </div>

      {/* Info Section */}
      <div className="mt-8 p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-300 mb-2">About Health Time Tracking</h4>
        <p className="text-sm text-gray-400">
          Health time includes workouts, meal preparation, meditation, physical therapy, and other
          health-related activities. Log deep work sessions with the "Health" area and add labels
          like "Workout", "Meal Prep", or "Meditation" to track specific activities.
        </p>
      </div>
    </div>
  );
};
