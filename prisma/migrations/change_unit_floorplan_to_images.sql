-- Migration: Change floorplanImage to images array for PreConstructionUnit
-- This allows units to have multiple images instead of just one floorplan image

-- First, create a temporary column for the images array
ALTER TABLE "PreConstructionUnit" 
ADD COLUMN "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate existing floorplanImage data to images array (if floorplanImage exists, add it to images)
UPDATE "PreConstructionUnit"
SET "images" = CASE 
  WHEN "floorplanImage" IS NOT NULL AND "floorplanImage" != '' 
  THEN ARRAY["floorplanImage"]
  ELSE ARRAY[]::TEXT[]
END
WHERE "floorplanImage" IS NOT NULL;

-- Drop the old floorplanImage column
ALTER TABLE "PreConstructionUnit" 
DROP COLUMN "floorplanImage";

