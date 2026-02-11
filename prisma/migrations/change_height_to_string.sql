-- Migration: Change height column from Float to String
-- This allows storing height values like "9'0" to 10'0""

-- Check if the column exists and is Float type, then alter it
DO $$
BEGIN
  -- Check if column exists and is of type DOUBLE PRECISION (Float)
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'PreConstructionProject' 
    AND column_name = 'height' 
    AND data_type = 'double precision'
  ) THEN
    -- Alter the column type from DOUBLE PRECISION to TEXT
    -- The USING clause will automatically convert numeric values to text
    ALTER TABLE "PreConstructionProject" 
    ALTER COLUMN "height" TYPE TEXT USING 
      CASE 
        WHEN "height" IS NOT NULL THEN "height"::text || ' m'
        ELSE NULL
      END;
    
    RAISE NOTICE 'Column height changed from Float to String successfully';
  ELSIF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'PreConstructionProject' 
    AND column_name = 'height' 
    AND data_type = 'text'
  ) THEN
    RAISE NOTICE 'Column height is already String type';
  ELSE
    RAISE NOTICE 'Column height does not exist';
  END IF;
END $$;

