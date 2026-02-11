# Create SavedComparable Table - Alternative Methods

Since `npx prisma migrate dev` is having connection issues, here are alternative ways to create the table:

## Method 1: Run SQL Directly (RECOMMENDED)

If you have direct database access (psql, pgAdmin, or AWS RDS Query Editor):

1. **Connect to your database:**
   ```powershell
   psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly
   ```

2. **Run the SQL script:**
   ```sql
   -- Copy and paste the contents of prisma/migrations/create_saved_comparable_table.sql
   -- Or run:
   \i prisma/migrations/create_saved_comparable_table.sql
   ```

3. **Or use AWS RDS Query Editor:**
   - Go to AWS Console → RDS → Your database instance
   - Click "Query Editor" (if available)
   - Paste the SQL from `prisma/migrations/create_saved_comparable_table.sql`
   - Execute

## Method 2: Use Prisma DB Push (Alternative)

If you can't run migrations but can connect to the database:

```powershell
# This will push the schema changes directly (not ideal for production, but works)
npx prisma db push
```

**Note:** `db push` doesn't create migration files, but it will create the table.

## Method 3: Fix Connection and Run Migration

If you want to use proper migrations:

1. **Update your `.env.local` with timeout parameters:**
   ```env
   DATABASE_URL="postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require&connect_timeout=60&pool_timeout=60"
   ```

2. **Try migration again:**
   ```powershell
   npx prisma migrate dev --name add_saved_comparables
   ```

## Method 4: Manual Migration File

If you can create the migration file manually:

1. **Create the migration directory:**
   ```powershell
   mkdir -p prisma/migrations/$(Get-Date -Format "yyyyMMddHHmmss")_add_saved_comparables
   ```

2. **Create `migration.sql` in that directory:**
   - Copy contents from `prisma/migrations/create_saved_comparable_table.sql`

3. **Mark it as applied:**
   ```powershell
   npx prisma migrate resolve --applied add_saved_comparables
   ```

## Verify Table Creation

After using any method, verify the table exists:

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'SavedComparable';

-- Check table structure
\d "SavedComparable"
```

## Quick Test

Once the table is created, test the API:

```powershell
# The error should go away and you should be able to save comparables
```

## Recommended Approach

**For now, use Method 1 (Direct SQL)** - it's the fastest and most reliable if you have database access.

Then later, when connection issues are resolved, you can:
1. Create a proper migration file
2. Mark it as applied: `npx prisma migrate resolve --applied add_saved_comparables`

