import type { FC } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TaskHub } from '@/types/task';
import { parseLocalDate, getTodayMidnight, isToday, isOverdue as checkOverdue, isTomorrow } from '@/utils/dateHelpers';

interface TaskFiltersProps {
  selectedBusiness: string | null;
  selectedStatus: string | null;
  onBusinessChange: (business: string | null) => void;
  onStatusChange: (status: string | null) => void;
  tasks: TaskHub[];
}

const BUSINESSES = [
  { id: 'full-stack', label: 'Full Stack', color: 'var(--color-business-fullstack)' },
  { id: 'huge-capital', label: 'Huge Capital', color: 'var(--color-business-hugecapital)' },
  { id: 's4', label: 'S4', color: 'var(--color-business-s4)' },
  { id: '808', label: '808', color: 'var(--color-business-808)' },
];

const LIFE_AREAS = [
  { id: 'personal', label: 'Personal', color: 'var(--color-area-personal)' },
  { id: 'health', label: 'Health', color: 'var(--color-area-health)' },
  { id: 'golf', label: 'Golf', color: 'var(--color-area-golf)' },
];

const STATUSES = [
  { id: 'due-today', label: 'Due Today' },
  { id: 'completed-today', label: 'Done Today' },
  { id: 'due-tomorrow', label: 'Due Tomorrow' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'recurring', label: 'Recurring' },
];

export const TaskFilters: FC<TaskFiltersProps> = ({
  selectedBusiness,
  selectedStatus,
  onBusinessChange,
  onStatusChange,
  tasks,
}) => {
  const getStatusColor = (statusId: string) => {
    switch(statusId) {
      case 'due-today': return '#eab308'; // yellow
      case 'completed-today': return '#22c55e'; // green
      case 'due-tomorrow': return '#f97316'; // orange
      case 'overdue': return '#ef4444'; // red
      case 'active': return '#3b82f6'; // blue
      case 'completed': return '#22c55e'; // green
      case 'recurring': return '#a855f7'; // purple
      default: return '#374151';
    }
  };

  const getBusinessCount = (businessId: string | null) => {
    return tasks.filter(task => {
      // Apply business/area filter
      if (businessId !== null) {
        const matchesBusiness = task.businesses?.slug === businessId;
        const matchesLifeArea = task.life_areas?.category.toLowerCase() === businessId;
        const matchesLegacyArea = task.area?.toLowerCase().replace(/\s+/g, '-') === businessId;

        if (!matchesBusiness && !matchesLifeArea && !matchesLegacyArea) {
          return false;
        }
      }

      // Apply active status filter (if any)
      if (selectedStatus) {
        switch(selectedStatus) {
          case 'due-today': {
            if (!isToday(task.due_date) || task.status === 'Done') return false;
            break;
          }
          case 'completed-today': {
            if (!isToday(task.completed_at)) return false;
            break;
          }
          case 'due-tomorrow': {
            if (!isTomorrow(task.due_date) || task.status === 'Done') return false;
            break;
          }
          case 'overdue': {
            if (!checkOverdue(task.due_date) || task.status === 'Done') return false;
            break;
          }
          case 'active':
            if (task.status === 'Done') return false;
            break;
          case 'completed':
            if (task.status !== 'Done') return false;
            break;
          case 'recurring':
            if (!task.is_recurring_template) return false;
            break;
        }
      }

      return true;
    }).length;
  };

  const getStatusCount = (statusId: string) => {
    return tasks.filter(task => {
      // Apply active business/area filter (if any)
      if (selectedBusiness) {
        const matchesBusiness = task.businesses?.slug === selectedBusiness;
        const matchesLifeArea = task.life_areas?.category.toLowerCase() === selectedBusiness;
        const matchesLegacyArea = task.area?.toLowerCase().replace(/\s+/g, '-') === selectedBusiness;

        if (!matchesBusiness && !matchesLifeArea && !matchesLegacyArea) {
          return false;
        }
      }

      // Apply status filter using date helpers
      switch(statusId) {
        case 'due-today': {
          return isToday(task.due_date) && task.status !== 'Done';
        }
        case 'completed-today': {
          return isToday(task.completed_at);
        }
        case 'due-tomorrow': {
          return isTomorrow(task.due_date) && task.status !== 'Done';
        }
        case 'overdue': {
          return checkOverdue(task.due_date) && task.status !== 'Done';
        }
        case 'active':
          return task.status !== 'Done' && !task.completed_at;
        case 'completed':
          return task.status === 'Done';
        case 'recurring':
          return task.is_recurring_template;
        default:
          return false;
      }
    }).length;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Business/Area Filters Card - Full Width Stacked */}
      <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="grid grid-cols-8 gap-3">
            <Badge
              variant={selectedBusiness === null ? "default" : "outline"}
              className={`cursor-pointer px-6 py-4 text-base font-bold transition-all duration-200 flex flex-col items-center ${
                selectedBusiness === null
                  ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-500 hover:to-gray-600 shadow-lg scale-105'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border-gray-600 hover:scale-105'
              }`}
              onClick={() => onBusinessChange(null)}
            >
              <span>All Areas</span>
              <span className="text-xl font-extrabold mt-1">{getBusinessCount(null)}</span>
            </Badge>

            {BUSINESSES.map((business) => (
              <Badge
                key={business.id}
                variant="outline"
                className={`cursor-pointer px-6 py-4 text-base font-bold text-white border-2 transition-all duration-200 flex flex-col items-center ${
                  selectedBusiness === business.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: business.color,
                  borderColor: business.color
                }}
                onClick={() => onBusinessChange(business.id)}
              >
                <span>{business.label}</span>
                <span className="text-xl font-extrabold mt-1">{getBusinessCount(business.id)}</span>
              </Badge>
            ))}

            {LIFE_AREAS.map((area) => (
              <Badge
                key={area.id}
                variant="outline"
                className={`cursor-pointer px-6 py-4 text-base font-bold text-white border-2 transition-all duration-200 flex flex-col items-center ${
                  selectedBusiness === area.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: area.color,
                  borderColor: area.color
                }}
                onClick={() => onBusinessChange(area.id)}
              >
                <span>{area.label}</span>
                <span className="text-xl font-extrabold mt-1">{getBusinessCount(area.id)}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Filters Card - Full Width Stacked */}
      <Card className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm border-gray-700/50 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardContent className="pt-6">
          <div className="grid grid-cols-8 gap-3">
            {STATUSES.slice(0, 4).map((status) => (
              <Badge
                key={status.id}
                variant="outline"
                className={`cursor-pointer px-6 py-4 text-base font-bold text-white border-2 transition-all duration-200 flex flex-col items-center ${
                  selectedStatus === status.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: getStatusColor(status.id),
                  borderColor: getStatusColor(status.id)
                }}
                onClick={() => onStatusChange(status.id)}
              >
                <span>{status.label}</span>
                <span className="text-xl font-extrabold mt-1">{getStatusCount(status.id)}</span>
              </Badge>
            ))}

            {/* Add Task Button - Between Overdue and Active */}
            <Badge
              variant="outline"
              className="cursor-pointer px-6 py-4 text-base font-bold bg-gradient-to-r from-gray-700 to-gray-800 text-gray-300 hover:from-gray-600 hover:to-gray-700 border-2 border-dashed border-gray-500 transition-all duration-200 hover:scale-105 hover:border-gray-400 flex items-center justify-center"
              onClick={() => {/* TODO: Open add task modal */}}
            >
              + Add Task
            </Badge>

            {STATUSES.slice(4).map((status) => (
              <Badge
                key={status.id}
                variant="outline"
                className={`cursor-pointer px-6 py-4 text-base font-bold text-white border-2 transition-all duration-200 flex flex-col items-center ${
                  selectedStatus === status.id
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110 shadow-lg'
                    : 'hover:scale-105 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: getStatusColor(status.id),
                  borderColor: getStatusColor(status.id)
                }}
                onClick={() => onStatusChange(status.id)}
              >
                <span>{status.label}</span>
                <span className="text-xl font-extrabold mt-1">{getStatusCount(status.id)}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
