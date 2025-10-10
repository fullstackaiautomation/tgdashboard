import type { FC } from 'react';
import { useState } from 'react';
import { format /* , differenceInDays */ } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useUpdateTask } from '../../hooks/useTasks';
import { useUndo } from '../../hooks/useUndo';
// import { useProjects, usePhases } from '../../hooks/useProjects';
import { ProgressIndicator } from '../shared/ProgressIndicator';
import { ProgressSlider } from '../shared/ProgressSlider';
import { DateTimePicker } from './DateTimePicker';
import { TimeTrackingModal } from './TimeTrackingModal';
import type { TaskHub, TaskStatus, Automation } from '../../types/task';

interface TaskCardProps {
  task: TaskHub;
  className?: string;
  compact?: boolean;
}

/**
 * Get color class for business/area badge
 */
const getColorClass = (task: TaskHub): string => {
  if (task.businesses) {
    const slug = task.businesses.slug;
    if (slug === 'full-stack' || slug === 'fullstack') return 'bg-[var(--color-business-fullstack)]';
    if (slug === 'huge-capital') return 'bg-[var(--color-business-hugecapital)]';
    if (slug === 's4') return 'bg-[var(--color-business-s4)]';
    if (slug === '808') return 'bg-[var(--color-business-808)]';
  }

  if (task.life_areas) {
    const category = task.life_areas.category.toLowerCase();
    if (category === 'personal') return 'bg-[var(--color-area-personal)]';
    if (category === 'health') return 'bg-[var(--color-area-health)]';
    if (category === 'golf') return 'bg-[var(--color-area-golf)]';
  }

  // Fallback to legacy area
  if (task.area) {
    if (task.area === 'Full Stack') return 'bg-[var(--color-business-fullstack)]';
    if (task.area === 'Huge Capital') return 'bg-[var(--color-business-hugecapital)]';
    if (task.area === 'S4') return 'bg-[var(--color-business-s4)]';
    if (task.area === '808') return 'bg-[var(--color-business-808)]';
    if (task.area === 'Personal') return 'bg-[var(--color-area-personal)]';
    if (task.area === 'Health') return 'bg-[var(--color-area-health)]';
    if (task.area === 'Golf') return 'bg-[var(--color-area-golf)]';
  }

  return 'bg-gray-500';
};

/**
 * Get source display name (Business or Life Area)
 */
const getSourceName = (task: TaskHub): string => {
  if (task.businesses) return task.businesses.name;
  if (task.life_areas) return task.life_areas.name;
  if (task.area) return task.area;
  return 'Unknown';
};

/**
 * Check if task is overdue
 */
const isOverdue = (task: TaskHub): boolean => {
  if (!task.due_date || task.progress_percentage === 100) return false;
  return new Date(task.due_date) < new Date();
};

/**
 * Calculate days overdue - commented out (unused)
 */
// const getDaysOverdue = (task: TaskHub): number => {
//   if (!task.due_date) return 0;
//   return Math.abs(differenceInDays(new Date(), new Date(task.due_date)));
// };

/**
 * TaskCard - Displays a single task with business/area color coding and inline editing
 */
export const TaskCard: FC<TaskCardProps> = ({ task, className = '' }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.task_name);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  // const [showProjectPhaseDropdown, setShowProjectPhaseDropdown] = useState(false);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [showTimeTrackingModal, setShowTimeTrackingModal] = useState(false);
  const [_syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const updateTask = useUpdateTask();
  const { /* canUndo, */ setupUndo /* , executeUndo */ } = useUndo<TaskHub>(30000);
  // const { data: projects } = useProjects(task.business_id || undefined);
  // const { data: phases } = usePhases(task.project_id || undefined);

  const colorClass = getColorClass(task);
  const sourceName = getSourceName(task);
  const overdue = isOverdue(task);

  // Default to 0 if progress_percentage is undefined/null
  const progress = task.progress_percentage ?? 0;

  const handleUpdate = async (updates: Partial<TaskHub>) => {
    setSyncStatus('syncing');

    // Setup undo before making change
    const previousTask = { ...task };
    setupUndo(previousTask, () => {
      updateTask.mutate({
        id: task.id,
        updates: previousTask,
      });
    });

    try {
      await updateTask.mutateAsync({
        id: task.id,
        updates,
      });
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      setSyncStatus('error');
      console.error('Task update failed:', error);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // Unused handler - for future status dropdown feature
  // const handleStatusChange = (newStatus: TaskStatus) => {
  //   // Map status to progress percentage
  //   let newProgress = progress;
  //   if (newStatus === 'Not started') {
  //     newProgress = 0;
  //   } else if (newStatus === 'Done') {
  //     newProgress = 100;
  //   } else if (newStatus === 'In progress' && newProgress === 0) {
  //     newProgress = 50; // Default to 50% when marking as in progress
  //   }

  //   handleUpdate({
  //     status: newStatus,
  //     progress_percentage: newProgress,
  //     completed_at: newStatus === 'Done' ? new Date().toISOString() : undefined,
  //   });
  // };

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

  const handleDescriptionSave = () => {
    if (editedDescription !== (task.description || '')) {
      handleUpdate({ description: editedDescription.trim() || null });
    }
    setIsEditingDescription(false);
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedDescription(task.description || '');
      setIsEditingDescription(false);
    }
  };

  // Unused handlers - for future features
  // const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
  //   handleUpdate({ due_date: newDate });
  // };

  // const handleProjectPhaseChange = (projectId: string | null, phaseId: string | null) => {
  //   handleUpdate({
  //     project_id: projectId,
  //     phase_id: phaseId,
  //   });
  //   setShowProjectPhaseDropdown(false);
  // };

  const handleProgressChange = (progress: number) => {
    // Update status based on progress
    let newStatus: TaskStatus = task.status;
    if (progress === 0) {
      newStatus = 'Not started';
    } else if (progress === 100) {
      newStatus = 'Done';
      // Show time tracking modal when task reaches 100%
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
    handleUpdate({
      hours_worked: hours,
    });
    setShowTimeTrackingModal(false);
  };

  const handleScheduleChange = (date: string | null, time: string | null) => {
    handleUpdate({
      scheduled_date: date,
      scheduled_time: time,
    });
  };

  // const daysOverdue = overdue ? getDaysOverdue(task) : 0;

  // Get background color based on business or life area
  const getCardBackgroundColor = () => {
    if (task.businesses) {
      const slug = task.businesses.slug;
      switch(slug) {
        case 'full-stack': return 'rgba(16, 185, 129, 0.15)'; // green tint
        case 'huge-capital': return 'rgba(168, 85, 247, 0.15)'; // purple tint
        case 's4': return 'rgba(59, 130, 246, 0.15)'; // blue tint
        case '808': return 'rgba(234, 179, 8, 0.15)'; // yellow tint
        default: return '';
      }
    }
    if (task.life_areas) {
      const category = task.life_areas.category.toLowerCase();
      switch(category) {
        case 'health': return 'rgba(20, 184, 166, 0.15)'; // teal tint
        case 'personal': return 'rgba(236, 72, 153, 0.15)'; // pink tint
        case 'golf': return 'rgba(249, 115, 22, 0.15)'; // orange tint
        default: return '';
      }
    }
    return '';
  };

  const cardBgColor = getCardBackgroundColor();

  return (
    <div
      className={`rounded-lg p-6 border ${
        overdue ? 'border-red-500/50' : 'border-gray-700'
      } hover:border-gray-600 transition-colors ${className}`}
      style={{ backgroundColor: cardBgColor || '#1f2937' }}
    >
      <div className="flex items-start gap-6">
        {/* Left Section: Calendar + Progress Indicator */}
        <div className="flex flex-col items-center gap-3">
          {/* Calendar/Due Date Display - Square Box */}
          <div
            className="flex flex-col items-center justify-center w-24 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all hover:border-orange-500"
            onClick={() => setShowDateTimePicker(true)}
            style={{
              borderColor: overdue ? '#ef4444' :
                          format(new Date(task.due_date || new Date()), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? '#eab308' :
                          format(new Date(task.due_date || new Date()), 'yyyy-MM-dd') === format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd') ? '#f97316' :
                          '#4b5563',
              backgroundColor: overdue ? 'rgba(239, 68, 68, 0.1)' :
                              format(new Date(task.due_date || new Date()), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'rgba(234, 179, 8, 0.1)' :
                              format(new Date(task.due_date || new Date()), 'yyyy-MM-dd') === format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd') ? 'rgba(249, 115, 22, 0.1)' :
                              'rgba(75, 85, 99, 0.1)'
            }}
          >
            {task.due_date ? (
              <>
                {/* Top Label - DUE/OVERDUE */}
                <div className={`text-xs font-bold uppercase tracking-wide mb-1 ${
                  overdue ? 'text-red-400' :
                  format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'text-yellow-400' :
                  'text-gray-400'
                }`}>
                  {overdue ? 'OVERDUE' :
                   format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'DUE' :
                   format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(new Date().setDate(new Date().getDate() + 1)), 'yyyy-MM-dd') ? 'DUE' :
                   'DUE'}
                </div>

                {/* Main Date Display - Month & Day or "Today" */}
                {format(new Date(task.due_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? (
                  <div className="text-xl font-bold text-yellow-400">
                    Today
                  </div>
                ) : (
                  <div className={`text-lg font-bold ${
                    overdue ? 'text-red-400' : 'text-gray-100'
                  }`}>
                    {format(new Date(task.due_date), 'MMM d').toUpperCase()}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center">
                <Calendar className="w-8 h-8 text-gray-500 mb-1" />
                <div className="text-xs text-gray-500">No Date</div>
              </div>
            )}
          </div>

          {/* Progress Indicator below calendar */}
          <div
            className="cursor-pointer relative"
            onClick={() => setShowProgressSlider(!showProgressSlider)}
          >
            <ProgressIndicator progress={progress} size="lg" />

            {/* Progress Slider Popup */}
            {showProgressSlider && (
              <div className="absolute top-full left-0 mt-2 z-20">
                <ProgressSlider
                  progress={progress}
                  onChange={handleProgressChange}
                  onClose={() => setShowProgressSlider(false)}
                  onTimeTrack={(hours) => handleUpdate({ hours_worked: hours })}
                />
              </div>
            )}
          </div>
        </div>

        {/* Middle Section: Title + Badges */}
        <div className="flex-1 min-w-0">
          {/* Task Title */}
          <div className="mb-3">
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                className="w-full text-xl font-semibold bg-gray-700 text-gray-100 px-2 py-1 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
              />
            ) : (
              <h3
                onClick={() => setIsEditingTitle(true)}
                className={`text-xl font-semibold cursor-pointer hover:text-orange-400 transition-colors ${
                  progress === 100 ? 'line-through text-gray-500 opacity-75' : 'text-gray-100'
                }`}
              >
                {task.task_name}
              </h3>
            )}
          </div>

          {/* Badges Row: Area, Phase/Task Type, Money Maker */}
          <div className="flex items-center gap-2 mb-4">
            {/* Badge 1: Business/Area */}
            <span className={`px-3 py-1.5 text-sm font-medium text-white rounded ${colorClass}`}>
              {sourceName}
            </span>

            {/* Badge 2: Phase or Task Type */}
            {task.phases ? (
              <span className="px-3 py-1.5 text-sm font-medium bg-blue-900/30 text-blue-400 rounded border border-blue-500/50">
                {task.phases.name}
              </span>
            ) : task.task_type ? (
              <span className="px-3 py-1.5 text-sm font-medium bg-gray-700 text-gray-300 rounded">
                {task.task_type}
              </span>
            ) : null}

            {/* Badge 3: Money Maker / Effort Level */}
            {task.effort_level && (
              <span className={`px-3 py-1.5 text-sm font-medium rounded border ${
                task.effort_level.includes('MoneyMaker') || task.effort_level.includes('Money')
                  ? 'bg-green-900/30 text-green-400 border-green-500/50'
                  : 'bg-gray-700 text-gray-300 border-gray-600'
              }`}>
                {task.effort_level}
              </span>
            )}
          </div>

          {/* Automation/Delegation Row */}
          <div className="flex items-center gap-3 mb-3">
            <label className="text-sm text-gray-400">Automation:</label>
            <select
              value={task.automation || ''}
              onChange={(e) => handleUpdate({ automation: e.target.value as Automation })}
              className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded border border-gray-600 hover:border-gray-500 focus:border-orange-500 focus:outline-none cursor-pointer"
            >
              <option value="">None</option>
              <option value="Automate">Automate</option>
              <option value="Delegate">Delegate</option>
              <option value="Manual">Manual</option>
            </select>

            {/* Hours Projected */}
            <label className="text-sm text-gray-400 ml-4">Hours Projected:</label>
            <input
              type="number"
              value={task.hours_projected || ''}
              onChange={(e) => handleUpdate({ hours_projected: e.target.value ? parseFloat(e.target.value) : null })}
              placeholder="0"
              step="0.25"
              className="w-20 px-2 py-1 text-sm bg-gray-700 text-gray-300 rounded border border-gray-600 hover:border-gray-500 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Right Section: Description */}
        <div className="w-80 flex-shrink-0">
          <label className="text-xs text-gray-400 block mb-1">Description</label>
          {isEditingDescription ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleDescriptionSave}
              onKeyDown={handleDescriptionKeyDown}
              autoFocus
              rows={6}
              placeholder="Add description..."
              className="w-full text-sm bg-gray-700 text-gray-300 px-3 py-2 rounded border border-gray-600 focus:border-orange-500 focus:outline-none resize-none"
            />
          ) : (
            <div
              onClick={() => setIsEditingDescription(true)}
              className={`w-full min-h-[144px] text-sm cursor-pointer hover:bg-gray-700/50 transition-colors px-3 py-2 rounded border border-gray-600 ${
                task.description ? 'text-gray-300' : 'text-gray-500 italic'
              }`}
            >
              {task.description || 'Click to add description...'}
            </div>
          )}
        </div>
      </div>

      {/* Date/Time Picker Modal */}
      {showDateTimePicker && (
        <DateTimePicker
          scheduledDate={task.scheduled_date}
          scheduledTime={task.scheduled_time}
          onSchedule={handleScheduleChange}
          onClose={() => setShowDateTimePicker(false)}
        />
      )}

      {/* Time Tracking Modal */}
      {showTimeTrackingModal && (
        <TimeTrackingModal
          taskName={task.task_name}
          onSave={handleTimeTrackingSave}
          onClose={() => setShowTimeTrackingModal(false)}
        />
      )}
    </div>
  );
};
