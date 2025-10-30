interface GoalProgressBarProps {
  progress: number // 0-100
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export const GoalProgressBar = ({ progress, showPercentage = true, size = 'md' }: GoalProgressBarProps) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100)

  const getProgressColor = (value: number) => {
    if (value >= 75) return 'bg-green-500'
    if (value >= 50) return 'bg-yellow-500'
    if (value >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }[size]

  return (
    <div>
      <div className={`w-full bg-gray-700 rounded-full overflow-hidden ${heightClass}`}>
        <div
          className={`${getProgressColor(clampedProgress)} ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-400 mt-1">{Math.round(clampedProgress)}% complete</div>
      )}
    </div>
  )
}
