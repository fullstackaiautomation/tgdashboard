import type { FC } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Calendar } from 'lucide-react';
import type { Phase } from '../../types/project';
import { useTasks, useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useUpdatePhase } from '../../hooks/useProjects';
import { usePhaseProgress } from '../../hooks/usePhaseProgress';
import { TaskForm } from './TaskForm';
import { EditTaskModal } from './EditTaskModal';
import { PhaseTasksList } from './PhaseTasksList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { parseLocalDate, formatDateString } from '../../utils/dateHelpers';

interface PhaseCardProps {
  phase: Phase;
  projectId: string;
  businessId: string;
}

export const PhaseCard: FC<PhaseCardProps> = ({ phase, projectId, businessId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editModalTaskId, setEditModalTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ taskId: string; field: 'task_name' | 'description' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isEditingPhaseName, setIsEditingPhaseName] = useState(false);
  const [editPhaseName, setEditPhaseName] = useState('');
  const [showTasksList, setShowTasksList] = useState(false);

  const { data: allTasks } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updatePhase = useUpdatePhase();

  // Filter tasks for this phase
  // For "no-phase" virtual phase, filter tasks with null phase_id
  const phaseTasks = allTasks?.filter((task) => {
    if (phase.id === 'no-phase') {
      return task.project_id === projectId && !task.phase_id;
    }
    return task.phase_id === phase.id && task.project_id === projectId;
  }) || [];

  const { progress, completedCount, totalCount } = usePhaseProgress(phaseTasks);

  const handleToggleComplete = async (taskId: string, currentProgress: number) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: {
          progress_percentage: currentProgress === 100 ? 0 : 100,
          status: currentProgress === 100 ? 'Not started' : 'Done'
        }
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleUpdateDueDate = async (taskId: string, dueDateString: string) => {
    try {
      // Convert date string to ISO timestamp at noon local time
      let dueDateISO: string | null = null;
      if (dueDateString) {
        const parsedDate = parseLocalDate(dueDateString);
        if (parsedDate) {
          dueDateISO = parsedDate.toISOString();
        }
      }

      await updateTask.mutateAsync({
        id: taskId,
        updates: { due_date: dueDateISO }
      });
    } catch (error) {
      console.error('Failed to update due date:', error);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: string) => {
    try {
      const progress = status === 'Done' ? 100 : status === 'In progress' ? 50 : 0;
      await updateTask.mutateAsync({
        id: taskId,
        updates: {
          status: status as any,
          progress_percentage: progress
        }
      });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleInlineEdit = async (taskId: string, field: 'task_name' | 'description', value: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { [field]: value }
      });
      setEditingField(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask.mutateAsync(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleUpdatePhaseName = async (newName: string) => {
    // Don't update the "No Phase Identified" virtual phase
    if (phase.id === 'no-phase') {
      setIsEditingPhaseName(false);
      return;
    }

    try {
      await updatePhase.mutateAsync({
        id: phase.id,
        updates: { name: newName }
      });
      setIsEditingPhaseName(false);
      setEditPhaseName('');
    } catch (error) {
      console.error('Failed to update phase name:', error);
      setIsEditingPhaseName(false);
    }
  };

  return (
    <div className="border-t border-gray-700/50 flex flex-col h-full min-w-0">
      {/* Phase Header */}
      <div
        className="px-4 py-3 cursor-pointer hover:bg-gray-800/30 transition-colors flex items-center justify-between flex-shrink-0 min-w-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="sm" className="w-5 h-5 p-0 flex-shrink-0">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </Button>
          <div className="flex items-center gap-3 min-w-0 truncate">
            {isEditingPhaseName && phase.id !== 'no-phase' ? (
              <input
                type="text"
                value={editPhaseName}
                onChange={(e) => setEditPhaseName(e.target.value)}
                onBlur={() => handleUpdatePhaseName(editPhaseName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUpdatePhaseName(editPhaseName);
                  } else if (e.key === 'Escape') {
                    setIsEditingPhaseName(false);
                    setEditPhaseName('');
                  }
                }}
                className="text-base font-semibold bg-gray-800 text-gray-100 px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`text-base font-semibold text-gray-100 truncate ${
                  phase.id !== 'no-phase' ? 'cursor-pointer hover:text-blue-400' : ''
                }`}
                onClick={(e) => {
                  if (phase.id !== 'no-phase') {
                    e.stopPropagation();
                    setIsEditingPhaseName(true);
                    setEditPhaseName(phase.name);
                  }
                }}
              >
                {phase.id === 'no-phase' ? phase.name : `Phase ${phase.sequence_order}: ${phase.name}`}
              </span>
            )}
            {progress === 100 && (
              <Badge className="bg-green-600 text-white text-xs px-2 py-0.5 flex-shrink-0">
                Completed
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
          <div
            className="text-right cursor-pointer hover:text-blue-400 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowTasksList(true);
            }}
            title="Click to view task details"
          >
            <span className="text-sm text-gray-400">Progress: </span>
            <span className="text-sm font-bold text-gray-100">{progress.toFixed(0)}%</span>
            <span className="text-xs text-gray-500 ml-2">({completedCount}/{totalCount})</span>
          </div>
          {totalCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                // Delete phase functionality would go here
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      {isExpanded && (
        <div className="bg-gray-900/20 px-4 pb-4 overflow-hidden flex flex-col flex-1 min-w-0">
          {/* Table Header */}
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-700/50">
                <th className="text-left font-normal py-2 pl-2 w-12">Done</th>
                <th className="text-left font-normal py-2 w-20">Due</th>
                <th className="text-left font-normal py-2 w-20">Status</th>
                <th className="text-left font-normal py-2 min-w-0">Task</th>
                <th className="text-left font-normal py-2 min-w-0 hidden sm:table-cell">Desc</th>
                <th className="text-right font-normal py-2 pr-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {/* Task Rows */}
              {phaseTasks.map((task) => {
                const isCompleted = task.progress_percentage === 100;

                return (
                  <tr key={task.id} className="border-b border-gray-700/30 hover:bg-gray-800/20">
                    {/* Done Checkbox */}
                    <td className="py-3 pl-2">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => handleToggleComplete(task.id, task.progress_percentage ?? 0)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Due Date */}
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <input
                          type="date"
                          value={task.due_date ? formatDateString(parseLocalDate(task.due_date) || new Date()) : ''}
                          onChange={(e) => handleUpdateDueDate(task.id, e.target.value)}
                          className="bg-transparent text-sm text-gray-300 border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3">
                      <select
                        value={task.status}
                        onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                        className={`text-sm px-2 py-1 rounded border ${
                          task.status === 'Done'
                            ? 'bg-green-600/20 border-green-600 text-green-400'
                            : task.status === 'In progress'
                            ? 'bg-yellow-600/20 border-yellow-600 text-yellow-400'
                            : 'bg-gray-700/50 border-gray-600 text-gray-400'
                        } focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      >
                        <option value="Not started">Not started</option>
                        <option value="In progress">In progress</option>
                        <option value="Done">Completed</option>
                      </select>
                    </td>

                    {/* Task Name */}
                    <td className="py-3">
                      {editingField?.taskId === task.id && editingField.field === 'task_name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineEdit(task.id, 'task_name', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineEdit(task.id, 'task_name', editValue);
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          className="w-full bg-gray-800 text-gray-100 px-2 py-1 rounded border border-blue-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingField({ taskId: task.id, field: 'task_name' });
                            setEditValue(task.task_name);
                          }}
                          className={`cursor-pointer hover:text-blue-400 ${
                            isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                          }`}
                        >
                          {task.task_name}
                        </span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3">
                      {editingField?.taskId === task.id && editingField.field === 'description' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleInlineEdit(task.id, 'description', editValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleInlineEdit(task.id, 'description', editValue);
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                              setEditValue('');
                            }
                          }}
                          className="w-full bg-gray-800 text-gray-400 px-2 py-1 rounded border border-blue-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span
                          onClick={() => {
                            setEditingField({ taskId: task.id, field: 'description' });
                            setEditValue(task.description || '');
                          }}
                          className="text-gray-400 text-sm cursor-pointer hover:text-gray-300"
                        >
                          {task.description || 'Description...'}
                        </span>
                      )}
                    </td>

                    {/* Delete Button */}
                    <td className="py-3 pr-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="w-6 h-6 p-0 text-gray-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {/* Add Task Row */}
              {showTaskForm ? (
                <tr>
                  <td colSpan={6} className="py-4">
                    <TaskForm
                      businessId={businessId}
                      projectId={projectId}
                      phaseId={phase.id === 'no-phase' ? undefined : phase.id}
                      phaseName={phase.name}
                      onSuccess={() => setShowTaskForm(false)}
                      onCancel={() => setShowTaskForm(false)}
                    />
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={6} className="py-3">
                    <button
                      onClick={() => setShowTaskForm(true)}
                      className="w-full py-2 border-2 border-dashed border-gray-700 rounded hover:border-gray-600 hover:bg-gray-800/30 transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-gray-300"
                    >
                      <Plus className="w-4 h-4" />
                      Add Task
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Task Modal */}
      {editModalTaskId && (
        <EditTaskModal
          task={phaseTasks.find((t) => t.id === editModalTaskId)!}
          isOpen={!!editModalTaskId}
          onClose={() => setEditModalTaskId(null)}
          businessId={businessId}
        />
      )}

      {/* Phase Tasks List Modal (Drill-down) */}
      <PhaseTasksList
        tasks={phaseTasks}
        phaseName={phase.name}
        isOpen={showTasksList}
        onClose={() => setShowTasksList(false)}
      />
    </div>
  );
};
