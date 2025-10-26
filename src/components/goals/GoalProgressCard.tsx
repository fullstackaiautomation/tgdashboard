import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGoalProgress } from '../../hooks/useGoalProgress'
import { GoalProgressBar } from './GoalProgressBar'
import { MonthlyTrendCard } from './MonthlyTrendCard'
import type { Goal } from '../../types/goals'

interface GoalProgressCardProps {
  goal: Goal
}

export const GoalProgressCard = ({ goal }: GoalProgressCardProps) => {
  const [showTrend, setShowTrend] = useState(false)
  const { data: progress, isLoading } = useGoalProgress(goal)

  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/30 rounded-lg p-6 animate-pulse h-40" />
    )
  }

  const completionPercentage = progress?.completion_percentage || 0

  return (
    <div
      className={`bg-gradient-to-br from-purple-900/20 to-purple-900/5 border rounded-lg p-6 hover:border-purple-500 transition-colors ${
        completionPercentage >= 75
          ? 'border-green-700/30'
          : completionPercentage >= 50
            ? 'border-yellow-700/30'
            : 'border-purple-700/30'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-semibold text-white">{goal.goal_statement}</h4>
          <p className="text-xs text-gray-400 mt-1">{goal.area}</p>
        </div>
        <div className="text-right ml-4">
          <div className="text-lg font-bold text-blue-400">{completionPercentage}%</div>
          <p className="text-xs text-gray-500">progress</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Metric: {goal.primary_metric}</span>
            <span className={`text-xs font-medium ${
              daysRemaining > 0 ? 'text-blue-400' : 'text-red-400'
            }`}>
              {daysRemaining > 0 ? `${daysRemaining}d left` : 'Overdue'}
            </span>
          </div>
        </div>
        <GoalProgressBar progress={completionPercentage} showPercentage={false} size="sm" />
        <div className="text-xs text-gray-500 flex justify-between">
          <span>Linked Tasks: {progress?.targets_hit}/{progress?.targets_total}</span>
        </div>
      </div>

      {/* Monthly Trend Collapsible Section */}
      <div className="border-t border-purple-700/20 mt-4 pt-4">
        <button
          onClick={() => setShowTrend(!showTrend)}
          className="flex items-center justify-between w-full text-sm font-medium text-gray-300 hover:text-white transition-colors"
        >
          <span>This Month's Trend</span>
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${showTrend ? 'rotate-180' : ''}`}
          />
        </button>
        {showTrend && (
          <div className="mt-3">
            <MonthlyTrendCard goalId={goal.id} />
          </div>
        )}
      </div>
    </div>
  )
}
