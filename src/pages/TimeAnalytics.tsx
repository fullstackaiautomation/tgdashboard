/**
 * TimeAnalytics - Comprehensive Time Allocation Visual Analytics Dashboard
 *
 * Story 4.4: Visual analytics showing time allocation patterns and trends
 *
 * Features:
 * - Date range selector (This Week, This Month, Last 3 Months, Custom)
 * - Weekly heatmap visualization
 * - Area distribution pie chart
 * - Task type breakdown chart
 * - 3-month trend analysis
 * - Focus time metric
 * - Peak productivity analysis
 * - Label time analysis
 * - Week-over-week comparison
 */

import { type FC, useState } from 'react';
import { startOfWeek, startOfMonth, subMonths } from 'date-fns';
import { Download } from 'lucide-react';
import type { DateRange } from '@/hooks/useTimeAnalytics';
import { DateRangeSelector, type DateRangePreset } from '@/components/analytics/DateRangeSelector';
import { WeeklyHeatmap } from '@/components/analytics/WeeklyHeatmap';
import { AreaDistributionPieChart } from '@/components/analytics/AreaDistributionPieChart';
import { TaskTypeBreakdown } from '@/components/analytics/TaskTypeBreakdown';
import { TimeAllocationTrendGraph } from '@/components/analytics/TimeAllocationTrendGraph';
import { FocusTimeMetric } from '@/components/analytics/FocusTimeMetric';
import { PeakProductivityChart } from '@/components/analytics/PeakProductivityChart';
import { LabelTimeAnalysis } from '@/components/analytics/LabelTimeAnalysis';
import { WeekComparisonView } from '@/components/analytics/WeekComparisonView';

export const TimeAnalytics: FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('last-3-months');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: subMonths(new Date(), 3),
    end: new Date(),
  });

  const handlePresetChange = (preset: DateRangePreset) => {
    setSelectedPreset(preset);

    // Update date range based on preset
    switch (preset) {
      case 'this-week':
        setDateRange({
          start: startOfWeek(new Date(), { weekStartsOn: 1 }),
          end: new Date(),
        });
        break;
      case 'this-month':
        setDateRange({
          start: startOfMonth(new Date()),
          end: new Date(),
        });
        break;
      case 'last-3-months':
        setDateRange({
          start: subMonths(new Date(), 3),
          end: new Date(),
        });
        break;
      case 'custom':
        // Keep current date range
        break;
    }
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export functionality
    alert('PDF export feature coming soon!');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Time Allocation Analytics</h1>
            <p className="text-gray-400 mt-2">
              Visual analytics showing time allocation patterns and productivity trends
            </p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>

        {/* Date Range Selector */}
        <DateRangeSelector
          selectedPreset={selectedPreset}
          dateRange={dateRange}
          onPresetChange={handlePresetChange}
          onDateRangeChange={setDateRange}
        />
      </div>

      {/* Main Analytics Grid */}
      <div className="space-y-6">
        {/* Section 1: Weekly Heatmap (full width) */}
        <WeeklyHeatmap weekStart={startOfWeek(new Date(), { weekStartsOn: 1 })} />

        {/* Section 2: Focus Time + Area Distribution (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FocusTimeMetric dateRange={dateRange} />
          <AreaDistributionPieChart dateRange={dateRange} />
        </div>

        {/* Section 3: Task Type + Peak Productivity (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskTypeBreakdown dateRange={dateRange} />
          <PeakProductivityChart dateRange={dateRange} />
        </div>

        {/* Section 4: 3-Month Trend Analysis (full width) */}
        <TimeAllocationTrendGraph dateRange={dateRange} />

        {/* Section 5: Label Analysis (full width) */}
        <LabelTimeAnalysis dateRange={dateRange} topN={10} />

        {/* Section 6: Week Comparison (full width, collapsible) */}
        <WeekComparisonView />
      </div>
    </div>
  );
};
