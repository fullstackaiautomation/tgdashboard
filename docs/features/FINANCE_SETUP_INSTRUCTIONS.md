# Finance Dashboard - Current State & Future Plans

## Current Implementation Status

### ✅ Completed Features

#### Database Schema
- Created finance tables migration: `supabase/migrations/20251009000001_create_finance_tables.sql`
- Tables: `finance_accounts`, `balance_snapshots`
- Account types: Cash, Investments, Credit Cards, Personal Loans, Auto Loans, Taxes

#### UI Components
- **FinanceOverview.tsx** - Main finance dashboard component
- **FinanceDashboard.tsx** - Wrapper component
- **useFinance.ts** - Custom hooks for data fetching

#### Finance Dashboard Layout (4 Columns)

**Column 1: Cash Accounts**
- Individual cash accounts with balance inputs
- Total row showing sum of all cash accounts

**Column 2: Investments**
- Individual investment accounts with balance inputs
- Total row showing sum of all investments

**Column 3: Credit Cards**
- Individual credit cards with: balance input, credit limit, utilization %
- Total Owed row (balance, limit, utilization %)
- Total Available row (credit limit - balance)

**Column 4: Loans & Taxes**
- **Personal Loans Section**
  - Individual personal loan accounts with: balance input, original amount, % remaining
  - Total Personal Loans row
- **Auto Loans Section**
  - Individual auto loan accounts with: balance input, original amount, % remaining
  - Total Loans row (combines personal + auto loans)
- **Taxes Section**
  - Individual tax accounts with: balance input, original amount, % remaining
- **Summary Rows:**
  - Total Loans & Taxes (current, original, % remaining)
  - Total Paid (original - current)
  - Total CC, Loans, & Taxes (combines credit cards + loans & taxes columns)

#### Top Summary Cards
- Net Worth
- Cash Total
- Credit Cards Owed
- Cash on Hand

#### Key Features
- Date selector to view/edit balances for different dates
- Save button to persist balance snapshots
- Formatted number inputs with commas (e.g., 4,293.00)
- Subtle input styling (dark theme with minimal borders)
- Real-time calculations and totals
- Color-coded columns (green=cash, blue=investments, orange=credit cards, red=loans/taxes)

---

## 🚧 Planned Features (Not Yet Implemented)

### Immediate Next Steps

#### Color-Coded Percentages
- 0-20%: Green (good progress on paying down debt)
- 20-50%: Orange (moderate remaining balance)
- 50-100%: Red (high remaining balance)
- Apply to all percentage displays in Loans & Taxes column

### Future Enhancements

#### Historical Data & Trends
- Line charts showing net worth over time
- Balance history for each account
- Month-over-month comparison

#### Budget Tracking
- Monthly budget categories
- Actual vs. budgeted spending
- Budget alerts/warnings

#### Income Tracking
- Income sources and amounts
- Year-to-date income tracking
- Income vs. expenses comparison

#### Goals & Projections
- Financial goals (savings targets, debt payoff goals)
- Projected net worth based on current trends
- Debt payoff calculators

#### Transaction Management
- Import/manually add transactions
- Categorize transactions
- Search and filter transactions

#### Reports & Analytics
- Monthly/yearly financial reports
- Spending by category pie charts
- Savings rate calculations
- Debt-to-income ratio

#### Mobile Responsiveness
- Optimize layout for tablet/mobile devices
- Touch-friendly inputs
- Collapsible sections for smaller screens

---

## Development Workflow

### Before Starting New Finance Features

1. **Review this document** to understand current state
2. **Create a game plan** outlining:
   - Specific feature to implement
   - Database schema changes needed (if any)
   - UI components to create/modify
   - Data flow and state management
   - Testing approach
3. **Get user approval** on the game plan before coding
4. **Implement** feature-by-feature with testing

### Code Organization

```
src/
├── components/
│   └── finance/
│       ├── FinanceDashboard.tsx      # Main wrapper
│       └── FinanceOverview.tsx       # Current implementation
├── hooks/
│   └── useFinance.ts                 # Finance data hooks
├── types/
│   └── finance.ts                    # TypeScript types
└── utils/
    └── (future finance utilities)

supabase/
└── migrations/
    └── 20251009000001_create_finance_tables.sql
```

---

## Technical Notes

### Data Flow
1. User selects date
2. `useAccountsWithBalances(date)` fetches accounts with latest balance snapshot for that date
3. `useNetWorthSummary(date)` fetches calculated summary metrics
4. User edits balances in input fields (stored in local state)
5. User clicks "Save Balances" to persist via `useSaveBalanceSnapshots()`

### Balance Calculation Logic
- Each account stores balance snapshots by date
- Latest snapshot for selected date is displayed
- Totals are calculated client-side from current state

### Input Formatting
- Type: `text` (not `number`) to allow comma formatting
- Display: Formatted with commas (1,234.56)
- Storage: Numbers stripped of commas before saving

### Current Account Configuration
- **Cash:** Chase, Chase Business, Wells Fargo
- **Investments:** Crypto, Stocks, Car Value
- **Credit Cards:** Amazon CC, AMEX, Apple Card, C1 Quicksilver, C1 Platinum, C1 Savor, Paypal Credit, WF Credit Card, Venmo Credit
- **Personal Loans:** One Main Loan, Best Egg Loan
- **Auto Loans:** Ally Auto Loan
- **Taxes:** Taxes Owed

---

## Recent Session Changes (2025-10-10)

### UI Improvements Made
1. Removed scroll bar from Credit Cards section
2. Increased all text in 4 columns by 1.5x for better readability
3. Made input boxes more subtle (reduced borders)
4. Added comma formatting to all number inputs
5. Added "Total Available" row to Credit Cards section
6. Split Loans & Taxes into separate sections (Personal Loans, Auto Loans, Taxes)
7. Added total rows for each loan section
8. Reformatted bottom summary to match Credit Cards column style
9. Added "Total Personal Loans" label
10. Added "Total Loans" row (combines personal + auto)
11. Added "Total Paid" row showing amount paid off
12. Added "Total CC, Loans, & Taxes" row combining all debt

### Pending Feature
- Color-coded percentages (0-20% green, 20-50% orange, 50-100% red)
  - Helper function created: `getPercentageColor()`
  - Not yet applied to all percentage displays

---

## Next Steps Discussion Points

Before implementing new features, discuss:

1. **Priority**: Which feature is most important?
2. **Scope**: Full feature or MVP version?
3. **Dependencies**: Does it require new database tables/migrations?
4. **UI/UX**: Mockup or description of desired layout?
5. **Data source**: Manual entry, import, or API integration?

---

## Questions to Answer Before Building

- Should we add transaction-level tracking or stick with snapshot-based balances?
- Do we need account categories beyond the current subcategories?
- Should budgets be monthly, annual, or custom periods?
- What date range should historical charts display by default?
- Should we support multiple currencies?
- Do we need recurring transaction support?
- How should we handle account additions/removals over time?

---

*Last Updated: 2025-10-10*
*Current Implementation: Balance tracking with 4-column dashboard*
*Dev Server: http://localhost:5004*
