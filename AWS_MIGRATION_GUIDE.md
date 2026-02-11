# Complete Migration Guide: Supabase → AWS RDS + Amplify

This guide will help you migrate your database from Supabase to AWS RDS and deploy your application to AWS Amplify.

## 📋 Prerequisites

- AWS Account (create at https://aws.amazon.com)
- AWS CLI installed (optional, for easier management)
- PostgreSQL client tools (`pg_dump`, `psql`) installed
- Your Supabase database credentials
- GitHub repository with your code

---

## Phase 1: Set Up AWS RDS PostgreSQL

### Step 1.1: Create RDS Database Instance

1. **Log in to AWS Console**
   - Go to https://console.aws.amazon.com
   - Navigate to **RDS** service

2. **Create Database**
   - Click **"Create database"** button
   - Choose **"Standard create"** (not Easy create for more control)

3. **Engine Options**
   - **Engine type**: PostgreSQL
   - **Version**: Choose PostgreSQL 15.x or 16.x (match your Supabase version if possible)
   - **Templates**: 
     - For **Free Tier** (first 12 months): Choose **"Free tier"**
     - For **Production**: Choose **"Production"**

4. **Settings**
   - **DB instance identifier**: `summitly-db`
   - **Master username**: `postgres` (or your preferred username)
   - **Master password**: Create a strong password (save this securely!)
   - **Confirm password**: Re-enter password

5. **Instance Configuration**
   - **DB instance class**:
     - Free tier: `db.t3.micro` (1 vCPU, 1 GB RAM)
     - Production: `db.t3.small` (2 vCPU, 2 GB RAM) or larger
   - **Storage**: 
     - **Storage type**: General Purpose SSD (gp3)
     - **Allocated storage**: 20 GB (minimum, increase if needed)
     - **Storage autoscaling**: Enable (recommended)
     - **Maximum storage threshold**: 100 GB

6. **Connectivity**
   - **VPC**: Default VPC (or your custom VPC)
   - **Subnet group**: default
   - **Public access**: **Yes** (required for Amplify to connect)
   - **VPC security group**: Create new or choose existing
   - **Availability Zone**: No preference (or choose specific)
   - **Port**: 5432 (default PostgreSQL port)

7. **Database Authentication**
   - **Password authentication**: Selected (default)

8. **Additional Configuration**
   - **Initial database name**: `summitly` (or `postgres`)
   - **DB parameter group**: default
   - **Backup**: 
     - **Automated backups**: Enable
     - **Backup retention period**: 7 days (free tier: 1 day)
     - **Backup window**: No preference
   - **Encryption**: Enable (recommended for production)
   - **Performance Insights**: Enable (optional, for monitoring)
   - **Enhanced monitoring**: Disable (optional)

9. **Maintenance**
   - **Auto minor version upgrade**: Enable
   - **Maintenance window**: No preference

10. **Review and Create**
    - Review all settings
    - Click **"Create database"**
    - Wait 5-10 minutes for database to be created

### Step 1.2: Configure Security Group

1. **Find Your RDS Instance**
   - Go to RDS Dashboard
   - Click on your database instance (`summitly-db`)

2. **Open Security Group**
   - Click on the **VPC security group** link
   - Click **"Edit inbound rules"**

3. **Add Rule**
   - **Type**: PostgreSQL
   - **Protocol**: TCP
   - **Port**: 5432
   - **Source**: 
     - For Amplify: `0.0.0.0/0` (allows from anywhere - secure with your IP if preferred)
     - Or specific IP: Your IP address
   - Click **"Save rules"**

### Step 1.3: Get Connection Details

1. **Get Endpoint**
   - In RDS Dashboard, click on your database
   - Copy the **Endpoint** (e.g., `summitly-db.xxxxx.us-east-1.rds.amazonaws.com`)
   - Note the **Port** (usually 5432)

2. **Connection String Format**
   ```
   postgresql://postgres:[PASSWORD]@[ENDPOINT]:5432/summitly?sslmode=require
   ```
   
   Example:
   ```
   postgresql://postgres:MySecurePassword123@summitly-db.xxxxx.us-east-1.rds.amazonaws.com:5432/summitly?sslmode=require
   ```

---

## Phase 2: Export Data from Supabase

### Step 2.1: Get Supabase Connection String

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: **summitly**

2. **Get Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Click **"URI"** tab
   - Copy the connection string
   - Format: `postgresql://postgres:[PASSWORD]@db.omsefyactufffyqaxowx.supabase.co:5432/postgres`
   - Replace `[PASSWORD]` with your actual password: `summitly@123`
   - URL-encode special characters: `@` becomes `%40`
   - Final: `postgresql://postgres:summitly%40123@db.omsefyactufffyqaxowx.supabase.co:5432/postgres`

### Step 2.2: Install PostgreSQL Client Tools (Windows)

**If `pg_dump` is not recognized, install PostgreSQL:**

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Or direct: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Choose: **Windows x86-64** → Latest version (16.x or 15.x)
   - Download the installer (e.g., `postgresql-16.x-windows-x64.exe`)

2. **Install PostgreSQL**
   - Run the installer
   - **Important**: During installation, make sure to check:
     - ✅ **Command Line Tools** (includes `pg_dump`, `psql`)
     - ✅ **pgAdmin 4** (optional, GUI tool)
   - Set a password for local `postgres` user (you can use `postgres` - this is for local DB only)
   - Port: `5432` (default)
   - Finish installation

3. **Add to PATH (if not automatic)**
   - Open **System Properties** → **Environment Variables**
   - Under **System variables**, find `Path` → Click **Edit**
   - Click **New** → Add: `C:\Program Files\PostgreSQL\16\bin` (adjust version number)
   - Click **OK** on all dialogs

4. **Restart PowerShell**
   - Close and reopen PowerShell
   - Test: `pg_dump --version` (should show version number)

**Alternative: Use Full Path (if PATH not working)**
```powershell
# Find your PostgreSQL version first
Get-ChildItem "C:\Program Files\PostgreSQL" -Directory

# Then use full path (replace 16 with your version)
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -h db.omsefyactufffyqaxowx.supabase.co -U postgres -d postgres --schema-only --no-owner --no-privileges -f schema.sql
```

### Step 2.3: Export Database Schema

**On Windows (PowerShell):**
```powershell
# Navigate to your project folder first
cd C:\Users\Danish\Documents\GitHub\summitly

# Export schema only
pg_dump -h db.omsefyactufffyqaxowx.supabase.co `
        -U postgres `
        -d postgres `
        --schema-only `
        --no-owner `
        --no-privileges `
        -f schema.sql
```

**Password when prompted:** `summitly@123`

**On Mac/Linux:**
```bash
pg_dump -h db.omsefyactufffyqaxowx.supabase.co \
        -U postgres \
        -d postgres \
        --schema-only \
        --no-owner \
        --no-privileges \
        -f schema.sql
```

**When prompted, enter password:** `summitly@123`

### Step 2.4: Export Database Data

**On Windows (PowerShell):**
```powershell
# Export data only
pg_dump -h db.omsefyactufffyqaxowx.supabase.co `
        -U postgres `
        -d postgres `
        --data-only `
        --no-owner `
        --no-privileges `
        -f data.sql
```

**Password when prompted:** `summitly@123`

**On Mac/Linux:**
```bash
pg_dump -h db.omsefyactufffyqaxowx.supabase.co \
        -U postgres \
        -d postgres \
        --data-only \
        --no-owner \
        --no-privileges \
        -f data.sql
```

### Step 2.5: Export Everything (Alternative - One Command)

**On Windows (PowerShell):**
```powershell
# Export schema + data together
pg_dump -h db.omsefyactufffyqaxowx.supabase.co `
        -U postgres `
        -d postgres `
        --no-owner `
        --no-privileges `
        -f full_backup.sql
```

**On Mac/Linux:**
```bash
pg_dump -h db.omsefyactufffyqaxowx.supabase.co \
        -U postgres \
        -d postgres \
        --no-owner \
        --no-privileges \
        -f full_backup.sql
```

**Note:** You should now have:
- `schema.sql` (database structure)
- `data.sql` (all data)
- OR `full_backup.sql` (both combined)

---

## Phase 3: Import Data to AWS RDS

### Step 3.1: Test RDS Connection

**On Windows (PowerShell):**
```powershell
# Test connection (replace with your RDS endpoint)
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -c "SELECT version();"
```

**On Mac/Linux:**
```bash
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d summitly \
     -c "SELECT version();"
```

**Enter your RDS master password when prompted.**

If this works, you're connected! ✅

### Step 3.2: Import Schema

**On Windows (PowerShell):**
```powershell
# Import schema first
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -f schema.sql
```

**On Mac/Linux:**
```bash
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d summitly \
     -f schema.sql
```

### Step 3.3: Import Data

**On Windows (PowerShell):**
```powershell
# Import data
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -f data.sql
```

**On Mac/Linux:**
```bash
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d summitly \
     -f data.sql
```

**OR if using full_backup.sql:**
```powershell
# Windows
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com `
     -U postgres `
     -d summitly `
     -f full_backup.sql

# Mac/Linux
psql -h summitly-db.xxxxx.us-east-1.rds.amazonaws.com \
     -U postgres \
     -d summitly \
     -f full_backup.sql
```

### Step 3.4: Fix Common Import Issues

**If you encounter errors during import, use these fixes:**

#### Issue 1: Supabase Extensions Not Available

**Error**: `extension "pg_graphql" is not available` or `extension "supabase_vault" is not available`

**Solution**: These are Supabase-specific extensions. Your application doesn't use them. Use the cleaning scripts:

```powershell
# Clean schema to remove Supabase-specific extensions
.\clean-schema-for-rds.ps1

# Clean data to remove vault.secrets
.\clean-data-for-rds.ps1

# Then re-import using the cleaned files
psql -h [YOUR_RDS_ENDPOINT] -U postgres -d summitly -f schema_cleaned.sql
psql -h [YOUR_RDS_ENDPOINT] -U postgres -d summitly -f data_cleaned.sql
```

#### Issue 2: Duplicate Key Violation

**Error**: `duplicate key value violates unique constraint "prefixes_pkey"`

**Solution**: Truncate the table before importing data:

```sql
-- Connect to RDS
psql -h [YOUR_RDS_ENDPOINT] -U postgres -d summitly

-- Truncate the problematic table
TRUNCATE TABLE storage.prefixes CASCADE;

-- Exit and re-run data import
\q
```

Then re-import data:
```powershell
psql -h [YOUR_RDS_ENDPOINT] -U postgres -d summitly -f data_cleaned.sql
```

#### Issue 3: Missing vault.secrets Table

**Error**: `relation "vault.secrets" does not exist`

**Solution**: This table is from Supabase vault extension (not used by your app). The cleaning script removes it automatically. If you still see this error:

```sql
-- Option 1: Create empty vault schema (if needed)
CREATE SCHEMA IF NOT EXISTS vault;

-- Option 2: Skip vault.secrets import (recommended)
-- The cleaning script already handles this
```

#### Complete Fix Script

**Use the automated fix script:**

```powershell
.\fix-rds-import.ps1 -RdsEndpoint "summitly-db.xxxxx.ca-central-1.rds.amazonaws.com" -DatabaseName "summitly" -Username "postgres"
```

This script will:
1. Clean schema.sql (remove Supabase extensions)
2. Clean data.sql (remove vault.secrets)
3. Optionally recreate database
4. Import cleaned schema
5. Fix duplicate key issues
6. Import cleaned data
7. Verify import

### Step 3.5: Verify Import

**Connect to RDS and check tables:**
```sql
-- List all tables
\dt

-- Check record counts
SELECT COUNT(*) FROM "User";
SELECT COUNT(*) FROM "Property";
SELECT COUNT(*) FROM "PreConstructionProject";
SELECT COUNT(*) FROM "MarketTrends";
-- Check other important tables
```

**Expected:** All tables should exist with data matching Supabase.

---

## Phase 4: Set Up AWS Amplify

### Step 4.1: Create Amplify App

1. **Go to AWS Amplify Console**
   - Visit: https://console.aws.amazon.com/amplify
   - Click **"New app"** → **"Host web app"**

2. **Connect Repository**
   - Choose your Git provider: **GitHub**, **GitLab**, or **Bitbucket**
   - Authorize AWS to access your repository
   - Select your repository: `summitly`
   - Select branch: `main` (or your production branch)
   - Click **"Next"**

3. **Configure Build Settings**
   - Amplify will auto-detect Next.js
   - **Build settings** should show:
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
   - If not auto-detected, click **"Edit"** and paste the above
   - Click **"Next"**

4. **Review and Create**
   - Review settings
   - Click **"Save and deploy"**

### Step 4.2: Configure Environment Variables

1. **Go to App Settings**
   - In Amplify Console, click on your app
   - Go to **"App settings"** → **"Environment variables"**

2. **Add Required Variables**

   Click **"Add environment variable"** for each:

   **Database:**
   ```
   DATABASE_URL = postgresql://postgres:[PASSWORD]@[RDS_ENDPOINT]:5432/summitly?sslmode=require
   ```
   Replace `[PASSWORD]` with your RDS password and `[RDS_ENDPOINT]` with your RDS endpoint.

   **NextAuth:**
   ```
   NEXTAUTH_SECRET = bzi69MGCprBP4wVZGa4jiR2kz2HMTAx7A5K58naSNtc=
   NEXTAUTH_URL = https://[YOUR_AMPLIFY_DOMAIN].amplifyapp.com
   ```
   (Update NEXTAUTH_URL after first deployment with your actual Amplify domain)


   **API Keys (keep your existing ones):**
   ```
   NEXT_PUBLIC_REPLIERS_API_KEY = [YOUR_KEY]
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = [YOUR_KEY]
   ```

   **Google OAuth (if using):**
   ```
   GOOGLE_CLIENT_ID = [YOUR_CLIENT_ID]
   GOOGLE_CLIENT_SECRET = [YOUR_CLIENT_SECRET]
   ```

3. **Save Variables**
   - Click **"Save"** after adding all variables

### Step 4.3: Update Build Settings (if needed)

1. **Go to Build Settings**
   - App settings → Build settings
   - Click **"Edit"**

2. **Verify Pre-build Commands**
   - Should include: `npx prisma generate`
   - Should include: `npm ci` or `npm install`

3. **Save Changes**

---

## Phase 5: Update Project Configuration

### Step 5.1: Update Prisma Configuration

The Prisma configuration should work with AWS RDS. The connection string format is the same.

**Verify `prisma/schema.prisma`:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

This is already correct! ✅

### Step 5.2: Update Environment Variables Locally

**Update `.env.local` (for local development):**
```env
# Database - AWS RDS PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@[RDS_ENDPOINT]:5432/summitly?sslmode=require"

# NextAuth.js
NEXTAUTH_SECRET="bzi69MGCprBP4wVZGa4jiR2kz2HMTAx7A5K58naSNtc="
NEXTAUTH_URL="http://localhost:3000"

# Keep other variables as they are
NEXT_PUBLIC_REPLIERS_API_KEY="your_key"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_key"
```

**Test locally:**
```bash
npm run dev
```

Verify the app connects to RDS successfully.

### Step 5.3: Update next.config.js (Optional)

Remove Supabase image domains if you're not using Supabase storage anymore:

```javascript
// next.config.js
// You can remove these if not using Supabase storage:
// {
//   protocol: 'https',
//   hostname: 'omsefyactufffyqaxowx.supabase.co',
//   ...
// },
```

---

## Phase 6: Deploy and Test

### Step 6.1: Trigger Deployment

1. **Automatic Deployment**
   - Push to your main branch
   - Amplify will automatically deploy

2. **Manual Deployment**
   - Go to Amplify Console
   - Click **"Redeploy this version"** or **"Deploy"**

### Step 6.2: Monitor Deployment

1. **Watch Build Logs**
   - In Amplify Console, click on the deployment
   - Watch the build process
   - Check for any errors

2. **Common Issues:**
   - **Prisma generate fails**: Make sure `npx prisma generate` is in pre-build commands
   - **Database connection fails**: Check DATABASE_URL format and security group
   - **Build timeout**: Increase build timeout in settings

### Step 6.3: Test Deployed Application

1. **Get Amplify Domain**
   - After deployment, Amplify provides a domain like: `https://main.xxxxx.amplifyapp.com`
   - Copy this URL

2. **Update NEXTAUTH_URL**
   - Go to Environment variables
   - Update `NEXTAUTH_URL` to your Amplify domain
   - Redeploy

3. **Test Functionality:**
   - ✅ Homepage loads
   - ✅ Database queries work (listings, properties)
   - ✅ Authentication works (login, register)
   - ✅ API routes work
   - ✅ Pre-construction projects load
   - ✅ Market trends load

### Step 6.4: Set Up Custom Domain (Optional)

1. **Add Custom Domain**
   - In Amplify Console → Domain management
   - Click **"Add domain"**
   - Enter your domain name
   - Follow DNS configuration instructions

2. **Update NEXTAUTH_URL**
   - Update to your custom domain
   - Redeploy

---

## Phase 7: Verification Checklist

### Database Migration ✅
- [ ] RDS instance created and running
- [ ] Security group allows connections
- [ ] Schema imported successfully
- [ ] Data imported successfully
- [ ] All tables have correct data
- [ ] Can connect from local machine
- [ ] Can connect from Amplify

### Amplify Deployment ✅
- [ ] App created in Amplify
- [ ] Repository connected
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Application accessible via Amplify domain
- [ ] All pages load correctly
- [ ] API routes work
- [ ] Authentication works
- [ ] Database queries work

### Testing ✅
- [ ] Homepage loads
- [ ] Property listings load
- [ ] Pre-construction projects load
- [ ] User registration works
- [ ] User login works
- [ ] Property search works
- [ ] Market trends load
- [ ] All API endpoints respond correctly

---

## Troubleshooting

### Issue: Cannot connect to RDS

**Solution:**
1. Check security group allows port 5432 from your IP/Amplify
2. Verify RDS is publicly accessible
3. Check connection string format
4. Verify password is correct

### Issue: Prisma generate fails in Amplify

**Solution:**
1. Ensure `npx prisma generate` is in pre-build commands
2. Check DATABASE_URL is set correctly
3. Verify Prisma schema is valid

### Issue: Database connection timeout

**Solution:**
1. Check RDS security group
2. Verify RDS is in same region as Amplify (recommended)
3. Check connection string includes `?sslmode=require`

### Issue: Build fails

**Solution:**
1. Check build logs in Amplify Console
2. Verify all environment variables are set
3. Check Node.js version compatibility
4. Review error messages in logs

---

## Cost Estimation

### AWS RDS (Free Tier - First 12 Months)
- **db.t3.micro**: $0/month
- **Storage (20 GB)**: $0/month
- **Backups**: $0/month
- **Total**: **$0/month** ✅

### AWS RDS (After Free Tier)
- **db.t3.micro**: ~$15/month
- **Storage (20 GB)**: ~$2/month
- **Backups**: ~$2/month
- **Total**: **~$19/month**

### AWS Amplify
- **Free Tier**: 15 GB storage, 5 GB bandwidth/month
- **After Free Tier**: Pay-as-you-go
- **Estimated**: **$0-25/month** (low-medium traffic)

### Total Estimated Cost
- **First 12 months**: **$0-25/month** (mostly free!)
- **After 12 months**: **~$44/month** (RDS + Amplify)

---

## Next Steps

1. ✅ Complete database migration
2. ✅ Deploy to Amplify
3. ✅ Test everything thoroughly
4. 🔄 (Future) Migrate storage from Supabase to S3
5. 🔄 (Future) Set up custom domain
6. 🔄 (Future) Configure CloudFront for better performance
7. 🔄 (Future) Set up monitoring and alerts

---

## Support Resources

- **AWS RDS Documentation**: https://docs.aws.amazon.com/rds/
- **AWS Amplify Documentation**: https://docs.amplify.aws/
- **Prisma Documentation**: https://www.prisma.io/docs/
- **Next.js Documentation**: https://nextjs.org/docs

---

**Good luck with your migration! 🚀**

