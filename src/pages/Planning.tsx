/**
 * Planning - Comprehensive Time Allocation Planning Dashboard
 *
 * Story 4.5: Combines weekly budget, planned vs. actual, forecast, and recommendations
 */

import { type FC, useState } from 'react';
import { Calendar, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { startOfWeek } from 'date-fns';
import { useAreaTargets, useUserSettings, usePlannedVsActual, useWeeklyForecast, useTargetRecommendations } from '@/hooks/useTimePlanning';
import { PlannedVsActualDashboard } from '@/components/planning/PlannedVsActualDashboard';
import { TaskBasedAllocation } from '@/components/planning/TaskBasedAllocation';
import { SettingsModal } from '@/components/planning/SettingsModal';
// import { MonthlyTargetReview } from '@/components/planning/MonthlyTargetReview';

interface PlanningProps {
  onNavigateToSettings?: () => void;
}

export const Planning: FC<PlanningProps> = ({ onNavigateToSettings }) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const { data: targets } = useAreaTargets();
  const { data: settings } = useUserSettings();
  const { data: plannedVsActual } = usePlannedVsActual(weekStart);
  const { data: forecast } = useWeeklyForecast(weekStart);
  const { data: recommendations } = useTargetRecommendations();

  const availableHours = settings?.available_work_hours_per_week || 40;
  const totalAllocated = targets?.reduce((sum, t) => sum + t.target_hours_per_week, 0) || 0;
  const unallocated = availableHours - totalAllocated;
  const isOverAllocated = totalAllocated > availableHours;
  const allocationPercentage = (totalAllocated / availableHours) * 100;

  const atRiskAreas = forecast?.filter(f => f.status === 'at_risk' || f.status === 'unlikely') || [];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-orange-400" />
              <h1 className="text-3xl font-bold">Time Allocation Planning</h1>
            </div>
            <p className="text-gray-400">
              Proactively plan balanced attention across your 7 life areas
            </p>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Target className="w-4 h-4" />
            Set Targets
          </button>
        </div>
      </div>

      {/* Task-Based Allocation - Smart Planning from Actual Tasks */}
      <div className="mb-6">
        <TaskBasedAllocation availableHours={availableHours} />
      </div>

      {/* Weekly Time Budget */}
      <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Weekly Time Budget</h3>

        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <div className="text-sm text-gray-400">Total Available</div>
            <div className="text-2xl font-bold text-gray-100">{availableHours}h</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Allocated</div>
            <div className={`text-2xl font-bold ${isOverAllocated ? 'text-red-400' : 'text-orange-400'}`}>
              {totalAllocated}h
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Unallocated</div>
            <div className={`text-2xl font-bold ${unallocated < 0 ? 'text-red-400' : 'text-green-400'}`}>
              {unallocated}h
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-700 rounded-full h-8 relative overflow-hidden">
          <div
            className={`h-full transition-all ${isOverAllocated ? 'bg-red-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min(allocationPercentage, 100)}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
            {allocationPercentage.toFixed(0)}% Allocated
          </div>
        </div>

        {/* Over-allocation Warning */}
        {isOverAllocated && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-red-400">Over-Allocated!</div>
              <div className="text-sm text-red-300">
                Target allocation ({totalAllocated}h) exceeds sustainable capacity ({availableHours}h).
                Consider adjusting your targets.
              </div>
            </div>
          </div>
        )}

        {totalAllocated === 0 && (
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-yellow-400">No Targets Set</div>
              <div className="text-sm text-yellow-300">
                Set targets (via "Set Targets" button above) to plan your week and track progress.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Forecast (At Risk Areas) */}
      {atRiskAreas.length > 0 && (
        <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-100">Weekly Forecast Alerts</h3>
          </div>

          <div className="space-y-3">
            {atRiskAreas.map(area => (
              <div key={area.area} className="p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-yellow-400">{area.area}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      Target: {area.target_hours}h | Actual: {area.actual_hours.toFixed(1)}h |
                      Projected: {area.projected_hours.toFixed(1)}h
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-yellow-900/40 text-yellow-400 rounded text-xs font-medium">
                    {area.status === 'at_risk' ? '⚠ At Risk' : '✗ Unlikely'}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  Schedule more {area.area} time to meet your weekly target
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Target Adjustment Suggestions</h3>

          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-blue-400">{rec.area}</div>
                  <div className="text-sm text-gray-400">
                    Avg: {rec.avg_actual.toFixed(1)}h/week
                  </div>
                </div>
                <div className="text-sm text-gray-300 mb-3">
                  {rec.message}
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors">
                    Update to {rec.suggested_target}h
                  </button>
                  <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded text-sm hover:bg-gray-600 transition-colors">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Target Review - TODO: Fix encoding issue in MonthlyTargetReview.tsx */}
      {/* <div className="mb-6">
        <MonthlyTargetReview />
      </div> */}

      {/* Planned vs. Actual Dashboard */}
      <PlannedVsActualDashboard />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};
