import type { FC } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ChevronRight, AlertTriangle, Minus } from 'lucide-react';
import { useFinancesAreaSummary } from '@/hooks/useFinancesAreaSummary';

const FinancesAreaCardSkeleton: FC = () => (
  <div className="bg-gray-800 rounded-lg p-6 border-2 border-yellow-500 animate-pulse">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-gray-700 rounded"></div>
      <div className="flex-1">
        <div className="h-6 bg-gray-700 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-48"></div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="h-20 bg-gray-700 rounded"></div>
      <div className="h-16 bg-gray-700 rounded"></div>
      <div className="h-12 bg-gray-700 rounded"></div>
    </div>
  </div>
);

interface FinancesAreaCardProps {
  onClick?: () => void;
}

/**
 * FinancesAreaCard - Displays financial health summary on Review Dashboard
 *
 * Shows net worth, monthly revenue/expenses, budget status, investment performance,
 * financial goals progress, and unusual spending alerts.
 */
export const FinancesAreaCard: FC<FinancesAreaCardProps> = ({ onClick }) => {
  const { data: summary, isLoading, error } = useFinancesAreaSummary();

  if (isLoading) return <FinancesAreaCardSkeleton />;

  if (error) {
    console.error('FinancesAreaCard error:', error);
    // Show error state but return the component with default values
  }

  if (!summary) return <FinancesAreaCardSkeleton />;

  // Debug: Log the actual net worth value
  console.log('Net Worth from API:', summary.netWorth);

  const borderColorClass = {
    gray: 'border-gray-500',
    green: 'border-green-500',
    yellow: 'border-yellow-500',
    orange: 'border-orange-500',
    red: 'border-red-500',
  }[summary.budgetStatusColor];

  const progressBarColorClass = {
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }[summary.budgetStatusColor];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasInvestments = summary.portfolioValue !== null && summary.portfolioValue > 0;
  const hasGoals = summary.activeGoals.length > 0;
  const showBudgetDetails = summary.budgetStatus !== 'no_budget';

  return (
    <div
      className={`bg-gray-800 rounded-lg p-6 border-2 ${borderColorClass}
                  hover:border-yellow-400 transition-all duration-300 cursor-pointer
                  transform hover:scale-[1.02] hover:shadow-xl`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <DollarSign className="text-yellow-500" size={32} />
          <div>
            <h3 className="text-xl font-bold text-white">FINANCES</h3>
            <p className="text-sm text-gray-400">
              {summary.transactionsThisWeek} transaction{summary.transactionsThisWeek !== 1 ? 's' : ''} this week
            </p>
          </div>
        </div>
        {summary.budgetStatus === 'over' && (
          <AlertTriangle className="text-red-500 animate-pulse" size={24} />
        )}
      </div>

      {/* Net Worth - Prominent Display */}
      <div className="mb-4 text-center p-4 bg-gray-900 rounded-lg border border-gray-700">
        <p className="text-xs text-gray-500 uppercase mb-1 tracking-wide">Net Worth</p>
        <p className="text-3xl font-bold text-white">
          {formatCurrency(summary.netWorth)}
        </p>
      </div>

      {/* Revenue vs Expenses Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-green-950/30 border border-green-500/50 rounded-lg">
          <p className="text-xs text-green-400 uppercase mb-1">Revenue</p>
          <p className="text-lg font-bold text-green-300">
            {formatCurrency(summary.monthlyRevenue)}
          </p>
        </div>
        <div className="p-3 bg-red-950/30 border border-red-500/50 rounded-lg">
          <p className="text-xs text-red-400 uppercase mb-1">Expenses</p>
          <p className="text-lg font-bold text-red-300">
            {formatCurrency(summary.monthlyExpenses)}
          </p>
        </div>
      </div>

      {/* Budget Status */}
      {showBudgetDetails ? (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">{summary.budgetStatusText}</span>
            <span className="text-sm font-semibold text-white">
              {summary.budgetUsagePercentage.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${progressBarColorClass}`}
              style={{ width: `${Math.min(summary.budgetUsagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {summary.remainingBudget >= 0 ? (
                <>{formatCurrency(summary.remainingBudget)} remaining</>
              ) : (
                <span className="text-red-400 font-semibold">
                  {formatCurrency(Math.abs(summary.remainingBudget))} over budget
                </span>
              )}
            </p>
            <p className="text-xs text-gray-500">
              Budget: {formatCurrency(summary.monthlyBudget)}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
          <p className="text-sm text-gray-500">No budget configured</p>
        </div>
      )}

      {/* Investment Performance */}
      {hasInvestments && (
        <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Portfolio</p>
              <p className="text-lg font-semibold text-white">
                {formatCurrency(summary.portfolioValue!)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {summary.portfolioMonthlyReturn !== null && summary.portfolioMonthlyReturn > 0 ? (
                <TrendingUp className="text-green-500" size={20} />
              ) : summary.portfolioMonthlyReturn !== null && summary.portfolioMonthlyReturn < 0 ? (
                <TrendingDown className="text-red-500" size={20} />
              ) : (
                <Minus className="text-gray-500" size={20} />
              )}
              <span className={`text-sm font-bold ${
                summary.portfolioMonthlyReturn !== null && summary.portfolioMonthlyReturn > 0
                  ? 'text-green-400'
                  : summary.portfolioMonthlyReturn !== null && summary.portfolioMonthlyReturn < 0
                  ? 'text-red-400'
                  : 'text-gray-400'
              }`}>
                {summary.portfolioMonthlyReturn !== null ? (
                  <>
                    {summary.portfolioMonthlyReturn > 0 ? '+' : ''}
                    {summary.portfolioMonthlyReturn.toFixed(1)}%
                  </>
                ) : (
                  '0.0%'
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Spending Categories */}
      {summary.topCategories.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Top Spending</p>
          <div className="space-y-2">
            {summary.topCategories.slice(0, 3).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-medium">{formatCurrency(cat.amount)}</span>
                  <span className="text-gray-500 text-xs">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Goals Progress */}
      {hasGoals && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Active Goals</p>
          <div className="space-y-2">
            {summary.activeGoals.slice(0, 2).map((goal, idx) => (
              <div key={idx} className="bg-gray-900 p-2 rounded border border-gray-700">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 font-medium">{goal.name}</span>
                  <span className="text-white font-semibold">{goal.progress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-green-500 transition-all duration-500"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-gray-600">
                    {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
                  </span>
                  {goal.deadline && (
                    <span className="text-gray-600">
                      {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unusual Spending Alerts */}
      {summary.hasUnusualSpending && (
        <div className="mb-4 p-3 bg-orange-950/30 border border-orange-500 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="text-orange-500" size={16} />
            <p className="text-xs text-orange-400 uppercase font-semibold">Unusual Spending</p>
          </div>
          {summary.unusualSpending.slice(0, 2).map((alert, idx) => (
            <p key={idx} className="text-sm text-orange-300 mb-1">
              {alert.category}: {formatCurrency(alert.current)}
              <span className="text-orange-500 font-semibold ml-1">
                (+{alert.increase_percentage}%)
              </span>
            </p>
          ))}
        </div>
      )}

      {/* Footer with Action Button */}
      <div className="flex items-center justify-between border-t border-gray-700 pt-3 mt-2">
        <button
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg
                     text-sm font-semibold transition-colors shadow-md hover:shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          Review Transactions
        </button>
        <div className="flex items-center text-gray-400 hover:text-white transition-colors">
          <span className="text-sm">View Details</span>
          <ChevronRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  );
};
