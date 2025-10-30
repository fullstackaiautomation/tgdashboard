import { type FC, useState, useEffect } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { useAreaTimeBudgets, useBatchUpsertAreaTimeBudgets } from '@/hooks/useAreaTimeBudgets';
import { AREA_COLORS } from './AreaTimeCard';

type Area = 'Full Stack' | 'S4' | '808' | 'Personal' | 'Huge Capital' | 'Golf' | 'Health';

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

// Default time budgets (hours per week)
const DEFAULT_BUDGETS: Record<Area, number> = {
  'Full Stack': 10,
  'S4': 6,
  '808': 4,
  'Personal': 5,
  'Huge Capital': 8,
  'Golf': 2,
  'Health': 5,
};

interface TimeBudgetSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * TimeBudgetSettings - Modal for managing area time budgets
 *
 * Features:
 * - Input fields for all 7 areas
 * - Save button to batch update budgets
 * - Reset to defaults button
 * - Color-coded area indicators
 * - Validation (positive numbers only)
 */
export const TimeBudgetSettings: FC<TimeBudgetSettingsProps> = ({ isOpen, onClose }) => {
  const { data: existingBudgets } = useAreaTimeBudgets();
  const upsertBudgets = useBatchUpsertAreaTimeBudgets();

  const [budgets, setBudgets] = useState<Record<Area, number>>(DEFAULT_BUDGETS);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize budgets from database
  useEffect(() => {
    if (existingBudgets && existingBudgets.length > 0) {
      const budgetMap: Partial<Record<Area, number>> = {};
      existingBudgets.forEach(budget => {
        budgetMap[budget.area as Area] = budget.target_hours_per_week;
      });

      // Merge with defaults for areas without budgets
      const merged = { ...DEFAULT_BUDGETS };
      Object.entries(budgetMap).forEach(([area, hours]) => {
        if (hours !== undefined) {
          merged[area as Area] = hours;
        }
      });

      setBudgets(merged);
    }
  }, [existingBudgets]);

  const handleBudgetChange = (area: Area, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
      setBudgets(prev => ({ ...prev, [area]: numValue }));
      setHasChanges(true);
    }
  };

  const handleSave = async () => {
    const budgetArray = AREAS.map(area => ({
      area,
      targetHours: budgets[area],
    }));

    try {
      await upsertBudgets.mutateAsync(budgetArray);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error('Failed to save budgets:', error);
      alert('Failed to save budgets. Please try again.');
    }
  };

  const handleReset = () => {
    setBudgets(DEFAULT_BUDGETS);
    setHasChanges(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">Time Budget Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-400 mb-6">
            Set target hours per week for each life area. These targets will help you track progress and maintain balance.
          </p>

          {/* Budget inputs */}
          <div className="space-y-4">
            {AREAS.map(area => (
              <div key={area} className="flex items-center gap-4">
                {/* Area indicator */}
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: AREA_COLORS[area] }}
                />

                {/* Area name */}
                <label htmlFor={`budget-${area}`} className="flex-1 text-gray-100 font-medium">
                  {area}
                </label>

                {/* Input */}
                <div className="flex items-center gap-2">
                  <input
                    id={`budget-${area}`}
                    type="number"
                    min="0"
                    max="168"
                    value={budgets[area]}
                    onChange={(e) => handleBudgetChange(area, e.target.value)}
                    className="w-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-sm">h/week</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total summary */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total weekly target:</span>
              <span className="text-2xl font-bold text-blue-400">
                {Object.values(budgets).reduce((sum, hours) => sum + hours, 0)}h
              </span>
            </div>
            {Object.values(budgets).reduce((sum, hours) => sum + hours, 0) > 168 && (
              <p className="text-yellow-400 text-sm mt-2">
                ⚠ Total exceeds 168 hours per week (7 days × 24 hours)
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-800 border-t border-gray-700 p-6 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || upsertBudgets.isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                !hasChanges || upsertBudgets.isPending
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Save className="w-4 h-4" />
              {upsertBudgets.isPending ? 'Saving...' : 'Save Budgets'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
