import { type FC, useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { X, ChevronDown } from 'lucide-react'

interface Business {
  id: string
  name: string
  color: string
}

interface LifeArea {
  id: string
  name: string
  color: string
}

interface DashboardAreaSelectorProps {
  selectedAreas: string[]
  onChange: (areas: string[]) => void
  className?: string
}

const LIFE_AREAS: LifeArea[] = [
  { id: 'Health', name: 'Health', color: '#10b981' },
  { id: 'Finance', name: 'Finance', color: '#3b82f6' },
  { id: 'Life', name: 'Life', color: '#a855f7' },
  { id: 'Golf', name: 'Golf', color: '#eab308' },
]

/**
 * DashboardAreaSelector - Multi-select component for tagging content with dashboard areas
 *
 * Allows users to select multiple areas from:
 * - Business entities fetched from the database
 * - Hardcoded life areas (Health, Life, Finance, Golf)
 *
 * @param selectedAreas - Array of selected area IDs (business UUIDs or life area strings)
 * @param onChange - Callback when selection changes
 * @param className - Optional Tailwind classes for styling
 */
export const DashboardAreaSelector: FC<DashboardAreaSelectorProps> = ({
  selectedAreas = [],
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch businesses from database
  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, color')
        .order('name')

      if (error) throw error
      return (data || []) as Business[]
    },
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Combine businesses and life areas
  const allAreas = [
    ...businesses.map((b) => ({ id: b.id, name: b.name, color: b.color, type: 'business' as const })),
    ...LIFE_AREAS.map((l) => ({ id: l.id, name: l.name, color: l.color, type: 'life' as const })),
  ]

  const handleToggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      onChange(selectedAreas.filter((id) => id !== areaId))
    } else {
      onChange([...selectedAreas, areaId])
    }
  }

  const handleRemoveArea = (areaId: string) => {
    onChange(selectedAreas.filter((id) => id !== areaId))
  }

  const getAreaDetails = (areaId: string) => {
    return allAreas.find((area) => area.id === areaId)
  }

  const selectedBusinesses = selectedAreas.filter((id) => businesses.some((b) => b.id === id))
  const selectedLifeAreas = selectedAreas.filter((id) => LIFE_AREAS.some((l) => l.id === id))

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Dashboard Areas
      </label>

      {/* Selected Areas Display */}
      <div className="min-h-[42px] px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
        <div className="flex flex-wrap gap-2">
          {selectedAreas.length === 0 ? (
            <span className="text-gray-500 text-sm">Select dashboard areas...</span>
          ) : (
            <>
              {/* Business chips */}
              {selectedBusinesses.map((areaId) => {
                const area = getAreaDetails(areaId)
                if (!area) return null
                return (
                  <span
                    key={areaId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border transition-colors"
                    style={{
                      backgroundColor: `${area.color}20`,
                      borderColor: area.color,
                      color: area.color,
                    }}
                  >
                    {area.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(areaId)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}

              {/* Divider if both types exist */}
              {selectedBusinesses.length > 0 && selectedLifeAreas.length > 0 && (
                <div className="w-px bg-gray-700 self-stretch mx-1" />
              )}

              {/* Life area chips */}
              {selectedLifeAreas.map((areaId) => {
                const area = getAreaDetails(areaId)
                if (!area) return null
                return (
                  <span
                    key={areaId}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border transition-colors"
                    style={{
                      backgroundColor: `${area.color}20`,
                      borderColor: area.color,
                      color: area.color,
                    }}
                  >
                    {area.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(areaId)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </>
          )}

          {/* Dropdown Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto p-1 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-10 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
          {/* Businesses Section */}
          {businesses.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Businesses
              </div>
              <div className="space-y-1">
                {businesses.map((business) => (
                  <button
                    key={business.id}
                    type="button"
                    onClick={() => handleToggleArea(business.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-left"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAreas.includes(business.id)}
                      onChange={() => {}} // Controlled by button click
                      className="rounded border-gray-600 bg-gray-900"
                      style={{ accentColor: business.color }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: business.color }}
                    />
                    <span className="text-sm text-gray-200">{business.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          {businesses.length > 0 && <div className="border-t border-gray-700 my-2" />}

          {/* Life Areas Section */}
          <div className="p-2">
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Life Areas
            </div>
            <div className="space-y-1">
              {LIFE_AREAS.map((lifeArea) => (
                <button
                  key={lifeArea.id}
                  type="button"
                  onClick={() => handleToggleArea(lifeArea.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-gray-700 transition-colors text-left"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(lifeArea.id)}
                    onChange={() => {}} // Controlled by button click
                    className="rounded border-gray-600 bg-gray-900"
                    style={{ accentColor: lifeArea.color }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: lifeArea.color }}
                  />
                  <span className="text-sm text-gray-200">{lifeArea.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
