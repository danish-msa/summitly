# Vercel Deployment - Quick Start 🚀

## ✅ Your Setup is Already Ready!

Your `package.json` already has:
- ✅ `"build": "prisma generate && next build"` - Prisma will generate automatically
- ✅ `"postinstall": "prisma generate"` - Backup Prisma generation

**You're ready to deploy!**

---

## 🎯 Quick Deployment (5 Minutes)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### Step 2: Deploy on Vercel

**Option A: Via Dashboard (Easiest)**
1. Go to https://vercel.com
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Click **"Deploy"** (Vercel auto-detects Next.js)
5. Done! 🎉

**Option B: Via CLI**
```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 3: Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/db?sslmode=require
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=https://your-project.vercel.app
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ca-central-1
AWS_S3_BUCKET=summitly-storage
NEXT_PUBLIC_REPLIERS_API_KEY=your-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

**Important:** After adding variables, **redeploy** your project!

### Step 4: Test Your API

```bash
# Health check
curl https://your-project.vercel.app/api/v1/health

# Test endpoint
curl https://your-project.vercel.app/api/v1/pre-con-projects
```

---

## 📍 Your API URL

After deployment, your API will be at:
- `https://your-project.vercel.app/api/v1/...`

---

## ⚠️ Important Notes

### Function Timeout Limits
- **Free tier:** 10 seconds per API call
- **Pro plan ($20/mo):** 60 seconds per API call

If your API calls take longer than 10 seconds:
- Optimize database queries
- Add pagination
- Consider upgrading to Pro plan

### Database Connections
- Vercel uses serverless functions
- Your Prisma setup with connection pooling is perfect ✅
- No changes needed

---

## 🔄 Auto-Deploy

Once connected to GitHub:
- ✅ Every push to `main` → Production deploy
- ✅ Every push to other branches → Preview deploy
- ✅ Automatic HTTPS
- ✅ No configuration needed

---

## 📚 Full Guide

For detailed instructions, see: **`VERCEL_DEPLOYMENT_GUIDE.md`**

---

## ✅ Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Tested health endpoint
- [ ] Tested API endpoint

---

**That's it! You're ready to deploy!** 🎉

