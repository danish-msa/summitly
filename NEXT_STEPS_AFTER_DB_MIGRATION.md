# Next Steps After Database Migration to AWS RDS

## ✅ What's Complete

- ✅ Database exported from Supabase
- ✅ Schema imported to AWS RDS (cleaned, no Supabase extensions)
- ✅ Data imported to AWS RDS (all tables, all data)
- ✅ Duplicate key issues fixed
- ✅ All data verified

---

## Step 1: Verify Database Connection

**Test your RDS connection:**

```powershell
# Connect to RDS and verify key tables
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly -c "
SELECT 
    schemaname,
    relname as tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname IN ('public', 'storage')
ORDER BY n_live_tup DESC
LIMIT 10;
"
```

**Check important tables:**
```sql
-- Connect to RDS
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly

-- Check key tables
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Property";
SELECT COUNT(*) FROM "PreConstructionProject";
SELECT COUNT(*) FROM storage.objects;
SELECT COUNT(*) FROM storage.buckets;
```

---

## Step 2: Update Environment Variables

### For Local Development

Update your `.env` file:

```env
# Old Supabase connection
# DATABASE_URL=postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres?sslmode=require

# New AWS RDS connection
DATABASE_URL=postgresql://postgres:[YOUR_RDS_PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require
```

**Important:**
- Replace `[YOUR_RDS_PASSWORD]` with your actual RDS master password
- URL-encode special characters in password (e.g., `@` becomes `%40`)
- Keep `?sslmode=require` for secure connection

### For AWS Amplify (Next Step)

You'll set this in Amplify Console → App Settings → Environment Variables

---

## Step 3: Test Application Connection Locally

**1. Update Prisma to use new database:**

```powershell
# Generate Prisma client with new connection
npx prisma generate

# Test connection
npx prisma db pull
```

**2. Test your application:**

```powershell
# Start dev server
npm run dev
```

**3. Verify:**
- ✅ Application starts without database errors
- ✅ Pages load correctly
- ✅ Data displays (listings, projects, etc.)
- ✅ No connection errors in console

---

## Step 4: Migrate Storage from Supabase to AWS S3

**Your images and documents are still on Supabase Storage. Next steps:**

### Step 4.1: Set Up AWS S3

1. **Create S3 Bucket**
   - Go to AWS S3 Console
   - Create bucket: `summitly-storage` (or your preferred name)
   - Region: `ca-central-1` (same as RDS)
   - **Bucket Versioning**: **Disable** (recommended - saves costs, images rarely change)
   - Block public access: **Uncheck** (for public images)
   - Bucket policy: Allow public read access
   - **Object Ownership**: ACLs disabled (recommended)

2. **Create IAM User for S3 Access**
   - Go to IAM Console
   - Create user: `summitly-s3-uploader`
   - Attach policy: `AmazonS3FullAccess` (or custom policy)
   - Save Access Key ID and Secret Access Key

### Step 4.2: Download Files from Supabase Storage

**Option A: Using Supabase CLI (Recommended)**

**Install Supabase CLI on Windows:**

**Method 1: Using Scoop (Recommended)**
```powershell
# Install Scoop (if not installed)
# Run in PowerShell (as Administrator):
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Install Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Method 2: Direct Download**
1. Download from: https://github.com/supabase/cli/releases/latest
2. Download: `supabase_windows_amd64.zip`
3. Extract and add to PATH, or run directly

**Method 3: npm (Local, not global)**
```powershell
# Install as local dependency (in your project)
npm install supabase --save-dev

# Then use with npx
npx supabase login
npx supabase link --project-ref omsefyactufffyqaxowx
npx supabase storage download images --local-path ./supabase-storage-backup/images
npx supabase storage download documents --local-path ./supabase-storage-backup/documents
```

**After installation, use Supabase CLI:**

```powershell
# Login
supabase login

# Link project
supabase link --project-ref omsefyactufffyqaxowx

# Download all files from storage (use 'cp' command with -r for recursive and --experimental flag)
npx supabase storage cp -r --experimental ss:///images ./supabase-storage-backup/images
npx supabase storage cp -r --experimental ss:///documents ./supabase-storage-backup/documents
```

**Option B: Manual Download via Dashboard**
- Go to Supabase Dashboard → Storage
- Download each bucket manually

### Step 4.3: Upload to AWS S3

```powershell
# Install AWS CLI (if not installed)
# Download from: https://aws.amazon.com/cli/

# Configure AWS CLI
aws configure
# Enter: Access Key ID, Secret Access Key, Region (ca-central-1)

# Upload files
aws s3 sync ./supabase-storage-backup/images s3://summitly-storage/images
aws s3 sync ./supabase-storage-backup/documents s3://summitly-storage/documents
```

### Step 4.4: Update Application Code

Update your upload API routes to use AWS S3 instead of Supabase Storage.

**Files to update:**
- `src/app/api/admin/upload/image/route.ts`
- `src/app/api/admin/upload/document/route.ts`
- `src/lib/supabase.ts` (can be removed or refactored)

---

## Step 5: Set Up AWS Amplify

### Step 5.1: Connect Repository

1. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify
   - Click **"New app"** → **"Host web app"**

2. **Connect GitHub**
   - Authorize AWS to access your repository
   - Select repository: `summitly`
   - Select branch: `main` (or your production branch)

### Step 5.2: Configure Build Settings

Amplify should auto-detect Next.js. Verify build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - npx prisma generate
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### Step 5.3: Set Environment Variables

In Amplify Console → App Settings → Environment Variables, add:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=ca-central-1
AWS_S3_BUCKET=summitly-storage
NEXT_PUBLIC_S3_BUCKET_URL=https://summitly-storage.s3.ca-central-1.amazonaws.com
```

**Also add all your other environment variables:**
- `NEXT_PUBLIC_REPLIERS_API_KEY`
- `NEXT_PUBLIC_REPLIERS_API_URL`
- Any other API keys or configs

### Step 5.4: Deploy

1. Click **"Save and deploy"**
2. Wait for build to complete
3. Your app will be live at: `https://[branch].amplifyapp.com`

---

## Step 6: Update Prisma Configuration

**Verify `src/lib/prisma.ts` is configured for AWS RDS:**

The file should already be updated to support both Supabase and AWS RDS. Verify it uses SSL:

```typescript
// Should detect AWS RDS and use SSL
const databaseUrl = process.env.DATABASE_URL || ''
// AWS RDS requires: ?sslmode=require
```

---

## Step 7: Test Everything

### Database
- ✅ Application connects to RDS
- ✅ All queries work
- ✅ Data displays correctly

### Storage (after S3 migration)
- ✅ Images load from S3
- ✅ Documents download from S3
- ✅ Uploads work to S3

### Deployment
- ✅ Amplify build succeeds
- ✅ Application deploys
- ✅ Production site works

---

## Step 8: Clean Up Supabase (After Verification)

**Only after everything is working on AWS:**

1. **Verify AWS is working** (wait 1-2 weeks)
2. **Backup Supabase one more time** (safety)
3. **Cancel Supabase subscription** (if applicable)
4. **Delete Supabase project** (optional, after confirming AWS works)

---

## Quick Reference

### Your AWS Resources

- **RDS Endpoint**: `summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com`
- **Database Name**: `summitly`
- **Username**: `postgres`
- **Port**: `5432`
- **Region**: `ca-central-1`

### Connection String Format

```
postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require
```

---

## Need Help?

- **Database Issues**: Check `AWS_MIGRATION_GUIDE.md`
- **Import Issues**: Check `FIX_RDS_IMPORT_ISSUES.md`
- **Storage Migration**: See Phase 5 in `AWS_MIGRATION_GUIDE.md`

---

## Next Immediate Action

**Right now, do this:**

1. ✅ Update `.env` with new `DATABASE_URL`
2. ✅ Test locally: `npm run dev`
3. ✅ Verify data loads correctly
4. ✅ Then proceed with S3 storage migration

