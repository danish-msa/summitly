# Environment Variables Setup for Data Migration

## Required Environment Variables

The migration script needs **TWO** database connection strings:

1. **`SUPABASE_DATABASE_URL`** - Source database (Supabase, read-only)
2. **`DATABASE_URL`** - Destination database (AWS RDS, write)

## Step 1: Add to Your `.env.local` File

Add these lines to your `.env.local` file in the project root:

```env
# Source Database - Supabase (READ-ONLY)
# This is where we READ data from
SUPABASE_DATABASE_URL="postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres?sslmode=require"

# Destination Database - AWS RDS (WRITE)
# This is where we WRITE data to (your existing DATABASE_URL)
# DATABASE_URL should already be set to your AWS RDS connection string
# Example format:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-rds-endpoint.amazonaws.com:5432/summitly?sslmode=require"
```

## Step 2: Verify Your Current DATABASE_URL

Your `DATABASE_URL` should point to your **AWS RDS** database (the destination).

If you're not sure what it should be, check:
- AWS RDS Console → Your database instance → Endpoint
- Format: `postgresql://postgres:[PASSWORD]@[RDS_ENDPOINT]:5432/summitly?sslmode=require`

## Step 3: URL Encoding for Passwords

If your password contains special characters, URL-encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`
- etc.

Example: Password `summitly@123` becomes `summitly%40123`

## Step 4: Test the Setup

After adding the environment variables, test with:

```bash
# Dry run (no changes)
npx tsx scripts/migrate-all-data.ts --dry-run
```

## Quick Reference

### Supabase Connection String Format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
```

### AWS RDS Connection String Format:
```
postgresql://postgres:[PASSWORD]@[RDS_ENDPOINT]:5432/summitly?sslmode=require
```

## Your Specific Values

Based on your project:
- **Supabase Project Reference**: `omsefyactufffyqaxowx`
- **Supabase Password**: `summitly@123` (URL-encoded: `summitly%40123`)
- **Supabase Connection**: `postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres?sslmode=require`

