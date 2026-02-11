-- Migration: Add years field to MarketTrends table for caching different year ranges
-- Run this in Supabase SQL Editor or your PostgreSQL database

-- Add years field (defaults to 2 for existing records)
ALTER TABLE "MarketTrends"
ADD COLUMN IF NOT EXISTS "years" INTEGER NOT NULL DEFAULT 2;

-- Drop the old unique constraint
ALTER TABLE "MarketTrends"
DROP CONSTRAINT IF EXISTS "MarketTrends_locationType_locationName_month_key";

-- Add new unique constraint including years (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'MarketTrends_locationType_locationName_month_years_key'
    ) THEN
        ALTER TABLE "MarketTrends"
        ADD CONSTRAINT "MarketTrends_locationType_locationName_month_years_key" 
        UNIQUE ("locationType", "locationName", "month", "years");
    END IF;
END $$;

-- Add index for years
CREATE INDEX IF NOT EXISTS "MarketTrends_years_idx" ON "MarketTrends"("years");

-- Add composite index for efficient lookups
CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_years_idx" 
ON "MarketTrends"("locationType", "locationName", "month", "years");

-- Add comment for documentation
COMMENT ON COLUMN "MarketTrends"."years" IS 'Number of years of historical data (5, 10, 15, 20). Defaults to 2 for backward compatibility.';

