# Supabase Storage Setup Guide

## 🎯 Problem
Your image uploads are failing on Vercel because Vercel's filesystem is **read-only**. You need to use **Supabase Storage** instead of local file storage.

## ✅ Solution: Use Supabase Storage

### Step 1: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 2: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard/project/omsefyactufffyqaxowx
2. Click **Settings** (gear icon) → **API**
3. Copy these values:
   - **Project URL**: `https://omsefyactufffyqaxowx.supabase.co`
   - **Service Role Key** (under "Project API keys" → "service_role" key) - **Keep this secret!**

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://omsefyactufffyqaxowx.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**For Vercel Production:**
1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add both variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Create Storage Buckets in Supabase

1. Go to: https://supabase.com/dashboard/project/omsefyactufffyqaxowx/storage/buckets
2. Click **New bucket**
3. Create two buckets:

   **Bucket 1: `images`**
   - Name: `images`
   - Public: ✅ **Yes** (checked)
   - File size limit: 10 MB
   - Allowed MIME types: `image/jpeg, image/jpg, image/png, image/webp, image/gif`

   **Bucket 2: `documents`**
   - Name: `documents`
   - Public: ✅ **Yes** (checked)
   - File size limit: 20 MB
   - Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/plain, image/jpeg, image/jpg, image/png`

### Step 5: Set Up Storage Policies (Optional but Recommended)

For public buckets, you can set policies to allow public read access:

1. Go to **Storage** → **Policies**
2. For each bucket (`images` and `documents`), create a policy:
   - **Policy name**: `Public Read Access`
   - **Allowed operation**: `SELECT` (read)
   - **Policy definition**: 
     ```sql
     true
     ```
   - This allows anyone to read files from the bucket

### Step 6: Test the Upload

After setting up:
1. Deploy to Vercel (or test locally)
2. Try uploading an image in your admin dashboard
3. Check Supabase Storage → `images` bucket to see if the file appears
4. The image should now be accessible via the public URL

## 📝 What Changed

- ✅ **Image uploads** now go to Supabase Storage (`images` bucket)
- ✅ **Document uploads** now go to Supabase Storage (`documents` bucket)
- ✅ Files are accessible via public URLs
- ✅ Works on Vercel (no filesystem writes needed)

## 🔒 Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS)
- **Never expose this key** in client-side code
- Only use it in server-side API routes (which we're doing)
- The buckets are set to public for read access, but uploads still require admin authentication

## 🐛 Troubleshooting

### Error: "Bucket not found"
- Make sure you created the buckets in Supabase dashboard
- Check bucket names match exactly: `images` and `documents`

### Error: "Invalid API key"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Make sure you're using the **service_role** key, not the **anon** key

### Images not showing
- Check if the bucket is set to **Public**
- Verify the public URL is correct
- Check browser console for CORS errors

### Upload fails silently
- Check Vercel function logs
- Verify environment variables are set in Vercel dashboard
- Make sure the file size is within limits

