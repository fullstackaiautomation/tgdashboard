import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Trash2, Edit2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useGoalProgress } from '../../hooks/useGoalProgress'
import { useDeleteGoal, useUpdateGoal } from '../../hooks/useGoals'
import { useGoalsNeedingCheckIn } from '../../hooks/useWeeklyCheckIns'
import { parseLocalDate, formatDateString } from '../../utils/dateHelpers'
import { GoalProgressBar } from './GoalProgressBar'
import { MonthlyTrendCard } from './MonthlyTrendCard'
import { getGoalAreaConfig } from '../../config/goalAreas'
import type { Goal, GoalArea } from '../../types/goals'
import type { GoalAreaType } from '../../config/goalAreas'

interface GoalProgressCardProps {
  goal: Goal
  onCheckIn?: (goalId: string) => void
}

// Helper function to format numbers with comma separators
const formatNumberWithCommas = (value: string | undefined | null): string => {
  if (!value) return '—'
  // Extract just the numbers and decimal point
  const cleanedValue = value.toString().replace(/[^0-9.]/g, '')
  if (!cleanedValue) return '—'
  // Format with commas
  const [integerPart, decimalPart] = cleanedValue.split('.')
  const formattedInteger = parseInt(integerPart || '0').toLocaleString()
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

export const GoalProgressCard = ({ goal, onCheckIn }: GoalProgressCardProps) => {
  const [showTrend, setShowTrend] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isCardEditMode, setIsCardEditMode] = useState(false)
  const [editClickCount, setEditClickCount] = useState(0)
  const [editedStatement, setEditedStatement] = useState(goal.goal_statement)
  const [editedCreatedAt, setEditedCreatedAt] = useState(formatDateString(parseLocalDate(goal.created_at) || new Date()))
  const [editedTargetDate, setEditedTargetDate] = useState(formatDateString(parseLocalDate(goal.target_date) || new Date()))
  const [editedPrimaryMetric, setEditedPrimaryMetric] = useState(goal.primary_metric)
  const [editedMetricUnit, setEditedMetricUnit] = useState(goal.metric_unit || '')
  const [editedStartedMetric, setEditedStartedMetric] = useState(goal.started_metric_value || '')
  const [editedCheckInValue, setEditedCheckInValue] = useState(goal.check_in_value || '')
  const [editedCheckInDate, setEditedCheckInDate] = useState(goal.check_in_date ? formatDateString(parseLocalDate(goal.check_in_date) || new Date()) : '')
  const editTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { data: progress, isLoading } = useGoalProgress(goal)
  const { data: checkInData } = useGoalsNeedingCheckIn()
  const deleteGoal = useDeleteGoal()
  const updateGoal = useUpdateGoal()

  // Check if this specific goal needs a check-in
  const goalNeedsCheckIn = checkInData?.isCheckInDay && checkInData?.goals?.some(g => g.id === goal.id)

  const daysRemaining = Math.ceil(
    (new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (editTimeoutRef.current) {
        clearTimeout(editTimeoutRef.current)
      }
    }
  }, [])

  // Sync edit state when goal data changes
  useEffect(() => {
    if (!isCardEditMode) {
      setEditedStatement(goal.goal_statement)
      setEditedCreatedAt(formatDateString(parseLocalDate(goal.created_at) || new Date()))
      setEditedTargetDate(formatDateString(parseLocalDate(goal.target_date) || new Date()))
      setEditedPrimaryMetric(goal.primary_metric)
      setEditedMetricUnit(goal.metric_unit || '')
      setEditedStartedMetric(goal.started_metric_value || '')
      setEditedCheckInValue(goal.check_in_value || '')
      setEditedCheckInDate(goal.check_in_date ? formatDateString(parseLocalDate(goal.check_in_date) || new Date()) : '')
    }
  }, [goal, isCardEditMode])

  const handleTitleClick = () => {
    setEditClickCount(prev => prev + 1)

    if (editTimeoutRef.current) {
      clearTimeout(editTimeoutRef.current)
    }

    if (editClickCount === 0) {
      // First click - set timer
      editTimeoutRef.current = setTimeout(() => {
        setEditClickCount(0)
      }, 300) // 300ms window for double click
    } else if (editClickCount === 1) {
      // Second click - enter edit mode
      setIsEditing(true)
      setEditClickCount(0)
    }
  }

  const handleSaveEdit = async () => {
    if (editedStatement.trim() && editedStatement !== goal.goal_statement) {
      try {
        await updateGoal.mutateAsync({
          id: goal.id,
          goal_statement: editedStatement.trim(),
        })
      } catch (error) {
        console.error('Error updating goal:', error)
        alert('Failed to update goal. Please try again.')
        setEditedStatement(goal.goal_statement)
      }
    }
    setIsEditing(false)
  }

  const handleSaveCardEdit = async () => {
    try {
      const updates: Record<string, unknown> = { id: goal.id }

      if (editedStatement.trim() !== goal.goal_statement) {
        updates.goal_statement = editedStatement.trim()
      }
      // For created_at (TIMESTAMPTZ): save with ISO format including time at noon
      if (editedCreatedAt !== formatDateString(parseLocalDate(goal.created_at) || new Date())) {
        updates.created_at = `${editedCreatedAt}T12:00:00+00:00`
      }
      // For target_date (DATE): save as plain YYYY-MM-DD
      if (editedTargetDate !== formatDateString(parseLocalDate(goal.target_date) || new Date())) {
        updates.target_date = editedTargetDate
      }
      if (editedPrimaryMetric !== goal.primary_metric) {
        updates.primary_metric = editedPrimaryMetric
      }
      if (editedMetricUnit !== (goal.metric_unit || '')) {
        updates.metric_unit = editedMetricUnit || null
      }
      if (editedStartedMetric !== (goal.started_metric_value || '')) {
        updates.started_metric_value = editedStartedMetric || null
      }
      if (editedCheckInValue !== (goal.check_in_value || '')) {
        updates.check_in_value = editedCheckInValue || null
      }
      // For check_in_date (DATE): save as plain YYYY-MM-DD
      if (editedCheckInDate !== (goal.check_in_date ? formatDateString(parseLocalDate(goal.check_in_date) || new Date()) : '')) {
        updates.check_in_date = editedCheckInDate || null
      }

      if (Object.keys(updates).length > 1) {
        await updateGoal.mutateAsync(updates as any)
      }
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Failed to update goal. Please try again.')
    }
    setIsCardEditMode(false)
  }

  const handleCancelCardEdit = () => {
    setEditedStatement(goal.goal_statement)
    setEditedCreatedAt(formatDateString(parseLocalDate(goal.created_at) || new Date()))
    setEditedTargetDate(formatDateString(parseLocalDate(goal.target_date) || new Date()))
    setEditedPrimaryMetric(goal.primary_metric)
    setEditedMetricUnit(goal.metric_unit || '')
    setEditedStartedMetric(goal.started_metric_value || '')
    setEditedCheckInValue(goal.check_in_value || '')
    setEditedCheckInDate(goal.check_in_date ? formatDateString(parseLocalDate(goal.check_in_date) || new Date()) : '')
    setIsCardEditMode(false)
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }
    try {
      await deleteGoal.mutateAsync(goal.id)
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Failed to delete goal. Please try again.')
    }
    setShowDeleteConfirm(false)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-900/5 border border-purple-700/30 rounded-lg p-6 animate-pulse h-40" />
    )
  }

  const completionPercentage = progress?.completion_percentage || 0
  const areaConfig = getGoalAreaConfig(goal.area as GoalAreaType)

  return (
    <div
      className={`rounded-lg p-4 transition-all duration-300 ${
        areaConfig.bgColor
      } border ${areaConfig.borderColor} hover:${areaConfig.hoverBg} hover:shadow-lg hover:shadow-${areaConfig.borderColor}/30 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-1">
              <textarea
                value={editedStatement}
                onChange={(e) => setEditedStatement(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 bg-gray-800 border border-blue-500/50 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={updateGoal.isPending}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded transition-colors"
                >
                  {updateGoal.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditedStatement(goal.goal_statement)
                  }}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h4
              onClick={handleTitleClick}
              className="font-bold text-base text-white cursor-pointer hover:text-blue-200 transition-colors duration-200 leading-snug"
              title="Click twice to edit"
            >
              {goal.goal_statement}
            </h4>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-3 ml-4">
            {!isCardEditMode && (
              <div className="text-right">
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">{completionPercentage}%</div>
                <p className="text-xs text-gray-400 font-medium leading-none">progress</p>
              </div>
            )}
            <button
              onClick={() => setIsCardEditMode(true)}
              className="p-2 hover:bg-blue-600/20 rounded transition-colors text-blue-400 hover:text-blue-300 disabled:opacity-50"
              title="Edit goal details"
            >
              <Edit2 size={18} />
            </button>
            {isCardEditMode && (
              <button
                onClick={handleDelete}
                disabled={deleteGoal.isPending}
                className="p-2 hover:bg-red-600/20 rounded transition-colors text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title={showDeleteConfirm ? 'Click again to confirm delete' : 'Delete this goal'}
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-900/20 border border-red-700/50 rounded p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-red-300">Are you sure? This cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteGoal.isPending}
              className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white rounded transition-colors disabled:cursor-not-allowed"
            >
              {deleteGoal.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}

      {/* Goal Timeline & Metrics Details */}
      {isCardEditMode ? (
        <div className="space-y-3 mb-3 pb-3 border-b border-gray-700/50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Goal Statement</label>
              <input
                type="text"
                value={editedStatement}
                onChange={(e) => setEditedStatement(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Goal</label>
              <input
                type="text"
                value={editedPrimaryMetric}
                onChange={(e) => setEditedPrimaryMetric(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Started Date</label>
              <input
                type="date"
                value={editedCreatedAt}
                onChange={(e) => setEditedCreatedAt(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Started At</label>
              <input
                type="text"
                value={editedStartedMetric}
                onChange={(e) => setEditedStartedMetric(e.target.value)}
                placeholder="Starting value"
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Goal Date</label>
              <input
                type="date"
                value={editedTargetDate}
                onChange={(e) => setEditedTargetDate(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Metric Unit</label>
              <input
                type="text"
                value={editedMetricUnit}
                onChange={(e) => setEditedMetricUnit(e.target.value)}
                placeholder="e.g., $, %, lbs"
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400">Check In Date</label>
              <input
                type="date"
                value={editedCheckInDate}
                onChange={(e) => setEditedCheckInDate(e.target.value)}
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400">Check In</label>
              <input
                type="text"
                value={editedCheckInValue}
                onChange={(e) => setEditedCheckInValue(e.target.value)}
                placeholder="Current value"
                className="w-full mt-1 px-2 py-1 bg-gray-800 border border-blue-500/50 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSaveCardEdit}
              disabled={updateGoal.isPending}
              className="flex-1 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded transition-colors"
            >
              {updateGoal.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelCardEdit}
              className="flex-1 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-2 pb-2 border-b border-gray-700/50">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Target</p>
              <p className="text-white font-medium text-sm">{format(parseLocalDate(goal.target_date) || new Date(), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Started</p>
              <p className="text-white font-medium text-sm">{format(parseLocalDate(goal.created_at) || new Date(), 'MMM d, yyyy')}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Last Check</p>
              <p className="text-white font-medium text-sm">{goal.check_in_date ? format(parseLocalDate(goal.check_in_date) || new Date(), 'MMM d, yyyy') : '—'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Goal</p>
              <p className="text-white font-medium text-sm">{goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.primary_metric)}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Started</p>
              <p className="text-white font-medium text-sm">{goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.started_metric_value)}</p>
            </div>
            <div className="bg-gray-800/50 rounded p-2 border border-gray-700/30">
              <p className="text-gray-500 text-xs uppercase tracking-tight font-semibold leading-none mb-0.5">Current</p>
              <p className="text-white font-medium text-sm">{goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.check_in_value)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Metric Progress Bar */}
        <div>
          {(() => {
            // Calculate amount paid off (started - current) for display
            const startValue = parseFloat(goal.started_metric_value?.toString().replace(/[^0-9.-]/g, '') || '0')
            const currentValue = parseFloat(goal.check_in_value?.toString().replace(/[^0-9.-]/g, '') || '0')
            const amountPaidOff = Math.max(0, startValue - currentValue)

            return (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-12 text-right">{goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.started_metric_value)}</span>
                <div className="relative flex-1">
                  <div className="relative h-3 bg-gray-700 rounded-full overflow-visible">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-300 flex items-center relative"
                      style={{ width: `${Math.min(100, completionPercentage)}%` }}
                    >
                      {/* Value inside green bar on the left - amount paid off */}
                      {completionPercentage > 15 && (
                        <span className="text-xs font-bold text-white ml-1 whitespace-nowrap">
                          {goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(amountPaidOff.toString())}
                        </span>
                      )}
                    </div>
                    {/* Progress indicator dot */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg transition-all duration-300"
                      style={{ left: `${Math.min(100, completionPercentage)}%`, transform: 'translate(-50%, -50%)' }}
                      title={`${completionPercentage}%`}
                    />
                    {/* Value in empty bar on the right - current/remaining value */}
                    {completionPercentage < 85 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-gray-300 whitespace-nowrap ml-1"
                        style={{ left: `${Math.min(100, completionPercentage) + 2}%` }}
                      >
                        {goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.check_in_value)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 w-12">{goal.metric_unit ? `${goal.metric_unit}` : ''}{formatNumberWithCommas(goal.primary_metric)}</span>
              </div>
            )
          })()}
        </div>

        {/* Time Progress Bar */}
        {goal.created_at && goal.target_date && (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-12 text-right">{format(parseLocalDate(goal.created_at) || new Date(), 'MMM d')}</span>
              <div className="relative flex-1">
                <div className="relative h-3 bg-gray-700 rounded-full overflow-visible">
                  {(() => {
                    const startDate = (parseLocalDate(goal.created_at) || new Date()).getTime()
                    const endDate = (parseLocalDate(goal.target_date) || new Date()).getTime()
                    const now = new Date().getTime()
                    const totalTime = endDate - startDate
                    const elapsedTime = Math.max(0, now - startDate)
                    const timeProgress = totalTime > 0 ? (elapsedTime / totalTime) * 100 : 0

                    return (
                      <>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-300 flex items-center relative"
                          style={{ width: `${Math.min(100, timeProgress)}%` }}
                        >
                          {/* Days elapsed in blue bar */}
                          {timeProgress > 15 && (
                            <span className="text-xs font-bold text-white ml-1 whitespace-nowrap">
                              {Math.ceil(elapsedTime / (1000 * 60 * 60 * 24))}d
                            </span>
                          )}
                        </div>
                        {/* Progress indicator dot */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-400 rounded-full border-2 border-white shadow-lg transition-all duration-300"
                          style={{ left: `${Math.min(100, timeProgress)}%`, transform: 'translate(-50%, -50%)' }}
                          title={`${daysRemaining > 0 ? `${daysRemaining}d left` : 'Overdue'}`}
                        />
                        {/* Days remaining in empty bar */}
                        {timeProgress < 85 && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 text-xs font-bold text-blue-300 whitespace-nowrap ml-1"
                            style={{ left: `${Math.min(100, timeProgress) + 2}%` }}
                          >
                            {daysRemaining > 0 ? `${daysRemaining}d` : 'Overdue'}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
              <span className="text-xs text-gray-400 w-12">{format(parseLocalDate(goal.target_date) || new Date(), 'MMM d')}</span>
            </div>
          </div>
        )}

        {progress && progress.targets_total > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-800/30 rounded px-2 py-1.5">
            <span>🔗</span>
            <span>Linked to tasks</span>
          </div>
        )}
      </div>

      {/* Monthly Trend Collapsible Section */}
      <div className={`border-t ${areaConfig.borderColor} mt-3 pt-3`}>
        <button
          onClick={() => setShowTrend(!showTrend)}
          className="flex items-center justify-between w-full text-xs font-medium text-gray-400 hover:text-white transition-colors"
        >
          <span>This Month's Trend</span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-200 ${showTrend ? 'rotate-180' : ''}`}
          />
        </button>
        {showTrend && (
          <div className="mt-2">
            <MonthlyTrendCard goalId={goal.id} />
          </div>
        )}
      </div>

      {/* Check-In Reminder */}
      {goalNeedsCheckIn && (
        <div className="border-t border-gray-700/30 mt-3 pt-3">
          <div className="bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-yellow-500/5 border border-orange-500/40 rounded-lg p-3 flex items-center justify-between hover:border-orange-500/60 transition-all duration-200">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-orange-500/20 rounded">
                <AlertCircle size={16} className="text-orange-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-orange-100 leading-none">Check-In Needed</p>
                <p className="text-xs text-orange-300/80 leading-tight">Update progress</p>
              </div>
            </div>
            {onCheckIn && (
              <button
                onClick={() => onCheckIn(goal.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded transition-all duration-200 whitespace-nowrap ml-2 shadow-lg hover:shadow-orange-500/30 hover:scale-105"
              >
                Check In
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
