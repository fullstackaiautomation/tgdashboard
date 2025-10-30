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
import { formatDateString, getTodayNoon, parseLocalDate } from '../../utils/dateHelpers'

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

  // Calculate trends from historical data
  const calculateTrends = (currentValue: number, metricType: 'netWorth' | 'cash' | 'creditDebt' | 'totalDebt') => {
    const lastEntry = netWorthHistory && netWorthHistory.length > 0 ? netWorthHistory[0] : null
    const thirtyDaysAgo = netWorthHistory && netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1] : null
    const oneYearAgo = yearHistory && yearHistory.length > 0 ? yearHistory[yearHistory.length - 1] : null

    let valueLast = 0
    let value30Days = 0
    let value1Year = 0

    if (metricType === 'netWorth') {
      valueLast = lastEntry?.net_worth || 0
      value30Days = thirtyDaysAgo?.net_worth || 0
      value1Year = oneYearAgo?.net_worth || 0
    } else if (metricType === 'cash') {
      valueLast = lastEntry?.cash_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value30Days = thirtyDaysAgo?.cash_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value1Year = oneYearAgo?.cash_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
    } else if (metricType === 'creditDebt') {
      const creditLast = lastEntry?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loansLast = lastEntry?.loan_accounts?.filter(acc => acc.name.includes('Personal'))
        .reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      valueLast = creditLast + loansLast

      const credit30 = thirtyDaysAgo?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loans30 = thirtyDaysAgo?.loan_accounts?.filter(acc => acc.name.includes('Personal'))
        .reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value30Days = credit30 + loans30

      const credit1Y = oneYearAgo?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loans1Y = oneYearAgo?.loan_accounts?.filter(acc => acc.name.includes('Personal'))
        .reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value1Year = credit1Y + loans1Y
    } else if (metricType === 'totalDebt') {
      const creditLast = lastEntry?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loansLast = lastEntry?.loan_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const taxLast = lastEntry?.tax_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      valueLast = creditLast + loansLast + taxLast

      const credit30 = thirtyDaysAgo?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loans30 = thirtyDaysAgo?.loan_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const tax30 = thirtyDaysAgo?.tax_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value30Days = credit30 + loans30 + tax30

      const credit1Y = oneYearAgo?.credit_card_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const loans1Y = oneYearAgo?.loan_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      const tax1Y = oneYearAgo?.tax_accounts?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0
      value1Year = credit1Y + loans1Y + tax1Y
    }

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

        // Save net worth log
        await saveNetWorthLog.mutateAsync({
          snapshot_date: selectedDate, // Send YYYY-MM-DD directly for DATE type
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

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6" style={{ minWidth: 0 }}>
      <div className="max-w-full mx-auto" style={{ maxWidth: '1600px' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Net Worth */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6" />
            <p className="text-sm opacity-90">Net Worth</p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-5xl font-bold">{formatCurrency(summary?.net_worth || 0)}</h3>
            {(() => {
              const trends = calculateTrends(summary?.net_worth || 0, 'netWorth')
              return (
                <div className="space-y-0">
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">1y:</span>
                    <span className={`${trends.change1Year >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change1Year >= 0 ? '+' : ''}{formatCurrency(trends.change1Year)}
                    </span>
                    <span className={`${trends.change1Year >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent1Year >= 0 ? '+' : ''}{trends.percent1Year.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">30d:</span>
                    <span className={`${trends.change30Days >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change30Days >= 0 ? '+' : ''}{formatCurrency(trends.change30Days)}
                    </span>
                    <span className={`${trends.change30Days >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent30Days >= 0 ? '+' : ''}{trends.percent30Days.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">last:</span>
                    <span className={`${trends.changeLast >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.changeLast >= 0 ? '+' : ''}{formatCurrency(trends.changeLast)}
                    </span>
                    <span className={`${trends.changeLast >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percentLast >= 0 ? '+' : ''}{trends.percentLast.toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Cash on Hand */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6" />
            <p className="text-sm opacity-90">Cash on Hand</p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-5xl font-bold">{formatCurrency(cashTotal || 0)}</h3>
            {(() => {
              const trends = calculateTrends(cashTotal, 'cash')
              return (
                <div className="space-y-0">
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">1y:</span>
                    <span className={`${trends.change1Year >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change1Year >= 0 ? '+' : ''}{formatCurrency(trends.change1Year)}
                    </span>
                    <span className={`${trends.change1Year >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent1Year >= 0 ? '+' : ''}{trends.percent1Year.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">30d:</span>
                    <span className={`${trends.change30Days >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change30Days >= 0 ? '+' : ''}{formatCurrency(trends.change30Days)}
                    </span>
                    <span className={`${trends.change30Days >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent30Days >= 0 ? '+' : ''}{trends.percent30Days.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">last:</span>
                    <span className={`${trends.changeLast >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.changeLast >= 0 ? '+' : ''}{formatCurrency(trends.changeLast)}
                    </span>
                    <span className={`${trends.changeLast >= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percentLast >= 0 ? '+' : ''}{trends.percentLast.toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* CC & Personal */}
        <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-6 h-6" />
            <p className="text-sm opacity-90">CC & Personal</p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-5xl font-bold">{formatCurrency(creditCardBalanceTotal + personalLoansTotal)}</h3>
            {(() => {
              const trends = calculateTrends(creditCardBalanceTotal + personalLoansTotal, 'creditDebt')
              return (
                <div className="space-y-0">
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">1y:</span>
                    <span className={`${trends.change1Year <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[60px] text-right`}>
                      {trends.change1Year >= 0 ? '+' : ''}{formatCurrency(trends.change1Year)}
                    </span>
                    <span className={`${trends.change1Year <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[50px] text-right`}>({trends.percent1Year >= 0 ? '+' : ''}{trends.percent1Year.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">30d:</span>
                    <span className={`${trends.change30Days <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[60px] text-right`}>
                      {trends.change30Days >= 0 ? '+' : ''}{formatCurrency(trends.change30Days)}
                    </span>
                    <span className={`${trends.change30Days <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[50px] text-right`}>({trends.percent30Days >= 0 ? '+' : ''}{trends.percent30Days.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">last:</span>
                    <span className={`${trends.changeLast <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[60px] text-right`}>
                      {trends.changeLast >= 0 ? '+' : ''}{formatCurrency(trends.changeLast)}
                    </span>
                    <span className={`${trends.changeLast <= 0 ? 'text-green-200' : 'text-red-200'} min-w-[50px] text-right`}>({trends.percentLast >= 0 ? '+' : ''}{trends.percentLast.toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>

        {/* Total Debt */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6" />
            <p className="text-sm opacity-90">Total Debt</p>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-5xl font-bold">{formatCurrency(totalDebt)}</h3>
            {(() => {
              const trends = calculateTrends(totalDebt, 'totalDebt')
              return (
                <div className="space-y-0">
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">1y:</span>
                    <span className={`${trends.change1Year <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change1Year >= 0 ? '+' : ''}{formatCurrency(trends.change1Year)}
                    </span>
                    <span className={`${trends.change1Year <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent1Year >= 0 ? '+' : ''}{trends.percent1Year.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">30d:</span>
                    <span className={`${trends.change30Days <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.change30Days >= 0 ? '+' : ''}{formatCurrency(trends.change30Days)}
                    </span>
                    <span className={`${trends.change30Days <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percent30Days >= 0 ? '+' : ''}{trends.percent30Days.toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-0.5 text-sm">
                    <span className="w-7 text-right font-bold opacity-80">last:</span>
                    <span className={`${trends.changeLast <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[60px] text-right`}>
                      {trends.changeLast >= 0 ? '+' : ''}{formatCurrency(trends.changeLast)}
                    </span>
                    <span className={`${trends.changeLast <= 0 ? 'text-green-400' : 'text-red-400'} min-w-[50px] text-right`}>({trends.percentLast >= 0 ? '+' : ''}{trends.percentLast.toFixed(0)}%)</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* 3-Column Balance Entry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Cash & Investments */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-green-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-500/30">
            <div className="p-1.5 bg-green-500/10 rounded-lg">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-green-400">Cash & Investments</h3>
          </div>

          {/* Cash Section */}
          <div className="mb-3">
            <div className="space-y-2.5">
              {cashAccounts.map((account) => {
                const isUpdated = updatedAccounts.has(account.id)
                return (
                  <div key={account.id} className="flex items-center justify-between gap-2">
                    <label className="text-gray-300 text-xl font-medium truncate flex-1">{account.account_name}</label>
                    <div className="flex items-center gap-0.5 w-36 justify-end">
                      <span className="text-green-400 text-xl font-semibold">$</span>
                      <input
                        type="text"
                        value={getInputValue(account.id)}
                        onFocus={() => handleFocus(account.id)}
                        onBlur={() => handleBlur(account.id)}
                        onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                        className={`w-28 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-xl font-semibold transition-all focus:outline-none ${
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
                <span className="text-xl font-bold text-green-300">Total Cash</span>
                <span className="text-xl font-bold text-green-400 w-36 text-right">{formatCurrency(cashTotal)}</span>
              </div>
            </div>
          </div>

          {/* Investments Section */}
          <div className="mb-3">
            <div className="space-y-2.5">
              {investmentAccounts.map((account) => {
                const isUpdated = updatedAccounts.has(account.id)
                return (
                  <div key={account.id} className="flex items-center justify-between gap-2">
                    <label className="text-gray-300 text-xl font-medium truncate flex-1">{account.account_name}</label>
                    <div className="flex items-center gap-0.5 w-36 justify-end">
                      <span className="text-blue-400 text-xl font-semibold">$</span>
                      <input
                        type="text"
                        value={getInputValue(account.id)}
                        onFocus={() => handleFocus(account.id)}
                        onBlur={() => handleBlur(account.id)}
                        onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                        className={`w-28 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-xl font-semibold transition-all focus:outline-none ${
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
                <span className="text-xl font-bold text-blue-400 w-36 text-right">{formatCurrency(investmentTotal)}</span>
              </div>
            </div>
          </div>

          {/* Combined Total */}
          <div className="pt-2 mt-2 border-t border-green-500/40">
            <div className="flex items-center justify-between bg-green-500/20 p-2 rounded">
              <span className="text-xl font-bold text-green-300">Total Assets</span>
              <span className="text-xl font-bold text-green-400 w-36 text-right">{formatCurrency(cashTotal + investmentTotal)}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Credit Cards */}
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-4 border border-orange-500/20 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-500/30">
            <div className="p-1.5 bg-orange-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-orange-400">Credit Cards</h3>
          </div>
          <div className="space-y-2.5">
            {sortedCreditCardIds.length > 0
              ? sortedCreditCardIds.map(id => {
                  const account = creditCardAccounts.find(a => a.id === id)
                  if (!account) return null
                  const balance = balances[account.id] || 0
                  const limit = account.credit_limit || 0
                  const utilization = limit > 0 ? (balance / limit) * 100 : 0
                  const isUpdated = updatedAccounts.has(account.id)
                  return (
                  <div key={account.id} className="flex items-center justify-between py-0.5">
                    <label className="text-gray-300 text-lg font-medium truncate" style={{ width: '200px' }}>{account.account_name}</label>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 justify-end" style={{ width: '125px' }}>
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
                      <span className="text-gray-400 text-base font-medium text-center" style={{ width: '125px' }}>{formatCurrency(limit)}</span>
                      <span className={`text-base font-semibold text-right pr-4 ${utilization > 70 ? 'text-orange-400' : 'text-gray-400'}`} style={{ width: '50px' }}>{utilization.toFixed(0)}%</span>
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
                  <div key={account.id} className="flex items-center justify-between py-0.5">
                    <label className="text-gray-300 text-lg font-medium truncate" style={{ width: '200px' }}>{account.account_name}</label>
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 justify-end" style={{ width: '125px' }}>
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
                      <span className="text-gray-400 text-base font-medium text-center" style={{ width: '125px' }}>{formatCurrency(limit)}</span>
                      <span className={`text-base font-semibold text-right pr-4 ${utilization > 70 ? 'text-orange-400' : 'text-gray-400'}`} style={{ width: '50px' }}>{utilization.toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
          </div>
          <div className="pt-2 mt-2 border-t border-orange-500/40">
            <div className="flex items-center justify-between bg-orange-500/10 p-2 rounded">
              <span className="text-xl font-bold text-orange-300 whitespace-nowrap" style={{ width: '200px' }}>Total Credit Cards</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-orange-400 text-right" style={{ width: '125px' }}>{formatCurrency(creditCardBalanceTotal)}</span>
                <span className="text-xl font-bold text-orange-400 text-center" style={{ width: '125px' }}>{formatCurrency(creditCardLimitTotal)}</span>
                <span className={`text-xl font-semibold text-right pr-2 ${creditUtilization > 70 ? 'text-orange-400' : 'text-gray-400'}`} style={{ width: '50px' }}>{creditUtilization.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Loans & Taxes */}
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
                <div className="space-y-2.5">
                  {personalLoans.map((account) => {
                    const balance = balances[account.id] || 0
                    const original = account.credit_limit || 0
                    const percentRemaining = original > 0 ? (balance / original) * 100 : 0
                    const isUpdated = updatedAccounts.has(account.id)
                    return (
                      <div key={account.id} className="flex items-center justify-between px-2" style={{ paddingTop: '0.225rem', paddingBottom: '0.225rem' }}>
                        <label className="text-gray-300 text-xl font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-xl font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-xl font-semibold transition-all focus:outline-none ${
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
                    <span className="text-xl font-bold text-red-300 min-w-[140px]">Total Personal Loans</span>
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
                        <label className="text-gray-300 text-xl font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-xl font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-xl font-semibold transition-all focus:outline-none ${
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
                    <span className="text-xl font-bold text-red-300 min-w-[140px]">Total Auto Loans</span>
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
                        <label className="text-gray-300 text-xl font-medium truncate min-w-[140px]">{account.account_name}</label>
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-red-400 text-xl font-semibold">$</span>
                          <input
                            type="text"
                            value={getInputValue(account.id)}
                            onFocus={() => handleFocus(account.id)}
                            onBlur={() => handleBlur(account.id)}
                            onChange={(e) => handleBalanceChange(account.id, e.target.value)}
                            className={`w-20 px-2 py-2 bg-gray-900 border border-gray-800 focus:border-gray-700 focus:bg-gray-850 rounded text-right text-xl font-semibold transition-all focus:outline-none ${
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
          <div className="pt-2 mt-2 border-t border-red-500/40 space-y-1">
            {taxes.length > 0 && (
              <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
                <span className="text-xl font-bold text-red-300 min-w-[140px]">Total Taxes</span>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(taxesTotal)}</span>
                  <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(taxesTotalOriginal)}</span>
                  <span className="text-gray-400 text-base font-bold w-12 text-right">{taxesPercentRemaining.toFixed(0)}%</span>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-xl font-bold text-red-300 min-w-[140px]">Total Loans</span>
              <div className="flex items-center gap-1">
                <span className="text-xl font-bold text-red-400 w-28 text-right">{formatCurrency(allLoansTotal)}</span>
                <span className="text-gray-400 text-base font-medium w-20 text-right">{formatCurrency(allLoansTotalOriginal)}</span>
                <span className="text-gray-400 text-base font-bold w-12 text-right">{allLoansPercentRemaining.toFixed(0)}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-red-500/10 p-2 rounded">
              <span className="text-xl font-bold text-red-300 min-w-[140px]">Total Debt</span>
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
                    <th className="px-6 py-4 text-center text-gray-400 text-xs font-semibold uppercase tracking-wide sticky left-0 bg-black z-10" style={{minWidth: '120px'}}>
                      Date
                    </th>
                    <th className="px-6 py-4 text-center text-white text-xs font-semibold uppercase tracking-wide" style={{minWidth: '110px'}}>
                      Net Worth
                    </th>
                    <th className="px-6 py-4 text-center text-white text-xs font-semibold uppercase tracking-wide" style={{minWidth: '110px'}}>
                      Change
                    </th>
                    <th className="px-6 py-4 text-center text-green-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>
                      Total Assets
                    </th>
                    <th className="px-6 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>
                      Total Debt
                    </th>
                    <th className="px-6 py-4 text-center text-green-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '100px'}}>
                      Cash
                    </th>
                    <th className="px-6 py-4 text-center text-green-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>
                      Investments
                    </th>
                    <th className="px-6 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '110px'}}>
                      Credit Cards
                    </th>
                    <th className="px-6 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '100px'}}>
                      Personal Loans
                    </th>
                    <th className="px-6 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '100px'}}>
                      Auto Loans
                    </th>
                    <th className="px-6 py-4 text-center text-red-400 text-xs font-semibold uppercase tracking-wide whitespace-nowrap" style={{minWidth: '100px'}}>
                      Taxes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {netWorthHistory.map((entry, index) => {
                    const previousEntry = index < netWorthHistory.length - 1 ? netWorthHistory[index + 1] : null
                    const change = previousEntry ? entry.net_worth - previousEntry.net_worth : 0
                    const changePercentage = previousEntry && previousEntry.net_worth !== 0
                      ? ((change / Math.abs(previousEntry.net_worth)) * 100)
                      : 0

                    // Calculate summary values for this entry
                    const totalAssets = entry.cash_total + entry.investments_total
                    const totalDebt = entry.credit_cards_owed + entry.loans_total + entry.taxes_owed
                    // Filter loans: auto loans contain 'Auto' or 'auto', personal loans are everything else
                    const autoLoans = entry.loan_accounts.filter(acc => acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0)
                    const personalLoans = entry.loan_accounts.filter(acc => !acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0)

                    // Calculate previous values for percentage changes
                    const prevTotalAssets = previousEntry ? (previousEntry.cash_total + previousEntry.investments_total) : 0
                    const prevTotalDebt = previousEntry ? (previousEntry.credit_cards_owed + previousEntry.loans_total + previousEntry.taxes_owed) : 0
                    const prevAutoLoans = previousEntry ? previousEntry.loan_accounts.filter(acc => acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0) : 0
                    const prevPersonalLoans = previousEntry ? previousEntry.loan_accounts.filter(acc => !acc.name.toLowerCase().includes('auto')).reduce((sum, acc) => sum + acc.balance, 0) : 0

                    return (
                      <tr
                        key={entry.id}
                        className={`border-b border-gray-800 ${index === 0 ? 'bg-gray-950' : ''}`}
                      >
                        <td className={`px-6 py-4 text-center text-white text-sm sticky left-0 ${index === 0 ? 'bg-gray-950 font-semibold' : 'bg-gray-900'} z-10`}>
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
                          {index === 0 && (
                            <span className="ml-2 text-xs px-2 py-1 bg-blue-500 text-white rounded font-semibold">
                              LATEST
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-white text-base font-bold whitespace-nowrap">
                          {formatCurrency(entry.net_worth)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {previousEntry ? (
                            <span className={`text-sm font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {change >= 0 ? '+' : ''}{formatCurrency(change)}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">-</span>
                          )}
                        </td>
                        {/* Total Assets */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(totalAssets)}</span>
                            {previousEntry && prevTotalAssets !== 0 && (
                              <span className={`text-xs ${totalAssets - prevTotalAssets >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {totalAssets - prevTotalAssets >= 0 ? '+' : ''}{(((totalAssets - prevTotalAssets) / Math.abs(prevTotalAssets)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Total Debt */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(totalDebt)}</span>
                            {previousEntry && prevTotalDebt !== 0 && (
                              <span className={`text-xs ${totalDebt - prevTotalDebt >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {totalDebt - prevTotalDebt >= 0 ? '+' : ''}{(((totalDebt - prevTotalDebt) / Math.abs(prevTotalDebt)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Cash */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(entry.cash_total)}</span>
                            {previousEntry && previousEntry.cash_total !== 0 && (
                              <span className={`text-xs ${entry.cash_total - previousEntry.cash_total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {entry.cash_total - previousEntry.cash_total >= 0 ? '+' : ''}{(((entry.cash_total - previousEntry.cash_total) / Math.abs(previousEntry.cash_total)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Investments */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(entry.investments_total)}</span>
                            {previousEntry && previousEntry.investments_total !== 0 && (
                              <span className={`text-xs ${entry.investments_total - previousEntry.investments_total >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {entry.investments_total - previousEntry.investments_total >= 0 ? '+' : ''}{(((entry.investments_total - previousEntry.investments_total) / Math.abs(previousEntry.investments_total)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Credit Cards */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(entry.credit_cards_owed)}</span>
                            {previousEntry && previousEntry.credit_cards_owed !== 0 && (
                              <span className={`text-xs ${entry.credit_cards_owed - previousEntry.credit_cards_owed >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {entry.credit_cards_owed - previousEntry.credit_cards_owed >= 0 ? '+' : ''}{(((entry.credit_cards_owed - previousEntry.credit_cards_owed) / Math.abs(previousEntry.credit_cards_owed)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Personal Loans */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(personalLoans)}</span>
                            {previousEntry && prevPersonalLoans !== 0 && (
                              <span className={`text-xs ${personalLoans - prevPersonalLoans >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {personalLoans - prevPersonalLoans >= 0 ? '+' : ''}{(((personalLoans - prevPersonalLoans) / Math.abs(prevPersonalLoans)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Auto Loans */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(autoLoans)}</span>
                            {previousEntry && prevAutoLoans !== 0 && (
                              <span className={`text-xs ${autoLoans - prevAutoLoans >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {autoLoans - prevAutoLoans >= 0 ? '+' : ''}{(((autoLoans - prevAutoLoans) / Math.abs(prevAutoLoans)) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Taxes */}
                        <td className="px-6 py-4 text-center text-sm whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white">{formatCurrency(entry.taxes_owed)}</span>
                            {previousEntry && previousEntry.taxes_owed !== 0 && (
                              <span className={`text-xs ${entry.taxes_owed - previousEntry.taxes_owed >= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {entry.taxes_owed - previousEntry.taxes_owed >= 0 ? '+' : ''}{(((entry.taxes_owed - previousEntry.taxes_owed) / Math.abs(previousEntry.taxes_owed)) * 100).toFixed(1)}%
                              </span>
                            )}
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
