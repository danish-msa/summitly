# Fix AWS RDS Import Issues - Quick Guide

## Summary of Issues

1. ✅ **Supabase Extensions**: `pg_graphql` and `supabase_vault` don't exist on AWS RDS (not used by your app)
2. ✅ **Missing Table**: `vault.secrets` (from Supabase vault extension - not used)
3. ✅ **Duplicate Key**: `prefixes_pkey` constraint violation

## Quick Fix (Automated)

**Run the automated fix script:**

```powershell
# Replace with your actual RDS endpoint
.\fix-rds-import.ps1 -RdsEndpoint "summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com" -DatabaseName "summitly" -Username "postgres"
```

This will:
- Clean schema.sql (remove Supabase extensions)
- Clean data.sql (remove vault.secrets)
- Import everything correctly

---

## Manual Fix (Step by Step)

### Step 1: Clean Schema

```powershell
.\clean-schema-for-rds.ps1
```

This creates `schema_cleaned.sql` without Supabase-specific extensions.

### Step 2: Clean Data

```powershell
.\clean-data-for-rds.ps1
```

This creates `data_cleaned.sql` without vault.secrets.

### Step 3: Fix Duplicate Key Issue

**Option A: Truncate table before import**
```sql
-- Connect to RDS
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly

-- Truncate prefixes table
TRUNCATE TABLE storage.prefixes CASCADE;

-- Exit
\q
```

**Option B: Drop and recreate database (clean slate)**
```sql
-- Connect to postgres database
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d postgres

-- Drop and recreate
DROP DATABASE IF EXISTS summitly;
CREATE DATABASE summitly;

-- Exit
\q
```

### Step 4: Import Cleaned Schema

```powershell
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -f schema_cleaned.sql
```

**Password**: Your RDS master password

### Step 5: Import Cleaned Data

```powershell
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -f data_cleaned.sql
```

**Password**: Your RDS master password

### Step 6: Verify Import

```sql
-- Connect to RDS
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly

-- Check table counts
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'storage')
ORDER BY schemaname, tablename;

-- Check specific important tables
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Property";
SELECT COUNT(*) FROM "PreConstructionProject";
```

---

## What Was Removed?

### From schema.sql:
- ❌ `pg_graphql` extension (Supabase-specific)
- ❌ `supabase_vault` extension (Supabase-specific)
- ❌ `graphql` and `graphql_public` schemas
- ❌ Related functions and event triggers

### From data.sql:
- ❌ `vault.secrets` table data (not used by your app)

### What Remains:
- ✅ All your application tables
- ✅ All your application data
- ✅ Standard PostgreSQL extensions (`pgcrypto`, `uuid-ossp`, `pg_stat_statements`)

---

## Troubleshooting

### Still Getting Extension Errors?

Make sure you're using `schema_cleaned.sql`, not `schema.sql`:
```powershell
# Check which file you're importing
Get-Content schema_cleaned.sql | Select-String "pg_graphql"
# Should return nothing

# If it returns results, the cleaning didn't work - check the script
```

### Still Getting Duplicate Key Errors?

1. **Check if data was already imported:**
```sql
SELECT COUNT(*) FROM storage.prefixes;
```

2. **If count > 0, truncate and re-import:**
```sql
TRUNCATE TABLE storage.prefixes CASCADE;
-- Then re-run data import
```

### Connection Issues?

Make sure:
- ✅ Security group allows your IP on port 5432
- ✅ RDS endpoint is correct (Writer instance, not Reader)
- ✅ Database name is correct (`summitly`)
- ✅ Username is correct (`postgres`)

---

## Next Steps After Successful Import

1. ✅ Update `DATABASE_URL` in your environment variables
2. ✅ Test application connection
3. ✅ Verify all functionality works
4. ✅ Proceed with AWS Amplify setup

---

## Need Help?

If you're still having issues, check:
- `AWS_MIGRATION_GUIDE.md` - Full migration guide
- RDS CloudWatch logs for detailed error messages
- Verify your RDS instance is running and accessible

