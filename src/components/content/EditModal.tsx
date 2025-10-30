import { type FC, useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { ContentItem, ContentSource, ContentCategory, ContentStatus, ContentPriority } from '../../types/content'
import type { Business } from '../../types/business'

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  content: ContentItem | null
  businesses: Business[]
  onSave: (id: string, updates: Partial<ContentItem>) => void
}

const LIFE_AREAS = ['Health', 'Finance', 'Life', 'Golf']
const SOURCES = ['Article', 'Video', 'Course', 'Documentation', 'Tutorial', 'Podcast', 'Book', 'Other']
const STATUSES = ['To Watch', 'In Progress', 'Completed', 'Archived']
const PRIORITIES = ['Low', 'Medium', 'High']
const CATEGORIES = [
  'Full Stack Development',
  'Front-End Development',
  'Back-End Development',
  'DevOps & Cloud',
  'Data & Analytics',
  'Mobile Development',
  'AI & Machine Learning',
  'Career & Growth',
  'Business & Strategy',
  'Tools & Productivity',
  'Other'
]

export const EditModal: FC<EditModalProps> = ({
  isOpen,
  onClose,
  content,
  businesses,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<ContentItem>>({})

  useEffect(() => {
    if (content) {
      setFormData({
        title: content.title,
        url: content.url,
        source: content.source,
        category: content.category,
        ai_summary: content.ai_summary,
        status: content.status,
        priority: content.priority,
        tags: content.tags || [],
        dashboard_areas: content.dashboard_areas || [],
        value_rating: content.value_rating,
        time_estimate: content.time_estimate,
        creator: content.creator,
      })
    }
  }, [content])

  if (!isOpen || !content) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(content.id, formData)
    onClose()
  }

  const toggleDashboardArea = (areaId: string) => {
    const current = formData.dashboard_areas || []
    const updated = current.includes(areaId)
      ? current.filter(id => id !== areaId)
      : [...current, areaId]
    setFormData({ ...formData, dashboard_areas: updated })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Edit Content</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">URL</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* AI Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">AI Summary</label>
            <textarea
              value={formData.ai_summary || ''}
              onChange={(e) => setFormData({ ...formData, ai_summary: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Source & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Source</label>
              <select
                value={formData.source || ''}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as ContentSource })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ContentCategory })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={formData.status || ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={formData.priority || ''}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as ContentPriority })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PRIORITIES.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Creator & Time Estimate */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Creator</label>
              <input
                type="text"
                value={formData.creator || ''}
                onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Time Estimate</label>
              <input
                type="text"
                value={formData.time_estimate || ''}
                onChange={(e) => setFormData({ ...formData, time_estimate: e.target.value })}
                placeholder="e.g., 5 min, 1 hour"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Value Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Value Rating (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.value_rating || 5}
              onChange={(e) => setFormData({ ...formData, value_rating: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dashboard Areas */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Dashboard Areas</label>
            <div className="space-y-3">
              {/* Life Areas */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Life Areas</p>
                <div className="flex flex-wrap gap-2">
                  {LIFE_AREAS.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleDashboardArea(area)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        (formData.dashboard_areas || []).includes(area)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Businesses */}
              {businesses.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Businesses</p>
                  <div className="flex flex-wrap gap-2">
                    {businesses.map(business => (
                      <button
                        key={business.id}
                        type="button"
                        onClick={() => toggleDashboardArea(business.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          (formData.dashboard_areas || []).includes(business.id)
                            ? 'text-white'
                            : 'text-gray-300 hover:opacity-80'
                        }`}
                        style={{
                          backgroundColor: (formData.dashboard_areas || []).includes(business.id)
                            ? business.color
                            : '#374151'
                        }}
                      >
                        {business.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={(formData.tags || []).join(', ')}
              onChange={(e) => setFormData({
                ...formData,
                tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
              })}
              placeholder="react, typescript, tutorial"
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
