# Image Migration Guide: Supabase Storage → AWS S3

This guide will help you migrate all images from Supabase Storage to AWS S3 and update your database URLs.

## 📋 Prerequisites

1. **Environment Variables** - Ensure these are set in your `.env.local`:
   ```env
   DATABASE_URL=postgresql://...
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   AWS_REGION=ca-central-1
   AWS_S3_BUCKET=summitly-storage
   ```

2. **AWS S3 Bucket** - Your S3 bucket should be configured with:
   - Public read access
   - Custom domain: `shared-s3.property.ca` (or update the script with your domain)

3. **Dependencies** - Already installed:
   - `@aws-sdk/client-s3`
   - `@prisma/client`

## 🚀 Quick Start

### Step 1: Test Run (Dry Run)

First, run in dry-run mode to see what will be migrated without making any changes:

```bash
npx tsx scripts/migrate-images.ts --dry-run
```

This will:
- ✅ Scan your database for all Supabase image URLs
- ✅ Show you how many images need to be migrated
- ✅ Show breakdown by table
- ❌ **Won't download, upload, or update anything**

### Step 2: Test with Limited Images

Test with a small number of images first:

```bash
npx tsx scripts/migrate-images.ts --limit=10
```

This will process only the first 10 unique images.

### Step 3: Full Migration

Once you're confident, run the full migration:

```bash
npx tsx scripts/migrate-images.ts
```

## 📊 What Gets Migrated

The script migrates images from these database fields:

| Table | Field | Type |
|-------|-------|------|
| `Property` | `images` | String[] (array) |
| `PreConstructionProject` | `images` | String[] (array) |
| `PreConstructionUnit` | `images` | String[] (array) |
| `PreConstructionPageContent` | `heroImage` | String (single) |
| `DevelopmentTeam` | `image` | String (single) |
| `User` | `image` | String (single) |
| `PreConstructionProject` | `developerInfo.image` | JSON field |
| `PreConstructionProject` | `architectInfo.image` | JSON field |
| `PreConstructionProject` | `builderInfo.image` | JSON field |
| `PreConstructionProject` | `interiorDesignerInfo.image` | JSON field |
| `PreConstructionProject` | `landscapeArchitectInfo.image` | JSON field |
| `PreConstructionProject` | `marketingInfo.image` | JSON field |

## 🔄 Migration Process

The script performs these steps:

1. **Scan Database** - Finds all Supabase URLs across all tables
2. **Download Images** - Downloads each image from Supabase Storage
3. **Upload to S3** - Uploads images to AWS S3 (skips if already exists)
4. **Update Database** - Replaces Supabase URLs with AWS URLs

## 📝 URL Conversion

**From:**
```
https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public/images/pre-con/projects/file.jpg
```

**To:**
```
https://shared-s3.property.ca/public/images/pre-con/projects/file.jpg
```

The script preserves the folder structure (`images/` or `documents/`).

## ⚙️ Configuration

Edit these constants in `scripts/migrate-images.ts` if needed:

```typescript
const SUPABASE_BASE_URL = 'https://omsefyactufffyqaxowx.supabase.co/storage/v1/object/public'
const AWS_PUBLIC_URL = 'https://shared-s3.property.ca/public'
const AWS_BUCKET = process.env.AWS_S3_BUCKET || 'summitly-storage'
const MAX_CONCURRENT = 5 // Number of concurrent downloads/uploads
```

## 🛡️ Safety Features

- **Dry Run Mode** - Test without making changes
- **Duplicate Detection** - Processes each unique URL only once
- **Skip Existing** - Checks if file already exists in S3 before uploading
- **Error Handling** - Continues processing even if some images fail
- **Progress Tracking** - Shows progress during migration

## 📈 Performance

- **Concurrent Processing** - Processes 5 images at a time (configurable)
- **Batch Updates** - Groups database updates for efficiency
- **Resumable** - Can be run multiple times (skips already uploaded files)

## 🐛 Troubleshooting

### Error: "Failed to download: 404 Not Found"
- The image may have been deleted from Supabase
- Check the URL manually in your browser
- The script will continue and log the error

### Error: "Access Denied" on S3 upload
- Check your AWS credentials
- Verify S3 bucket permissions
- Ensure bucket allows public read access

### Error: "Database connection failed"
- Check your `DATABASE_URL` environment variable
- Ensure database is accessible
- Check network/firewall settings

### Images not updating in database
- Check the script output for errors
- Verify Prisma schema matches your database
- Some JSON fields may need manual updates

## 📋 Post-Migration Checklist

After migration:

1. **Verify Images** - Check a few pages to ensure images load correctly
2. **Check Database** - Run this query to verify no Supabase URLs remain:
   ```sql
   SELECT COUNT(*) FROM "Property" WHERE images::text LIKE '%supabase.co%';
   SELECT COUNT(*) FROM "PreConstructionProject" WHERE images::text LIKE '%supabase.co%';
   ```
3. **Monitor Errors** - Check browser console for broken images
4. **Backup** - Consider backing up your database after migration

## 🔄 Re-running the Script

The script is safe to run multiple times:
- Skips images already uploaded to S3
- Only updates URLs that changed
- Won't duplicate work

## 📞 Support

If you encounter issues:
1. Check the error messages in the script output
2. Review the troubleshooting section above
3. Check AWS CloudWatch logs (if using AWS)
4. Verify environment variables are correct

## 🎯 Next Steps

After successful migration:
1. Update your application code to use AWS URLs (if not already done)
2. Consider setting up CloudFront CDN for better performance
3. Monitor S3 costs and usage
4. Eventually remove Supabase Storage (after verifying everything works)

