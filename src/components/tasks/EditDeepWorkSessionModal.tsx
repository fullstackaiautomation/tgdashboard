import type { FC } from 'react';
import { useState, useEffect } from 'react';
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
import { useUpdateDeepWorkSession, useDeleteDeepWorkSession, type DeepWorkLog } from '../../hooks/useDeepWorkSessions';
import { useTasks } from '../../hooks/useTasks';
import type { Area } from '../../types/task';

interface EditDeepWorkSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DeepWorkLog;
}

const AREAS: Area[] = ['Personal', 'Full Stack', 'Huge Capital', '808', 'S4', 'Golf', 'Health'];

export const EditDeepWorkSessionModal: FC<EditDeepWorkSessionModalProps> = ({ isOpen, onClose, session }) => {
  const [area, setArea] = useState<Area>(session.area as Area);
  const [taskId, setTaskId] = useState<string>(session.task_id || 'no-task');
  const [taskType, setTaskType] = useState<string>(session.task_type || '');

  // Helper function to convert UTC Date to local datetime-local string
  const toLocalDateTimeString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert ISO strings to datetime-local format (YYYY-MM-DDTHH:mm) in LOCAL time
  const [startDate, setStartDate] = useState<string>(
    toLocalDateTimeString(new Date(session.start_time))
  );
  const [endDate, setEndDate] = useState<string>(
    session.end_time ? toLocalDateTimeString(new Date(session.end_time)) : ''
  );

  const updateSession = useUpdateDeepWorkSession();
  const deleteSession = useDeleteDeepWorkSession();
  const { data: allTasks = [] } = useTasks();

  // Update local state when session prop changes
  useEffect(() => {
    setArea(session.area as Area);
    setTaskId(session.task_id || 'no-task');
    setTaskType(session.task_type || '');
    setStartDate(toLocalDateTimeString(new Date(session.start_time)));
    setEndDate(session.end_time ? toLocalDateTimeString(new Date(session.end_time)) : '');
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!area) {
      alert('Area is required');
      return;
    }

    try {
      const startTime = new Date(startDate).toISOString();
      const endTime = endDate ? new Date(endDate).toISOString() : null;
      const durationMinutes = endTime
        ? Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000)
        : null;

      await updateSession.mutateAsync({
        id: session.id,
        updates: {
          area,
          task_id: taskId === 'no-task' ? null : taskId,
          task_type: taskType || null,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
        },
      });

      onClose();
    } catch (error) {
      console.error('Failed to update deep work session:', error);
      alert('Failed to update session. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    try {
      await deleteSession.mutateAsync(session.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete deep work session:', error);
      alert('Failed to delete session. Please try again.');
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
            <DialogTitle className="text-xl font-bold">Edit Deep Work Session</DialogTitle>
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
              End Date & Time
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-orange-500"
            />
          </div>

          {/* Duration Preview */}
          {endDate && (
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
              <div className="text-sm text-gray-400">Duration Preview:</div>
              <div className="text-lg font-bold text-orange-400">
                {Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 60000)} minutes
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={deleteSession.isPending}
              className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
            >
              {deleteSession.isPending ? 'Deleting...' : 'Delete'}
            </Button>
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
              disabled={updateSession.isPending}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updateSession.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
