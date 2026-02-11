-- Migration: Create SavedComparable table with basePropertyMlsNumber
-- This migration creates the SavedComparable table with the correct schema
-- Run this SQL directly on your database

-- Drop table if it exists (to recreate with correct schema)
DROP TABLE IF EXISTS "SavedComparable" CASCADE;

-- Create SavedComparable table with basePropertyMlsNumber
CREATE TABLE "SavedComparable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "basePropertyMlsNumber" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedComparable_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for userId, basePropertyMlsNumber, and mlsNumber
CREATE UNIQUE INDEX "SavedComparable_userId_basePropertyMlsNumber_mlsNumber_key" 
    ON "SavedComparable"("userId", "basePropertyMlsNumber", "mlsNumber");

-- Create indexes
CREATE INDEX "SavedComparable_userId_idx" ON "SavedComparable"("userId");
CREATE INDEX "SavedComparable_basePropertyMlsNumber_idx" ON "SavedComparable"("basePropertyMlsNumber");
CREATE INDEX "SavedComparable_mlsNumber_idx" ON "SavedComparable"("mlsNumber");
CREATE INDEX "SavedComparable_userId_basePropertyMlsNumber_idx" ON "SavedComparable"("userId", "basePropertyMlsNumber");

-- Add foreign key constraint
ALTER TABLE "SavedComparable" 
    ADD CONSTRAINT "SavedComparable_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add trigger to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_SavedComparable_updated_at 
    BEFORE UPDATE ON "SavedComparable"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
