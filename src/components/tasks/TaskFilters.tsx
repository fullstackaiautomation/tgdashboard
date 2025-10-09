import type { FC } from 'react';

interface TaskFiltersProps {
  selectedBusiness: string | null;
  selectedStatus: string | null;
  onBusinessChange: (business: string | null) => void;
  onStatusChange: (status: string | null) => void;
}

const BUSINESSES = [
  { id: 'fullstack', label: 'Full Stack AI', color: 'var(--color-business-fullstack)' },
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
  { id: 'active', label: 'Active' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
  { id: 'overdue', label: 'Overdue' },
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onBusinessChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors ${
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
              className={`px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors ${
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
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onStatusChange(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === null
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>

          {STATUSES.map((status) => (
            <button
              key={status.id}
              onClick={() => onStatusChange(status.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedStatus === status.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
