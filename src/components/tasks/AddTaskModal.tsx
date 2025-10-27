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
}

/**
 * AddTaskModal - Modal for creating new tasks in Tasks Hub
 * Supports both standalone tasks and tasks linked to businesses/projects/phases
 */
export const AddTaskModal: FC<AddTaskModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [effortLevel, setEffortLevel] = useState<EffortLevel>('8) JusVibin');
  const [automation, setAutomation] = useState<Automation>('Manual');
  const [hoursProjected, setHoursProjected] = useState('');

  // Recurring task fields
  const [recurringType, setRecurringType] = useState<'none' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly'>('none');
  const [isRecurring, setIsRecurring] = useState(false);

  // Business/Project/Phase linking
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('');

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
      // Convert date string to ISO timestamp at noon local time to avoid timezone shifts
      let dueDateISO: string | undefined = undefined;
      if (dueDate) {
        const parsedDate = parseLocalDate(dueDate);
        if (parsedDate) {
          dueDateISO = parsedDate.toISOString();
        }
      }

      if (isRecurring && recurringType !== 'none') {
        // Generate recurring tasks with parent template using the generator utility
        const baseName = taskName.trim();

        // Get the Sunday of the current week
        const today = new Date();
        const weekSunday = getCurrentWeekSunday(today);

        // Create template task for generator
        const templateTask: CreateTaskDTO = {
          task_name: baseName,
          description: description.trim() || undefined,
          status: 'Not started',
          priority: 'Medium',
          effort_level: effortLevel,
          automation,
          hours_projected: hoursProjected ? parseFloat(hoursProjected) : 0,
          business_id: selectedBusinessId || undefined,
          project_id: selectedProjectId || undefined,
          phase_id: selectedPhaseId || undefined,
        };

        // Generate parent template task and child instances
        const { parentTask, childTasks } = generateRecurringTaskWithChildren({
          baseName,
          recurringType: recurringType as 'weekdays' | 'weekly' | 'biweekly' | 'monthly',
          startDate: weekSunday,
          taskTemplate: templateTask,
        });

        // Step 1: Create parent template task first
        console.log('Creating parent task:', parentTask);
        const parentResult = await createTask.mutateAsync(parentTask);
        const parentId = parentResult?.id;
        console.log('Parent task created with ID:', parentId);

        // Step 2: Create child instances, linking them to parent
        if (parentId) {
          console.log('Creating', childTasks.length, 'child tasks for parent', parentId);
          for (const childTask of childTasks) {
            childTask.recurring_parent_id = parentId;
            console.log('Creating child task:', childTask);
            try {
              const childResult = await createTask.mutateAsync(childTask);
              console.log('Child task created:', childResult.task_name);
            } catch (error) {
              console.error('Error creating child task:', error);
              alert('Error creating child task: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
          }
          console.log('All child tasks created');
        } else {
          // Fallback: if parent creation doesn't return ID, still create children without parent link
          console.log('No parent ID returned! Creating children without parent link');
          for (const childTask of childTasks) {
            try {
              await createTask.mutateAsync(childTask);
            } catch (error) {
              console.error('Error creating fallback child task:', error);
            }
          }
        }
      } else {
        // Create regular (non-recurring) task
        const newTask: CreateTaskDTO = {
          task_name: taskName.trim(),
          description: description.trim() || undefined,
          status: 'Not started',
          priority: 'Medium',
          due_date: dueDateISO,
          effort_level: effortLevel,
          automation,
          hours_projected: hoursProjected ? parseFloat(hoursProjected) : 0,
          business_id: selectedBusinessId || undefined,
          project_id: selectedProjectId || undefined,
          phase_id: selectedPhaseId || undefined,
        };

        await createTask.mutateAsync(newTask);
      }

      // Reset form
      setTaskName('');
      setDescription('');
      setDueDate('');
      setEffortLevel('8) JusVibin');
      setAutomation('Manual');
      setHoursProjected('');
      setSelectedBusinessId('');
      setSelectedProjectId('');
      setSelectedPhaseId('');
      setIsRecurring(false);
      setRecurringType('none');

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
                Business
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
                    {phase.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date, Effort Level, Automation */}
          <div className="grid grid-cols-3 gap-4">
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
                <option value="$$$ MoneyMaker">$$$ MoneyMaker</option>
                <option value="$ Lil Money">$ Lil Money</option>
                <option value="$$ Some Money">$$ Some Money</option>
                <option value="$$$ Big Money">$$$ Big Money</option>
                <option value="$$$$ Huge Money">$$$$ Huge Money</option>
                <option value="-$ Save Dat Money">-$ Save Dat Money</option>
                <option value=":( Pointless">:( Pointless</option>
                <option value="8) JusVibin">8) JusVibin</option>
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
                <option value="Manual">Manual</option>
                <option value="Automate">Automate</option>
                <option value="Delegate">Delegate</option>
              </select>
            </div>
          </div>

          {/* Hours Projected & Recurring */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col justify-end">
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg h-10">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-6 h-6 cursor-pointer accent-blue-600"
                />
                <label htmlFor="is_recurring" className="text-sm font-medium text-gray-300 cursor-pointer">
                  Make recurring
                </label>
              </div>
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

          {/* Recurring Task Types */}
          {isRecurring && (
            <div className="border-t border-gray-700 pt-4">
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
                  Weekdays (M-F)
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

              {recurringType !== 'none' && (
                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> Task will be created with today's date in the name. Example: "{taskName || 'Task Name'} {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }).replace(/\//g, '/')}"
                  </p>
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
