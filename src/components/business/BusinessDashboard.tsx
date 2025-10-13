import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, CheckCircle2, Folder, ListTodo, Target, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases, useDeleteProject } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
// import { useBusinessProgress } from '../../hooks/useBusinessProgress';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';

export const BusinessDashboard: FC = () => {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const deleteProject = useDeleteProject();

  // Get current user ID for real-time sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Enable real-time sync
  useRealtimeSync(userId);

  // Load all data
  const { data: allProjects } = useProjects();
  const { data: allPhases } = usePhases();
  const { data: allTasks } = useTasks();

  // Toggle project expansion
  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjectIds);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjectIds(newExpanded);
  };

  // Handle project deletion with confirmation
  const handleDeleteProject = (projectId: string) => {
    if (deleteConfirmId === projectId) {
      // Second click - delete the project
      deleteProject.mutate(projectId, {
        onSuccess: () => {
          setDeleteConfirmId(null);
          // Remove from expanded projects if it was expanded
          const newExpanded = new Set(expandedProjectIds);
          newExpanded.delete(projectId);
          setExpandedProjectIds(newExpanded);
        },
        onError: (error) => {
          console.error('Failed to delete project:', error);
          alert('Failed to delete project. Please try again.');
          setDeleteConfirmId(null);
        }
      });
    } else {
      // First click - set confirmation
      setDeleteConfirmId(projectId);
      // Reset confirmation after 3 seconds
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // Filter projects and tasks based on selected business
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    if (!selectedBusinessId) return allProjects;
    return allProjects.filter(p => p.business_id === selectedBusinessId);
  }, [allProjects, selectedBusinessId]);

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    if (!selectedBusinessId) return allTasks;
    return allTasks.filter(t => t.business_id === selectedBusinessId);
  }, [allTasks, selectedBusinessId]);

  // Calculate aggregate stats for overview cards
  const stats = useMemo(() => {
    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(p => {
      const projectTasks = filteredTasks.filter(t => t.project_id === p.id);
      return projectTasks.some(t => (t.progress_percentage ?? 0) < 100);
    }).length;

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(t => t.progress_percentage === 100).length;
    const activeTasks = totalTasks - completedTasks;

    const totalPhases = allPhases?.filter(phase =>
      filteredProjects.some(p => p.id === phase.project_id)
    ).length ?? 0;

    return {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      activeTasks,
      totalPhases,
    };
  }, [filteredProjects, filteredTasks, allPhases]);

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
        <Card className="bg-gray-800/60 border-gray-700">
          <CardContent className="py-12">
            <div className="text-center text-gray-400">
              <p className="text-lg mb-2">No businesses yet</p>
              <p className="text-sm">Create your first business to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 bg-gray-800/50"
            onClick={() => setShowNewProjectModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Project
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
            onClick={() => {
              // TODO: Implement create business modal
              console.log('Create business');
            }}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Area
          </Button>
        </div>
      </div>

      {/* Business Filter - Full Width Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${businesses.length + 1}, 1fr)` }}>
        <Button
          variant="outline"
          className={`h-14 text-base font-semibold transition-all border-2 ${
            selectedBusinessId === null
              ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-lg shadow-blue-500/30'
              : 'hover:bg-blue-500/20 border-blue-600/50 text-blue-400'
          }`}
          style={{
            backgroundColor: selectedBusinessId === null ? undefined : 'rgba(37, 99, 235, 0.15)',
          }}
          onClick={() => setSelectedBusinessId(null)}
        >
          All Areas
        </Button>
        {/* Sort businesses in specific order: Full Stack, Huge Capital, S4, 808, Personal, Health, Golf, Service SaaS */}
        {businesses
          .sort((a, b) => {
            const order = ['Full Stack', 'Huge Capital', 'S4', '808', 'Personal', 'Health', 'Golf', 'Service SaaS'];
            const indexA = order.indexOf(a.name);
            const indexB = order.indexOf(b.name);
            // If not in order list, put at end
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
          })
          .map((business) => {
          const isSelected = selectedBusinessId === business.id;
          return (
            <Button
              key={business.id}
              variant="outline"
              className={`h-14 text-base font-semibold transition-all border-2 ${
                isSelected
                  ? 'text-white shadow-lg'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: isSelected ? business.color : `${business.color}30`,
                borderColor: isSelected ? business.color : `${business.color}80`,
                color: isSelected ? 'white' : business.color,
                boxShadow: isSelected ? `0 10px 15px -3px ${business.color}30` : undefined,
              }}
              onClick={() => setSelectedBusinessId(business.id)}
            >
              {business.name}
            </Button>
          );
        })}
      </div>

      {/* Overview Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Projects */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Projects</p>
                <p className="text-3xl font-bold text-blue-400">{stats.totalProjects}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeProjects} active</p>
              </div>
              <Folder className="w-10 h-10 text-blue-400/30" />
            </div>
          </CardContent>
        </Card>

        {/* Total Phases */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Phases</p>
                <p className="text-3xl font-bold text-purple-400">{stats.totalPhases}</p>
                <p className="text-xs text-gray-500 mt-1">across all projects</p>
              </div>
              <Target className="w-10 h-10 text-purple-400/30" />
            </div>
          </CardContent>
        </Card>

        {/* Active Tasks */}
        <Card className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/10 border-yellow-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Active Tasks</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.activeTasks}</p>
                <p className="text-xs text-gray-500 mt-1">in progress</p>
              </div>
              <ListTodo className="w-10 h-10 text-yellow-400/30" />
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks */}
        <Card className="bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-700/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-400">{stats.completedTasks}</p>
                <p className="text-xs text-gray-500 mt-1">of {stats.totalTasks} tasks</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Section */}
      <div>
        <h2 className="text-lg font-bold text-gray-100 mb-4">
          {selectedBusinessId
            ? `${businesses.find(b => b.id === selectedBusinessId)?.name} Projects`
            : 'All Projects'}
        </h2>

        {filteredProjects.length === 0 ? (
          <Card className="bg-gray-800/60 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredProjects.map((project) => {
              const isExpanded = expandedProjectIds.has(project.id);
              const business = businesses.find(b => b.id === project.business_id);
              const projectPhases = allPhases?.filter(p => p.project_id === project.id) || [];
              const projectTasks = filteredTasks.filter(t => t.project_id === project.id);

              const completedTasks = projectTasks.filter(t => t.progress_percentage === 100).length;
              const totalTasks = projectTasks.length;

              // Calculate project progress
              let projectProgress = 0;
              if (projectPhases.length > 0) {
                const phaseProgresses = projectPhases.map(phase => {
                  const phaseTasks = projectTasks.filter(t => t.phase_id === phase.id);
                  if (phaseTasks.length === 0) return 0;
                  return phaseTasks.reduce((sum, t) => sum + (t.progress_percentage ?? 0), 0) / phaseTasks.length;
                });
                projectProgress = phaseProgresses.reduce((sum, p) => sum + p, 0) / phaseProgresses.length;
              } else if (totalTasks > 0) {
                projectProgress = projectTasks.reduce((sum, t) => sum + (t.progress_percentage ?? 0), 0) / totalTasks;
              }

              return (
                <Card
                  key={project.id}
                  className="bg-gray-800/60 border-gray-700 overflow-hidden"
                  style={{
                    borderLeftWidth: '4px',
                    borderLeftColor: business?.color || '#6B7280'
                  }}
                >
                  <div
                    className="p-4 hover:bg-gray-700/20 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => toggleProject(project.id)}
                      >
                        <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">{project.name}</h3>
                          {project.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{project.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <Badge style={{ backgroundColor: business?.color }}>
                          {business?.name}
                        </Badge>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Progress</div>
                          <div className="text-sm font-bold text-gray-100">{projectProgress.toFixed(0)}%</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Phases</div>
                          <div className="text-sm font-bold text-gray-100">{projectPhases.length}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400">Tasks</div>
                          <div className="text-sm font-bold text-gray-100">{completedTasks}/{totalTasks}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProject(project.id);
                          }}
                          className={`h-8 w-8 p-0 transition-colors ${
                            deleteConfirmId === project.id
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                          }`}
                          title={deleteConfirmId === project.id ? 'Click again to confirm deletion' : 'Delete project'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {totalTasks > 0 && (
                      <div className="mt-3">
                        <Progress value={projectProgress} className="h-1.5" />
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-700/50 p-4">
                      <ProjectCard project={project} businessId={project.business_id} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        defaultBusinessId={selectedBusinessId || undefined}
      />
    </div>
  );
};
