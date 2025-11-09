import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases, useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useBusinessProgress } from '../../hooks/useBusinessProgress';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';
import { AddPhaseModal } from './AddPhaseModal';
import { BusinessMetrics } from './BusinessMetrics';
import { ProjectScheduling } from './ProjectScheduling';
import { ProjectGameplanDetailBox } from './ProjectGameplanDetailBox';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { formatDateString, parseLocalDate } from '../../utils/dateHelpers';

interface BusinessDashboardProps {
  preselectedBusinessArea?: string | null;
  onNavigateToScheduling?: (businessId: string | null, projectId: string | null) => void;
}

export const BusinessDashboard: FC<BusinessDashboardProps> = ({ preselectedBusinessArea, onNavigateToScheduling }) => {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editingProjectGoalId, setEditingProjectGoalId] = useState<string | null>(null);
  const [editProjectGoal, setEditProjectGoal] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editingTaskDueDate, setEditingTaskDueDate] = useState<string | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
  const [showAddPhaseModal, setShowAddPhaseModal] = useState(false);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const updateTask = useUpdateTask();

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

  // Auto-select business when preselectedBusinessArea changes
  useEffect(() => {
    if (preselectedBusinessArea && businesses) {
      const matchedBusiness = businesses.find(b => b.name === preselectedBusinessArea);
      if (matchedBusiness) {
        setSelectedBusinessId(matchedBusiness.id);
        setSelectedProjectId(null);
      }
    } else if (preselectedBusinessArea === null) {
      // Clear selection when null (All Areas)
      setSelectedBusinessId(null);
      setSelectedProjectId(null);
    }
  }, [preselectedBusinessArea, businesses]);

  // Initialize all phases as expanded by default
  useEffect(() => {
    if (allPhases && allPhases.length > 0) {
      const initialState: Record<string, boolean> = {};
      allPhases.forEach(phase => {
        initialState[phase.id] = true;
      });
      setExpandedPhases(initialState);
    }
  }, [allPhases]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => ({
      ...prev,
      [phaseId]: !prev[phaseId]
    }));
  };

  // Handle project deletion with confirmation
  const handleDeleteProject = (projectId: string) => {
    if (deleteConfirmId === projectId) {
      // Second click - delete the project
      deleteProject.mutate(projectId, {
        onSuccess: () => {
          setDeleteConfirmId(null);
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

  // Handle project description update
  const handleUpdateDescription = async (projectId: string, description: string) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { description }
      });
      setEditingProjectId(null);
      setEditDescription('');
    } catch (error) {
      console.error('Failed to update project description:', error);
    }
  };

  // Handle project goal update
  const handleUpdateProjectGoal = async (projectId: string, projectGoal: string) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { project_goal: projectGoal }
      });
      setEditingProjectGoalId(null);
      setEditProjectGoal('');
    } catch (error) {
      console.error('Failed to update project goal:', error);
    }
  };

  // Handle project notes update
  const handleUpdateNotes = async (projectId: string, notes: string) => {
    try {
      await updateProject.mutateAsync({
        id: projectId,
        updates: { notes }
      });
      setEditingNotesId(null);
      setEditNotes('');
    } catch (error) {
      console.error('Failed to update project notes:', error);
    }
  };

  // Handle task due date update
  const handleUpdateTaskDueDate = async (taskId: string, newDueDate: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { due_date: newDueDate }
      });
      setEditingTaskDueDate(null);
    } catch (error) {
      console.error('Failed to update task due date:', error);
    }
  };

  // Filter projects and tasks based on selected business and project
  const filteredProjects = useMemo(() => {
    if (!allProjects) return [];
    let projects = allProjects;

    if (selectedBusinessId) {
      projects = projects.filter(p => p.business_id === selectedBusinessId);
    }

    if (selectedProjectId) {
      projects = projects.filter(p => p.id === selectedProjectId);
    }

    return projects;
  }, [allProjects, selectedBusinessId, selectedProjectId]);

  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    if (!selectedBusinessId) return allTasks;
    return allTasks.filter(t => t.business_id === selectedBusinessId);
  }, [allTasks, selectedBusinessId]);

  // Filter phases for selected business
  const filteredPhases = useMemo(() => {
    if (!allPhases || !selectedBusinessId) return [];
    return allPhases.filter(p => filteredProjects.some(proj => proj.id === p.project_id));
  }, [allPhases, selectedBusinessId, filteredProjects]);

  // Calculate business-level metrics - MUST call hook unconditionally
  const businessMetrics = useBusinessProgress(
    selectedBusinessId ? filteredProjects : [],
    selectedBusinessId ? filteredPhases : [],
    selectedBusinessId ? filteredTasks : []
  );

  // Calculate selected project metrics - MUST call hook unconditionally
  const selectedProject = filteredProjects.length === 1 ? filteredProjects[0] : null;
  const selectedProjectMetrics = useProjectMetrics(selectedProject, allPhases, allTasks);

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
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      {/* Calculate metrics for header display */}
      {(() => {
        const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
        const pageTitle = selectedBusinessId && selectedBusiness
          ? `${selectedBusiness.name} Projects`
          : 'Projects';

        // Calculate metrics based on filtered projects (respects project filter)
        const currentFilteredTasks = filteredTasks.filter(t =>
          filteredProjects.some(p => p.id === t.project_id)
        );
        const totalHoursWorked = currentFilteredTasks.reduce((sum, task) => {
          return sum + (task.hours_worked || 0);
        }, 0);
        const completedTasks = currentFilteredTasks.filter(t => (t.progress_percentage ?? 0) === 100).length;

        return (
          <>
            {/* Header with Title and Metrics and Buttons */}
            <div className="flex items-center justify-between gap-4">
              {/* Left side: Title */}
              <h1 className="text-3xl font-bold text-gray-100 whitespace-nowrap">{pageTitle}</h1>

              {/* Center: Metrics */}
              {selectedBusinessId && businessMetrics.totalProjects > 0 && (
                <div className="flex gap-3 items-center flex-1 justify-center">
                  {/* Projects */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded border border-gray-700">
                    <span className="text-base text-gray-400">Projects</span>
                    <span className="text-base font-bold text-gray-100">{filteredProjects.length}</span>
                  </div>

                  {/* Overall Progress */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded border border-gray-700">
                    <span className="text-base text-gray-400">Completion</span>
                    <span className="text-base font-bold text-gray-100">{Math.round(businessMetrics.overallCompletion)}%</span>
                  </div>

                  {/* Tasks */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded border border-gray-700">
                    <span className="text-base text-gray-400">Tasks</span>
                    <span className="text-base font-bold text-gray-100">
                      <span className="text-white">{currentFilteredTasks.length - completedTasks}</span>
                      <span className="text-gray-500 text-xs mx-1">/</span>
                      <span className="text-white">{currentFilteredTasks.length}</span>
                    </span>
                  </div>

                  {/* Hours Invested */}
                  <div className="flex items-center gap-1 px-3 py-2 bg-gray-800 rounded border border-gray-700">
                    <span className="text-base text-gray-400">Hours</span>
                    <span className="text-base font-bold text-gray-100">{Math.round(totalHoursWorked)}</span>
                  </div>
                </div>
              )}

              {/* Right side: Buttons */}
              <div className="flex gap-3 whitespace-nowrap">
                <Button
                  className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 text-base font-semibold"
                  onClick={() => onNavigateToScheduling?.(selectedBusinessId, selectedProjectId)}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 text-base font-semibold"
                  onClick={() => setShowNewProjectModal(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Project
                </Button>
              </div>
            </div>
          </>
        );
      })()}

      {/* Project Filter Buttons - Show at top when a business is selected */}
      {selectedBusinessId && allProjects && (() => {
        const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
        const businessColor = selectedBusiness?.color || '#a855f7';

        return (
          <>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button
                variant="outline"
                className="h-14 px-6 text-base font-semibold transition-all border-2"
                style={{
                  backgroundColor: selectedProjectId === null ? businessColor : `${businessColor}20`,
                  borderColor: selectedProjectId === null ? businessColor : `${businessColor}60`,
                  color: selectedProjectId === null ? 'white' : businessColor,
                  boxShadow: selectedProjectId === null ? `0 4px 14px -2px ${businessColor}40` : undefined,
                }}
                onClick={() => setSelectedProjectId(null)}
              >
                All Projects
              </Button>
              {allProjects
                .filter(p => p.business_id === selectedBusinessId)
                .map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <Button
                      key={project.id}
                      variant="outline"
                      className="h-14 px-6 text-base font-semibold transition-all border-2"
                      style={{
                        backgroundColor: isSelected ? businessColor : `${businessColor}20`,
                        borderColor: isSelected ? businessColor : `${businessColor}60`,
                        color: isSelected ? 'white' : businessColor,
                        boxShadow: isSelected ? `0 4px 14px -2px ${businessColor}40` : undefined,
                      }}
                      onClick={() => setSelectedProjectId(project.id)}
                    >
                      {project.name}
                    </Button>
                  );
                })}
            </div>

          </>
        );
      })()}

      {/* Projects Section */}
      <div>
        {filteredProjects.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-800">
            <CardContent className="py-12">
              <div className="text-center text-gray-400">
                <p className="text-lg mb-2">No projects yet</p>
                <p className="text-sm">Create your first project to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : selectedProjectId ? (
          // Two-column layout when a project is selected
          (() => {
            const selectedProjectData = filteredProjects.find(p => p.id === selectedProjectId);
            const business = businesses?.find(b => b.id === selectedProjectData?.business_id);
            if (!selectedProjectData) return null;

            const projectPhases = allPhases?.filter(p => p.project_id === selectedProjectData.id) || [];
            const projectTasks = filteredTasks.filter(t => t.project_id === selectedProjectData.id);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Project Card (65%) */}
                <div className="lg:col-span-2">
                  <Card className="bg-gray-900/60 border-gray-800 shadow-lg overflow-hidden">
                    {/* Project Header */}
                    <div className="px-5 pt-3 pb-5" style={{ backgroundColor: `${business?.color}30` }}>
                      <div className="flex items-center gap-4 min-h-16">
                        {/* Left: Project Name */}
                        <h3 className="text-4xl font-bold text-gray-100 leading-none whitespace-nowrap">{selectedProjectData.name}</h3>

                        {/* Center: Empty space */}
                        <div className="flex-1"></div>

                        {/* Right: Project Goal Input */}
                        <div className="w-96 flex-shrink-0">
                          <textarea
                            value={editingProjectGoalId === selectedProjectData.id ? editProjectGoal : (selectedProjectData.project_goal || '')}
                            onClick={() => {
                              if (editingProjectGoalId !== selectedProjectData.id) {
                                setEditingProjectGoalId(selectedProjectData.id);
                                setEditProjectGoal(selectedProjectData.project_goal || '');
                              }
                            }}
                            onChange={(e) => {
                              setEditProjectGoal(e.target.value);
                              handleUpdateProjectGoal(selectedProjectData.id, e.target.value);
                            }}
                            onBlur={() => {
                              setEditingProjectGoalId(null);
                            }}
                            className="w-full px-3 py-2 rounded-lg text-xs bg-gray-900 border-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
                            style={{
                              borderColor: `${business?.color}`,
                              backgroundColor: `${business?.color}20`,
                            }}
                            rows={2}
                            placeholder="Enter project goal..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Phases Content */}
                    <div className="bg-gray-900/30">
                      <ProjectCard project={selectedProjectData} businessId={selectedProjectData.business_id} businessColor={business?.color} expandedPhases={expandedPhases} onTogglePhase={togglePhase} />
                    </div>
                  </Card>
                </div>

                {/* Right Column - Project Gameplan Detail Box (35%) */}
                <div className="lg:col-span-1">
                  <ProjectGameplanDetailBox
                    project={selectedProjectData}
                    metrics={selectedProjectMetrics}
                    businessColor={business?.color}
                  />
                </div>
              </div>
            );
          })()
        ) : (
          // Single-column layout showing all projects
          <div className="space-y-6">
            {filteredProjects.map((project) => {
              const business = businesses?.find(b => b.id === project.business_id);
              const projectPhases = allPhases?.filter(p => p.project_id === project.id) || [];
              const projectTasks = filteredTasks.filter(t => t.project_id === project.id);
              // Use selectedProjectMetrics if this is the selected project, otherwise create a temporary calculation
              const metrics = project.id === selectedProjectId ? selectedProjectMetrics : {
                totalPhases: projectPhases.length,
                totalTasks: projectTasks.length,
                completedTasks: projectTasks.filter(t => (t.progress_percentage ?? 0) === 100).length,
                completionPercentage: projectTasks.length > 0 ? (projectTasks.filter(t => (t.progress_percentage ?? 0) === 100).length / projectTasks.length) * 100 : 0,
                completionStatus: 'Not Started' as const,
                estimatedHours: 0,
                actualHours: 0,
                hoursAccuracy: 0,
                estimationAccuracy: 'No Data' as const,
                timelineAccuracyDays: null,
                isOverdue: false,
              };

              return (
                <Card key={project.id} className="bg-gray-900/60 border-gray-800 shadow-lg overflow-hidden">
                  {/* Project Header */}
                  <div className="px-5 pt-3 pb-5" style={{ backgroundColor: `${business?.color}30` }}>
                    <div className="flex items-center gap-4 min-h-16">
                      {/* Left: Project Name */}
                      <h3 className="text-4xl font-bold text-gray-100 leading-none whitespace-nowrap">{project.name}</h3>

                      {/* Center: Empty space */}
                      <div className="flex-1"></div>

                      {/* Right: Project Goal Input */}
                      <div className="w-96 flex-shrink-0">
                        <textarea
                          value={editingProjectGoalId === project.id ? editProjectGoal : (project.project_goal || '')}
                          onClick={() => {
                            if (editingProjectGoalId !== project.id) {
                              setEditingProjectGoalId(project.id);
                              setEditProjectGoal(project.project_goal || '');
                            }
                          }}
                          onChange={(e) => {
                            setEditProjectGoal(e.target.value);
                            handleUpdateProjectGoal(project.id, e.target.value);
                          }}
                          onBlur={() => {
                            setEditingProjectGoalId(null);
                          }}
                          className="w-full px-3 py-2 rounded-lg text-xs bg-gray-900 border-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none font-medium"
                          style={{
                            borderColor: `${business?.color}`,
                            backgroundColor: `${business?.color}20`,
                          }}
                          rows={2}
                          placeholder="Enter project goal..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phases Content */}
                  <div className="bg-gray-900/30">
                    <ProjectCard project={project} businessId={project.business_id} businessColor={business?.color} expandedPhases={expandedPhases} onTogglePhase={togglePhase} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Phase Modal */}
      {selectedProjectId && (
        <AddPhaseModal
          isOpen={showAddPhaseModal}
          onClose={() => setShowAddPhaseModal(false)}
          projectId={selectedProjectId}
          projectName={filteredProjects.find(p => p.id === selectedProjectId)?.name || ''}
        />
      )}

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        defaultBusinessId={selectedBusinessId || undefined}
      />
    </div>
  );
};
