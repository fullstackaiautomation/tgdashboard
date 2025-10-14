import { type FC } from 'react';
import { AlertTriangle, Calendar } from 'lucide-react';
import { useHealthNeglectRisk } from '@/hooks/useHealthTimeMonitoring';

interface HealthNeglectAlertProps {
  onScheduleClick?: () => void;
}

/**
 * HealthNeglectAlert - Prominent alert when health time drops below 50% target for 2+ weeks
 *
 * Features:
 * - High risk (2+ consecutive weeks): Red alert with urgent messaging
 * - Low risk (1 week): Yellow warning with gentle reminder
 * - None: No alert shown
 * - "Schedule Health Time Now" CTA button
 * - Cannot be permanently dismissed while risk persists
 */
export const HealthNeglectAlert: FC<HealthNeglectAlertProps> = ({ onScheduleClick }) => {
  const { data: risk } = useHealthNeglectRisk();

  if (!risk || risk.risk_level === 'none') {
    return null;
  }

  if (risk.risk_level === 'low') {
    return (
      <div className="bg-yellow-900/20 border-l-4 border-yellow-500 rounded p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-500 w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-400 text-lg mb-1">
              Health time below target last week
            </h4>
            <p className="text-sm text-gray-300 mb-3">
              You were below 50% of your health target ({risk.threshold.toFixed(1)}h) last week.
              Consider scheduling health time this week to get back on track.
            </p>
            {onScheduleClick && (
              <button
                onClick={onScheduleClick}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium transition-colors text-sm"
              >
                <Calendar className="w-4 h-4" />
                Schedule Health Time
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // High risk
  return (
    <div className="bg-red-900/30 border-l-4 border-red-500 rounded p-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="bg-red-500 rounded-full p-2">
          <AlertTriangle className="text-white w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-red-400 text-xl mb-2">
            ⚠️ Health neglected - schedule workout time
          </h4>
          <p className="text-gray-200 mb-2">
            You've been below 50% of your health target for{' '}
            <span className="font-semibold text-red-400">{risk.consecutive_below} consecutive weeks</span>.
          </p>
          <p className="text-sm text-gray-300 mb-4">
            Your health goal is {risk.target_weekly}h per week, but you've been consistently below {risk.threshold.toFixed(1)}h.
            Time to prioritize your health and well-being!
          </p>
          {onScheduleClick && (
            <button
              onClick={onScheduleClick}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Schedule Health Time Now
            </button>
          )}
        </div>
      </div>

      {/* Additional context */}
      <div className="mt-4 pt-4 border-t border-red-700/30">
        <div className="flex items-start gap-2 text-sm text-gray-400">
          <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0"></div>
          <p>
            <span className="font-medium text-gray-300">Why this matters:</span> Consistent health time
            helps prevent burnout, maintains energy levels, and supports long-term productivity.
          </p>
        </div>
      </div>
    </div>
  );
};
