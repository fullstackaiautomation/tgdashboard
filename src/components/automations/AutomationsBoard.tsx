import type { FC } from 'react'
import { useState, useMemo } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import type { Automation, AutomationArea, AutomationPurpose, Priority, CompletionLevel } from '../../types/automation'
import { COMPLETION_LEVELS, COMPLETION_LEVEL_COLORS } from '../../types/automation'
import { AutomationCard } from './AutomationCard'
import { AutomationFilters } from './AutomationFilters'
import { AutomationModal } from './AutomationModal'
import { useAutomations, useUpdateAutomationLevel, useDeleteAutomation, useCreateAutomation, useUpdateAutomation } from '../../hooks/useAutomations'
import {
  KanbanProvider,
  KanbanBoard,
  KanbanHeader,
  KanbanCards,
  KanbanCard,
} from '@/components/kibo-ui/kanban'

interface AutomationsBoardProps {
  projectId?: string
}

interface KanbanAutomationItem {
  id: string
  name: string
  column: string
  automation: Automation
}

export const AutomationsBoard: FC<AutomationsBoardProps> = ({ projectId }) => {
  const [selectedArea, setSelectedArea] = useState<AutomationArea | 'All'>('All')
  const [selectedPurpose, setSelectedPurpose] = useState<AutomationPurpose | 'All'>('All')
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'All'>('All')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Data fetching
  const { data: automations = [] } = useAutomations(selectedArea === 'All' ? undefined : selectedArea)

  // Mutations
  const createMutation = useCreateAutomation()
  const updateMutation = useUpdateAutomation()
  const deleteMutation = useDeleteAutomation()
  const updateLevelMutation = useUpdateAutomationLevel()

  // Filter automations
  const filteredAutomations = useMemo(() => {
    return automations.filter((a) => {
      if (selectedPurpose !== 'All' && a.purpose !== selectedPurpose) return false
      if (selectedPriority !== 'All' && a.priority !== selectedPriority) return false
      return true
    })
  }, [automations, selectedPurpose, selectedPriority])

  // Convert automations to Kanban items
  const kanbanItems = useMemo(() => {
    return filteredAutomations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      column: automation.completion_level,
      automation,
    }))
  }, [filteredAutomations])

  // Kanban columns
  const kanbanColumns = useMemo(() => {
    return COMPLETION_LEVELS.map((level) => ({
      id: level,
      name: level,
      color: COMPLETION_LEVEL_COLORS[level],
    }))
  }, [])

  // Handle data changes from drag and drop
  const handleDataChange = async (newData: KanbanAutomationItem[]) => {
    // Find items that have changed columns
    for (const newItem of newData) {
      const oldItem = kanbanItems.find((item) => item.id === newItem.id)
      if (oldItem && oldItem.column !== newItem.column) {
        // Update the automation's completion level
        try {
          await updateLevelMutation.mutateAsync({
            id: newItem.id,
            completionLevel: newItem.column as CompletionLevel,
          })
        } catch (error) {
          console.error('Failed to update automation level:', error)
        }
      }
    }
  }

  // Handle drag end - additional logging if needed
  const handleDragEnd = async (event: DragEndEvent) => {
    // The KanbanProvider handles most of the logic
    // This can be used for additional analytics or side effects
  }

  // Handle save
  const handleSave = async (data: any) => {
    setIsLoading(true)
    try {
      if (editingAutomation) {
        await updateMutation.mutateAsync({ id: editingAutomation.id, ...data })
      } else {
        await createMutation.mutateAsync(data)
      }
      setIsModalOpen(false)
      setEditingAutomation(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Failed to delete automation:', error)
    }
  }

  // Handle edit
  const handleEdit = (automation: Automation) => {
    setEditingAutomation(automation)
    setIsModalOpen(true)
  }

  // Handle add new
  const handleAddNew = () => {
    setEditingAutomation(null)
    setIsModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AutomationFilters
        selectedArea={selectedArea}
        onAreaChange={setSelectedArea}
        selectedPurpose={selectedPurpose}
        onPurposeChange={setSelectedPurpose}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        onAddNew={handleAddNew}
        automations={automations}
      />

      {/* Kibo UI Kanban Board */}
      <KanbanProvider
        columns={kanbanColumns}
        data={kanbanItems}
        onDataChange={handleDataChange}
        onDragEnd={handleDragEnd}
      >
        {(column) => (
          <KanbanBoard key={column.id} id={column.id} className={`${column.color}`}>
            <KanbanHeader className="text-white font-bold">
              {column.name}
            </KanbanHeader>
            <KanbanCards id={column.id} className="flex-1">
              {(item: any) => (
                <KanbanCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  column={item.column}
                >
                  <AutomationCard
                    automation={item.automation}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </KanbanCard>
              )}
            </KanbanCards>
          </KanbanBoard>
        )}
      </KanbanProvider>

      {/* Modal */}
      <AutomationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingAutomation(null)
        }}
        onSave={handleSave}
        automation={editingAutomation}
      />
    </div>
  )
}
