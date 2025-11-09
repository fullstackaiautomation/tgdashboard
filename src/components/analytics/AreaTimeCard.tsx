import { type FC } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAreaTimeStats } from '@/hooks/useAreaTimeStats';
import { useAreaTimeBudget } from '@/hooks/useAreaTimeBudgets';

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

// Area color mapping (matching task area colors from App.tsx)
export const AREA_COLORS: Record<Area, string> = {
  'Full Stack': '#00b495',   // teal
  'Huge Capital': '#a855f7', // purple-500
  'S4': '#3b82f6',           // blue-500
  '808': '#eab308',          // yellow-500
  'Personal': '#ec4899',     // pink-500
  'Golf': '#f97316',         // orange-500
  'Health': '#14b8a6',       // teal-500
};

interface AreaTimeCardProps {
  area: Area;
  onClick?: () => void;
}

/**
 * AreaTimeCard - Displays time investment metrics for a single life area
 *
 * Shows:
 * - All-time hours
 * - Hours this week (highlighted)
 * - Hours this month
 * - Average hours per week (last 4 weeks)
 * - Trend indicator (vs last week)
 * - Zero-time alert if no sessions in 7+ days
 * - Time budget progress (if set)
 *
 * @param area - The life area to display stats for
 * @param onClick - Optional click handler for card expansion
 */
export const AreaTimeCard: FC<AreaTimeCardProps> = ({ area, onClick }) => {
  const { data: stats, isLoading } = useAreaTimeStats(area);
  const { data: budget } = useAreaTimeBudget(area);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border-l-4 animate-pulse" style={{ borderColor: AREA_COLORS[area] }}>
        <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: AREA_COLORS[area] }}>
        <h3 className="text-xl font-bold mb-4" style={{ color: AREA_COLORS[area] }}>{area}</h3>
        <p className="text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const showZeroTimeAlert = stats.days_since_last > 7;
  const weeklyChange = stats.hours_this_week - stats.hours_last_week;
  const hasTrend = stats.hours_last_week > 0;

  // Calculate budget progress if budget exists
  const budgetProgress = budget ? (stats.hours_this_week / budget.target_hours_per_week) * 100 : null;
  const budgetStatus = budgetProgress !== null
    ? budgetProgress >= 100 ? 'success' : budgetProgress >= 75 ? 'warning' : 'danger'
    : null;

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-md p-6 border-l-4 transition-all hover:shadow-lg ${onClick ? 'cursor-pointer hover:bg-gray-750' : ''} ${showZeroTimeAlert ? 'border-yellow-500 ring-2 ring-yellow-500/30' : ''}`}
      style={{ borderColor: showZeroTimeAlert ? '#eab308' : AREA_COLORS[area] }}
      onClick={onClick}
    >
      {/* Zero-time alert */}
      {showZeroTimeAlert && (
        <div className="flex items-center text-yellow-500 mb-3 text-sm">
          <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
          <span>
            No time this week
            {stats.last_session_date && ` (last: ${stats.days_since_last} days ago)`}
          </span>
        </div>
      )}

      {/* Area name */}
      <h3 className="text-xl font-bold mb-4" style={{ color: AREA_COLORS[area] }}>
        {area}
      </h3>

      {/* Time metrics grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* This Week - Primary metric */}
        <div className="col-span-2">
          <div className="text-sm text-gray-400 mb-1">This Week</div>
          <div className="flex items-end gap-2">
            <div className="text-3xl font-bold text-blue-400">
              {stats.hours_this_week.toFixed(1)}h
            </div>
            {hasTrend && (
              <div className={`flex items-center text-sm mb-1 ${weeklyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {weeklyChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1" />
                )}
                {Math.abs(weeklyChange).toFixed(1)}h
              </div>
            )}
          </div>
        </div>

        {/* This Month */}
        <div>
          <div className="text-sm text-gray-400 mb-1">This Month</div>
          <div className="text-2xl font-semibold text-gray-100">
            {stats.hours_this_month.toFixed(1)}h
          </div>
        </div>

        {/* Avg/Week */}
        <div>
          <div className="text-sm text-gray-400 mb-1">Avg/Week</div>
          <div className="text-2xl font-semibold text-gray-100">
            {stats.avg_hours_per_week.toFixed(1)}h
          </div>
        </div>

        {/* All-Time */}
        <div className="col-span-2">
          <div className="text-sm text-gray-400 mb-1">All-Time</div>
          <div className="text-xl text-gray-300">
            {stats.total_hours.toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Budget progress bar */}
      {budget && budgetProgress !== null && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>Target: {budget.target_hours_per_week}h/week</span>
            <span className={
              budgetStatus === 'success' ? 'text-green-400' :
              budgetStatus === 'warning' ? 'text-yellow-400' :
              'text-red-400'
            }>
              {budgetProgress.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                budgetStatus === 'success' ? 'bg-green-500' :
                budgetStatus === 'warning' ? 'bg-yellow-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(budgetProgress, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
