-- Add endingPrice column to PreConstructionProject table
ALTER TABLE "PreConstructionProject"
ADD COLUMN IF NOT EXISTS "endingPrice" DOUBLE PRECISION;

