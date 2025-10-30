// Story 5.4: Simple Area Card for Health/Content/Life/Golf (Minimal)
// Shows basic info without complex database tables

import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface SimpleAreaCardProps {
  title: string;
  icon: LucideIcon;
  color: string;
  message: string;
  onClick: () => void;
}

export const SimpleAreaCard: FC<SimpleAreaCardProps> = ({
  title,
  icon: Icon,
  color,
  message,
  onClick,
}) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border-2 border-${color}-700
                  hover:border-${color}-500 transition-all duration-300 cursor-pointer
                  transform hover:scale-105 hover:shadow-xl opacity-70
                  focus:outline-none focus:ring-2 focus:ring-${color}-500`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`View ${title} details`}
    >
      <div className="flex items-center gap-3 mb-4">
        <Icon className={`text-${color}-500`} size={32} strokeWidth={2} />
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
      </div>

      <div className="text-center py-8">
        <p className="text-gray-400 text-sm mb-2">{message}</p>
        <p className="text-gray-500 text-xs">Coming soon</p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-700 pt-3">
        <div className="flex items-center text-gray-400 hover:text-white transition-colors">
          <span className="text-xs font-medium">View Details</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};
