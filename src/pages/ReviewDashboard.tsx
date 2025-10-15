// Story 5.1: Review Dashboard Page
// Main review dashboard displaying all 7 life areas

import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReviewDashboard, useReviewSummary } from '../hooks/useReviewDashboard';
import { ReviewAreaCard } from '../components/review/ReviewAreaCard';
import { DailyAreaCard } from '../components/review/DailyAreaCard';
import { BusinessAreaCard } from '../components/review/BusinessAreaCard';
import { FinancesAreaCard } from '../components/review/FinancesAreaCard';
import { ReviewDashboardSkeleton } from '../components/review/ReviewDashboardSkeleton';
import { SimpleAreaCard } from '../components/review/SimpleAreaCard';
import { NeedsAttentionSection } from '../components/review/NeedsAttentionSection';
import { REVIEW_AREAS } from '../config/reviewNavigation';

interface ReviewDashboardProps {
  onNavigate: (tab: 'review' | 'tasks' | 'dailytime' | 'business' | 'content' | 'health' | 'finance' | 'notes' | 'analytics' | 'planning' | 'calendar' | 'insights') => void;
}

/**
 * ReviewDashboard - Main review page showing all area summaries
 *
 * Implements Story 5.1 Tasks:
 * - Task 1: Page component and routing
 * - Task 5: Area-specific navigation
 * - Task 6: Visual hierarchy and priority sorting
 * - Task 7: Responsive grid layout
 * - Task 8: READ-ONLY enforcement
 * - Task 9: Last sync timestamp and manual refresh
 */
export const ReviewDashboard: FC<ReviewDashboardProps> = ({ onNavigate }) => {
  const { data: areas, isLoading, refetch, dataUpdatedAt, isFetching } = useReviewDashboard();
  const { totalCritical, totalWarning, hasAttentionNeeded, allClear } = useReviewSummary();

  const [lastSyncFormatted, setLastSyncFormatted] = useState<string>('');

  // Update last sync timestamp every 10 seconds
  useEffect(() => {
    const updateTimestamp = () => {
      if (dataUpdatedAt) {
        setLastSyncFormatted(formatDistanceToNow(dataUpdatedAt, { addSuffix: true }));
      }
    };

    updateTimestamp();
    const interval = setInterval(updateTimestamp, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

  const handleRefresh = () => {
    refetch();
  };

  const handleCardClick = (route: string) => {
    // Map routes to tab names
    const routeToTab: Record<string, 'review' | 'tasks' | 'dailytime' | 'business' | 'content' | 'health' | 'finance' | 'notes' | 'analytics' | 'planning' | 'calendar' | 'insights'> = {
      '/daily': 'dailytime',
      '/business': 'business',
      '/content': 'content',
      '/health': 'health',
      '/finances': 'finance',
      '/life': 'notes',
      '/golf': 'health', // Golf not yet implemented, fallback to health
    };

    const tab = routeToTab[route];
    if (tab) {
      onNavigate(tab);
    }
  };

  if (isLoading) {
    return <ReviewDashboardSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            📊 Review Dashboard
          </h1>
          <p className="text-gray-400">
            Your complete life ecosystem at a glance • Read-only view
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last synced: {lastSyncFormatted || 'just now'}
          </span>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="p-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Refresh dashboard"
          >
            <RefreshCw
              size={20}
              className={`text-gray-400 ${isFetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Story 5.6: Needs Attention Section */}
      <NeedsAttentionSection onNavigate={onNavigate} />

      {/* Area Cards Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas?.map((areaSummary) => {
          const config = REVIEW_AREAS.find(a => a.area === areaSummary.area);
          if (!config) return null;

          // Use enhanced DailyAreaCard for DAILY area
          if (areaSummary.area === 'DAILY') {
            return (
              <DailyAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced BusinessAreaCard for BIZNESS area
          if (areaSummary.area === 'BIZNESS') {
            return (
              <BusinessAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced FinancesAreaCard for FINANCES area
          if (areaSummary.area === 'FINANCES') {
            return (
              <FinancesAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use SimpleAreaCard for Health/Content/Life/Golf (stub cards)
          if (['HEALTH', 'CONTENT', 'LIFE', 'GOLF'].includes(areaSummary.area)) {
            return (
              <SimpleAreaCard
                key={areaSummary.area}
                title={config.displayName}
                icon={config.icon}
                color={config.color}
                message="No recent activity"
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Fallback (shouldn't reach here)
          return null;
        })}
      </div>

      {/* Empty State */}
      {(!areas || areas.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No area data available yet. Start by creating some tasks!
          </p>
        </div>
      )}
    </div>
  );
};
