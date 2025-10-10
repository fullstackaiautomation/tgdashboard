import type { FC } from 'react';

interface TaskFiltersProps {
  selectedBusiness: string | null;
  selectedStatus: string | null;
  onBusinessChange: (business: string | null) => void;
  onStatusChange: (status: string | null) => void;
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
  { id: 'completed-today', label: 'Completed Today' },
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
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Business/Area Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Filter by Business/Area</h3>
        <div className="flex gap-2 w-full">
          <button
            onClick={() => onBusinessChange(null)}
            className={`flex-1 px-4 py-3 rounded-lg text-base font-semibold transition-colors ${
              selectedBusiness === null
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>

          {BUSINESSES.map((business) => (
            <button
              key={business.id}
              onClick={() => onBusinessChange(business.id)}
              className={`flex-1 px-4 py-3 rounded-lg text-base font-semibold text-white transition-colors ${
                selectedBusiness === business.id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
              }`}
              style={{ backgroundColor: business.color }}
            >
              {business.label}
            </button>
          ))}

          {LIFE_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => onBusinessChange(area.id)}
              className={`flex-1 px-4 py-3 rounded-lg text-base font-semibold text-white transition-colors ${
                selectedBusiness === area.id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
              }`}
              style={{ backgroundColor: area.color }}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Filter by Status</h3>
        <div className="flex gap-2 w-full">
          {STATUSES.map((status) => {
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

            return (
              <button
                key={status.id}
                onClick={() => onStatusChange(status.id)}
                className={`flex-1 px-4 py-3 rounded-lg text-base font-semibold text-white transition-colors ${
                  selectedStatus === status.id ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900' : ''
                }`}
                style={{ backgroundColor: getStatusColor(status.id) }}
              >
                {status.label}
              </button>
            );
          })}

          {/* Add Task Button */}
          <button
            onClick={() => {/* TODO: Open add task modal */}}
            className="flex-1 px-4 py-3 rounded-lg text-base font-semibold bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors border-2 border-dashed border-gray-500"
          >
            + Add Task
          </button>
        </div>
      </div>
    </div>
  );
};
