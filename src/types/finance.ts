// Finance Types

export type AccountCategory = 'asset' | 'liability'

export type AccountSubcategory =
  | 'cash'
  | 'investment'
  | 'physical_asset'
  | 'credit_card'
  | 'personal_loan'
  | 'auto_loan'
  | 'tax'

export interface Account {
  id: string
  user_id: string
  account_name: string
  category: AccountCategory
  subcategory: AccountSubcategory
  is_active: boolean
  display_order: number
  credit_limit: number
  created_at: string
  updated_at: string
}

export interface BalanceSnapshot {
  id: string
  user_id: string
  account_id: string
  balance: number
  snapshot_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface NetWorthSummary {
  total_assets: number
  total_liabilities: number
  net_worth: number
  cash_on_hand: number
  credit_cards_owed: number
  owed_cash: number
  cash_total: number
}

export interface AccountWithBalance extends Account {
  current_balance?: number
}

export interface BalanceHistoryPoint {
  snapshot_date: string
  net_worth: number
  total_assets: number
  total_liabilities: number
}
