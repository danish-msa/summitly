-- Migration: Add createdBy field to PreConstructionProject
-- Run this query in your PostgreSQL database

-- Add createdBy column
ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- Add foreign key constraint (optional, can be added if you want referential integrity)
-- ALTER TABLE "PreConstructionProject" 
-- ADD CONSTRAINT "PreConstructionProject_createdBy_fkey" 
-- FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS "PreConstructionProject_createdBy_idx" 
ON "PreConstructionProject"("createdBy");

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'PreConstructionProject' 
AND column_name = 'createdBy';

