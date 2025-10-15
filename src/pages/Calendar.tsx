/**
 * Calendar - Master Calendar Page
 *
 * Comprehensive calendar system for task scheduling and time management
 *
 * Features:
 * - Master calendar with weekly view
 * - Task scheduler for unscheduled tasks
 * - Time block details modal
 * - Schedule analytics
 */

import { type FC, useState } from 'react';
import { format, parseISO, subMonths, addMinutes } from 'date-fns';
import { X, CheckCircle, PlayCircle, XCircle, Edit2, Trash2 } from 'lucide-react';
import { DndContext, DragOverlay, type DragEndEvent } from '@dnd-kit/core';
import { MasterCalendar } from '@/components/calendar/MasterCalendar';
import { TaskScheduler } from '@/components/calendar/TaskScheduler';
import {
  useTaskSchedulingAnalytics,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
  useCompleteTimeBlock,
  useStartTimeBlock,
  useCancelTimeBlock,
  useCreateTimeBlock,
} from '@/hooks/useCalendar';
import type { CalendarViewBlock } from '@/types/calendar';
import type { Area } from '@/types/task';

// Area colors (matching App.tsx)
const AREA_COLORS: Record<Area, string> = {
  'Full Stack': '#10b981',  // green
  'Huge Capital': '#a855f7', // purple
  'S4': '#3b82f6',          // blue
  '808': '#eab308',         // yellow
  'Personal': '#ec4899',     // pink
  'Golf': '#f97316',         // orange
  'Health': '#14b8a6',       // teal
};

export const Calendar: FC = () => {
  const [selectedBlock, setSelectedBlock] = useState<CalendarViewBlock | null>(null);
  const [actualDuration, setActualDuration] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const updateTimeBlock = useUpdateTimeBlock();
  const deleteTimeBlock = useDeleteTimeBlock();
  const completeTimeBlock = useCompleteTimeBlock();
  const startTimeBlock = useStartTimeBlock();
  const cancelTimeBlock = useCancelTimeBlock();
  const createTimeBlock = useCreateTimeBlock();

  // Analytics for last 3 months
  const { data: analytics = [] } = useTaskSchedulingAnalytics(
    subMonths(new Date(), 3),
    new Date()
  );

  const handleBlockClick = (block: CalendarViewBlock) => {
    setSelectedBlock(block);
    setActualDuration(
      block.actual_duration_minutes
        ? Math.round(block.actual_duration_minutes).toString()
        : ''
    );
  };

  const handleCloseModal = () => {
    setSelectedBlock(null);
    setActualDuration('');
  };

  const handleStartBlock = async () => {
    if (!selectedBlock) return;
    try {
      await startTimeBlock.mutateAsync(selectedBlock.block_id);
      alert('✓ Time block started!');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to start block:', error);
      alert('Failed to start time block.');
    }
  };

  const handleCompleteBlock = async () => {
    if (!selectedBlock) return;
    const duration = parseInt(actualDuration) || selectedBlock.planned_duration_minutes;

    try {
      await completeTimeBlock.mutateAsync({
        blockId: selectedBlock.block_id,
        actualDurationMinutes: duration,
      });
      alert('✓ Time block completed!');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to complete block:', error);
      alert('Failed to complete time block.');
    }
  };

  const handleCancelBlock = async () => {
    if (!selectedBlock) return;
    if (!confirm('Cancel this time block?')) return;

    try {
      await cancelTimeBlock.mutateAsync(selectedBlock.block_id);
      alert('✓ Time block cancelled');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to cancel block:', error);
      alert('Failed to cancel time block.');
    }
  };

  const handleDeleteBlock = async () => {
    if (!selectedBlock) return;
    if (!confirm('Permanently delete this time block?')) return;

    try {
      await deleteTimeBlock.mutateAsync(selectedBlock.block_id);
      alert('✓ Time block deleted');
      handleCloseModal();
    } catch (error) {
      console.error('Failed to delete block:', error);
      alert('Failed to delete time block.');
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // Parse drop target data: "calendar-slot-DATE-TIME"
    const dropData = over.id.toString();
    if (!dropData.startsWith('calendar-slot-')) return;

    // Extract date and time from drop target
    const parts = dropData.replace('calendar-slot-', '').split('-');
    if (parts.length < 4) return;

    const date = `${parts[0]}-${parts[1]}-${parts[2]}`; // YYYY-MM-DD
    const hour = parseInt(parts[3]);

    // Parse task data from active item: "task-TASKID"
    const taskData = active.id.toString();
    if (!taskData.startsWith('task-')) return;

    const taskId = taskData.replace('task-', '');

    // Parse task info from data attributes
    const taskInfo = active.data.current;
    if (!taskInfo) return;

    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const durationMinutes = taskInfo.hours_remaining > 0
      ? Math.min(taskInfo.hours_remaining * 60, 120)
      : 60;

    try {
      await createTimeBlock.mutateAsync({
        taskId,
        scheduledDate: parseISO(date),
        startTime: `${startTime}:00`,
        endTime: `${format(
          addMinutes(parseISO(`${date}T${startTime}`), durationMinutes),
          'HH:mm:ss'
        )}`,
        plannedDurationMinutes: durationMinutes,
      });
      alert(`✓ Task scheduled to ${format(parseISO(date), 'MMM d')} at ${startTime}`);
    } catch (error) {
      console.error('Failed to schedule task:', error);
      alert('Failed to schedule task. Please try again.');
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-100">Calendar & Scheduling</h1>
          <p className="text-gray-400 mt-2">
            Master calendar showing scheduled tasks and time blocks. Click tasks on the right to schedule them!
          </p>
        </div>

      {/* Analytics Summary */}
      {analytics.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-100 mb-4">
            Scheduling Analytics (Last 3 Months)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.slice(0, 7).map((stat) => (
              <div key={stat.area} className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: AREA_COLORS[stat.area] }}
                  />
                  <span className="text-sm font-semibold text-gray-300">{stat.area}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Blocks:</span>
                    <span className="text-gray-100">{stat.total_blocks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Planned:</span>
                    <span className="text-gray-100">{stat.total_planned_hours}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Completion:</span>
                    <span
                      className={
                        stat.completion_rate >= 70
                          ? 'text-green-400'
                          : stat.completion_rate >= 50
                          ? 'text-yellow-400'
                          : 'text-red-400'
                      }
                    >
                      {stat.completion_rate}%
                    </span>
                  </div>
                  {stat.avg_accuracy && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Accuracy:</span>
                      <span className="text-gray-100">{stat.avg_accuracy}%</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Layout: Calendar + Scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master Calendar (2/3 width) */}
        <div className="lg:col-span-2">
          <MasterCalendar onBlockClick={handleBlockClick} />
        </div>

        {/* Task Scheduler (1/3 width) */}
        <div>
          <TaskScheduler onScheduleComplete={() => {}} />
        </div>
      </div>

      {/* Time Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseModal}
          />
          <div className="relative bg-gray-900 rounded-lg shadow-2xl max-w-lg w-full mx-4 border-2 border-gray-700">
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-gray-700">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: AREA_COLORS[selectedBlock.area] }}
                  />
                  <h3 className="text-xl font-bold text-gray-100">
                    {selectedBlock.task_name}
                  </h3>
                </div>
                <p className="text-sm text-gray-400">{selectedBlock.area}</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Time Info */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Date</div>
                    <div className="text-gray-100">
                      {format(parseISO(selectedBlock.scheduled_date), 'MMM d, yyyy')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Time</div>
                    <div className="text-gray-100">
                      {format(parseISO(`2000-01-01T${selectedBlock.start_time}`), 'h:mm a')} -{' '}
                      {format(parseISO(`2000-01-01T${selectedBlock.end_time}`), 'h:mm a')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Planned Duration</div>
                    <div className="text-gray-100">
                      {Math.round(selectedBlock.planned_duration_minutes)} minutes
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div
                      className={`inline-block px-2 py-1 rounded text-xs ${
                        selectedBlock.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : selectedBlock.status === 'in_progress'
                          ? 'bg-blue-500/20 text-blue-400'
                          : selectedBlock.status === 'cancelled'
                          ? 'bg-gray-500/20 text-gray-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {selectedBlock.status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actual Duration Input (if completing) */}
              {selectedBlock.status !== 'completed' && selectedBlock.status !== 'cancelled' && (
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Actual Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={actualDuration}
                    onChange={(e) => setActualDuration(e.target.value)}
                    placeholder={selectedBlock.planned_duration_minutes.toString()}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                  />
                </div>
              )}

              {/* Notes */}
              {selectedBlock.notes && (
                <div>
                  <div className="text-sm text-gray-400 mb-2">Notes</div>
                  <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
                    {selectedBlock.notes}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-gray-700">
                {selectedBlock.status === 'scheduled' && (
                  <button
                    onClick={handleStartBlock}
                    disabled={startTimeBlock.isPending}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <PlayCircle className="w-4 h-4" />
                    Start Time Block
                  </button>
                )}

                {(selectedBlock.status === 'scheduled' ||
                  selectedBlock.status === 'in_progress') && (
                  <>
                    <button
                      onClick={handleCompleteBlock}
                      disabled={completeTimeBlock.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </button>

                    <button
                      onClick={handleCancelBlock}
                      disabled={cancelTimeBlock.isPending}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Block
                    </button>
                  </>
                )}

                <button
                  onClick={handleDeleteBlock}
                  disabled={deleteTimeBlock.isPending}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Block
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </DndContext>
  );
};
