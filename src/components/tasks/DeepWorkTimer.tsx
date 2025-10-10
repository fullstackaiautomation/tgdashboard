import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
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

const PRESET_DURATIONS = [
  { label: '25 min', seconds: 1500 },
  { label: '45 min', seconds: 2700 },
  { label: '90 min', seconds: 5400 },
  { label: '2 hrs', seconds: 7200 },
];

/**
 * DeepWorkTimer - Modern Pomodoro-style timer for focused work sessions
 */
export const DeepWorkTimer: FC<DeepWorkTimerProps> = ({ tasks, className = '' }) => {
  const [seconds, setSeconds] = useState(0);
  const [targetSeconds, setTargetSeconds] = useState(1500); // Default 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [selectedFocusArea, setSelectedFocusArea] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const intervalRef = useRef<number | null>(null);

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

  const handlePresetClick = (presetSeconds: number) => {
    if (!isRunning) {
      setTargetSeconds(presetSeconds);
      setSeconds(0);
    }
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

  // Calculate progress percentage
  const progressPercentage = targetSeconds > 0 ? (seconds / targetSeconds) * 100 : 0;

  return (
    <Card className={`bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border-yellow-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 ${className}`}>
      {/* Header */}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Timer className="w-6 h-6 text-yellow-400" />
          Deep Work Session
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-3">
          <div className="text-6xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {formatTime(seconds)}
          </div>
          <div className="text-sm text-gray-400">
            Target: {formatTime(targetSeconds)}
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Preset Duration Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_DURATIONS.map((preset) => (
            <Button
              key={preset.seconds}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset.seconds)}
              disabled={isRunning}
              className={`${
                targetSeconds === preset.seconds
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400'
                  : 'border-gray-600 text-gray-300 hover:border-yellow-500/50'
              }`}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Task Selection */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Task</label>
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search or select a task..."
            disabled={isRunning}
            className="bg-gray-900/50 border-gray-600 focus:border-yellow-500"
          />
          {searchQuery && filteredTasks.length > 0 && (
            <div className="max-h-40 overflow-y-auto bg-gray-900/80 rounded-lg border border-gray-600 divide-y divide-gray-700">
              {filteredTasks.slice(0, 5).map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    setSelectedTask(task.id);
                    setSearchQuery(task.task_name);
                  }}
                  disabled={isRunning}
                  className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-yellow-500/10 transition-colors disabled:opacity-50"
                >
                  {task.task_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Focus Area Selection */}
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Focus Area</label>
          <Select
            value={selectedFocusArea}
            onValueChange={setSelectedFocusArea}
            disabled={isRunning}
          >
            <SelectTrigger className="bg-gray-900/50 border-gray-600 focus:border-yellow-500">
              <SelectValue placeholder="Select focus area" />
            </SelectTrigger>
            <SelectContent>
              {FOCUS_AREAS.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 pt-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white shadow-lg"
              size="lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Session
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white shadow-lg"
              size="lg"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
