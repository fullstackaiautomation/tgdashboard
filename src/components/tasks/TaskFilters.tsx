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
  { id: 'full-stack', label: 'Full Stack', gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }, // green gradient
  { id: 'huge-capital', label: 'Huge Capital', gradient: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' }, // purple gradient
  { id: 's4', label: 'S4', gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }, // blue gradient
  { id: '808', label: '808', gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' }, // yellow gradient
];

const LIFE_AREAS = [
  { id: 'personal', label: 'Personal', gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' }, // pink gradient
  { id: 'health', label: 'Health', gradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' }, // teal gradient
  { id: 'golf', label: 'Golf', gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' }, // orange gradient
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
    <div className="space-y-3 mb-6">
      {/* Business/Area Filters Card - Full Width Stacked */}
      <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/30 shadow-lg">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-8 gap-2">
            <Badge
              variant="outline"
              className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                selectedBusiness === null
                  ? 'border-2 border-white shadow-lg'
                  : 'border-0 hover:shadow-md'
              }`}
              style={{
                backgroundColor: '#4b5563',
              }}
              onClick={() => onBusinessChange(null)}
            >
              <span>All Areas</span>
              <span className="text-xl font-bold mt-0.5">{getBusinessCount(null)}</span>
            </Badge>

            {BUSINESSES.map((business) => (
              <Badge
                key={business.id}
                variant="outline"
                className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                  selectedBusiness === business.id
                    ? 'border-2 border-white shadow-lg'
                    : 'border-0 hover:shadow-md'
                }`}
                style={{
                  background: business.gradient,
                }}
                onClick={() => onBusinessChange(business.id)}
              >
                <span>{business.label}</span>
                <span className="text-xl font-bold mt-0.5">{getBusinessCount(business.id)}</span>
              </Badge>
            ))}

            {LIFE_AREAS.map((area) => (
              <Badge
                key={area.id}
                variant="outline"
                className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                  selectedBusiness === area.id
                    ? 'border-2 border-white shadow-lg'
                    : 'border-0 hover:shadow-md'
                }`}
                style={{
                  background: area.gradient,
                }}
                onClick={() => onBusinessChange(area.id)}
              >
                <span>{area.label}</span>
                <span className="text-xl font-bold mt-0.5">{getBusinessCount(area.id)}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Filters Card - Full Width Stacked */}
      <Card className="bg-gray-800/40 backdrop-blur-sm border-gray-700/30 shadow-lg">
        <CardContent className="pt-4 pb-4">
          <div className="grid grid-cols-8 gap-2">
            {/* All Tasks Filter - First Position */}
            <Badge
              variant="outline"
              className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                selectedStatus === null
                  ? 'border-2 border-white shadow-lg'
                  : 'border-0 hover:shadow-md'
              }`}
              style={{
                backgroundColor: '#4b5563',
              }}
              onClick={() => onStatusChange(null)}
            >
              <span>All Tasks</span>
              <span className="text-xl font-bold mt-0.5">{tasks.length}</span>
            </Badge>

            {STATUSES.map((status) => (
              <Badge
                key={status.id}
                variant="outline"
                className={`cursor-pointer px-5 py-3 text-lg font-semibold text-white transition-all duration-150 flex flex-col items-center ${
                  selectedStatus === status.id
                    ? 'border-2 border-white shadow-lg'
                    : 'border-0 hover:shadow-md'
                }`}
                style={{
                  backgroundColor: getStatusColor(status.id),
                }}
                onClick={() => onStatusChange(status.id)}
              >
                <span>{status.label}</span>
                <span className="text-xl font-bold mt-0.5">{getStatusCount(status.id)}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
