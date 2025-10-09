import { type FC } from 'react'
import { Star } from 'lucide-react'

interface ValueRatingInputProps {
  value: number | null
  onChange: (rating: number | null) => void
  className?: string
  readonly?: boolean
}

/**
 * ValueRatingInput - Simple number input for rating content on a 1-10 scale
 *
 * @param value - Current rating (1-10) or null for unrated
 * @param onChange - Callback when rating changes
 * @param className - Optional Tailwind classes for styling
 * @param readonly - If true, displays rating without allowing changes
 */
export const ValueRatingInput: FC<ValueRatingInputProps> = ({
  value,
  onChange,
  className = '',
  readonly = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    if (newValue === '') {
      onChange(null)
    } else {
      const num = parseInt(newValue, 10)
      if (num >= 1 && num <= 10) {
        onChange(num)
      }
    }
  }

  const getRatingColor = (rating: number | null): string => {
    if (!rating) return 'text-gray-500'
    if (rating >= 8) return 'text-yellow-400'
    if (rating >= 6) return 'text-yellow-500'
    if (rating >= 4) return 'text-orange-500'
    return 'text-gray-400'
  }

  if (readonly) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Star className={`w-5 h-5 ${getRatingColor(value)} fill-current`} />
        <span className="text-sm font-medium text-gray-200">
          {value ? `${value}/10` : 'Not rated'}
        </span>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Value Rating (1-10)
      </label>
      <input
        type="number"
        min="1"
        max="10"
        value={value || ''}
        onChange={handleInputChange}
        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="1-10"
      />
    </div>
  )
}
