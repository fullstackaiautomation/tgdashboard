import type { FC } from 'react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, CheckCircle2, Circle, Clock, MoveHorizontal, Edit } from 'lucide-react';
import type { Phase } from '../../types/project';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { usePhaseProgress } from '../../hooks/usePhaseProgress';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { TaskForm } from './TaskForm';
import { EditTaskModal } from './EditTaskModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PhaseCardProps {
  phase: Phase;
  projectId: string;
  businessId: string;
}

export const PhaseCard: FC<PhaseCardProps> = ({ phase, projectId, businessId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');
  const [editModalTaskId, setEditModalTaskId] = useState<string | null>(null);

  const { data: allTasks } = useTasks();
  const { data: allProjects } = useProjects(businessId);
  const { data: projectPhases } = usePhases(selectedProjectId || projectId);
  const updateTask = useUpdateTask();

  // Filter tasks for this phase
  // For "no-phase" virtual phase, filter tasks with null phase_id
  const phaseTasks = allTasks?.filter((task) => {
    if (phase.id === 'no-phase') {
      return task.project_id === projectId && !task.phase_id;
    }
    return task.phase_id === phase.id && task.project_id === projectId;
  }) || [];

  const { progress, completedCount, totalCount } = usePhaseProgress(phaseTasks);

  const handleMoveTask = async (taskId: string, newProjectId: string, newPhaseId: string | null) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: {
          project_id: newProjectId,
          phase_id: newPhaseId === 'no-phase' ? null : newPhaseId
        }
      });
      setEditingTaskId(null);
      setSelectedProjectId('');
      setSelectedPhaseId('');
    } catch (error) {
      console.error('Failed to move task:', error);
    }
  };

  const statusConfig = {
    active: { label: 'Active', color: 'bg-emerald-500', textColor: 'text-emerald-400' },
    paused: { label: 'Paused', color: 'bg-amber-500', textColor: 'text-amber-400' },
    completed: { label: 'Done', color: 'bg-blue-500', textColor: 'text-blue-400' },
    archived: { label: 'Archived', color: 'bg-gray-500', textColor: 'text-gray-400' },
  };

  const status = statusConfig[phase.status as keyof typeof statusConfig] || statusConfig.active;

  return (
    <Card className="bg-gradient-to-r from-gray-800/60 to-gray-800/40 border-gray-700/60 overflow-hidden">
      {/* Phase Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-700/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-100">{phase.name}</span>
              <Badge variant="outline" className={`${status.color} border-0 text-white text-xs px-2 py-0`}>
                {status.label}
              </Badge>
              <Badge variant="outline" className="bg-gray-700/50 border-gray-600 text-gray-300 text-xs px-2 py-0">
                #{phase.sequence_order}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalCount > 0 ? (
              <>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Progress</div>
                  <div className="text-sm font-bold text-gray-100">{progress.toFixed(0)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Tasks</div>
                  <div className="text-sm font-bold text-gray-100">{completedCount}/{totalCount}</div>
                </div>
              </>
            ) : (
              <span className="text-xs text-gray-400">No tasks</span>
            )}
          </div>
        </div>
        {phase.description && (
          <p className="text-gray-400 text-sm mt-2 ml-9">{phase.description}</p>
        )}
        {totalCount > 0 && (
          <div className="mt-3 ml-9">
            <Progress value={progress} className="h-1.5" />
          </div>
        )}
      </div>

      {/* Tasks Section */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 bg-gray-900/30 p-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-sm font-semibold text-gray-300">Tasks</h5>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800/50"
              onClick={(e) => {
                e.stopPropagation();
                setShowTaskForm(!showTaskForm);
              }}
            >
              {showTaskForm ? (
                <>Cancel</>
              ) : (
                <>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Task
                </>
              )}
            </Button>
          </div>

          {/* Task Creation Form */}
          {showTaskForm && (
            <Card className="mb-4 bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <TaskForm
                  businessId={businessId}
                  projectId={projectId}
                  phaseId={phase.id === 'no-phase' ? undefined : phase.id}
                  phaseName={phase.name}
                  onSuccess={() => setShowTaskForm(false)}
                  onCancel={() => setShowTaskForm(false)}
                />
              </CardContent>
            </Card>
          )}

          {phaseTasks.length === 0 ? (
            <Card className="bg-gray-800/30 border-gray-700/50 border-dashed">
              <CardContent className="py-6">
                <div className="text-center text-gray-400 text-sm">
                  No tasks yet. Add a task to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {phaseTasks.map((task) => {
                const isCompleted = task.progress_percentage === 100;
                const inProgress = (task.progress_percentage ?? 0) > 0 && (task.progress_percentage ?? 0) < 100;
                const isEditing = editingTaskId === task.id;

                return (
                  <Card
                    key={task.id}
                    className={`bg-gray-800/60 border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg group ${
                      isCompleted ? 'opacity-70' : ''
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className="flex items-start gap-2 flex-1 cursor-pointer"
                          onClick={() => setEditModalTaskId(task.id)}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          ) : inProgress ? (
                            <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-tight hover:text-blue-400 transition-colors ${
                              isCompleted ? 'line-through text-gray-400' : 'text-gray-100'
                            }`}>
                              {task.task_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditModalTaskId(task.id)}
                            className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit task"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (isEditing) {
                                setEditingTaskId(null);
                                setSelectedProjectId('');
                                setSelectedPhaseId('');
                              } else {
                                setEditingTaskId(task.id);
                                setSelectedProjectId(task.project_id || '');
                                setSelectedPhaseId(task.phase_id || '');
                              }
                            }}
                            className="w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Move task"
                          >
                            <MoveHorizontal className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Project/Phase Dropdowns */}
                      {isEditing && (
                        <div className="space-y-2 mt-3 pt-3 border-t border-gray-700">
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">Move to Project:</label>
                            <select
                              value={selectedProjectId}
                              onChange={(e) => {
                                const newProjectId = e.target.value;
                                setSelectedProjectId(newProjectId);
                                setSelectedPhaseId('no-phase'); // Set to "No Phase Identified" when project changes
                                // Auto-save immediately with "No Phase Identified" (null phase)
                                handleMoveTask(task.id, newProjectId, 'no-phase');
                              }}
                              className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {allProjects?.map((proj) => (
                                <option key={proj.id} value={proj.id}>
                                  {proj.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedProjectId && (
                            <div>
                              <label className="text-xs text-gray-400 block mb-1">Move to Phase:</label>
                              <select
                                value={selectedPhaseId}
                                onChange={(e) => {
                                  const newPhaseId = e.target.value;
                                  setSelectedPhaseId(newPhaseId);
                                  // Auto-save when phase is selected (including "No Phase Identified")
                                  if (newPhaseId) {
                                    handleMoveTask(task.id, selectedProjectId, newPhaseId);
                                  }
                                }}
                                className="w-full px-2 py-1 text-xs bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="no-phase">No Phase Identified</option>
                                {projectPhases?.map((ph) => (
                                  <option key={ph.id} value={ph.id}>
                                    {ph.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      {(task.progress_percentage ?? 0) > 0 && !isEditing && (
                        <div className="mt-2">
                          <Progress value={task.progress_percentage ?? 0} className="h-1" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
    </Card>
  );
};
