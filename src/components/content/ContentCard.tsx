import { type FC, type ReactElement, useState } from 'react'
import { Star, Clock, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react'
import type { ContentItem } from '../../types/content'

interface ContentCardProps {
  content: ContentItem
  onClick: () => void
  onToggleFavorite: (id: string, currentValue: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
  getSourceIcon: (source: string) => string
  getStatusIcon: (status: string) => ReactElement
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
}

// Tag color mapping
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

/**
 * ContentCard - Displays a single content item in expandable grid card
 *
 * Features:
 * - Thumbnail with source icon
 * - Title, creator, summary display
 * - Expandable preview showing full details
 * - Quick action buttons (edit, delete, favorite)
 */
export const ContentCard: FC<ContentCardProps> = ({
  content,
  onClick,
  onToggleFavorite,
  onEdit,
  onDelete,
  getSourceIcon,
  getPriorityColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasAISummary = content.ai_summary && content.ai_summary.trim().length > 0

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden hover:shadow-xl hover:border-gray-600 transition-all">
      {/* Card Header - Clickable to expand */}
      <div
        className="cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          <span className="text-6xl opacity-20">{getSourceIcon(content.source)}</span>
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(content.id, content.is_favorite)
              }}
              className="p-1.5 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all"
            >
              <Star
                className={`w-5 h-5 ${
                  content.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-xl mt-0.5">{getSourceIcon(content.source)}</span>
            <h3 className="text-base font-semibold text-white line-clamp-2 flex-1">{content.title}</h3>
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>

          {content.creator && <p className="text-sm text-gray-400 mb-2">by {content.creator}</p>}

          {/* AI Summary */}
          {hasAISummary && (
            <div className="mb-3">
              <p className="text-sm text-gray-400 line-clamp-2 italic">{content.ai_summary}</p>
            </div>
          )}

          {/* Notes fallback */}
          {!hasAISummary && content.notes && (
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{content.notes}</p>
          )}

          {/* Time and Priority */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {content.time_estimate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-gray-700 text-gray-300">
                <Clock className="w-3 h-3" />
                Time: {content.time_estimate}
              </span>
            )}
            <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(content.priority)}`}>
              {content.priority}
            </span>
          </div>

          {/* Tags */}
          {content.tags && content.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {content.tags.map((tag, i) => {
                const tagColor = getTagColor(tag)
                return (
                  <span
                    key={i}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: tagColor }}
                  >
                    {tag}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Preview Section */}
      {isExpanded && (
        <div className="border-t border-gray-700 bg-gray-900 bg-opacity-50 px-4 py-4 space-y-3">
          {/* Full AI Summary */}
          {hasAISummary && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Full Summary</p>
              <p className="text-sm text-gray-300 leading-relaxed">{content.ai_summary}</p>
            </div>
          )}

          {/* Full Notes */}
          {content.notes && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-300 leading-relaxed">{content.notes}</p>
            </div>
          )}

          {/* Dashboard Areas */}
          {content.dashboard_areas && content.dashboard_areas.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-400 mb-2">Dashboard Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {content.dashboard_areas.map((area, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-700 text-xs font-medium text-gray-300">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-700">
            {content.folder && (
              <p>
                Folder: <span className="text-gray-400">{content.folder}</span>
              </p>
            )}
            <p>
              Added: <span className="text-gray-400">{new Date(content.saved_at).toLocaleDateString()}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Full Details
            </button>
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="px-3 py-2 bg-red-900 hover:bg-red-800 text-white rounded transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggleFavorite(content.id, content.is_favorite)
              }}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title={content.is_favorite ? 'Remove favorite' : 'Add favorite'}
            >
              <Star className={`w-4 h-4 ${content.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
