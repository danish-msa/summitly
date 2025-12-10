-- =====================================================
-- Make rankingOverview Optional in MarketRankings Table
-- =====================================================
-- This makes rankingOverview optional since we now calculate it dynamically per city
-- instead of storing it (which was city-specific and shouldn't be in shared rankings table)
-- =====================================================

-- Make rankingOverview nullable (optional)
ALTER TABLE "MarketRankings" 
ALTER COLUMN "rankingOverview" DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN "MarketRankings"."rankingOverview" IS 'DEPRECATED: Calculated dynamically per city from rankings data. Not stored anymore.';

