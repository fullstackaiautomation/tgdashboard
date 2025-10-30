import type { FC } from 'react';
import { Check, Circle } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

/**
 * ProgressIndicator - Visual indicator for task completion status
 *
 * @param progress - Completion percentage (0-100)
 * @param size - Size variant: sm (16px), md (20px), lg (24px)
 * @param showLabel - Whether to show percentage label
 * @param className - Additional Tailwind classes
 */
export const ProgressIndicator: FC<ProgressIndicatorProps> = ({
  progress,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;

  // Not Started (0%)
  if (progress === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Circle className={`${sizeClasses[size]} text-gray-500`} />
        {showLabel && <span className="text-xs text-gray-500">0%</span>}
      </div>
    );
  }

  // Completed (100%)
  if (progress === 100) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full bg-green-500 flex items-center justify-center`}>
          <Check className="text-white" size={iconSize - 4} strokeWidth={3} />
        </div>
        {showLabel && <span className="text-xs text-green-500 font-medium">100%</span>}
      </div>
    );
  }

  // In Progress (1-99%)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-gray-700"
          />
          {/* Progress arc */}
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray={`${progress} ${100 - progress}`}
            strokeLinecap="round"
            className={`${
              progress < 33
                ? 'text-red-500'
                : progress < 67
                ? 'text-yellow-500'
                : 'text-green-500'
            } transition-all duration-300`}
          />
        </svg>
      </div>
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            progress < 33
              ? 'text-red-400'
              : progress < 67
              ? 'text-yellow-400'
              : 'text-green-400'
          }`}
        >
          {progress}%
        </span>
      )}
    </div>
  );
};
