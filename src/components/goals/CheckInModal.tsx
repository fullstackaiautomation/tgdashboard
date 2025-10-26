import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useCreateCheckIn, useGoalTargets } from '../../hooks/useGoals'
import { supabase } from '../../lib/supabase'
import { GoalProgressBar } from './GoalProgressBar'
import type { GoalTarget } from '../../types/goals'

interface CheckInModalProps {
  goalId: string
  goalArea: string
  goalStatement: string
  targets?: GoalTarget[]
  onClose?: () => void
  onSuccess?: () => void
}

export const CheckInModal = ({
  goalId,
  goalArea,
  goalStatement,
  targets: initialTargets = [],
  onClose,
  onSuccess,
}: CheckInModalProps) => {
  const createCheckIn = useCreateCheckIn()
  const { data: fetchedTargets = [] } = useGoalTargets(goalId)
  const [targetsHit, setTargetsHit] = useState(0)
  const [targetsTotal, setTargetsTotal] = useState(0)

  const [formData, setFormData] = useState({
    feeling_question: '',
    sustainability_question: 'yes' as 'yes' | 'no' | 'adjust',
    obstacles_notes: '',
  })

  const targets = initialTargets.length > 0 ? initialTargets : fetchedTargets

  // Calculate Sunday date
  const today = new Date()
  const dayOfWeek = today.getDay()
  const sundayDate = new Date(today)
  sundayDate.setDate(today.getDate() - (dayOfWeek || 7))
  const checkinDate = sundayDate.toISOString().split('T')[0]

  // Calculate targets hit from linked task completions
  useEffect(() => {
    const calculateTargetsHit = async () => {
      try {
        // Fetch linked tasks for this goal
        const { data: links, error: linksError } = await supabase
          .from('goal_task_links')
          .select('task_id')
          .eq('goal_id', goalId)

        if (linksError) throw linksError
        if (!links || links.length === 0) {
          setTargetsHit(0)
          setTargetsTotal(targets.length)
          return
        }

        // Fetch task statuses
        const taskIds = links.map(l => l.task_id)
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('id, status')
          .in('id', taskIds)

        if (tasksError) throw tasksError
        if (!tasks) {
          setTargetsHit(0)
          setTargetsTotal(targets.length)
          return
        }

        // Count completed tasks
        const completed = tasks.filter(t => t.status === 'Done').length
        setTargetsHit(completed)
        setTargetsTotal(targets.length || tasks.length)
      } catch (error) {
        console.error('Failed to calculate targets hit:', error)
        setTargetsHit(0)
        setTargetsTotal(targets.length)
      }
    }

    if (goalId) {
      calculateTargetsHit()
    }
  }, [goalId, targets.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCheckIn.mutateAsync({
        goal_id: goalId,
        checkin_date: checkinDate,
        targets_hit: targetsHit,
        targets_total: targetsTotal,
        overall_percentage: (targetsHit / targetsTotal) * 100,
        feeling_question: formData.feeling_question,
        sustainability_question: formData.sustainability_question,
        obstacles_notes: formData.obstacles_notes,
        metric_snapshot: {
          targets_hit: targetsHit,
          targets_total: targetsTotal,
        },
      })
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create check-in:', error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <div>
            <h2 className="text-2xl font-bold text-white">{goalArea} Goal - Weekly Check-In</h2>
            <p className="text-sm text-gray-400 mt-1">{goalStatement}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Week Info */}
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-400">
              Week of {checkinDate} (Sunday)
            </p>
          </div>

          {/* Target Metrics Progress */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Target Metrics Progress</h3>
            <div className="space-y-4">
              {targets.map((target, idx) => (
                <div key={target.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">{target.target_name}</span>
                    <span className="text-sm text-gray-400">
                      {target.frequency === 'weekly' ? `${Math.min(idx + 1, target.target_value)}/${target.target_value}` : '—'}
                    </span>
                  </div>
                  {target.frequency === 'weekly' && (
                    <GoalProgressBar
                      progress={(Math.min(idx + 1, target.target_value) / target.target_value) * 100}
                      showPercentage={false}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Overall Score */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold">Overall Score</span>
                <span className="text-2xl font-bold text-blue-300">
                  {Math.round((targetsHit / targetsTotal) * 100)}%
                </span>
              </div>
              <GoalProgressBar
                progress={(targetsHit / targetsTotal) * 100}
                showPercentage={false}
                size="lg"
              />
            </div>
          </div>

          {/* Reflection Questions */}
          <div className="space-y-6 border-t border-gray-700 pt-6">
            {/* Question 1: Feeling */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                How are you feeling about this week?
              </label>
              <textarea
                value={formData.feeling_question}
                onChange={(e) => setFormData(prev => ({ ...prev, feeling_question: e.target.value }))}
                placeholder="Share your thoughts..."
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                required
              />
            </div>

            {/* Question 2: Sustainability */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Is this pace sustainable?
              </label>
              <div className="flex gap-4">
                {(['yes', 'no', 'adjust'] as const).map(option => (
                  <label key={option} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sustainability"
                      value={option}
                      checked={formData.sustainability_question === option}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        sustainability_question: e.target.value as 'yes' | 'no' | 'adjust',
                      }))}
                      className="w-4 h-4"
                    />
                    <span className="text-gray-300 capitalize">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Question 3: Obstacles/Wins */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Any obstacles or wins to note?
              </label>
              <textarea
                value={formData.obstacles_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, obstacles_notes: e.target.value }))}
                placeholder="What helped you succeed? What got in the way?"
                className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <button
              type="submit"
              disabled={createCheckIn.isPending}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white
                       rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {createCheckIn.isPending ? 'Saving...' : 'Save Check-In'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium
                       transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>

          {createCheckIn.error && (
            <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
              {(createCheckIn.error as Error).message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
