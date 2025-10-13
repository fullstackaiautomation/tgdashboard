import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar, MoreHorizontal, CheckCircle2, Circle, AlertCircle, Trash2 } from 'lucide-react';
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
import { ProgressSlider } from '../shared/ProgressSlider';
import { DateTimePicker } from './DateTimePicker';
import { TimeTrackingModal } from './TimeTrackingModal';
import type { TaskHub, TaskStatus, Automation, EffortLevel } from '../../types/task';
import { parseLocalDate, isToday as checkIsToday, isOverdue as checkIsOverdue } from '@/utils/dateHelpers';

interface TaskCardProps {
  task: TaskHub;
  className?: string;
  compact?: boolean;
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
 * Minimalist TaskCard - Clean, compact, scannable
 */
export const TaskCard: FC<TaskCardProps> = ({ task, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const [editedNotes, setEditedNotes] = useState(task.description || '');
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
  const { setupUndo } = useUndo<TaskHub>(30000);

  // Fetch projects for the task's business
  const { data: projects } = useProjects(task.business_id || undefined);

  // Fetch phases for the selected project
  const { data: phases } = usePhases(task.project_id || undefined);

  const businessColor = getBusinessColor(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);
  const progress = task.progress_percentage ?? 0;
  const isCompleted = progress === 100;

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

  const handleScheduleChange = (date: string | null, _time: string | null) => {
    // The DateTimePicker already provides properly formatted date string (YYYY-MM-DD)
    // We need to convert it to ISO format for storage
    if (!date) {
      handleUpdate({ due_date: undefined });
      return;
    }

    // Parse the YYYY-MM-DD string and create date at noon local time
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Convert to ISO string for storage
    handleUpdate({ due_date: localDate.toISOString() });
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
        case 'full-stack': return 'rgb(25, 95, 75)'; // darker green
        case 'huge-capital': return 'rgb(85, 45, 120)'; // darker purple
        case 's4': return 'rgb(35, 70, 130)'; // darker blue
        case '808': return 'rgb(120, 95, 35)'; // darker yellow/gold
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
    return 'rgb(31, 41, 55)';
  };

  // Get lighter expanded section background (lighter but still has color)
  const getExpandedBackground = () => {
    if (task.businesses) {
      const slug = task.businesses.slug;
      switch(slug) {
        case 'full-stack': return 'rgb(60, 130, 105)'; // lighter green
        case 'huge-capital': return 'rgb(130, 85, 165)'; // lighter purple
        case 's4': return 'rgb(75, 115, 170)'; // lighter blue
        case '808': return 'rgb(165, 135, 70)'; // lighter yellow/gold
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
    return 'rgb(31, 41, 55)';
  };

  return (
    <Card
      className={`border-gray-700 group hover:border-gray-600 transition-all duration-200 ${
        isCompleted ? 'opacity-60' : ''
      } ${className}`}
      style={{ backgroundColor: getCardBackground() }}
    >
      {/* Compact Main Row */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Status Icon (Clickable) */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowProgressSlider(!showProgressSlider)}
            className="w-8 h-8 p-0 relative shrink-0"
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            ) : (
              <Circle className="w-5 h-5 text-gray-500" />
            )}
            {showProgressSlider && (
              <div ref={progressSliderRef} className="absolute top-full left-0 mt-2 z-20">
                <ProgressSlider
                  progress={progress}
                  onChange={handleProgressChange}
                  onClose={() => setShowProgressSlider(false)}
                  onTimeTrack={(hours) => handleUpdate({ hours_worked: hours })}
                  hoursWorked={task.hours_worked}
                />
              </div>
            )}
          </Button>

          {/* Title (Editable) */}
          <div className="flex-1 min-w-0 max-w-[400px]">
            {isEditingTitle ? (
              <Input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="h-8 text-sm"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className={`text-sm font-medium cursor-pointer hover:text-blue-400 transition-colors truncate ${
                  isCompleted ? 'line-through text-gray-500' : 'text-gray-100'
                }`}
              >
                {task.task_name}
              </h3>
            )}
          </div>

          {/* Compact Badges */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            {/* Business/Area/Project Badge */}
            {task.projects ? (
              <Badge
                className="text-white border-0 text-xs px-3 py-1 font-medium whitespace-nowrap"
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
                  className="h-7 text-xs px-3 py-0 border-0 gap-1 whitespace-nowrap"
                  style={{
                    backgroundColor: businessColor,
                    color: 'white',
                    minWidth: '140px',
                    width: '140px'
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

            {/* Phase Selector - appears when project is selected */}
            {task.project_id && (
              <Select
                value={task.phase_id || 'no-phase'}
                onValueChange={(phaseId) => handleUpdate({ phase_id: phaseId === 'no-phase' ? null : phaseId })}
              >
                <SelectTrigger
                  className="h-7 text-xs px-3 py-0 border-0 gap-1 text-white whitespace-nowrap"
                  style={{
                    backgroundColor: 'rgba(75, 85, 99, 0.8)',
                    minWidth: '180px',
                    width: '180px'
                  }}
                >
                  <SelectValue placeholder="No Phase Identified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-phase">No Phase Identified</SelectItem>
                  {phases?.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  )) || null}
                </SelectContent>
              </Select>
            )}

            {/* Due Date Badge */}
            {task.due_date ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateTimePicker(true)}
                className={`h-6 px-2 text-xs gap-1 ${
                  overdue
                    ? 'text-red-400 hover:bg-red-500/10'
                    : dueToday
                    ? 'text-yellow-400 hover:bg-yellow-500/10'
                    : 'text-gray-400 hover:bg-gray-700'
                }`}
              >
                {overdue && <AlertCircle className="w-3 h-3" />}
                <Calendar className="w-3 h-3" />
                <span>
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
                className="h-6 px-2 text-xs gap-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300"
              >
                <Calendar className="w-3 h-3" />
                <span>Set Date</span>
              </Button>
            )}

            {/* Expand Button with Delete Dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-6 h-6 p-0"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>

              {/* Delete Button - appears when expanded */}
              {isExpanded && (
                <div className="absolute top-full right-0 mt-2 z-10 bg-gray-200 rounded-lg shadow-lg border border-gray-300 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className={`w-8 h-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all ${
                      deleteClickCount === 1 ? 'bg-red-300 animate-pulse' : 'hover:bg-gray-300'
                    }`}
                    title={deleteClickCount === 1 ? 'Click again to confirm' : 'Delete task'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar - more prominent */}
        {progress > 0 && progress < 100 && (
          <div className="mt-3">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full bg-green-500"
                style={{
                  width: `${progress}%`
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <>
          <div className="border-t border-gray-700/30" />
          <div className="p-6" style={{ backgroundColor: getExpandedBackground() }}>
            {/* Two-column layout */}
            <div className="grid grid-cols-[400px_1fr] gap-6">
              {/* Left Column - Metadata */}
              <div className="space-y-4">
                {/* Row 1: Area & Money Maker Level */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Area</label>
                    <div className="px-4 py-2.5 bg-gray-800/50 rounded-lg text-sm text-gray-100 font-medium border border-gray-700/50">
                      {task.businesses?.name || task.life_areas?.name || task.area || 'None'}
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
                      <SelectTrigger className="h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors text-gray-100">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="$$$ Printer $$$">$$$ Printer $$$</SelectItem>
                        <SelectItem value="$ Makes Money $">$ Makes Money $</SelectItem>
                        <SelectItem value="-$ Save Dat $-">-$ Save Dat $-</SelectItem>
                        <SelectItem value=":( No Money ):">:( No Money ):</SelectItem>
                        <SelectItem value="8) Vibing (8">8) Vibing (8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Hours Worked & Hours Projected */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Hours Worked</label>
                    <Input
                      type="number"
                      value={task.hours_worked || ''}
                      onChange={(e) =>
                        handleUpdate({ hours_worked: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      placeholder="0.00"
                      step="0.25"
                      className="h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Hours Projected</label>
                    <Input
                      type="number"
                      value={task.hours_projected || ''}
                      onChange={(e) =>
                        handleUpdate({ hours_projected: e.target.value ? parseFloat(e.target.value) : null })
                      }
                      placeholder="0.00"
                      step="0.25"
                      className="h-10 text-sm bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70 transition-colors text-gray-100"
                    />
                  </div>
                </div>

                {/* Row 3: Automation */}
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

                {/* Divider */}
                <div className="border-t border-gray-700/30 my-1" />

                {/* Row 4: Created Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Created</label>
                  <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-gray-100 border border-gray-700/30">
                    {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy · h:mm a') : 'Unknown'}
                  </div>
                </div>

                {/* Row 5: Completed Date */}
                <div>
                  <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide block mb-2">Completed</label>
                  <div className="px-4 py-2.5 bg-gray-800/30 rounded-lg text-sm text-gray-100 border border-gray-700/30">
                    {task.completed_at ? format(new Date(task.completed_at), 'MMM d, yyyy · h:mm a') : '—'}
                  </div>
                </div>
              </div>

              {/* Right Column - Notes Panel */}
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
                      task.description ? 'text-gray-100' : 'text-gray-500 italic'
                    }`}
                  >
                    {task.description || 'Click to add notes, thoughts, or details...'}
                  </div>
                )}
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
