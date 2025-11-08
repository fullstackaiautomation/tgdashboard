/**
 * DeepWorkLogView - Log actual time spent throughout the day
 * Supports both productive work and non-productive activities
 */

import { type FC, useState } from 'react';
import { format, parseISO, startOfDay, endOfDay, addHours } from 'date-fns';
import { Plus, Clock, CheckCircle2, XCircle, Edit2, Trash2 } from 'lucide-react';
import { useDeepWorkSessions, useCreateDeepWorkSession, useDeleteDeepWorkSession } from '@/hooks/useDeepWork';
import type { Area } from '@/types/task';

interface DeepWorkLogViewProps {
  selectedDate: Date;
}

// Area colors
const AREA_COLORS: Record<Area, string> = {
  'Full Stack': '#10b981',
  'Huge Capital': '#a855f7',
  'S4': '#3b82f6',
  '808': '#eab308',
  'Personal': '#ec4899',
  'Golf': '#f97316',
  'Health': '#14b8a6',
};

export const DeepWorkLogView: FC<DeepWorkLogViewProps> = ({ selectedDate }) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Use 6AM-6AM day range (6AM today to 6AM tomorrow)
  const startTime = addHours(startOfDay(selectedDate), 6).toISOString();
  const endTime = addHours(startOfDay(selectedDate), 30).toISOString(); // 6AM next day

  const { data: sessions = [], isLoading } = useDeepWorkSessions(startTime, endTime);
  const createSession = useCreateDeepWorkSession();
  const deleteSession = useDeleteDeepWorkSession();

  // Calculate total actual time
  const totalActualMinutes = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
  const totalActualHours = (totalActualMinutes / 60).toFixed(1);

  const handleAddSession = () => {
    setShowAddForm(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (confirm('Delete this session?')) {
      await deleteSession.mutateAsync(sessionId);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-100">⏱️ Deep Work Log (Actual)</h2>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading sessions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100">⏱️ Deep Work Log (Actual)</h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-400">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} · {totalActualHours}h logged
          </div>
          <button
            onClick={handleAddSession}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Log Time
          </button>
        </div>
      </div>

      {showAddForm && (
        <AddSessionForm
          selectedDate={selectedDate}
          onCancel={() => setShowAddForm(false)}
          onCreate={() => setShowAddForm(false)}
        />
      )}

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Clock className="w-12 h-12 mb-3 opacity-50" />
          <p>No deep work sessions logged for this day</p>
          <p className="text-sm mt-1">Click "Log Time" to add what you actually worked on</p>
        </div>
      ) : (
        <div className="space-y-3 mt-4">
          {sessions.map((session) => {
            const color = session.area ? AREA_COLORS[session.area as Area] : '#6b7280';
            const isCompleted = session.status === 'completed';
            const isProductive = session.is_productive !== false; // default to true if not set

            return (
              <div
                key={session.id}
                className="border-2 border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
                style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                      {!isProductive && <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">Non-productive</span>}
                      <h3 className="font-semibold text-gray-100">
                        {(session as any).task_name || session.session_name || 'Unnamed session'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(session.start_time), 'h:mm a')}
                        {session.end_time && ` - ${format(parseISO(session.end_time), 'h:mm a')}`}
                      </span>
                      {session.duration_minutes && (
                        <>
                          <span>·</span>
                          <span>{session.duration_minutes} min</span>
                        </>
                      )}
                    </div>
                    {session.area && (
                      <div className="mt-2">
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: color }}
                        >
                          {session.area}
                        </span>
                      </div>
                    )}
                    {session.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">{session.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Add Session Form Component
interface AddSessionFormProps {
  selectedDate: Date;
  onCancel: () => void;
  onCreate: () => void;
}

const AddSessionForm: FC<AddSessionFormProps> = ({ selectedDate, onCancel, onCreate }) => {
  const [sessionName, setSessionName] = useState('');
  const [area, setArea] = useState<Area | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isProductive, setIsProductive] = useState(true);

  const createSession = useCreateDeepWorkSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionName || !startTime || !endTime) {
      alert('Please fill in session name, start time, and end time');
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startDateTime = parseISO(`${dateStr}T${startTime}:00`).toISOString();
    const endDateTime = parseISO(`${dateStr}T${endTime}:00`).toISOString();

    try {
      await createSession.mutateAsync({
        session_name: sessionName,
        area: area || undefined,
        start_time: startDateTime,
        end_time: endDateTime,
        notes: notes || undefined,
        is_productive: isProductive,
        status: 'completed',
      });
      onCreate();
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Failed to create session');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-4 mb-4 border-2 border-blue-500">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">Log Time Session</h3>

      <div className="space-y-3">
        {/* Productive toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isProductive}
              onChange={(e) => setIsProductive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Productive work</span>
          </label>
        </div>

        {/* Session name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            What did you work on? *
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="e.g., Built dashboard feature, Watched TV, etc."
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Area (only if productive) */}
        {isProductive && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Area (optional)
            </label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value as Area | '')}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select Area --</option>
              <option value="Full Stack">Full Stack</option>
              <option value="Huge Capital">Huge Capital</option>
              <option value="S4">S4</option>
              <option value="808">808</option>
              <option value="Personal">Personal</option>
              <option value="Golf">Golf</option>
              <option value="Health">Health</option>
            </select>
          </div>
        )}

        {/* Time range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Start Time *
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              End Time *
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional details..."
            rows={2}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={createSession.isPending}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {createSession.isPending ? 'Creating...' : 'Log Session'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
