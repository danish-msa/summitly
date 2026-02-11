# Database Migration: Pre-Construction Project Fields

## Issue
The database schema is missing several columns that were added to the Prisma schema:
- `documents`
- `developerInfo`
- `architectInfo`
- `builderInfo`
- `interiorDesignerInfo`
- `landscapeArchitectInfo`
- `marketingInfo`

## Solution
Apply the migration SQL script to add these missing columns to your Supabase database.

## Steps to Apply Migration

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Script**
   - Copy the contents of `prisma/migrations/add_precon_project_fields.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify the Migration**
   - After running the script, verify that all columns exist by running:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'PreConstructionProject'
   ORDER BY column_name;
   ```

4. **Test the Application**
   - Try accessing the pre-con projects admin page
   - The error should be resolved

## Alternative: Using Prisma Migrate (if applicable)

If you're using Prisma Migrate directly (not Supabase), you can run:

```bash
npx prisma migrate dev --name add_precon_project_fields
```

However, since you're using Supabase, the SQL script approach is recommended.

## Notes
- The migration script uses `DO $$` blocks to check if columns exist before adding them
- This makes the script idempotent (safe to run multiple times)
- All new columns are nullable (TEXT) to allow existing records to remain valid

