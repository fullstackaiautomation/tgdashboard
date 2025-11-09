-- Recalculate historical net worth values using stored component totals

UPDATE net_worth_log
SET
  net_worth = cash_total + investments_total - (credit_cards_owed + loans_total + taxes_owed),
  updated_at = NOW();
