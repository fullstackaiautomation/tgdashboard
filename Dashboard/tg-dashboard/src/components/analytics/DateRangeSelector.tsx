/**
 * DateRangeSelector - Date range selection component for Time Analytics
 *
 * Provides preset options: This Week, This Month, Last 3 Months, Custom Range
 */

import { type FC } from 'react';
import { Calendar } from 'lucide-react';
import { startOfWeek, startOfMonth, subMonths, format } from 'date-fns';
import type { DateRange } from '@/hooks/useTimeAnalytics';

export type DateRangePreset = 'this-week' | 'this-month' | 'last-3-months' | 'custom';

interface DateRangeSelectorProps {
  selectedPreset: DateRangePreset;
  dateRange: DateRange;
  onPresetChange: (preset: DateRangePreset) => void;
  onDateRangeChange: (range: DateRange) => void;
}

export const DateRangeSelector: FC<DateRangeSelectorProps> = ({
  selectedPreset,
  dateRange,
  onPresetChange,
  onDateRangeChange,
}) => {
  const presets: { value: DateRangePreset; label: string; getRange: () => DateRange }[] = [
    {
      value: 'this-week',
      label: 'This Week',
      getRange: () => {
        const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday
        return { start, end: new Date() };
      },
    },
    {
      value: 'this-month',
      label: 'This Month',
      getRange: () => {
        const start = startOfMonth(new Date());
        return { start, end: new Date() };
      },
    },
    {
      value: 'last-3-months',
      label: 'Last 3 Months',
      getRange: () => {
        const start = subMonths(new Date(), 3);
        return { start, end: new Date() };
      },
    },
    {
      value: 'custom',
      label: 'Custom Range',
      getRange: () => dateRange, // Use existing range
    },
  ];

  const handlePresetClick = (preset: DateRangePreset) => {
    onPresetChange(preset);
    const selected = presets.find(p => p.value === preset);
    if (selected && preset !== 'custom') {
      onDateRangeChange(selected.getRange());
    }
  };

  return (
    <div className="flex items-center gap-4 bg-gray-800 p-4 rounded-lg border border-gray-700">
      <Calendar className="w-5 h-5 text-gray-400" />

      {/* Preset buttons */}
      <div className="flex gap-2">
        {presets.map(preset => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPreset === preset.value
                ? 'bg-orange-500 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom date inputs (shown when custom is selected) */}
      {selectedPreset === 'custom' && (
        <div className="flex items-center gap-2 ml-4">
          <input
            type="date"
            value={format(dateRange.start, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newStart = new Date(e.target.value);
              onDateRangeChange({ ...dateRange, start: newStart });
            }}
            className="px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={format(dateRange.end, 'yyyy-MM-dd')}
            onChange={(e) => {
              const newEnd = new Date(e.target.value);
              onDateRangeChange({ ...dateRange, end: newEnd });
            }}
            className="px-3 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      {/* Date range display */}
      <div className="ml-auto text-sm text-gray-400">
        {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
      </div>
    </div>
  );
};
