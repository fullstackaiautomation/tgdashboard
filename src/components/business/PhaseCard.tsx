import type { FC } from 'react';
import { useState } from 'react';
import type { Phase } from '../../types/project';
import { useTasks } from '../../hooks/useTasks';
import { usePhaseProgress } from '../../hooks/usePhaseProgress';
import { ProgressBar } from '../shared/ProgressBar';
import { TaskForm } from './TaskForm';

interface PhaseCardProps {
  phase: Phase;
  projectId: string;
  businessId: string;
}

export const PhaseCard: FC<PhaseCardProps> = ({ phase, projectId, businessId }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const { data: allTasks } = useTasks();

  // Filter tasks for this phase
  const phaseTasks = allTasks?.filter(
    (task) => task.phase_id === phase.id && task.project_id === projectId
  ) || [];

  const { progress, completedCount, totalCount } = usePhaseProgress(phaseTasks);

  const statusColors = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  };

  const statusColor = statusColors[phase.status as keyof typeof statusColors] || 'bg-gray-500';

  return (
    <div className="border border-gray-600 rounded-lg bg-gray-900/50">
      {/* Phase Header */}
      <div
        className="p-3 cursor-pointer hover:bg-gray-900/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <span className="font-medium text-white text-sm">{phase.name}</span>
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          </div>
          <div className="flex items-center gap-3">
            {totalCount > 0 ? (
              <div className="flex items-center gap-2">
                <div className="w-24">
                  <ProgressBar progress={progress} size="sm" />
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {completedCount}/{totalCount}
                </span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">No tasks</span>
            )}
            <span className="text-xs text-gray-400">#{phase.sequence_order}</span>
          </div>
        </div>
        {phase.description && (
          <p className="text-gray-400 text-xs mt-1 ml-6">{phase.description}</p>
        )}
      </div>

      {/* Tasks Section */}
      {isExpanded && (
        <div className="border-t border-gray-600 p-3">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-xs font-medium text-gray-300">Tasks</h5>
            <button
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskForm(!showTaskForm);
              }}
            >
              {showTaskForm ? '− Cancel' : '+ Add Task'}
            </button>
          </div>

          {/* Task Creation Form */}
          {showTaskForm && (
            <div className="mb-3 p-3 bg-gray-800 rounded border border-gray-700">
              <TaskForm
                businessId={businessId}
                projectId={projectId}
                phaseId={phase.id}
                onSuccess={() => setShowTaskForm(false)}
                onCancel={() => setShowTaskForm(false)}
              />
            </div>
          )}

          {phaseTasks.length === 0 ? (
            <div className="text-gray-400 text-xs text-center py-4 border border-gray-600 rounded">
              No tasks yet. Add a task to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {phaseTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">{task.task_name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        task.status === 'Done'
                          ? 'bg-green-500/20 text-green-400'
                          : task.status === 'In progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
