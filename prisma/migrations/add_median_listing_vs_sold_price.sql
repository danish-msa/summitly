-- Add medianListingVsSoldPrice column to MarketTrends table
-- This column stores median listing price vs median sold price comparison data
-- 
-- IMPORTANT: Make sure you've run add_years_to_market_trends.sql first!
-- If you haven't, use the combined migration: apply_all_market_trends_updates.sql

ALTER TABLE "MarketTrends" 
ADD COLUMN IF NOT EXISTS "medianListingVsSoldPrice" JSONB;

COMMENT ON COLUMN "MarketTrends"."medianListingVsSoldPrice" IS 'Stores median listing price vs median sold price comparison data - MedianListingVsSoldPriceData format: { months: string[], medianListingPrice: number[], medianSoldPrice: number[] }';

