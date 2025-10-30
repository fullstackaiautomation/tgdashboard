/**
 * PlannedVsActualDashboard - Planned vs. Actual comparison visualization
 *
 * Shows target hours vs. actual hours for each area with status indicators
 */

import { type FC } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { usePlannedVsActual } from '@/hooks/useTimePlanning';
import { startOfWeek, format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';

export const PlannedVsActualDashboard: FC = () => {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const { data, isLoading } = usePlannedVsActual(weekStart);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return '#10b981'; // green
      case 'at_risk': return '#f59e0b'; // yellow
      case 'behind': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on_track': return '✓ On Track';
      case 'at_risk': return '⚠ At Risk';
      case 'behind': return '✗ Behind';
      default: return 'No Target';
    }
  };

  const getDeltaIcon = (delta: number) => {
    if (delta > 0) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (delta < 0) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const chartData = data?.map(item => ({
    name: item.area,
    target: item.target_hours,
    actual: item.actual_hours,
    status: item.status,
    percentage: item.percentage,
    delta: item.actual_hours - item.target_hours,
    isTemporary: item.is_temporary_override,
  })) || [];

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Planned vs. Actual</h3>
        <div className="animate-pulse h-96 bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Planned vs. Actual</h3>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-3" />
          <p>No targets set</p>
          <p className="text-sm mt-2">Set targets in Settings to track your progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Planned vs. Actual This Week</h3>
        <div className="text-sm text-gray-400">
          Week of {format(weekStart, 'MMM d, yyyy')}
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="name"
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
            formatter={(value: number, name: string) => [
              `${value.toFixed(1)}h`,
              name === 'target' ? 'Target' : 'Actual'
            ]}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem',
              color: '#f3f4f6',
            }}
          />
          <Legend wrapperStyle={{ color: '#d1d5db' }} />
          <Bar dataKey="target" name="Target" fill="#6b7280" radius={[8, 8, 0, 0]} />
          <Bar dataKey="actual" name="Actual" radius={[8, 8, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Detailed Table */}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400 font-medium">Area</th>
              <th className="text-right py-2 text-gray-400 font-medium">Target</th>
              <th className="text-right py-2 text-gray-400 font-medium">Actual</th>
              <th className="text-right py-2 text-gray-400 font-medium">Delta</th>
              <th className="text-right py-2 text-gray-400 font-medium">%</th>
              <th className="text-right py-2 text-gray-400 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((item, index) => (
              <tr
                key={index}
                className={`border-b border-gray-700/50 ${
                  item.status === 'behind' ? 'bg-red-900/10' :
                  item.status === 'at_risk' ? 'bg-yellow-900/10' :
                  item.status === 'on_track' ? 'bg-green-900/10' :
                  ''
                }`}
              >
                <td className="py-2 text-gray-300">
                  {item.name}
                  {item.isTemporary && (
                    <span className="ml-2 text-xs text-orange-400">(Temp Override)</span>
                  )}
                </td>
                <td className="text-right py-2 text-gray-400">{item.target.toFixed(1)}h</td>
                <td className="text-right py-2 font-semibold text-gray-100">
                  {item.actual.toFixed(1)}h
                </td>
                <td className="text-right py-2">
                  <div className="flex items-center justify-end gap-1">
                    {getDeltaIcon(item.delta)}
                    <span className={
                      item.delta > 0 ? 'text-green-400' :
                      item.delta < 0 ? 'text-red-400' :
                      'text-gray-400'
                    }>
                      {item.delta > 0 ? '+' : ''}{item.delta.toFixed(1)}h
                    </span>
                  </div>
                </td>
                <td className="text-right py-2 font-medium" style={{ color: getStatusColor(item.status) }}>
                  {item.percentage}%
                </td>
                <td className="text-right py-2">
                  <span
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={{
                      backgroundColor: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status)
                    }}
                  >
                    {getStatusLabel(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
