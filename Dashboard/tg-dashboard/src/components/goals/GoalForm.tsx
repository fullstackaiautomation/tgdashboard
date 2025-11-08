import { useState } from 'react'
import { useCreateGoal } from '../../hooks/useGoals'
import type { GoalArea, MetricType } from '../../types/goals'

const GOAL_AREAS: GoalArea[] = ['Health', 'Relationships', 'Finance', 'Full Stack', 'Huge Capital', 'S4']

interface GoalFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export const GoalForm = ({ onSuccess, onCancel }: GoalFormProps) => {
  const createGoal = useCreateGoal()
  const [formData, setFormData] = useState({
    area: 'Health' as GoalArea,
    goal_statement: '',
    target_date: '',
    primary_metric: '',
    metric_unit: '',
    metric_type: 'numeric' as MetricType,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createGoal.mutateAsync(formData)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create goal:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Area */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Life Area</label>
        <select
          name="area"
          value={formData.area}
          onChange={handleChange}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {GOAL_AREAS.map(area => (
            <option key={area} value={area}>{area}</option>
          ))}
        </select>
      </div>

      {/* Goal Statement */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Goal Statement</label>
        <textarea
          name="goal_statement"
          value={formData.goal_statement}
          onChange={handleChange}
          placeholder="e.g., Be physically fit and proud of how I look"
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-3 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          rows={3}
          required
        />
      </div>

      {/* Target Date */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Target Date</label>
        <input
          type="date"
          name="target_date"
          value={formData.target_date}
          onChange={handleChange}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Primary Metric */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Primary Metric</label>
        <input
          type="text"
          name="primary_metric"
          value={formData.primary_metric}
          onChange={handleChange}
          placeholder="e.g., 10-15% body fat"
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Metric Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Unit (optional)</label>
        <input
          type="text"
          name="metric_unit"
          value={formData.metric_unit}
          onChange={handleChange}
          placeholder="e.g., %, lbs, $"
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Metric Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Metric Type</label>
        <select
          name="metric_type"
          value={formData.metric_type}
          onChange={handleChange}
          className="w-full bg-gray-800 border border-gray-700 text-white px-4 py-2 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="numeric">Numeric (trackable)</option>
          <option value="qualitative">Qualitative (reflection-based)</option>
        </select>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={createGoal.isPending}
          className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white
                   rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {createGoal.isPending ? 'Creating...' : 'Create Goal'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium
                   transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>

      {createGoal.error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-300 text-sm">
          {(createGoal.error as Error).message}
        </div>
      )}
    </form>
  )
}
