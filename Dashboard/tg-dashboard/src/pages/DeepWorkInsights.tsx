/**
 * DeepWorkInsights - Comprehensive Deep Work Session Insights Dashboard (Story 4.6)
 *
 * Displays session analytics, focus quality, completion rates, streaks, and personalized recommendations
 */

import { type FC, useState } from 'react';
import { Zap, Flame, Target, TrendingUp, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';
import {
  useSessionAnalytics,
  useFocusQualityScore,
  useCompletionRate,
  useInterruptionAnalysis,
  useOptimalSessionLength,
  useDeepWorkStreak,
  useProductivityRecommendations,
  useContextSwitchingCost,
} from '@/hooks/useDeepWorkInsights';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export const DeepWorkInsights: FC = () => {
  const [dateRange, setDateRange] = useState({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  });

  const { data: analytics, isLoading: analyticsLoading } = useSessionAnalytics(dateRange);
  const { data: focusScore } = useFocusQualityScore(dateRange);
  const { data: completionRate } = useCompletionRate(dateRange);
  const { data: interruptions } = useInterruptionAnalysis(dateRange);
  const { data: optimalLengths } = useOptimalSessionLength(dateRange);
  const { data: streak } = useDeepWorkStreak();
  const { data: recommendations } = useProductivityRecommendations();
  const { data: switchingCost } = useContextSwitchingCost(dateRange);

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    switch (range) {
      case 'this-week':
        setDateRange({
          start: startOfWeek(today, { weekStartsOn: 1 }),
          end: endOfWeek(today, { weekStartsOn: 1 }),
        });
        break;
      case 'last-week':
        const lastWeek = subDays(today, 7);
        setDateRange({
          start: startOfWeek(lastWeek, { weekStartsOn: 1 }),
          end: endOfWeek(lastWeek, { weekStartsOn: 1 }),
        });
        break;
      case 'last-30-days':
        setDateRange({
          start: subDays(today, 30),
          end: today,
        });
        break;
    }
  };

  const getScoreColor = (score: number | undefined | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreLabel = (score: number | undefined | null) => {
    if (!score) return 'No Data';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-orange-400" />
              <h1 className="text-3xl font-bold">Deep Work Insights</h1>
            </div>
            <p className="text-gray-400">
              Analyze your session patterns and optimize focus time
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleDateRangeChange('this-week')}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              This Week
            </button>
            <button
              onClick={() => handleDateRangeChange('last-week')}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              Last Week
            </button>
            <button
              onClick={() => handleDateRangeChange('last-30-days')}
              className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700"
            >
              Last 30 Days
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
        </div>
      </div>

      {/* Deep Work Streak - Hero Section */}
      <div className="mb-6 bg-gradient-to-r from-orange-900/30 to-red-900/30 rounded-lg p-6 border border-orange-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Flame className="w-16 h-16 text-orange-400" />
            <div>
              <div className="text-6xl font-bold text-orange-400">
                {streak || 0} {streak === 1 ? 'day' : 'days'}
              </div>
              <div className="text-gray-300 mt-1 text-lg">
                Deep Work Streak
              </div>
            </div>
          </div>
          {streak && streak >= 7 && (
            <div className="text-8xl animate-bounce">🏆</div>
          )}
        </div>
        {streak !== undefined && (
          <div className="mt-4">
            {/* Progress to next milestone */}
            {streak < 7 && (
              <div className="text-gray-300">
                Keep going! {7 - streak} more {7 - streak === 1 ? 'day' : 'days'} to reach 7-day milestone
              </div>
            )}
            {streak >= 7 && streak < 30 && (
              <div className="text-gray-300">
                Amazing! {30 - streak} more {30 - streak === 1 ? 'day' : 'days'} to reach 30-day milestone
              </div>
            )}
            {streak >= 30 && (
              <div className="text-gray-300">
                Incredible consistency! You're in the top tier of deep work practitioners.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Focus Quality Score */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold">Focus Quality</h3>
          </div>
          {analyticsLoading ? (
            <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
          ) : (
            <>
              <div className={`text-5xl font-bold ${getScoreColor(focusScore)} mb-2`}>
                {focusScore || 0}%
              </div>
              <div className="text-sm text-gray-400 mb-2">{getScoreLabel(focusScore)}</div>
              <div className="text-xs text-gray-500">
                Planned vs. reactive sessions
              </div>
            </>
          )}
        </div>

        {/* Completion Rate */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">Goal Achievement</h3>
          </div>
          {analyticsLoading ? (
            <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
          ) : (
            <>
              <div className={`text-5xl font-bold ${getScoreColor(completionRate)} mb-2`}>
                {completionRate !== null && completionRate !== undefined ? `${completionRate}%` : 'N/A'}
              </div>
              <div className="text-sm text-gray-400 mb-2">
                {completionRate !== null && completionRate !== undefined ? getScoreLabel(completionRate) : 'Track goals to see rate'}
              </div>
              <div className="text-xs text-gray-500">
                Sessions with goals achieved
              </div>
            </>
          )}
        </div>

        {/* Interruption Rate */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold">Interruptions</h3>
          </div>
          {analyticsLoading ? (
            <div className="animate-pulse h-20 bg-gray-700 rounded"></div>
          ) : (
            <>
              <div className={`text-5xl font-bold ${
                !interruptions?.interruption_rate ? 'text-gray-400'
                : interruptions.interruption_rate < 10 ? 'text-green-400'
                : interruptions.interruption_rate < 25 ? 'text-yellow-400'
                : 'text-red-400'
              } mb-2`}>
                {interruptions?.interruption_rate || 0}%
              </div>
              <div className="text-sm text-gray-400 mb-2">
                {interruptions?.interrupted_sessions || 0}/{interruptions?.total_sessions || 0} sessions
              </div>
              <div className="text-xs text-gray-500">
                Interrupted before completion
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Analytics */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold">Session Analytics</h3>
        </div>
        {analyticsLoading ? (
          <div className="animate-pulse h-40 bg-gray-700 rounded"></div>
        ) : analytics ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Sessions</div>
              <div className="text-2xl font-bold text-gray-100">{analytics.total_sessions}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Avg Length</div>
              <div className="text-2xl font-bold text-gray-100">{analytics.avg_session_length_minutes} min</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Total Hours</div>
              <div className="text-2xl font-bold text-gray-100">{analytics.total_deep_work_hours}h</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Sessions/Day</div>
              <div className="text-2xl font-bold text-gray-100">{analytics.avg_sessions_per_day}</div>
            </div>
          </div>
        ) : (
          <div className="text-gray-400 text-center py-8">No session data available</div>
        )}
      </div>

      {/* Optimal Session Length */}
      {optimalLengths && optimalLengths.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            <h3 className="text-lg font-semibold">Optimal Session Length</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={optimalLengths}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="duration_bucket" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" label={{ value: 'Completion Rate %', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Bar dataKey="avg_completion_rate" name="Completion Rate %" fill="#F97316" />
            </BarChart>
          </ResponsiveContainer>
          {optimalLengths.length > 0 && (
            <div className="mt-4 text-sm text-gray-300">
              <strong>Your sweet spot:</strong> {
                optimalLengths.reduce((best, current) =>
                  (current.avg_completion_rate || 0) > (best.avg_completion_rate || 0) ? current : best
                ).duration_bucket
              } sessions have the highest completion rate
            </div>
          )}
        </div>
      )}

      {/* Productivity Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-lg font-semibold">Productivity Recommendations</h3>
          </div>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="border-l-4 border-orange-500 pl-4 py-2 bg-gray-700/50 rounded-r-lg">
                <div className="font-medium text-gray-100">{rec.message}</div>
                {rec.completion_rate && (
                  <div className="text-sm text-gray-400 mt-1">
                    Completion rate: {rec.completion_rate}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Switching Cost */}
      {switchingCost && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold">Context Switching Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Focused Days */}
            <div className="bg-green-900/20 rounded-lg p-4 border border-green-700/50">
              <div className="text-sm text-gray-400 mb-2">Focused Days (1 area)</div>
              <div className="text-3xl font-bold text-green-400 mb-2">{switchingCost.focused_days.count} days</div>
              <div className="text-sm text-gray-300">
                Avg: {switchingCost.focused_days.avg_hours}h, {switchingCost.focused_days.avg_completion_rate}% completion
              </div>
            </div>

            {/* Fragmented Days */}
            <div className="bg-red-900/20 rounded-lg p-4 border border-red-700/50">
              <div className="text-sm text-gray-400 mb-2">Fragmented Days (3+ areas)</div>
              <div className="text-3xl font-bold text-red-400 mb-2">{switchingCost.fragmented_days.count} days</div>
              <div className="text-sm text-gray-300">
                Avg: {switchingCost.fragmented_days.avg_hours}h, {switchingCost.fragmented_days.avg_completion_rate}% completion
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-300">
            <strong>Estimated time lost to context switching:</strong> {Math.round(switchingCost.total_switching_cost_minutes / 60)} hours ({switchingCost.total_switching_cost_minutes} minutes)
          </div>
        </div>
      )}
    </div>
  );
};
