-- Migration: Add additional pre-construction project fields
-- Run this SQL directly in Supabase SQL Editor

BEGIN;

-- Add avgPricePerSqft column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'avgPricePerSqft'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "avgPricePerSqft" DOUBLE PRECISION;
    END IF;
END $$;

-- Add parkingPrice column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'parkingPrice'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "parkingPrice" DOUBLE PRECISION;
    END IF;
END $$;

-- Add parkingPriceDetail column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'parkingPriceDetail'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "parkingPriceDetail" TEXT;
    END IF;
END $$;

-- Add lockerPrice column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'lockerPrice'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "lockerPrice" DOUBLE PRECISION;
    END IF;
END $$;

-- Add lockerPriceDetail column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'lockerPriceDetail'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "lockerPriceDetail" TEXT;
    END IF;
END $$;

-- Add assignmentFee column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'assignmentFee'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "assignmentFee" DOUBLE PRECISION;
    END IF;
END $$;

-- Add developmentLevies column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'developmentLevies'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "developmentLevies" DOUBLE PRECISION;
    END IF;
END $$;

-- Add developmentCharges column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'developmentCharges'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "developmentCharges" DOUBLE PRECISION;
    END IF;
END $$;

-- Add height column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'height'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "height" DOUBLE PRECISION;
    END IF;
END $$;

-- Add maintenanceFeesPerSqft column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'maintenanceFeesPerSqft'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "maintenanceFeesPerSqft" DOUBLE PRECISION;
    END IF;
END $$;

-- Add maintenanceFeesDetail column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'maintenanceFeesDetail'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "maintenanceFeesDetail" TEXT;
    END IF;
END $$;

-- Add floorPremiums column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'floorPremiums'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "floorPremiums" TEXT;
    END IF;
END $$;

-- Add salesMarketingCompany column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PreConstructionProject' 
        AND column_name = 'salesMarketingCompany'
    ) THEN
        ALTER TABLE "PreConstructionProject" 
        ADD COLUMN "salesMarketingCompany" TEXT;
    END IF;
END $$;

COMMIT;

