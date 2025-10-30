import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases, useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useBusinessProgress } from '../../hooks/useBusinessProgress';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';
import { BusinessMetrics } from './BusinessMetrics';
import { formatDateString, parseLocalDate } from '../../utils/dateHelpers';

interface BusinessDashboardProps {
  preselectedBusinessArea?: string | null;
}

export const BusinessDashboard: FC<BusinessDashboardProps> = ({ preselectedBusinessArea }) => {
  const { data: businesses, isLoading: businessesLoading } = useBusinesses();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editingTaskDueDate, setEditingTaskDueDate] = useState<string | null>(null);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-100">Projects</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => setShowNewProjectModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Project
          </Button>
        </div>
      </div>

      {/* Project Filter Buttons - Show at top when a business is selected */}
      {selectedBusinessId && allProjects && (() => {
        const selectedBusiness = businesses?.find(b => b.id === selectedBusinessId);
        const businessColor = selectedBusiness?.color || '#a855f7';

        return (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="h-12 px-6 text-base font-semibold transition-all border-2"
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
                    className="h-12 px-6 text-base font-semibold transition-all border-2"
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
        );
      })()}

      {/* Business Metrics - Show when a business is selected */}
      {selectedBusinessId && businessMetrics.totalProjects > 0 && (() => {
        // Calculate total hours worked for this business
        const totalHoursWorked = filteredTasks.reduce((sum, task) => {
          return sum + (task.hours_worked || 0);
        }, 0);

        return (
          <BusinessMetrics
            projectCount={businessMetrics.totalProjects}
            overallProgress={businessMetrics.overallCompletion}
            activeTasks={businessMetrics.activeTasks}
            completedTasks={businessMetrics.completedTasks}
            hoursInvested={totalHoursWorked}
            isStalled={businessMetrics.isStalled}
            daysSinceActivity={businessMetrics.daysSinceActivity}
          />
        );
      })()}

      {/* Projects Section */}
      <div className={selectedProjectId === null ? "grid grid-cols-[1fr_450px] gap-4" : ""}>
        {/* Left Column - Projects List */}
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
          ) : (
            <div className="space-y-6">
              {filteredProjects.map((project) => {
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
                <div key={project.id} className={selectedProjectId === null ? "" : "grid grid-cols-[1fr_450px] gap-4"}>
                  {/* Left Column - Project Details */}
                  <Card className="bg-gray-900/60 border-gray-800 shadow-lg overflow-hidden">
                    {/* Project Header */}
                    <div className="p-5" style={{ backgroundColor: `${business?.color}30` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <h3 className="text-xl font-bold text-gray-100">{project.name}</h3>

                          {/* Project Description - Inline Editable */}
                          <div className="flex-1">
                            {editingProjectId === project.id ? (
                              <input
                                type="text"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                onBlur={() => handleUpdateDescription(project.id, editDescription)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateDescription(project.id, editDescription);
                                  } else if (e.key === 'Escape') {
                                    setEditingProjectId(null);
                                    setEditDescription('');
                                  }
                                }}
                                className="w-full px-2 py-1 rounded focus:outline-none text-sm bg-white/10 text-gray-200 border border-white/30"
                                placeholder="Add project description..."
                                autoFocus
                              />
                            ) : (
                              <p
                                onClick={() => {
                                  setEditingProjectId(project.id);
                                  setEditDescription(project.description || '');
                                }}
                                className="text-sm cursor-pointer px-2 py-1 text-gray-300 italic"
                              >
                                {project.description || '+'}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          {/* Project Stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex flex-col items-center">
                              <span className="text-gray-400 text-xs">Phases</span>
                              <span className="font-semibold text-gray-100">{projectPhases.length}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-gray-400 text-xs">Tasks</span>
                              <span className="font-semibold text-gray-100">{completedTasks} / {totalTasks}</span>
                            </div>
                          </div>

                          {/* Progress Badge */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">Progress:</span>
                            <Badge className={`px-3 py-1 font-bold ${
                              projectProgress === 100
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-700 text-gray-200'
                            }`}>
                              {projectProgress.toFixed(0)}%
                            </Badge>
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
                                : 'text-gray-400 hover:text-red-400'
                            }`}
                            title={deleteConfirmId === project.id ? 'Click again to confirm deletion' : 'Delete project'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Phases Content */}
                    <div className="bg-gray-900/30">
                      <ProjectCard project={project} businessId={project.business_id} businessColor={business?.color} />
                    </div>
                  </Card>

                  {/* Right Column - Task Scheduler (Only show when a specific project is selected) */}
                  {selectedProjectId !== null && (
                    <Card className="shadow-lg h-fit sticky top-4" style={{
                      backgroundColor: `${business?.color}15`,
                      borderColor: `${business?.color}60`,
                    }}>
                      <div className="p-5">
                        <h4 className="text-lg font-semibold text-gray-100 mb-4">Upcoming Tasks</h4>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-hidden">
                          {(() => {
                            // Get tasks for this project, sorted by due_date
                            const upcomingTasks = projectTasks
                              .filter(task => task.due_date && task.progress_percentage !== 100)
                              .sort((a, b) => {
                                if (!a.due_date) return 1;
                                if (!b.due_date) return -1;
                                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                              });

                            if (upcomingTasks.length === 0) {
                              return (
                                <div className="text-sm text-gray-400 text-center py-8">
                                  No upcoming tasks scheduled
                                </div>
                              );
                            }

                            return upcomingTasks.map((task) => {
                              const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const isOverdue = dueDate && dueDate < today;
                              const formattedDate = task.due_date || '';

                              return (
                                <div
                                  key={task.id}
                                  className="p-3 rounded-lg border transition-colors"
                                  style={{
                                    backgroundColor: `${business?.color}20`,
                                    borderColor: `${business?.color}50`,
                                  }}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <h5 className="font-semibold text-gray-100 text-base flex-1 break-words">
                                      {task.task_name || 'Untitled Task'}
                                    </h5>

                                    {/* Due Date Picker */}
                                    <div className="relative">
                                      <input
                                        type="date"
                                        id={`task-date-${task.id}`}
                                        value={formattedDate}
                                        onChange={(e) => {
                                          handleUpdateTaskDueDate(task.id, e.target.value);
                                        }}
                                        className="absolute opacity-0 pointer-events-none"
                                      />
                                      <button
                                        onClick={() => {
                                          const input = document.getElementById(`task-date-${task.id}`) as HTMLInputElement;
                                          if (input) {
                                            input.showPicker();
                                          }
                                        }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                                          isOverdue
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                        }`}
                                      >
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
        {/* End Left Column */}

        {/* Right Column - Consolidated Task Scheduler (Only show when All Projects is selected) */}
        {selectedProjectId === null && selectedBusinessId && (() => {
          const business = businesses?.find(b => b.id === selectedBusinessId);
          const upcomingTasks = filteredTasks
            .filter(task => task.due_date && task.progress_percentage !== 100)
            .sort((a, b) => {
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });

          return (
            <Card className="shadow-lg h-fit sticky top-4" style={{
              backgroundColor: `${business?.color}15`,
              borderColor: `${business?.color}60`,
            }}>
              <div className="p-5">
                <h4 className="text-lg font-semibold text-gray-100 mb-4">Upcoming Tasks</h4>
                <div className="space-y-3 max-h-[600px] overflow-y-auto overflow-x-hidden">
                  {upcomingTasks.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-8">
                      No upcoming tasks scheduled
                    </div>
                  ) : (
                    upcomingTasks.map((task) => {
                      const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isOverdue = dueDate && dueDate < today;
                      const formattedDate = task.due_date || '';

                      return (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg border transition-colors"
                          style={{
                            backgroundColor: `${business?.color}20`,
                            borderColor: `${business?.color}50`,
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h5 className="font-semibold text-gray-100 text-base flex-1 break-words">
                              {task.task_name || 'Untitled Task'}
                            </h5>

                            {/* Due Date Picker */}
                            <div className="relative">
                              <input
                                type="date"
                                id={`task-date-all-${task.id}`}
                                value={formattedDate}
                                onChange={(e) => {
                                  handleUpdateTaskDueDate(task.id, e.target.value);
                                }}
                                className="absolute opacity-0 pointer-events-none"
                              />
                              <button
                                onClick={() => {
                                  const input = document.getElementById(`task-date-all-${task.id}`) as HTMLInputElement;
                                  if (input) {
                                    input.showPicker();
                                  }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold whitespace-nowrap transition-colors ${
                                  isOverdue
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                }`}
                              >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </Card>
          );
        })()}
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
