-- Add credit_limit column to existing accounts table
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0;
