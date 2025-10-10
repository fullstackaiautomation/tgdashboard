import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { TaskHub } from '../../types/task';

interface DeepWorkPanelProps {
  tasks: TaskHub[];
  className?: string;
}

const PRESET_DURATIONS = [
  { label: '25m', seconds: 1500 },
  { label: '45m', seconds: 2700 },
  { label: '90m', seconds: 5400 },
  { label: '2h', seconds: 7200 },
];

/**
 * DeepWorkPanel - Compact, always-visible timer in top-right
 */
export const DeepWorkPanel: FC<DeepWorkPanelProps> = ({ tasks, className = '' }) => {
  const [seconds, setSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(1500); // Default 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= targetSeconds) {
            setIsRunning(false);
            // Optional: Play sound or notification
            return targetSeconds;
          }
          return prev + 1;
        });
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
  }, [isRunning, targetSeconds]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTaskDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStart = () => {
    if (!selectedTask) {
      alert('Please select a task first');
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

  const handlePresetClick = (presetSeconds: number) => {
    if (!isRunning) {
      setTargetSeconds(presetSeconds);
      setSeconds(0);
    }
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg p-3 shadow-xl ${className}`}>
      {/* Header with Timer Icon and Time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400 tabular-nums">
            {formatTime(seconds)}
          </span>
        </div>
        <span className="text-xs text-gray-400">
          / {formatTime(targetSeconds)}
        </span>
      </div>

      {/* Preset Duration Buttons */}
      <div className="flex gap-1 mb-2">
        {PRESET_DURATIONS.map((preset) => (
          <button
            key={preset.seconds}
            onClick={() => handlePresetClick(preset.seconds)}
            disabled={isRunning}
            className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
              targetSeconds === preset.seconds
                ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-400'
                : 'bg-gray-700 border border-gray-600 text-gray-300 hover:border-yellow-500/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Task Search */}
      <div className="relative mb-2" ref={dropdownRef}>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowTaskDropdown(true);
          }}
          onFocus={() => setShowTaskDropdown(true)}
          placeholder="Search task..."
          disabled={isRunning}
          className="h-8 text-xs bg-gray-900/50 border-gray-600 focus:border-yellow-500"
        />
        {showTaskDropdown && searchQuery && filteredTasks.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-gray-900 rounded-lg border border-gray-600 divide-y divide-gray-700 z-50 shadow-xl">
            {filteredTasks.slice(0, 5).map((task) => (
              <button
                key={task.id}
                onClick={() => {
                  setSelectedTask(task.id);
                  setSearchQuery(task.task_name);
                  setShowTaskDropdown(false);
                }}
                disabled={isRunning}
                className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
              >
                {task.task_name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            size="sm"
            className="flex-1 h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            size="sm"
            className="flex-1 h-8 bg-yellow-600 hover:bg-yellow-700 text-white text-xs"
          >
            <Pause className="w-3 h-3 mr-1" />
            Pause
          </Button>
        )}
        <Button
          onClick={handleReset}
          size="sm"
          variant="outline"
          className="h-8 px-2 border-gray-600 text-gray-300 hover:bg-gray-700"
          title="Reset timer"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
