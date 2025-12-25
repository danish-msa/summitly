# How to Add the `featured` Column to Your Database

## Option 1: Using SQL Directly (Quick Method)

Connect to your AWS RDS database and run this SQL:

```sql
-- Add the featured column
ALTER TABLE "PreConstructionProject" 
ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "PreConstructionProject_featured_idx" 
ON "PreConstructionProject"("featured");
```

### How to Connect to AWS RDS:

**Using psql (if you have PostgreSQL client installed):**
```bash
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com \
     -U postgres \
     -d summitly \
     -c "ALTER TABLE \"PreConstructionProject\" ADD COLUMN IF NOT EXISTS \"featured\" BOOLEAN NOT NULL DEFAULT false;"
```

**Using AWS RDS Query Editor (if enabled):**
1. Go to AWS Console → RDS → Your Database
2. Click on "Query Editor" (if available)
3. Paste and run the SQL commands above

**Using a Database Client (DBeaver, pgAdmin, etc.):**
1. Connect to your RDS instance using the connection string from your `.env.local`
2. Run the SQL commands above

## Option 2: Using Prisma Migrate (Recommended)

If you want to use Prisma migrations:

1. **Create the migration:**
   ```bash
   npx prisma migrate dev --name add_featured_column
   ```

2. **Or apply the existing migration file:**
   ```bash
   # First, make sure your DATABASE_URL is set correctly
   npx prisma migrate deploy
   ```

## Option 3: Manual SQL via Connection String

If you have the connection details, you can run:

```bash
# Using psql with connection string from .env.local
psql "postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require" \
  -c "ALTER TABLE \"PreConstructionProject\" ADD COLUMN IF NOT EXISTS \"featured\" BOOLEAN NOT NULL DEFAULT false;"
```

Replace `[PASSWORD]` with your actual database password.

## Verify the Column Was Added

After running the SQL, verify it was added:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'PreConstructionProject' 
AND column_name = 'featured';
```

You should see:
- column_name: `featured`
- data_type: `boolean`
- column_default: `false`

## After Adding the Column

1. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

2. **Redeploy your application** to Vercel

3. **Test the API** - it should now work with the featured column

## Notes

- The `IF NOT EXISTS` clause ensures the command won't fail if the column already exists
- The `DEFAULT false` means all existing projects will have `featured = false`
- The index will help with queries filtering by featured status
- This is a safe operation that won't affect existing data

