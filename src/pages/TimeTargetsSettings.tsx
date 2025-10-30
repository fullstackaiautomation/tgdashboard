/**
 * TimeTargetsSettings - Time Allocation Targets Settings Page
 *
 * Allows users to set weekly time targets for each of the 7 life areas
 */

import { type FC, useState, useEffect } from 'react';
import { Target, Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useAreaTargets, useUpsertAreaTarget, useBulkResetTargets, useUserSettings, useUpsertUserSettings } from '@/hooks/useTimePlanning';
import { usePlannedVsActual } from '@/hooks/useTimePlanning';
import { startOfWeek } from 'date-fns';
import type { Area } from '@/types/planning';

const AREAS: Area[] = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'];

const QUICK_PRESETS = [
  { label: 'Work Week (40h)', hours: 40 },
  { label: 'Part Time (20h)', hours: 20 },
  { label: 'Full Time (50h)', hours: 50 },
];

export const TimeTargetsSettings: FC = () => {
  const { data: targets, isLoading: targetsLoading } = useAreaTargets();
  const { data: settings } = useUserSettings();
  const { data: plannedVsActual } = usePlannedVsActual(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const upsertTarget = useUpsertAreaTarget();
  const resetTargets = useBulkResetTargets();
  const upsertSettings = useUpsertUserSettings();

  const [editedTargets, setEditedTargets] = useState<Record<Area, number>>({} as Record<Area, number>);
  const [availableHours, setAvailableHours] = useState<number>(40);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize edited targets from fetched data
  useEffect(() => {
    if (targets) {
      const targetsMap: Record<Area, number> = {} as Record<Area, number>;
      targets.forEach(target => {
        targetsMap[target.area] = target.target_hours_per_week;
      });
      setEditedTargets(targetsMap);
    }
  }, [targets]);

  // Initialize available hours from settings
  useEffect(() => {
    if (settings) {
      setAvailableHours(settings.available_work_hours_per_week);
    }
  }, [settings]);

  const handleTargetChange = (area: Area, value: string) => {
    const numValue = parseInt(value) || 0;
    if (numValue < 0 || numValue > 168) return;

    setEditedTargets(prev => ({
      ...prev,
      [area]: numValue,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save all targets
      for (const area of AREAS) {
        if (editedTargets[area] !== undefined && editedTargets[area] > 0) {
          await upsertTarget.mutateAsync({ area, targetHours: editedTargets[area] });
        }
      }

      // Save available hours
      await upsertSettings.mutateAsync(availableHours);

      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving targets:', error);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all targets? This cannot be undone.')) return;

    try {
      await resetTargets.mutateAsync();
      setEditedTargets({} as Record<Area, number>);
      setHasChanges(false);
    } catch (error) {
      console.error('Error resetting targets:', error);
    }
  };

  const handleQuickPreset = (hours: number) => {
    const hoursPerArea = Math.floor(hours / AREAS.length);
    const newTargets: Record<Area, number> = {} as Record<Area, number>;

    AREAS.forEach(area => {
      newTargets[area] = hoursPerArea;
    });

    setEditedTargets(newTargets);
    setHasChanges(true);
  };

  const getCurrentActual = (area: Area): number | null => {
    const actual = plannedVsActual?.find(pva => pva.area === area);
    return actual ? actual.actual_hours : null;
  };

  const getTotalAllocated = (): number => {
    return Object.values(editedTargets).reduce((sum, val) => sum + (val || 0), 0);
  };

  const totalAllocated = getTotalAllocated();
  const isOverAllocated = totalAllocated > availableHours;

  if (targetsLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-orange-400" />
          <h1 className="text-3xl font-bold">Time Allocation Targets</h1>
        </div>
        <p className="text-gray-400">
          Set weekly time targets for each life area to proactively plan balanced attention
        </p>
      </div>

      {/* Available Hours Setting */}
      <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Available Work Hours</h3>
        <div className="flex items-center gap-4">
          <label className="text-gray-300">Hours per week:</label>
          <input
            type="number"
            value={availableHours}
            onChange={(e) => {
              setAvailableHours(parseInt(e.target.value) || 0);
              setHasChanges(true);
            }}
            min="0"
            max="168"
            className="px-4 py-2 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-24"
          />
          <span className="text-sm text-gray-400">
            (Realistic weekly capacity for focused work)
          </span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Quick Presets</h3>
        <div className="flex gap-3">
          {QUICK_PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => handleQuickPreset(preset.hours)}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Distributes hours evenly across all 7 areas
        </p>
      </div>

      {/* Over-allocation Warning */}
      {isOverAllocated && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-400">Over-Allocated!</div>
            <div className="text-sm text-red-300">
              Target allocation ({totalAllocated}h) exceeds available capacity ({availableHours}h).
              Consider reducing targets or increasing available hours.
            </div>
          </div>
        </div>
      )}

      {/* Area Targets */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Area Targets</h3>

        <div className="space-y-4">
          {AREAS.map(area => {
            const actual = getCurrentActual(area);

            return (
              <div key={area} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-gray-100">{area}</div>
                  {actual !== null && (
                    <div className="text-sm text-gray-400">
                      Current this week: {actual.toFixed(1)}h
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editedTargets[area] || 0}
                    onChange={(e) => handleTargetChange(area, e.target.value)}
                    min="0"
                    max="168"
                    placeholder="0"
                    className="px-4 py-2 bg-gray-800 text-gray-100 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 w-24 text-center"
                  />
                  <span className="text-gray-400">h/week</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between text-lg">
            <span className="font-semibold text-gray-100">Total Allocated:</span>
            <span className={`font-bold ${isOverAllocated ? 'text-red-400' : 'text-orange-400'}`}>
              {totalAllocated}h / {availableHours}h
            </span>
          </div>
          {!isOverAllocated && totalAllocated < availableHours && (
            <div className="text-sm text-gray-400 text-right mt-1">
              {availableHours - totalAllocated}h unallocated
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || upsertTarget.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {upsertTarget.isPending ? 'Saving...' : 'Save Targets'}
        </button>

        <button
          onClick={handleReset}
          disabled={resetTargets.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Reset All
        </button>

        {saveSuccess && (
          <div className="text-green-400 font-medium">
            ✓ Targets saved successfully!
          </div>
        )}
      </div>
    </div>
  );
};
