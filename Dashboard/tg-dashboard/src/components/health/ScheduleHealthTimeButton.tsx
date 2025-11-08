import { type FC, useState } from 'react';
import { Calendar, Check } from 'lucide-react';

interface ScheduleHealthTimeButtonProps {
  onSchedule?: () => void;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ScheduleHealthTimeButton - Quick health time scheduling CTA
 *
 * Features:
 * - Click to navigate to Daily page for tomorrow
 * - Pre-populates 1-hour workout block at preferred time (7:00 AM default)
 * - Shows success state after scheduling
 * - Variants for different contexts (alert, card, etc.)
 *
 * Note: Actual scheduling logic handled by parent component via onSchedule callback
 */
export const ScheduleHealthTimeButton: FC<ScheduleHealthTimeButtonProps> = ({
  onSchedule,
  variant = 'primary',
  size = 'md',
}) => {
  const [isScheduled, setIsScheduled] = useState(false);

  const handleClick = () => {
    if (onSchedule) {
      onSchedule();
      setIsScheduled(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setIsScheduled(false);
      }, 3000);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const variantClasses = {
    primary: isScheduled
      ? 'bg-green-600 hover:bg-green-700'
      : 'bg-teal-600 hover:bg-teal-700',
    secondary: isScheduled
      ? 'bg-green-700 hover:bg-green-800 border border-green-600'
      : 'bg-gray-700 hover:bg-gray-600 border border-gray-600',
  };

  return (
    <button
      onClick={handleClick}
      disabled={isScheduled}
      className={`
        flex items-center gap-2 rounded-lg font-medium transition-all
        text-white disabled:opacity-75 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
    >
      {isScheduled ? (
        <>
          <Check className="w-4 h-4" />
          <span>Scheduled!</span>
        </>
      ) : (
        <>
          <Calendar className="w-4 h-4" />
          <span>Schedule Health Time</span>
        </>
      )}
    </button>
  );
};

/**
 * ScheduleHealthTimeCard - Card variant with more context
 */
export const ScheduleHealthTimeCard: FC<{ onSchedule?: () => void }> = ({ onSchedule }) => {
  return (
    <div className="bg-teal-900/20 border border-teal-600 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="bg-teal-600 rounded-full p-2">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-teal-400 mb-1">
            Quick Schedule Health Time
          </h4>
          <p className="text-sm text-gray-300 mb-3">
            Block time for a workout, meal prep, or other health activity
          </p>
          <ScheduleHealthTimeButton onSchedule={onSchedule} variant="primary" size="sm" />
        </div>
      </div>
    </div>
  );
};
