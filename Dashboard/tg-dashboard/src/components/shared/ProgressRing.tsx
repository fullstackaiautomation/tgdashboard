/**
 * ProgressRing - Circular progress indicator
 * Story 2.5: Daily Goals Progress Tracking (Task 2)
 */

import type { FC, ReactNode } from 'react';

interface ProgressRingProps {
  progress: number; // 0-100
  size?: number; // Diameter in pixels
  strokeWidth?: number;
  children?: ReactNode; // Content in center (e.g., percentage text)
  className?: string;
}

/**
 * Get progress color based on completion percentage
 */
const getColor = (progress: number): string => {
  if (progress < 33) return '#ef4444'; // red-500
  if (progress < 67) return '#eab308'; // yellow-500
  return '#10b981'; // green-500
};

/**
 * ProgressRing - SVG-based circular progress indicator
 * Shows colored ring that fills based on progress percentage
 *
 * @param progress - Completion percentage (0-100)
 * @param size - Diameter in pixels (default 200)
 * @param strokeWidth - Ring thickness (default 12)
 * @param children - Content to display in center of ring
 */
export const ProgressRing: FC<ProgressRingProps> = ({
  progress,
  size = 200,
  strokeWidth = 12,
  children,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const progressColor = getColor(progress);

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* SVG Ring */}
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
        aria-label={`${progress.toFixed(1)}% complete`}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#374151" // gray-700
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};
