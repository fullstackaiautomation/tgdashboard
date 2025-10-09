import { type FC, useState, useEffect } from 'react'
import { X, Link as LinkIcon, Loader2 } from 'lucide-react'
import type { ContentItem, ContentSource } from '../../types/content'
import { analyzeContentURL } from '../../services/aiContentAnalyzer'
import { supabase } from '../../lib/supabase'

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

interface QuickAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (content: Partial<ContentItem>) => Promise<void>
}

/**
 * QuickAddModal - Quick add content by URL with AI analysis
 *
 * Features:
 * - URL input with paste support
 * - AI content analysis (title, summary extraction)
 * - Preview before saving
 * - Editable fields
 */
export const QuickAddModal: FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [existingTags, setExistingTags] = useState<string[]>([])
  const [showTagSuggestions, setShowTagSuggestions] = useState(false)

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '',
    url: '',
    source: 'Article',
    category: 'Full Stack Development',
    ai_summary: '',
    status: 'To Watch',
    priority: 'Medium',
    tags: [],
    dashboard_areas: [],
  })

  // Fetch existing tags from database
  useEffect(() => {
    const fetchTags = async () => {
      const { data } = await supabase
        .from('content_library')
        .select('tags')

      if (data) {
        const allTags = new Set<string>()
        data.forEach(item => {
          if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach((tag: string) => allTags.add(tag))
          }
        })
        setExistingTags(Array.from(allTags).sort())
      }
    }

    if (isOpen) {
      fetchTags()
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddTag = () => {
    if (tagInput.trim() && !(formData.tags || []).includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      })
      setTagInput('')
      setShowTagSuggestions(false)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(tag => tag !== tagToRemove)
    })
  }

  const filteredSuggestions = existingTags.filter(tag =>
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !(formData.tags || []).includes(tag)
  )

  const handleAnalyze = async () => {
    if (!url.trim()) return

    setLoading(true)
    try {
      // Use AI service to analyze URL
      const analysis = await analyzeContentURL(url)

      // Detect source from domain
      const parsedUrl = new URL(url)
      let source: ContentSource = 'Article'
      if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
        source = 'YouTube'
      } else if (parsedUrl.hostname.includes('twitter.com') || parsedUrl.hostname.includes('x.com')) {
        source = 'Twitter'
      } else if (parsedUrl.hostname.includes('instagram.com')) {
        source = 'Instagram'
      } else if (parsedUrl.hostname.includes('github.com')) {
        source = 'Article'
      }

      setFormData({
        ...formData,
        url,
        source,
        title: analysis.title,
        ai_summary: analysis.ai_summary,
        creator: analysis.creator,
        time_estimate: analysis.time_estimate,
        tags: analysis.tags || [],
        dashboard_areas: analysis.dashboard_areas || [],
        value_rating: analysis.value_rating,
        thumbnail_url: analysis.thumbnail_url,
        category: formData.category || 'Full Stack Development', // Preserve category
      })
      setAnalyzed(true)
    } catch (error) {
      console.error('Error analyzing URL:', error)
      alert('Invalid URL. Please enter a valid URL.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    await onSave(formData)
    handleClose()
  }

  const handleClose = () => {
    setUrl('')
    setAnalyzed(false)
    setFormData({
      title: '',
      url: '',
      source: 'Article',
      ai_summary: '',
      status: 'To Watch',
      priority: 'Medium',
      tags: [],
      dashboard_areas: [],
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Quick Add by URL</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!analyzed ? (
            /* Step 1: URL Input */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content URL
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim() || loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Paste a URL and click Analyze to extract title and summary
                </p>
              </div>
            </div>
          ) : (
            /* Step 2: Preview & Edit */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Creator</label>
                  <input
                    type="text"
                    value={formData.creator || ''}
                    onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Author/Creator name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as ContentSource })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Website">Website</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tags
                </label>
                {/* Display existing tags */}
                {(formData.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(formData.tags || []).map((tag) => {
                      const tagColor = getTagColor(tag)
                      return (
                        <span
                          key={tag}
                          className="px-3 py-1 text-white rounded-full text-sm flex items-center gap-2"
                          style={{ backgroundColor: tagColor }}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="text-white hover:text-red-200 transition-colors opacity-70 hover:opacity-100"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
                {/* Add new tag input with autocomplete */}
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        setTagInput(e.target.value)
                        setShowTagSuggestions(e.target.value.length > 0)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {/* Autocomplete suggestions */}
                  {showTagSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.slice(0, 10).map((tag) => {
                        const tagColor = getTagColor(tag)
                        return (
                          <button
                            key={tag}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                tags: [...(formData.tags || []), tag]
                              })
                              setTagInput('')
                              setShowTagSuggestions(false)
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <span
                              className="px-2 py-0.5 rounded-full text-xs text-white"
                              style={{ backgroundColor: tagColor }}
                            >
                              {tag}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  AI Summary
                  <span className="ml-2 text-xs bg-blue-500 bg-opacity-20 text-blue-400 px-1.5 py-0.5 rounded">
                    AI
                  </span>
                </label>
                <textarea
                  value={formData.ai_summary}
                  onChange={(e) => setFormData({ ...formData, ai_summary: e.target.value })}
                  rows={9}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 italic text-sm leading-relaxed"
                  placeholder="AI-generated summary..."
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setAnalyzed(false)}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ← Back
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.title || !formData.url}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Content
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
