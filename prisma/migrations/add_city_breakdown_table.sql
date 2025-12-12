-- Migration: Add CityBreakdown table for caching city-level breakdown data
-- Run this in Supabase SQL Editor or your PostgreSQL database

-- Create CityBreakdown table
CREATE TABLE IF NOT EXISTS "CityBreakdown" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL UNIQUE, -- Format: "2025-11" (YYYY-MM) - one breakdown per month for all cities
    
    -- City breakdown data (stored as JSONB)
    -- Array of { city: string, averagePrice: number, medianPrice: number, averageOneYearChange: number, medianOneYearChange: number, totalTransactions: number }
    "breakdownData" JSONB NOT NULL,
    
    -- Metadata
    "lastFetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS "CityBreakdown_month_idx" ON "CityBreakdown"("month");
CREATE INDEX IF NOT EXISTS "CityBreakdown_lastFetchedAt_idx" ON "CityBreakdown"("lastFetchedAt");

-- Add comment for documentation
COMMENT ON TABLE "CityBreakdown" IS 'Stores city-level breakdown data (average/median prices, 1-year change, transactions) - one record per month for all cities';
COMMENT ON COLUMN "CityBreakdown"."month" IS 'Format: "2025-11" (YYYY-MM) - one breakdown per month for all cities';
COMMENT ON COLUMN "CityBreakdown"."breakdownData" IS 'Array of city breakdown objects: { city: string, averagePrice: number, medianPrice: number, averageOneYearChange: number, medianOneYearChange: number, totalTransactions: number }';

