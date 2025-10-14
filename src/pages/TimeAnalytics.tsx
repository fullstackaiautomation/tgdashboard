import { type FC, useState } from 'react';
import { Settings } from 'lucide-react';
import { AreaTimeCard } from '@/components/analytics/AreaTimeCard';
import { AreaComparisonChart } from '@/components/analytics/AreaComparisonChart';
import { AreaTimeTrend } from '@/components/analytics/AreaTimeTrend';
import { AreaLabelBreakdown } from '@/components/analytics/AreaLabelBreakdown';
import { TimeBudgetSettings } from '@/components/analytics/TimeBudgetSettings';
import { useAllAreasTimeStats } from '@/hooks/useAreaTimeStats';

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

/**
 * TimeAnalytics - Dedicated analytics page showing time invested per area
 *
 * Layout:
 * 1. Area Comparison Chart (full width)
 * 2. Grid of 7 AreaTimeCard components (3 columns)
 * 3. AreaTimeTrend (full width, collapsible)
 * 4. AreaLabelBreakdown (full width)
 *
 * Features:
 * - Real-time data with 5-minute cache
 * - Responsive layout (3 cols desktop, 2 tablet, 1 mobile)
 * - Loading states
 * - Empty state handling
 * - Time budget settings
 */
export const TimeAnalytics: FC = () => {
  const { data: allStats, isLoading } = useAllAreasTimeStats();
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);

  // Check if there's any data at all
  const hasData = allStats && allStats.length > 0 && allStats.some(stat => stat.total_hours > 0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Time Analytics</h1>
          <p className="text-gray-400 mt-2">
            Track and analyze time investment across your 7 life areas
          </p>
        </div>
        <button
          onClick={() => setShowBudgetSettings(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Time Budgets
        </button>
      </div>

      {/* Time Budget Settings Modal */}
      <TimeBudgetSettings
        isOpen={showBudgetSettings}
        onClose={() => setShowBudgetSettings(false)}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 animate-pulse">
            <div className="h-64 bg-gray-700 rounded"></div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasData && (
        <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-100 mb-2">No Deep Work Sessions Yet</h2>
          <p className="text-gray-400 mb-6">
            Start logging deep work sessions to see your time analytics
          </p>
          <p className="text-sm text-gray-500">
            Go to the Tasks tab → Deep Work to start tracking your focused work time
          </p>
        </div>
      )}

      {/* Main content */}
      {!isLoading && hasData && (
        <div className="space-y-6">
          {/* Section 1: Area Comparison Chart (full width) */}
          <AreaComparisonChart />

          {/* Section 2: Grid of 7 AreaTimeCard components */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AREAS.map(area => (
              <AreaTimeCard key={area} area={area} />
            ))}
          </div>

          {/* Section 3: AreaTimeTrend (full width, collapsible) */}
          <AreaTimeTrend />

          {/* Section 4: AreaLabelBreakdown (full width) */}
          <AreaLabelBreakdown />
        </div>
      )}
    </div>
  );
};
