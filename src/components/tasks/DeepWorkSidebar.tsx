import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Save, Trash2, Clock } from 'lucide-react';
import { useCreateDeepWorkSession, useCompleteDeepWorkSession } from '../../hooks/useDeepWorkSessions';

interface Task {
  id: string
  task_name: string
  area?: string
  status?: string
  task_type?: string
  businesses?: { slug: string }
  life_areas?: { category: string }
}

interface DeepWorkSidebarProps {
  tasks: Task[];
}

/**
 * DeepWorkSidebar - Collapsible timer in the left sidebar
 */
export const DeepWorkSidebar: FC<DeepWorkSidebarProps> = ({ tasks }) => {
  const [seconds, setSeconds] = useState(0);
  const [_targetSeconds, _setTargetSeconds] = useState(1500); // Default 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskDropdown, setShowTaskDropdown] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [_sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [totalPausedSeconds, setTotalPausedSeconds] = useState(0);
  const [pauseStartTime, setPauseStartTime] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createSession = useCreateDeepWorkSession();
  const completeSession = useCompleteDeepWorkSession();

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= _targetSeconds) {
            setIsRunning(false);
            return _targetSeconds;
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
  }, [isRunning, _targetSeconds]);

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

  const handleStart = async () => {
    if (!selectedTask) {
      alert('Please select a task first');
      return;
    }

    // Find the selected task to get business/life_area info
    const task = tasks.find(t => t.id === selectedTask);
    if (!task) {
      alert('Task not found');
      return;
    }

    try {
      const startTime = new Date().toISOString();

      console.log('Starting session for task:', {
        task_id: selectedTask,
        task_name: task.task_name,
        area: task.area,
        task_type: task.task_type
      });

      const session = await createSession.mutateAsync({
        task_id: selectedTask,
        area: task.area || 'Personal',
        task_type: task.task_type || null,
        start_time: startTime,
      });

      setActiveSessionId(session.id);
      setSessionStartTime(startTime);
      setIsRunning(true);
    } catch (error: any) {
      console.error('Error starting deep work session:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      alert(`Failed to start session: ${error?.message || 'Unknown error'}`);
    }
  };

  const handlePause = () => {
    if (isRunning && !pauseStartTime) {
      // Start pause
      setPauseStartTime(new Date().toISOString());
    }
    setIsRunning(false);
  };

  const handleResume = () => {
    // Calculate accumulated pause time
    if (pauseStartTime) {
      const pauseEnd = new Date();
      const pauseStart = new Date(pauseStartTime);
      const pauseDuration = Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / 1000);
      setTotalPausedSeconds(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }
    setIsRunning(true);
  };

  const handleSave = async () => {
    if (!activeSessionId) {
      alert('No active session to save');
      return;
    }

    try {
      // Calculate active work time (total seconds minus paused time)
      let finalPausedSeconds = totalPausedSeconds;
      if (pauseStartTime) {
        const pauseEnd = new Date();
        const pauseStart = new Date(pauseStartTime);
        finalPausedSeconds += Math.floor((pauseEnd.getTime() - pauseStart.getTime()) / 1000);
      }

      // Complete the session (end_time is set automatically)
      await completeSession.mutateAsync(activeSessionId);

      // Reset state
      setIsRunning(false);
      setSeconds(0);
      setSearchQuery('');
      setSelectedTask('');
      setActiveSessionId(null);
      setSessionStartTime(null);
      setTotalPausedSeconds(0);
      setPauseStartTime(null);
    } catch (error) {
      console.error('Error saving deep work session:', error);
      alert('Failed to save session. Please try again.');
    }
  };

  const handleDelete = () => {
    // Just reset everything without saving
    setIsRunning(false);
    setSeconds(0);
    setSearchQuery('');
    setSelectedTask('');
    setActiveSessionId(null);
    setSessionStartTime(null);
    setTotalPausedSeconds(0);
    setPauseStartTime(null);
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Get color for business/area
  const getTaskColor = (task: Task): string => {
    if (task.businesses) {
      const slug = task.businesses.slug;
      if (slug === 'full-stack' || slug === 'fullstack') return '#10b981'; // green
      if (slug === 'huge-capital') return '#a855f7'; // purple
      if (slug === 's4') return '#3b82f6'; // blue
      if (slug === '808') return '#eab308'; // yellow
    }
    if (task.life_areas) {
      const category = task.life_areas.category.toLowerCase();
      if (category === 'health') return '#14b8a6'; // teal
      if (category === 'personal') return '#ec4899'; // pink
      if (category === 'golf') return '#f97316'; // orange
    }
    if (task.area) {
      if (task.area === 'Full Stack') return '#10b981';
      if (task.area === 'Huge Capital') return '#a855f7';
      if (task.area === 'S4') return '#3b82f6';
      if (task.area === '808') return '#eab308';
      if (task.area === 'Health') return '#14b8a6';
      if (task.area === 'Personal') return '#ec4899';
      if (task.area === 'Golf') return '#f97316';
    }
    return '#9ca3af'; // gray default
  };

  // Filter tasks by search query
  const filteredTasks = tasks.filter((task) =>
    task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      padding: '12px',
      backgroundColor: '#0a0a0a',
      borderRadius: '8px',
      border: '1px solid #2a2a2a'
    }}>
      {/* Timer Display */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <Clock size={28} style={{ color: '#eab308' }} />
        <span style={{ fontSize: '28px', fontWeight: '700', color: '#eab308', letterSpacing: '1px' }}>
          {formatTime(seconds)}
        </span>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Task Search */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowTaskDropdown(true);
              }}
              onFocus={() => setShowTaskDropdown(true)}
              placeholder="Search task..."
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                border: '1px solid #374151',
                backgroundColor: '#1f2937',
                color: '#e5e7eb',
                outline: 'none'
              }}
            />
            {showTaskDropdown && searchQuery && filteredTasks.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                maxHeight: '120px',
                overflowY: 'auto',
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '4px',
                zIndex: 50
              }}>
                {filteredTasks.slice(0, 5).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => {
                      setSelectedTask(task.id);
                      setSearchQuery(task.task_name);
                      setShowTaskDropdown(false);
                    }}
                    disabled={isRunning}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: '11px',
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      color: getTaskColor(task),
                      border: 'none',
                      borderBottom: '1px solid #374151',
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#374151')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {task.task_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {!isRunning ? (
              <button
                onClick={activeSessionId ? handleResume : handleStart}
                style={{
                  flex: 1,
                  padding: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Play size={14} />
                {activeSessionId ? 'Resume' : 'Start'}
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Save size={16} />
                </button>
                <button
                  onClick={handlePause}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#eab308',
                    color: '#000',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pause size={16} />
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>
    </div>
  );
};
