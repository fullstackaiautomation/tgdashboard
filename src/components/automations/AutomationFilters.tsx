import type { FC } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AUTOMATION_AREAS } from '../../types/automation'
import type { AutomationArea, AutomationPurpose, Priority, Automation } from '../../types/automation'
import { Button } from '@/components/ui/button'

interface AutomationFiltersProps {
  selectedArea: AutomationArea | 'All'
  onAreaChange: (area: AutomationArea | 'All') => void
  selectedPurpose?: AutomationPurpose | 'All'
  onPurposeChange?: (purpose: AutomationPurpose | 'All') => void
  selectedPriority?: Priority | 'All'
  onPriorityChange?: (priority: Priority | 'All') => void
  onAddNew: () => void
  automations?: Automation[]
}

const AREA_GRADIENTS: Record<AutomationArea | 'All', string> = {
  'All': '#4b5563',
  'Full Stack': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'Huge Capital': 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
  'S4': 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  '808': 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
  'Personal': 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'Health': 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  'Golf': 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
}

export const AutomationFilters: FC<AutomationFiltersProps> = ({
  selectedArea,
  onAreaChange,
  selectedPurpose = 'All',
  onPurposeChange,
  selectedPriority = 'All',
  onPriorityChange,
  onAddNew,
  automations = [],
}) => {
  const areas: (AutomationArea | 'All')[] = ['All', ...AUTOMATION_AREAS]

  const getAreaCount = (area: AutomationArea | 'All') => {
    if (area === 'All') return automations.length
    return automations.filter(a => a.area === area).length
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Area Filters Card */}
      <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/30 shadow-lg">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-8 gap-2">
            {areas.map((area) => (
              <Badge
                key={area}
                variant="outline"
                className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                  selectedArea === area
                    ? 'border-2 border-white shadow-lg'
                    : 'border-0 hover:shadow-md'
                }`}
                style={{
                  background: AREA_GRADIENTS[area],
                }}
                onClick={() => onAreaChange(area)}
              >
                <span>{area}</span>
                <span className="text-xl font-bold mt-0.5">{getAreaCount(area)}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Secondary Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        {onPurposeChange && (
          <select
            value={selectedPurpose}
            onChange={(e) => onPurposeChange(e.target.value as AutomationPurpose | 'All')}
            className="rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="All">All Purposes</option>
            <option value="Sales">Sales</option>
            <option value="Data">Data</option>
            <option value="Fulfillment">Fulfillment</option>
            <option value="Marketing">Marketing</option>
            <option value="Admin">Admin</option>
          </select>
        )}

        {onPriorityChange && (
          <select
            value={selectedPriority}
            onChange={(e) => onPriorityChange(e.target.value as Priority | 'All')}
            className="rounded-lg bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        )}

        <Button
          onClick={onAddNew}
          className="bg-purple-600 hover:bg-purple-700 text-white ml-auto"
        >
          + Add Automation
        </Button>
      </div>
    </div>
  )
}
