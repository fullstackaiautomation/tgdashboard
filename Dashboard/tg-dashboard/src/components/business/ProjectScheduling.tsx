import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '../../hooks/useProjects';
import { useTasks, useUpdateTask } from '../../hooks/useTasks';
import { useBusinesses } from '../../hooks/useBusinesses';
import { supabase } from '../../lib/supabase';
import { parseLocalDate, formatDateString } from '../../utils/dateHelpers';

interface ProjectSchedulingProps {
  selectedBusinessId: string | null;
  selectedProjectId: string | null;
  onBack: () => void;
}

export const ProjectScheduling: FC<ProjectSchedulingProps> = ({
  selectedBusinessId,
  selectedProjectId,
  onBack,
}) => {
  const { data: businesses } = useBusinesses();
  const { data: allProjects } = useProjects();
  const { data: allTasks } = useTasks();
  const [userId, setUserId] = useState<string | null>(null);
  const updateTask = useUpdateTask();

  // Get current user ID
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  // Filter tasks for selected business/project
  const filteredTasks = useMemo(() => {
    if (!allTasks) return [];
    let tasks = allTasks;

    if (selectedBusinessId) {
      tasks = tasks.filter(t => t.business_id === selectedBusinessId);
    }

    if (selectedProjectId) {
      tasks = tasks.filter(t => t.project_id === selectedProjectId);
    }

    // Sort by due date
    return tasks.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  }, [allTasks, selectedBusinessId, selectedProjectId]);

  // Get business info
  const business = businesses?.find(b => b.id === selectedBusinessId);

  // Handle task due date update
  const handleUpdateTaskDueDate = async (taskId: string, newDueDate: string) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
        updates: { due_date: newDueDate }
      });
    } catch (error) {
      console.error('Failed to update task due date:', error);
    }
  };

  // Group tasks by status and due date
  const groupedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups: {
      [key: string]: typeof filteredTasks;
    } = {
      overdue: [],
      today: [],
      upcoming: [],
      noDate: [],
      completed: [],
    };

    filteredTasks.forEach(task => {
      if (task.progress_percentage === 100) {
        groups.completed.push(task);
      } else if (!task.due_date) {
        groups.noDate.push(task);
      } else {
        const dueDate = parseLocalDate(task.due_date);
        if (!dueDate) {
          groups.noDate.push(task);
        } else if (dueDate < today) {
          groups.overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          groups.today.push(task);
        } else {
          groups.upcoming.push(task);
        }
      }
    });

    return groups;
  }, [filteredTasks]);

  const TaskItem: FC<{ task: any }> = ({ task }) => {
    const dueDate = task.due_date ? parseLocalDate(task.due_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isOverdue = dueDate && dueDate < today && task.progress_percentage !== 100;

    return (
      <div
        className="p-4 rounded-lg border transition-colors hover:shadow-md"
        style={{
          backgroundColor: `${business?.color}15`,
          borderColor: `${business?.color}50`,
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h5 className="font-semibold text-gray-100 text-base mb-2">
              {task.task_name || 'Untitled Task'}
            </h5>
            {task.description && (
              <p className="text-sm text-gray-400 mb-2">{task.description}</p>
            )}
            {task.phase_name && (
              <Badge variant="outline" className="text-xs">
                {task.phase_name}
              </Badge>
            )}
          </div>

          {/* Due Date Picker */}
          <div className="relative flex-shrink-0">
            <input
              type="date"
              id={`schedule-task-date-${task.id}`}
              value={task.due_date || ''}
              onChange={(e) => {
                handleUpdateTaskDueDate(task.id, e.target.value);
              }}
              className="absolute opacity-0 pointer-events-none"
            />
            <button
              onClick={() => {
                const input = document.getElementById(`schedule-task-date-${task.id}`) as HTMLInputElement;
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
              <Calendar className="w-4 h-4" />
              <span>
                {dueDate
                  ? dueDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: dueDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })
                  : 'Set date'}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const TaskGroup: FC<{ title: string; tasks: typeof filteredTasks; color?: string }> = ({
    title,
    tasks,
    color,
  }) => {
    if (tasks.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <Badge className="bg-gray-700 text-gray-200">{tasks.length}</Badge>
        </div>
        <div className="space-y-3">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-950 min-h-screen">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="text-gray-400 hover:text-gray-100 hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Project Scheduling</h1>
            {selectedProjectId ? (
              <p className="text-sm text-gray-400 mt-1">
                {allProjects?.find(p => p.id === selectedProjectId)?.name || 'Selected Project'}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">
                {business?.name || 'All Projects'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No tasks to schedule</p>
        </div>
      ) : (
        <div>
          {/* Overdue Tasks */}
          {groupedTasks.overdue.length > 0 && (
            <TaskGroup
              title="Overdue"
              tasks={groupedTasks.overdue}
              color="red"
            />
          )}

          {/* Due Today */}
          {groupedTasks.today.length > 0 && (
            <TaskGroup
              title="Due Today"
              tasks={groupedTasks.today}
              color="yellow"
            />
          )}

          {/* Upcoming Tasks */}
          {groupedTasks.upcoming.length > 0 && (
            <TaskGroup
              title="Upcoming"
              tasks={groupedTasks.upcoming}
            />
          )}

          {/* No Date */}
          {groupedTasks.noDate.length > 0 && (
            <TaskGroup
              title="No Due Date"
              tasks={groupedTasks.noDate}
            />
          )}

          {/* Completed Tasks */}
          {groupedTasks.completed.length > 0 && (
            <TaskGroup
              title="Completed"
              tasks={groupedTasks.completed}
            />
          )}
        </div>
      )}
    </div>
  );
};
