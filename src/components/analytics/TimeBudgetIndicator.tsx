import { type FC } from 'react';
import { Check, AlertCircle, TrendingUp } from 'lucide-react';

interface TimeBudgetIndicatorProps {
  targetHours: number;
  actualHours: number;
  area: string;
  color?: string;
}

/**
 * TimeBudgetIndicator - Visual indicator for time budget progress
 *
 * Shows:
 * - Target hours per week
 * - Actual hours this week
 * - Progress percentage
 * - Color-coded progress bar (green >= 100%, yellow 75-99%, red < 75%)
 * - Status icon
 *
 * @param targetHours - Target hours per week for the area
 * @param actualHours - Actual hours worked this week
 * @param area - Area name for display
 * @param color - Optional custom color for the area
 */
export const TimeBudgetIndicator: FC<TimeBudgetIndicatorProps> = ({
  targetHours,
  actualHours,
  area,
  color = '#06b6d4',
}) => {
  const progressPercentage = (actualHours / targetHours) * 100;

  const status =
    progressPercentage >= 100 ? 'success' :
    progressPercentage >= 75 ? 'warning' :
    'danger';

  const statusColor =
    status === 'success' ? 'text-green-400' :
    status === 'warning' ? 'text-yellow-400' :
    'text-red-400';

  const barColor =
    status === 'success' ? 'bg-green-500' :
    status === 'warning' ? 'bg-yellow-500' :
    'bg-red-500';

  const StatusIcon =
    status === 'success' ? Check :
    status === 'warning' ? TrendingUp :
    AlertCircle;

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h4 className="text-sm font-semibold text-gray-100">{area}</h4>
        </div>
        <div className={`flex items-center gap-1 ${statusColor}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{progressPercentage.toFixed(0)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ease-out ${barColor}`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-gray-400">
          Target: <span className="text-gray-200 font-medium">{targetHours}h/week</span>
        </div>
        <div className={statusColor}>
          Actual: <span className="font-medium">{actualHours.toFixed(1)}h</span>
        </div>
      </div>

      {/* Status message */}
      {status === 'success' && (
        <div className="mt-2 text-xs text-green-400">
          ✓ Target achieved!
        </div>
      )}
      {status === 'warning' && (
        <div className="mt-2 text-xs text-yellow-400">
          ↗ Close to target ({(targetHours - actualHours).toFixed(1)}h remaining)
        </div>
      )}
      {status === 'danger' && (
        <div className="mt-2 text-xs text-red-400">
          ⚠ Below target ({(targetHours - actualHours).toFixed(1)}h needed)
        </div>
      )}
    </div>
  );
};
