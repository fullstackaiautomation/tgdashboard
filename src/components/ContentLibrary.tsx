import { useState, useEffect, type ReactElement } from 'react'
import { supabase } from '../lib/supabase'
import type {
  ContentItem,
  ContentSource,
  ContentCategory,
  ContentStatus,
  ContentPriority,
  ContentFilter,
} from '../types/content'
import {
  Search,
  Plus,
  Filter,
  Star,
  ExternalLink,
  BookmarkPlus,
  CheckCircle2,
  PlayCircle,
  Archive,
  TrendingUp,
  X,
  Loader2,
} from 'lucide-react'
import { DashboardAreaSelector } from './content/DashboardAreaSelector'
import { ValueRatingInput } from './content/ValueRatingInput'
import { AgentSelector } from './content/AgentSelector'
import { ContentCard } from './content/ContentCard'
import { ContentTable } from './content/ContentTable'
import { QuickAddModal } from './content/QuickAddModal'
import { DetailsModal } from './content/DetailsModal'
import { EditModal } from './content/EditModal'
import { useQuery } from '@tanstack/react-query'
import type { Business } from '../types/business'
import { analyzeContentURL } from '../services/aiContentAnalyzer'
import { parseAndFormatTags } from '../utils/tagFormatter'

const ContentLibrary = () => {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')

  // Fetch businesses for dashboard areas
  const { data: businesses = [] } = useQuery<Business[]>({
    queryKey: ['businesses'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return []

      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      return data || []
    },
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState<'saved_at' | 'priority' | 'title' | 'status' | 'value_rating'>('saved_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [aiAnalyzing, setAiAnalyzing] = useState(false)

  const [filters, setFilters] = useState<ContentFilter>({
    source: [],
    category: [],
    status: [],
    priority: [],
    tags: [],
    folder: undefined,
    searchTerm: '',
    isFavorite: undefined,
    dashboardAreas: [],
    minValueRating: null,
  })

  const [formData, setFormData] = useState<Partial<ContentItem>>({
    title: '',
    url: '',
    source: 'Website',
    category: 'Full Stack Development',
    status: 'To Watch',
    priority: 'Medium',
    notes: '',
    ai_summary: '',
    tags: [],
    dashboard_areas: [],
    value_rating: null,
    tg_rating: null,
    google_llm: false,
    agent: '',
    is_favorite: false,
  })
  const [_thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('')

  useEffect(() => {
    fetchContents()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [contents, searchTerm, filters, sortBy, sortOrder])

  const fetchContents = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('content_library')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error fetching contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...contents]

    // Search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.creator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      filtered = filtered.filter((item) => filters.source!.includes(item.source))
    }

    // Category filter
    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((item) => filters.category!.includes(item.category))
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((item) => filters.status!.includes(item.status))
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((item) => filters.priority!.includes(item.priority))
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((item) =>
        filters.tags!.some((tag) => item.tags.includes(tag))
      )
    }

    // Favorite filter
    if (filters.isFavorite !== undefined) {
      filtered = filtered.filter((item) => item.is_favorite === filters.isFavorite)
    }

    // Folder filter
    if (filters.folder) {
      filtered = filtered.filter((item) => item.folder === filters.folder)
    }

    // Dashboard Areas filter
    if (filters.dashboardAreas && filters.dashboardAreas.length > 0) {
      filtered = filtered.filter((item) =>
        item.dashboard_areas?.some((area) => filters.dashboardAreas!.includes(area))
      )
    }

    // Value Rating filter
    if (filters.minValueRating) {
      filtered = filtered.filter(
        (item) => item.value_rating && item.value_rating >= filters.minValueRating!
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'saved_at':
          comparison = new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime()
          break
        case 'priority':
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'value_rating':
          const aRating = a.value_rating || 0
          const bRating = b.value_rating || 0
          comparison = aRating - bRating
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredContents(filtered)
  }

  const handleAnalyzeWithAI = async () => {
    if (!formData.url) {
      alert('Please enter a URL first')
      return
    }

    setAiAnalyzing(true)
    try {
      const analysis = await analyzeContentURL(formData.url)

      // Merge AI analysis with existing form data
      setFormData({
        ...formData,
        title: analysis.title || formData.title,
        ai_summary: analysis.ai_summary || formData.ai_summary,
        creator: analysis.creator || formData.creator,
        time_estimate: analysis.time_estimate || formData.time_estimate,
        tags: analysis.tags && analysis.tags.length > 0 ? analysis.tags : formData.tags,
        value_rating: analysis.value_rating !== undefined ? analysis.value_rating : formData.value_rating,
        thumbnail_url: analysis.thumbnail_url || formData.thumbnail_url,
      })
    } catch (error) {
      console.error('Error analyzing content:', error)
      alert('Failed to analyze content. Please try again.')
    } finally {
      setAiAnalyzing(false)
    }
  }

  const handleAddContent = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return

      const newContent = {
        ...formData,
        user_id: session.user.id,
        saved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('content_library')
        .insert([newContent])
        .select()

      if (error) throw error
      setContents([...contents, data[0]])
      setShowAddModal(false)
      resetForm()
    } catch (error) {
      console.error('Error adding content:', error)
    }
  }

  const handleSaveEdit = async () => {
    if (!formData.id) return

    try {
      const updates = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('content_library')
        .update(updates)
        .eq('id', formData.id)

      if (error) throw error

      setContents(contents.map((c) => (c.id === formData.id ? { ...c, ...updates } : c)))
      setShowEditModal(false)
      resetForm()
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleUpdateContent = async (id: string, updates: Partial<ContentItem>) => {
    try {
      const { error } = await supabase
        .from('content_library')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setContents(contents.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    } catch (error) {
      console.error('Error updating content:', error)
    }
  }

  const handleToggleFavorite = async (id: string, currentValue: boolean) => {
    await handleUpdateContent(id, { is_favorite: !currentValue })
  }

  const handleUpdateValueRating = async (id: string, rating: number | null) => {
    await handleUpdateContent(id, { value_rating: rating })
  }

  const handleUpdateTGRating = async (id: string, rating: number | null) => {
    await handleUpdateContent(id, { tg_rating: rating })
  }

  const handleUpdateGoogleLLM = async (id: string, value: boolean | null) => {
    await handleUpdateContent(id, { google_llm: value || false })
  }

  const handleUpdateAgent = async (id: string, agent: string | undefined) => {
    await handleUpdateContent(id, { agent: agent || undefined })
  }

  const handleUpdateNotes = async (id: string, notes: string) => {
    await handleUpdateContent(id, { notes })
  }

  const handleUpdateCreator = async (id: string, creator: string) => {
    await handleUpdateContent(id, { creator })
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await handleUpdateContent(id, { status: status as ContentStatus })
  }

  const handleUpdateTags = async (id: string, tags: string[]) => {
    await handleUpdateContent(id, { tags })
  }

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    setThumbnailFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setThumbnailPreview(base64String)
      setFormData({ ...formData, thumbnail_url: base64String })
    }
    reader.readAsDataURL(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile()
        if (file) {
          handleImageUpload(file)
        }
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (files && files[0]) {
      handleImageUpload(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      source: 'Website',
      category: 'Full Stack Development',
      status: 'To Watch',
      priority: 'Medium',
      notes: '',
      tags: [],
      dashboard_areas: [],
      value_rating: null,
      tg_rating: null,
      google_llm: false,
      agent: '',
      is_favorite: false,
    })
    setThumbnailFile(null)
    setThumbnailPreview('')
  }

  const getSourceIcon = (source: string): string => {
    const icons: Record<string, string> = {
      Twitter: '𝕏',
      YouTube: '▶',
      Instagram: '📷',
      Website: '🌐',
      Other: '🔗',
    }
    return icons[source] || '🌐'
  }

  const getStatusIcon = (status: string): ReactElement => {
    switch (status) {
      case 'To Watch':
        return <BookmarkPlus className="w-4 h-4" />
      case 'In Progress':
        return <PlayCircle className="w-4 h-4" />
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4" />
      case 'Implementing':
        return <TrendingUp className="w-4 h-4" />
      case 'Archived':
        return <Archive className="w-4 h-4" />
      case 'Vault':
        return <BookmarkPlus className="w-4 h-4" />
      default:
        return <BookmarkPlus className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: ContentPriority): string => {
    switch (priority) {
      case 'High':
        return 'bg-red-900 text-red-300 border-red-700'
      case 'Medium':
        return 'bg-yellow-900 text-yellow-300 border-yellow-700'
      case 'Low':
        return 'bg-green-900 text-green-300 border-green-700'
      default:
        return 'bg-gray-900 text-gray-300 border-gray-700'
    }
  }

  const getStatusColor = (status: ContentStatus): string => {
    switch (status) {
      case 'To Watch':
        return 'bg-blue-900 text-blue-300'
      case 'In Progress':
        return 'bg-purple-900 text-purple-300'
      case 'Completed':
        return 'bg-green-900 text-green-300'
      case 'Implementing':
        return 'bg-orange-900 text-orange-300'
      case 'Archived':
        return 'bg-gray-700 text-gray-300'
      case 'Vault':
        return 'bg-indigo-900 text-indigo-300'
      default:
        return 'bg-gray-900 text-gray-300'
    }
  }


  // Stats
  const stats = {
    total: contents.length,
    toWatch: contents.filter((c) => c.status === 'To Watch').length,
    inProgress: contents.filter((c) => c.status === 'In Progress').length,
    completed: contents.filter((c) => c.status === 'Completed').length,
    favorites: contents.filter((c) => c.is_favorite).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading your content library...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto px-6 py-6 space-y-6" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Content Library</h1>
          <p className="text-gray-400 mt-1">
            Your personal knowledge base of learning resources
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickAddModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            Quick Add URL
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Content
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-sm text-gray-400">Total Items</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-blue-600">
          <div className="text-2xl font-bold text-blue-400">{stats.toWatch}</div>
          <div className="text-sm text-blue-300">To Watch</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-purple-600">
          <div className="text-2xl font-bold text-purple-400">{stats.inProgress}</div>
          <div className="text-sm text-purple-300">In Progress</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-green-600">
          <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
          <div className="text-sm text-green-300">Completed</div>
        </div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-yellow-600">
          <div className="text-2xl font-bold text-yellow-400">{stats.favorites}</div>
          <div className="text-sm text-yellow-300">Favorites</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title, notes, creator, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="saved_at">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
            <option value="value_rating">Sort by Value Rating</option>
            <option value="title">Sort by Title</option>
            <option value="status">Sort by Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-700"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
          <div className="flex gap-2 border border-gray-700 rounded-lg bg-gray-900 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Grid view"
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Table view"
            >
              ≡
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4">
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
              <div className="space-y-2">
                {(['Twitter', 'YouTube', 'Instagram', 'Article', 'Podcast', 'Video', 'Book', 'Course', 'Other'] as ContentSource[]).map(
                  (source) => (
                    <label key={source} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.source?.includes(source)}
                        onChange={(e) => {
                          const newSources = e.target.checked
                            ? [...(filters.source || []), source]
                            : filters.source?.filter((s) => s !== source) || []
                          setFilters({ ...filters, source: newSources })
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        {getSourceIcon(source)} {source}
                      </span>
                    </label>
                  )
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {([
                  'Full Stack Development',
                  'AI Build',
                  'Business & Entrepreneurship',
                  'Finance & Investing',
                  'Marketing & Sales',
                  'Personal Development',
                  'Health & Fitness',
                  'Golf',
                  'Productivity',
                  'Design',
                  'Leadership',
                  'Other',
                ] as ContentCategory[]).map((category) => (
                  <label key={category} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={filters.category?.includes(category)}
                      onChange={(e) => {
                        const newCategories = e.target.checked
                          ? [...(filters.category || []), category]
                          : filters.category?.filter((c) => c !== category) || []
                        setFilters({ ...filters, category: newCategories })
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status & Priority Filter */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {(['To Watch', 'In Progress', 'Completed', 'Implementing', 'Archived', 'Vault'] as ContentStatus[]).map(
                    (status) => (
                      <label key={status} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.status?.includes(status)}
                          onChange={(e) => {
                            const newStatuses = e.target.checked
                              ? [...(filters.status || []), status]
                              : filters.status?.filter((s) => s !== status) || []
                            setFilters({ ...filters, status: newStatuses })
                          }}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="space-y-2">
                  {(['High', 'Medium', 'Low'] as ContentPriority[]).map((priority) => (
                    <label key={priority} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={filters.priority?.includes(priority)}
                        onChange={(e) => {
                          const newPriorities = e.target.checked
                            ? [...(filters.priority || []), priority]
                            : filters.priority?.filter((p) => p !== priority) || []
                          setFilters({ ...filters, priority: newPriorities })
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.isFavorite === true}
                    onChange={(e) => {
                      setFilters({ ...filters, isFavorite: e.target.checked ? true : undefined })
                    }}
                    className="rounded border-gray-300"
                  />
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Favorites Only</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content Grid - Pinterest Style */}
      {filteredContents.length === 0 ? (
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-12 text-center">
          <BookmarkPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
          <p className="text-gray-400 mb-4">
            {searchTerm || Object.values(filters).some((f) => f && (Array.isArray(f) ? f.length > 0 : true))
              ? 'Try adjusting your filters or search term'
              : 'Start building your knowledge base by adding your first piece of content'}
          </p>
          {!searchTerm && !Object.values(filters).some((f) => f && (Array.isArray(f) ? f.length > 0 : true)) && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First Content
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="masonry-grid">
          {filteredContents.map((content) => (
            <div key={content.id} className="masonry-item">
              <ContentCard
                content={content}
                onClick={() => {
                  setSelectedContent(content)
                  setShowDetailsModal(true)
                }}
                onToggleFavorite={handleToggleFavorite}
                onEdit={() => {
                  setSelectedContent(content)
                  setFormData(content)
                  setShowEditModal(true)
                }}
                onDelete={async () => {
                  if (confirm('Are you sure you want to delete this content?')) {
                    try {
                      const { error } = await supabase
                        .from('content_library')
                        .delete()
                        .eq('id', content.id)
                      if (error) throw error
                      setContents(contents.filter((c) => c.id !== content.id))
                    } catch (error) {
                      console.error('Error deleting content:', error)
                    }
                  }
                }}
                getSourceIcon={getSourceIcon}
                getStatusIcon={(status: string) => getStatusIcon(status as ContentStatus)}
                getStatusColor={(status: string) => getStatusColor(status as ContentStatus)}
                getPriorityColor={(priority: string) => getPriorityColor(priority as ContentPriority)}
              />
            </div>
          ))}
        </div>
      ) : (
        // Table View
        <ContentTable
          contents={filteredContents}
          onToggleFavorite={handleToggleFavorite}
          onEdit={(content) => {
            setSelectedContent(content)
            setFormData(content)
            setShowEditModal(true)
          }}
          onDelete={async (id) => {
            if (confirm('Are you sure you want to delete this content?')) {
              try {
                const { error } = await supabase
                  .from('content_library')
                  .delete()
                  .eq('id', id)
                if (error) throw error
                setContents(contents.filter((c) => c.id !== id))
              } catch (error) {
                console.error('Error deleting content:', error)
              }
            }
          }}
          onOpenDetails={(content) => {
            setSelectedContent(content)
            setShowDetailsModal(true)
          }}
          onUpdateValueRating={handleUpdateValueRating}
          onUpdateTGRating={handleUpdateTGRating}
          onUpdateGoogleLLM={handleUpdateGoogleLLM}
          onUpdateAgent={handleUpdateAgent}
          onUpdateNotes={handleUpdateNotes}
          onUpdateCreator={handleUpdateCreator}
          onUpdateStatus={handleUpdateStatus}
          onUpdateTags={handleUpdateTags}
          getSourceIcon={getSourceIcon}
          getStatusColor={(status: string) => getStatusColor(status as ContentStatus)}
          getPriorityColor={(priority: string) => getPriorityColor(priority as ContentPriority)}
        />
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Add New Content</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter content title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      disabled={!formData.url || aiAnalyzing}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      {aiAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          Analyze with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail Image</label>
                  <div
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full px-3 py-4 bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-40 object-cover rounded" />
                        <button
                          onClick={() => {
                            setThumbnailFile(null)
                            setThumbnailPreview('')
                            setFormData({ ...formData, thumbnail_url: undefined })
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-2">Drag & drop image, paste, or click to upload</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                          }}
                          className="hidden"
                          id="thumbnail-upload-add"
                        />
                        <label
                          htmlFor="thumbnail-upload-add"
                          className="inline-block px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Platform
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) =>
                        setFormData({ ...formData, source: e.target.value as ContentSource })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Website">Website</option>
                      <option value="Twitter">Twitter</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as ContentCategory })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Full Stack Development">Full Stack Development</option>
                      <option value="AI Build">AI Build</option>
                      <option value="Business & Entrepreneurship">
                        Business & Entrepreneurship
                      </option>
                      <option value="Finance & Investing">Finance & Investing</option>
                      <option value="Marketing & Sales">Marketing & Sales</option>
                      <option value="Personal Development">Personal Development</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                      <option value="Golf">Golf</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Design">Design</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as ContentStatus })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="To Watch">To Watch</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Implementing">Implementing</option>
                      <option value="Archived">Archived</option>
                      <option value="Vault">Vault</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value as ContentPriority })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.time_to_consume || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time_to_consume: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>

                  <ValueRatingInput
                    value={formData.value_rating || null}
                    onChange={(rating) => setFormData({ ...formData, value_rating: rating })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      TG Rating (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.tg_rating || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tg_rating: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Google LLM
                    </label>
                    <select
                      value={formData.google_llm ? 'yes' : 'no'}
                      onChange={(e) =>
                        setFormData({ ...formData, google_llm: e.target.value === 'yes' })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Creator</label>
                  <input
                    type="text"
                    value={formData.creator || ''}
                    onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Author, YouTuber, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Agent</label>
                  <AgentSelector
                    selectedAgent={formData.agent}
                    onChange={(agent) => setFormData({ ...formData, agent })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: parseAndFormatTags(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="react, typescript, tutorial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Folder</label>
                  <input
                    type="text"
                    value={formData.folder || ''}
                    onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional folder name"
                  />
                </div>

                <DashboardAreaSelector
                  selectedAreas={formData.dashboard_areas || []}
                  onChange={(areas) => setFormData({ ...formData, dashboard_areas: areas })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">AI Summary</label>
                  <textarea
                    value={formData.ai_summary || ''}
                    onChange={(e) => setFormData({ ...formData, ai_summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 italic"
                    placeholder="AI-generated summary will appear here, or add your own..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled by AI or manually entered</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this content..."
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_favorite}
                      onChange={(e) =>
                        setFormData({ ...formData, is_favorite: e.target.checked })
                      }
                      className="rounded border-gray-600"
                    />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">Mark as favorite</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddContent}
                  disabled={!formData.title || !formData.url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Content
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Content Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Content</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter content title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">URL *</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://..."
                    />
                    <button
                      type="button"
                      onClick={handleAnalyzeWithAI}
                      disabled={!formData.url || aiAnalyzing}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                      {aiAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          Analyze with AI
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Thumbnail Image</label>
                  <div
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="w-full px-3 py-4 bg-gray-900 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full h-40 object-cover rounded" />
                        <button
                          onClick={() => {
                            setThumbnailFile(null)
                            setThumbnailPreview('')
                            setFormData({ ...formData, thumbnail_url: undefined })
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-2">Drag & drop image, paste, or click to upload</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(file)
                          }}
                          className="hidden"
                          id="thumbnail-upload-edit"
                        />
                        <label
                          htmlFor="thumbnail-upload-edit"
                          className="inline-block px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 cursor-pointer"
                        >
                          Choose File
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Platform</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value as ContentSource })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Website">Website</option>
                      <option value="Twitter">Twitter</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ContentCategory })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Full Stack Development">Full Stack Development</option>
                      <option value="AI Build">AI Build</option>
                      <option value="Business & Entrepreneurship">Business & Entrepreneurship</option>
                      <option value="Finance & Investing">Finance & Investing</option>
                      <option value="Marketing & Sales">Marketing & Sales</option>
                      <option value="Personal Development">Personal Development</option>
                      <option value="Health & Fitness">Health & Fitness</option>
                      <option value="Golf">Golf</option>
                      <option value="Productivity">Productivity</option>
                      <option value="Design">Design</option>
                      <option value="Leadership">Leadership</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentStatus })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="To Watch">To Watch</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Implementing">Implementing</option>
                      <option value="Archived">Archived</option>
                      <option value="Vault">Vault</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as ContentPriority })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time (minutes)</label>
                    <input
                      type="number"
                      value={formData.time_to_consume || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          time_to_consume: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Creator</label>
                  <input
                    type="text"
                    value={formData.creator || ''}
                    onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Author, YouTuber, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Agent</label>
                  <AgentSelector
                    selectedAgent={formData.agent}
                    onChange={(agent) => setFormData({ ...formData, agent })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: parseAndFormatTags(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="react, typescript, tutorial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Folder</label>
                  <input
                    type="text"
                    value={formData.folder || ''}
                    onChange={(e) => setFormData({ ...formData, folder: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional folder name"
                  />
                </div>

                <DashboardAreaSelector
                  selectedAreas={formData.dashboard_areas || []}
                  onChange={(areas) => setFormData({ ...formData, dashboard_areas: areas })}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">AI Summary</label>
                  <textarea
                    value={formData.ai_summary || ''}
                    onChange={(e) => setFormData({ ...formData, ai_summary: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 italic"
                    placeholder="AI-generated summary will appear here, or add your own..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-filled by AI or manually entered</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add notes about this content..."
                  />
                </div>

                <ValueRatingInput
                  value={formData.value_rating || null}
                  onChange={(rating) => setFormData({ ...formData, value_rating: rating })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      TG Rating (1-10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.tg_rating || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tg_rating: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1-10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Google LLM
                    </label>
                    <select
                      value={formData.google_llm ? 'yes' : 'no'}
                      onChange={(e) =>
                        setFormData({ ...formData, google_llm: e.target.value === 'yes' })
                      }
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="no">No</option>
                      <option value="yes">Yes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_favorite}
                      onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                      className="rounded border-gray-600"
                    />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-300">Mark as favorite</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    resetForm()
                  }}
                  className="px-4 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!formData.title || !formData.url}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <DetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        content={selectedContent}
        businesses={businesses}
        onEdit={() => {
          setShowDetailsModal(false)
          setShowEditModal(true)
        }}
        onDelete={async (id) => {
          try {
            const { error } = await supabase
              .from('content_library')
              .delete()
              .eq('id', id)

            if (error) throw error
            fetchContents()
            setShowDetailsModal(false)
          } catch (error) {
            console.error('Error deleting content:', error)
            alert('Failed to delete content')
          }
        }}
        onUpdate={async (id, updates) => {
          try {
            const { error } = await supabase
              .from('content_library')
              .update(updates)
              .eq('id', id)

            if (error) throw error
            fetchContents()
            if (selectedContent?.id === id) {
              setSelectedContent({ ...selectedContent, ...updates })
            }
          } catch (error) {
            console.error('Error updating content:', error)
            alert('Failed to update content')
          }
        }}
      />

      {/* Edit Modal */}
      <EditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        content={selectedContent}
        businesses={businesses}
        onSave={async (id, updates) => {
          try {
            const { error } = await supabase
              .from('content_library')
              .update(updates)
              .eq('id', id)

            if (error) throw error

            // Refresh content list
            fetchContents()

            // Update selected content if details modal will be shown again
            if (selectedContent?.id === id) {
              setSelectedContent({ ...selectedContent, ...updates })
            }
          } catch (error) {
            console.error('Error updating content:', error)
            alert('Failed to update content')
          }
        }}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        onSave={async (content) => {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (!session) return

          const newContent = {
            ...content,
            user_id: session.user.id,
            saved_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          console.log('💾 Saving content:', newContent)

          const { data, error } = await supabase
            .from('content_library')
            .insert([newContent])
            .select()

          if (error) {
            console.error('❌ Error adding content:', error)
            console.error('Error details:', error.message, error.details, error.hint)
            throw error
          }

          console.log('✅ Content saved successfully:', data)
          setContents([...contents, data[0]])
        }}
      />
    </div>
  )
}

export default ContentLibrary
