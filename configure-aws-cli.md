# Configure AWS CLI for S3 Upload

## Step 1: Get AWS Credentials

You need to create an IAM user with S3 access:

1. **Go to AWS IAM Console**
   - Visit: https://console.aws.amazon.com/iam/
   - Click **"Users"** → **"Create user"**

2. **Create User**
   - Username: `summitly-s3-uploader` (or your preferred name)
   - Click **"Next"**

3. **Set Permissions**
   - Select: **"Attach policies directly"**
   - Search and select: **`AmazonS3FullAccess`**
   - Click **"Next"** → **"Create user"**

4. **Create Access Key**
   - Click on the user you just created
   - Go to **"Security credentials"** tab
   - Click **"Create access key"**
   - Select: **"Application running outside AWS"**
   - Click **"Next"** → **"Create access key"**
   - **IMPORTANT**: Copy both:
     - **Access Key ID**
     - **Secret Access Key** (only shown once!)

## Step 2: Configure AWS CLI

Run this command (replace with your actual credentials):

```powershell
aws configure
```

**Enter the following when prompted:**

```
AWS Access Key ID: [YOUR_ACCESS_KEY_ID]
AWS Secret Access Key: [YOUR_SECRET_ACCESS_KEY]
Default region name: ca-central-1
Default output format: json
```

## Step 3: Verify Configuration

```powershell
aws s3 ls
```

This should list your S3 buckets (or show empty if you haven't created any yet).

## Step 4: Upload Files to S3

Once configured, upload your files:

```powershell
# Upload images
aws s3 sync ./supabase-storage-backup/images/images s3://summitly-storage/images --region ca-central-1

# Upload documents
aws s3 sync ./supabase-storage-backup/documents/documents s3://summitly-storage/documents --region ca-central-1
```

**Note**: The path includes `/images/images` because Supabase CLI creates a nested structure. Adjust if needed.

---

## Troubleshooting

**If `aws` command not found:**
- Restart PowerShell (or add to PATH permanently)
- Or use full path: `& "C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure`

**If access denied:**
- Check IAM user has `AmazonS3FullAccess` policy
- Verify bucket name is correct
- Check bucket region matches (ca-central-1)

