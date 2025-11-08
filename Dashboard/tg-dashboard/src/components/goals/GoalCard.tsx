import { ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Goal } from '../../types/goals'
import { GoalProgressBar } from './GoalProgressBar'

interface GoalCardProps {
  goal: Goal
  onClick?: () => void
  progress?: {
    targets_hit: number
    targets_total: number
    completion_percentage: number
  }
}

export const GoalCard = ({ goal, onClick, progress }: GoalCardProps) => {
  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const getAreaEmoji = (area: string) => {
    const emojiMap: Record<string, string> = {
      Health: '💪',
      Relationships: '❤️',
      Finance: '💰',
      'Full Stack': '💻',
      'Huge Capital': '🚀',
      S4: '⭐',
    }
    return emojiMap[area] || '🎯'
  }

  const getStatusColor = (percentage?: number) => {
    if (!percentage) return 'bg-gray-800'
    if (percentage >= 75) return 'bg-green-900'
    if (percentage >= 50) return 'bg-yellow-900'
    return 'bg-red-900'
  }

  const statusColor = getStatusColor(progress?.completion_percentage)

  return (
    <div
      onClick={onClick}
      className={`${statusColor} rounded-lg p-6 cursor-pointer transition-all hover:shadow-lg
                 hover:-translate-y-1 border border-gray-700 hover:border-blue-500`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">{getAreaEmoji(goal.area)}</span>
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wide">{goal.area}</div>
            <h3 className="text-lg font-semibold text-white leading-tight">{goal.goal_statement}</h3>
          </div>
        </div>
        <ChevronRight size={24} className="text-gray-400" />
      </div>

      {/* Primary Metric */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-1">Primary Metric</div>
        <div className="text-sm text-gray-300">{goal.primary_metric}</div>
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-gray-400">Weekly Progress</span>
            <span className="text-sm font-medium text-white">
              {progress.targets_hit}/{progress.targets_total}
            </span>
          </div>
          <GoalProgressBar progress={progress.completion_percentage} />
        </div>
      )}

      {/* Target Date & Days Remaining */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400">
          Target: <span className="text-gray-300 font-medium">{goal.target_date}</span>
        </div>
        <div
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            daysRemaining > 0
              ? 'bg-blue-900/30 text-blue-300'
              : 'bg-red-900/30 text-red-300'
          }`}
        >
          {daysRemaining > 0 ? `${daysRemaining}d left` : 'Overdue'}
        </div>
      </div>
    </div>
  )
}
