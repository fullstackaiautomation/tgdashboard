import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useGoals } from '../../hooks/useGoals'
import type { GoalArea } from '../../types/goals'
import { GoalCard } from './GoalCard'
import { GoalForm } from './GoalForm'

const GOAL_AREAS: GoalArea[] = ['Health', 'Relationships', 'Finance', 'Full Stack', 'Huge Capital', 'S4']

interface GoalsViewProps {
  onSelectGoal?: (goalId: string) => void
}

export const GoalsView = ({ onSelectGoal }: GoalsViewProps) => {
  const [selectedArea, setSelectedArea] = useState<GoalArea | 'All'>('All')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const { data: goals, isLoading } = useGoals(
    selectedArea === 'All' ? undefined : (selectedArea as GoalArea),
    'active'
  )

  const filteredGoals = selectedArea === 'All' ? goals : goals?.filter(g => g.area === selectedArea)

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🎯 Goals & Progress</h1>
          <p className="text-gray-400">Define your ambitions and track daily progress toward meaningful goals</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                   transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Plus size={20} />
          New Goal
        </button>
      </div>

      {/* Area Filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button
          onClick={() => setSelectedArea('All')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedArea === 'All'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          All Areas
        </button>
        {GOAL_AREAS.map(area => (
          <button
            key={area}
            onClick={() => setSelectedArea(area)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedArea === area
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {area}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse h-64" />
          ))}
        </div>
      ) : filteredGoals && filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGoals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => onSelectGoal?.(goal.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">
            {selectedArea === 'All'
              ? 'No active goals yet. Create your first goal to get started!'
              : `No active goals in ${selectedArea}. Create one to start tracking progress.`}
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={20} />
            Create First Goal
          </button>
        </div>
      )}

      {/* Create Goal Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-white mb-6">Create New Goal</h2>
            <GoalForm
              onSuccess={() => setShowCreateForm(false)}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
