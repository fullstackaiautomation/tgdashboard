import { type FC, useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAreaTimeTrend } from '@/hooks/useAreaTimeStats';
import { AREA_COLORS } from './AreaTimeCard';

type AggregationOption = 'daily' | 'weekly' | 'monthly';

const AREAS = ['Full Stack', 'S4', '808', 'Personal', 'Huge Capital', 'Golf', 'Health'] as const;

/**
 * AreaTimeTrend - Multi-line chart showing historical time trends for all areas
 *
 * Features:
 * - 7 lines (one per area) with color-coding
 * - Toggle visibility of specific areas
 * - Aggregation options: daily, weekly, monthly
 * - Collapsible section
 * - Interactive tooltip with all areas' hours for selected date
 * - Last 90 days of data
 */
export const AreaTimeTrend: FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [visibleAreas, setVisibleAreas] = useState<Set<string>>(new Set(AREAS));
  const [aggregation, setAggregation] = useState<AggregationOption>('daily');
  const { data: trendData, isLoading } = useAreaTimeTrend(90);

  // Process and aggregate data based on selected option
  const chartData = useMemo(() => {
    if (!trendData || trendData.length === 0) return [];

    // Group by date and area
    const dataByDate = new Map<string, Record<string, number>>();

    trendData.forEach(item => {
      const date = item.date;
      if (!dataByDate.has(date)) {
        dataByDate.set(date, {});
      }
      const dateData = dataByDate.get(date)!;
      dateData[item.area] = item.hours;
    });

    // Convert to array format for Recharts
    const result = Array.from(dataByDate.entries()).map(([date, areas]) => ({
      date,
      ...areas,
    }));

    // Sort by date
    result.sort((a, b) => a.date.localeCompare(b.date));

    // TODO: Implement weekly/monthly aggregation if needed
    // For now, just return daily data

    return result;
  }, [trendData]);

  const toggleArea = (area: string) => {
    const newVisible = new Set(visibleAreas);
    if (newVisible.has(area)) {
      newVisible.delete(area);
    } else {
      newVisible.add(area);
    }
    setVisibleAreas(newVisible);
  };

  const toggleAll = () => {
    if (visibleAreas.size === AREAS.length) {
      setVisibleAreas(new Set());
    } else {
      setVisibleAreas(new Set(AREAS));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-96 bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-2xl font-bold text-gray-100 hover:text-blue-400 transition-colors"
        >
          Historical Time Trends (Last 90 Days)
          {isCollapsed ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <ChevronUp className="w-6 h-6" />
          )}
        </button>

        {!isCollapsed && (
          <div className="flex gap-2">
            <button
              onClick={() => setAggregation('daily')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                aggregation === 'daily'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setAggregation('weekly')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                aggregation === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled
              title="Coming soon"
            >
              Weekly
            </button>
            <button
              onClick={() => setAggregation('monthly')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                aggregation === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              disabled
              title="Coming soon"
            >
              Monthly
            </button>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Area toggles */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={toggleAll}
              className="px-3 py-1 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              {visibleAreas.size === AREAS.length ? 'Hide All' : 'Show All'}
            </button>
            {AREAS.map(area => (
              <button
                key={area}
                onClick={() => toggleArea(area)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  visibleAreas.has(area)
                    ? 'opacity-100'
                    : 'opacity-40 hover:opacity-70'
                }`}
                style={{
                  backgroundColor: visibleAreas.has(area) ? AREA_COLORS[area] : '#374151',
                  color: visibleAreas.has(area) ? 'white' : '#9ca3af',
                }}
              >
                {area}
              </button>
            ))}
          </div>

          {/* Chart */}
          {chartData.length === 0 ? (
            <div className="text-gray-400 text-center py-12">
              No deep work sessions logged in the last 90 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickFormatter={(date: string) => format(parseISO(date), 'MMM d')}
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
                  labelFormatter={(date: string) => format(parseISO(date), 'MMM d, yyyy')}
                  formatter={(value: number) => [`${value.toFixed(1)}h`, '']}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                {AREAS.map(area => (
                  visibleAreas.has(area) && (
                    <Line
                      key={area}
                      type="monotone"
                      dataKey={area}
                      stroke={AREA_COLORS[area]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      name={area}
                    />
                  )
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
};
