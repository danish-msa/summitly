-- Migration: Add suites, ownershipType, garage, and basement fields to PreConstructionProject
-- Run this in Supabase SQL Editor

-- Add suites field (nullable integer)
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "suites" INTEGER;

-- Add ownershipType field (nullable text)
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "ownershipType" TEXT;

-- Add garage field (nullable text)
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "garage" TEXT;

-- Add basement field (nullable text)
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "basement" TEXT;

-- Add comments for documentation
COMMENT ON COLUMN "PreConstructionProject"."suites" IS 'Number of suites in the project';
COMMENT ON COLUMN "PreConstructionProject"."ownershipType" IS 'Ownership type (e.g., Freehold, Condo)';
COMMENT ON COLUMN "PreConstructionProject"."garage" IS 'Garage type: single, double, triple, or other';
COMMENT ON COLUMN "PreConstructionProject"."basement" IS 'Basement type: finished or unfinished';

