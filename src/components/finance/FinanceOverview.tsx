import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, CreditCard, DollarSign, Calendar, Save, Landmark, History } from 'lucide-react'
import {
  useAccountsWithBalances,
  useNetWorthSummary,
  useSaveBalanceSnapshots,
  useSaveNetWorthLog,
  useNetWorthLog,
} from '../../hooks/useFinance'
import type { AccountDetail } from '../../types/finance'
import { formatDateString, getTodayNoon } from '../../utils/dateHelpers'

const FinanceOverview = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateString(getTodayNoon())
  )
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Add styles to hide number input spinners
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      input[type=number]::-webkit-inner-spin-button,
      input[type=number]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type=number] {
        -moz-appearance: textfield;
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const { data: accounts, isLoading: accountsLoading } = useAccountsWithBalances(selectedDate)
  const { data: summary, isLoading: summaryLoading } = useNetWorthSummary(selectedDate)
  const { data: netWorthHistory, isLoading: historyLoading } = useNetWorthLog(30)
  const saveBalances = useSaveBalanceSnapshots()
  const saveNetWorthLog = useSaveNetWorthLog()

  // Initialize balances when accounts load
  useEffect(() => {
    if (accounts) {
      const initialBalances: Record<string, number> = {}
      accounts.forEach((account) => {
        initialBalances[account.id] = account.current_balance || 0
      })
      setBalances(initialBalances)
    }
  }, [accounts])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  // TODO: Apply color-coded percentages later
  // const getPercentageColor = (percentage: number) => {
  //   if (percentage <= 20) return 'text-green-400'
  //   if (percentage <= 50) return 'text-orange-400'
  //   return 'text-red-400'
  // }

  const handleBalanceChange = (accountId: string, value: string) => {
    // Remove commas and parse
    const cleanValue = value.replace(/,/g, '')
    const numValue = parseFloat(cleanValue) || 0
    setBalances((prev) => ({
      ...prev,
      [accountId]: numValue,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save individual balance snapshots
      const snapshots = Object.entries(balances).map(([accountId, balance]) => ({
        account_id: accountId,
        balance,
        snapshot_date: selectedDate,
      }))

      await saveBalances.mutateAsync(snapshots)

      // Build net worth log entry
      if (accounts && summary) {
        // Group accounts
        const cashAccts = accounts.filter((a) => a.subcategory === 'cash')
        const investmentAccts = accounts.filter((a) => a.subcategory === 'investment' || a.subcategory === 'physical_asset')
        const creditCardAccts = accounts.filter((a) => a.subcategory === 'credit_card')
        const loanAccts = accounts.filter((a) => a.subcategory === 'personal_loan' || a.subcategory === 'auto_loan')
        const taxAccts = accounts.filter((a) => a.subcategory === 'tax')

        // Build account details
        const cashDetails: AccountDetail[] = cashAccts.map((a) => ({
          name: a.account_name,
          balance: balances[a.id] || 0,
        }))

        const investmentDetails: AccountDetail[] = investmentAccts.map((a) => ({
          name: a.account_name,
          balance: balances[a.id] || 0,
        }))

        const creditCardDetails: AccountDetail[] = creditCardAccts.map((a) => ({
          name: a.account_name,
          balance: balances[a.id] || 0,
          limit: a.credit_limit,
          available: a.credit_limit - (balances[a.id] || 0),
        }))

        const loanDetails: AccountDetail[] = loanAccts.map((a) => ({
          name: a.account_name,
          balance: balances[a.id] || 0,
        }))

        const taxDetails: AccountDetail[] = taxAccts.map((a) => ({
          name: a.account_name,
          balance: balances[a.id] || 0,
        }))

        // Calculate totals
        const cashTotal = cashDetails.reduce((sum, a) => sum + a.balance, 0)
        const investmentsTotal = investmentDetails.reduce((sum, a) => sum + a.balance, 0)
        const creditCardsOwed = creditCardDetails.reduce((sum, a) => sum + a.balance, 0)
        const creditCardsAvailable = creditCardDetails.reduce((sum, a) => sum + (a.available || 0), 0)
        const loansTotal = loanDetails.reduce((sum, a) => sum + a.balance, 0)
        const taxesOwed = taxDetails.reduce((sum, a) => sum + a.balance, 0)

        // Save net worth log
        await saveNetWorthLog.mutateAsync({
          snapshot_date: selectedDate,
          net_worth: summary.net_worth,
          cash_total: cashTotal,
          investments_total: investmentsTotal,
          credit_cards_owed: creditCardsOwed,
          credit_cards_available: creditCardsAvailable,
          loans_total: loansTotal,
          taxes_owed: taxesOwed,
          cash_accounts: cashDetails,
          investment_accounts: investmentDetails,
          credit_card_accounts: creditCardDetails,
          loan_accounts: loanDetails,
          tax_accounts: taxDetails,
        })
      }

      alert('Balances saved successfully!')
    } catch (error) {
      console.error('Error saving balances:', error)
      alert('Error saving balances. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (accountsLoading || summaryLoading) {
    return <div className="text-white p-8">Loading...</div>
  }

  // Group accounts by type
  const cashAccounts = accounts?.filter((a) => a.subcategory === 'cash') || []
  const investmentAccounts = accounts?.filter((a) => a.subcategory === 'investment' || a.subcategory === 'physical_asset') || []
  const creditCardAccounts = accounts?.filter((a) => a.subcategory === 'credit_card') || []
  const personalLoans = accounts?.filter((a) => a.subcategory === 'personal_loan') || []
  const autoLoans = accounts?.filter((a) => a.subcategory === 'auto_loan') || []
  const taxes = accounts?.filter((a) => a.subcategory === 'tax') || []
  const loansAndTaxes = [...personalLoans, ...autoLoans, ...taxes]

  // Calculate totals
  const cashTotal = cashAccounts.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const investmentTotal = investmentAccounts.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const creditCardBalanceTotal = creditCardAccounts.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const creditCardLimitTotal = creditCardAccounts.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  const creditUtilization = creditCardLimitTotal > 0 ? (creditCardBalanceTotal / creditCardLimitTotal) * 100 : 0
  const personalLoansTotal = personalLoans.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const personalLoansTotalOriginal = personalLoans.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  const personalLoansPercentRemaining = personalLoansTotalOriginal > 0 ? (personalLoansTotal / personalLoansTotalOriginal) * 100 : 0
  const autoLoansTotal = autoLoans.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const autoLoansTotalOriginal = autoLoans.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  // const autoLoansPercentRemaining = autoLoansTotalOriginal > 0 ? (autoLoansTotal / autoLoansTotalOriginal) * 100 : 0
  // const taxesTotal = taxes.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  // const taxesTotalOriginal = taxes.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  // const taxesPercentRemaining = taxesTotalOriginal > 0 ? (taxesTotal / taxesTotalOriginal) * 100 : 0
  const allLoansTotal = personalLoansTotal + autoLoansTotal
  const allLoansTotalOriginal = personalLoansTotalOriginal + autoLoansTotalOriginal
  const allLoansPercentRemaining = allLoansTotalOriginal > 0 ? (allLoansTotal / allLoansTotalOriginal) * 100 : 0
  const loansTotal = loansAndTaxes.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const loansTotalOriginal = loansAndTaxes.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  const loanPercentRemaining = loansTotalOriginal > 0 ? (loansTotal / loansTotalOriginal) * 100 : 0
  const totalDebt = creditCardBalanceTotal + loansTotal
  const totalDebtOriginal = creditCardLimitTotal + loansTotalOriginal
  const totalDebtUtilization = totalDebtOriginal > 0 ? (totalDebt / totalDebtOriginal) * 100 : 0

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" style={{ minWidth: 0 }}>
      <div className="max-w-full mx-auto" style={{ maxWidth: '1600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Finance Overview</h2>
          <p className="text-gray-400 mt-1">Track your weekly balances and net worth</p>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-yellow-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-800 text-white border border-gray-700 rounded-lg"
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Balances'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6" />
            <p className="text-sm opacity-90">Net Worth</p>
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(summary?.net_worth || 0)}</h3>
        </div>

        {/* Cash Total */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6" />
            <p className="text-sm opacity-90">Cash Total</p>
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(summary?.cash_total || 0)}</h3>
        </div>

        {/* Credit Cards Owed */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6" />
            <p className="text-sm opacity-90">Credit Cards Owed</p>
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(summary?.credit_cards_owed || 0)}</h3>
        </div>

        {/* Cash on Hand */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <p className="text-sm opacity-90">Cash on Hand</p>
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(summary?.cash_on_hand || 0)}</h3>
        </div>
      </div>

      {/* 4-Column Balance Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Cash Accounts */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-green-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/30">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-400">Cash</h3>
          </div>
          <div className="space-y-2.5">
            {cashAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-2">
                <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                <div className="flex items-center gap-1">
                  <span className="text-green-400 text-lg font-semibold">$</span>
                  <input
                    type="text"
                    value={formatNumber(balances[account.id] || 0)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                    className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 mt-2 border-t border-green-500/40">
            <div className="flex items-center justify-between bg-green-500/10 p-2 rounded">
              <span className="text-base font-bold text-green-300">Total</span>
              <span className="text-lg font-bold text-green-400">{formatCurrency(cashTotal)}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Investments */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-blue-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/30">
            <div className="p-1.5 bg-blue-500/10 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-bold text-blue-400">Investments</h3>
          </div>
          <div className="space-y-2.5">
            {investmentAccounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between gap-2">
                <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                <div className="flex items-center gap-1">
                  <span className="text-blue-400 text-lg font-semibold">$</span>
                  <input
                    type="text"
                    value={formatNumber(balances[account.id] || 0)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                    className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 mt-2 border-t border-blue-500/40">
            <div className="flex items-center justify-between bg-blue-500/10 p-2 rounded">
              <span className="text-base font-bold text-blue-300">Total</span>
              <span className="text-lg font-bold text-blue-400">{formatCurrency(investmentTotal)}</span>
            </div>
          </div>
        </div>

        {/* Column 3: Credit Cards */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-orange-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-500/30">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-orange-400">Credit Cards</h3>
          </div>
          <div className="space-y-2.5">
            {creditCardAccounts.map((account) => {
              const balance = balances[account.id] || 0
              const limit = account.credit_limit || 0
              const utilization = limit > 0 ? (balance / limit) * 100 : 0
              return (
                <div key={account.id} className="flex items-center justify-between gap-2">
                  <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 text-lg font-semibold">$</span>
                    <input
                      type="text"
                      value={formatNumber(balance)}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                      className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                    />
                    <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(limit)}</span>
                    <span className={`text-base font-semibold w-12 text-right ${utilization > 70 ? 'text-orange-400' : 'text-gray-400'}`}>{utilization.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="pt-2 mt-2 border-t border-orange-500/40 space-y-1">
            <div className="flex items-center justify-between bg-orange-500/10 p-2 rounded">
              <span className="text-base font-bold text-orange-300">Total Owed</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-orange-400">{formatCurrency(creditCardBalanceTotal)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(creditCardLimitTotal)}</span>
                <span className={`text-base font-semibold w-12 text-right ${creditUtilization > 70 ? 'text-orange-400' : 'text-gray-400'}`}>{creditUtilization.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-orange-500/10 p-2 rounded">
              <span className="text-base font-bold text-orange-300">Total Available</span>
              <span className="text-lg font-bold text-orange-400">{formatCurrency(creditCardLimitTotal - creditCardBalanceTotal)}</span>
            </div>
          </div>
        </div>

        {/* Column 4: Loans & Taxes */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-red-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/30">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <Landmark className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-400">Loans & Taxes</h3>
          </div>
          <div className="space-y-3">
            {/* Personal Loans Section */}
            {personalLoans.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-2">Personal Loans</h4>
                <div className="space-y-2.5">
                  {personalLoans.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    return (
                      <div key={account.id} className="flex items-center justify-between gap-2">
                        <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-lg font-semibold">$</span>
                          <input
                            type="text"
                            value={formatNumber(balance)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className={`text-base font-semibold w-12 text-right ${percentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                    <span className="text-sm font-bold text-red-300">Total Personal Loans</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-red-400">{formatCurrency(personalLoansTotal)}</span>
                      <span className="text-gray-400 text-sm font-medium w-20 text-right">{formatCurrency(personalLoansTotalOriginal)}</span>
                      <span className={`text-sm font-semibold w-12 text-right ${personalLoansPercentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{personalLoansPercentRemaining.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Loans Section */}
            {autoLoans.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-2">Auto Loans</h4>
                <div className="space-y-2.5">
                  {autoLoans.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    return (
                      <div key={account.id} className="flex items-center justify-between gap-2">
                        <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-lg font-semibold">$</span>
                          <input
                            type="text"
                            value={formatNumber(balance)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className={`text-base font-semibold w-12 text-right ${percentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                    <span className="text-sm font-bold text-red-300">Total Loans</span>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-red-400">{formatCurrency(allLoansTotal)}</span>
                      <span className="text-gray-400 text-sm font-medium w-20 text-right">{formatCurrency(allLoansTotalOriginal)}</span>
                      <span className={`text-sm font-semibold w-12 text-right ${allLoansPercentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{allLoansPercentRemaining.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Taxes Section */}
            {taxes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-300 mb-2">Taxes</h4>
                <div className="space-y-2.5">
                  {taxes.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    return (
                      <div key={account.id} className="flex items-center justify-between gap-2">
                        <label className="text-gray-300 text-lg font-medium truncate flex-1">{account.account_name}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 text-lg font-semibold">$</span>
                          <input
                            type="text"
                            value={formatNumber(balance)}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className="w-28 px-2 py-2 bg-gray-900 text-white border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none"
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className={`text-base font-semibold w-12 text-right ${percentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="pt-2 mt-2 border-t border-red-500/40 space-y-1">
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-base font-bold text-red-300">Total Loans & Taxes</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">{formatCurrency(loansTotal)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(loansTotalOriginal)}</span>
                <span className={`text-base font-semibold w-12 text-right ${loanPercentRemaining > 70 ? 'text-red-400' : 'text-gray-400'}`}>{loanPercentRemaining.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-base font-bold text-red-300">Total Paid</span>
              <span className="text-lg font-bold text-red-400">{formatCurrency(loansTotalOriginal - loansTotal)}</span>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-base font-bold text-red-300">Total CC, Loans, & Taxes</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-400">{formatCurrency(totalDebt)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(totalDebtOriginal)}</span>
                <span className={`text-base font-semibold w-12 text-right ${totalDebtUtilization > 70 ? 'text-red-400' : 'text-gray-400'}`}>{totalDebtUtilization.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Log Section - Full Width */}
      <div className="mt-8">
        <div className="flex items-center gap-3 mb-5">
          <History className="text-blue-400" size={28} />
          <h2 className="text-2xl font-bold text-white">Net Worth History</h2>
          <span className="text-gray-400 text-sm ml-2">(Last 30 entries)</span>
        </div>

        {historyLoading ? (
          <div className="text-gray-400 p-5 text-center">Loading history...</div>
        ) : !netWorthHistory || netWorthHistory.length === 0 ? (
          <div className="bg-gray-900 border-2 border-dashed border-gray-700 rounded-xl p-10 text-center text-gray-400">
            <History size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-base mb-2">No history yet</p>
            <p className="text-sm">Save your balances to start tracking your net worth over time</p>
          </div>
        ) : (
          <div className="bg-gray-900 border-2 border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-black border-b-2 border-gray-800">
                    <th className="px-3 py-4 text-center text-gray-400 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-black z-10">
                      Date
                    </th>
                    <th className="px-3 py-4 text-center text-green-400 text-xs font-semibold uppercase tracking-wide">
                      Net Worth
                    </th>
                    <th className="px-3 py-4 text-center text-gray-400 text-xs font-semibold uppercase tracking-wide">
                      Change
                    </th>
                    {/* Cash Accounts - Green */}
                    {netWorthHistory[0]?.cash_accounts.map((acc) => (
                      <th key={acc.name} className="px-3 py-4 text-center text-green-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                        {acc.name}
                      </th>
                    ))}
                    {/* Investment Accounts - Blue */}
                    {netWorthHistory[0]?.investment_accounts.map((acc) => (
                      <th key={acc.name} className="px-3 py-4 text-center text-blue-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                        {acc.name}
                      </th>
                    ))}
                    {/* Credit Card Accounts - Amber */}
                    {netWorthHistory[0]?.credit_card_accounts.map((acc) => (
                      <th key={acc.name} className="px-3 py-4 text-center text-amber-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                        {acc.name}
                      </th>
                    ))}
                    {/* Loan Accounts - Red */}
                    {netWorthHistory[0]?.loan_accounts.map((acc) => (
                      <th key={acc.name} className="px-3 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                        {acc.name}
                      </th>
                    ))}
                    {/* Tax Accounts - Red */}
                    {netWorthHistory[0]?.tax_accounts.map((acc) => (
                      <th key={acc.name} className="px-3 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                        {acc.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {netWorthHistory.map((entry, index) => {
                    const previousEntry = index < netWorthHistory.length - 1 ? netWorthHistory[index + 1] : null
                    const change = previousEntry ? entry.net_worth - previousEntry.net_worth : 0
                    const changePercentage = previousEntry && previousEntry.net_worth !== 0
                      ? ((change / Math.abs(previousEntry.net_worth)) * 100)
                      : 0

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-gray-800 ${index === 0 ? 'bg-gray-950' : ''}`}
                      >
                        <td className={`px-3 py-4 text-center text-white text-sm sticky left-0 ${index === 0 ? 'bg-gray-950 font-semibold' : 'bg-gray-900'} z-10`}>
                          {new Date(entry.snapshot_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {index === 0 && (
                            <span className="ml-2 text-xs px-2 py-1 bg-blue-500 text-white rounded font-semibold">
                              LATEST
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-4 text-center text-green-500 text-base font-bold whitespace-nowrap">
                          {formatCurrency(entry.net_worth)}
                        </td>
                        <td className="px-3 py-4 text-center">
                          {previousEntry ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {change >= 0 ? '+' : ''}{formatCurrency(change)}
                              </span>
                              <span className={`text-xs ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {change >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        {/* Cash Account Values */}
                        {entry.cash_accounts.map((acc, accIndex) => {
                          const prevAcc = previousEntry?.cash_accounts[accIndex]
                          const accChange = prevAcc ? acc.balance - prevAcc.balance : 0
                          const accChangePercent = prevAcc && prevAcc.balance !== 0 ? (accChange / Math.abs(prevAcc.balance)) * 100 : 0
                          return (
                            <td key={acc.name} className="px-3 py-4 text-center text-white text-sm whitespace-nowrap">
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatCurrency(acc.balance)}</span>
                                {previousEntry && (
                                  <span className={`text-xs ${accChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {accChange >= 0 ? '+' : ''}{accChangePercent.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        {/* Investment Account Values */}
                        {entry.investment_accounts.map((acc, accIndex) => {
                          const prevAcc = previousEntry?.investment_accounts[accIndex]
                          const accChange = prevAcc ? acc.balance - prevAcc.balance : 0
                          const accChangePercent = prevAcc && prevAcc.balance !== 0 ? (accChange / Math.abs(prevAcc.balance)) * 100 : 0
                          return (
                            <td key={acc.name} className="px-3 py-4 text-center text-white text-sm whitespace-nowrap">
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatCurrency(acc.balance)}</span>
                                {previousEntry && (
                                  <span className={`text-xs ${accChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {accChange >= 0 ? '+' : ''}{accChangePercent.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        {/* Credit Card Account Values */}
                        {entry.credit_card_accounts.map((acc, accIndex) => {
                          const prevAcc = previousEntry?.credit_card_accounts[accIndex]
                          const accChange = prevAcc ? acc.balance - prevAcc.balance : 0
                          const accChangePercent = prevAcc && prevAcc.balance !== 0 ? (accChange / Math.abs(prevAcc.balance)) * 100 : 0
                          return (
                            <td key={acc.name} className="px-3 py-4 text-center text-amber-500 text-sm whitespace-nowrap">
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatCurrency(acc.balance)}</span>
                                {previousEntry && (
                                  <span className={`text-xs ${accChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {accChange >= 0 ? '+' : ''}{accChangePercent.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        {/* Loan Account Values */}
                        {entry.loan_accounts.map((acc, accIndex) => {
                          const prevAcc = previousEntry?.loan_accounts[accIndex]
                          const accChange = prevAcc ? acc.balance - prevAcc.balance : 0
                          const accChangePercent = prevAcc && prevAcc.balance !== 0 ? (accChange / Math.abs(prevAcc.balance)) * 100 : 0
                          return (
                            <td key={acc.name} className="px-3 py-4 text-center text-red-500 text-sm whitespace-nowrap">
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatCurrency(acc.balance)}</span>
                                {previousEntry && (
                                  <span className={`text-xs ${accChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {accChange >= 0 ? '+' : ''}{accChangePercent.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                        {/* Tax Account Values */}
                        {entry.tax_accounts.map((acc, accIndex) => {
                          const prevAcc = previousEntry?.tax_accounts[accIndex]
                          const accChange = prevAcc ? acc.balance - prevAcc.balance : 0
                          const accChangePercent = prevAcc && prevAcc.balance !== 0 ? (accChange / Math.abs(prevAcc.balance)) * 100 : 0
                          return (
                            <td key={acc.name} className="px-3 py-4 text-center text-red-500 text-sm whitespace-nowrap">
                              <div className="flex flex-col items-center gap-0.5">
                                <span>{formatCurrency(acc.balance)}</span>
                                {previousEntry && (
                                  <span className={`text-xs ${accChange >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {accChange >= 0 ? '+' : ''}{accChangePercent.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default FinanceOverview
