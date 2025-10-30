import { type FC, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, AlertCircle } from 'lucide-react';
import { useAllAreasTimeStats } from '@/hooks/useAreaTimeStats';
import { AREA_COLORS } from './AreaTimeCard';

type SortOption = 'most' | 'least' | 'alpha';

/**
 * AreaComparisonChart - Horizontal bar chart comparing time invested across all 7 areas
 *
 * Features:
 * - Horizontal bars with color-coding by area
 * - Sort options: most hours, least hours, alphabetical
 * - Highlights: gold badge for top area, red indicator for bottom area
 * - Total bar showing sum of all areas
 * - Hours this week as the comparison metric
 *
 */
export const AreaComparisonChart: FC = () => {
  const { data: allStats, isLoading } = useAllAreasTimeStats();
  const [sortBy, setSortBy] = useState<SortOption>('most');

  // Sort and prepare chart data
  const chartData = useMemo(() => {
    if (!allStats) return [];

    const data = allStats.map(stat => ({
      area: stat.area,
      hours: stat.hours_this_week,
      color: AREA_COLORS[stat.area as keyof typeof AREA_COLORS] || '#6b7280',
    }));

    // Sort based on selected option
    switch (sortBy) {
      case 'most':
        return data.sort((a, b) => b.hours - a.hours);
      case 'least':
        return data.sort((a, b) => a.hours - b.hours);
      case 'alpha':
        return data.sort((a, b) => a.area.localeCompare(b.area));
      default:
        return data;
    }
  }, [allStats, sortBy]);

  // Calculate total hours
  const totalHours = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.hours, 0);
  }, [chartData]);

  // Identify top and bottom areas
  const topArea = chartData.length > 0 ? chartData[0].area : null;
  const bottomArea = chartData.length > 0 ? chartData[chartData.length - 1].area : null;

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-64 bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!allStats || allStats.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">Area Comparison</h2>
        <p className="text-gray-400 text-center py-8">No deep work sessions logged yet</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header with sort options */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Area Comparison (This Week)</h2>

        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('most')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'most'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Most Hours
          </button>
          <button
            onClick={() => setSortBy('least')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'least'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Least Hours
          </button>
          <button
            onClick={() => setSortBy('alpha')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'alpha'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            type="number"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            label={{ value: 'Hours', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
          />
          <YAxis
            type="category"
            dataKey="area"
            stroke="#9ca3af"
            tick={{ fill: '#9ca3af' }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f3f4f6',
            }}
            formatter={(value: number) => [`${value.toFixed(1)} hours`, 'Hours']}
          />
          <Bar dataKey="hours" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Highlights section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top performer */}
        {sortBy === 'most' && topArea && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-semibold text-yellow-500">Top Area</span>
            </div>
            <div className="text-gray-100 font-medium">{topArea}</div>
            <div className="text-sm text-gray-400">
              {chartData[0].hours.toFixed(1)} hours this week
            </div>
          </div>
        )}

        {/* Bottom performer */}
        {sortBy === 'most' && bottomArea && chartData[chartData.length - 1].hours === 0 && (
          <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm font-semibold text-red-500">Needs Attention</span>
            </div>
            <div className="text-gray-100 font-medium">{bottomArea}</div>
            <div className="text-sm text-gray-400">
              0 hours this week
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <div className="text-sm font-semibold text-blue-400 mb-2">Total This Week</div>
          <div className="text-2xl font-bold text-gray-100">{totalHours.toFixed(1)}h</div>
          <div className="text-sm text-gray-400">
            Across all {chartData.length} areas
          </div>
        </div>
      </div>
    </div>
  );
};
