import type { FC } from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Get progress color class based on percentage
 */
const getProgressColor = (progress: number): string => {
  if (progress < 33) return 'bg-red-500';
  if (progress < 67) return 'bg-yellow-500';
  return 'bg-green-500';
};

/**
 * ProgressBar - Horizontal progress bar with color gradient
 *
 * @param progress - Completion percentage (0-100)
 * @param size - Height: sm (6px), md (8px), lg (12px)
 * @param showLabel - Whether to show percentage label
 * @param onClick - Optional click handler for drill-down
 * @param className - Additional Tailwind classes
 */
export const ProgressBar: FC<ProgressBarProps> = ({
  progress,
  size = 'md',
  showLabel = false,
  onClick,
  className = '',
}) => {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const progressColor = getProgressColor(progress);
  const isClickable = !!onClick;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div
        className={`w-full bg-gray-700 rounded-full overflow-hidden ${heightClasses[size]} ${
          isClickable ? 'cursor-pointer hover:bg-gray-600 transition-colors' : ''
        }`}
        onClick={onClick}
      >
        {/* Progress fill */}
        <div
          className={`${progressColor} ${heightClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>

      {/* Label */}
      {showLabel && (
        <div className="flex items-center justify-between mt-1 text-xs">
          <span
            className={`font-medium ${
              progress < 33 ? 'text-red-400' : progress < 67 ? 'text-yellow-400' : 'text-green-400'
            }`}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
      )}
    </div>
  );
};
