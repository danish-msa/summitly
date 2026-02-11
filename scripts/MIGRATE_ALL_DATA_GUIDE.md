# Complete Data Migration Guide: Supabase → AWS RDS

This guide will help you migrate **ALL** data from your Supabase database to AWS RDS, including images.

## ⚠️ Important Notes

- **This script is READ-ONLY on Supabase** - it will NOT modify your Supabase database at all
- **Images are migrated** from Supabase Storage to AWS S3
- **All database records** are migrated using upsert (insert or update)
- **Foreign key relationships** are preserved

## 📋 Prerequisites

1. **Environment Variables** - Create or update your `.env.local` file:

```env
# Supabase connection (READ-ONLY source)
SUPABASE_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.omsefyactufffyqaxowx.supabase.co:5432/postgres?sslmode=require"

# AWS RDS connection (WRITE destination)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@your-rds-endpoint.amazonaws.com:5432/summitly?sslmode=require"

# AWS S3 credentials (for image migration)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="summitly-storage"
AWS_REGION="ca-central-1"
```

**Important:**
- Replace `YOUR_PASSWORD` with actual passwords (URL-encode special characters like `@` → `%40`)
- The `SUPABASE_DATABASE_URL` should point to your Supabase database
- The `DATABASE_URL` should point to your AWS RDS database

2. **AWS S3 Bucket** - Your S3 bucket should be configured with:
   - Public read access
   - Custom domain: `shared-s3.property.ca` (or update the script with your domain)

3. **Dependencies** - Already installed:
   - `@aws-sdk/client-s3`
   - `@prisma/client`
   - `@prisma/adapter-pg`
   - `pg`

## 🚀 Usage

### Step 1: Test Run (Dry Run)

First, run in dry-run mode to see what will be migrated without making any changes:

```bash
npx tsx scripts/migrate-all-data.ts --dry-run
```

This will:
- ✅ Connect to both databases
- ✅ Show you how many records will be migrated from each table
- ✅ Show how many images will be migrated
- ❌ **Won't download, upload, or update anything**

### Step 2: Test with Images Skipped

If you want to test data migration without images first:

```bash
npx tsx scripts/migrate-all-data.ts --skip-images
```

This will migrate all database records but skip image migration.

### Step 3: Full Migration

Once you're confident, run the full migration:

```bash
npx tsx scripts/migrate-all-data.ts
```

This will:
1. **Migrate all images** from Supabase Storage to AWS S3
2. **Migrate all database records** from Supabase to AWS RDS
3. **Update image URLs** in the database to point to AWS S3

## 📊 What Gets Migrated

### Database Tables (in dependency order):

1. **User** - All user accounts
2. **DevelopmentTeam** - Development team information
3. **PageCategory** - Page categories
4. **Account** - OAuth accounts (depends on User)
5. **Session** - User sessions (depends on User)
6. **VerificationToken** - Email verification tokens
7. **AgentProfile** - Agent profiles (depends on User)
8. **Property** - All properties (depends on User)
9. **Page** - CMS pages (depends on User)
10. **Favorite** - User favorites (depends on Property, User)
11. **SavedProperty** - Saved properties (depends on User)
12. **PropertyView** - Property views (depends on Property)
13. **PropertyWatchlist** - Property watchlists (depends on User)
14. **Tour** - Property tours (depends on User)
15. **PropertyRating** - Property ratings (depends on Property)
16. **PreConstructionProject** - Pre-construction projects
17. **PreConstructionUnit** - Pre-construction units (depends on PreConstructionProject)
18. **PreConstructionPageContent** - Pre-construction page content
19. **Contact** - Contact form submissions
20. **SearchHistory** - User search history (depends on User)
21. **MarketTrends** - Market trends data
22. **MarketRankings** - Market rankings data
23. **CityBreakdown** - City breakdown data
24. **PropertyTypeBreakdown** - Property type breakdown data

### Images Migrated:

- `Property.images` (array)
- `PreConstructionProject.images` (array)
- `PreConstructionUnit.images` (array)
- `PreConstructionPageContent.heroImage` (single)
- `DevelopmentTeam.image` (single)
- `User.image` (single)
- `PreConstructionProject.developerInfo.image` (JSON field)
- `PreConstructionProject.architectInfo.image` (JSON field)
- `PreConstructionProject.builderInfo.image` (JSON field)
- `PreConstructionProject.interiorDesignerInfo.image` (JSON field)
- `PreConstructionProject.landscapeArchitectInfo.image` (JSON field)
- `PreConstructionProject.marketingInfo.image` (JSON field)

## 🔍 Migration Process

The script follows this process:

1. **Image Collection**: Scans Supabase database for all Supabase image URLs
2. **Image Migration**: Downloads images from Supabase Storage and uploads to AWS S3
3. **URL Mapping**: Creates a map of old URLs → new URLs
4. **Data Migration**: Migrates all database records in dependency order
5. **URL Replacement**: Replaces Supabase URLs with AWS URLs in the migrated data

## 📈 Progress Tracking

The script provides detailed progress information:

- Real-time progress for image migration
- Per-table migration statistics
- Final summary with totals

Example output:
```
📋 Migrating Users...
  ✓ Migrated 150/150 users
📋 Migrating Properties...
  ✓ Migrated 500/500 properties
...
MIGRATION SUMMARY
============================================================
User: 150/150 (0 errors)
Property: 500/500 (0 errors)
...
Total: 5000/5000 records migrated (0 errors)
```

## ⚠️ Troubleshooting

### Connection Errors

If you get connection errors:

1. **Check environment variables** are set correctly
2. **Verify database credentials** are correct
3. **Check network connectivity** to both databases
4. **Ensure Supabase project is active** (not paused)

### Image Migration Errors

If image migration fails:

1. **Check AWS credentials** are correct
2. **Verify S3 bucket exists** and is accessible
3. **Check bucket permissions** (public read access)
4. **Verify image URLs** are accessible from Supabase Storage

### Foreign Key Errors

If you get foreign key constraint errors:

1. **Check dependency order** - the script migrates in the correct order
2. **Verify parent records exist** - ensure Users exist before migrating Accounts
3. **Check for orphaned records** in Supabase

### Duplicate Key Errors

The script uses `upsert` operations, so duplicates should be handled automatically. If you still get errors:

1. **Check unique constraints** match between Supabase and AWS
2. **Verify primary keys** are consistent

## 🔒 Safety Features

- **Read-only on Supabase**: The script only reads from Supabase, never writes
- **Upsert operations**: Uses upsert to handle existing records gracefully
- **Dry-run mode**: Test before making changes
- **Error handling**: Continues migration even if individual records fail
- **Progress tracking**: See exactly what's being migrated

## 📝 Notes

- The script preserves all timestamps (`createdAt`, `updatedAt`)
- All relationships are maintained
- Image URLs are automatically updated to point to AWS S3
- The script is idempotent - you can run it multiple times safely

## 🆘 Support

If you encounter issues:

1. Check the error messages in the console
2. Review the migration summary for failed records
3. Verify your environment variables
4. Test with `--dry-run` first

