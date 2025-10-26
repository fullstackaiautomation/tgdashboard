import { useState } from 'react'
import { ArrowLeft, Edit2, Trash2, Plus } from 'lucide-react'
import { useGoalDetail, useDeleteGoal, useCreateGoalTarget } from '../../hooks/useGoals'
import { CheckInModal } from './CheckInModal'
import { GoalProgressBar } from './GoalProgressBar'
import type { GoalTarget } from '../../types/goals'

interface GoalDetailViewProps {
  goalId: string
  onBack?: () => void
}

export const GoalDetailView = ({ goalId, onBack }: GoalDetailViewProps) => {
  const { data: goal, isLoading } = useGoalDetail(goalId)
  const deleteGoal = useDeleteGoal()
  const createTarget = useCreateGoalTarget()
  const [activeTab, setActiveTab] = useState<'overview' | 'targets' | 'checkins'>('overview')
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showNewTargetForm, setShowNewTargetForm] = useState(false)
  const [newTargetData, setNewTargetData] = useState({
    target_name: '',
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    target_value: 1,
    target_unit: 'count',
    contribution_type: 'count' as 'count' | 'duration' | 'metric',
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-gray-800 rounded-lg h-64 animate-pulse" />
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <p className="text-gray-400">Goal not found</p>
      </div>
    )
  }

  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleCreateTarget = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTarget.mutateAsync({
        goal_id: goal.id,
        ...newTargetData,
      })
      setShowNewTargetForm(false)
      setNewTargetData({
        target_name: '',
        frequency: 'weekly',
        target_value: 1,
        target_unit: 'count',
        contribution_type: 'count',
      })
    } catch (error) {
      console.error('Failed to create target:', error)
    }
  }

  const handleDeleteGoal = async () => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await deleteGoal.mutateAsync(goal.id)
        onBack?.()
      } catch (error) {
        console.error('Failed to delete goal:', error)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">{goal.goal_statement}</h1>
          <p className="text-gray-400">{goal.area} • Target: {goal.target_date}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Edit goal"
          >
            <Edit2 size={20} className="text-gray-400" />
          </button>
          <button
            onClick={handleDeleteGoal}
            className="p-2 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete goal"
          >
            <Trash2 size={20} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Primary Metric</p>
          <p className="text-xl font-bold text-white">{goal.primary_metric}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Target Date</p>
          <p className="text-xl font-bold text-white">{goal.target_date}</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400 mb-1">Days Remaining</p>
          <p className={`text-xl font-bold ${daysRemaining > 0 ? 'text-blue-400' : 'text-red-400'}`}>
            {daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        {(['overview', 'targets', 'checkins'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium transition-colors border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab === 'overview' && 'Overview'}
            {tab === 'targets' && 'Weekly Targets'}
            {tab === 'checkins' && 'Check-Ins'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Goal Summary</h3>
              <p className="text-gray-300 mb-4">{goal.goal_statement}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Area</p>
                  <p className="text-white font-medium">{goal.area}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p className="text-white font-medium capitalize">{goal.status}</p>
                </div>
                <div>
                  <p className="text-gray-400">Metric Type</p>
                  <p className="text-white font-medium capitalize">{goal.metric_type}</p>
                </div>
                <div>
                  <p className="text-gray-400">Created</p>
                  <p className="text-white font-medium">{new Date(goal.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCheckInModal(true)}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                       font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Check In Now
            </button>
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <div className="space-y-4">
            {goal.targets && goal.targets.length > 0 ? (
              <>
                {goal.targets.map((target: GoalTarget) => (
                  <div key={target.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-white">{target.target_name}</h4>
                        <p className="text-xs text-gray-400">
                          {target.frequency === 'daily' && 'Daily'}
                          {target.frequency === 'weekly' && 'Weekly'}
                          {target.frequency === 'monthly' && 'Monthly'}
                          {' '} • {target.contribution_type}
                        </p>
                      </div>
                      <span className="text-lg font-bold text-blue-400">
                        {target.target_value} {target.target_unit}
                      </span>
                    </div>
                    <GoalProgressBar progress={75} showPercentage={false} size="sm" />
                  </div>
                ))}
              </>
            ) : (
              <p className="text-gray-400">No targets yet</p>
            )}

            {/* New Target Form */}
            {showNewTargetForm ? (
              <form onSubmit={handleCreateTarget} className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-4">
                <input
                  type="text"
                  placeholder="Target name (e.g., Workout 4x/week)"
                  value={newTargetData.target_name}
                  onChange={(e) => setNewTargetData(prev => ({ ...prev, target_name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded text-sm"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={newTargetData.frequency}
                    onChange={(e) => setNewTargetData(prev => ({ ...prev, frequency: e.target.value as any }))}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Target value"
                    value={newTargetData.target_value}
                    onChange={(e) => setNewTargetData(prev => ({ ...prev, target_value: parseInt(e.target.value) }))}
                    className="bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded text-sm"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={createTarget.isPending}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                  >
                    {createTarget.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTargetForm(false)}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowNewTargetForm(true)}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400
                         hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Target
              </button>
            )}
          </div>
        )}

        {/* Check-Ins Tab */}
        {activeTab === 'checkins' && (
          <div className="space-y-4">
            {goal.checkIns && goal.checkIns.length > 0 ? (
              goal.checkIns.map((checkIn: any) => (
                <div key={checkIn.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-white">{checkIn.checkin_date}</h4>
                    <span className="text-lg font-bold text-blue-400">
                      {Math.round(checkIn.overall_percentage || 0)}%
                    </span>
                  </div>
                  {checkIn.qualitative_feedback && (
                    <p className="text-gray-300 text-sm">{checkIn.qualitative_feedback}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-400">No check-ins yet</p>
            )}
          </div>
        )}
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && (
        <CheckInModal
          goalId={goal.id}
          goalArea={goal.area}
          goalStatement={goal.goal_statement}
          targets={goal.targets || []}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={() => {
            setShowCheckInModal(false)
            // Refetch goal detail
          }}
        />
      )}
    </div>
  )
}
