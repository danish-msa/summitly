-- Migration: Add featured field to PreConstructionProject
-- This allows projects to be marked as featured
-- Run this script directly in your database

-- Add featured column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'PreConstructionProject' 
    AND column_name = 'featured'
  ) THEN
    ALTER TABLE "PreConstructionProject" 
    ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
    
    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS "PreConstructionProject_featured_idx" 
    ON "PreConstructionProject"("featured");
    
    RAISE NOTICE 'Column featured added successfully';
  ELSE
    RAISE NOTICE 'Column featured already exists';
  END IF;
END $$;

