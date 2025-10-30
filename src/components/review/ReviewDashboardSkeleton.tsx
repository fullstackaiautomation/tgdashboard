// Story 5.1: Review Dashboard Loading Skeleton
// Provides instant perceived performance while data loads

import type { FC } from 'react';

/**
 * ReviewDashboardSkeleton - Loading state for review dashboard
 * Shows skeleton cards to maintain layout and provide visual feedback
 */
export const ReviewDashboardSkeleton: FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="h-10 w-80 bg-gray-700 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-32 bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-10 bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Area Cards Skeleton Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(7)].map((_, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-6 border-2 border-gray-700 animate-pulse"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gray-700 rounded" />
              <div className="h-6 w-32 bg-gray-700 rounded" />
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-16 bg-gray-700 rounded" />
                <div className="h-4 w-20 bg-gray-700 rounded" />
              </div>
              <div className="w-full h-3 bg-gray-700 rounded-full" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="h-3 w-20 bg-gray-700 rounded mb-2" />
                <div className="h-6 w-12 bg-gray-700 rounded" />
              </div>
              <div>
                <div className="h-3 w-24 bg-gray-700 rounded mb-2" />
                <div className="h-6 w-16 bg-gray-700 rounded" />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-gray-700 pt-3">
              <div className="h-3 w-24 bg-gray-700 rounded" />
              <div className="h-3 w-20 bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
