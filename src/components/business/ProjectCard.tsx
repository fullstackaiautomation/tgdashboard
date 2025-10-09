import type { FC } from 'react';
import { useState } from 'react';
import type { Project } from '../../types/project';
import { usePhases } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useProjectProgress } from '../../hooks/useProjectProgress';
import { PhaseCard } from './PhaseCard';
import { ProgressBar } from '../shared/ProgressBar';

interface ProjectCardProps {
  project: Project;
  businessId?: string;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, businessId }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { data: phases, isLoading } = usePhases(project.id);
  const { data: allTasks } = useTasks();

  // Filter tasks for this project
  const projectTasks = allTasks?.filter((task) => task.project_id === project.id) || [];

  // Calculate project progress
  const { progress, totalPhases, isStalled } = useProjectProgress(
    phases || [],
    projectTasks
  );

  const statusColors = {
    active: 'bg-green-500',
    paused: 'bg-yellow-500',
    completed: 'bg-blue-500',
    archived: 'bg-gray-500',
  };

  const statusColor = statusColors[project.status as keyof typeof statusColors] || 'bg-gray-500';

  return (
    <div className="border border-gray-700 rounded-lg bg-gray-800/50">
      {/* Project Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-800/80 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${
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
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            {isStalled && (
              <span className="text-xs text-yellow-500" title="No activity in 7+ days">
                ⚠️ No recent activity
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {totalPhases > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-32">
                  <ProgressBar progress={progress} size="md" />
                </div>
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {progress.toFixed(1)}%
                </span>
              </div>
            )}
            <div className="text-sm text-gray-400">
              {phases?.length || 0} phase{phases?.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        {project.description && (
          <p className="text-gray-400 text-sm mt-2 ml-8">{project.description}</p>
        )}
      </div>

      {/* Phases Section */}
      {isExpanded && (
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-300">Phases</h4>
            <button
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-medium"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement create phase modal
                console.log('Create phase for project:', project.id);
              }}
            >
              + Add Phase
            </button>
          </div>

          {isLoading ? (
            <div className="text-gray-400 text-sm">Loading phases...</div>
          ) : !phases || phases.length === 0 ? (
            <div className="text-gray-400 text-sm text-center py-6 border border-gray-700 rounded">
              No phases yet. Add a phase to organize tasks.
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  projectId={project.id}
                  businessId={businessId || project.business_id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
