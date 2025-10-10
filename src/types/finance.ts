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

// Account detail for net worth log
export interface AccountDetail {
  name: string
  balance: number
  limit?: number
  available?: number
  original_amount?: number
}

// Net Worth Log Entry
export interface NetWorthLogEntry {
  id: string
  user_id: string
  snapshot_date: string

  // Summary totals
  net_worth: number
  cash_total: number
  investments_total: number
  credit_cards_owed: number
  credit_cards_available: number
  loans_total: number
  taxes_owed: number

  // Detailed breakdowns
  cash_accounts: AccountDetail[]
  investment_accounts: AccountDetail[]
  credit_card_accounts: AccountDetail[]
  loan_accounts: AccountDetail[]
  tax_accounts: AccountDetail[]

  created_at: string
  updated_at: string
}

// Input for creating a net worth log entry
export interface CreateNetWorthLogInput {
  snapshot_date: string
  net_worth: number
  cash_total: number
  investments_total: number
  credit_cards_owed: number
  credit_cards_available: number
  loans_total: number
  taxes_owed: number
  cash_accounts: AccountDetail[]
  investment_accounts: AccountDetail[]
  credit_card_accounts: AccountDetail[]
  loan_accounts: AccountDetail[]
  tax_accounts: AccountDetail[]
}
