-- Add videos field to PreConstructionProject table
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "videos" TEXT[] DEFAULT ARRAY[]::TEXT[];

