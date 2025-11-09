import type { FC, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useCreateTask } from '../../hooks/useTasks';
import { useBusinesses } from '../../hooks/useBusinesses';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { DateTimePicker } from './DateTimePicker';
import { parseLocalDate } from '../../utils/dateHelpers';
import { generateRecurringTaskWithChildren, getCurrentWeekSunday } from '../../utils/recurringTaskGenerator';
import type {
  CreateTaskDTO,
  TaskStatus,
  Priority,
  Area,
  Automation,
  EffortLevel,
  RecurringType
} from '../../types/task';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultBusinessId?: string;
  defaultProjectId?: string;
  defaultPhaseId?: string;
}

/**
 * AddTaskModal - Modal for creating new tasks in Tasks Hub
 * Supports both standalone tasks and tasks linked to businesses/projects/phases
 */
export const AddTaskModal: FC<AddTaskModalProps> = ({ isOpen, onClose, onSuccess, defaultBusinessId, defaultProjectId, defaultPhaseId }) => {
  // Task type toggle
  const [taskType, setTaskType] = useState<'single' | 'recurring'>('single');

  // Common fields (both single and recurring)
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [effortLevel, setEffortLevel] = useState<EffortLevel>('8) Vibing (8');
  const [automation, setAutomation] = useState<Automation>('Manual');
  const [hoursProjected, setHoursProjected] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>(defaultBusinessId || '');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(defaultProjectId || '');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(defaultPhaseId || '');

  // Single task specific fields
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Recurring task specific fields
  const [recurringType, setRecurringType] = useState<'weekdays' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [recurringDayOfWeek, setRecurringDayOfWeek] = useState<number>(1); // 0-6 (Sunday-Saturday), default Monday
  const [recurringMonthlyDay, setRecurringMonthlyDay] = useState<number>(15); // 1-31, default 15th

  const createTask = useCreateTask();
  const { data: businesses } = useBusinesses();
  const { data: projects } = useProjects(selectedBusinessId || undefined);
  const { data: phasesData } = usePhases(selectedProjectId || '');
  const phases = phasesData || [];

  // Reset project/phase when business changes
  useEffect(() => {
    setSelectedProjectId('');
    setSelectedPhaseId('');
  }, [selectedBusinessId]);

  // Reset phase when project changes
  useEffect(() => {
    setSelectedPhaseId('');
  }, [selectedProjectId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    try {
      const baseName = taskName.trim();
      const templateTask: CreateTaskDTO = {
        task_name: baseName,
        description: description.trim() || undefined,
        status: 'Not started',
        priority: 'Medium',
        effort_level: effortLevel || undefined,
        automation: automation || undefined,
        hours_projected: hoursProjected ? parseFloat(hoursProjected) : 0,
        business_id: selectedBusinessId || undefined,
        project_id: selectedProjectId || undefined,
        phase_id: selectedPhaseId || undefined,
      };

      if (taskType === 'recurring') {
        // Create recurring task with parent template and child instances
        const today = new Date();
        const weekSunday = getCurrentWeekSunday(today);

        const { parentTask, childTasks } = generateRecurringTaskWithChildren({
          baseName,
          recurringType,
          startDate: weekSunday,
          taskTemplate: templateTask,
          dayOfWeek: recurringDayOfWeek,
          monthlyDayOfMonth: recurringType === 'monthly' ? recurringMonthlyDay : undefined,
        });

        // Step 1: Create parent template task first
        const parentResult = await createTask.mutateAsync(parentTask);
        const parentId = parentResult?.id;

        // Step 2: Create child instances, linking them to parent
        if (parentId) {
          for (const childTask of childTasks) {
            childTask.recurring_parent_id = parentId;
            await createTask.mutateAsync(childTask);
          }
        } else {
          // Fallback: if parent creation doesn't return ID, still create children
          for (const childTask of childTasks) {
            await createTask.mutateAsync(childTask);
          }
        }
      } else {
        // Create single task with due date
        let dueDateISO: string | undefined = undefined;
        if (dueDate) {
          const parsedDate = parseLocalDate(dueDate);
          if (parsedDate) {
            dueDateISO = parsedDate.toISOString();
          }
        }

        const singleTask: CreateTaskDTO = {
          ...templateTask,
          due_date: dueDateISO,
        };

        await createTask.mutateAsync(singleTask);
      }

      // Reset form
      setTaskName('');
      setDescription('');
      setDueDate('');
      setEffortLevel('8) Vibing (8');
      setAutomation('Manual');
      setHoursProjected('');
      setSelectedBusinessId('');
      setSelectedProjectId('');
      setSelectedPhaseId('');
      setTaskType('single');
      setRecurringType('weekly');
      setRecurringDayOfWeek(1);
      setRecurringMonthlyDay(15);

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-100">Add New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setTaskType('single')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                taskType === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
              }`}
            >
              Single Task
            </button>
            <button
              type="button"
              onClick={() => setTaskType('recurring')}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                taskType === 'recurring'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
              }`}
            >
              Recurring Task
            </button>
          </div>

          {/* Task Name */}
          <div>
            <label htmlFor="task_name" className="block text-sm font-medium text-gray-300 mb-1">
              Task Name *
            </label>
            <input
              type="text"
              id="task_name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description"
            />
          </div>

          {/* Business/Project/Phase Linking */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="business" className="block text-sm font-medium text-gray-300 mb-1">
                Area
              </label>
              <select
                id="business"
                value={selectedBusinessId}
                onChange={(e) => setSelectedBusinessId(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {businesses?.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="project" className="block text-sm font-medium text-gray-300 mb-1">
                Project
              </label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={!selectedBusinessId}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">None</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phase" className="block text-sm font-medium text-gray-300 mb-1">
                Phase
              </label>
              <select
                id="phase"
                value={selectedPhaseId}
                onChange={(e) => setSelectedPhaseId(e.target.value)}
                disabled={!selectedProjectId}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">None</option>
                {phases.map((phase: any) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.sequence_order}. {phase.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Effort Level, Automation, Hours Projected - Always shown on one line */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label htmlFor="effort_level" className="block text-sm font-medium text-gray-300 mb-1">
                Effort Level
              </label>
              <select
                id="effort_level"
                value={effortLevel}
                onChange={(e) => setEffortLevel(e.target.value as EffortLevel)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="$$$ Printer $$$" style={{ color: '#22c55e' }}>$$$ Printer $$$</option>
                <option value="$ Makes Money $" style={{ color: '#84cc16' }}>$ Makes Money $</option>
                <option value="-$ Save Dat $-" style={{ color: '#f97316' }}>-$ Save Dat $-</option>
                <option value=":( No Money ):" style={{ color: '#ef4444' }}>:( No Money ):</option>
                <option value="8) Vibing (8" style={{ color: '#a855f7' }}>8) Vibing (8</option>
              </select>
            </div>

            <div>
              <label htmlFor="automation" className="block text-sm font-medium text-gray-300 mb-1">
                Automation
              </label>
              <select
                id="automation"
                value={automation}
                onChange={(e) => setAutomation(e.target.value as Automation)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                <option value="Automate" style={{ color: '#a855f7' }}>🤖 Automate</option>
                <option value="Delegate" style={{ color: '#8b5cf6' }}>👥 Delegate</option>
                <option value="Manual" style={{ color: '#f59e0b' }}>✋ Manual</option>
              </select>
            </div>

            <div>
              <label htmlFor="hours_projected" className="block text-sm font-medium text-gray-300 mb-1">
                Hours Projected
              </label>
              <input
                type="number"
                id="hours_projected"
                value={hoursProjected}
                onChange={(e) => setHoursProjected(e.target.value)}
                min="0"
                step="0.5"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Single Task: Due Date */}
          {taskType === 'single' && (
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-1">
                Due Date
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(true)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
              >
                {dueDate || 'Select date...'}
              </button>
              {showDatePicker && (
                <DateTimePicker
                  scheduledDate={dueDate}
                  onSchedule={(date, _time) => {
                    setDueDate(date || '');
                    setShowDatePicker(false);
                  }}
                  onClose={() => setShowDatePicker(false)}
                />
              )}
            </div>
          )}

          {/* Recurring Task: Frequency & Day Selection */}
          {taskType === 'recurring' && (
            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Frequency
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecurringType('weekdays')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringType === 'weekdays'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Weekdays
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringType('weekly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringType === 'weekly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringType('biweekly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringType === 'biweekly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Bi-Weekly
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecurringType('monthly')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      recurringType === 'monthly'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Day of Week Picker for Weekly/Bi-Weekly */}
              {(recurringType === 'weekly' || recurringType === 'biweekly') && (
                <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Day of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setRecurringDayOfWeek(index)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          recurringDayOfWeek === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Day of Month Input for Monthly */}
              {recurringType === 'monthly' && (
                <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <label htmlFor="recurring_monthly_day" className="block text-sm font-medium text-gray-300 mb-2">
                    Day of Month
                  </label>
                  <input
                    type="number"
                    id="recurring_monthly_day"
                    value={recurringMonthlyDay}
                    onChange={(e) => setRecurringMonthlyDay(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="31"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
