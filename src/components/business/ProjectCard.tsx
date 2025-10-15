import type { FC } from 'react';
import { useState } from 'react';
import { Plus, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Project } from '../../types/project';
import { usePhases } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useProjectProgress } from '../../hooks/useProjectProgress';
import { PhaseCard } from './PhaseCard';
import { AddPhaseModal } from './AddPhaseModal';
import { ProgressBar } from '../shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateVelocity, formatEstimatedCompletion } from '../../utils/projectVelocity';
import { checkProjectActivity, formatLastActivity } from '../../utils/projectActivity';

interface ProjectCardProps {
  project: Project;
  businessId?: string;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, businessId }) => {
  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState(false);
  const { data: phases, isLoading } = usePhases(project.id);
  const { data: allTasks } = useTasks();

  // Filter tasks for this project
  const projectTasks = allTasks?.filter((task) => task.project_id === project.id) || [];

  // Filter tasks without a phase (No Phase Identified)
  const unassignedTasks = projectTasks.filter((task) => !task.phase_id);

  // Calculate project progress
  const { progress, totalPhases, isStalled } = useProjectProgress(
    phases || [],
    projectTasks
  );

  // Calculate velocity metrics
  const velocityData = calculateVelocity(projectTasks);

  // Check activity status
  const activityStatus = checkProjectActivity(projectTasks);

  return (
    <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700">
      {/* Project Progress Header */}
      <div className="px-6 py-4 bg-gray-800/70 border-b border-gray-700">
        {/* Progress Bar - Large and Prominent */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Project Progress</span>
            <span className="text-2xl font-bold text-gray-100">{progress.toFixed(1)}%</span>
          </div>
          <ProgressBar progress={progress} size="lg" showLabel={false} />
        </div>

        {/* Metrics Row */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Velocity & Estimated Completion */}
          {velocityData.velocity > 0 && velocityData.estimatedCompletionDate && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <TrendingUp size={14} className="text-blue-400" />
              <span>{formatEstimatedCompletion(velocityData.estimatedCompletionDate)}</span>
            </div>
          )}

          {/* Stalled Warning */}
          {isStalled && (
            <Badge className="bg-orange-600/20 text-orange-400 border border-orange-600">
              <AlertTriangle size={12} className="mr-1" />
              {activityStatus.message}
            </Badge>
          )}

          {/* Last Activity (non-stalled projects) */}
          {!isStalled && activityStatus.lastActivityDate && (
            <span className="text-xs text-gray-500">
              Last activity: {formatLastActivity(activityStatus.lastActivityDate)}
            </span>
          )}
        </div>
      </div>

      {/* Phases Section */}
      <div>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-gray-100">
            Phases {totalPhases > 0 && <span className="text-sm text-gray-500 font-normal">({totalPhases})</span>}
          </h4>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-gray-400 text-sm text-center">Loading phases...</div>
        ) : (
          <div>
            {/* Render existing phases */}
            {phases && phases.length > 0 &&
              phases.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  projectId={project.id}
                  businessId={businessId || project.business_id}
                />
              ))
            }

            {/* No Phase Identified - Virtual phase for unassigned tasks */}
            {unassignedTasks.length > 0 && (
              <PhaseCard
                key="no-phase"
                phase={{
                  id: 'no-phase',
                  project_id: project.id,
                  name: 'No Phase Identified',
                  description: null,
                  status: 'active',
                  sequence_order: 9999,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  user_id: '',
                }}
                projectId={project.id}
                businessId={businessId || project.business_id}
              />
            )}

            {/* No phases message */}
            {(!phases || phases.length === 0) && unassignedTasks.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-400">
                <p className="text-sm">No phases yet. Add a phase to organize tasks.</p>
              </div>
            )}

            {/* Add Phase Button */}
            <div className="px-4 py-3 border-t border-gray-700/50">
              <Button
                size="sm"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsAddPhaseModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Phase
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Phase Modal */}
      <AddPhaseModal
        isOpen={isAddPhaseModalOpen}
        onClose={() => setIsAddPhaseModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </div>
  );
};
