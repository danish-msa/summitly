-- Add subPropertyType and promotions columns to PreConstructionProject table
-- Update completionProgress to String type

ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "subPropertyType" TEXT,
ADD COLUMN IF NOT EXISTS "promotions" TEXT;

-- Note: If completionProgress is currently an integer, you may need to convert it
-- ALTER TABLE "PreConstructionProject" ALTER COLUMN "completionProgress" TYPE TEXT;

