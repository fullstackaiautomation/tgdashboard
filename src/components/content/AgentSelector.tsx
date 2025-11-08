import { useState, useEffect, type FC } from 'react'
import { Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface Agent {
  id: string
  name: string
  description?: string
}

interface AgentSelectorProps {
  selectedAgent: string | undefined
  onChange: (agent: string) => void
}

export const AgentSelector: FC<AgentSelectorProps> = ({ selectedAgent, onChange }) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')
  const [newAgentDescription, setNewAgentDescription] = useState('')
  const [addingAgent, setAddingAgent] = useState(false)

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
        .select('id, name, description')
        .eq('user_id', session.user.id)
        .order('name')

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAgent = async () => {
    if (!newAgentName.trim()) {
      alert('Please enter an agent name')
      return
    }

    setAddingAgent(true)
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
            description: newAgentDescription.trim() || null,
          },
        ])
        .select()

      if (error) throw error

      const newAgent = data[0]
      setAgents([...agents, newAgent].sort((a, b) => a.name.localeCompare(b.name)))
      onChange(newAgent.name)
      setNewAgentName('')
      setNewAgentDescription('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding agent:', error)
      alert('Failed to add agent. Please try again.')
    } finally {
      setAddingAgent(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400">
        Loading agents...
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <select
          value={selectedAgent || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select an agent...</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.name}>
              {agent.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          title="Add new agent"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddForm && (
        <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg space-y-2">
          <input
            type="text"
            value={newAgentName}
            onChange={(e) => setNewAgentName(e.target.value)}
            placeholder="Agent name"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleAddAgent()}
          />
          <textarea
            value={newAgentDescription}
            onChange={(e) => setNewAgentDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddAgent}
              disabled={addingAgent || !newAgentName.trim()}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingAgent ? 'Adding...' : 'Add Agent'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewAgentName('')
                setNewAgentDescription('')
              }}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
