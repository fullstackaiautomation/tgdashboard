import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useBusinessProgress } from '../../hooks/useBusinessProgress';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';
import { ProgressBar } from '../shared/ProgressBar';

export const BusinessDashboard: FC = () => {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync for Business pages too
  useRealtimeSync(userId);

  const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
  const { data: projects, isLoading: projectsLoading } = useProjects(selectedBusinessId || undefined);
  const { data: allPhases } = usePhases();
  const { data: allTasks } = useTasks();

  // Filter phases and tasks for selected business
  const businessPhases = useMemo(() => {
    if (!allPhases || !projects) return [];
    const projectIds = projects.map(p => p.id);
    return allPhases.filter(phase => projectIds.includes(phase.project_id));
  }, [allPhases, projects]);

  const businessTasks = useMemo(() => {
    if (!allTasks || !selectedBusinessId) return [];
    return allTasks.filter(task => task.business_id === selectedBusinessId);
  }, [allTasks, selectedBusinessId]);

  // Calculate business progress
  const {
    overallCompletion,
    totalProjects,
    activeTasks,
    completedTasks,
    totalTasks,
    isStalled,
  } = useBusinessProgress(projects || [], businessPhases, businessTasks);

  // Sort projects by completion (least complete first)
  const sortedProjects = useMemo(() => {
    if (!projects) return [];
    return [...projects].sort((a, b) => {
      const aPhases = businessPhases.filter(p => p.project_id === a.id);
      const aTasks = businessTasks.filter(t => t.project_id === a.id);
      const bPhases = businessPhases.filter(p => p.project_id === b.id);
      const bTasks = businessTasks.filter(t => t.project_id === b.id);

      const aProgress = calculateProjectProgress(aPhases, aTasks);
      const bProgress = calculateProjectProgress(bPhases, bTasks);

      return aProgress - bProgress;
    });
  }, [projects, businessPhases, businessTasks]);

  function calculateProjectProgress(phases: any[], tasks: any[]): number {
    if (phases.length > 0) {
      const phaseProgresses = phases.map(phase => {
        const phaseTasks = tasks.filter(t => t.phase_id === phase.id);
        if (phaseTasks.length === 0) return 0;
        return phaseTasks.reduce((sum, t) => sum + (t.progress_percentage ?? 0), 0) / phaseTasks.length;
      });
      return phaseProgresses.reduce((sum, p) => sum + p, 0) / phases.length;
    }
    if (tasks.length > 0) {
      return tasks.reduce((sum, t) => sum + (t.progress_percentage ?? 0), 0) / tasks.length;
    }
    return 0;
  }

  if (businessesLoading) {
    return (
      <div className="p-6">
        <div className="text-gray-400">Loading businesses...</div>
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="p-6">
        <div className="text-gray-400 text-center py-12">
          No businesses yet. Create your first business to get started.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Business Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Business
        </label>
        <select
          value={selectedBusinessId || ''}
          onChange={(e) => setSelectedBusinessId(e.target.value || null)}
          className="w-full md:w-1/2 px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a business...</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </select>
      </div>

      {selectedBusiness && (
        <>
          {/* Business Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: selectedBusiness.color }}
                  />
                  <h1 className="text-2xl font-bold text-white">{selectedBusiness.name}</h1>
                  {isStalled && (
                    <span className="text-sm text-yellow-500" title="No activity in 14+ days">
                      ⚠️ Stalled
                    </span>
                  )}
                </div>
                {selectedBusiness.description && (
                  <p className="text-gray-400 ml-7">{selectedBusiness.description}</p>
                )}
              </div>
            </div>

            {/* Business Metrics */}
            {totalProjects > 0 && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">Overall Progress</span>
                  <span className="text-lg font-semibold text-white">{overallCompletion.toFixed(1)}%</span>
                </div>
                <ProgressBar progress={overallCompletion} size="lg" />

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400">Projects</div>
                    <div className="text-xl font-semibold text-white">{totalProjects}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Active Tasks</div>
                    <div className="text-xl font-semibold text-yellow-500">{activeTasks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Completed</div>
                    <div className="text-xl font-semibold text-green-500">{completedTasks}/{totalTasks}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Projects Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Projects</h2>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                onClick={() => {
                  // TODO: Implement create project modal
                  console.log('Create project');
                }}
              >
                + New Project
              </button>
            </div>

            {projectsLoading ? (
              <div className="text-gray-400">Loading projects...</div>
            ) : !projects || projects.length === 0 ? (
              <div className="text-gray-400 text-center py-12 border border-gray-700 rounded-lg">
                No projects yet. Create your first project to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {sortedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} businessId={selectedBusinessId || ''} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
