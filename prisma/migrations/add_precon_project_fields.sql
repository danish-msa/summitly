-- Migration: Add missing fields to PreConstructionProject table
-- This adds the new development team fields and ensures all fields exist

BEGIN;

-- Add documents column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'documents'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "documents" TEXT;
    END IF;
END $$;

-- Add developerInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'developerInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "developerInfo" TEXT;
    END IF;
END $$;

-- Add architectInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'architectInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "architectInfo" TEXT;
    END IF;
END $$;

-- Add builderInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'builderInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "builderInfo" TEXT;
    END IF;
END $$;

-- Add interiorDesignerInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'interiorDesignerInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "interiorDesignerInfo" TEXT;
    END IF;
END $$;

-- Add landscapeArchitectInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'landscapeArchitectInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "landscapeArchitectInfo" TEXT;
    END IF;
END $$;

-- Add marketingInfo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'marketingInfo'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "marketingInfo" TEXT;
    END IF;
END $$;

COMMIT;

