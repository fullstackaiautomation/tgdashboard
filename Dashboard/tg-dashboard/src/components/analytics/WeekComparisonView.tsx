/**
 * WeekComparisonView - Week-over-week comparison of time allocation
 *
 * Side-by-side bar chart: This Week vs Last Week for each area
 * Highlights dramatic shifts (>50% change)
 */

import { type FC, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useWeekComparison } from '@/hooks/useTimeAnalytics';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const WeekComparisonView: FC = () => {
  const { data, isLoading } = useWeekComparison();
  const [isExpanded, setIsExpanded] = useState(true);

  const chartData = data?.map(item => ({
    area: item.area,
    thisWeek: item.current_week_hours,
    lastWeek: item.last_week_hours,
    delta: item.delta_hours,
    deltaPercentage: item.delta_percentage,
    isDramaticShift: Math.abs(item.delta_percentage) > 50,
  })) || [];

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getDeltaColor = (delta: number) => {
    if (delta > 0) return 'text-green-400';
    if (delta < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Week-over-Week Comparison</h3>
        <div className="animate-pulse h-64 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Week-over-Week Comparison</h3>
        <div className="text-center py-12 text-gray-400">
          No data available for comparison
        </div>
      </div>
    );
  }

  const dramaticShifts = chartData.filter(item => item.isDramaticShift);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Week-over-Week Comparison</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Collapse</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Expand</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Dramatic shifts alert */}
      {dramaticShifts.length > 0 && isExpanded && (
        <div className="mb-4 p-3 bg-orange-900/20 border border-orange-700 rounded-lg">
          <div className="text-sm text-orange-400 font-medium mb-2">
            ⚠️ Dramatic shifts detected ({dramaticShifts.length} area{dramaticShifts.length > 1 ? 's' : ''})
          </div>
          {dramaticShifts.map(shift => (
            <div key={shift.area} className="text-xs text-orange-300 mt-1">
              • <span className="font-semibold">{shift.area}</span>:{' '}
              {shift.delta > 0 ? '+' : ''}{shift.delta.toFixed(1)}h ({shift.deltaPercentage > 0 ? '+' : ''}{shift.deltaPercentage.toFixed(0)}%)
            </div>
          ))}
        </div>
      )}

      {isExpanded && (
        <>
          {/* Bar chart */}
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="area"
                stroke="#9ca3af"
                tick={{ fill: '#d1d5db', fontSize: 12 }}
                angle={-15}
                textAnchor="end"
                height={80}
              />
              <YAxis
                stroke="#9ca3af"
                tick={{ fill: '#d1d5db' }}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}h`}
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6',
                }}
              />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
              <Bar dataKey="thisWeek" name="This Week" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="lastWeek" name="Last Week" fill="#6b7280" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Delta table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400 font-medium">Area</th>
                  <th className="text-right py-2 text-gray-400 font-medium">This Week</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Last Week</th>
                  <th className="text-right py-2 text-gray-400 font-medium">Change</th>
                  <th className="text-right py-2 text-gray-400 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(item => (
                  <tr
                    key={item.area}
                    className={`border-b border-gray-700/50 ${
                      item.isDramaticShift ? 'bg-orange-900/10' : ''
                    }`}
                  >
                    <td className="py-2 text-gray-300">
                      {item.area}
                      {item.isDramaticShift && (
                        <span className="ml-2 text-orange-400 text-xs">⚠️</span>
                      )}
                    </td>
                    <td className="text-right py-2 font-semibold text-blue-400">
                      {item.thisWeek.toFixed(1)}h
                    </td>
                    <td className="text-right py-2 text-gray-400">
                      {item.lastWeek.toFixed(1)}h
                    </td>
                    <td className={`text-right py-2 font-medium ${getDeltaColor(item.delta)}`}>
                      <div className="flex items-center justify-end gap-1">
                        {getDeltaIcon(item.delta)}
                        {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)}h
                      </div>
                    </td>
                    <td className={`text-right py-2 font-medium ${getDeltaColor(item.delta)}`}>
                      {item.deltaPercentage > 0 ? '+' : ''}{item.deltaPercentage.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!isExpanded && (
        <div className="text-center py-4 text-sm text-gray-500">
          Click "Expand" to view detailed comparison
        </div>
      )}
    </div>
  );
};
