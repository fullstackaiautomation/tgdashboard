import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { differenceInMinutes, parse, format } from 'date-fns';
import { X, CalendarIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTaskTimeLogs, useCreateTimeLog, useUpdateTimeLog, useDeleteTimeLog } from '../../hooks/useTaskTimeLogs';
import { useUpdateTask } from '../../hooks/useTasks';
import { formatDateString, getTodayNoon, parseLocalDate } from '@/utils/dateHelpers';

interface TaskTimeLogProps {
  taskId: string;
  hoursProjected?: number;
  hoursWorked?: number;
  onDelete?: () => void;
  deleteClickCount?: number;
}

interface LogRow {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

// Convert 24-hour time to 12-hour format with AM/PM
const formatTime12Hour = (time24: string): string => {
  if (!time24) return '';
  const [hourStr, minuteStr] = time24.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;

  if (hour === 0) {
    return `12:${minute} AM`;
  } else if (hour < 12) {
    return `${hour}:${minute} AM`;
  } else if (hour === 12) {
    return `12:${minute} PM`;
  } else {
    return `${hour - 12}:${minute} PM`;
  }
};

// Generate time options starting at 8:00 AM in 15-minute increments
const generateTimeOptions = (): string[] => {
  const times: string[] = [];

  // Start at 8:00 AM (08:00) and go through midnight
  for (let hour = 8; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }

  // Then midnight through 7:45 AM
  for (let hour = 0; hour < 8; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeStr);
    }
  }

  return times;
};

const TIME_OPTIONS = generateTimeOptions();

export const TaskTimeLog: FC<TaskTimeLogProps> = ({ taskId, hoursProjected = 0, hoursWorked = 0, onDelete, deleteClickCount = 0 }) => {
  const { data: timeLogs = [] } = useTaskTimeLogs(taskId);
  const createTimeLog = useCreateTimeLog();
  const updateTimeLog = useUpdateTimeLog();
  const deleteTimeLog = useDeleteTimeLog();
  const updateTask = useUpdateTask();

  // Initialize 4 empty rows
  const [rows, setRows] = useState<LogRow[]>([
    { date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' },
    { date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' },
    { date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' },
    { date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' },
  ]);

  // Calculate hours from start/end times
  const calculateHours = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;

    try {
      // Normalize times to HH:mm format (strip seconds if present)
      const normalizeTime = (time: string) => {
        const parts = time.split(':');
        return `${parts[0]}:${parts[1]}`;
      };

      const normalizedStart = normalizeTime(startTime);
      const normalizedEnd = normalizeTime(endTime);

      const start = parse(normalizedStart, 'HH:mm', new Date());
      const end = parse(normalizedEnd, 'HH:mm', new Date());
      const minutes = differenceInMinutes(end, start);
      return minutes > 0 ? minutes / 60 : 0;
    } catch (error) {
      console.error('Error calculating hours:', { startTime, endTime, error });
      return 0;
    }
  };

  // Calculate total hours from all rows
  const totalHours = rows.reduce((sum, row) => {
    return sum + calculateHours(row.startTime, row.endTime);
  }, 0);

  // Calculate total from saved logs
  const savedTotalHours = timeLogs.reduce((sum, log) => sum + log.hours_worked, 0);

  // Handle row update
  const handleRowChange = (index: number, field: keyof LogRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  // Handle row delete
  const handleDeleteRow = async (index: number) => {
    const row = rows[index];

    if (row.id) {
      // Delete from database
      try {
        await deleteTimeLog.mutateAsync({ id: row.id, taskId });
      } catch (error) {
        console.error('Failed to delete time log:', error);
        alert('Failed to delete time log');
        return;
      }
    }

    // Remove from UI
    const newRows = [...rows];
    newRows.splice(index, 1);
    // Add a new empty row at the end
    newRows.push({ date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' });
    setRows(newRows);
  };

  // Handle save all
  const handleSaveAll = async () => {
    try {
      const updatedRows: LogRow[] = [];

      for (const row of rows) {
        // Skip empty rows
        if (!row.startTime || !row.endTime) {
          // Keep empty rows as is
          updatedRows.push(row);
          continue;
        }

        const hours = calculateHours(row.startTime, row.endTime);
        if (hours <= 0) {
          updatedRows.push(row);
          continue;
        }

        if (row.id) {
          // Update existing
          const result = await updateTimeLog.mutateAsync({
            id: row.id,
            taskId,
            updates: {
              log_date: row.date,
              hours_worked: hours,
              start_time: row.startTime,
              end_time: row.endTime,
              notes: row.notes.trim() || null,
            },
          });
          updatedRows.push({
            id: result.id,
            date: result.log_date,
            startTime: result.start_time || '',
            endTime: result.end_time || '',
            notes: result.notes || '',
          });
        } else {
          // Create new
          const result = await createTimeLog.mutateAsync({
            taskId,
            logDate: row.date,
            hoursWorked: hours,
            startTime: row.startTime,
            endTime: row.endTime,
            notes: row.notes.trim() || undefined,
          });
          updatedRows.push({
            id: result.id,
            date: result.log_date,
            startTime: result.start_time || '',
            endTime: result.end_time || '',
            notes: result.notes || '',
          });
        }
      }

      // Update rows with saved data (now including IDs)
      setRows(updatedRows);

      // Calculate total hours from all rows (including newly saved ones)
      // We need to recalculate from the actual saved data, not the old timeLogs array
      const newTotalHours = updatedRows.reduce((sum, row) => {
        return sum + calculateHours(row.startTime, row.endTime);
      }, 0);

      await updateTask.mutateAsync({
        id: taskId,
        updates: { hours_worked: newTotalHours }
      });

      alert('Time logs saved successfully!');
    } catch (error) {
      console.error('Failed to save time logs:', error);
      alert('Failed to save time logs');
    }
  };

  // Load saved logs into rows (only first 4), sorted by date ascending
  const loadSavedLogs = () => {
    // Sort logs by date in ascending order (oldest first)
    const sortedLogs = [...timeLogs].sort((a, b) => {
      const dateA = new Date(a.log_date).getTime();
      const dateB = new Date(b.log_date).getTime();
      return dateA - dateB;
    });

    const logsToLoad = sortedLogs.slice(0, 4);
    const newRows = logsToLoad.map((log) => ({
      id: log.id,
      date: log.log_date,
      startTime: log.start_time || '',
      endTime: log.end_time || '',
      notes: log.notes || '',
    }));

    // Fill remaining rows with empty entries
    while (newRows.length < 4) {
      newRows.push({ date: formatDateString(getTodayNoon()), startTime: '', endTime: '', notes: '' });
    }

    setRows(newRows);
  };

  // Automatically load saved logs when component mounts or timeLogs changes
  useEffect(() => {
    if (timeLogs.length > 0) {
      loadSavedLogs();
    }
  }, [timeLogs.length]); // Only re-run when the number of logs changes

  // Check if there are unsaved changes
  const hasUnsavedChanges = rows.some(row => {
    // Check if row has data but no ID (new entry)
    if ((row.startTime || row.endTime || row.notes.trim()) && !row.id) {
      return true;
    }
    // Check if row with ID has been modified
    if (row.id) {
      const savedLog = timeLogs.find(log => log.id === row.id);
      if (savedLog) {
        return (
          row.date !== savedLog.log_date ||
          row.startTime !== (savedLog.start_time || '') ||
          row.endTime !== (savedLog.end_time || '') ||
          row.notes !== (savedLog.notes || '')
        );
      }
    }
    return false;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-gray-200 uppercase tracking-wide">
          Time Tracking Log
        </label>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-[100px_95px_95px_80px_1fr_30px] gap-2 mb-2 text-xs font-semibold text-gray-300 uppercase tracking-wide">
        <div>Date</div>
        <div>Start</div>
        <div>End</div>
        <div className="text-center">Hours</div>
        <div>Notes</div>
        <div></div>
      </div>

      {/* Data Rows */}
      <div className="space-y-2 mb-4">
        {rows.map((row, index) => {
          const hours = calculateHours(row.startTime, row.endTime);
          const dateObj = parseLocalDate(row.date);

          // Debug logging
          if (row.startTime && row.endTime) {
            console.log(`Row ${index}:`, {
              startTime: row.startTime,
              endTime: row.endTime,
              calculatedHours: hours
            });
          }

          return (
            <div key={row.id || `row-${index}`} className="grid grid-cols-[100px_95px_95px_80px_1fr_30px] gap-2 items-center">
              {/* Date Button with Calendar Popup */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 justify-start text-xs text-white bg-gray-800/50 border-gray-700/50 hover:bg-gray-700/50"
                  >
                    <CalendarIcon className="w-3 h-3 mr-1 text-white" />
                    {dateObj ? format(dateObj, 'M/d/yy') : 'Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateObj}
                    onSelect={(date) => {
                      if (date) {
                        // Normalize to midnight local time
                        const localDate = new Date(
                          date.getFullYear(),
                          date.getMonth(),
                          date.getDate(),
                          0, 0, 0, 0
                        );
                        const formattedDate = formatDateString(localDate);
                        handleRowChange(index, 'date', formattedDate);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Start Time Dropdown */}
              <Select
                value={row.startTime}
                onValueChange={(value) => handleRowChange(index, 'startTime', value)}
              >
                <SelectTrigger className="h-8 text-xs text-white bg-gray-800/50 border-gray-700/50">
                  <SelectValue placeholder="Start">
                    {row.startTime ? formatTime12Hour(row.startTime) : 'Start'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time} className="text-xs">
                      {formatTime12Hour(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* End Time Dropdown */}
              <Select
                value={row.endTime}
                onValueChange={(value) => handleRowChange(index, 'endTime', value)}
              >
                <SelectTrigger className="h-8 text-xs text-white bg-gray-800/50 border-gray-700/50">
                  <SelectValue placeholder="End">
                    {row.endTime ? formatTime12Hour(row.endTime) : 'End'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {TIME_OPTIONS.map((time) => (
                    <SelectItem key={time} value={time} className="text-xs">
                      {formatTime12Hour(time)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-8 flex items-center justify-center text-sm font-semibold text-green-400">
                {hours > 0 ? hours.toFixed(2) : '—'}
              </div>
              <Input
                type="text"
                value={row.notes}
                onChange={(e) => handleRowChange(index, 'notes', e.target.value)}
                placeholder="Notes..."
                className="h-8 text-xs text-white bg-gray-800/50 border-gray-700/50 placeholder:text-gray-400"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteRow(index)}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Save Button */}
      <div className="mb-4">
        <Button
          onClick={handleSaveAll}
          disabled={totalHours === 0}
          className={`w-full h-9 text-sm text-white font-medium transition-colors ${
            hasUnsavedChanges
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          Save Time Logs
        </Button>
      </div>

      {/* Summary Row with Delete Button */}
      <div className="border-t border-gray-700/30 pt-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700/30">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hours Worked</div>
              <div className="text-xl font-bold text-green-400">{savedTotalHours.toFixed(2)}h</div>
            </div>
            <div className="bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700/30">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hours Projected</div>
              <div className="text-xl font-bold text-purple-400">{hoursProjected.toFixed(2)}h</div>
            </div>
            <div className="bg-gray-800/50 px-4 py-3 rounded-lg border border-gray-700/30">
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hours Remaining</div>
              <div className={`text-xl font-bold ${hoursProjected - savedTotalHours > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {(hoursProjected - savedTotalHours).toFixed(2)}h
              </div>
            </div>
          </div>
          {onDelete && (
            <div className="bg-gray-200 rounded-lg shadow-lg border border-gray-300 p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className={`w-8 h-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all ${
                  deleteClickCount === 1 ? 'bg-red-300 animate-pulse' : 'hover:bg-gray-300'
                }`}
                title={deleteClickCount === 1 ? 'Click again to confirm' : 'Delete task'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
