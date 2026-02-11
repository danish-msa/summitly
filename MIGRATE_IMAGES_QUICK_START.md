# Quick Start: Migrate Images from Supabase to AWS S3

## 🚀 Step-by-Step Guide

### Step 1: Install Dependencies

```bash
npm install
```

This will install `tsx` which is needed to run the TypeScript migration script.

### Step 2: Verify Environment Variables

Make sure your `.env.local` has these variables:

```env
DATABASE_URL=postgresql://user:password@host:5432/database
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ca-central-1
AWS_S3_BUCKET=summitly-storage
```

### Step 3: Test Run (Dry Run)

See what will be migrated without making any changes:

```bash
npm run migrate:images:dry-run
```

This will show you:
- How many Supabase image URLs were found
- Breakdown by table (Property, PreConstructionProject, etc.)
- **No files will be downloaded or uploaded**
- **No database changes will be made**

### Step 4: Test with Small Batch

Test with just 10 images first:

```bash
npm run migrate:images:test
```

This will:
- Download 10 images from Supabase
- Upload them to AWS S3
- Update database URLs
- Show you the results

**Check your application** to verify the test images are working correctly.

### Step 5: Full Migration

Once you're confident, run the full migration:

```bash
npm run migrate:images
```

This will:
- Find all Supabase image URLs in your database
- Download each image from Supabase Storage
- Upload to AWS S3 (skips if already exists)
- Update all database URLs from Supabase to AWS

**Expected time:** Depends on number of images. The script processes 5 images concurrently.

## 📊 What Gets Migrated

The script automatically finds and migrates images from:

- ✅ `Property.images` (array)
- ✅ `PreConstructionProject.images` (array)
- ✅ `PreConstructionUnit.images` (array)
- ✅ `PreConstructionPageContent.heroImage` (single)
- ✅ `DevelopmentTeam.image` (single)
- ✅ `User.image` (single)
- ✅ JSON fields in `PreConstructionProject` (developerInfo, architectInfo, etc.)

## 🔍 URL Conversion

**Before:**
```
https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/file.jpg
```

**After:**
```
https://shared-s3.property.ca/public/images/pre-con/projects/file.jpg
```

## ⚠️ Important Notes

1. **Backup First** - Consider backing up your database before running the full migration
2. **Test First** - Always run the dry-run and test with 10 images first
3. **Safe to Re-run** - The script is safe to run multiple times (skips already uploaded files)
4. **Network Required** - You need internet access to download from Supabase and upload to AWS

## 🐛 Troubleshooting

### "tsx: command not found"
```bash
npm install
```

### "Failed to download: 404"
- Some images may have been deleted from Supabase
- The script will continue and log errors
- Check the error list at the end

### "Access Denied" on S3
- Check your AWS credentials in `.env.local`
- Verify your S3 bucket allows public read access
- Check IAM permissions

### Images not showing after migration
- Check browser console for errors
- Verify the AWS URL format matches your setup
- Run this SQL to check for remaining Supabase URLs:
  ```sql
  SELECT COUNT(*) FROM "Property" WHERE images::text LIKE '%supabase.co%';
  ```

## 📈 Monitoring Progress

The script shows:
- Progress: `X/Y images processed`
- Results: Total, Downloaded, Uploaded, Failed, Skipped
- Errors: List of failed URLs with error messages

## ✅ Post-Migration Checklist

1. ✅ Check a few pages in your application
2. ✅ Verify images load correctly
3. ✅ Check database for remaining Supabase URLs (SQL query above)
4. ✅ Monitor for any broken images
5. ✅ Consider backing up database after successful migration

## 📚 More Details

See `scripts/IMAGE_MIGRATION_GUIDE.md` for detailed documentation.

## 🆘 Need Help?

If you encounter issues:
1. Check the error messages in the script output
2. Review the troubleshooting section
3. Verify all environment variables are correct
4. Check AWS CloudWatch logs (if using AWS)

