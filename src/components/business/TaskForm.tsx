import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useCreateTask } from '../../hooks/useTasks';
import type { CreateTaskDTO } from '../../types/task';

interface TaskFormProps {
  businessId: string;
  projectId: string;
  phaseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TaskForm: FC<TaskFormProps> = ({
  businessId,
  projectId,
  phaseId,
  onSuccess,
  onCancel,
}) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<string>('Not started');

  const createTask = useCreateTask();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!taskName.trim()) {
      alert('Please enter a task name');
      return;
    }

    const newTask: CreateTaskDTO = {
      task_name: taskName.trim(),
      description: description.trim() || undefined,
      business_id: businessId,
      project_id: projectId,
      phase_id: phaseId,
      status,
      due_date: dueDate || undefined,
    };

    try {
      await createTask.mutateAsync(newTask);

      // Reset form
      setTaskName('');
      setDescription('');
      setDueDate('');
      setStatus('Not started');

      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating task:', error);

      // Check for unique constraint violation
      if (error?.code === '23505' || error?.message?.includes('duplicate key') || error?.message?.includes('unique constraint')) {
        alert(`A task named "${taskName.trim()}" already exists in this phase. Please choose a different name.`);
      } else {
        alert('Failed to create task. Please try again.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        />
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Not started">Not started</option>
            <option value="In progress">In progress</option>
            <option value="Done">Done</option>
          </select>
        </div>

        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-1">
            Due Date
          </label>
          <input
            type="date"
            id="due_date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={createTask.isPending}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createTask.isPending ? 'Creating...' : 'Create Task'}
        </button>
      </div>
    </form>
  );
};
