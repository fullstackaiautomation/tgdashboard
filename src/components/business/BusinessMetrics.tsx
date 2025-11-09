import type { FC } from 'react';
import { Briefcase, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

interface BusinessMetricsProps {
  projectCount: number;
  overallProgress: number;
  activeTasks: number;
  completedTasks: number;
  hoursInvested?: number;
  isStalled?: boolean;
  daysSinceActivity?: number;
}

/**
 * BusinessMetrics - Aggregate metrics display for business dashboard
 * Shows: project count, overall completion %, tasks, hours invested
 */
export const BusinessMetrics: FC<BusinessMetricsProps> = ({
  projectCount,
  overallProgress,
  activeTasks,
  completedTasks,
  hoursInvested = 0,
  isStalled = false,
  daysSinceActivity = 0,
}) => {
  return (
    <div className="mb-4">
      {/* Stalled Warning Banner */}
      {isStalled && (
        <div className="mb-4 px-6 py-4 bg-orange-900/30 border border-orange-600 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-orange-500" size={24} />
            <div>
              <h3 className="text-lg font-semibold text-orange-400">
                ⚠️ No activity in {daysSinceActivity} days - This business needs attention
              </h3>
              <p className="text-sm text-orange-300 mt-1">
                Consider adding new tasks or reviewing project priorities
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row - Single line display */}
      <div className="flex gap-3 items-center">
        {/* Projects */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
          <div className="p-1 bg-blue-600/20 rounded">
            <Briefcase className="text-blue-500" size={16} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Projects</div>
            <div className="text-lg font-bold text-gray-100">{projectCount}</div>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
          <div className="p-1 bg-green-600/20 rounded">
            <TrendingUp className="text-green-500" size={16} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Completion</div>
            <div className="text-lg font-bold text-gray-100">{overallProgress.toFixed(1)}%</div>
          </div>
        </div>

        {/* Tasks */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
          <div className="p-1 bg-purple-600/20 rounded">
            <CheckCircle className="text-purple-500" size={16} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Tasks</div>
            <div className="text-lg font-bold text-gray-100">
              <span className="text-yellow-400">{activeTasks}</span>
              <span className="text-gray-500 text-xs mx-1">/</span>
              <span className="text-green-400">{completedTasks}</span>
            </div>
          </div>
        </div>

        {/* Hours Invested */}
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded border border-gray-700">
          <div className="p-1 bg-orange-600/20 rounded">
            <Clock className="text-orange-500" size={16} />
          </div>
          <div>
            <div className="text-xs text-gray-400">Hours Invested</div>
            <div className="text-lg font-bold text-gray-100">{hoursInvested.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
