-- =====================================================
-- Remove Rankings Columns from MarketTrends Table
-- =====================================================
-- Run this script in Supabase SQL Editor AFTER creating MarketRankings table
-- This removes the rankings columns that are now stored in MarketRankings table
-- =====================================================

-- Drop the rankings columns from MarketTrends table
-- (Only if they exist - safe to run even if columns don't exist)

-- Drop rankings column
ALTER TABLE "MarketTrends" 
DROP COLUMN IF EXISTS "rankings";

-- Drop rankingOverview column
ALTER TABLE "MarketTrends" 
DROP COLUMN IF EXISTS "rankingOverview";

-- Drop the GIN index on rankings if it exists
DROP INDEX IF EXISTS "MarketTrends_rankings_idx";

-- =====================================================
-- Verification Query (run after removal)
-- =====================================================
-- SELECT 
--     column_name,
--     data_type
-- FROM information_schema.columns
-- WHERE table_name = 'MarketTrends'
-- ORDER BY ordinal_position;

