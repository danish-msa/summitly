-- Simple migration: Add missing columns to PreConstructionProject table
-- Run this in Supabase SQL Editor

ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "documents" TEXT,
ADD COLUMN IF NOT EXISTS "developerInfo" TEXT,
ADD COLUMN IF NOT EXISTS "architectInfo" TEXT,
ADD COLUMN IF NOT EXISTS "builderInfo" TEXT,
ADD COLUMN IF NOT EXISTS "interiorDesignerInfo" TEXT,
ADD COLUMN IF NOT EXISTS "landscapeArchitectInfo" TEXT,
ADD COLUMN IF NOT EXISTS "marketingInfo" TEXT;

