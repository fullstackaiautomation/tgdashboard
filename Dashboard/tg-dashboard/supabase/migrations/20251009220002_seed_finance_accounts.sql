-- Seed Finance Accounts for Tyler Grassmick
-- User ID: cbdd0170-5c6b-429c-9a8f-f3ba4e46405c

-- POSITIVE ACCOUNTS (ASSETS)

-- Cash Accounts
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Chase', 'asset', 'cash', 1),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Chase Business', 'asset', 'cash', 2),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Wells Fargo', 'asset', 'cash', 3)
ON CONFLICT (user_id, account_name) DO NOTHING;

-- Investment Accounts
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Crypto', 'asset', 'investment', 4),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Stocks', 'asset', 'investment', 5)
ON CONFLICT (user_id, account_name) DO NOTHING;

-- Physical Assets
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Car Value', 'asset', 'physical_asset', 6)
ON CONFLICT (user_id, account_name) DO NOTHING;

-- DEBT ACCOUNTS (LIABILITIES)

-- Credit Cards (with credit limits)
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order, credit_limit)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Amazon CC', 'liability', 'credit_card', 10, 5000),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'AMEX', 'liability', 'credit_card', 11, 5000),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Apple Card', 'liability', 'credit_card', 12, 1250),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'C1 Quicksilver', 'liability', 'credit_card', 13, 6000),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'C1 Platinum', 'liability', 'credit_card', 14, 2500),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'C1 Savor', 'liability', 'credit_card', 15, 400),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Paypal Credit', 'liability', 'credit_card', 16, 5250),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'WF Credit Card', 'liability', 'credit_card', 17, 10000),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Venmo Credit', 'liability', 'credit_card', 18, 250)
ON CONFLICT (user_id, account_name) DO UPDATE SET credit_limit = EXCLUDED.credit_limit;

-- Personal Loans (with original loan amounts)
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order, credit_limit)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'One Main Loan', 'liability', 'personal_loan', 20, 12000),
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Best Egg Loan', 'liability', 'personal_loan', 21, 10000)
ON CONFLICT (user_id, account_name) DO UPDATE SET credit_limit = EXCLUDED.credit_limit;

-- Auto Loan (with original loan amount)
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order, credit_limit)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Ally Auto Loan', 'liability', 'auto_loan', 22, 27948)
ON CONFLICT (user_id, account_name) DO UPDATE SET credit_limit = EXCLUDED.credit_limit;

-- Taxes (with original amount owed)
INSERT INTO accounts (user_id, account_name, category, subcategory, display_order, credit_limit)
VALUES
  ('cbdd0170-5c6b-429c-9a8f-f3ba4e46405c', 'Taxes Owed', 'liability', 'tax', 23, 9369)
ON CONFLICT (user_id, account_name) DO UPDATE SET credit_limit = EXCLUDED.credit_limit;

-- Verify accounts were created
SELECT
  category,
  subcategory,
  COUNT(*) as account_count,
  string_agg(account_name, ', ' ORDER BY display_order) as accounts
FROM accounts
WHERE user_id = 'cbdd0170-5c6b-429c-9a8f-f3ba4e46405c'
GROUP BY category, subcategory
ORDER BY category DESC, subcategory;
