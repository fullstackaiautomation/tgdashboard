import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface FinancialGoal {
  name: string;
  current: number;
  target: number;
  progress: number;
  deadline: string | null;
}

export interface TopCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface UnusualSpending {
  category: string;
  current: number;
  typical: number;
  increase_percentage: number;
}

export interface FinancesAreaSummary {
  netWorth: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyBudget: number;
  budgetUsagePercentage: number;
  budgetStatus: 'no_budget' | 'under' | 'approaching' | 'caution' | 'over';
  budgetStatusColor: 'gray' | 'green' | 'yellow' | 'orange' | 'red';
  budgetStatusText: string;
  transactionsThisWeek: number;
  portfolioValue: number | null;
  portfolioMonthlyReturn: number | null;
  topCategories: TopCategory[];
  activeGoals: FinancialGoal[];
  unusualSpending: UnusualSpending[];
  hasUnusualSpending: boolean;
  remainingBudget: number;
}

export const useFinancesAreaSummary = () => {
  return useQuery({
    queryKey: ['finances', 'area-summary'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('get_finances_area_summary', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching finances summary:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        // Return default values if no data
        return {
          netWorth: 0,
          monthlyRevenue: 0,
          monthlyExpenses: 0,
          monthlyBudget: 0,
          budgetUsagePercentage: 0,
          budgetStatus: 'no_budget' as const,
          budgetStatusColor: 'gray' as const,
          budgetStatusText: 'No budget set',
          transactionsThisWeek: 0,
          portfolioValue: null,
          portfolioMonthlyReturn: null,
          topCategories: [],
          activeGoals: [],
          unusualSpending: [],
          hasUnusualSpending: false,
          remainingBudget: 0,
        } as FinancesAreaSummary;
      }

      const summary = data[0];

      const statusColorMap = {
        no_budget: 'gray',
        under: 'green',
        approaching: 'yellow',
        caution: 'orange',
        over: 'red',
      } as const;

      const statusTextMap = {
        no_budget: 'No budget set',
        under: 'Under budget',
        approaching: 'Approaching limit',
        caution: 'Budget caution',
        over: 'Over budget!',
      } as const;

      const budgetStatus = summary.budget_status as keyof typeof statusColorMap;
      const unusualSpendingArray = summary.unusual_spending || [];

      return {
        netWorth: summary.net_worth || 0,
        monthlyRevenue: summary.monthly_revenue || 0,
        monthlyExpenses: summary.monthly_expenses || 0,
        monthlyBudget: summary.monthly_budget || 0,
        budgetUsagePercentage: summary.budget_usage_percentage || 0,
        budgetStatus,
        budgetStatusColor: statusColorMap[budgetStatus],
        budgetStatusText: statusTextMap[budgetStatus],
        transactionsThisWeek: summary.transactions_this_week || 0,
        portfolioValue: summary.portfolio_value,
        portfolioMonthlyReturn: summary.portfolio_monthly_return,
        topCategories: summary.top_categories || [],
        activeGoals: summary.active_goals || [],
        unusualSpending: unusualSpendingArray,
        hasUnusualSpending: unusualSpendingArray.length > 0,
        remainingBudget: (summary.monthly_budget || 0) - (summary.monthly_expenses || 0),
      } as FinancesAreaSummary;
    },
    staleTime: 120000, // 2 minutes (financial data updates less frequently)
    refetchOnWindowFocus: true,
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retrying
  });
};
