import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import type { TaskHub } from '../../types/task';

interface DeepWorkTimerProps {
  tasks: TaskHub[];
  className?: string;
}

const FOCUS_AREAS = [
  { id: 'full-stack', label: 'Full Stack' },
  { id: 'huge-capital', label: 'Huge Capital' },
  { id: 's4', label: 'S4' },
  { id: '808', label: '808' },
  { id: 'health', label: 'Health' },
  { id: 'personal', label: 'Personal' },
  { id: 'golf', label: 'Golf' },
];

/**
 * DeepWorkTimer - Pomodoro-style timer for focused work sessions
 */
export const DeepWorkTimer: FC<DeepWorkTimerProps> = ({ tasks, className = '' }) => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const intervalRef = useRef<number | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleStart = () => {
    if (!selectedTask && !selectedFocusArea) {
      alert('Please select a task or focus area first');
      return;
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
      {/* Header */}
      <h2 className="text-lg font-bold text-yellow-400 text-center mb-4">
        Deep Work Session
      </h2>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-yellow-400 mb-2">
          {formatTime(seconds)}
        </div>
      </div>

      {/* Task Selection */}
      <div className="mb-4">
        <label className="text-xs text-gray-400 font-medium block mb-2">Task</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tasks..."
          className="w-full px-3 py-2 text-sm bg-gray-900 text-gray-200 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none mb-2"
          disabled={isRunning}
        />
        {searchQuery && filteredTasks.length > 0 && (
          <div className="max-h-40 overflow-y-auto bg-gray-900 rounded border border-gray-600">
            {filteredTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedTask(task.id);
                  setSearchQuery(task.task_name);
                }}
                disabled={isRunning}
                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {task.task_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Focus Area Selection */}
      <div className="mb-6">
        <label className="text-xs text-gray-400 font-medium block mb-2">Focus Area</label>
        <select
          value={selectedFocusArea}
          onChange={(e) => setSelectedFocusArea(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 text-sm bg-gray-900 text-gray-200 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none disabled:opacity-50"
        >
          <option value="">Select focus area</option>
          {FOCUS_AREAS.map((area) => (
            <option key={area.id} value={area.id}>
              {area.label}
            </option>
          ))}
        </select>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Play className="w-5 h-5" />
            Start Session
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium"
          >
            <Pause className="w-5 h-5" />
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          title="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
