import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { Automation, CreateAutomationDTO, UpdateAutomationDTO, Integration } from '../../types/automation'
import {
  AUTOMATION_PURPOSES,
  AUTOMATION_AREAS,
  AUTOMATION_LABELS,
  AUTOMATION_PLATFORMS,
  AUTOMATION_TRIGGERS,
  COMPLETION_LEVELS,
  PRIORITIES,
  AVAILABLE_INTEGRATIONS,
  INTEGRATION_COLORS,
} from '../../types/automation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { DatePickerDialog } from '@/components/shared/DatePickerDialog'

interface AutomationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateAutomationDTO | (UpdateAutomationDTO & { id?: string })) => Promise<void>
  automation?: Automation | null
}

export const AutomationModal: FC<AutomationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  automation,
}) => {
  const [formData, setFormData] = useState<CreateAutomationDTO>({
    name: '',
    purpose: 'Data',
    area: 'Full Stack',
    label: 'Workflow',
    platform: 'n8n',
    trigger_type: 'Manual',
    integrations: [],
    completion_level: 'Future Idea',
    priority: 'Medium',
    go_live_date: null,
    last_checked_date: null,
  })

  const [isLoading, setIsLoading] = useState(false)

  // Initialize form with automation data when editing
  useEffect(() => {
    if (automation) {
      setFormData({
        name: automation.name,
        purpose: automation.purpose,
        area: automation.area,
        label: automation.label,
        platform: automation.platform,
        trigger_type: automation.trigger_type,
        integrations: automation.integrations,
        completion_level: automation.completion_level,
        priority: automation.priority,
        go_live_date: automation.go_live_date,
        last_checked_date: automation.last_checked_date,
      })
    } else {
      setFormData({
        name: '',
        purpose: 'Data',
        area: 'Full Stack',
        label: 'Workflow',
        platform: 'n8n',
        trigger_type: 'Manual',
        integrations: [],
        completion_level: 'Future Idea',
        priority: 'Medium',
        go_live_date: null,
        last_checked_date: null,
      })
    }
  }, [automation, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (automation) {
        await onSave({ ...formData, id: automation.id })
      } else {
        await onSave(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving automation:', error)
      alert(`Failed to save automation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleIntegration = (integration: Integration) => {
    setFormData((prev) => ({
      ...prev,
      integrations: (prev.integrations || []).includes(integration)
        ? (prev.integrations || []).filter((i) => i !== integration)
        : [...(prev.integrations || []), integration],
    }))
  }

  const renderSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
    required = false,
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-100 mb-2">
        {label}
        {required && <span className="text-purple-400 ml-1">*</span>}
      </label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md !bg-slate-900 border-slate-700 max-h-[95vh] overflow-y-auto p-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-gray-100">
            {automation ? 'Edit Automation' : 'Add Automation'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Automation Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              Name <span className="text-purple-400">*</span>
            </label>
            <Input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Customer Email"
              className="h-10 bg-slate-800 border-slate-700 text-gray-100 placeholder:text-gray-500 text-base focus:ring-purple-500"
            />
          </div>

          {/* Row 2: Label, Platform, Completion */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Label <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.label}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    label: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {AUTOMATION_LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Platform <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.platform}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    platform: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {AUTOMATION_PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Completion <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.completion_level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    completion_level: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {COMPLETION_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Area, Purpose, Trigger */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Area <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.area}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    area: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {AUTOMATION_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Purpose <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.purpose}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    purpose: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {AUTOMATION_PURPOSES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Trigger <span className="text-purple-400">*</span>
              </label>
              <select
                required
                value={formData.trigger_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    trigger_type: e.target.value as any,
                  })
                }
                className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-md text-gray-100 text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors hover:border-slate-600"
              >
                {AUTOMATION_TRIGGERS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Go Live, Last Checked */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Go Live
              </label>
              <DatePickerDialog
                value={formData.go_live_date || null}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    go_live_date: date,
                  })
                }
                label="Select Go Live Date"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-100 mb-2">
                Last Checked
              </label>
              <DatePickerDialog
                value={formData.last_checked_date || null}
                onChange={(date) =>
                  setFormData({
                    ...formData,
                    last_checked_date: date,
                  })
                }
                label="Select Last Checked Date"
              />
            </div>
          </div>

          {/* Integrations - Bubble Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-100 mb-2">
              Integrations
            </label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-800 rounded-md border border-slate-700">
              {AVAILABLE_INTEGRATIONS.map((integration) => {
                const isSelected = formData.integrations?.includes(integration)
                const bgColor = INTEGRATION_COLORS[integration as Integration]
                return (
                  <button
                    key={integration}
                    type="button"
                    onClick={() => handleToggleIntegration(integration as Integration)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? `${bgColor} text-white border-2 border-white`
                        : 'bg-slate-700 text-gray-300 border-2 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    {integration}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-10 text-base"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white font-medium text-base"
            >
              {isLoading ? 'Saving...' : automation ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
