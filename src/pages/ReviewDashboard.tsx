// Story 5.1: Review Dashboard Page
// Main review dashboard displaying all 7 life areas

import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useReviewDashboard, useReviewSummary } from '../hooks/useReviewDashboard';
import { useGoals } from '../hooks/useGoals';
import { useAreaGoalsProgress } from '../hooks/useGoalProgress';
import { useGoalsNeedingCheckIn } from '../hooks/useWeeklyCheckIns';
import { ReviewAreaCard } from '../components/review/ReviewAreaCard';
import { DailyAreaCard } from '../components/review/DailyAreaCard';
import { BusinessAreaCard } from '../components/review/BusinessAreaCard';
import { FinancesAreaCard } from '../components/review/FinancesAreaCard';
import { ReviewDashboardSkeleton } from '../components/review/ReviewDashboardSkeleton';
import { SimpleAreaCard } from '../components/review/SimpleAreaCard';
import { NeedsAttentionSection } from '../components/review/NeedsAttentionSection';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { REVIEW_AREAS } from '../config/reviewNavigation';
import { GOAL_AREA_CONFIG } from '../config/goalAreas';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import { GoalProgressCard } from '../components/goals/GoalProgressCard';
import { GoalForm } from '../components/goals/GoalForm';
import { CheckInBanner } from '../components/goals/CheckInBanner';
import { CheckInModal } from '../components/goals/CheckInModal';
import type { GoalArea } from '../types/goals';
import type { GoalAreaType } from '../config/goalAreas';

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
// Filters matching Tasks page order exactly
const BUSINESSES = [
  { id: 'full-stack', label: 'Full Stack', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { id: 'huge-capital', label: 'Huge Capital', gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' },
  { id: 's4', label: 'S4', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
];

const LIFE_AREAS = [
  { id: 'personal', label: 'Personal', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { id: 'health', label: 'Health', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' },
  { id: 'golf', label: 'Golf', gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' },
];

export const ReviewDashboard: FC<ReviewDashboardProps> = ({ onNavigate }) => {
  const { data: areas, isLoading, refetch, dataUpdatedAt, isFetching } = useReviewDashboard();
  const { totalCritical, totalWarning, hasAttentionNeeded, allClear } = useReviewSummary();
  const [selectedArea, setSelectedArea] = useState<string | null>(null); // null = All Areas
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInGoalId, setCheckInGoalId] = useState<string | null>(null);

  // Map filter IDs to goal areas for filtering
  const mapFilterToGoalArea = (filterId: string | null): GoalArea | undefined => {
    if (!filterId) return undefined;

    const mapping: Record<string, GoalArea> = {
      'full-stack': 'Full Stack',
      'huge-capital': 'Huge Capital',
      's4': 'S4',
      'personal': 'Relationships',
      'health': 'Health',
      'finance': 'Finance',
    };
    return mapping[filterId] as GoalArea;
  };

  const { data: allGoals, isLoading: goalsLoading, refetch: refetchGoals } = useGoals(
    selectedArea ? mapFilterToGoalArea(selectedArea) : undefined,
    'active'
  );
  const { data: areaProgress } = useAreaGoalsProgress(
    selectedArea ? mapFilterToGoalArea(selectedArea) : undefined
  );
  const { data: checkInData } = useGoalsNeedingCheckIn();

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
      '/goals': 'review', // Goals stay in review, but trigger state change
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

      {/* Check-In Banner - Show on Sundays when goals need check-in */}
      {checkInData?.isCheckInDay && checkInData?.goals?.length > 0 && (
        <CheckInBanner
          goalsCount={checkInData.goals.length}
          onClick={() => {
            setCheckInGoalId(checkInData.goals[0].id);
            setShowCheckInModal(true);
          }}
        />
      )}

      {/* Area Filter Bar - Matches TaskFilters styling with all filters */}
      <div className="grid grid-cols-7 gap-2 mb-8">
            {/* All Areas Button */}
            <Badge
              variant="outline"
              className={`cursor-pointer px-3 py-2 font-semibold text-white transition-all duration-150 flex flex-col items-center justify-center ${
                selectedArea === null
                  ? 'border-2 border-white shadow-lg'
                  : 'border-0 hover:shadow-md'
              }`}
              style={{
                backgroundColor: '#4b5563',
                minHeight: '80px',
              }}
              onClick={() => setSelectedArea(null)}
            >
              <span className="text-sm">All Areas</span>
              <span className="text-lg font-bold mt-1">{areaProgress?.total_goals || 0}</span>
            </Badge>

            {/* Business Badges */}
            {BUSINESSES.map(business => {
              const isSelected = selectedArea === business.id;
              const businessGoalsCount = allGoals?.filter(g => {
                const goalArea = mapFilterToGoalArea(business.id);
                return g.area === goalArea;
              }).length || 0;

              return (
                <Badge
                  key={business.id}
                  variant="outline"
                  className={`cursor-pointer px-3 py-2 font-semibold text-white transition-all duration-150 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-2 border-white shadow-lg'
                      : 'border-0 hover:shadow-md'
                  }`}
                  style={{
                    background: business.gradient,
                    minHeight: '80px',
                  }}
                  onClick={() => setSelectedArea(business.id)}
                >
                  <span className="text-sm">{business.label}</span>
                  <span className="text-lg font-bold mt-1">{businessGoalsCount}</span>
                </Badge>
              );
            })}

            {/* Life Areas Badges */}
            {LIFE_AREAS.map(area => {
              const isSelected = selectedArea === area.id;
              const areaGoalsCount = allGoals?.filter(g => {
                const goalArea = mapFilterToGoalArea(area.id);
                return g.area === goalArea;
              }).length || 0;

              return (
                <Badge
                  key={area.id}
                  variant="outline"
                  className={`cursor-pointer px-3 py-2 font-semibold text-white transition-all duration-150 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'border-2 border-white shadow-lg'
                      : 'border-0 hover:shadow-md'
                  }`}
                  style={{
                    background: area.gradient,
                    minHeight: '80px',
                  }}
                  onClick={() => setSelectedArea(area.id)}
                >
                  <span className="text-sm">{area.label}</span>
                  <span className="text-lg font-bold mt-1">{areaGoalsCount}</span>
                </Badge>
              );
            })}
      </div>

      {/* Overall Goal Summary Box - Overarching goal statement */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {selectedArea === 'All' ? '🎯 Overarching Vision' : `🎯 ${selectedArea} Goal`}
          </h2>
          <p className="text-gray-300 text-lg mb-3">
            {selectedArea === 'All'
              ? 'Balance and excellence across all life areas • Build sustainable progress in every domain'
              : `Master ${selectedArea} through consistent, measurable sub-goals`}
          </p>
          <p className="text-gray-400 text-sm">
            {selectedArea === 'All'
              ? `${areaProgress?.total_goals || 0} active goals across all areas`
              : `${areaProgress?.total_goals || 0} sub-goal${areaProgress?.total_goals === 1 ? '' : 's'} for this area`}
          </p>
        </div>
      </div>

      {/* Sub-Goals Section - Show when Any filter selected */}
      {(selectedArea === null || selectedArea !== null) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">Sub-Goals</h3>
              <p className="text-sm text-gray-400">Measurable milestones contributing to your overarching goal</p>
            </div>
            <button
              onClick={() => setShowCreateGoalModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              Add Sub-Goal
            </button>
          </div>

          {goalsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse h-40" />
              ))}
            </div>
          ) : allGoals && allGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allGoals.map(goal => (
                <GoalProgressCard key={goal.id} goal={goal} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
              <p className="text-gray-400 mb-4">No sub-goals yet for {selectedArea === null ? 'all areas' : selectedArea}</p>
              <button
                onClick={() => setShowCreateGoalModal(true)}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={18} />
                Create First Sub-Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Area Cards Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Show other cards based on area filter or all if no filter selected */}
        {areas?.map((areaSummary) => {
          const config = REVIEW_AREAS.find(a => a.area === areaSummary.area);
          if (!config) return null;

          // Filter by selected area (skip if not matching and selectedArea is not null)
          if (selectedArea !== null) {
            const areaMatch: Record<string, string> = {
              'full-stack': 'BIZNESS',
              'huge-capital': 'BIZNESS',
              's4': 'BIZNESS',
              'personal': 'LIFE',
              'health': 'HEALTH',
              'golf': 'HEALTH',
            };

            if (areaMatch[selectedArea] && areaMatch[selectedArea] !== areaSummary.area) {
              return null;
            }
          }

          // Use enhanced DailyAreaCard for DAILY area
          if (areaSummary.area === 'DAILY') {
            if (selectedArea !== null && selectedArea !== 'health') return null;
            return (
              <DailyAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced BusinessAreaCard for BIZNESS area
          if (areaSummary.area === 'BIZNESS') {
            if (selectedArea !== null && !['full-stack', 'huge-capital', 's4'].includes(selectedArea)) return null;
            return (
              <BusinessAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced FinancesAreaCard for FINANCES area
          if (areaSummary.area === 'FINANCES') {
            if (selectedArea !== null && selectedArea !== 'finance') return null;
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

      {/* Create Goal Modal */}
      {showCreateGoalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Goal</h2>
            <GoalForm
              onSuccess={() => {
                setShowCreateGoalModal(false)
                refetchGoals()
              }}
              onCancel={() => setShowCreateGoalModal(false)}
            />
          </div>
        </div>
      )}

      {/* Check-In Modal */}
      {showCheckInModal && checkInGoalId && allGoals && (
        (() => {
          const goal = allGoals.find(g => g.id === checkInGoalId);
          return goal ? (
            <CheckInModal
              goalId={goal.id}
              goalArea={goal.area}
              goalStatement={goal.goal_statement}
              targets={[]} // Will fetch targets from the hook inside CheckInModal if needed
              onClose={() => {
                setShowCheckInModal(false);
                setCheckInGoalId(null);
              }}
              onSuccess={() => {
                setShowCheckInModal(false);
                setCheckInGoalId(null);
                refetchGoals();
              }}
            />
          ) : null;
        })()
      )}
    </div>
  );
};
