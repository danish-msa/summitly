-- =====================================================
-- Market Trends Table Setup for Supabase
-- =====================================================
-- Run this script in Supabase SQL Editor
-- This creates the MarketTrends table with all required fields, constraints, and indexes
-- =====================================================

-- Create MarketTrends table
CREATE TABLE IF NOT EXISTS "MarketTrends" (
    "id" TEXT NOT NULL PRIMARY KEY,
    
    -- Location identification (supports: city, area, neighbourhood, intersection, community)
    "locationType" TEXT NOT NULL, -- 'city' | 'area' | 'neighbourhood' | 'intersection' | 'community'
    "locationName" TEXT NOT NULL, -- The name of the location (e.g., "Oakville", "Downtown", "Main & King")
    
    -- Parent location hierarchy (for filtering and context)
    "parentCity" TEXT, -- City this location belongs to (if not a city)
    "parentArea" TEXT, -- Area this location belongs to (if neighbourhood/intersection/community)
    "parentNeighbourhood" TEXT, -- Neighbourhood this location belongs to (if intersection/community)
    
    "month" TEXT NOT NULL, -- Format: "2025-01" (YYYY-MM)
    
    -- Price data (stored as JSONB for better querying)
    "priceOverview" JSONB,
    "averageSoldPrice" JSONB,
    "salesVolumeByType" JSONB,
    "priceByBedrooms" JSONB,
    
    -- Inventory data (stored as JSONB)
    "inventoryOverview" JSONB,
    "newClosedAvailable" JSONB,
    "daysOnMarket" JSONB,
    
    -- Note: Rankings are now stored in separate MarketRankings table
    -- (one record per month, shared by all cities)
    
    -- Metadata
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique constraint (one record per location type + location name + month)
-- This prevents clashes between different location types with same name
CREATE UNIQUE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_key" 
ON "MarketTrends"("locationType", "locationName", "month");

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_idx" 
ON "MarketTrends"("locationType");

CREATE INDEX IF NOT EXISTS "MarketTrends_locationName_idx" 
ON "MarketTrends"("locationName");

CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_idx" 
ON "MarketTrends"("locationType", "locationName");

CREATE INDEX IF NOT EXISTS "MarketTrends_month_idx" 
ON "MarketTrends"("month");

CREATE INDEX IF NOT EXISTS "MarketTrends_locationType_locationName_month_idx" 
ON "MarketTrends"("locationType", "locationName", "month");

CREATE INDEX IF NOT EXISTS "MarketTrends_parentCity_idx" 
ON "MarketTrends"("parentCity");

CREATE INDEX IF NOT EXISTS "MarketTrends_parentArea_idx" 
ON "MarketTrends"("parentArea");

CREATE INDEX IF NOT EXISTS "MarketTrends_lastFetchedAt_idx" 
ON "MarketTrends"("lastFetchedAt");

-- Create index on JSON fields for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS "MarketTrends_priceOverview_idx" 
ON "MarketTrends" USING GIN ("priceOverview");

-- =====================================================
-- Optional: Create function to automatically update updatedAt timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updatedAt
DROP TRIGGER IF EXISTS update_market_trends_updated_at ON "MarketTrends";
CREATE TRIGGER update_market_trends_updated_at
    BEFORE UPDATE ON "MarketTrends"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Optional: Add comments for documentation
-- =====================================================
COMMENT ON TABLE "MarketTrends" IS 'Stores monthly market statistics for all location types (city, area, neighbourhood, intersection, community), cached from Repliers API';
COMMENT ON COLUMN "MarketTrends"."locationType" IS 'Type of location: city, area, neighbourhood, intersection, or community';
COMMENT ON COLUMN "MarketTrends"."locationName" IS 'Name of the location (e.g., "Oakville", "Downtown", "Main & King")';
COMMENT ON COLUMN "MarketTrends"."parentCity" IS 'Parent city (if location is area/neighbourhood/intersection/community)';
COMMENT ON COLUMN "MarketTrends"."parentArea" IS 'Parent area (if location is neighbourhood/intersection/community)';
COMMENT ON COLUMN "MarketTrends"."parentNeighbourhood" IS 'Parent neighbourhood (if location is intersection/community)';
COMMENT ON COLUMN "MarketTrends"."month" IS 'Month in YYYY-MM format (e.g., "2025-01")';
COMMENT ON COLUMN "MarketTrends"."priceOverview" IS 'JSON: Price overview data with current/past periods and changes';
COMMENT ON COLUMN "MarketTrends"."averageSoldPrice" IS 'JSON: Monthly average sold price data with months, prices, and counts arrays';
COMMENT ON COLUMN "MarketTrends"."salesVolumeByType" IS 'JSON: Sales volume data by property type (Detached, Townhouse, Condo)';
COMMENT ON COLUMN "MarketTrends"."inventoryOverview" IS 'JSON: Inventory overview with new listings, homes sold, days on market, etc.';
COMMENT ON COLUMN "MarketTrends"."newClosedAvailable" IS 'JSON: New and closed properties count by month';
COMMENT ON COLUMN "MarketTrends"."daysOnMarket" IS 'JSON: Average days on market data';
COMMENT ON COLUMN "MarketTrends"."lastFetchedAt" IS 'Timestamp of last API fetch - used to determine if data is stale';
COMMENT ON TABLE "MarketTrends" IS 'Note: Rankings are stored in separate MarketRankings table (one record per month, shared by all cities)';

-- =====================================================
-- Verification Query (run after setup)
-- =====================================================
-- SELECT 
--     table_name,
--     column_name,
--     data_type,
--     is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'MarketTrends'
-- ORDER BY ordinal_position;

