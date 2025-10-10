import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type {
  Account,
  BalanceSnapshot,
  NetWorthSummary,
  AccountWithBalance,
  BalanceHistoryPoint,
} from '../types/finance'

// Fetch all accounts
export const useAccounts = () => {
  return useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) throw error
      return data as Account[]
    },
  })
}

// Fetch accounts with latest balances
export const useAccountsWithBalances = (date?: string) => {
  return useQuery({
    queryKey: ['finance', 'accounts-with-balances', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (accountsError) throw accountsError

      // Fetch latest balance for each account
      const accountsWithBalances = await Promise.all(
        accounts.map(async (account) => {
          const { data: snapshots } = await supabase
            .from('balance_snapshots')
            .select('balance')
            .eq('account_id', account.id)
            .lte('snapshot_date', targetDate)
            .order('snapshot_date', { ascending: false })
            .limit(1)

          return {
            ...account,
            current_balance: snapshots?.[0]?.balance || 0,
          } as AccountWithBalance
        })
      )

      return accountsWithBalances
    },
  })
}

// Fetch net worth summary
export const useNetWorthSummary = (date?: string) => {
  return useQuery({
    queryKey: ['finance', 'net-worth-summary', date],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await supabase.rpc('get_net_worth_summary', {
        p_user_id: user.id,
        p_date: targetDate,
      })

      if (error) throw error
      return data[0] as NetWorthSummary
    },
  })
}

// Fetch balance history
export const useBalanceHistory = (days: number = 90) => {
  return useQuery({
    queryKey: ['finance', 'balance-history', days],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('get_balance_history', {
        p_user_id: user.id,
        p_days: days,
      })

      if (error) throw error
      return data as BalanceHistoryPoint[]
    },
  })
}

// Save balance snapshots (bulk update for weekly entry)
export const useSaveBalanceSnapshots = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (snapshots: Omit<BalanceSnapshot, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const snapshotsWithUserId = snapshots.map((snapshot) => ({
        ...snapshot,
        user_id: user.id,
      }))

      const { data, error } = await supabase
        .from('balance_snapshots')
        .upsert(snapshotsWithUserId, {
          onConflict: 'account_id,snapshot_date',
        })
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] })
    },
  })
}

// Add new account
export const useAddAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (account: Omit<Account, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...account,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data as Account
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    },
  })
}

// Update account
export const useUpdateAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Account> }) => {
      const { data, error } = await supabase
        .from('accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Account
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    },
  })
}

// Delete account (soft delete - set is_active to false)
export const useDeleteAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase
        .from('accounts')
        .update({ is_active: false })
        .eq('id', accountId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'accounts'] })
    },
  })
}
