-- Migration: Add averageSoldPriceByType field to MarketTrends table
-- Run this in Supabase SQL Editor or your PostgreSQL database

-- Add averageSoldPriceByType field (nullable JSONB)
ALTER TABLE "MarketTrends"
ADD COLUMN IF NOT EXISTS "averageSoldPriceByType" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "MarketTrends"."averageSoldPriceByType" IS 'AverageSoldPriceByTypeData - Monthly average sold prices by property type (Detached, Condos, Townhouse)';

