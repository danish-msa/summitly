-- Fix MarketTrends unique constraint issue
-- This script ensures the old constraint is dropped and the new one with years is in place

-- Step 1: Ensure years column exists
ALTER TABLE "MarketTrends"
ADD COLUMN IF NOT EXISTS "years" INTEGER NOT NULL DEFAULT 2;

-- Step 2: Drop the old unique constraint (without years)
ALTER TABLE "MarketTrends"
DROP CONSTRAINT IF EXISTS "MarketTrends_locationType_locationName_month_key";

-- Step 3: Drop the new constraint if it exists (we'll recreate it)
ALTER TABLE "MarketTrends"
DROP CONSTRAINT IF EXISTS "MarketTrends_locationType_locationName_month_years_key";

-- Step 4: Add the new unique constraint including years
ALTER TABLE "MarketTrends"
ADD CONSTRAINT "MarketTrends_locationType_locationName_month_years_key" 
UNIQUE ("locationType", "locationName", "month", "years");

-- Step 5: Ensure indexes exist
CREATE INDEX IF NOT EXISTS "MarketTrends_years_idx" ON "MarketTrends"("years");
CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_years_idx" 
ON "MarketTrends"("locationType", "locationName", "month", "years");

-- Step 6: Add comments
COMMENT ON COLUMN "MarketTrends"."years" IS 'Number of years of historical data (5, 10, 15, 20). Defaults to 2 for backward compatibility.';

-- Step 7: Add medianListingVsSoldPrice column if it doesn't exist
ALTER TABLE "MarketTrends" 
ADD COLUMN IF NOT EXISTS "medianListingVsSoldPrice" JSONB;

COMMENT ON COLUMN "MarketTrends"."medianListingVsSoldPrice" IS 'Stores median listing price vs median sold price comparison data - MedianListingVsSoldPriceData format: { months: string[], medianListingPrice: number[], medianSoldPrice: number[] }';

