import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUpdateTask } from '../../hooks/useTasks';
import { useProjects, usePhases } from '../../hooks/useProjects';
import { ProgressSlider } from '../shared/ProgressSlider';
import { DateTimePicker } from '../tasks/DateTimePicker';
import type { TaskHub, TaskStatus, Automation, EffortLevel, Priority } from '../../types/task';
import { parseLocalDate } from '@/utils/dateHelpers';

interface EditTaskModalProps {
  task: TaskHub;
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
}

export const EditTaskModal: FC<EditTaskModalProps> = ({ task, isOpen, onClose, businessId }) => {
  const [taskName, setTaskName] = useState(task.task_name);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [effortLevel, setEffortLevel] = useState<EffortLevel | null>(task.effort_level);
  const [automation, setAutomation] = useState<Automation | null>(task.automation);
  const [hoursWorked, setHoursWorked] = useState<number | null>(task.hours_worked);
  const [hoursProjected, setHoursProjected] = useState<number | null>(task.hours_projected);
  const [progress, setProgress] = useState(task.progress_percentage ?? 0);
  const [selectedProjectId, setSelectedProjectId] = useState(task.project_id || 'no-project');
  const [selectedPhaseId, setSelectedPhaseId] = useState(task.phase_id || 'no-phase');
  const [dueDate, setDueDate] = useState<string | null>(task.due_date);
  const [showProgressSlider, setShowProgressSlider] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const updateTask = useUpdateTask();
  const { data: allProjects } = useProjects(businessId);
  const { data: projectPhases } = usePhases(selectedProjectId || undefined);

  // Update local state when task prop changes
  useEffect(() => {
    setTaskName(task.task_name);
    setDescription(task.description || '');
    setPriority(task.priority);
    setEffortLevel(task.effort_level);
    setAutomation(task.automation);
    setHoursWorked(task.hours_worked);
    setHoursProjected(task.hours_projected);
    setProgress(task.progress_percentage ?? 0);
    setSelectedProjectId(task.project_id || 'no-project');
    setSelectedPhaseId(task.phase_id || 'no-phase');
    setDueDate(task.due_date);
  }, [task]);

  const handleSave = async () => {
    try {
      let newStatus: TaskStatus = task.status;
      if (progress === 0) {
        newStatus = 'Not started';
      } else if (progress === 100) {
        newStatus = 'Done';
      } else if (progress > 0 && progress < 100) {
        newStatus = 'In progress';
      }

      await updateTask.mutateAsync({
        id: task.id,
        updates: {
          task_name: taskName.trim(),
          description: description.trim() || null,
          priority,
          effort_level: effortLevel,
          automation,
          hours_worked: hoursWorked,
          hours_projected: hoursProjected,
          progress_percentage: progress,
          status: newStatus,
          project_id: selectedProjectId === 'no-project' ? null : selectedProjectId,
          phase_id: selectedPhaseId === 'no-phase' ? null : selectedPhaseId,
          due_date: dueDate,
          completed_at: progress === 100 && task.progress_percentage !== 100 ? new Date().toISOString() : undefined,
        },
      });
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    setShowProgressSlider(false);
  };

  const handleDateChange = (date: string | null, _time: string | null) => {
    if (!date) {
      setDueDate(null);
      setShowDatePicker(false);
      return;
    }

    // Parse the YYYY-MM-DD string and create date at noon local time
    const [year, month, day] = date.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0, 0);

    // Convert to ISO string for storage
    setDueDate(localDate.toISOString());
    setShowDatePicker(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-100 flex items-center justify-between">
            Edit Task
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Name */}
          <div>
            <label className="text-sm font-semibold text-gray-200 block mb-2">Task Name</label>
            <Input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>

          {/* Two-column layout for metadata */}
          <div className="grid grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Project</label>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setSelectedPhaseId('no-phase');
                }}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue placeholder="No Project Identified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-project">No Project Identified</SelectItem>
                  {allProjects?.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phase */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Phase</label>
              <Select
                value={selectedPhaseId || 'no-phase'}
                onValueChange={setSelectedPhaseId}
                disabled={!selectedProjectId || selectedProjectId === 'no-project'}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue placeholder="No Phase Identified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-phase">No Phase Identified</SelectItem>
                  {projectPhases?.map((ph) => (
                    <SelectItem key={ph.id} value={ph.id}>
                      {ph.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Priority</label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Money Maker */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Money Maker</label>
              <Select
                value={effortLevel || 'none'}
                onValueChange={(value) => setEffortLevel(value === 'none' ? null : (value as EffortLevel))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
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

            {/* Automation */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Automation</label>
              <Select
                value={automation || 'none'}
                onValueChange={(value) => setAutomation(value === 'none' ? null : (value as Automation))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
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

            {/* Due Date */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Due Date</label>
              <Button
                variant="outline"
                onClick={() => setShowDatePicker(true)}
                className="w-full justify-start bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
              >
                {dueDate ? format(parseLocalDate(dueDate) || new Date(), 'MMM d, yyyy') : 'Set due date'}
              </Button>
            </div>

            {/* Hours Worked */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Hours Worked</label>
              <Input
                type="number"
                value={hoursWorked || ''}
                onChange={(e) => setHoursWorked(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                step="0.25"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            {/* Hours Projected */}
            <div>
              <label className="text-sm font-semibold text-gray-200 block mb-2">Hours Projected</label>
              <Input
                type="number"
                value={hoursProjected || ''}
                onChange={(e) => setHoursProjected(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0.00"
                step="0.25"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          {/* Progress */}
          <div>
            <label className="text-sm font-semibold text-gray-200 block mb-2">Progress: {progress}%</label>
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowProgressSlider(!showProgressSlider)}
                className="w-full bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-700"
              >
                Update Progress
              </Button>
              {showProgressSlider && (
                <div className="absolute top-full left-0 mt-2 z-20">
                  <ProgressSlider
                    progress={progress}
                    onChange={handleProgressChange}
                    onClose={() => setShowProgressSlider(false)}
                    onTimeTrack={(hours) => setHoursWorked(hours)}
                    hoursWorked={hoursWorked}
                  />
                </div>
              )}
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-300 rounded-full bg-green-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-gray-200 block mb-2">Description / Notes</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="Add notes, thoughts, or details..."
              className="bg-gray-800 border-gray-700 text-gray-100 resize-none"
            />
          </div>

          {/* Metadata footer */}
          <div className="border-t border-gray-700 pt-4 space-y-2">
            <div className="text-xs text-gray-400">
              <span className="font-semibold">Created:</span>{' '}
              {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy · h:mm a') : 'Unknown'}
            </div>
            {task.completed_at && (
              <div className="text-xs text-gray-400">
                <span className="font-semibold">Completed:</span>{' '}
                {format(new Date(task.completed_at), 'MMM d, yyyy · h:mm a')}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-700 pt-4">
          <Button variant="outline" onClick={onClose} className="border-gray-700 text-gray-300 hover:bg-gray-800">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
            Save Changes
          </Button>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            scheduledDate={dueDate}
            scheduledTime={null}
            onSchedule={handleDateChange}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
