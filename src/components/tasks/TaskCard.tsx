import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar, MoreHorizontal, CheckCircle2, Circle, AlertCircle, Trash2 } from 'lucide-react';
import { TaskTimeLog } from './TaskTimeLog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTask, useDeleteTask } from '../../hooks/useTasks';
import { useUndo } from '../../hooks/useUndo';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { useTaskTimeBlocks } from '../../hooks/useTaskTimeBlocks';
import { useCreateTimeBlock } from '../../hooks/useCalendar';
import { ProgressSlider } from '../shared/ProgressSlider';
import { DateTimePicker } from './DateTimePicker';
import { TimeTrackingModal } from './TimeTrackingModal';
import type { TaskHub, TaskStatus, Automation, EffortLevel } from '../../types/task';
import { parseLocalDate, isToday as checkIsToday, isOverdue as checkIsOverdue } from '@/utils/dateHelpers';

interface TaskCardProps {
  task: TaskHub;
  className?: string;
  compact?: boolean;
  scheduleDate?: Date;
}

/**
 * Get color for business/area
 */
const getBusinessColor = (task: TaskHub): string => {
  if (task.businesses) {
    const slug = task.businesses.slug;
    if (slug === 'full-stack' || slug === 'fullstack') return 'var(--color-business-fullstack)';
    if (slug === 'huge-capital') return 'var(--color-business-hugecapital)';
    if (slug === 's4') return 'var(--color-business-s4)';
    if (slug === '808') return 'var(--color-business-808)';
    if (slug === 'personal') return 'var(--color-area-personal)';
    if (slug === 'health') return 'var(--color-area-health)';
    if (slug === 'golf') return 'var(--color-area-golf)';
  }

  if (task.life_areas) {
    const category = task.life_areas.category.toLowerCase();
    if (category === 'personal') return 'var(--color-area-personal)';
    if (category === 'health') return 'var(--color-area-health)';
    if (category === 'golf') return 'var(--color-area-golf)';
  }

  if (task.area) {
    if (task.area === 'Full Stack') return 'var(--color-business-fullstack)';
    if (task.area === 'Huge Capital') return 'var(--color-business-hugecapital)';
    if (task.area === 'S4') return 'var(--color-business-s4)';
    if (task.area === '808') return 'var(--color-business-808)';
    if (task.area === 'Personal') return 'var(--color-area-personal)';
    if (task.area === 'Health') return 'var(--color-area-health)';
    if (task.area === 'Golf') return 'var(--color-area-golf)';
  }

  return '#6b7280';
};

const getSourceName = (task: TaskHub): string => {
  // Prioritize Project name if it exists
  if (task.projects) return task.projects.name;

  // Fall back to Business/Area name
  if (task.businesses) return task.businesses.name;
  if (task.life_areas) return task.life_areas.name;
  if (task.area) return task.area;
  return 'Unknown';
};

const isOverdue = (task: TaskHub): boolean => {
  if (!task.due_date || task.progress_percentage === 100) return false;
  return checkIsOverdue(task.due_date);
};

const isDueToday = (task: TaskHub): boolean => {
  if (!task.due_date) return false;
  return checkIsToday(task.due_date);
};

/**
 * Get color class for Money Maker effort level
 */
const getEffortLevelColor = (effortLevel: string | null): string => {
  if (!effortLevel) return 'text-gray-100';
  if (effortLevel === '$$$ Printer $$$') return 'text-green-500';
  if (effortLevel === '$ Makes Money $') return 'text-green-400';
  if (effortLevel === '-$ Save Dat $-') return 'text-orange-400';
  if (effortLevel === ':( No Money ):') return 'text-red-400';
  if (effortLevel === '8) Vibing (8') return 'text-purple-500';
  return 'text-gray-100';
};

/**
 * Minimalist TaskCard - Clean, compact, scannable
 */
export const TaskCard: FC<TaskCardProps> = ({ task, className = '', scheduleDate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const [editedNotes, setEditedNotes] = useState(task.description || '');
  const [hoursProjectedInput, setHoursProjectedInput] = useState('');
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showTimeTrackingModal, setShowTimeTrackingModal] = useState(false);
  const [_showProjectDropdown, _setShowProjectDropdown] = useState(false);
  const [_syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [deleteClickCount, setDeleteClickCount] = useState(0);
  const [deleteTimeout, setDeleteTimeout] = useState<NodeJS.Timeout | null>(null);

  const progressSliderRef = useRef<HTMLDivElement>(null);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTimeBlock = useCreateTimeBlock();
  const { setupUndo } = useUndo<TaskHub>(30000);

  // Fetch projects for the task's business
  const { data: projects } = useProjects(task.business_id || undefined);

  // Fetch phases for the selected project
  const { data: phases } = usePhases(task.project_id || undefined);

  // Get time blocks for the task
  const { data: allTimeBlocks = [] } = useTaskTimeBlocks(task.id);

  // Filter to only show selected schedule date's time blocks (default to today)
  const dateToShow = scheduleDate || new Date();
  const dateToShowStr = format(dateToShow, 'yyyy-MM-dd');
  const scheduleDateTimeBlocks = allTimeBlocks.filter(block => block.scheduled_date === dateToShowStr);
  const hasTimeBlocks = scheduleDateTimeBlocks.length > 0;

  // Get the earliest time block for selected date
  const earliestTimeBlock = scheduleDateTimeBlocks.length > 0 ? scheduleDateTimeBlocks[0] : null;

  const businessColor = getBusinessColor(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);
  const isRecurringTemplate = !task.due_date && !task.recurring_parent_id;

  // Calculate progress based on hours worked vs hours projected
  const calculateProgress = (): number => {
    if (!task.hours_projected || task.hours_projected === 0) return 0;
    const hoursWorked = task.hours_worked || 0;
    const percentage = (hoursWorked / task.hours_projected) * 100;
    return Math.min(Math.round(percentage), 100); // Cap at 100%
  };

  const progress = calculateProgress();
  const isCompleted = task.progress_percentage === 100;

  // Close progress slider when clicking outside
  useEffect(() => {
    if (!showProgressSlider) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is inside the progress slider container
      if (progressSliderRef.current && !progressSliderRef.current.contains(target)) {
        setShowProgressSlider(false);
      }
    };

    // Use 'mousedown' to capture before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [showProgressSlider]);

  const handleUpdate = async (updates: Partial<TaskHub>) => {
    setSyncStatus('syncing');
    const previousTask = { ...task };
    setupUndo(previousTask, () => {
      updateTask.mutate({ id: task.id, updates: previousTask });
    });

    try {
      await updateTask.mutateAsync({ id: task.id, updates });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      console.error('Task update failed:', error);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== task.task_name) {
      handleUpdate({ task_name: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.task_name);
      setIsEditingTitle(false);
    }
  };

  const handleNotesSave = () => {
    if (editedNotes !== (task.description || '')) {
      handleUpdate({ description: editedNotes.trim() || null });
    }
    setIsEditingNotes(false);
  };

  const handleProgressChange = (progress: number) => {
    let newStatus: TaskStatus = task.status;
    if (progress === 0) {
      newStatus = 'Not started';
    } else if (progress === 100) {
      newStatus = 'Done';
      setShowTimeTrackingModal(true);
      setShowProgressSlider(false);
    } else if (progress > 0 && progress < 100) {
      newStatus = 'In progress';
    }

    handleUpdate({
      progress_percentage: progress,
      status: newStatus,
      completed_at: progress === 100 ? new Date().toISOString() : undefined,
    });
  };

  const handleTimeTrackingSave = (hours: number) => {
    handleUpdate({ hours_worked: hours });
    setShowTimeTrackingModal(false);
  };

  const handleScheduleChange = async (date: string | null, time: string | null) => {
    // CalendarDialog provides properly formatted date string (YYYY-MM-DD)
    // We need to convert it to ISO format for storage
    if (!date) {
      handleUpdate({ due_date: undefined });
      return;
    }

    // Parse the YYYY-MM-DD string and create date at noon local time
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Update the due date
    handleUpdate({ due_date: localDate.toISOString() });

    // If time is selected, create a time block
    if (time && task.hours_projected) {
      try {
        // Parse the time (HH:MM format)
        const [hours, minutes] = time.split(':').map(Number);

        // Create start time in HH:MM:SS format
        const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

        // Calculate end time based on hours projected
        const endDate = new Date(year, month - 1, day, hours, minutes);
        endDate.setHours(endDate.getHours() + task.hours_projected);
        const endHours = String(endDate.getHours()).padStart(2, '0');
        const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
        const endTime = `${endHours}:${endMinutes}:00`;

        // Create the time block
        await createTimeBlock.mutateAsync({
          taskId: task.id,
          scheduledDate: localDate,
          startTime,
          endTime,
          plannedDurationMinutes: Math.round(task.hours_projected * 60),
        });

        console.log('✅ Time block created:', {
          taskId: task.id,
          date,
          startTime,
          endTime,
          hoursProjected: task.hours_projected,
        });
      } catch (error) {
        console.error('❌ Failed to create time block:', error);
      }
    }
  };

  const handleDeleteClick = () => {
    // Clear existing timeout if any
    if (deleteTimeout) {
      clearTimeout(deleteTimeout);
    }

    const newCount = deleteClickCount + 1;
    setDeleteClickCount(newCount);

    if (newCount === 2) {
      // Second click - delete the task
      deleteTask.mutate(task.id);
      setDeleteClickCount(0);
      setDeleteTimeout(null);
    } else {
      // First click - set timeout to reset
      const timeout = setTimeout(() => {
        setDeleteClickCount(0);
        setDeleteTimeout(null);
      }, 2000); // Reset after 2 seconds
      setDeleteTimeout(timeout);
    }
  };

  // Get card background with business color tint (darker)
  const getCardBackground = () => {
    if (task.businesses) {
      const slug = task.businesses.slug;
      switch(slug) {
        case 'full-stack':
        case 'fullstack': return 'rgb(25, 95, 75)'; // darker green
        case 'huge-capital': return 'rgb(85, 45, 120)'; // darker purple
        case 's4': return 'rgb(35, 70, 130)'; // darker blue
        case '808': return 'rgb(120, 95, 35)'; // darker yellow/gold
        case 'health': return 'rgb(25, 90, 85)'; // darker teal
        case 'personal': return 'rgb(120, 45, 85)'; // darker pink
        case 'golf': return 'rgb(130, 65, 25)'; // darker orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    if (task.life_areas) {
      const category = task.life_areas.category.toLowerCase();
      switch(category) {
        case 'health': return 'rgb(25, 90, 85)'; // darker teal
        case 'personal': return 'rgb(120, 45, 85)'; // darker pink
        case 'golf': return 'rgb(130, 65, 25)'; // darker orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    // Fallback to legacy area field
    if (task.area) {
      switch(task.area) {
        case 'Full Stack': return 'rgb(25, 95, 75)'; // darker green
        case 'Huge Capital': return 'rgb(85, 45, 120)'; // darker purple
        case 'S4': return 'rgb(35, 70, 130)'; // darker blue
        case '808': return 'rgb(120, 95, 35)'; // darker yellow/gold
        case 'Health': return 'rgb(25, 90, 85)'; // darker teal
        case 'Personal': return 'rgb(120, 45, 85)'; // darker pink
        case 'Golf': return 'rgb(130, 65, 25)'; // darker orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    return 'rgb(31, 41, 55)';
  };

  // Get lighter expanded section background (lighter but still has color)
  const getExpandedBackground = () => {
    if (task.businesses) {
      const slug = task.businesses.slug;
      switch(slug) {
        case 'full-stack':
        case 'fullstack': return 'rgb(60, 130, 105)'; // lighter green
        case 'huge-capital': return 'rgb(130, 85, 165)'; // lighter purple
        case 's4': return 'rgb(75, 115, 170)'; // lighter blue
        case '808': return 'rgb(165, 135, 70)'; // lighter yellow/gold
        case 'health': return 'rgb(60, 130, 120)'; // lighter teal
        case 'personal': return 'rgb(165, 85, 125)'; // lighter pink
        case 'golf': return 'rgb(175, 105, 60)'; // lighter orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    if (task.life_areas) {
      const category = task.life_areas.category.toLowerCase();
      switch(category) {
        case 'health': return 'rgb(60, 130, 120)'; // lighter teal
        case 'personal': return 'rgb(165, 85, 125)'; // lighter pink
        case 'golf': return 'rgb(175, 105, 60)'; // lighter orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    // Fallback to legacy area field
    if (task.area) {
      switch(task.area) {
        case 'Full Stack': return 'rgb(60, 130, 105)'; // lighter green
        case 'Huge Capital': return 'rgb(130, 85, 165)'; // lighter purple
        case 'S4': return 'rgb(75, 115, 170)'; // lighter blue
        case '808': return 'rgb(165, 135, 70)'; // lighter yellow/gold
        case 'Health': return 'rgb(60, 130, 120)'; // lighter teal
        case 'Personal': return 'rgb(165, 85, 125)'; // lighter pink
        case 'Golf': return 'rgb(175, 105, 60)'; // lighter orange
        default: return 'rgb(31, 41, 55)';
      }
    }
    return 'rgb(31, 41, 55)';
  };

  return (
    <Card
      className={`border-gray-700 group hover:border-gray-600 transition-all duration-200 max-w-full overflow-hidden ${
        isCompleted ? 'opacity-60' : ''
      } ${className}`}
      style={{ backgroundColor: getCardBackground() }}
    >
      {/* Compact Main Row */}
      <div className="p-3 sm:p-4">
        {/* Mobile layout: Full-width title on first row */}
        <div className="flex items-center gap-2 sm:hidden mb-2 justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Status Icon (Clickable) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Toggle completion
                if (isCompleted) {
                  // Uncomplete the task
                  handleUpdate({
                    progress_percentage: 0,
                    status: 'Not started',
                    completed_at: null,
                  });
                } else {
                  // Validation checks before marking complete
                  const missingFields: string[] = [];

                  if (!task.hours_worked || task.hours_worked === 0) {
                    missingFields.push('Time Tracking Log entries');
                  }
                  if (!task.effort_level) {
                    missingFields.push('Money Maker');
                  }
                  if (!task.automation) {
                    missingFields.push('Automation');
                  }
                  if (!task.hours_projected || task.hours_projected === 0) {
                    missingFields.push('Hours Projected');
                  }

                  if (missingFields.length > 0) {
                    alert(`Please fill out the following fields before marking this task as complete:\n\n${missingFields.join('\n')}`);
                    return;
                  }

                  // Mark as complete
                  handleUpdate({
                    progress_percentage: 100,
                    status: 'Done',
                    completed_at: new Date().toISOString(),
                  });
                }
              }}
              className="w-8 h-8 p-0 relative shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : (
                <Circle className="w-5 h-5 text-white" />
              )}
            </Button>

            {/* Title (Editable) - Full width on mobile */}
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <Input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  autoFocus
                  className="h-9 text-lg text-gray-100 font-medium bg-transparent border-gray-600 focus:border-blue-400"
                />
              ) : (
                <div>
                  <h3
                    onClick={() => setIsEditingTitle(true)}
                    className={`text-lg font-medium cursor-pointer hover:text-blue-400 transition-colors line-clamp-2 ${
                      isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                    }`}
                  >
                    {task.task_name}
                  </h3>
                </div>
              )}
            </div>
          </div>

          {/* Expand Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-6 h-6 p-0 text-white hover:text-white shrink-0"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Mobile: Description (full width) */}
        {task.description && (
          <div className="sm:hidden mb-2 pl-10">
            <p className="text-xs text-gray-300 line-clamp-2">
              {task.description}
            </p>
          </div>
        )}

        {/* Mobile: Date and Schedule buttons stacked on right with expand button */}
        <div className="sm:hidden flex items-start justify-end gap-2">
          {/* Right: Stacked buttons */}
          <div className="flex flex-col gap-1 items-end shrink-0">
            {/* Due Date Badge */}
            {task.due_date ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateTimePicker(true)}
                className={`h-6 px-1.5 text-xs gap-0.5 w-auto justify-center ${
                  overdue
                    ? 'text-red-400 hover:bg-red-500/10'
                    : dueToday
                    ? 'text-yellow-400 hover:bg-yellow-500/10'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                {overdue && <AlertCircle className="w-2.5 h-2.5" />}
                <Calendar className="w-2.5 h-2.5" />
                <span className="text-xs">
                  {dueToday
                    ? 'Today'
                    : overdue
                    ? 'Overdue'
                    : format(parseLocalDate(task.due_date) || new Date(), 'MMM d')}
                </span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateTimePicker(true)}
                className="h-6 px-1.5 text-xs gap-0.5 w-auto justify-center text-gray-500 hover:bg-gray-700 hover:text-gray-300"
              >
                <Calendar className="w-2.5 h-2.5" />
              </Button>
            )}

            {/* Schedule Status Button */}
            <div
              className={`h-6 px-1.5 text-xs font-medium rounded-md w-auto flex items-center justify-center text-white whitespace-nowrap ${
                isCompleted
                  ? 'bg-green-600'
                  : hasTimeBlocks
                  ? 'bg-blue-600'
                  : 'bg-pink-500'
              }`}
              title={earliestTimeBlock ? `Scheduled for ${earliestTimeBlock.scheduled_date}` : undefined}
            >
              <span className="text-xs whitespace-nowrap">
                {isCompleted
                  ? 'Done'
                  : hasTimeBlocks && earliestTimeBlock
                  ? format(new Date(`2000-01-01T${earliestTimeBlock.start_time}`), 'h:mm a')
                  : 'Schedule'}
              </span>
            </div>
          </div>
        </div>

        {/* Desktop layout: Original layout preserved */}
        <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Status Icon (Clickable) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Toggle completion
              if (isCompleted) {
                // Uncomplete the task
                handleUpdate({
                  progress_percentage: 0,
                  status: 'Not started',
                  completed_at: null,
                });
              } else {
                // Validation checks before marking complete
                const missingFields: string[] = [];

                if (!task.hours_worked || task.hours_worked === 0) {
                  missingFields.push('Time Tracking Log entries');
                }
                if (!task.effort_level) {
                  missingFields.push('Money Maker');
                }
                if (!task.automation) {
                  missingFields.push('Automation');
                }
                if (!task.hours_projected || task.hours_projected === 0) {
                  missingFields.push('Hours Projected');
                }

                if (missingFields.length > 0) {
                  alert(`Please fill out the following fields before marking this task as complete:\n\n${missingFields.join('\n')}`);
                  return;
                }

                // Mark as complete
                handleUpdate({
                  progress_percentage: 100,
                  status: 'Done',
                  completed_at: new Date().toISOString(),
                });
              }
            }}
            className="w-8 h-8 p-0 relative shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-white" />
            )}
          </Button>

          {/* Title (Editable) */}
          <div className="flex-1 min-w-0 max-w-[600px]">
            {isEditingTitle ? (
              <Input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="h-9 text-xl text-gray-100 font-medium bg-transparent border-gray-600 focus:border-blue-400"
              />
            ) : (
              <div>
                <h3
                  onClick={() => setIsEditingTitle(true)}
                  className={`text-xl font-medium cursor-pointer hover:text-blue-400 transition-colors truncate ${
                    isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                  }`}
                >
                  {task.task_name}
                </h3>
                {task.description && (
                  <p className="text-xs text-white mt-1 truncate">
                    {task.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Compact Badges */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-wrap xl:flex-nowrap ml-auto">
            {/* Business/Area/Project Badge - Hidden on mobile to show task name */}
            <div className="hidden sm:flex items-center gap-1">
              {task.projects ? (
                <Badge
                  className="text-white border-0 text-xs px-2 sm:px-3 py-0.5 sm:py-1 font-medium whitespace-nowrap"
                  style={{ backgroundColor: businessColor }}
                >
                  {sourceName}
                </Badge>
              ) : (
                <Select
                  value={task.project_id || 'no-project'}
                  onValueChange={(projectId) => handleUpdate({ project_id: projectId === 'no-project' ? null : projectId })}
                >
                  <SelectTrigger
                    className="h-8 sm:h-9 text-sm sm:text-base px-2 sm:px-4 py-0 border-0 gap-1 whitespace-nowrap"
                    style={{
                      backgroundColor: businessColor,
                      color: 'white',
                      minWidth: '120px',
                      width: '120px'
                    }}
                  >
                    <SelectValue placeholder="+ Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-project">Unorganized</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    )) || null}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Energy Level Badge - clickable to edit */}
            <Select
              value={task.energy_level || 'none'}
              onValueChange={(value) => handleUpdate({ energy_level: value === 'none' ? null : (value as any) })}
            >
              <SelectTrigger
                className="h-6 text-xs px-2 sm:px-3 py-0 border-0 whitespace-nowrap text-white font-medium [&>svg]:hidden flex items-center justify-center"
                style={{
                  backgroundColor: task.energy_level === 'Deep Work' ? '#2563eb' : task.energy_level === 'Admin' ? '#f59e0b' : '#6b7280',
                  borderColor: task.energy_level === 'Deep Work' ? '#2563eb' : task.energy_level === 'Admin' ? '#f59e0b' : '#6b7280'
                }}
              >
                <SelectValue placeholder="Energy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Energy Level</SelectItem>
                <SelectItem value="Deep Work">🎯 Deep Work</SelectItem>
                <SelectItem value="Admin">📋 Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Due Date Badge */}
            {task.due_date ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateTimePicker(true)}
                className={`h-7 sm:h-8 px-1 sm:px-2 text-xs sm:text-xs gap-0.5 w-auto justify-center ${
                  overdue
                    ? 'text-red-400 hover:bg-red-500/10'
                    : dueToday
                    ? 'text-yellow-400 hover:bg-yellow-500/10'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                {overdue && <AlertCircle className="w-3 sm:w-3 h-3 sm:h-3" />}
                <Calendar className="w-3 sm:w-3 h-3 sm:h-3" />
                <span className="text-xs sm:text-xs">
                  {dueToday
                    ? 'Today'
                    : overdue
                    ? 'Overdue'
                    : format(parseLocalDate(task.due_date) || new Date(), 'MMM d')}
                </span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateTimePicker(true)}
                className="h-7 sm:h-8 px-1 sm:px-2 text-xs sm:text-xs gap-0.5 w-auto justify-center text-gray-500 hover:bg-gray-700 hover:text-gray-300"
              >
                <Calendar className="w-3 sm:w-3 h-3 sm:h-3" />
                <span className="hidden sm:inline text-xs">Set Date</span>
              </Button>
            )}

            {/* Schedule Status Button */}
            <div
              className={`h-6 px-1 sm:px-2 py-0 text-xs sm:text-xs font-medium rounded-md w-auto flex items-center justify-center text-white whitespace-nowrap ${
                isCompleted
                  ? 'bg-green-600'
                  : hasTimeBlocks
                  ? 'bg-blue-600'
                  : 'bg-pink-500'
              }`}
              title={earliestTimeBlock ? `Scheduled for ${earliestTimeBlock.scheduled_date}` : undefined}
            >
              <span className="text-xs sm:text-xs whitespace-nowrap">
                {isCompleted
                  ? 'Completed'
                  : hasTimeBlocks && earliestTimeBlock
                  ? format(new Date(`2000-01-01T${earliestTimeBlock.start_time}`), 'h:mm a')
                  : 'Schedule'}
              </span>
            </div>

            {/* Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-6 h-6 p-0 text-white hover:text-white"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <>
          <div className="border-t border-gray-700/30" />
          <div className="p-3 sm:p-4 lg:p-6 max-w-full overflow-x-auto" style={{ backgroundColor: getExpandedBackground() }}>
            {/* Three-column layout - responsive: stacks on mobile, side-by-side on larger screens */}
            <div className="grid grid-cols-1 2xl:grid-cols-[1fr_1.5fr_280px] gap-4 sm:gap-6 min-w-0">
              {/* Left Column - Notes Panel (hidden for recurring templates) */}
              {!isRecurringTemplate && (
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Notes</label>
                {isEditingNotes ? (
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    onBlur={handleNotesSave}
                    autoFocus
                    rows={16}
                    placeholder="Add notes, thoughts, or details..."
                    className="text-sm resize-none bg-gray-800/30 border-gray-700/30 focus:bg-gray-800/50 transition-colors flex-1 leading-relaxed text-gray-100 placeholder:text-gray-500"
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingNotes(true)}
                    className={`text-sm cursor-pointer hover:bg-gray-800/30 transition-all px-4 py-3 rounded-lg border border-gray-700/30 flex-1 leading-relaxed ${
                      task.description ? 'text-gray-100' : 'text-white'
                    }`}
                  >
                    {task.description || 'Add Notes...'}
                  </div>
                )}
              </div>
              )}

              {/* Middle Column - Time Tracking Log */}
              <div>
                <TaskTimeLog
                  taskId={task.id}
                  hoursProjected={task.hours_projected || 0}
                  hoursWorked={task.hours_worked || 0}
                />
              </div>

              {/* Right Column - Metadata */}
              <div className="space-y-4">
                {/* Row 1: Created & Automation */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Created</label>
                    <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-gray-100 border border-gray-700/30">
                      {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Automation</label>
                    <Select
                      value={task.automation || 'none'}
                      onValueChange={(value) =>
                        handleUpdate({ automation: value === 'none' ? null : (value as Automation) })
                      }
                    >
                      <SelectTrigger className="h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors text-gray-100">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="Automate">🤖 Automate</SelectItem>
                        <SelectItem value="Delegate">👥 Delegate</SelectItem>
                        <SelectItem value="Manual">✋ Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Days Since Creation & Money Maker */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Days Since Creation</label>
                    <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-gray-100 border border-gray-700/30">
                      {task.created_at
                        ? Math.floor((new Date().getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24))
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Money Maker</label>
                    <Select
                      value={task.effort_level || 'none'}
                      onValueChange={(value) =>
                        handleUpdate({ effort_level: value === 'none' ? null : (value as EffortLevel) })
                      }
                    >
                      <SelectTrigger className={`h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors font-semibold ${getEffortLevelColor(task.effort_level)}`}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="$$$ Printer $$$" className="text-green-500 font-semibold">$$$ Printer $$$</SelectItem>
                        <SelectItem value="$ Makes Money $" className="text-green-400 font-semibold">$ Makes Money $</SelectItem>
                        <SelectItem value="-$ Save Dat $-" className="text-orange-400 font-semibold">-$ Save Dat $-</SelectItem>
                        <SelectItem value=":( No Money ):" className="text-red-400 font-semibold">:( No Money ):</SelectItem>
                        <SelectItem value="8) Vibing (8" className="text-purple-500 font-semibold">8) Vibing (8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Hours Worked & Hours Projected */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Hours Worked</label>
                    <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-green-400 border border-gray-700/30 font-semibold">
                      {task.hours_worked?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Hours Projected</label>
                    <Input
                      type="text"
                      value={hoursProjectedInput || (task.hours_projected !== null && task.hours_projected !== undefined ? task.hours_projected.toFixed(2) : '')}
                      onFocus={() => {
                        // On focus, show the raw value for editing
                        setHoursProjectedInput(task.hours_projected ? task.hours_projected.toString() : '');
                      }}
                      onChange={(e) => {
                        // Allow only numbers and decimal point while typing
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        setHoursProjectedInput(value);
                      }}
                      onBlur={() => {
                        const value = hoursProjectedInput.trim();
                        if (value === '') {
                          handleUpdate({ hours_projected: null });
                          setHoursProjectedInput('');
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            handleUpdate({ hours_projected: numValue });
                            setHoursProjectedInput(''); // Clear to show formatted value from task
                          } else {
                            setHoursProjectedInput(''); // Invalid input, clear it
                          }
                        }
                      }}
                      placeholder=""
                      className="h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors text-purple-400 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                {/* Task Completed Button & Completed Date & Delete Button */}
                <div className="space-y-3">
                  <Button
                    onClick={() => {
                      // Toggle completion
                      if (isCompleted) {
                        // Uncomplete the task
                        handleUpdate({
                          progress_percentage: 0,
                          status: 'Not started',
                          completed_at: null,
                        });
                      } else {
                        // Validation checks before marking complete
                        const missingFields: string[] = [];

                        if (!task.hours_worked || task.hours_worked === 0) {
                          missingFields.push('Time Tracking Log entries');
                        }
                        if (!task.effort_level) {
                          missingFields.push('Money Maker');
                        }
                        if (!task.automation) {
                          missingFields.push('Automation');
                        }
                        if (!task.hours_projected || task.hours_projected === 0) {
                          missingFields.push('Hours Projected');
                        }

                        if (missingFields.length > 0) {
                          alert(`Please fill out the following fields before marking this task as complete:\n\n${missingFields.join('\n')}`);
                          return;
                        }

                        // Mark as complete
                        handleUpdate({
                          progress_percentage: 100,
                          status: 'Done',
                          completed_at: new Date().toISOString(),
                        });
                      }
                    }}
                    className={`w-full h-12 text-base font-semibold ${
                      isCompleted
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                    }`}
                  >
                    {isCompleted ? 'Uncomplete Task' : 'Mark Task Complete'}
                  </Button>

                  {/* Completed Date & Delete Button Row */}
                  <div className="grid grid-cols-[1fr_40px] gap-2">
                    <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-gray-100 border border-gray-700/30">
                      {task.completed_at && task.completed_at !== 'null'
                        ? `Completed: ${format(new Date(task.completed_at), 'MMM d, yyyy · h:mm a')}`
                        : 'Completed: —'}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick()}
                      className="h-10 w-10 p-0 text-red-500 hover:text-red-400 bg-white hover:bg-gray-100 rounded-lg"
                      title="Delete task"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showDateTimePicker && (
        <DateTimePicker
          scheduledDate={task.due_date}
          scheduledTime={null}
          onSchedule={handleScheduleChange}
          onClose={() => setShowDateTimePicker(false)}
          hoursProjected={task.hours_projected}
        />
      )}

      {showTimeTrackingModal && (
        <TimeTrackingModal
          taskName={task.task_name}
          onSave={handleTimeTrackingSave}
          onClose={() => setShowTimeTrackingModal(false)}
        />
      )}
    </Card>
  );
};
