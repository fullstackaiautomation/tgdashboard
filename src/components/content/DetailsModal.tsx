import { type FC, useState, useEffect } from 'react'
import { X, ExternalLink, Star, Clock, Edit, Trash2 } from 'lucide-react'
import type { ContentItem } from '../../types/content'
import type { Business } from '../../types/business'

// Tag color mapping
const TAG_COLORS: Record<string, string> = {
  'AI': '#1e40af', // dark blue
  'investing': '#10b981', // green
  'Full Stack AI': '#22c55e', // neon green
  'Huge Capital': '#a855f7', // purple
  'S4': '#3b82f6', // blue
  '808': '#eab308', // yellow
  'Health': '#10b981', // green
  'Claude Code': '#f97316', // orange
  'Quotes': '#ec4899', // pink
}

const getTagColor = (tag: string): string => {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  const lowerTag = tag.toLowerCase()
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (key.toLowerCase() === lowerTag) return color
  }
  return '#6b7280' // default gray
}

interface DetailsModalProps {
  isOpen: boolean
  onClose: () => void
  content: ContentItem | null
  businesses: Business[]
  onEdit: () => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<ContentItem>) => void
}

/**
 * DetailsModal - Enhanced content details view
 *
 * Features:
 * - Full AI Summary section with visual emphasis
 * - Dashboard Areas display with color-coded chips
 * - Value Rating with star visualization
 * - Complete metadata display
 * - Responsive layout
 */
export const DetailsModal: FC<DetailsModalProps> = ({
  isOpen,
  onClose,
  content,
  businesses,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingTags, setEditingTags] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])

  // Initialize tags when content changes
  useEffect(() => {
    if (content && content.tags) {
      setCurrentTags(content.tags)
    } else {
      setCurrentTags([])
    }
  }, [content?.id, content?.tags])

  if (!isOpen || !content) return null

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...currentTags, tagInput.trim()]
      setCurrentTags(newTags)
      onUpdate(content.id, { tags: newTags })
      setTagInput('')
    }
  }

  const handleRemoveTag = (indexToRemove: number) => {
    const newTags = currentTags.filter((_, index) => index !== indexToRemove)
    setCurrentTags(newTags)
    onUpdate(content.id, { tags: newTags })
  }

  // Get dashboard area details
  const getDashboardAreas = () => {
    if (!content.dashboard_areas || content.dashboard_areas.length === 0) return []

    const LIFE_AREAS: Record<string, { name: string; color: string }> = {
      Health: { name: 'Health', color: '#10b981' },
      Finance: { name: 'Finance', color: '#3b82f6' },
      Life: { name: 'Life', color: '#a855f7' },
      Golf: { name: 'Golf', color: '#eab308' },
    }

    return content.dashboard_areas.map((areaId) => {
      // Check if it's a life area
      if (LIFE_AREAS[areaId]) {
        return { id: areaId, ...LIFE_AREAS[areaId] }
      }
      // Otherwise it's a business UUID
      const business = businesses.find((b) => b.id === areaId)
      return business
        ? { id: business.id, name: business.name, color: business.color }
        : null
    }).filter(Boolean) as { id: string; name: string; color: string }[]
  }

  const dashboardAreas = getDashboardAreas()

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'To Watch':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'In Progress':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'Completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Medium':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  // Render star rating
  const renderStarRating = (rating: number | null | undefined) => {
    if (!rating) return null
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(10)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-semibold text-white">
          {rating}/10
        </span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          {/* Header with Title and Value Rating */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">
                {content.title}
              </h2>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Value Rating on top right */}
              {content.value_rating && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase mb-1">Value Rating</p>
                  {renderStarRating(content.value_rating)}
                </div>
              )}
              {!showDeleteConfirm ? (
                <>
                  <button
                    onClick={onEdit}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-lg transition-all"
                    title="Edit content"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-lg transition-all"
                    title="Delete content"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm text-red-400 font-medium">Delete this?</span>
                  <button
                    onClick={() => {
                      onDelete(content.id)
                      onClose()
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-all"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all"
                  >
                    No
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Creator and URL */}
          <div className="mb-6">
            {content.creator && (
              <p className="text-gray-400 mb-2">by {content.creator}</p>
            )}
            <a
              href={content.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              {content.url}
            </a>
          </div>

          {/* Metadata Grid - Source, Status, Priority, Time Estimate */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Source
              </p>
              <p className="text-white font-medium">{content.source}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Status
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                  content.status
                )}`}
              >
                {content.status}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Priority
              </p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(
                  content.priority
                )}`}
              >
                {content.priority}
              </span>
            </div>

            {content.time_estimate && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Time Estimate
                </p>
                <div className="flex items-center gap-1 text-white font-medium">
                  <Clock className="w-4 h-4" />
                  <span>{content.time_estimate}</span>
                </div>
              </div>
            )}
          </div>

          {/* Tags - Editable */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentTags.map((tag, i) => {
                const tagColor = getTagColor(tag)
                return (
                  <span
                    key={i}
                    className="px-3 py-1 text-white rounded-full text-sm flex items-center gap-2 group"
                    style={{
                      backgroundColor: tagColor,
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(i)}
                      className="text-white hover:text-red-200 transition-colors opacity-70 hover:opacity-100"
                      title="Remove tag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              })}
            </div>
            {/* Add new tag input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* AI Summary Section */}
          {content.ai_summary && (
            <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
                  AI Summary
                </span>
                <span className="text-xs bg-blue-500 bg-opacity-20 text-blue-400 px-2 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p className="text-gray-200 leading-relaxed italic whitespace-pre-wrap">
                {content.ai_summary}
              </p>
            </div>
          )}


          {/* Notes */}
          {content.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Notes
              </h3>
              <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {content.notes}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t border-gray-700 pt-4 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Created: {new Date(content.created_at).toLocaleDateString()}</span>
              {content.updated_at && (
                <span>Updated: {new Date(content.updated_at).toLocaleDateString()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
