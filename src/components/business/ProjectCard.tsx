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
  businessColor?: string;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, businessId, businessColor }) => {
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
    <div
      className="rounded-lg overflow-hidden border"
      style={{
        backgroundColor: businessColor ? `${businessColor}15` : 'rgb(17 24 39 / 0.5)',
        borderColor: businessColor ? `${businessColor}40` : 'rgb(55 65 81)',
      }}
    >
      {/* Phases Section */}
      <div>
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
