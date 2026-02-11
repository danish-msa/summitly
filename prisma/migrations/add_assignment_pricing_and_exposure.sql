-- Migration: Add assignment pricing and exposure fields to PreConstructionProject
-- Run this SQL in the same database your app uses (check DATABASE_URL in .env).
-- If you get "relation PreConstructionProject does not exist", this DB may not
-- contain that table (e.g. you might need the main app DB, not summitly-crm).

-- Add columns only if the table exists (no transaction so one error doesn't abort the rest).

DO $$
DECLARE
  tbl_schema text;
  tbl_name text := 'PreConstructionProject';
BEGIN
  SELECT table_schema INTO tbl_schema
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
    AND table_name = tbl_name
  LIMIT 1;

  IF tbl_schema IS NULL THEN
    RAISE EXCEPTION 'Table "PreConstructionProject" not found. Ensure you are connected to the database that has this table (check your DATABASE_URL).';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = tbl_schema AND table_name = tbl_name AND column_name = 'originalPurchasePrice'
  ) THEN
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN "originalPurchasePrice" DOUBLE PRECISION', tbl_schema, tbl_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = tbl_schema AND table_name = tbl_name AND column_name = 'depositPaid'
  ) THEN
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN "depositPaid" DOUBLE PRECISION', tbl_schema, tbl_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = tbl_schema AND table_name = tbl_name AND column_name = 'totalPayment'
  ) THEN
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN "totalPayment" DOUBLE PRECISION', tbl_schema, tbl_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = tbl_schema AND table_name = tbl_name AND column_name = 'exposure'
  ) THEN
    EXECUTE format('ALTER TABLE %I.%I ADD COLUMN "exposure" TEXT', tbl_schema, tbl_name);
  END IF;
END $$;
