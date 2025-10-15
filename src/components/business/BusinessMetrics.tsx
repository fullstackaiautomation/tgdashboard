import type { FC } from 'react';
import { Briefcase, CheckCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { ProgressBar } from '../shared/ProgressBar';

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
    <div className="mb-8">
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

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Projects */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Briefcase className="text-blue-500" size={20} />
            </div>
            <span className="text-gray-400 text-sm font-medium">Projects</span>
          </div>
          <div className="text-3xl font-bold text-gray-100">{projectCount}</div>
        </div>

        {/* Overall Progress */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <TrendingUp className="text-green-500" size={20} />
            </div>
            <span className="text-gray-400 text-sm font-medium">Completion</span>
          </div>
          <div className="text-3xl font-bold text-gray-100 mb-3">{overallProgress.toFixed(1)}%</div>
          <ProgressBar progress={overallProgress} size="sm" showLabel={false} />
        </div>

        {/* Tasks */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <CheckCircle className="text-purple-500" size={20} />
            </div>
            <span className="text-gray-400 text-sm font-medium">Tasks</span>
          </div>
          <div className="text-xl font-bold text-gray-100">
            <span className="text-yellow-400">{activeTasks}</span>
            <span className="text-gray-500 text-base mx-2">/</span>
            <span className="text-green-400">{completedTasks}</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Active / Completed
          </div>
        </div>

        {/* Hours Invested */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Clock className="text-orange-500" size={20} />
            </div>
            <span className="text-gray-400 text-sm font-medium">Hours Invested</span>
          </div>
          <div className="text-3xl font-bold text-gray-100">{hoursInvested.toFixed(1)}</div>
          <div className="text-xs text-gray-500 mt-1">
            Deep Work
          </div>
        </div>
      </div>
    </div>
  );
};
