import { AlertCircle } from 'lucide-react'

interface CheckInBannerProps {
  goalsCount: number
  onClick?: () => void
}

export const CheckInBanner = ({ goalsCount, onClick }: CheckInBannerProps) => {
  if (goalsCount === 0) return null

  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-r from-amber-900/40 to-amber-900/10 border border-amber-700/50 rounded-lg p-4 mb-8 cursor-pointer hover:border-amber-500 transition-colors"
    >
      <div className="flex items-center gap-3">
        <AlertCircle size={24} className="text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-100 mb-1">
            Sunday Check-In Reminder
          </h3>
          <p className="text-sm text-amber-200">
            You have {goalsCount} goal{goalsCount !== 1 ? 's' : ''} waiting for this week's check-in. Take a few minutes to reflect on your progress!
          </p>
        </div>
        <button
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onClick?.()
          }}
        >
          Check In Now
        </button>
      </div>
    </div>
  )
}
