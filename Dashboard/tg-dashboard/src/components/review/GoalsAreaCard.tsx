import { ChevronRight, TrendingUp } from 'lucide-react'
import { useGoals } from '../../hooks/useGoals'

interface GoalsAreaCardProps {
  onClick?: () => void
}

export const GoalsAreaCard = ({ onClick }: GoalsAreaCardProps) => {
  const { data: goals, isLoading } = useGoals(undefined, 'active')

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 animate-pulse h-64" />
    )
  }

  const totalGoals = goals?.length || 0
  const goalsByArea = goals?.reduce((acc: Record<string, number>, goal) => {
    acc[goal.area] = (acc[goal.area] || 0) + 1
    return acc
  }, {}) || {}

  const areas = Object.entries(goalsByArea).map(([area, count]) => ({ area, count }))

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-purple-900/40 to-purple-900/10 rounded-lg p-6
               border border-purple-700/30 cursor-pointer transition-all hover:shadow-lg
               hover:-translate-y-1 hover:border-purple-500"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <span className="text-4xl">🎯</span>
          <div>
            <h3 className="text-lg font-semibold text-white">Goals & Progress</h3>
            <p className="text-xs text-purple-300 mt-1">{totalGoals} active goals</p>
          </div>
        </div>
        <ChevronRight size={24} className="text-gray-400" />
      </div>

      {/* Goals by Area */}
      {areas.length > 0 ? (
        <div className="space-y-2 mb-4">
          {areas.slice(0, 3).map(({ area, count }) => (
            <div key={area} className="flex items-center justify-between text-sm">
              <span className="text-gray-300">{area}</span>
              <span className="text-purple-300 font-medium">{count} goal{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
          {areas.length > 3 && (
            <p className="text-xs text-gray-400 italic">+{areas.length - 3} more areas</p>
          )}
        </div>
      ) : (
        <p className="text-gray-400 text-sm mb-4">No goals yet. Create one to start tracking progress.</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 text-sm text-purple-300 pt-4 border-t border-purple-700/20">
        <TrendingUp size={16} />
        <span>Track daily progress toward what matters</span>
      </div>
    </div>
  )
}
