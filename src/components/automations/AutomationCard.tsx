import type { FC } from 'react'
import { Trash2, Edit2, Zap, Workflow, Code2 } from 'lucide-react'
import type { Automation } from '../../types/automation'
import {
  PURPOSE_COLORS,
  LABEL_COLORS,
  INTEGRATION_COLORS,
  AREA_COLORS,
  PLATFORM_COLORS,
  TRIGGER_COLORS,
} from '../../types/automation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AutomationCardProps {
  automation: Automation
  onEdit: (automation: Automation) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

export const AutomationCard: FC<AutomationCardProps> = ({
  automation,
  onEdit,
  onDelete,
  isDragging,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete automation "${automation.name}"?`)) {
      onDelete(automation.id)
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(automation)
  }

  const getTriggerIcon = () => {
    return automation.trigger_type === 'Auto' ? <Zap className="w-3 h-3" /> : <Workflow className="w-3 h-3" />
  }

  const getPlatformIcon = () => {
    switch (automation.platform) {
      case 'n8n':
        return <Workflow className="w-3 h-3" />
      case 'Zapier':
        return <Zap className="w-3 h-3" />
      case 'Claude Code':
        return <Code2 className="w-3 h-3" />
      default:
        return <Workflow className="w-3 h-3" />
    }
  }

  // Get colors matching task card style - darker saturated colors
  const getCardBackground = () => {
    const colors: Record<string, string> = {
      'Future Idea': 'rgb(85, 45, 120)',      // Dark purple (Huge Capital)
      'Planning': 'rgb(35, 70, 130)',          // Dark blue (S4)
      'In Progress': 'rgb(120, 95, 35)',       // Dark yellow (808)
      'Review': 'rgb(130, 65, 25)',            // Dark orange (Golf)
      'Completed': 'rgb(25, 95, 75)',          // Dark green (Full Stack)
    }
    return colors[automation.completion_level] || colors['Future Idea']
  }

  const bgColor = getCardBackground()

  return (
    <div
      className={`
        rounded-lg overflow-hidden border border-white/15
        transition-all duration-200 cursor-grab active:cursor-grabbing
        ${isDragging ? 'opacity-40 scale-95' : 'hover:border-white/30 hover:shadow-md'}
        shadow-sm group
      `}
      style={{
        backgroundColor: bgColor,
      }}
    >
      {/* Row 1: Name & Area */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <h3 className="font-bold text-white text-base leading-tight flex-1">
          {automation.name}
        </h3>
        <Badge className={`${AREA_COLORS[automation.area]} text-white text-xs font-bold px-2 py-0.5 flex-shrink-0`}>
          {automation.area}
        </Badge>
      </div>

      {/* Row 2: Integrations */}
      {automation.integrations && automation.integrations.length > 0 && (
        <div className="px-4 py-1 flex items-center gap-2 flex-wrap">
          {automation.integrations.map((integration) => (
            <Badge
              key={integration}
              className={`${INTEGRATION_COLORS[integration] || 'bg-gray-600'} text-white text-xs px-2 py-0.5`}
            >
              {integration}
            </Badge>
          ))}
        </div>
      )}

      {/* Content Section */}
      <div className="px-4 py-3 space-y-2">
        {/* Row 3: Platform & Purpose */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">Platform:</span>
            <div className={`${PLATFORM_COLORS[automation.platform]} text-white px-3 py-1.5 rounded-full font-medium`}>
              {automation.platform}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">Purpose:</span>
            <div className={`${PURPOSE_COLORS[automation.purpose]} text-white px-3 py-1.5 rounded-full font-medium`}>
              {automation.purpose}
            </div>
          </div>
        </div>

        {/* Row 4: Label & Trigger */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">Label:</span>
            <div className={`${LABEL_COLORS[automation.label]} text-white px-3 py-1.5 rounded-full font-medium`}>
              {automation.label}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">Trigger:</span>
            <div className={`${TRIGGER_COLORS[automation.trigger_type]} text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1`}>
              {getTriggerIcon()}
              <span>{automation.trigger_type}</span>
            </div>
          </div>
        </div>

        {/* Row 6: Go Live */}
        {automation.go_live_date && (
          <div className="text-xs pt-2">
            <span className="text-gray-300 font-medium">Go Live:</span>
            <span className="text-white ml-1">{new Date(automation.go_live_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Row 7: Last Checked */}
        {automation.last_checked_date && (
          <div className="text-xs">
            <span className="text-gray-300 font-medium">Last Checked:</span>
            <span className="text-white ml-1">{new Date(automation.last_checked_date).toLocaleDateString()}</span>
          </div>
        )}

        {/* Row 8: Edit & Delete Buttons */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs font-medium bg-white/10 hover:bg-white/20 text-white border-white/20 dark:border-white/10 mt-2"
            onClick={handleEdit}
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 bg-red-500/10 hover:bg-red-500/20 text-red-300 border-red-500/30 dark:border-red-500/20 mt-2"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
