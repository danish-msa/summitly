# AWS Amplify Troubleshooting Guide

## Current Issue: Multiple 500 Errors on API Routes

All API routes that use the database are returning 500 errors. The Repliers API is working fine, so the issue is with the database connection.

## Step 1: Check AWS Amplify Logs

1. Go to **AWS Amplify Console** → Your App
2. Click on **"Monitoring"** or **"Logs"** in the left sidebar
3. Look for recent deployment/build logs
4. Check for errors related to:
   - `DATABASE_URL`
   - `Prisma`
   - `Database connection`
   - `Connection timeout`

## Step 2: Verify Environment Variables

Go to **AWS Amplify Console** → **App Settings** → **Environment Variables** and verify these are set:

### Required Variables:

```env
# Database (CRITICAL - must be set correctly)
DATABASE_URL=postgresql://postgres:[PASSWORD]@summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com:5432/summitly?sslmode=require

# S3 (updated from AWS_* to S3_*)
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=ca-central-1
S3_BUCKET=summitly-storage

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://main.d13gl8rodu66wo.amplifyapp.com

# API Keys
NEXT_PUBLIC_REPLIERS_API_KEY=your-key
NEXT_PUBLIC_REPLIERS_API_URL=https://api.repliers.io
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

### Important Notes:

1. **DATABASE_URL Format**: 
   - Must include `?sslmode=require` at the end
   - Password must be URL-encoded (e.g., `@` becomes `%40`)
   - Example: `postgresql://postgres:password%40123@host:5432/db?sslmode=require`

2. **S3 Variables**: 
   - Changed from `AWS_*` to `S3_*` (AWS Amplify doesn't allow `AWS_` prefix)
   - Make sure you've updated all references

3. **NEXTAUTH_URL**: 
   - Should match your Amplify app URL
   - Format: `https://[branch].[app-id].amplifyapp.com`

## Step 3: Test Database Connection

### Option A: Test from AWS Amplify Console

1. Go to **AWS Amplify Console** → **App Settings** → **Build Settings**
2. Add a test command in the build settings to verify connection:

```yaml
preBuild:
  commands:
    - npm ci
    - npx prisma generate
    - node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }); pool.query('SELECT NOW()').then(() => { console.log('✅ Database connection successful'); process.exit(0); }).catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });"
```

### Option B: Test from Local Machine

If you have access to the RDS endpoint, test the connection:

```bash
psql -h summitly-db-instance-1.cz6ky2oakyaf.ca-central-1.rds.amazonaws.com -U postgres -d summitly
```

## Step 4: Check RDS Security Group

1. Go to **AWS RDS Console**
2. Find your database instance: `summitly-db-instance-1`
3. Click on **"Connectivity & security"** tab
4. Check **"VPC security groups"**
5. Ensure the security group allows inbound connections from:
   - AWS Amplify IP ranges (or 0.0.0.0/0 for testing - **NOT recommended for production**)
   - Port 5432 (PostgreSQL)

## Step 5: Check RDS Instance Status

1. Go to **AWS RDS Console**
2. Verify the instance status is **"Available"**
3. Check if there are any maintenance windows or issues

## Step 6: Common Issues and Solutions

### Issue 1: DATABASE_URL Not Set
**Symptom**: All API routes return 500, logs show "DATABASE_URL is not defined"

**Solution**: 
- Add `DATABASE_URL` to AWS Amplify environment variables
- Redeploy the app

### Issue 2: Database Connection Timeout
**Symptom**: Logs show connection timeout errors

**Solutions**:
- Check RDS security group allows connections from Amplify
- Verify RDS instance is running
- Check if RDS is in a VPC that Amplify can access
- Consider using RDS Proxy for better connection management

### Issue 3: SSL Connection Error
**Symptom**: Logs show SSL/TLS errors

**Solution**: 
- Ensure `?sslmode=require` is in DATABASE_URL
- The code already sets `ssl: { rejectUnauthorized: false }` which should work

### Issue 4: Prisma Client Not Generated
**Symptom**: Logs show "PrismaClient is not generated" or similar

**Solution**:
- Ensure `npx prisma generate` runs in the build process
- Check that `prisma.config.ts` doesn't fail during build

## Step 7: View Real-Time Logs

To see what's actually happening:

1. Go to **AWS Amplify Console** → **App Settings** → **Logs**
2. Click on **"View logs"** for the latest deployment
3. Look for:
   - Database connection attempts
   - Prisma errors
   - API route errors

## Step 8: Enable Debug Logging

The code already includes console.log statements. Check the Amplify logs for:
- `[API] Database connection:` - Shows if DATABASE_URL is detected
- `[API] Database connection: ✅ Connected` - Shows successful connection
- `[API] Database connection: ❌ Failed` - Shows connection failure

## Quick Fix Checklist

- [ ] DATABASE_URL is set in AWS Amplify environment variables
- [ ] DATABASE_URL includes `?sslmode=require`
- [ ] Password in DATABASE_URL is URL-encoded
- [ ] RDS security group allows connections from Amplify
- [ ] RDS instance status is "Available"
- [ ] S3 environment variables are updated (S3_* not AWS_*)
- [ ] NEXTAUTH_URL matches your Amplify app URL
- [ ] Build completed successfully (check build logs)
- [ ] App is deployed and running

## Next Steps

1. **Check the logs first** - This will tell you exactly what's failing
2. **Verify environment variables** - Make sure DATABASE_URL is set correctly
3. **Test database connection** - Use the test command above
4. **Check RDS security** - Ensure Amplify can reach RDS
5. **Redeploy** - After fixing issues, trigger a new deployment

## Getting Help

If issues persist, provide:
1. Screenshot of AWS Amplify environment variables (mask sensitive data)
2. Relevant log excerpts from Amplify logs
3. RDS security group configuration
4. Any error messages from the browser console (already provided)
