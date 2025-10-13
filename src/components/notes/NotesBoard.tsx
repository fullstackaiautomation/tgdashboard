import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Search, Plus, Trash2, Palette, Bold, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react'

interface Note {
  id: string
  user_id: string
  title: string
  content: string
  color: string
  position_x: number
  position_y: number
  created_at: string
  updated_at: string
}

const COLORS = [
  { name: 'Yellow', value: 'rgba(234, 179, 8, 0.2)', solid: '#eab308', emoji: '🌟' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.2)', solid: '#ec4899', emoji: '🌸' },
  { name: 'Blue', value: 'rgba(59, 130, 246, 0.2)', solid: '#3b82f6', emoji: '💙' },
  { name: 'Green', value: 'rgba(34, 197, 94, 0.2)', solid: '#22c55e', emoji: '🌿' },
  { name: 'Purple', value: 'rgba(168, 85, 247, 0.2)', solid: '#a855f7', emoji: '💜' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.2)', solid: '#f97316', emoji: '🔥' },
]

export default function NotesBoard() {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)

  // Debounce timers for auto-save
  const saveTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({})

  // Refs for textareas to handle selection
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})

  useEffect(() => {
    fetchNotes()

    // Cleanup timers on unmount
    return () => {
      Object.values(saveTimersRef.current).forEach(timer => clearTimeout(timer))
    }
  }, [])

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setNotes(data || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const createNote = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notes')
        .insert([
          {
            user_id: user.id,
            title: 'New Note',
            content: '',
            color: 'rgba(234, 179, 8, 0.2)',  // Yellow as default
          },
        ])
        .select()

      if (error) throw error
      if (data) {
        setNotes([data[0], ...notes])
        setEditingNote(data[0].id)
      }
    } catch (error) {
      console.error('Error creating note:', error)
    }
  }

  // Immediate local update with debounced database save
  const updateNoteLocal = useCallback((id: string, updates: Partial<Note>) => {
    // Update UI immediately
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, ...updates } : note
      )
    )

    // Clear existing timer for this note
    if (saveTimersRef.current[id]) {
      clearTimeout(saveTimersRef.current[id])
    }

    // Set new timer to save after 500ms of no typing
    saveTimersRef.current[id] = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('notes')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)

        if (error) throw error
      } catch (error) {
        console.error('Error saving note:', error)
      }
    }, 500)
  }, [])

  // Immediate update for non-text changes (like color)
  const updateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setNotes(notes.map(note =>
        note.id === id ? { ...note, ...updates } : note
      ))
    } catch (error) {
      console.error('Error updating note:', error)
    }
  }

  const deleteNote = async (id: string) => {
    if (!confirm('Delete this note?')) return

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)

      if (error) throw error
      setNotes(notes.filter(note => note.id !== id))
    } catch (error) {
      console.error('Error deleting note:', error)
    }
  }

  // Render formatted text with proper HTML rendering
  const renderFormattedText = (text: string) => {
    // Process text to convert markdown-style formatting to HTML
    let html = text
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Keep <u>underline</u> as is
      // Convert markdown links [text](url) to HTML links
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
      )
      // Convert plain URLs to clickable links (but not if already in a markdown link)
      .replace(
        /(?<!\()(https?:\/\/[^\s<)]+)(?!\))/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-blue-400 hover:text-blue-300 underline">$1</a>'
      )
      // Convert line breaks to <br>
      .replace(/\n/g, '<br/>')

    return html
  }

  // Text formatting functions
  const applyFormatting = (noteId: string, formatType: 'bold' | 'underline' | 'bullet' | 'numbered' | 'link') => {
    const textarea = textareaRefs.current[noteId]
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    const text = note.content
    const selectedText = text.substring(start, end)
    let newText = text
    let newCursorPos = end

    if (formatType === 'bold') {
      // Wrap selection with **bold**
      if (selectedText) {
        newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end)
        newCursorPos = end + 4
      } else {
        newText = text.substring(0, start) + '****' + text.substring(end)
        newCursorPos = start + 2
      }
    } else if (formatType === 'underline') {
      // Wrap selection with <u>underline</u>
      if (selectedText) {
        newText = text.substring(0, start) + `<u>${selectedText}</u>` + text.substring(end)
        newCursorPos = end + 7
      } else {
        newText = text.substring(0, start) + '<u></u>' + text.substring(end)
        newCursorPos = start + 3
      }
    } else if (formatType === 'bullet') {
      // Add bullet point at start of line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const lineEnd = text.indexOf('\n', start)
      const actualLineEnd = lineEnd === -1 ? text.length : lineEnd
      const lineText = text.substring(lineStart, actualLineEnd)

      if (lineText.startsWith('• ')) {
        // Remove bullet
        newText = text.substring(0, lineStart) + lineText.substring(2) + text.substring(actualLineEnd)
        newCursorPos = start - 2
      } else {
        // Add bullet
        newText = text.substring(0, lineStart) + '• ' + lineText + text.substring(actualLineEnd)
        newCursorPos = start + 2
      }
    } else if (formatType === 'numbered') {
      // Add numbered list at start of line
      const lineStart = text.lastIndexOf('\n', start - 1) + 1
      const lineEnd = text.indexOf('\n', start)
      const actualLineEnd = lineEnd === -1 ? text.length : lineEnd
      const lineText = text.substring(lineStart, actualLineEnd)

      if (/^\d+\.\s/.test(lineText)) {
        // Remove numbering
        newText = text.substring(0, lineStart) + lineText.replace(/^\d+\.\s/, '') + text.substring(actualLineEnd)
        newCursorPos = start - 3
      } else {
        // Add numbering
        newText = text.substring(0, lineStart) + '1. ' + lineText + text.substring(actualLineEnd)
        newCursorPos = start + 3
      }
    } else if (formatType === 'link') {
      // Prompt for URL and create link
      const url = prompt('Enter URL:')
      if (url) {
        if (selectedText) {
          // Wrap selected text as link
          newText = text.substring(0, start) + `[${selectedText}](${url})` + text.substring(end)
          newCursorPos = end + url.length + 4
        } else {
          // Insert link placeholder
          newText = text.substring(0, start) + `[link](${url})` + text.substring(end)
          newCursorPos = start + url.length + 8
        }
      } else {
        return // User cancelled
      }
    }

    updateNoteLocal(noteId, { content: newText })

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 0)
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex-none border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10 shadow-lg">
        <div className="max-w-[1800px] mx-auto px-6 py-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-xl shadow-purple-500/20">
                <span className="text-2xl">📝</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Notes
              </h1>
              <Badge variant="secondary" className="ml-2 bg-gray-800 text-gray-300 border-gray-700">
                {notes.length}
              </Badge>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20"
              />
            </div>

            {/* Add Note Button */}
            <Button
              onClick={createNote}
              className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 text-white font-semibold"
            >
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>
        </div>
      </div>

      {/* Notes Board */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[1800px] mx-auto p-6">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center mx-auto mb-6 shadow-xl">
                <span className="text-5xl opacity-40">📝</span>
              </div>
              <p className="text-gray-400 text-xl mb-2">
                {searchTerm ? 'No notes found matching your search.' : 'No notes yet. Create your first note!'}
              </p>
              {!searchTerm && (
                <Button
                  onClick={createNote}
                  variant="outline"
                  className="mt-8 gap-2 bg-gray-900 border-gray-800 hover:bg-gray-800 hover:border-purple-500/50 text-gray-300"
                >
                  <Plus className="h-4 w-4" />
                  Create Note
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 animate-in fade-in duration-300">
              {filteredNotes.map((note) => {
                const colorObj = COLORS.find(c => c.value === note.color) || COLORS[0]
                return (
                  <Card
                    key={note.id}
                    className="group relative overflow-hidden transition-all duration-200 hover:shadow-2xl hover:-translate-y-1 border-gray-800 backdrop-blur-sm"
                    style={{
                      backgroundColor: colorObj.value,
                      boxShadow: `0 0 20px ${colorObj.solid}20`
                    }}
                  >

                    <CardHeader className="pb-4 space-y-0 pt-6 px-6">
                      <div className="flex items-start justify-between gap-3">
                        <Input
                          type="text"
                          value={note.title}
                          onChange={(e) => updateNoteLocal(note.id, { title: e.target.value })}
                          onFocus={() => setEditingNote(note.id)}
                          onBlur={() => setEditingNote(null)}
                          className="font-bold text-xl border-none shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent text-white placeholder:text-gray-600"
                          placeholder="Note title..."
                        />
                        <Badge variant="outline" className="text-xs shrink-0 bg-gray-800/50 border-gray-700 text-gray-400">
                          {new Date(note.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4 px-6 pb-6">
                      {/* Formatting Toolbar */}
                      {editingNote === note.id && (
                        <div className="flex items-center gap-1 pb-2 border-b border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFormatting(note.id, 'bold')}
                            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                            title="Bold (wrap with **text**)"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFormatting(note.id, 'underline')}
                            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                            title="Underline (wrap with <u>text</u>)"
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                          <div className="w-px h-6 bg-gray-800 mx-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFormatting(note.id, 'bullet')}
                            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                            title="Bullet list (add • )"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFormatting(note.id, 'numbered')}
                            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                            title="Numbered list (add 1. )"
                          >
                            <ListOrdered className="h-4 w-4" />
                          </Button>
                          <div className="w-px h-6 bg-gray-800 mx-1" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applyFormatting(note.id, 'link')}
                            className="h-8 w-8 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                            title="Add link"
                          >
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* Note Content */}
                      {editingNote === note.id ? (
                        <Textarea
                          ref={(el) => { if (el) textareaRefs.current[note.id] = el; }}
                          value={note.content}
                          onChange={(e) => updateNoteLocal(note.id, { content: e.target.value })}
                          onFocus={() => setEditingNote(note.id)}
                          onBlur={() => setEditingNote(null)}
                          placeholder="Write your note here..."
                          className="min-h-[400px] max-h-[600px] resize-none border-none shadow-none p-0 focus-visible:ring-0 bg-transparent text-gray-300 placeholder:text-gray-600 text-base leading-relaxed font-sans"
                        />
                      ) : (
                        <div
                          onClick={() => setEditingNote(note.id)}
                          className="min-h-[400px] max-h-[600px] overflow-auto cursor-text p-0 text-gray-300 text-base leading-relaxed font-sans prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderFormattedText(note.content || '<span class="text-gray-600">Click to write...</span>') }}
                        />
                      )}

                      {/* Footer Actions */}
                      <div
                        className={`flex items-center justify-between gap-2 pt-4 border-t border-gray-800/50 transition-opacity duration-200 ${
                          editingNote === note.id || showColorPicker === note.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {/* Color Picker */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowColorPicker(showColorPicker === note.id ? null : note.id)}
                            className="h-9 w-9 p-0 hover:bg-gray-800 text-gray-400 hover:text-white"
                          >
                            <Palette className="h-4 w-4" />
                          </Button>

                          {showColorPicker === note.id && (
                            <div className="flex gap-1.5 animate-in fade-in slide-in-from-left-2 duration-200">
                              {COLORS.map((color) => (
                                <button
                                  key={color.value}
                                  onClick={() => {
                                    updateNote(note.id, { color: color.value })
                                    setShowColorPicker(null)
                                  }}
                                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-lg ${
                                    note.color === color.value ? 'ring-2 ring-offset-2 ring-offset-gray-900 scale-110' : ''
                                  }`}
                                  style={{
                                    backgroundColor: color.solid,
                                    borderColor: note.color === color.value ? color.solid : '#374151',
                                    boxShadow: `0 0 20px ${color.solid}40`
                                  }}
                                  title={color.name}
                                >
                                  <span className="text-sm drop-shadow-lg">{note.color === color.value ? color.emoji : ''}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id)}
                          className="h-9 w-9 p-0 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
