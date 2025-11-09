import type { FC } from 'react';
import { useState } from 'react';
import { CheckCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDialog } from '@/components/ui/calendar-dialog';
import { AutomationsSelector } from '@/components/ui/automations-selector';
import type { Project } from '../../types/project';
import type { ProjectMetrics } from '../../hooks/useProjectMetrics';
import { useUpdateProject } from '../../hooks/useProjects';
import { useProjectAutoCompletion } from '../../hooks/useProjectAutoCompletion';
import { formatDateString, parseLocalDate } from '../../utils/dateHelpers';

interface ProjectGameplanDetailBoxProps {
  project: Project;
  metrics: ProjectMetrics;
  businessColor?: string;
}

export const ProjectGameplanDetailBox: FC<ProjectGameplanDetailBoxProps> = ({
  project,
  metrics,
  businessColor = '#a855f7',
}) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const updateProject = useUpdateProject();

  // Auto-set completion date when project reaches 100%
  useProjectAutoCompletion(project, metrics.completionPercentage);

  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: value });
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveEdit = async (field: string) => {
    const value = editValues[field];
    try {
      let updates: Record<string, any> = {};

      if (field === 'project_goal' || field === 'project_automations' || field === 'notes') {
        updates[field] = value || null;
      }

      await updateProject.mutateAsync({
        id: project.id,
        updates,
      });
      setEditingField(null);
      setEditValues({});
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  };

  const getCompletionStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-600';
      case 'In Progress':
        return 'bg-yellow-600';
      case 'Completed':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getEstimationColor = (estimation: string) => {
    switch (estimation) {
      case 'Accurate':
        return 'bg-green-600/20 text-green-400 border-green-600';
      case 'Underestimated':
        return 'bg-yellow-600/20 text-yellow-400 border-yellow-600';
      case 'Overestimated':
        return 'bg-blue-600/20 text-blue-400 border-blue-600';
      default:
        return 'bg-gray-600/20 text-gray-400 border-gray-600';
    }
  };

  return (
    <div
      className="rounded-lg border p-6 h-full overflow-y-auto"
      style={{
        backgroundColor: `${businessColor}15`,
        borderColor: `${businessColor}40`,
      }}
    >
      {/* Editable Fields Section - Organized in requested order */}
      <div className="space-y-4">
        {/* Row 3: Start Date - Est. Completion - Completion Status */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Start Date - Using Calendar Dialog */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Start Date</label>
              <CalendarDialog
                value={project.project_start_date}
                onChange={(date) => {
                  if (date) {
                    const parsedDate = parseLocalDate(date);
                    updateProject.mutate({
                      id: project.id,
                      updates: {
                        project_start_date: parsedDate?.toISOString() || null,
                      },
                    });
                  } else {
                    updateProject.mutate({
                      id: project.id,
                      updates: {
                        project_start_date: null,
                      },
                    });
                  }
                }}
                label="Select Start Date"
                placeholder="Pick a date"
                disableFutureDates={false}
              />
            </div>

            {/* Est. Completion - Using Calendar Dialog */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Est. Completion</label>
              <CalendarDialog
                value={project.project_estimated_completion}
                onChange={(date) => {
                  if (date) {
                    const parsedDate = parseLocalDate(date);
                    updateProject.mutate({
                      id: project.id,
                      updates: {
                        project_estimated_completion: parsedDate?.toISOString() || null,
                      },
                    });
                  } else {
                    updateProject.mutate({
                      id: project.id,
                      updates: {
                        project_estimated_completion: null,
                      },
                    });
                  }
                }}
                label="Select Estimated Completion"
                placeholder="Pick a date"
                disableFutureDates={false}
              />
            </div>

            {/* Completion Status */}
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase block mb-2">Status</label>
              <Badge className={`${getCompletionStatusColor(metrics.completionStatus)} text-white text-xs w-full text-center justify-center py-2`}>
                {metrics.completionStatus}
              </Badge>
            </div>
          </div>
        </div>

        {/* Row 4: Phases - Est. Hours - Actual Hours */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Phases</span>
            <span className="text-lg font-bold text-gray-100">{metrics.totalPhases}</span>
          </div>
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Est. Hours</span>
            <span className="text-lg font-bold text-gray-100">{metrics.estimatedHours.toFixed(1)}</span>
          </div>
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Actual Hours</span>
            <span className="text-lg font-bold text-gray-100">{metrics.actualHours.toFixed(1)}</span>
          </div>
        </div>

        {/* Row 5: Completed Tasks - Total Tasks - Completion % */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Completed</span>
            <span className="text-lg font-bold text-green-400">{metrics.completedTasks}</span>
          </div>
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Total Tasks</span>
            <span className="text-lg font-bold text-gray-100">{metrics.totalTasks}</span>
          </div>
          <div className="bg-gray-800/30 rounded p-3 border border-gray-700/30">
            <span className="text-xs text-gray-400 uppercase block mb-1">Completion</span>
            <span className="text-lg font-bold text-purple-400">{metrics.completionPercentage.toFixed(0)}%</span>
          </div>
        </div>

        {/* Row 6: Automations */}
        <div>
          <label className="text-sm font-semibold text-gray-300 block mb-3">
            Automations
          </label>
          <AutomationsSelector
            selectedIds={project.automation_ids || []}
            onChange={(automationIds) => {
              updateProject.mutate({
                id: project.id,
                updates: {
                  automation_ids: automationIds,
                },
              });
            }}
          />
        </div>

        {/* Row 7: Notes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-300">Notes</label>
            {editingField !== 'notes' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200"
                onClick={() => startEdit('notes', project.notes || '')}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {editingField === 'notes' ? (
            <div className="space-y-2">
              <textarea
                value={editValues['notes']}
                onChange={(e) => setEditValues({ ...editValues, notes: e.target.value })}
                className="w-full bg-gray-800 text-gray-100 rounded border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                rows={3}
                placeholder="Enter notes..."
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-8 px-3 text-gray-400 hover:text-gray-200"
                >
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => saveEdit('notes')}
                  className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Save className="w-4 h-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-300 bg-gray-800/30 rounded p-3 min-h-[60px]">
              {project.notes || <span className="text-gray-500 italic">No notes</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
