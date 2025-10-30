import { useState, useRef } from 'react';
import type { FC } from 'react';
import { X, GripVertical } from 'lucide-react';
import type { TaskHub } from '../../types/task';

interface ResizableTaskBlockProps {
  task: TaskHub;
  startTime: string;
  endTime: string;
  onResize: (taskId: string, newStartTime: string, newEndTime: string) => void;
  onRemove: (taskId: string) => void;
  backgroundColor: string;
}

/**
 * Calculate height in pixels based on duration
 * Each 30-min slot = 40px height
 */
const calculateHeight = (startTime: string, endTime: string): number => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const durationMinutes = endMinutes - startMinutes;

  // 40px per 30 minutes
  return (durationMinutes / 30) * 40;
};

/**
 * Round time to nearest 30-minute interval
 */
const roundToNearestSlot = (minutes: number): number => {
  return Math.round(minutes / 30) * 30;
};

/**
 * Convert minutes to HH:MM format
 */
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

export const ResizableTaskBlock: FC<ResizableTaskBlockProps> = ({
  task,
  startTime,
  endTime,
  onResize,
  onRemove,
  backgroundColor,
}) => {
  const [_isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [tempStartTime, setTempStartTime] = useState(startTime);
  const [tempEndTime, setTempEndTime] = useState(endTime);
  const blockRef = useRef<HTMLDivElement>(null);

  const height = calculateHeight(tempStartTime, tempEndTime);

  const handleMouseDown = (edge: 'top' | 'bottom') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(edge);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!blockRef.current) return;

      const rect = blockRef.current.getBoundingClientRect();
      const relativeY = moveEvent.clientY - rect.top;

      // Convert pixels to minutes (40px = 30min)
      const deltaMinutes = (relativeY / 40) * 30;

      if (edge === 'top') {
        // Resize from top
        const [h, m] = startTime.split(':').map(Number);
        const originalStartMinutes = h * 60 + m;
        const newStartMinutes = roundToNearestSlot(originalStartMinutes + deltaMinutes);

        const [endH, endM] = tempEndTime.split(':').map(Number);
        const endMinutes = endH * 60 + endM;

        // Don't let start go past end
        if (newStartMinutes < endMinutes - 30) {
          setTempStartTime(minutesToTime(Math.max(0, newStartMinutes)));
        }
      } else {
        // Resize from bottom
        const [h, m] = endTime.split(':').map(Number);
        const originalEndMinutes = h * 60 + m;
        const newEndMinutes = roundToNearestSlot(originalEndMinutes + deltaMinutes);

        const [startH, startM] = tempStartTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;

        // Don't let end go before start
        if (newEndMinutes > startMinutes + 30) {
          setTempEndTime(minutesToTime(Math.min(1440, newEndMinutes)));
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
      onResize(task.id, tempStartTime, tempEndTime);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={blockRef}
      className="absolute left-0 right-0 rounded-md overflow-hidden group/block"
      style={{
        backgroundColor,
        height: `${height}px`,
        minHeight: '40px',
      }}
    >
      {/* Top resize handle */}
      <div
        onMouseDown={handleMouseDown('top')}
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover/block:opacity-100 hover:bg-white/20 transition-opacity flex items-center justify-center"
      >
        <GripVertical className="w-4 h-4 text-white/60" />
      </div>

      {/* Task content */}
      <div className="px-3 py-2 h-full flex items-center justify-between">
        <span className="text-white text-sm font-medium truncate flex-1">
          {task.task_name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(task.id);
          }}
          className="opacity-0 group-hover/block:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded text-red-300 hover:text-red-200 ml-2"
          title="Remove from schedule"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Bottom resize handle */}
      <div
        onMouseDown={handleMouseDown('bottom')}
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover/block:opacity-100 hover:bg-white/20 transition-opacity flex items-center justify-center"
      >
        <GripVertical className="w-4 h-4 text-white/60" />
      </div>
    </div>
  );
};
