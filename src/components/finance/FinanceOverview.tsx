import { useState, useEffect, useMemo } from 'react'
import { Wallet, TrendingUp, CreditCard, DollarSign, Calendar, Save, Landmark, History } from 'lucide-react'
import {
  useAccountsWithBalances,
  useNetWorthSummary,
  useSaveBalanceSnapshots,
  useSaveNetWorthLog,
  useNetWorthLog,
} from '../../hooks/useFinance'
import type { AccountDetail, NetWorthLogEntry, AccountSubcategory } from '../../types/finance'
import { formatDateString, getTodayNoon, parseLocalDate } from '../../utils/dateHelpers'

interface TrendSnapshot {
  changeLast: number
  percentLast: number
  change30Days: number
  percent30Days: number
  change1Year: number
  percent1Year: number
}

const FinanceOverview = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDateString(getTodayNoon())
  )
  const [balances, setBalances] = useState<Record<string, number>>({})
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [updatedAccounts, setUpdatedAccounts] = useState<Set<string>>(new Set())
  const [sortedCreditCardIds, setSortedCreditCardIds] = useState<string[]>([])

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
  const { data: yearHistory } = useNetWorthLog(365)
  const saveBalances = useSaveBalanceSnapshots()
  const saveNetWorthLog = useSaveNetWorthLog()

  const accountSubcategoryByName = useMemo(() => {
    const map = new Map<string, AccountSubcategory>()
    accounts?.forEach((account) => {
      map.set(account.account_name.toLowerCase(), account.subcategory)
    })
    return map
  }, [accounts])

  // Initialize balances when accounts load
  useEffect(() => {
    if (accounts) {
      const initialBalances: Record<string, number> = {}
      const initialInputValues: Record<string, string> = {}
      accounts.forEach((account) => {
        initialBalances[account.id] = account.current_balance || 0
        initialInputValues[account.id] = formatNumber(account.current_balance || 0)
      })
      setBalances(initialBalances)
      setInputValues(initialInputValues)
      // Reset updated accounts when date changes or accounts load
      setUpdatedAccounts(new Set())

      // Set initial sort order for credit cards
      const creditCards = accounts.filter((a) => a.subcategory === 'credit_card')
      const sortedIds = creditCards
        .sort((a, b) => (initialBalances[b.id] || 0) - (initialBalances[a.id] || 0))
        .map(a => a.id)
      setSortedCreditCardIds(sortedIds)
    }
  }, [accounts])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  const formatNumber = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  const selectedDateObj = parseLocalDate(selectedDate) ?? new Date()

  const findClosestEntry = (entries: NetWorthLogEntry[] | null | undefined, targetDate: Date) => {
    if (!entries || entries.length === 0) return null

    let closest = entries[0]
    let smallestDiff = Infinity

    for (const entry of entries) {
      const entryDate = parseLocalDate(entry.snapshot_date) ?? new Date(entry.snapshot_date)
      const diff = Math.abs(entryDate.getTime() - targetDate.getTime())
      if (diff < smallestDiff) {
        smallestDiff = diff
        closest = entry
      }
    }

    return closest
  }

  const formatChangeLabel = (delta: number | null) => {
    if (delta === null) return '-'
    const rounded = Math.round(delta)
    if (rounded === 0) return '$0'
    const formatted = formatCurrency(Math.abs(rounded))
    return `${rounded > 0 ? '+' : '-'}${formatted}`
  }

  const getChangeColor = (delta: number | null, positiveIsGood = true) => {
    if (delta === null) return 'text-gray-500'
    const rounded = Math.round(delta)
    if (rounded === 0) return 'text-gray-400'
    const isPositive = rounded > 0
    if (positiveIsGood) {
      return isPositive ? 'text-green-500' : 'text-red-500'
    }
    return isPositive ? 'text-red-500' : 'text-green-500'
  }

  const renderTrendSummary = (
    trends: TrendSnapshot,
    positiveIsGood = true,
    variant: 'default' | 'compact' = 'default'
  ) => {
    const entries = [
      { label: 'Year', change: trends.change1Year, percent: trends.percent1Year },
      { label: '30d', change: trends.change30Days, percent: trends.percent30Days },
      { label: 'Last', change: trends.changeLast, percent: trends.percentLast },
    ]

    return (
      <div className={variant === 'compact' ? '' : 'mt-4'}>
        <div
          className={`rounded-lg border border-white/10 bg-white/5 ${
            variant === 'compact' ? 'px-3 py-2 text-xs leading-relaxed' : 'p-3 backdrop-blur-sm'
          }`}
        >
          <div
            className={`font-semibold uppercase tracking-[0.2em] text-white/60 ${
              variant === 'compact' ? 'mb-1 text-[0.6rem]' : 'mb-2 text-[0.7rem]'
            }`}
          >
            Trend
          </div>
          <div className={variant === 'compact' ? 'space-y-1' : 'space-y-1.5'}>
            {entries.map(({ label, change, percent }) => {
              const isPositive = change >= 0
              const isGood = positiveIsGood ? isPositive : !isPositive
              const hasMovement = Math.abs(change) >= 0.5
              const color = hasMovement ? (isGood ? 'text-emerald-300' : 'text-rose-300') : 'text-white/70'

              return (
                <div
                  key={label}
                  className={`flex items-center justify-between ${
                    variant === 'compact' ? 'text-[0.7rem]' : 'text-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center justify-center rounded-md bg-white/10 font-medium uppercase tracking-wide text-white/80 ${
                        variant === 'compact' ? 'px-1.5 py-0.5 text-[0.55rem]' : 'px-2 py-0.5 text-[0.7rem]'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  <span className={`font-semibold ${color}`}>
                    {change >= 0 ? '+' : ''}{formatCurrency(change)}
                    <span className={`ml-1 text-white/60 ${variant === 'compact' ? 'text-[0.6rem]' : 'text-xs'}`}>
                      ({percent >= 0 ? '+' : ''}{percent.toFixed(0)}%)
                    </span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Calculate trends from historical data
  const calculateTrends = (currentValue: number, metricType: 'netWorth' | 'cash' | 'creditDebt' | 'totalDebt') => {
    const historySource = yearHistory && yearHistory.length > 0 ? yearHistory : netWorthHistory
    if (!historySource || historySource.length === 0) {
      return {
        changeLast: 0,
        percentLast: 0,
        change30Days: 0,
        percent30Days: 0,
        change1Year: 0,
        percent1Year: 0,
      }
    }

    const lastEntry = netWorthHistory && netWorthHistory.length > 0 ? netWorthHistory[0] : historySource[0]
    const thirtyDaysTarget = new Date(selectedDateObj)
    thirtyDaysTarget.setDate(thirtyDaysTarget.getDate() - 30)
    const oneYearTarget = new Date(selectedDateObj)
    oneYearTarget.setFullYear(oneYearTarget.getFullYear() - 1)

    const thirtyDayEntry = findClosestEntry(historySource, thirtyDaysTarget) || lastEntry
    const oneYearEntry = findClosestEntry(historySource, oneYearTarget) || lastEntry

    const computeValue = (entry: NetWorthLogEntry | null, type: typeof metricType) => {
      if (!entry) return 0
      const totalAssets = entry.cash_total + entry.investments_total
      const totalDebt = entry.credit_cards_owed + entry.loans_total + entry.taxes_owed
      const personalLoans = entry.loan_accounts
        .filter((acc) => {
          const nameKey = acc.name.toLowerCase()
          const subcategory = accountSubcategoryByName.get(nameKey)
          if (subcategory === 'auto_loan') return false
          if (subcategory === 'personal_loan') return true
          return !nameKey.includes('auto')
        })
        .reduce((sum, acc) => sum + acc.balance, 0)

      switch (type) {
        case 'netWorth':
          return totalAssets - totalDebt
        case 'cash':
          return entry.cash_total
        case 'creditDebt':
          return entry.credit_cards_owed + personalLoans
        case 'totalDebt':
          return totalDebt
      }
    }

    const valueLast = computeValue(lastEntry, metricType)
    const value30Days = computeValue(thirtyDayEntry, metricType)
    const value1Year = computeValue(oneYearEntry, metricType)

    const changeLast = currentValue - valueLast
    const change30Days = currentValue - value30Days
    const change1Year = currentValue - value1Year
    const percentLast = valueLast !== 0 ? (changeLast / Math.abs(valueLast)) * 100 : 0
    const percent30Days = value30Days !== 0 ? (change30Days / Math.abs(value30Days)) * 100 : 0
    const percent1Year = value1Year !== 0 ? (change1Year / Math.abs(value1Year)) * 100 : 0

    return {
      changeLast,
      percentLast,
      change30Days,
      percent30Days,
      change1Year,
      percent1Year
    }
  }

  // TODO: Apply color-coded percentages later
  // const getPercentageColor = (percentage: number) => {
  //   if (percentage <= 20) return 'text-green-400'
  //   if (percentage <= 50) return 'text-orange-400'
  //   return 'text-red-400'
  // }

  const handleBalanceChange = (accountId: string, value: string) => {
    // Store the raw input value
    setInputValues((prev) => ({
      ...prev,
      [accountId]: value,
    }))

    // Remove commas and parse for calculations
    const cleanValue = value.replace(/,/g, '')
    const numValue = parseFloat(cleanValue) || 0
    setBalances((prev) => ({
      ...prev,
      [accountId]: numValue,
    }))

    // Mark this account as updated
    setUpdatedAccounts(prev => new Set(prev).add(accountId))
  }

  const handleFocus = (accountId: string) => {
    setFocusedInput(accountId)
    // Clear the input when focused so user can type fresh
    setInputValues((prev) => ({
      ...prev,
      [accountId]: '',
    }))
  }

  const handleBlur = (accountId: string) => {
    setFocusedInput(null)
    // Format the input value when blurred
    const balance = balances[accountId] || 0
    setInputValues((prev) => ({
      ...prev,
      [accountId]: formatNumber(balance),
    }))

    // Re-sort credit cards after editing
    const sortedIds = creditCardAccounts
      .sort((a, b) => (balances[b.id] || 0) - (balances[a.id] || 0))
      .map(a => a.id)
    setSortedCreditCardIds(sortedIds)
  }

  const getInputValue = (accountId: string) => {
    // If this input is focused, show raw value; otherwise show formatted
    if (focusedInput === accountId) {
      return inputValues[accountId] || ''
    }
    return formatNumber(balances[accountId] || 0)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Save individual balance snapshots
      // For DATE columns, send YYYY-MM-DD string directly (not ISO timestamp)
      if (!selectedDate) {
        alert('Invalid date selected')
        setIsSaving(false)
        return
      }

      const snapshots = Object.entries(balances).map(([accountId, balance]) => ({
        account_id: accountId,
        balance,
        snapshot_date: selectedDate, // Send YYYY-MM-DD directly for DATE type
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
        const netWorthValue = cashTotal + investmentsTotal - (creditCardsOwed + loansTotal + taxesOwed)

        // Save net worth log
        await saveNetWorthLog.mutateAsync({
          snapshot_date: selectedDate, // Send YYYY-MM-DD directly for DATE type
          net_worth: netWorthValue,
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
  const taxesTotal = taxes.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const taxesTotalOriginal = taxes.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  const taxesPercentRemaining = taxesTotalOriginal > 0 ? (taxesTotal / taxesTotalOriginal) * 100 : 0
  const allLoansTotal = personalLoansTotal + autoLoansTotal
  const allLoansTotalOriginal = personalLoansTotalOriginal + autoLoansTotalOriginal
  const allLoansPercentRemaining = allLoansTotalOriginal > 0 ? (allLoansTotal / allLoansTotalOriginal) * 100 : 0
  const loansTotal = loansAndTaxes.reduce((sum, acc) => sum + (balances[acc.id] || 0), 0)
  const loansTotalOriginal = loansAndTaxes.reduce((sum, acc) => sum + (acc.credit_limit || 0), 0)
  const loanPercentRemaining = loansTotalOriginal > 0 ? (loansTotal / loansTotalOriginal) * 100 : 0
  const totalDebt = creditCardBalanceTotal + loansTotal
  const totalDebtOriginal = creditCardLimitTotal + loansTotalOriginal
  const totalDebtUtilization = totalDebtOriginal > 0 ? (totalDebt / totalDebtOriginal) * 100 : 0
  const netWorthCurrent = cashTotal + investmentTotal - totalDebt

  const netWorthTrends = calculateTrends(netWorthCurrent, 'netWorth')
  const cashTrends = calculateTrends(cashTotal, 'cash')
  const creditDebtTrends = calculateTrends(creditCardBalanceTotal + personalLoansTotal, 'creditDebt')
  const totalDebtTrends = calculateTrends(totalDebt, 'totalDebt')

  return (
    <div className="h-full overflow-y-auto px-3 sm:px-4 lg:px-5 py-4 space-y-4" style={{ minWidth: 0 }}>
      <div className="w-full max-w-screen-2xl mx-auto px-3 sm:px-4 lg:px-6" style={{ minWidth: 0 }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Net Worth</h2>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-4 text-white min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 flex-shrink-0" />
                <p className="text-base font-semibold tracking-wide uppercase text-white">Net Worth</p>
              </div>
              <h3 className="text-[2.4rem] sm:text-[2.6rem] font-bold leading-tight">{formatCurrency(netWorthCurrent)}</h3>
            </div>
            {renderTrendSummary(netWorthTrends, true, 'compact')}
          </div>
        </div>

        {/* Cash on Hand */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 flex-shrink-0" />
                <p className="text-base font-semibold tracking-wide uppercase text-white">Cash on Hand</p>
              </div>
              <h3 className="text-[2.4rem] sm:text-[2.6rem] font-bold leading-tight">{formatCurrency(cashTotal || 0)}</h3>
            </div>
            {renderTrendSummary(cashTrends, true, 'compact')}
          </div>
        </div>

        {/* CC & Personal */}
        <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-4 text-white min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 flex-shrink-0" />
                <p className="text-base font-semibold tracking-wide uppercase text-white">CC & Personal</p>
              </div>
              <h3 className="text-[2.4rem] sm:text-[2.6rem] font-bold leading-tight">{formatCurrency(creditCardBalanceTotal + personalLoansTotal)}</h3>
            </div>
            {renderTrendSummary(creditDebtTrends, false, 'compact')}
          </div>
        </div>

        {/* Total Debt */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-white min-w-0 overflow-hidden">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 flex-shrink-0" />
                <p className="text-base font-semibold tracking-wide uppercase text-white">Total Debt</p>
              </div>
              <h3 className="text-[2.4rem] sm:text-[2.6rem] font-bold leading-tight">{formatCurrency(totalDebt)}</h3>
            </div>
            {renderTrendSummary(totalDebtTrends, false, 'compact')}
          </div>
        </div>
      </div>

      {/* 3-Column Balance Entry */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
        {/* Column 1: Cash & Investments */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-green-500/20 shadow-xl flex flex-col h-full">
          <div className="flex items-center gap-2 pb-2 border-b border-green-500/30 mb-4">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-green-400">Cash & Investments</h3>
          </div>
          <div className="flex-1 space-y-4">
            {/* Cash Section */}
            <div>
              <div className="space-y-2.5">
                {cashAccounts.map((account) => {
                  const isUpdated = updatedAccounts.has(account.id)
                  return (
                    <div key={account.id} className="flex items-center justify-between gap-2">
                      <label className="text-gray-300 text-base font-medium truncate flex-1">{account.account_name}</label>
                      <div className="flex items-center gap-0.5 w-36 justify-end">
                        <span className="text-green-400 text-base font-semibold">$</span>
                        <input
                          type="text"
                          value={getInputValue(account.id)}
                          onFocus={() => handleFocus(account.id)}
                          onBlur={() => handleBlur(account.id)}
                          onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                          className={`w-28 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-base font-semibold transition-all focus:outline-none ${
                            isUpdated ? 'text-white' : 'text-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pt-2 mt-2 border-t border-green-500/30">
                <div className="flex items-center justify-between bg-green-500/10 p-2 rounded">
                  <span className="text-lg font-bold text-green-300">Total Cash</span>
                  <span className="text-lg font-bold text-green-400 w-28 text-right">{formatCurrency(cashTotal)}</span>
                </div>
              </div>
            </div>

            {/* Investments Section */}
            <div>
              <div className="space-y-2.5">
                {investmentAccounts.map((account) => {
                  const isUpdated = updatedAccounts.has(account.id)
                  return (
                    <div key={account.id} className="flex items-center justify-between gap-2">
                      <label className="text-gray-300 text-base font-medium truncate flex-1">{account.account_name}</label>
                      <div className="flex items-center gap-0.5 w-36 justify-end">
                        <span className="text-blue-400 text-base font-semibold">$</span>
                        <input
                          type="text"
                          value={getInputValue(account.id)}
                          onFocus={() => handleFocus(account.id)}
                          onBlur={() => handleBlur(account.id)}
                          onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                          className={`w-28 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-base font-semibold transition-all focus:outline-none ${
                            isUpdated ? 'text-white' : 'text-gray-500'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="pt-2 mt-2 border-t border-blue-500/30">
                <div className="flex items-center justify-between bg-blue-500/10 p-2 rounded">
                  <span className="text-xl font-bold text-blue-300">Total Investments</span>
                  <span className="text-xl font-bold text-blue-400 w-28 text-right">{formatCurrency(investmentTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Total */}
          <div className="pt-3 mt-auto border-t border-green-500/40">
            <div className="flex items-center justify-between bg-green-500/20 p-2 rounded">
              <span className="text-xl font-bold text-green-300 whitespace-nowrap">Total Assets</span>
              <span className="text-xl font-bold text-green-400 w-28 text-right">{formatCurrency(cashTotal + investmentTotal)}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Credit Cards */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-orange-500/20 shadow-xl flex flex-col h-full">
          <div className="flex items-center gap-2 pb-2 border-b border-orange-500/30 mb-4">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-orange-400">Credit Cards</h3>
          </div>
          <div className="space-y-2.5 flex-1">
            {sortedCreditCardIds.length > 0
              ? sortedCreditCardIds.map(id => {
                  const account = creditCardAccounts.find(a => a.id === id)
                  if (!account) return null
                  const balance = balances[account.id] || 0
                  const limit = account.credit_limit || 0
                  const utilization = limit > 0 ? (balance / limit) * 100 : 0
                  const isUpdated = updatedAccounts.has(account.id)
                  return (
                  <div key={account.id} className="flex flex-wrap items-center justify-between gap-2 py-0.5">
                    <label className="text-gray-300 text-lg font-medium truncate flex-1 min-w-[120px] max-w-[180px]">{account.account_name}</label>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex items-center gap-0.5 justify-end w-28 sm:w-32">
                        <span className="text-orange-400 text-lg font-semibold">$</span>
                        <input
                          type="text"
                          value={getInputValue(account.id)}
                          onFocus={() => handleFocus(account.id)}
                          onBlur={() => handleBlur(account.id)}
                          onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                          className={`w-20 px-2 py-1 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none ${
                            isUpdated ? 'text-white' : 'text-gray-500'
                          }`}
                        />
                      </div>
                      <span className="text-gray-400 text-base font-medium text-center w-24 sm:w-28">{formatCurrency(limit)}</span>
                      <span className={`text-base font-semibold text-right ${utilization > 70 ? 'text-orange-400' : 'text-gray-400'} w-12`}>{utilization.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })
              : creditCardAccounts.map(account => {
                const balance = balances[account.id] || 0
                const limit = account.credit_limit || 0
                const utilization = limit > 0 ? (balance / limit) * 100 : 0
                const isUpdated = updatedAccounts.has(account.id)
                return (
                  <div key={account.id} className="flex flex-wrap items-center justify-between gap-2 py-0.5">
                    <label className="text-gray-300 text-lg font-medium truncate flex-1 min-w-[120px] max-w-[180px]">{account.account_name}</label>
                    <div className="flex items-center gap-2 justify-end">
                      <div className="flex items-center gap-0.5 justify-end w-28 sm:w-32">
                        <span className="text-orange-400 text-lg font-semibold">$</span>
                        <input
                          type="text"
                          value={getInputValue(account.id)}
                          onFocus={() => handleFocus(account.id)}
                          onBlur={() => handleBlur(account.id)}
                          onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                          className={`w-20 px-2 py-1 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-lg font-semibold transition-all focus:outline-none ${
                            isUpdated ? 'text-white' : 'text-gray-500'
                          }`}
                        />
                      </div>
                      <span className="text-gray-400 text-base font-medium text-center w-24 sm:w-28">{formatCurrency(limit)}</span>
                      <span className={`text-base font-semibold text-right ${utilization > 70 ? 'text-orange-400' : 'text-gray-400'} w-12`}>{utilization.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
          <div className="pt-3 mt-auto border-t border-orange-500/40">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-orange-500/10 p-2 rounded">
              <span className="text-xl font-bold text-orange-300 whitespace-nowrap flex-1 min-w-[120px] max-w-[200px]">Total Credit Cards</span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-xl font-bold text-orange-400 text-right w-24 sm:w-28">{formatCurrency(creditCardBalanceTotal)}</span>
                <span className="text-xl font-bold text-orange-400 text-center w-24 sm:w-28">{formatCurrency(creditCardLimitTotal)}</span>
                <span className={`text-base font-semibold text-right ${creditUtilization > 70 ? 'text-orange-400' : 'text-gray-400'} w-12`}>{creditUtilization.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Loans & Taxes */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-red-500/20 shadow-xl flex flex-col h-full">
          <div className="flex items-center gap-2 pb-2 border-b border-red-500/30 mb-4">
            <div className="p-1.5 bg-red-500/10 rounded-lg">
              <Landmark className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-400">Loans & Taxes</h3>
          </div>
          <div className="space-y-3 flex-1">
            {/* Personal Loans Section */}
            {personalLoans.length > 0 && (
              <div>
                <div className="space-y-2.5">
                  {personalLoans.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    const isUpdated = updatedAccounts.has(account.id)
                    return (
                      <div key={account.id} className="flex items-center justify-between px-2" style={{ paddingTop: '0.225rem', paddingBottom: '0.225rem' }}>
                        <label className="text-gray-300 text-base font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-base font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-base font-semibold transition-all focus:outline-none ${
                              isUpdated ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className="text-gray-400 text-base font-medium w-12 text-right">{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                    <span className="text-lg md:text-xl font-bold text-red-300 min-w-[140px] whitespace-nowrap">Total Personal Loans</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(personalLoansTotal)}</span>
                      <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(personalLoansTotalOriginal)}</span>
                      <span className="text-gray-400 text-base font-bold w-12 text-right">{personalLoansPercentRemaining.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Loans Section */}
            {autoLoans.length > 0 && (
              <div>
                <div className="space-y-2.5">
                  {autoLoans.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    const isUpdated = updatedAccounts.has(account.id)
                    return (
                      <div key={account.id} className="flex items-center justify-between px-2" style={{ paddingTop: '0.225rem', paddingBottom: '0.225rem' }}>
                        <label className="text-gray-300 text-base font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-base font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-base font-semibold transition-all focus:outline-none ${
                              isUpdated ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className="text-gray-400 text-base font-medium w-12 text-right">{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 pt-2 border-t border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                    <span className="text-lg md:text-xl font-bold text-red-300 min-w-[140px] whitespace-nowrap">Total Auto Loans</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(autoLoansTotal)}</span>
                      <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(autoLoansTotalOriginal)}</span>
                      <span className="text-gray-400 text-base font-bold w-12 text-right">{(autoLoansTotalOriginal > 0 ? (autoLoansTotal / autoLoansTotalOriginal) * 100 : 0).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Taxes Section */}
            {taxes.length > 0 && (
              <div>
                <div className="space-y-2.5">
                  {taxes.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    const isUpdated = updatedAccounts.has(account.id)
                    return (
                      <div key={account.id} className="flex items-center justify-between px-2" style={{ paddingTop: '0.225rem', paddingBottom: '0.225rem' }}>
                        <label className="text-gray-300 text-base font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-base font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-base font-semibold transition-all focus:outline-none ${
                              isUpdated ? 'text-white' : 'text-gray-500'
                            }`}
                          />
                          <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(original)}</span>
                          <span className="text-gray-400 text-base font-medium w-12 text-right">{percentRemaining.toFixed(0)}%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="pt-3 mt-auto border-t border-red-500/40 space-y-2">
            {taxes.length > 0 && (
              <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                <span className="text-xl font-bold text-red-300 min-w-[140px] whitespace-nowrap">Total Taxes</span>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(taxesTotal)}</span>
                  <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(taxesTotalOriginal)}</span>
                  <span className="text-gray-400 text-base font-bold w-12 text-right">{taxesPercentRemaining.toFixed(0)}%</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-xl font-bold text-red-300 min-w-[140px] whitespace-nowrap">Total Loans</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(allLoansTotal)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(allLoansTotalOriginal)}</span>
                <span className="text-gray-400 text-base font-bold w-12 text-right">{allLoansPercentRemaining.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-xl font-bold text-red-300 min-w-[140px] whitespace-nowrap">Total Debt</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(totalDebt)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(totalDebtOriginal)}</span>
                <span className="text-gray-400 text-base font-bold w-12 text-right">{totalDebtUtilization.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Net Worth Log Section - Full Width */}
      <div className="mt-8">
        <div className="flex flex-col gap-4 mb-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <History className="text-blue-400" size={28} />
              <h2 className="text-2xl font-bold text-white">Net Worth History</h2>
            </div>
          </div>

          {netWorthHistory && netWorthHistory.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7 gap-4">
              {(() => {
                const bestNetWorth = netWorthHistory.reduce((best, entry) => {
                  const assets = entry.cash_total + entry.investments_total
                  const debt = entry.credit_cards_owed + entry.loans_total + entry.taxes_owed
                  const value = assets - debt
                  if (!best || value > best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestAssets = netWorthHistory.reduce((best, entry) => {
                  const value = entry.cash_total + entry.investments_total
                  if (!best || value > best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestCash = netWorthHistory.reduce((best, entry) => {
                  const value = entry.cash_total
                  if (!best || value > best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestInvestments = netWorthHistory.reduce((best, entry) => {
                  const value = entry.investments_total
                  if (!best || value > best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestCreditCards = netWorthHistory.reduce((best, entry) => {
                  const value = entry.credit_cards_owed
                  if (!best || value < best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestPersonalLoans = netWorthHistory.reduce((best, entry) => {
                  const value = entry.loan_accounts.filter(acc => !acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0)
                  if (!best || value < best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const bestTotalDebt = netWorthHistory.reduce((best, entry) => {
                  const value = entry.credit_cards_owed + entry.loans_total + entry.taxes_owed
                  if (!best || value < best.value) {
                    return { value, date: entry.snapshot_date }
                  }
                  return best
                }, null as { value: number; date: string } | null)

                const formatDate = (dateString?: string) => {
                  if (!dateString) return '—'
                  const date = parseLocalDate(dateString)
                  if (!date) return dateString
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                }

                const ScoreCard = ({ title, value, date, accent }: { title: string; value: number | null; date?: string; accent: 'emerald' | 'rose' }) => {
                  const accentClasses = accent === 'emerald'
                    ? 'border-emerald-400/40 bg-emerald-500/10'
                    : 'border-rose-400/40 bg-rose-500/10'
                  return (
                  <div className={`rounded-xl border ${accentClasses} p-4 shadow-sm`}>
                    <div className="text-sm font-semibold uppercase tracking-wide text-white/70">{title}</div>
                    <div className="mt-2 text-2xl font-semibold text-white">{value !== null ? formatCurrency(value) : '—'}</div>
                    <div className="mt-1 text-sm text-white/60">{formatDate(date)}</div>
                  </div>
                  )
                }

                return (
                  <>
                    <ScoreCard title="Best Net Worth" value={bestNetWorth?.value ?? null} date={bestNetWorth?.date} accent="emerald" />
                    <ScoreCard title="Best Total Assets" value={bestAssets?.value ?? null} date={bestAssets?.date} accent="emerald" />
                    <ScoreCard title="Best Cash" value={bestCash?.value ?? null} date={bestCash?.date} accent="emerald" />
                    <ScoreCard title="Best Investments" value={bestInvestments?.value ?? null} date={bestInvestments?.date} accent="emerald" />
                    <ScoreCard title="Lowest Credit Cards" value={bestCreditCards?.value ?? null} date={bestCreditCards?.date} accent="rose" />
                    <ScoreCard title="Low Personal Loans" value={bestPersonalLoans?.value ?? null} date={bestPersonalLoans?.date} accent="rose" />
                    <ScoreCard title="Lowest Total Debt" value={bestTotalDebt?.value ?? null} date={bestTotalDebt?.date} accent="rose" />
                  </>
                )
              })()}
            </div>
          )}
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
                    <th className="px-5 py-4 text-center text-gray-300 text-base font-semibold tracking-wide sticky left-0 bg-black z-10" style={{minWidth: '120px'}}>
                      Date
                    </th>
                    <th className="px-4 py-4 text-center text-white text-base font-semibold tracking-wide" style={{minWidth: '120px'}}>
                      Net worth
                    </th>
                    <th className="px-4 py-4 text-center text-emerald-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>
                      Cash
                    </th>
                    <th className="px-4 py-4 text-center text-emerald-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '120px'}}>
                      Investments
                    </th>
                    <th className="px-4 py-4 text-center text-emerald-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '130px'}}>
                      Total assets
                    </th>
                    <th className="px-4 py-4 text-center text-rose-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '115px'}}>
                      Credit cards
                    </th>
                    <th className="px-4 py-4 text-center text-rose-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '125px'}}>
                      Personal loans
                    </th>
                    <th className="px-4 py-4 text-center text-rose-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '115px'}}>
                      Auto loans
                    </th>
                    <th className="px-4 py-4 text-center text-rose-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '105px'}}>
                      Taxes
                    </th>
                    <th className="px-4 py-4 text-center text-rose-400 text-base font-semibold tracking-wide whitespace-nowrap" style={{minWidth: '130px'}}>
                      Total debt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {netWorthHistory.map((entry, index) => {
                    const previousEntry = index < netWorthHistory.length - 1 ? netWorthHistory[index + 1] : null

                    // Aggregate current values
                    const totalAssets = entry.cash_total + entry.investments_total
                    const totalDebt = entry.credit_cards_owed + entry.loans_total + entry.taxes_owed
                    const autoLoans = entry.loan_accounts.filter(acc => acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0)
                    const personalLoans = entry.loan_accounts.filter(acc => !acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0)

                    // Previous entry values for change calculations
                    const prevCash = previousEntry ? previousEntry.cash_total : null
                    const prevInvestments = previousEntry ? previousEntry.investments_total : null
                    const prevTotalAssets = previousEntry ? (previousEntry.cash_total + previousEntry.investments_total) : null
                    const prevCreditCards = previousEntry ? previousEntry.credit_cards_owed : null
                    const prevPersonalLoans = previousEntry ? previousEntry.loan_accounts.filter(acc => !acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0) : null
                    const prevAutoLoans = previousEntry ? previousEntry.loan_accounts.filter(acc => acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0) : null
                    const prevTaxes = previousEntry ? previousEntry.taxes_owed : null
                    const prevTotalDebt = previousEntry ? (previousEntry.credit_cards_owed + previousEntry.loans_total + previousEntry.taxes_owed) : null
                    const currentNetWorth = totalAssets - totalDebt
                    const prevNetWorth = previousEntry
                      ? (prevTotalAssets ?? 0) - (prevTotalDebt ?? 0)
                      : null
                    const netWorthDelta = prevNetWorth !== null ? currentNetWorth - prevNetWorth : null
                    const cashDelta = prevCash !== null ? entry.cash_total - prevCash : null
                    const investmentsDelta = prevInvestments !== null ? entry.investments_total - prevInvestments : null
                    const assetsDelta = prevTotalAssets !== null ? totalAssets - prevTotalAssets : null
                    const creditCardsDelta = prevCreditCards !== null ? entry.credit_cards_owed - prevCreditCards : null
                    const personalLoansDelta = prevPersonalLoans !== null ? personalLoans - prevPersonalLoans : null
                    const autoLoansDelta = prevAutoLoans !== null ? autoLoans - prevAutoLoans : null
                    const taxesDelta = prevTaxes !== null ? entry.taxes_owed - prevTaxes : null
                    const totalDebtDelta = prevTotalDebt !== null ? totalDebt - prevTotalDebt : null

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-gray-800 ${index === 0 ? 'bg-gray-950' : ''}`}
                      >
                        <td className={`px-6 py-4 text-center text-white text-lg sticky left-0 ${index === 0 ? 'bg-gray-950 font-semibold' : 'bg-gray-900'} z-10`}>
                          {(() => {
                            // For DATE type fields, parse in local timezone to avoid UTC shift
                            const date = parseLocalDate(entry.snapshot_date)
                            if (!date) return entry.snapshot_date
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          })()}
                        </td>
                        <td className="px-6 py-4 text-center text-white text-[1.55rem] font-semibold whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 shadow-sm">
                            <span className="text-[1.55rem] font-semibold">{formatCurrency(currentNetWorth)}</span>
                            <span className={`text-sm font-medium ${getChangeColor(netWorthDelta, true)}`}>
                              {formatChangeLabel(netWorthDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Cash */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(entry.cash_total)}</span>
                            <span className={`text-base ${getChangeColor(cashDelta, true)}`}>
                              {formatChangeLabel(cashDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Investments */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(entry.investments_total)}</span>
                            <span className={`text-base ${getChangeColor(investmentsDelta, true)}`}>
                              {formatChangeLabel(investmentsDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Total Assets */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 shadow-sm">
                            <span className="text-white text-lg">{formatCurrency(totalAssets)}</span>
                            <span className={`text-base ${getChangeColor(assetsDelta, true)}`}>
                              {formatChangeLabel(assetsDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Credit Cards */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(entry.credit_cards_owed)}</span>
                            <span className={`text-base ${getChangeColor(creditCardsDelta, false)}`}>
                              {formatChangeLabel(creditCardsDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Personal Loans */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(personalLoans)}</span>
                            <span className={`text-base ${getChangeColor(personalLoansDelta, false)}`}>
                              {formatChangeLabel(personalLoansDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Auto Loans */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(autoLoans)}</span>
                            <span className={`text-base ${getChangeColor(autoLoansDelta, false)}`}>
                              {formatChangeLabel(autoLoansDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Taxes */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-lg">{formatCurrency(entry.taxes_owed)}</span>
                            <span className={`text-base ${getChangeColor(taxesDelta, false)}`}>
                              {formatChangeLabel(taxesDelta)}
                            </span>
                          </div>
                        </td>
                        {/* Total Debt */}
                        <td className="px-6 py-4 text-center text-lg whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5 rounded-lg border border-rose-500/25 bg-rose-500/10 px-4 py-2 shadow-sm">
                            <span className="text-white text-lg">{formatCurrency(totalDebt)}</span>
                            <span className={`text-base ${getChangeColor(totalDebtDelta, false)}`}>
                              {formatChangeLabel(totalDebtDelta)}
                            </span>
                          </div>
                        </td>
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
