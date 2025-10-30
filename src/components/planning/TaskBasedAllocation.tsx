/**
 * TaskBasedAllocation - Show time allocation needs based on actual tasks
 *
 * Smart planning: Calculate weekly targets from real task estimates
 */

import { type FC, useState } from 'react';
import { ListTodo, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useTaskBasedTimeAllocation, useSmartTargetSuggestions, useWeeklyCapacityCheck } from '@/hooks/useTaskBasedPlanning';
import { useUpsertAreaTarget } from '@/hooks/useTimePlanning';

interface TaskBasedAllocationProps {
  availableHours: number;
}

export const TaskBasedAllocation: FC<TaskBasedAllocationProps> = ({ availableHours }) => {
  const { data: taskAllocation, isLoading } = useTaskBasedTimeAllocation();
  const { data: suggestions } = useSmartTargetSuggestions();
  const { data: capacityCheck } = useWeeklyCapacityCheck(availableHours);
  const upsertTarget = useUpsertAreaTarget();

  const [expandedArea, setExpandedArea] = useState<string | null>(null);

  const handleApplySuggestion = async (area: string, targetHours: number) => {
    try {
      await upsertTarget.mutateAsync({
        area: area as any,
        targetHours,
      });
      alert(`✓ Set ${area} target to ${targetHours}h/week`);
    } catch (error) {
      console.error('Error applying suggestion:', error);
      alert('Failed to set target');
    }
  };

  const handleApplyAll = async () => {
    if (!suggestions) return;
    if (!confirm(`Apply all suggested targets (${suggestions.length} areas)?`)) return;

    try {
      for (const suggestion of suggestions) {
        await upsertTarget.mutateAsync({
          area: suggestion.area,
          targetHours: suggestion.suggested_target,
        });
      }
      alert('✓ Applied all target suggestions!');
    } catch (error) {
      console.error('Error applying all suggestions:', error);
      alert('Failed to apply some targets');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Task-Based Planning</h3>
        <div className="animate-pulse h-32 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!taskAllocation || taskAllocation.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <ListTodo className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-100">Task-Based Planning</h3>
        </div>
        <div className="text-center py-8 text-gray-400">
          <p>No active tasks with time estimates found</p>
          <p className="text-sm mt-2">Add tasks with hour estimates to get smart target suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-100">Task-Based Planning</h3>
        </div>
        {suggestions && suggestions.length > 0 && (
          <button
            onClick={handleApplyAll}
            disabled={upsertTarget.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            Apply All Suggestions
          </button>
        )}
      </div>

      {/* Capacity Check Summary */}
      {capacityCheck && (
        <div className={`mb-4 p-4 rounded-lg border ${
          capacityCheck.is_overloaded
            ? 'bg-red-900/20 border-red-700'
            : 'bg-green-900/20 border-green-700'
        }`}>
          <div className="flex items-start gap-3">
            {capacityCheck.is_overloaded ? (
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`font-semibold ${capacityCheck.is_overloaded ? 'text-red-400' : 'text-green-400'}`}>
                {capacityCheck.is_overloaded ? 'Workload Exceeds Capacity!' : 'Workload is Manageable'}
              </div>
              <div className="text-sm text-gray-300 mt-1">
                Tasks need {capacityCheck.total_hours_needed.toFixed(1)}h/week, you have {capacityCheck.available_hours}h available
                ({capacityCheck.utilization_percentage.toFixed(0)}% capacity)
              </div>
              <ul className="text-xs text-gray-400 mt-2 space-y-1">
                {capacityCheck.recommendations.map((rec, idx) => (
                  <li key={idx}>• {rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Smart Target Suggestions */}
      <div className="space-y-3">
        {suggestions?.map((suggestion, idx) => {
          const isExpanded = expandedArea === suggestion.area;
          const allocation = taskAllocation.find(a => a.area === suggestion.area);

          return (
            <div key={idx} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-100">{suggestion.area}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {suggestion.reasoning}
                  </div>
                  {allocation && (
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {allocation.remaining_hours.toFixed(1)}h remaining
                      </span>
                      <span>
                        {allocation.completed_hours.toFixed(1)}h / {allocation.total_projected_hours.toFixed(1)}h completed
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-400">
                      {suggestion.suggested_target}h
                    </div>
                    <div className="text-xs text-gray-500">per week</div>
                  </div>
                  <button
                    onClick={() => handleApplySuggestion(suggestion.area, suggestion.suggested_target)}
                    disabled={upsertTarget.isPending}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Set Target
                  </button>
                </div>
              </div>

              {/* Task Breakdown */}
              {allocation && allocation.tasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <button
                    onClick={() => setExpandedArea(isExpanded ? null : suggestion.area)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {isExpanded ? '▼' : '▶'} {allocation.tasks.length} task{allocation.tasks.length > 1 ? 's' : ''}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 space-y-2">
                      {allocation.tasks.map(task => (
                        <div key={task.id} className="text-xs bg-gray-800/50 rounded p-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="text-gray-200">{task.task_name}</div>
                              {task.due_date && (
                                <div className="text-gray-500 mt-1">
                                  Due: {new Date(task.due_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                            <div className="text-right text-gray-400">
                              <div>{task.hours_worked.toFixed(1)} / {task.hours_projected.toFixed(1)}h</div>
                              <div className="text-gray-500">
                                {((task.hours_worked / task.hours_projected) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
