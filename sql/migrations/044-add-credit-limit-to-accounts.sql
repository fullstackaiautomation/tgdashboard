-- Add credit_limit column to accounts table
-- This will store credit limits for credit cards and original loan amounts

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;

-- Update credit card limits
UPDATE accounts SET credit_limit = 5000 WHERE account_name = 'Amazon CC';
UPDATE accounts SET credit_limit = 1250 WHERE account_name = 'Apple Card';
UPDATE accounts SET credit_limit = 5000 WHERE account_name = 'AMEX';
UPDATE accounts SET credit_limit = 6000 WHERE account_name = 'C1 Quicksilver';
UPDATE accounts SET credit_limit = 2500 WHERE account_name = 'C1 Platinum';
UPDATE accounts SET credit_limit = 400 WHERE account_name = 'C1 Savor';
UPDATE accounts SET credit_limit = 5250 WHERE account_name = 'Paypal Credit';
UPDATE accounts SET credit_limit = 10000 WHERE account_name = 'WF Credit Card';

-- Update loan original amounts
UPDATE accounts SET credit_limit = 12000 WHERE account_name = 'One Main Loan';
UPDATE accounts SET credit_limit = 10000 WHERE account_name = 'Best Egg Loan';
UPDATE accounts SET credit_limit = 27948 WHERE account_name = 'Ally Auto Loan';
UPDATE accounts SET credit_limit = 9369 WHERE account_name = 'Taxes Owed';

-- Verify updates
SELECT account_name, category, subcategory, credit_limit
FROM accounts
WHERE credit_limit > 0
ORDER BY display_order;
