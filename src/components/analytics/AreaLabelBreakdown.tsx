import { type FC, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useAreaLabelBreakdown } from '@/hooks/useAreaTimeStats';
import { AREA_COLORS } from './AreaTimeCard';

// Label color mapping based on type
const LABEL_COLORS: Record<string, string> = {
  '$$$ Printer $$$': '#10b981',   // green - revenue generating
  '$ Makes Money $': '#34d399',   // light green - revenue generating
  '-$ Save Dat $-': '#06b6d4',    // cyan - cost savings
  ':( No Money ):': '#6b7280',    // gray - non-revenue
  '8) Vibing (8': '#a855f7',      // purple - personal/enjoyment
  'Internal Build': '#3b82f6',    // blue - internal work
  'Bug Fix': '#f59e0b',           // amber - maintenance
  'Client Meeting': '#ec4899',    // pink - client work
};

const DEFAULT_LABEL_COLOR = '#8b5cf6'; // purple

/**
 * AreaLabelBreakdown - Stacked bar chart showing label breakdown by area
 *
 * Features:
 * - Stacked bar chart with areas on X-axis
 * - Labels as stacked segments (color-coded by type)
 * - Filter by date range
 * - Common labels: revenue types, internal work, client work, etc.
 * - Helps understand work composition within each area
 */
export const AreaLabelBreakdown: FC = () => {
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('month');

  // Calculate date filters
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const start = new Date();

    switch (dateRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setDate(now.getDate() - 30);
        break;
      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }

    return { startDate: start, endDate: now };
  }, [dateRange]);

  const { data: labelData, isLoading } = useAreaLabelBreakdown(startDate, endDate);

  // Process data for stacked bar chart
  const chartData = useMemo(() => {
    if (!labelData || labelData.length === 0) return [];

    // Group by area
    const areaMap = new Map<string, Record<string, number>>();

    labelData.forEach(item => {
      if (!areaMap.has(item.area)) {
        areaMap.set(item.area, {});
      }
      const areaData = areaMap.get(item.area)!;
      areaData[item.label] = item.hours;
    });

    // Convert to array format for Recharts
    return Array.from(areaMap.entries()).map(([area, labels]) => ({
      area,
      ...labels,
    }));
  }, [labelData]);

  // Get all unique labels for chart legend
  const allLabels = useMemo(() => {
    if (!labelData) return [];
    const labelsSet = new Set<string>();
    labelData.forEach(item => labelsSet.add(item.label));
    return Array.from(labelsSet).sort();
  }, [labelData]);

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!labelData || labelData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Label Breakdown by Area</h2>
        <p className="text-gray-400 text-center py-8">
          No labeled deep work sessions found for the selected period
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header with date range filter */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Label Breakdown by Area</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'week'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'month'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateRange('all')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              dateRange === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="area"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af', fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value: number) => `${value.toFixed(1)}h`}
          />
          <Legend
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="rect"
          />
          {allLabels.map(label => (
            <Bar
              key={label}
              dataKey={label}
              stackId="a"
              fill={LABEL_COLORS[label] || DEFAULT_LABEL_COLOR}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>

      {/* Legend description */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
            <span className="text-gray-300 font-medium">Revenue Generating</span>
          </div>
          <p className="text-gray-500 text-xs ml-5">$$$ Printer $$$, $ Makes Money $</p>
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-gray-300 font-medium">Internal Work</span>
          </div>
          <p className="text-gray-500 text-xs ml-5">Internal Build, Infrastructure</p>
        </div>
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }} />
            <span className="text-gray-300 font-medium">Maintenance</span>
          </div>
          <p className="text-gray-500 text-xs ml-5">Bug Fix, Tech Debt</p>
        </div>
      </div>
    </div>
  );
};
