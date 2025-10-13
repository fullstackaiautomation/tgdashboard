import type { FC } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateDeepWorkSession, useUpdateDeepWorkSession } from '../../hooks/useDeepWorkSessions';
import { useTasks } from '../../hooks/useTasks';
import type { Area } from '../../types/task';

interface AddDeepWorkSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AREAS: Area[] = ['Personal', 'Full Stack', 'Huge Capital', '808', 'S4', 'Golf', 'Health'];

export const AddDeepWorkSessionModal: FC<AddDeepWorkSessionModalProps> = ({ isOpen, onClose }) => {
  const [area, setArea] = useState<Area>('Personal');
  const [taskId, setTaskId] = useState<string>('no-task');
  const [taskType, setTaskType] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm format
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16) // 1 hour from now
  );

  const createSession = useCreateDeepWorkSession();
  const updateSession = useUpdateDeepWorkSession();
  const { data: allTasks = [] } = useTasks();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!area) {
      alert('Area is required');
      return;
    }

    try {
      const startTime = new Date(startDate).toISOString();
      const endTime = new Date(endDate).toISOString();
      const durationMinutes = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000);

      // First create the session with start_time
      const newSession = await createSession.mutateAsync({
        area,
        task_id: taskId === 'no-task' ? null : taskId,
        task_type: taskType || null,
        start_time: startTime,
      });

      // Then update it with end_time and duration using the hook
      await updateSession.mutateAsync({
        id: newSession.id,
        updates: {
          end_time: endTime,
          duration_minutes: durationMinutes,
        },
      });

      // Reset form
      setArea('Personal');
      setTaskId('no-task');
      setTaskType('');
      setStartDate(new Date().toISOString().slice(0, 16));
      setEndDate(new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16));

      onClose();
    } catch (error) {
      console.error('Failed to create deep work session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  // Filter tasks by selected area
  const areaTasks = allTasks.filter((task) => {
    if (task.area === area) return true;
    if (task.businesses?.slug === area) return true;
    if (task.life_areas?.name === area) return true;
    return false;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Add Deep Work Session</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Area Select */}
          <div className="space-y-2">
            <Label htmlFor="area" className="text-sm font-medium text-gray-200">
              Area *
            </Label>
            <Select value={area} onValueChange={(value) => setArea(value as Area)}>
              <SelectTrigger
                id="area"
                className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
              >
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {AREAS.map((a) => (
                  <SelectItem key={a} value={a} className="text-white hover:bg-gray-800">
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Select */}
          <div className="space-y-2">
            <Label htmlFor="task" className="text-sm font-medium text-gray-200">
              Task (Optional)
            </Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger
                id="task"
                className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
              >
                <SelectValue placeholder="Select task (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700 max-h-60">
                <SelectItem value="no-task" className="text-white hover:bg-gray-800">
                  No Task
                </SelectItem>
                {areaTasks.map((task) => (
                  <SelectItem key={task.id} value={task.id} className="text-white hover:bg-gray-800">
                    {task.task_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="taskType" className="text-sm font-medium text-gray-200">
              Task Type (Optional)
            </Label>
            <Input
              id="taskType"
              type="text"
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              placeholder="e.g., Planning, Development, Research"
              className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
            />
          </div>

          {/* Start Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium text-gray-200">
              Start Date & Time *
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
              required
            />
          </div>

          {/* End Date/Time */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium text-gray-200">
              End Date & Time *
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
              required
            />
          </div>

          {/* Duration Preview */}
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
            <div className="text-sm text-gray-400">Duration Preview:</div>
            <div className="text-lg font-bold text-orange-400">
              {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000)} minutes
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSession.isPending}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {createSession.isPending ? 'Adding...' : 'Add Session'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
