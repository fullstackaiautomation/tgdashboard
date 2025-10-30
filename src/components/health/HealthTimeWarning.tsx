import { type FC, useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useHealthTimeStats } from '@/hooks/useHealthTimeMonitoring';

interface HealthTimeWarningProps {
  onNavigateToHealth?: () => void;
}

const DISMISS_STORAGE_KEY = 'health_warning_dismissed_date';

/**
 * HealthTimeWarning - Visual warning indicator for low health time allocation
 *
 * Features:
 * - Appears when health hours < 80% of target
 * - Red/yellow badge with warning icon
 * - Dismissible for 24 hours using localStorage
 * - Click to navigate to Health page
 * - Can be used in Daily page navigation or Review dashboard
 */
export const HealthTimeWarning: FC<HealthTimeWarningProps> = ({ onNavigateToHealth }) => {
  const { data: stats } = useHealthTimeStats();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if warning was dismissed in last 24 hours
  useEffect(() => {
    const dismissedDate = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedDate) {
      const dismissedTime = new Date(dismissedDate).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);

      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      } else {
        // Clear expired dismissal
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      }
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  const handleClick = () => {
    if (onNavigateToHealth) {
      onNavigateToHealth();
    }
  };

  // Don't show if no data, if dismissed, or if above 80% threshold
  if (!stats || isDismissed || stats.weekly_percentage >= 80) {
    return null;
  }

  const severity = stats.weekly_percentage < 50 ? 'high' : 'medium';

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
        ${severity === 'high'
          ? 'bg-red-900/30 border border-red-600 hover:bg-red-900/40'
          : 'bg-yellow-900/30 border border-yellow-600 hover:bg-yellow-900/40'
        }
      `}
    >
      <AlertTriangle
        className={`w-4 h-4 flex-shrink-0 ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${severity === 'high' ? 'text-red-400' : 'text-yellow-400'}`}>
          Health: {stats.hours_this_week.toFixed(1)}h / {stats.target_weekly_hours}h
        </p>
        <p className={`text-xs ${severity === 'high' ? 'text-red-500' : 'text-yellow-500'}`}>
          {stats.weekly_percentage}% of target - {stats.hours_below_target.toFixed(1)}h below
        </p>
      </div>
      <button
        onClick={handleDismiss}
        className={`p-1 rounded hover:bg-gray-700 transition-colors ${
          severity === 'high' ? 'text-red-400' : 'text-yellow-400'
        }`}
        title="Dismiss for 24 hours"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/**
 * HealthTimeWarningBanner - Full-width banner version for Review dashboard
 */
export const HealthTimeWarningBanner: FC<HealthTimeWarningProps> = ({ onNavigateToHealth }) => {
  const { data: stats } = useHealthTimeStats();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissedDate = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (dismissedDate) {
      const dismissedTime = new Date(dismissedDate).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);

      if (hoursSinceDismissed < 24) {
        setIsDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_STORAGE_KEY);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString());
    setIsDismissed(true);
  };

  if (!stats || isDismissed || stats.weekly_percentage >= 80) {
    return null;
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-yellow-400 mb-1">
            ⚠️ Health time below target this week
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            You've logged {stats.hours_this_week.toFixed(1)}h of health time this week
            ({stats.weekly_percentage}% of your {stats.target_weekly_hours}h target).
            You're {stats.hours_below_target.toFixed(1)}h below your goal.
          </p>
          {onNavigateToHealth && (
            <button
              onClick={onNavigateToHealth}
              className="text-sm font-medium text-yellow-400 hover:text-yellow-300 underline"
            >
              View Health Dashboard →
            </button>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-200"
          title="Dismiss for 24 hours"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
