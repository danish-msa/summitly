-- Migration: Add SavedComparable table
-- Run this SQL directly on your database if Prisma migrate fails

-- Create SavedComparable table
CREATE TABLE IF NOT EXISTS "SavedComparable" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mlsNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedComparable_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "SavedComparable_userId_mlsNumber_key" ON "SavedComparable"("userId", "mlsNumber");

-- Create indexes
CREATE INDEX IF NOT EXISTS "SavedComparable_userId_idx" ON "SavedComparable"("userId");
CREATE INDEX IF NOT EXISTS "SavedComparable_mlsNumber_idx" ON "SavedComparable"("mlsNumber");

-- Add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'SavedComparable_userId_fkey'
    ) THEN
        ALTER TABLE "SavedComparable" 
        ADD CONSTRAINT "SavedComparable_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

