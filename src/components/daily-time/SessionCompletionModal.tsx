import { type FC, useState } from 'react';
import { CheckCircle2, MinusCircle, XCircle, X } from 'lucide-react';

interface SessionCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (goalAchieved: boolean | null, notes?: string) => void;
  sessionDuration: number;
  area?: string;
}

export const SessionCompletionModal: FC<SessionCompletionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sessionDuration,
  area,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedOption, setSelectedOption] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (goalAchieved: boolean | null) => {
    setSelectedOption(goalAchieved);
    onSubmit(goalAchieved, notes || undefined);
    setNotes('');
    setSelectedOption(null);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Session Complete</h3>
            <p className="text-sm text-gray-600 mt-1">
              {formatDuration(sessionDuration)} session{area ? ` on ${area}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6 text-center font-medium">
            Did you accomplish your goal for this session?
          </p>

          {/* Goal Achievement Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => handleSubmit(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <CheckCircle2 className="w-12 h-12 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-gray-900">Yes</span>
              <span className="text-xs text-gray-500 mt-1">Goal achieved</span>
            </button>

            <button
              onClick={() => handleSubmit(null)}
              className="flex flex-col items-center justify-center p-6 border-2 border-yellow-200 rounded-lg hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
            >
              <MinusCircle className="w-12 h-12 text-yellow-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-gray-900">Partial</span>
              <span className="text-xs text-gray-500 mt-1">Made progress</span>
            </button>

            <button
              onClick={() => handleSubmit(false)}
              className="flex flex-col items-center justify-center p-6 border-2 border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all group"
            >
              <XCircle className="w-12 h-12 text-red-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-gray-900">No</span>
              <span className="text-xs text-gray-500 mt-1">Did not achieve</span>
            </button>
          </div>

          {/* Optional Notes */}
          <div className="mb-4">
            <label htmlFor="session-notes" className="block text-sm font-medium text-gray-700 mb-2">
              Session Notes (optional)
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this session..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Skip Button */}
          <button
            onClick={() => handleSubmit(null)}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};
