import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases, useDeleteProject, useUpdateProject } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { supabase } from '../../lib/supabase';
import { ProjectCard } from './ProjectCard';
import { NewProjectModal } from './NewProjectModal';

export const BusinessDashboard: FC = () => {
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
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

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
          onClick={() => {
            setSelectedBusinessId(null);
            setSelectedProjectId(null);
          }}
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
              onClick={() => {
                setSelectedBusinessId(business.id);
                setSelectedProjectId(null);
              }}
            >
              {business.name}
            </Button>
          );
        })}
      </div>

      {/* Project Filter Buttons - Only show when a business is selected */}
      {selectedBusinessId && allProjects && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className={`px-4 py-2 text-sm font-medium transition-all border ${
              selectedProjectId === null
                ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                : 'bg-gray-800/50 hover:bg-gray-700 text-gray-300 border-gray-600'
            }`}
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
                  className={`px-4 py-2 text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                      : 'bg-gray-800/50 hover:bg-gray-700 text-gray-300 border-gray-600'
                  }`}
                  onClick={() => setSelectedProjectId(project.id)}
                >
                  {project.name}
                </Button>
              );
            })}
        </div>
      )}

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
                <div key={project.id} className="grid grid-cols-[1fr_450px] gap-4">
                  {/* Left Column - Project Details */}
                  <Card className="bg-gray-900/60 border-gray-800 shadow-lg overflow-hidden">
                    {/* Project Header */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5">
                      <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-100">{project.name}</h3>
                        <Badge
                          className="ml-2 text-xs px-2 py-0.5"
                          style={{
                            backgroundColor: `${business?.color}30`,
                            color: business?.color,
                            border: `1px solid ${business?.color}`
                          }}
                        >
                          {business?.name}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Project Stats */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-xs">Phases</span>
                            <span className="font-semibold text-gray-200">{projectPhases.length}</span>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-xs">Tasks</span>
                            <span className="font-semibold text-gray-200">{completedTasks} / {totalTasks}</span>
                          </div>
                        </div>

                        {/* Progress Badge */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Progress:</span>
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
                              : 'text-gray-500 hover:text-red-400'
                          }`}
                          title={deleteConfirmId === project.id ? 'Click again to confirm deletion' : 'Delete project'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Project Description - Editable */}
                    <div className="mt-3">
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
                          className="w-full bg-gray-800 text-gray-300 px-2 py-1 rounded border border-blue-500 focus:outline-none text-sm"
                          placeholder="Add project description..."
                          autoFocus
                        />
                      ) : (
                        <p
                          onClick={() => {
                            setEditingProjectId(project.id);
                            setEditDescription(project.description || '');
                          }}
                          className="text-sm text-gray-400 cursor-pointer hover:text-gray-300"
                        >
                          {project.description || 'Click to add description...'}
                        </p>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {totalTasks > 0 && (
                      <div className="mt-4">
                        <Progress value={projectProgress} className="h-2 bg-gray-700" />
                      </div>
                    )}
                  </div>

                    {/* Phases Content */}
                    <div className="bg-gray-900/30">
                      <ProjectCard project={project} businessId={project.business_id} />
                    </div>
                  </Card>

                  {/* Right Column - Notes Section */}
                  <Card className="bg-yellow-900/20 border-yellow-700/50 shadow-lg h-fit sticky top-4">
                      <div className="p-5">
                        <h4 className="text-lg font-semibold text-yellow-200 mb-3">Notes</h4>
                        {editingNotesId === project.id ? (
                          <textarea
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            onBlur={() => handleUpdateNotes(project.id, editNotes)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                setEditingNotesId(null);
                                setEditNotes('');
                              }
                            }}
                            className="w-full bg-yellow-950/50 text-yellow-100 px-3 py-2 rounded border border-yellow-600 focus:outline-none focus:border-yellow-500 text-sm"
                            placeholder="Add detailed notes about what needs to happen in this project..."
                            rows={15}
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => {
                              setEditingNotesId(project.id);
                              setEditNotes(project.notes || '');
                            }}
                            className="text-sm text-yellow-200 cursor-pointer hover:text-yellow-100 whitespace-pre-wrap min-h-[400px] p-3 bg-yellow-950/30 rounded"
                          >
                            {project.notes || 'Click to add detailed notes about what needs to happen in this project to reach completion...'}
                          </div>
                        )}
                      </div>
                    </Card>
                </div>
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
