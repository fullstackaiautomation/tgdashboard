import type { FC } from 'react';
import { useState } from 'react';
import { X } from 'lucide-react';

interface ProgressSliderProps {
  progress: number; // 0-100
  onChange: (progress: number) => void;
  onClose?: () => void;
  className?: string;
  onTimeTrack?: (hours: number) => void; // Callback for time tracking
  hoursWorked?: number | null; // Current hours worked value
}

/**
 * ProgressSlider - Interactive slider for editing task progress percentage
 *
 * @param progress - Current completion percentage (0-100)
 * @param onChange - Callback when progress changes
 * @param onClose - Optional callback when slider should close
 * @param className - Additional Tailwind classes
 */
export const ProgressSlider: FC<ProgressSliderProps> = ({
  progress,
  onChange,
  onClose,
  className = '',
  onTimeTrack,
  hoursWorked,
}) => {
  const [localProgress, setLocalProgress] = useState(progress);
  const [customHours, setCustomHours] = useState('');

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalProgress(value);
  };

  const handleSliderMouseUp = () => {
    if (localProgress !== progress) {
      onChange(localProgress);
    }
  };

  const handleQuickSet = (value: number) => {
    setLocalProgress(value);
    onChange(value);

    // Only close when hitting 100%
    if (value === 100 && onClose) {
      onClose();
    }
  };

  // handleInputChange removed - not used in current implementation
  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = parseInt(e.target.value, 10);
  //   if (!isNaN(value) && value >= 0 && value <= 100) {
  //     setLocalProgress(value);
  //     onChange(value);
  //   }
  // };

  const handleTimeTrack = (hours: number) => {
    if (onTimeTrack) {
      onTimeTrack(hours);
    }
  };

  const handleCustomHoursSubmit = () => {
    const hours = parseFloat(customHours);
    if (!isNaN(hours) && hours > 0 && onTimeTrack) {
      onTimeTrack(hours);
      setCustomHours('');
    }
  };

  return (
    <div
      className={`bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg min-w-[280px] relative ${className}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Row 1: Time Tracking Section */}
      {onTimeTrack && (
        <div className="mb-3">
          <label className="text-xs text-gray-400 font-medium block mb-2">Time Spent</label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleTimeTrack(0.25)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                hoursWorked === 0.25
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              15m
            </button>
            <button
              onClick={() => handleTimeTrack(0.5)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                hoursWorked === 0.5
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              30m
            </button>
            <button
              onClick={() => handleTimeTrack(1)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                hoursWorked === 1
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              1h
            </button>
            <button
              onClick={() => handleTimeTrack(2)}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                hoursWorked === 2
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              2h
            </button>
            <input
              type="text"
              inputMode="decimal"
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              onBlur={handleCustomHoursSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomHoursSubmit();
                }
              }}
              placeholder="hrs"
              className="w-14 px-2 py-1 text-xs bg-gray-800 text-gray-200 rounded border border-gray-600 focus:border-orange-500 focus:outline-none text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      )}

      {/* Row 2: % Complete Quick-set buttons */}
      <div className="mb-3">
        <label className="text-xs text-gray-400 font-medium block mb-2">% Complete</label>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleQuickSet(0)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              localProgress === 0
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            0%
          </button>
          <button
            onClick={() => handleQuickSet(25)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              localProgress === 25
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            25%
          </button>
          <button
            onClick={() => handleQuickSet(50)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              localProgress === 50
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            50%
          </button>
          <button
            onClick={() => handleQuickSet(75)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              localProgress === 75
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            75%
          </button>
          <button
            onClick={() => handleQuickSet(100)}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
              localProgress === 100
                ? 'bg-green-600 text-white hover:bg-green-700 border border-green-400'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            100%
          </button>
        </div>
      </div>

      {/* Row 3: Visual Progress Bar */}
      <div>
        <input
          type="range"
          min="0"
          max="100"
          value={localProgress}
          onChange={handleSliderChange}
          onMouseUp={handleSliderMouseUp}
          onTouchEnd={handleSliderMouseUp}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-orange-500"
          style={{
            background: `linear-gradient(to right,
              ${localProgress < 33 ? '#ef4444' : localProgress < 67 ? '#eab308' : '#22c55e'} 0%,
              ${localProgress < 33 ? '#ef4444' : localProgress < 67 ? '#eab308' : '#22c55e'} ${localProgress}%,
              #4b5563 ${localProgress}%,
              #4b5563 100%)`,
          }}
        />
      </div>
    </div>
  );
};
