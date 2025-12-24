# Fix S3 Public Access Permissions

## 🔴 Problem

Images exist in S3 but return **HTTP 403 Forbidden** when accessed. Your S3 bucket has **ACLs disabled**, so we need to use a **Bucket Policy** to make images publicly accessible.

## ✅ Solution: Set Bucket Policy

Since ACLs are disabled on your bucket, you **MUST** use a bucket policy.

### Step 1: Go to AWS S3 Console

1. Navigate to: https://console.aws.amazon.com/s3/
2. Click on your bucket: `summitly-storage`
3. Click the **"Permissions"** tab

### Step 2: Check Block Public Access Settings

1. Scroll to **"Block public access (bucket settings)"**
2. Click **"Edit"**
3. **Uncheck** the option: **"Block public access to buckets and objects granted through new access control lists (ACLs)"**
   - You can leave the other 3 checked (they're for ACLs which you're not using)
4. Click **"Save changes"**
5. Type `confirm` and click **"Confirm"**

### Step 3: Add Bucket Policy (CRITICAL)

1. Scroll to **"Bucket policy"**
2. Click **"Edit"**
3. Paste this policy (replace `summitly-storage` with your actual bucket name if different):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::summitly-storage/*"
    }
  ]
}
```

4. Click **"Save changes"**

### Step 4: Verify

Test an image URL:

```bash
curl -I https://shared-s3.property.ca/public/images/pre-con/projects/1764602295200-9nxpp7q1kyi.jpg
```

Should return `HTTP 200 OK` instead of `HTTP 403 Forbidden`.

## 🔍 What This Does

The bucket policy allows **anyone** (`Principal: "*"`) to **read** (`Action: "s3:GetObject"`) **all objects** (`Resource: "arn:aws:s3:::summitly-storage/*"`) in your bucket.

This is safe because:
- ✅ Only allows **reading** (GET), not writing or deleting
- ✅ Only affects objects in this bucket
- ✅ Standard practice for public image hosting

## 🛡️ Security Note

This makes your images publicly accessible, which is what you want for a property listing website. Users can view images but **cannot**:
- Modify images
- Delete images
- Upload new images
- Access other AWS resources

## 📝 Future Uploads

The `uploadToS3` function in `src/lib/s3.ts` has been updated to work with bucket policies (ACL is no longer set since it's disabled). All new uploads will automatically be accessible via the bucket policy.

## 🐛 Troubleshooting

### Still getting 403 after adding bucket policy?

1. **Wait a few seconds** - Policy changes can take a moment to propagate

2. **Check CloudFront** (if using custom domain `shared-s3.property.ca`)
   - If using CloudFront, you may need to invalidate the cache
   - Or wait for the cache TTL to expire

3. **Verify the bucket name** in the policy matches exactly

4. **Check CORS** (if accessing from browser)
   - S3 bucket → Permissions → CORS
   - Add CORS policy if needed:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": [],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

5. **Verify custom domain configuration**
   - If using `shared-s3.property.ca`, ensure DNS points to S3 or CloudFront
   - Check SSL certificate is valid

## ✅ After Fixing

Once the bucket policy is set:
- ✅ All existing images will be publicly accessible
- ✅ All new uploads will be publicly accessible
- ✅ Images will load in your web application
- ✅ No need to modify individual object permissions
