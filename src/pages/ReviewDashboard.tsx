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
import { REVIEW_AREAS } from '../config/reviewNavigation';
import { GoalProgressBar } from '../components/goals/GoalProgressBar';
import { GoalProgressCard } from '../components/goals/GoalProgressCard';
import { GoalForm } from '../components/goals/GoalForm';
import { CheckInBanner } from '../components/goals/CheckInBanner';
import { CheckInModal } from '../components/goals/CheckInModal';
import type { GoalArea } from '../types/goals';

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
const GOAL_AREAS = ['Health', 'Relationships', 'Finance', 'Full Stack', 'Huge Capital', 'S4'];

export const ReviewDashboard: FC<ReviewDashboardProps> = ({ onNavigate }) => {
  const { data: areas, isLoading, refetch, dataUpdatedAt, isFetching } = useReviewDashboard();
  const { totalCritical, totalWarning, hasAttentionNeeded, allClear } = useReviewSummary();
  const [selectedArea, setSelectedArea] = useState<string | 'All'>('All');
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInGoalId, setCheckInGoalId] = useState<string | null>(null);
  const { data: allGoals, isLoading: goalsLoading, refetch: refetchGoals } = useGoals(
    selectedArea === 'All' ? undefined : (selectedArea as GoalArea),
    'active'
  );
  const { data: areaProgress } = useAreaGoalsProgress(
    selectedArea === 'All' ? undefined : (selectedArea as GoalArea)
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

      {/* Area Filter Bar - First thing after header */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedArea('All')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedArea === 'All'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Areas
        </button>
        {GOAL_AREAS.map(area => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedArea === area
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Overall Goal Summary Box */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700/50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {selectedArea === 'All' ? '🎯 All Areas' : `🎯 ${selectedArea}`}
            </h2>
            <p className="text-gray-400 text-sm">
              {selectedArea === 'All'
                ? `Track your progress across all life areas • ${areaProgress?.total_goals || 0} active goals`
                : `Track your progress in ${selectedArea} • ${areaProgress?.total_goals || 0} active goal${areaProgress?.total_goals === 1 ? '' : 's'}`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-400">{areaProgress?.average_progress || 0}%</div>
            <p className="text-xs text-gray-400">overall progress</p>
          </div>
        </div>
        <div className="w-full bg-gray-700 rounded-full overflow-hidden h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${areaProgress?.average_progress || 0}%` }}
          />
        </div>
      </div>

      {/* Goals Section - Show when All or matching area selected */}
      {(selectedArea === 'All' || GOAL_AREAS.includes(selectedArea)) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Goals</h3>
            <button
              onClick={() => setShowCreateGoalModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={18} />
              Add Goal
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
              <p className="text-gray-400 mb-4">No goals yet for {selectedArea === 'All' ? 'all areas' : selectedArea}</p>
              <button className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                <Plus size={18} />
                Create First Goal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Area Cards Grid - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Show other cards based on area filter or all if "All" selected */}
        {areas?.map((areaSummary) => {
          const config = REVIEW_AREAS.find(a => a.area === areaSummary.area);
          if (!config) return null;

          // Filter by selected area (skip if not matching and not "All")
          if (selectedArea !== 'All') {
            const areaMatch = {
              'Health': 'HEALTH',
              'Relationships': 'LIFE',
              'Finance': 'FINANCES',
              'Full Stack': 'BIZNESS',
              'Huge Capital': 'BIZNESS',
              'S4': 'BIZNESS',
            } as Record<string, string>;

            if (areaMatch[selectedArea] && areaMatch[selectedArea] !== areaSummary.area) {
              return null;
            }
          }

          // Use enhanced DailyAreaCard for DAILY area
          if (areaSummary.area === 'DAILY') {
            if (selectedArea !== 'All' && selectedArea !== 'Health') return null;
            return (
              <DailyAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced BusinessAreaCard for BIZNESS area
          if (areaSummary.area === 'BIZNESS') {
            if (selectedArea !== 'All' && !['Full Stack', 'Huge Capital', 'S4'].includes(selectedArea)) return null;
            return (
              <BusinessAreaCard
                key={areaSummary.area}
                onClick={() => handleCardClick(config.route)}
              />
            );
          }

          // Use enhanced FinancesAreaCard for FINANCES area
          if (areaSummary.area === 'FINANCES') {
            if (selectedArea !== 'All' && selectedArea !== 'Finance') return null;
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
