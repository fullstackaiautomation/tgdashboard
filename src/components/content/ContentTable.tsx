import { type FC, useState, useEffect } from 'react'
import { Star, Edit2, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ContentItem } from '../../types/content'
import { supabase } from '../../lib/supabase'
import { parseAndFormatTags } from '../../utils/tagFormatter'

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
  onUpdateValueRating: (id: string, rating: number | null) => void
  onUpdateTGRating: (id: string, rating: number | null) => void
  onUpdateGoogleLLM: (id: string, value: boolean | null) => void
  onUpdateAgent: (id: string, agent: string | undefined) => void
  onUpdateNotes: (id: string, notes: string) => void
  onUpdateCreator: (id: string, creator: string) => void
  onUpdateStatus: (id: string, status: string) => void
  onUpdateTags: (id: string, tags: string[]) => void
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

  // Generate a consistent color from tag name using hash
  let hash = 0
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Use hash to pick from a palette of vibrant colors
  const colors = [
    '#8b5cf6', // purple
    '#10b981', // green
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#6366f1', // indigo
  ]

  return colors[Math.abs(hash) % colors.length]
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
  onUpdateValueRating,
  onUpdateTGRating,
  onUpdateGoogleLLM,
  onUpdateAgent,
  onUpdateNotes,
  onUpdateCreator,
  onUpdateStatus,
  onUpdateTags,
  getSourceIcon,
}) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [showAddAgentForm, setShowAddAgentForm] = useState<string | null>(null)
  const [newAgentName, setNewAgentName] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [editingCreatorId, setEditingCreatorId] = useState<string | null>(null)
  const [creatorValue, setCreatorValue] = useState('')
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null)
  const [statusValue, setStatusValue] = useState('')
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null)
  const [tagsValue, setTagsValue] = useState('')

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
              <th className="px-3 py-3 text-left text-sm font-bold text-gray-100 min-w-[150px] max-w-[300px]">Title</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-12">Platform</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-24">Creator</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-20">Value</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-16">TG</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-24">Notebook</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-40">Agent</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-24">Added</th>
              <th className="px-2 py-3 text-center text-sm font-bold text-gray-100 w-24">Actions</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {contents.map((content) => (
              <>
              <tr key={content.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                {/* Title */}
                <td className="px-3 py-3 font-medium align-middle break-words min-w-[150px] max-w-[300px]">
                  <div className="text-white line-clamp-2 block mb-2 text-base">
                    {content.title}
                  </div>
                  {/* Tags under title */}
                  {editingTagsId === content.id ? (
                    <input
                      type="text"
                      value={tagsValue}
                      onChange={(e) => setTagsValue(e.target.value)}
                      onBlur={() => {
                        const newTags = parseAndFormatTags(tagsValue)
                        onUpdateTags(content.id, newTags)
                        setEditingTagsId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const newTags = parseAndFormatTags(tagsValue)
                          onUpdateTags(content.id, newTags)
                          setEditingTagsId(null)
                        } else if (e.key === 'Escape') {
                          setEditingTagsId(null)
                        }
                      }}
                      placeholder="Enter tags separated by commas"
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 mt-1"
                      autoFocus
                    />
                  ) : (
                    <div
                      className="flex gap-1 flex-wrap mt-1 cursor-pointer group"
                      onClick={() => {
                        setEditingTagsId(content.id)
                        setTagsValue(content.tags?.join(', ') || '')
                      }}
                      title="Click to edit tags"
                    >
                      {content.tags && content.tags.length > 0 ? (
                        [...content.tags].sort((a, b) => a.localeCompare(b)).map((tag, i) => {
                          // Agent rule overrides AI rule
                          const tagLower = tag.toLowerCase();
                          let bgColor;
                          if (tagLower.includes('agent')) {
                            bgColor = '#991b1b'; // red-800 (darker/less bright)
                          } else if (tagLower.includes('ai')) {
                            bgColor = '#2563eb'; // blue-600
                          } else {
                            bgColor = getTagColor(tag);
                          }

                          return (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded-full text-xs font-medium text-white group-hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: bgColor, opacity: 0.75 }}
                            >
                              {tag}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500 italic group-hover:text-gray-400">Click to add tags...</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Platform - Icon Only */}
                <td className="px-2 py-3 text-center align-middle">
                  <a
                    href={content.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-2xl hover:opacity-70 transition-opacity inline-block"
                    style={content.source === 'YouTube' ? { color: '#FF0000' } : {}}
                    title="Open link"
                  >
                    {getSourceIcon(content.source)}
                  </a>
                </td>

                {/* Creator - Editable */}
                <td className="px-2 py-3 text-sm align-middle text-center max-w-[96px]">
                  {editingCreatorId === content.id ? (
                    <input
                      type="text"
                      value={creatorValue}
                      onChange={(e) => setCreatorValue(e.target.value)}
                      onBlur={() => {
                        if (creatorValue !== content.creator) {
                          onUpdateCreator(content.id, creatorValue)
                        }
                        setEditingCreatorId(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (creatorValue !== content.creator) {
                            onUpdateCreator(content.id, creatorValue)
                          }
                          setEditingCreatorId(null)
                        } else if (e.key === 'Escape') {
                          setEditingCreatorId(null)
                        }
                      }}
                      className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => {
                        setEditingCreatorId(content.id)
                        setCreatorValue(content.creator || '')
                      }}
                      className="block cursor-pointer hover:bg-gray-700 px-2 py-1 rounded transition-colors text-gray-300 break-words"
                    >
                      {content.creator || <span className="text-gray-500 italic">Click to add</span>}
                    </span>
                  )}
                </td>

                {/* Value Rating (AI) - Editable */}
                <td className="px-2 py-3 text-sm align-middle text-center">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="1"
                    max="10"
                    value={content.value_rating ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        onUpdateValueRating(content.id, null)
                        return
                      }

                      const num = Number(val)
                      if (!Number.isNaN(num) && num >= 1 && num <= 10) {
                        const rounded = Math.round(num * 10) / 10
                        onUpdateValueRating(content.id, rounded)
                      }
                    }}
                    placeholder="-"
                    className="w-12 px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                {/* TG Rating - Editable */}
                <td className="px-2 py-3 text-sm align-middle text-center">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="10"
                    step="1"
                    value={content.tg_rating ?? ''}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '') {
                        onUpdateTGRating(content.id, null)
                        return
                      }

                      const num = Number(val)
                      if (!Number.isNaN(num) && num >= 1 && num <= 10) {
                        onUpdateTGRating(content.id, Math.round(num))
                      }
                    }}
                    placeholder="-"
                    className="w-12 px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                {/* Notebook (formerly Google LLM) - Editable */}
                <td className="px-2 py-3 text-sm align-middle text-center">
                  <select
                    key={`notebook-${content.id}-${content.google_llm}`}
                    value={
                      content.google_llm === true
                        ? 'yes'
                        : content.google_llm === false
                        ? 'no'
                        : content.google_llm === null
                        ? 'should'
                        : 'no'
                    }
                    onChange={async (e) => {
                      e.stopPropagation();
                      const value = e.target.value;
                      console.log('Notebook dropdown changed:', value, 'for content:', content.id);
                      if (value === 'yes') {
                        await onUpdateGoogleLLM(content.id, true);
                      } else if (value === 'should') {
                        await onUpdateGoogleLLM(content.id, null);
                      } else {
                        await onUpdateGoogleLLM(content.id, false);
                      }
                    }}
                    className="px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                    <option value="should">Should</option>
                  </select>
                </td>

                {/* Agent - Dropdown */}
                <td className="px-2 py-3 text-sm align-middle text-center">
                  {showAddAgentForm === content.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="Agent"
                        className="w-16 px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddAgent(content.id)}
                        autoFocus
                      />
                      <button
                        onClick={() => handleAddAgent(content.id)}
                        className="px-1 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                      >
                        ✓
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
                    <select
                      value={content.agent || ''}
                      onChange={(e) => {
                        if (e.target.value === '__create_new__') {
                          setShowAddAgentForm(content.id)
                        } else {
                          onUpdateAgent(content.id, e.target.value || undefined)
                        }
                      }}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.name}>
                          {agent.name}
                        </option>
                      ))}
                      <option value="__create_new__" className="text-blue-400 font-semibold">+ Create Agent</option>
                    </select>
                  )}
                </td>

                {/* Date Added */}
                <td className="px-2 py-3 text-xs text-gray-400 text-center align-middle">
                  {content.created_at ? new Date(content.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                </td>

                {/* Action Buttons */}
                <td className="px-2 py-3 text-center align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === content.id ? null : content.id)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors inline-flex"
                      title="Toggle details"
                    >
                      {expandedId === content.id ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => onToggleFavorite(content.id, content.is_favorite)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors inline-flex"
                      title={content.is_favorite ? 'Remove favorite' : 'Add favorite'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          content.is_favorite
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>
                </td>
              </tr>

              {/* Expanded Details Row */}
              {expandedId === content.id && (
                <tr className="bg-gray-750 border-b border-gray-700">
                  <td colSpan={9} className="px-3 py-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      {/* Single Row: Time, AI Rating, Status, Edit/Delete */}
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-700">
                        {/* Left: Time, AI Rating, Status */}
                        <div className="flex gap-6 text-xs">
                          <div>
                            <span className="text-gray-500">Time:</span>
                            <span className="text-gray-300 ml-2 font-medium">{content.time_estimate || '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">AI Rating:</span>
                            <span className="text-gray-300 ml-2 font-medium">{content.value_rating ? Math.round(content.value_rating) : '-'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Status:</span>
                            {editingStatusId === content.id ? (
                              <select
                                value={statusValue}
                                onChange={(e) => {
                                  setStatusValue(e.target.value)
                                  onUpdateStatus(content.id, e.target.value)
                                  setEditingStatusId(null)
                                }}
                                onBlur={() => setEditingStatusId(null)}
                                className="ml-2 px-2 py-0.5 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="To Watch">To Watch</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Implementing">Implementing</option>
                                <option value="Archived">Archived</option>
                                <option value="Vault">Vault</option>
                              </select>
                            ) : (
                              <span
                                onClick={() => {
                                  setEditingStatusId(content.id)
                                  setStatusValue(content.status)
                                }}
                                className="ml-2 font-medium cursor-pointer hover:bg-gray-700 px-2 py-0.5 rounded transition-colors text-gray-300"
                              >
                                {content.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Edit/Delete Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEdit(content)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(content.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Two Column Layout: AI Summary and Notes */}
                      <div className="grid grid-cols-2 gap-6">
                        {/* AI Summary Section - Left Column */}
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">AI Summary</h4>
                          <div className="text-sm text-gray-300 leading-relaxed min-h-[120px] max-h-[400px] overflow-y-auto pr-2">
                            {content.ai_summary ? (
                              (() => {
                                // Check if content contains bullet points (lines starting with • or -)
                                const lines = content.ai_summary.split('\n').filter(line => line.trim());
                                const hasBullets = lines.some(line => line.trim().match(/^[•\-\*]/));

                                if (hasBullets) {
                                  return (
                                    <ul className="list-disc list-inside space-y-1">
                                      {lines.map((line, i) => {
                                        const cleanLine = line.trim().replace(/^[•\-\*]\s*/, '');
                                        return cleanLine ? <li key={i}>{cleanLine}</li> : null;
                                      })}
                                    </ul>
                                  );
                                }
                                return content.ai_summary;
                              })()
                            ) : (
                              <span className="text-gray-500 italic">No AI summary available</span>
                            )}
                          </div>
                        </div>

                        {/* Notes Section - Right Column - Editable */}
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-3">Notes</h4>
                          {editingNotesId === content.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                className="w-full min-h-[120px] max-h-[400px] px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                placeholder="Add notes..."
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    onUpdateNotes(content.id, notesValue)
                                    setEditingNotesId(null)
                                  }}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNotesId(null)
                                    setNotesValue('')
                                  }}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingNotesId(content.id)
                                setNotesValue(content.notes || '')
                              }}
                              className="text-sm text-gray-300 leading-relaxed min-h-[120px] max-h-[400px] overflow-y-auto pl-2 cursor-pointer hover:bg-gray-750 rounded p-2 transition-colors"
                            >
                              {content.notes || <span className="text-gray-500 italic">Click to add notes...</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
