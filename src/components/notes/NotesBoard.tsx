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


  // Handle formatting in contentEditable div
  const handleContentEditableInput = (noteId: string, e: React.FormEvent<HTMLDivElement>) => {
    const div = e.currentTarget
    const html = div.innerHTML
    updateNoteLocal(noteId, { content: html })
  }

  // Handle keyboard events in contentEditable
  const handleContentEditableKeyDown = (noteId: string, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      // Check if we're in a list
      const selection = window.getSelection()
      if (!selection || !selection.anchorNode) return

      // Get the current element
      let currentElement = selection.anchorNode.parentElement
      if (!currentElement) return

      // Check if we're in a list item
      if (currentElement.tagName === 'LI' || currentElement.closest('li')) {
        // Let the browser handle list continuation naturally
        return
      }
    }
  }

  // Text formatting functions for contentEditable
  const applyFormatting = (noteId: string, formatType: 'bold' | 'underline' | 'bullet' | 'numbered' | 'link') => {
    // Focus the contentEditable div
    const editableDiv = document.querySelector(`[data-note-id="${noteId}"]`) as HTMLDivElement
    if (!editableDiv) return

    editableDiv.focus()

    if (formatType === 'bold') {
      document.execCommand('bold', false)
    } else if (formatType === 'underline') {
      document.execCommand('underline', false)
    } else if (formatType === 'bullet') {
      document.execCommand('insertUnorderedList', false)
    } else if (formatType === 'numbered') {
      document.execCommand('insertOrderedList', false)
    } else if (formatType === 'link') {
      const url = prompt('Enter URL:')
      if (url) {
        document.execCommand('createLink', false, url)
      }
    }

    // Update content after formatting
    const html = editableDiv.innerHTML
    updateNoteLocal(noteId, { content: html })
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
                        <div
                          className="flex items-center gap-1 pb-2 border-b border-gray-800/50 animate-in fade-in slide-in-from-top-2 duration-200"
                          onMouseDown={(e) => e.preventDefault()} // Prevent textarea from losing focus
                        >
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

                      {/* Note Content - WYSIWYG Editor */}
                      <div
                        data-note-id={note.id}
                        contentEditable={editingNote === note.id}
                        suppressContentEditableWarning
                        onInput={(e) => handleContentEditableInput(note.id, e)}
                        onKeyDown={(e) => handleContentEditableKeyDown(note.id, e)}
                        onClick={() => setEditingNote(note.id)}
                        onBlur={(e) => {
                          // Only blur if clicking outside the card
                          setTimeout(() => {
                            if (!e.currentTarget.contains(document.activeElement)) {
                              setEditingNote(null);
                            }
                          }, 0);
                        }}
                        dangerouslySetInnerHTML={{
                          __html: note.content || '<span style="color: #6b7280;">Click to write...</span>'
                        }}
                        className="min-h-[400px] max-h-[600px] overflow-auto cursor-text p-0 text-gray-300 text-base leading-relaxed font-sans focus:outline-none"
                        style={{
                          wordBreak: 'break-word'
                        }}
                      />
                      {/* Add custom CSS for contentEditable formatting */}
                      <style>{`
                        [data-note-id] b, [data-note-id] strong {
                          font-weight: 700;
                          color: #f3f4f6;
                        }
                        [data-note-id] u {
                          text-decoration: underline;
                        }
                        [data-note-id] a {
                          color: #60a5fa;
                          text-decoration: underline;
                          cursor: pointer;
                        }
                        [data-note-id] a:hover {
                          color: #93c5fd;
                        }
                        [data-note-id] ul, [data-note-id] ol {
                          margin: 0.5rem 0;
                          padding-left: 1.5rem;
                        }
                        [data-note-id] ul li {
                          list-style-type: disc;
                          margin: 0.25rem 0;
                        }
                        [data-note-id] ol li {
                          list-style-type: decimal;
                          margin: 0.25rem 0;
                        }
                        [data-note-id]:empty:before {
                          content: attr(data-placeholder);
                          color: #6b7280;
                          cursor: text;
                        }
                      `}</style>

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
