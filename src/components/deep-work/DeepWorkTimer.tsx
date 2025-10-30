/**
 * DeepWorkTimer Component
 * Story 4.1: Timer for tracking deep work sessions with business/area/project/task linking
 */

import { type FC, useState, useEffect } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import {
  useCreateDeepWorkSession,
  useCompleteDeepWorkSession,
  usePauseDeepWorkSession,
  useResumeDeepWorkSession,
  useCancelDeepWorkSession,
  useActiveDeepWorkSession,
} from '@/hooks/useDeepWorkSessions';
import { LabelSelector } from '@/components/shared/LabelSelector';

interface DeepWorkTimerProps {
  className?: string;
  onSessionComplete?: (sessionId: string, duration: number) => void;
}

/**
 * Deep Work Timer Component
 * - Start/pause/stop functionality
 * - Link to business/life area, project, phase, task
 * - Add labels and notes
 * - Real-time elapsed time display
 */
export const DeepWorkTimer: FC<DeepWorkTimerProps> = ({
  className = '',
  onSessionComplete,
}) => {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);

  // Form state for starting session
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedTaskType, setSelectedTaskType] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [sessionName, setSessionName] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Hooks
  const { data: activeSession } = useActiveDeepWorkSession();

  // Simple area options
  const AREA_OPTIONS = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];
  const TASK_TYPE_OPTIONS = ['$$$ Printer $$$', '$ Makes Money $', '-$ Save Dat $-', ':( No Money ):', '8) Vibing (8'];

  const createSession = useCreateDeepWorkSession();
  const completeSession = useCompleteDeepWorkSession();
  const pauseSession = usePauseDeepWorkSession();
  const resumeSession = useResumeDeepWorkSession();
  const cancelSession = useCancelDeepWorkSession();

  // Calculate elapsed time
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (activeSession && activeSession.status === 'active') {
      const startTime = new Date(activeSession.start_time).getTime();
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000) - (activeSession.paused_duration || 0);
        setElapsedSeconds(Math.max(0, elapsed));
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // Reset elapsed time if no active session
      setElapsedSeconds(0);
      return undefined;
    }
  }, [activeSession]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    if (!selectedArea) {
      alert('Please select an area');
      return;
    }

    try {
      await createSession.mutateAsync({
        area: selectedArea,
        task_type: selectedTaskType || null,
        task_id: selectedTaskId || undefined,
        session_name: sessionName || null,
        labels,
        notes: notes || null,
        start_time: new Date().toISOString(),
        is_planned: false,
      });

      // Reset form
      setIsStartModalOpen(false);
      setSessionName('');
      setLabels([]);
      setNotes('');
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start session');
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    try {
      await pauseSession.mutateAsync(activeSession.id);
    } catch (error) {
      console.error('Failed to pause session:', error);
    }
  };

  const handleResume = async () => {
    if (!activeSession) return;
    try {
      await resumeSession.mutateAsync(activeSession.id);
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    setIsStopModalOpen(true);
  };

  const handleConfirmStop = async () => {
    if (!activeSession) return;

    try {
      await completeSession.mutateAsync(activeSession.id);
      const durationMinutes = Math.floor(elapsedSeconds / 60);
      onSessionComplete?.(activeSession.id, durationMinutes);
      setIsStopModalOpen(false);
      setElapsedSeconds(0);
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to complete session');
    }
  };

  const handleCancel = async () => {
    if (!activeSession) return;
    if (confirm('Are you sure you want to cancel this session?')) {
      try {
        await cancelSession.mutateAsync(activeSession.id);
        setElapsedSeconds(0);
      } catch (error) {
        console.error('Failed to cancel session:', error);
      }
    }
  };

  if (!activeSession) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 border border-gray-700 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-100">Deep Work Timer</h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>

        {!isStartModalOpen ? (
          <button
            onClick={() => setIsStartModalOpen(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Deep Work Session
          </button>
        ) : (
          <div className="space-y-4">
            {/* Area selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Area *
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select area...</option>
                {AREA_OPTIONS.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Type selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Task Type (optional)
              </label>
              <select
                value={selectedTaskType}
                onChange={(e) => setSelectedTaskType(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">None</option>
                {TASK_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Session name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Session Name (optional)
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., API Integration Sprint"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg
                         text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500
                         focus:border-transparent"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Labels</label>
              <LabelSelector value={labels} onChange={setLabels} />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleStartSession}
                disabled={!selectedArea || createSession.isPending}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700
                         disabled:cursor-not-allowed text-white rounded-lg font-medium
                         transition-colors"
              >
                {createSession.isPending ? 'Starting...' : 'Start'}
              </button>
              <button
                onClick={() => setIsStartModalOpen(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg
                         font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Active session UI
  return (
    <div className={`bg-gray-800 rounded-lg p-6 border border-green-500/50 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Deep Work Timer</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm text-green-400">
            {activeSession.status === 'paused' ? 'Paused' : 'Active'}
          </span>
        </div>
      </div>

      {/* Timer display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-bold text-green-400 mb-2">{formatTime(elapsedSeconds)}</div>
        <div className="text-sm text-gray-400">
          {activeSession.area || 'Unallocated'}
          {activeSession.task_type && ` • ${activeSession.task_type}`}
        </div>
      </div>

      {/* Control buttons */}
      <div className="flex gap-3">
        {activeSession.status === 'active' ? (
          <button
            onClick={handlePause}
            disabled={pauseSession.isPending}
            className="flex-1 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg
                     font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" />
            Pause
          </button>
        ) : (
          <button
            onClick={handleResume}
            disabled={resumeSession.isPending}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Resume
          </button>
        )}
        <button
          onClick={handleStop}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg
                   font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Square className="w-4 h-4" />
          Stop
        </button>
      </div>

      {/* Stop confirmation modal */}
      {isStopModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Complete Session?</h3>
            <p className="text-gray-400 mb-2">
              Duration: <span className="text-gray-100 font-medium">{formatTime(elapsedSeconds)}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This will save the session as completed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmStop}
                disabled={completeSession.isPending}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg
                         font-medium transition-colors"
              >
                {completeSession.isPending ? 'Saving...' : 'Complete'}
              </button>
              <button
                onClick={() => setIsStopModalOpen(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg
                         font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
