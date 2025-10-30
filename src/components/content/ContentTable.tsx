import { type FC, useState, useEffect } from 'react'
import { Star, ChevronDown, ChevronUp, Edit2, Trash2, Plus, X } from 'lucide-react'
import type { ContentItem } from '../../types/content'
import { supabase } from '../../lib/supabase'

interface Agent {
  id: string
  name: string
}

interface ContentTableProps {
  contents: ContentItem[]
  onToggleFavorite: (id: string, currentValue: boolean) => void
  onEdit: (content: ContentItem) => void
  onDelete: (id: string) => void
  onOpenDetails: (content: ContentItem) => void
  onUpdateTGRating: (id: string, rating: number | null) => void
  onUpdateGoogleLLM: (id: string, value: boolean) => void
  onUpdateAgent: (id: string, agent: string | undefined) => void
  getSourceIcon: (source: string) => string
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
 * ContentTable - Displays content items in a compact table format with sticky headers
 */
export const ContentTable: FC<ContentTableProps> = ({
  contents,
  onToggleFavorite,
  onEdit,
  onDelete,
  onOpenDetails,
  onUpdateTGRating,
  onUpdateGoogleLLM,
  onUpdateAgent,
  getSourceIcon,
  getStatusColor,
  getPriorityColor,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [showAddAgentForm, setShowAddAgentForm] = useState<string | null>(null)
  const [newAgentName, setNewAgentName] = useState('')

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('agents')
        .select('id, name')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleAddAgent = async (contentId: string) => {
    if (!newAgentName.trim()) return

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('agents')
        .insert([
          {
            user_id: session.user.id,
            name: newAgentName.trim(),
          },
        ])
        .select()

      if (error) throw error

      const newAgent = data[0]
      setAgents([...agents, newAgent].sort((a, b) => a.name.localeCompare(b.name)))
      onUpdateAgent(contentId, newAgent.name)
      setNewAgentName('')
      setShowAddAgentForm(null)
    } catch (error) {
      console.error('Error adding agent:', error)
    }
  }

  if (contents.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
        <p className="text-gray-400">No content items found</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead className="sticky top-0 bg-gray-750 border-b-2 border-gray-700 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 w-8"></th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[360px] max-w-[360px]">Title</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[120px]">Platform</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[120px]">Agent</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[110px]">Value Rating</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[90px]">TG Rating</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[110px]">Google LLM</th>
              <th className="px-4 py-3 text-left text-sm font-bold text-gray-100 min-w-[180px]">Tags</th>
              <th className="px-4 py-3 text-center text-sm font-bold text-gray-100 min-w-[140px]">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {contents.map((content) => (
              <tr key={content.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                {/* Expand Button */}
                <td className="px-4 py-3 text-center align-middle">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === content.id ? null : content.id)
                    }
                    className="p-1 hover:bg-gray-700 rounded transition-colors inline-flex"
                  >
                    {expandedId === content.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </td>

                {/* Title */}
                <td className="px-4 py-3 text-sm font-medium text-white align-middle min-w-[360px] max-w-[360px] break-words">
                  {content.title}
                </td>

                {/* Platform */}
                <td className="px-4 py-3 text-sm text-gray-300 align-middle">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-lg">{getSourceIcon(content.source)}</span>
                    <span>{content.source}</span>
                  </div>
                </td>

                {/* Agent - Dropdown */}
                <td className="px-4 py-3 text-sm align-middle whitespace-nowrap">
                  {showAddAgentForm === content.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="Agent name"
                        className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddAgent(content.id)}
                      />
                      <button
                        onClick={() => handleAddAgent(content.id)}
                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddAgentForm(null)
                          setNewAgentName('')
                        }}
                        className="px-1 py-1 hover:bg-gray-700 rounded"
                      >
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 items-center">
                      <select
                        value={content.agent || ''}
                        onChange={(e) => onUpdateAgent(content.id, e.target.value || undefined)}
                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.name}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowAddAgentForm(content.id)}
                        className="px-1 py-1 hover:bg-gray-700 rounded text-gray-400 hover:text-blue-400"
                        title="Add new agent"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </td>

                {/* Value Rating */}
                <td className="px-4 py-3 text-sm text-gray-300 align-middle whitespace-nowrap">
                  {content.value_rating ? `${content.value_rating.toFixed(1)}/10` : '-'}
                </td>

                {/* TG Rating - Editable */}
                <td className="px-4 py-3 text-sm align-middle whitespace-nowrap">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={content.tg_rating || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      // Only allow numbers 1-10 or empty
                      if (val === '' || (val.match(/^\d+$/) && parseInt(val) >= 1 && parseInt(val) <= 10)) {
                        onUpdateTGRating(
                          content.id,
                          val ? parseInt(val) : null
                        )
                      }
                    }}
                    placeholder="-"
                    className="w-12 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>

                {/* Google LLM - Editable */}
                <td className="px-4 py-3 text-sm align-middle whitespace-nowrap">
                  <select
                    value={content.google_llm ? 'yes' : 'no'}
                    onChange={(e) => onUpdateGoogleLLM(content.id, e.target.value === 'yes')}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </td>

                {/* Tags (first 2) */}
                <td className="px-4 py-3 align-middle">
                  <div className="flex gap-1 flex-wrap">
                    {content.tags && content.tags.length > 0 ? (
                      <>
                        {content.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-full text-xs font-medium text-white whitespace-nowrap"
                            style={{ backgroundColor: getTagColor(tag) }}
                          >
                            {tag}
                          </span>
                        ))}
                        {content.tags.length > 2 && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium text-gray-400 bg-gray-700 whitespace-nowrap">
                            +{content.tags.length - 2}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">-</span>
                    )}
                  </div>
                </td>

                {/* Action Buttons */}
                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                    <button
                      onClick={() => onOpenDetails(content)}
                      className="p-1.5 hover:bg-blue-900 rounded transition-colors text-blue-400 hover:text-blue-300 inline-flex"
                      title="View details"
                    >
                      <span className="text-lg">👁️</span>
                    </button>
                    <button
                      onClick={() => onEdit(content)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors inline-flex"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400 hover:text-blue-400" />
                    </button>
                    <button
                      onClick={() => onDelete(content.id)}
                      className="p-1.5 hover:bg-red-900 rounded transition-colors inline-flex"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-400" />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(content.id, content.is_favorite)}
                      className="p-1.5 hover:bg-gray-700 rounded transition-colors inline-flex"
                      title={content.is_favorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          content.is_favorite
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
