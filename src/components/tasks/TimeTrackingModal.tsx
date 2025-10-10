import type { FC } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';

interface TimeTrackingModalProps {
  taskName: string;
  onSave: (hours: number) => void;
  onClose: () => void;
}

const QUICK_OPTIONS = [
  { label: '15 min', hours: 0.25 },
  { label: '30 min', hours: 0.5 },
  { label: '1 hour', hours: 1 },
  { label: '2 hours', hours: 2 },
];

/**
 * TimeTrackingModal - Appears when task reaches 100% to log time spent
 */
export const TimeTrackingModal: FC<TimeTrackingModalProps> = ({
  taskName,
  onSave,
  onClose,
}) => {
  const [customHours, setCustomHours] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleQuickSelect = (hours: number) => {
    setSelectedOption(hours);
    setCustomHours('');
  };

  const handleSave = () => {
    const hoursToSave = selectedOption !== null ? selectedOption : parseFloat(customHours);

    if (hoursToSave && hoursToSave > 0) {
      onSave(hoursToSave);
    } else {
      alert('Please select or enter a valid time');
    }
  };

  const handleSkip = () => {
    onSave(0); // Save with 0 hours (skip tracking)
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">Task Completed! 🎉</h3>
            <p className="text-sm text-gray-400 mt-1">How long did this take?</p>
            <p className="text-sm text-gray-500 mt-1 italic">{taskName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Options */}
        <div className="mb-4">
          <label className="text-sm text-gray-400 block mb-2">Quick Select</label>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_OPTIONS.map((option) => (
              <button
                key={option.hours}
                onClick={() => handleQuickSelect(option.hours)}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  selectedOption === option.hours
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input */}
        <div className="mb-6">
          <label className="text-sm text-gray-400 block mb-2">Or Enter Custom Hours</label>
          <input
            type="number"
            value={customHours}
            onChange={(e) => {
              setCustomHours(e.target.value);
              setSelectedOption(null);
            }}
            placeholder="Enter hours (e.g., 0.5, 1.5, 3)"
            step="0.25"
            min="0"
            className="w-full px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-orange-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-300 transition-colors"
          >
            Skip
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
            >
              Save Time
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
