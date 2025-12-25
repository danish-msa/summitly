-- Add featured column to PreConstructionProject table
-- This migration adds the featured boolean column with default value false

ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- Create index on featured column for better query performance
CREATE INDEX IF NOT EXISTS "PreConstructionProject_featured_idx" 
ON "PreConstructionProject"("featured");

-- Add comment to column
COMMENT ON COLUMN "PreConstructionProject"."featured" IS 'Indicates if the project is featured';

