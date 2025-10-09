import type { FC } from 'react';
import { useState } from 'react';

interface ProgressSliderProps {
  progress: number; // 0-100
  onChange: (progress: number) => void;
  onClose?: () => void;
  className?: string;
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
}) => {
  const [localProgress, setLocalProgress] = useState(progress);

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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setLocalProgress(value);
      onChange(value);
    }
  };

  return (
    <div
      className={`bg-gray-700 border border-gray-600 rounded-lg p-3 shadow-lg min-w-[280px] ${className}`}
      onMouseLeave={onClose}
    >
      {/* Header with numeric input */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs text-gray-400 font-medium">Progress</label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="0"
            max="100"
            value={localProgress}
            onChange={handleInputChange}
            className="w-14 px-2 py-1 text-sm bg-gray-800 text-gray-200 rounded border border-gray-600 focus:border-orange-500 focus:outline-none text-center"
          />
          <span className="text-sm text-gray-400">%</span>
        </div>
      </div>

      {/* Slider */}
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

      {/* Quick-set buttons */}
      <div className="flex items-center gap-1 mt-3">
        <button
          onClick={() => handleQuickSet(0)}
          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          0%
        </button>
        <button
          onClick={() => handleQuickSet(25)}
          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          25%
        </button>
        <button
          onClick={() => handleQuickSet(50)}
          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          50%
        </button>
        <button
          onClick={() => handleQuickSet(75)}
          className="flex-1 px-2 py-1 text-xs font-medium bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
        >
          75%
        </button>
        <button
          onClick={() => handleQuickSet(100)}
          className="flex-1 px-2 py-1 text-xs font-medium bg-green-900/30 text-green-400 rounded hover:bg-green-900/50 transition-colors border border-green-500/50"
        >
          100%
        </button>
      </div>
    </div>
  );
};
