import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMonthlyCheckInSummary } from '../../hooks/useWeeklyCheckIns'

interface MonthlyTrendCardProps {
  goalId: string
  year?: number
  month?: number
}

export const MonthlyTrendCard = ({
  goalId,
  year,
  month,
}: MonthlyTrendCardProps) => {
  const { data: summary, isLoading } = useMonthlyCheckInSummary(goalId, year, month)

  if (isLoading) {
    return <div className="bg-gray-800 rounded-lg p-6 animate-pulse h-40" />
  }

  if (!summary || summary.totalCheckIns === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-400 text-sm">No check-ins this month yet</p>
      </div>
    )
  }

  const trendIcon = summary.trend === 'improving' ? TrendingUp : TrendingDown
  const TrendIcon = trendIcon
  const trendColor = summary.trend === 'improving' ? 'text-green-400' : summary.trend === 'declining' ? 'text-red-400' : 'text-yellow-400'

  return (
    <div className="bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-700/30 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-white">Monthly Summary</h4>
        <div className={`flex items-center gap-2 ${trendColor}`}>
          <TrendIcon size={18} />
          <span className="text-xs font-medium capitalize">{summary.trend}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-800/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Check-Ins</p>
          <p className="text-xl font-bold text-white">{summary.totalCheckIns}</p>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Avg Progress</p>
          <p className="text-xl font-bold text-blue-400">{summary.averageProgress}%</p>
        </div>
        <div className="bg-gray-800/30 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-1">Best Week</p>
          <p className="text-xl font-bold text-green-400">
            {summary.bestWeek?.overall_percentage || 0}%
          </p>
        </div>
      </div>

      {/* Insight Message */}
      <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
        {summary.trend === 'improving' && (
          <p className="text-green-400/80">
            Great momentum! Your progress is increasing week over week.
          </p>
        )}
        {summary.trend === 'declining' && (
          <p className="text-red-400/80">
            Progress is declining. Consider adjusting your approach or targets.
          </p>
        )}
        {summary.trend === 'stable' && (
          <p className="text-yellow-400/80">
            Progress is stable. Keep maintaining this pace or push for improvement.
          </p>
        )}
      </div>
    </div>
  )
}
