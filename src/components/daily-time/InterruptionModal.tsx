import { type FC, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface InterruptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  sessionDuration: number;
}

const INTERRUPTION_REASONS = [
  { value: 'Meeting', label: 'Meeting', description: 'Scheduled or ad-hoc meeting' },
  { value: 'Phone Call', label: 'Phone Call', description: 'Incoming call or urgent communication' },
  { value: 'Urgent Request', label: 'Urgent Request', description: 'Someone needed immediate assistance' },
  { value: 'Personal', label: 'Personal', description: 'Personal matter or emergency' },
  { value: 'Technical Issue', label: 'Technical Issue', description: 'Software, hardware, or connectivity problem' },
  { value: 'Other', label: 'Other', description: 'Other interruption' },
];

export const InterruptionModal: FC<InterruptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  sessionDuration,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const reason = selectedReason === 'Other' && customReason ? customReason : selectedReason;
    if (reason) {
      onSubmit(reason);
      setSelectedReason('');
      setCustomReason('');
      onClose();
    }
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <h3 className="text-xl font-bold text-gray-900">Session Interrupted</h3>
              <p className="text-sm text-gray-600 mt-1">
                After {formatDuration(sessionDuration)}
              </p>
            </div>
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
          <p className="text-gray-700 mb-4 font-medium">
            Why was this session interrupted?
          </p>

          {/* Reason Selection */}
          <div className="space-y-2 mb-6">
            {INTERRUPTION_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full text-left px-4 py-3 border-2 rounded-lg transition-all ${
                  selectedReason === reason.value
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{reason.label}</div>
                    <div className="text-xs text-gray-500">{reason.description}</div>
                  </div>
                  {selectedReason === reason.value && (
                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Reason Input */}
          {selectedReason === 'Other' && (
            <div className="mb-6">
              <label htmlFor="custom-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Please specify
              </label>
              <input
                id="custom-reason"
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter interruption reason..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedReason || (selectedReason === 'Other' && !customReason)}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Mark as Interrupted
            </button>
          </div>

          {/* Info Message */}
          <p className="text-xs text-gray-500 mt-4 text-center">
            This helps identify patterns and improve your focus time
          </p>
        </div>
      </div>
    </div>
  );
};
