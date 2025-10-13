import type { FC } from 'react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Project } from '../../types/project';
import { usePhases } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useProjectProgress } from '../../hooks/useProjectProgress';
import { PhaseCard } from './PhaseCard';
import { AddPhaseModal } from './AddPhaseModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { Progress } from '@/components/ui/progress';

interface ProjectCardProps {
  project: Project;
  businessId?: string;
}

export const ProjectCard: FC<ProjectCardProps> = ({ project, businessId }) => {
  const [isExpanded, _setIsExpanded] = useState(true);
  const [isAddPhaseModalOpen, setIsAddPhaseModalOpen] = useState(false);
  const { data: phases, isLoading } = usePhases(project.id);
  const { data: allTasks } = useTasks();

  // Filter tasks for this project
  const projectTasks = allTasks?.filter((task) => task.project_id === project.id) || [];

  // Filter tasks without a phase (No Phase Identified)
  const unassignedTasks = projectTasks.filter((task) => !task.phase_id);

  // Calculate project progress
  const { progress: _progress, totalPhases: _totalPhases, isStalled: _isStalled } = useProjectProgress(
    phases || [],
    projectTasks
  );

  return (
    <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/80 border-gray-700/80 shadow-lg overflow-hidden">
      {/* Phases Section - Always visible when expanded */}
      {isExpanded && (
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
              Phases
            </h4>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800/50"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddPhaseModalOpen(true);
              }}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Phase
            </Button>
          </div>

          {isLoading ? (
            <div className="text-gray-400 text-sm">Loading phases...</div>
          ) : (
            <div className="space-y-4">
              {/* Render existing phases */}
              {phases && phases.length > 0 ? (
                phases.map((phase) => (
                  <PhaseCard
                    key={phase.id}
                    phase={phase}
                    projectId={project.id}
                    businessId={businessId || project.business_id}
                  />
                ))
              ) : (
                <Card className="bg-gray-800/40 border-gray-700/50 border-dashed">
                  <CardContent className="py-8">
                    <div className="text-center text-gray-400">
                      <p className="text-sm">No phases yet. Add a phase to organize tasks.</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Phase Identified - Virtual phase for unassigned tasks */}
              {/* Always show this section when there are unassigned tasks, regardless of whether there are phases */}
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
            </div>
          )}
        </CardContent>
      )}

      {/* Add Phase Modal */}
      <AddPhaseModal
        isOpen={isAddPhaseModalOpen}
        onClose={() => setIsAddPhaseModalOpen(false)}
        projectId={project.id}
        projectName={project.name}
      />
    </Card>
  );
};
