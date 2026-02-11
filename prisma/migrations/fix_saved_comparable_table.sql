-- Fix SavedComparable table - Add basePropertyMlsNumber column if missing
-- Run this SQL directly on your database

-- Check if table exists and if basePropertyMlsNumber column exists
DO $$ 
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'SavedComparable') THEN
        CREATE TABLE "SavedComparable" (
            "id" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "basePropertyMlsNumber" TEXT NOT NULL,
            "mlsNumber" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "SavedComparable_pkey" PRIMARY KEY ("id")
        );
        
        -- Create unique constraint
        CREATE UNIQUE INDEX "SavedComparable_userId_basePropertyMlsNumber_mlsNumber_key" 
            ON "SavedComparable"("userId", "basePropertyMlsNumber", "mlsNumber");
        
        -- Create indexes
        CREATE INDEX "SavedComparable_userId_idx" ON "SavedComparable"("userId");
        CREATE INDEX "SavedComparable_basePropertyMlsNumber_idx" ON "SavedComparable"("basePropertyMlsNumber");
        CREATE INDEX "SavedComparable_mlsNumber_idx" ON "SavedComparable"("mlsNumber");
        CREATE INDEX "SavedComparable_userId_basePropertyMlsNumber_idx" ON "SavedComparable"("userId", "basePropertyMlsNumber");
        
        -- Add foreign key
        ALTER TABLE "SavedComparable" 
            ADD CONSTRAINT "SavedComparable_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
            
        RAISE NOTICE 'Created SavedComparable table';
    ELSE
        -- Table exists, check if basePropertyMlsNumber column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'SavedComparable' 
            AND column_name = 'basePropertyMlsNumber'
        ) THEN
            -- Add the missing column
            ALTER TABLE "SavedComparable" 
                ADD COLUMN "basePropertyMlsNumber" TEXT NOT NULL DEFAULT '';
            
            -- Drop old unique constraint if it exists (without basePropertyMlsNumber)
            DROP INDEX IF EXISTS "SavedComparable_userId_mlsNumber_key";
            
            -- Create new unique constraint with basePropertyMlsNumber
            CREATE UNIQUE INDEX IF NOT EXISTS "SavedComparable_userId_basePropertyMlsNumber_mlsNumber_key" 
                ON "SavedComparable"("userId", "basePropertyMlsNumber", "mlsNumber");
            
            -- Add index for basePropertyMlsNumber if it doesn't exist
            CREATE INDEX IF NOT EXISTS "SavedComparable_basePropertyMlsNumber_idx" 
                ON "SavedComparable"("basePropertyMlsNumber");
            
            -- Add composite index if it doesn't exist
            CREATE INDEX IF NOT EXISTS "SavedComparable_userId_basePropertyMlsNumber_idx" 
                ON "SavedComparable"("userId", "basePropertyMlsNumber");
            
            -- Remove default after adding column (if you want to enforce NOT NULL)
            -- ALTER TABLE "SavedComparable" ALTER COLUMN "basePropertyMlsNumber" DROP DEFAULT;
            
            RAISE NOTICE 'Added basePropertyMlsNumber column to SavedComparable table';
        ELSE
            RAISE NOTICE 'SavedComparable table already has basePropertyMlsNumber column';
        END IF;
    END IF;
END $$;

-- Add trigger to update updatedAt timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_SavedComparable_updated_at ON "SavedComparable";
CREATE TRIGGER update_SavedComparable_updated_at 
    BEFORE UPDATE ON "SavedComparable"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
