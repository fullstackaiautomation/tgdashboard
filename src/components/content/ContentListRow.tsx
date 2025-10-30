import { type FC, useState, type ReactElement } from 'react'
import { Star, Clock, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react'
import type { ContentItem } from '../../types/content'

interface ContentListRowProps {
  content: ContentItem
  onToggleFavorite: (id: string, currentValue: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onClick: () => void
  getSourceIcon: (source: string) => string
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
}

// Tag color mapping (same as ContentCard)
const TAG_COLORS: Record<string, string> = {
  'AI': '#1e40af',
  'investing': '#10b981',
  'Full Stack AI': '#22c55e',
  'Huge Capital': '#a855f7',
  'S4': '#3b82f6',
  '808': '#eab308',
  'Health': '#10b981',
  'Claude Code': '#f97316',
  'Quotes': '#ec4899',
}

const getTagColor = (tag: string): string => {
  if (TAG_COLORS[tag]) {
    return TAG_COLORS[tag]
  }

  const lowerTag = tag.toLowerCase()
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (key.toLowerCase() === lowerTag) {
      return color
    }
  }

  return '#6b7280'
}

const getValueRatingColor = (rating: number | null): string => {
  if (!rating) return 'bg-gray-700'
  if (rating >= 4.5) return 'bg-green-900 text-green-300'
  if (rating >= 3.5) return 'bg-blue-900 text-blue-300'
  if (rating >= 2.5) return 'bg-yellow-900 text-yellow-300'
  return 'bg-red-900 text-red-300'
}

/**
 * ContentListRow - Displays a single content item in a row-based list format
 *
 * Features:
 * - Compact horizontal row layout
 * - Expandable preview section
 * - Quick action buttons (edit, delete, favorite)
 * - Status, priority, and metadata badges
 * - AI summary display on expand
 * - Inline tags
 *
 * @param content - Content item data
 * @param handlers - Various click handlers for actions
 * @param utility functions for icons and colors
 */
export const ContentListRow: FC<ContentListRowProps> = ({
  content,
  onToggleFavorite,
  onEdit,
  onDelete,
  onClick,
  getSourceIcon,
  getStatusColor,
  getPriorityColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasAISummary = content.ai_summary && content.ai_summary.trim().length > 0
  const hasNotes = content.notes && content.notes.trim().length > 0

  return (
    <>
      {/* Main Row */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg mb-3 overflow-hidden hover:border-gray-600 transition-all">
        {/* Row Header */}
        <div
          className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-750 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Expand/Collapse Icon */}
          <div className="flex-shrink-0 w-5">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Source Icon */}
          <div className="flex-shrink-0 text-2xl">
            {getSourceIcon(content.source)}
          </div>

          {/* Title and Creator */}
          <div className="flex-grow min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{content.title}</h3>
            {content.creator && (
              <p className="text-xs text-gray-400 truncate">by {content.creator}</p>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            <span className={`px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(content.status)}`}>
              {content.status}
            </span>
          </div>

          {/* Priority Badge */}
          <div className="flex-shrink-0">
            <span className={`px-2.5 py-1 rounded text-xs font-medium border ${getPriorityColor(content.priority)}`}>
              {content.priority}
            </span>
          </div>

          {/* Value Rating */}
          {content.value_rating && (
            <div className="flex-shrink-0">
              <span className={`px-2.5 py-1 rounded text-xs font-medium ${getValueRatingColor(content.value_rating)}`}>
                ⭐ {content.value_rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* Time Estimate */}
          {content.time_estimate && (
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 bg-gray-700 px-2.5 py-1 rounded">
              <Clock className="w-3 h-3" />
              {content.time_estimate}m
            </div>
          )}

          {/* Tags Preview (first 2) */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex-shrink-0 flex gap-1">
              {content.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getTagColor(tag) }}
                >
                  {tag}
                </span>
              ))}
              {content.tags.length > 2 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-700">
                  +{content.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(content.id, content.is_favorite)
            }}
            className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
            title={content.is_favorite ? 'Remove favorite' : 'Add favorite'}
          >
            <Star
              className={`w-4 h-4 ${
                content.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'
              }`}
            />
          </button>

          {/* Edit Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Edit content"
          >
            <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-400" />
          </button>

          {/* Delete Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="flex-shrink-0 p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Delete content"
          >
            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
        </div>

        {/* Expanded Preview Section */}
        {isExpanded && (
          <div className="border-t border-gray-700 bg-gray-900 bg-opacity-50 px-5 py-4 space-y-3">
            {/* AI Summary */}
            {hasAISummary && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Summary</p>
                <p className="text-sm text-gray-300 leading-relaxed">{content.ai_summary}</p>
              </div>
            )}

            {/* Notes */}
            {hasNotes && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-300 leading-relaxed">{content.notes}</p>
              </div>
            )}

            {/* All Tags */}
            {content.tags && content.tags.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Dashboard Areas */}
            {content.dashboard_areas && content.dashboard_areas.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-2">Areas</p>
                <div className="flex flex-wrap gap-2">
                  {content.dashboard_areas.map((area, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-gray-700 text-xs font-medium text-gray-300"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
              <p>URL: <span className="text-blue-400 hover:underline cursor-pointer">{content.url}</span></p>
              {content.folder && <p>Folder: <span className="text-gray-400">{content.folder}</span></p>}
              <p>Added: <span className="text-gray-400">{new Date(content.saved_at).toLocaleDateString()}</span></p>
            </div>

            {/* Open Details Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="w-full mt-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Open Full Details
            </button>
          </div>
        )}
      </div>
    </>
  )
}