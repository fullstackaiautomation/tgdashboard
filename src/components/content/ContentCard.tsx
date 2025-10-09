import { type FC, type ReactElement } from 'react'
import { Star, Clock } from 'lucide-react'
import type { ContentItem } from '../../types/content'

interface ContentCardProps {
  content: ContentItem
  onClick: () => void
  onToggleFavorite: (id: string, currentValue: boolean) => void
  getSourceIcon: (source: string) => string
  getStatusIcon: (status: string) => ReactElement
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
}

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
  // Check exact match first
  if (TAG_COLORS[tag]) {
    return TAG_COLORS[tag]
  }

  // Check case-insensitive match
  const lowerTag = tag.toLowerCase()
  for (const [key, color] of Object.entries(TAG_COLORS)) {
    if (key.toLowerCase() === lowerTag) {
      return color
    }
  }

  // Default gray color
  return '#6b7280'
}

/**
 * ContentCard - Displays a single content item in Pinterest-style grid
 *
 * Features:
 * - Thumbnail with fallback
 * - AI-generated summary display
 * - Dashboard area chips (businesses + life areas)
 * - Value rating badge
 * - Status, priority, and metadata badges
 *
 * @param content - Content item data
 * @param onClick - Handler when card is clicked
 * @param onToggleFavorite - Handler for favorite toggle
 * @param utility functions for icons and colors
 */
export const ContentCard: FC<ContentCardProps> = ({
  content,
  onClick,
  onToggleFavorite,
  getSourceIcon,
  getStatusIcon: _getStatusIcon,
  getStatusColor: _getStatusColor,
  getPriorityColor,
}) => {
  const hasAISummary = content.ai_summary && content.ai_summary.trim().length > 0

  return (
    <div
      className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden hover:shadow-xl hover:border-gray-600 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Thumbnail placeholder - always show icon for now */}
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
                  content.is_favorite
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-white'
                }`}
              />
            </button>
          </div>
        </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xl mt-0.5">{getSourceIcon(content.source)}</span>
          <h3 className="text-base font-semibold text-white line-clamp-2 flex-1">
            {content.title}
          </h3>
        </div>

        {content.creator && (
          <p className="text-sm text-gray-400 mb-2">by {content.creator}</p>
        )}

        {/* AI Summary */}
        {hasAISummary && (
          <div className="mb-3">
            <p className="text-sm text-gray-400 line-clamp-2 italic">
              {content.ai_summary}
            </p>
          </div>
        )}

        {/* Notes fallback (when no AI summary) */}
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
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(
              content.priority
            )}`}
          >
            {content.priority}
          </span>
        </div>

        {/* Tags - NEW */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {content.tags.map((tag, i) => {
              const tagColor = getTagColor(tag)
              return (
                <span
                  key={i}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{
                    backgroundColor: tagColor,
                  }}
                >
                  {tag}
                </span>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
