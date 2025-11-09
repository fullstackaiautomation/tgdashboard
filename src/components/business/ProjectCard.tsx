import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../../types/project';
import { usePhases } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { Button } from '@/components/ui/button';
import { TaskCard } from '../tasks/TaskCard';
import { AddTaskModal } from '../tasks/AddTaskModal';

interface ProjectCardProps {
  project: Project;
  businessId?: string;
  businessColor?: string;
  expandedPhases: Record<string, boolean>;
  onTogglePhase: (phaseId: string) => void;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, businessId, businessColor, expandedPhases, onTogglePhase }) => {
  const { data: phases, isLoading: phasesLoading } = usePhases(project.id);
  const { data: allTasks } = useTasks();
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  // Filter tasks for this project
  const projectTasks = allTasks?.filter((task) => task.project_id === project.id) || [];

  // Get unassigned tasks (no phase)
  const unassignedTasks = projectTasks.filter((task) => !task.phase_id);

  const handleAddTask = (phaseId: string | null) => {
    setSelectedPhaseId(phaseId);
    setShowAddTaskModal(true);
  };

  if (phasesLoading) {
    return (
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: businessColor ? `${businessColor}15` : 'rgb(17 24 39 / 0.5)',
          borderColor: businessColor ? `${businessColor}40` : 'rgb(55 65 81)',
        }}
      >
        <p className="text-gray-400">Loading phases...</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg border w-full"
      style={{
        backgroundColor: businessColor ? `${businessColor}15` : 'rgb(17 24 39 / 0.5)',
        borderColor: businessColor ? `${businessColor}40` : 'rgb(55 65 81)',
      }}
    >
      {/* Phases with Task Cards */}
      <div className="divide-y" style={{ borderColor: businessColor ? `${businessColor}20` : 'rgb(55 65 81)' }}>
        {/* Real Phases */}
        {phases && phases.length > 0 && phases.map((phase) => {
          const phaseTasks = projectTasks.filter((task) => task.phase_id === phase.id);
          const isExpanded = expandedPhases[phase.id];

          // Calculate phase statistics
          const completedTasks = phaseTasks.filter((t) => (t.progress_percentage ?? 0) === 100).length;
          const totalTasks = phaseTasks.length;
          const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          const estimatedHours = phaseTasks.reduce((sum, t) => sum + (t.hours_projected || 0), 0);
          const actualHours = phaseTasks.reduce((sum, t) => sum + (t.hours_worked || 0), 0);
          const hoursAccuracy = estimatedHours > 0 ? Math.round((actualHours / estimatedHours) * 100) : 0;

          return (
            <div key={phase.id} className="border-t" style={{ borderColor: businessColor ? `${businessColor}20` : 'rgb(55 65 81)' }}>
              {/* Phase Header */}
              <div className="px-6 py-4 hover:bg-black/30 transition-colors flex items-center justify-between gap-4">
                <div
                  onClick={() => onTogglePhase(phase.id)}
                  className="cursor-pointer flex items-center gap-3 min-w-0"
                >
                  <div className={`transform transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-100 truncate">Phase {phase.sequence_order}: {phase.name}</h3>
                </div>

                {/* Phase Statistics Scorecards */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Phase Status */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className={`font-semibold ${
                      completionPercentage === 100 ? 'text-green-400' : completionPercentage > 0 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {completionPercentage === 100 ? 'Completed' : completionPercentage > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-100 font-semibold">{completedTasks}/{totalTasks}</span>
                  </div>

                  {/* Estimated Hours */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Est</span>
                    <span className="text-gray-100 font-semibold">{Math.round(estimatedHours)}h</span>
                  </div>

                  {/* Actual Hours */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Worked</span>
                    <span className="text-gray-100 font-semibold">{Math.round(actualHours)}h</span>
                  </div>

                  {/* Hours Accuracy (difference) */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Accuracy</span>
                    <span className={`font-semibold ${Math.abs(actualHours - estimatedHours) <= 2 ? 'text-green-400' : Math.abs(actualHours - estimatedHours) <= 5 ? 'text-blue-400' : 'text-orange-400'}`}>
                      {Math.round(actualHours - estimatedHours)}h
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddTask(phase.id);
                  }}
                  className="h-8 px-2 text-gray-400 hover:text-gray-100 hover:bg-black/30"
                  title="Add task to this phase"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Phase Tasks */}
              {isExpanded && (
                <div className="px-6 py-4 space-y-3 bg-black/20">
                  {phaseTasks.length > 0 ? (
                    phaseTasks.map((task) => (
                      <TaskCard key={task.id} task={task} compact />
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-8">No tasks in this phase</p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned Tasks (No Phase) */}
        {(() => {
          // Calculate unassigned tasks statistics
          const unassignedCompleted = unassignedTasks.filter((t) => (t.progress_percentage ?? 0) === 100).length;
          const unassignedTotal = unassignedTasks.length;
          const unassignedCompletion = unassignedTotal > 0 ? Math.round((unassignedCompleted / unassignedTotal) * 100) : 0;
          const unassignedEstHours = unassignedTasks.reduce((sum, t) => sum + (t.hours_projected || 0), 0);
          const unassignedActHours = unassignedTasks.reduce((sum, t) => sum + (t.hours_worked || 0), 0);
          const unassignedAccuracy = unassignedEstHours > 0 ? Math.round((unassignedActHours / unassignedEstHours) * 100) : 0;

          return unassignedTasks.length > 0 ? (
            <div className="border-t" style={{ borderColor: businessColor ? `${businessColor}20` : 'rgb(55 65 81)' }}>
              {/* Phase Header */}
              <div
                onClick={() => onTogglePhase('no-phase')}
                className="px-6 py-4 cursor-pointer hover:bg-black/30 transition-colors flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`transform transition-transform flex-shrink-0 ${expandedPhases['no-phase'] ? 'rotate-90' : ''}`}>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-100 truncate">Unassigned</h3>
                </div>

                {/* Unassigned Statistics Scorecards */}
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {/* Status */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className={`font-semibold ${
                      unassignedCompletion === 100 ? 'text-green-400' : unassignedCompletion > 0 ? 'text-blue-400' : 'text-gray-400'
                    }`}>
                      {unassignedCompletion === 100 ? 'Completed' : unassignedCompletion > 0 ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>

                  {/* Tasks */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-100 font-semibold">{unassignedCompleted}/{unassignedTotal}</span>
                  </div>

                  {/* Estimated Hours */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Est</span>
                    <span className="text-gray-100 font-semibold">{Math.round(unassignedEstHours)}h</span>
                  </div>

                  {/* Actual Hours */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Worked</span>
                    <span className="text-gray-100 font-semibold">{Math.round(unassignedActHours)}h</span>
                  </div>

                  {/* Hours Accuracy (difference) */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-gray-800/60 rounded border border-gray-700 text-xs whitespace-nowrap">
                    <span className="text-gray-400">Hours Accuracy</span>
                    <span className={`font-semibold ${Math.abs(unassignedActHours - unassignedEstHours) <= 2 ? 'text-green-400' : Math.abs(unassignedActHours - unassignedEstHours) <= 5 ? 'text-blue-400' : 'text-orange-400'}`}>
                      {Math.round(unassignedActHours - unassignedEstHours)}h
                    </span>
                  </div>
                </div>
              </div>

              {/* Unassigned Tasks */}
              {expandedPhases['no-phase'] && (
                <div className="px-6 py-4 space-y-3 bg-black/20">
                  {unassignedTasks.map((task) => (
                    <TaskCard key={task.id} task={task} compact />
                  ))}
                </div>
              )}
            </div>
          ) : null
        })()}
      </div>

      {/* No Phases Message */}
      {(!phases || phases.length === 0) && unassignedTasks.length === 0 && (
        <div className="px-6 py-12 text-center text-gray-400">
          <p className="text-sm mb-4">No phases or tasks yet.</p>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add Phase
          </Button>
        </div>
      )}

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSuccess={() => {
          setShowAddTaskModal(false);
          setSelectedPhaseId(null);
        }}
      />
    </div>
  );
};
