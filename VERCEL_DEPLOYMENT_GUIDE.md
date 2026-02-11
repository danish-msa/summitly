# Vercel Deployment Guide - Complete Setup

This guide walks you through deploying your Next.js API to Vercel for use by both your website and mobile app.

## 🎯 Why Vercel?

✅ **Made by Next.js creators** - Best Next.js support  
✅ **Automatic HTTPS** - SSL certificates included  
✅ **Free tier** - Great for starting out  
✅ **GitHub integration** - Auto-deploy on push  
✅ **Edge network** - Fast global CDN  
⚠️ **Function timeout limits** - 10s (Hobby), 60s (Pro) - Important for long-running operations

---

## 📋 Prerequisites

- GitHub account (recommended) or GitLab/Bitbucket
- Vercel account (free at https://vercel.com)
- Your code pushed to a Git repository

---

## 🚀 Deployment Steps

### Method 1: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Connect Your Repository

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign up or log in (you can use GitHub to sign in)

2. **Import Your Project**
   - Click **"Add New..."** → **"Project"**
   - Connect your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your `summitly` repository
   - Click **"Import"**

#### Step 2: Configure Project Settings

Vercel will auto-detect Next.js, but verify these settings:

**Framework Preset:** `Next.js` (auto-detected)

**Root Directory:** `.` (leave as default, or set if your Next.js app is in a subfolder)

**Build Command:** (auto-detected, but verify)
```bash
npm run build
```

**Note:** Vercel will automatically run `prisma generate` if it detects Prisma, but you may need to configure it explicitly.

**Output Directory:** `.next` (auto-detected)

#### Step 3: Configure Build Settings

In the project settings, you may need to add a build command that includes Prisma:

**Option A: Update package.json** (Recommended)
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

**Option B: Custom Build Command in Vercel**
- Go to Project Settings → General
- Under "Build & Development Settings"
- Override build command: `npm install && npx prisma generate && npm run build`

#### Step 4: Set Environment Variables

1. **Go to Project Settings** → **Environment Variables**

2. **Add all required variables:**

```env
# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/db?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-project.vercel.app

# Site URL
NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app

# Optional: If deploying API separately from frontend
NEXT_PUBLIC_API_URL=https://your-api-project.vercel.app

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ca-central-1
AWS_S3_BUCKET=summitly-storage

# External APIs
NEXT_PUBLIC_REPLIERS_API_KEY=your-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key

# Node Environment
NODE_ENV=production
```

3. **Set for all environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development (optional)

4. **Click "Save"**

#### Step 5: Deploy

1. **Click "Deploy"** button
2. Vercel will:
   - Install dependencies
   - Run Prisma generate
   - Build your Next.js app
   - Deploy to production

3. **Wait for deployment** (usually 2-5 minutes)

4. **Get your URL:**
   - Production: `https://your-project.vercel.app`
   - Your API: `https://your-project.vercel.app/api/v1/...`

---

### Method 2: Deploy via Vercel CLI

#### Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

#### Step 2: Login

```bash
vercel login
```

#### Step 3: Deploy

```bash
# From your project root
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account/team
- **Link to existing project?** → No (first time) or Yes (if updating)
- **Project name?** → `summitly-api` (or your choice)
- **Directory?** → `./` (current directory)
- **Override settings?** → No (unless you need custom settings)

#### Step 4: Deploy to Production

```bash
vercel --prod
```

#### Step 5: Set Environment Variables

```bash
# Set individual variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
# ... repeat for each variable

# Or use .env file (recommended)
vercel env pull .env.local  # Pull existing vars
# Edit .env.local
vercel env push .env.local   # Push all vars
```

---

## ⚙️ Vercel-Specific Configuration

### Create `vercel.json` (Optional)

Create this file in your project root for advanced configuration:

```json
{
  "buildCommand": "npm install && npx prisma generate && npm run build",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

**Note:** CORS headers in `vercel.json` are optional since we handle CORS in our middleware.

### Update package.json for Vercel

Ensure your `package.json` has:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

This ensures Prisma client is generated during Vercel's build process.

---

## 🔧 Important Vercel Considerations

### 1. Function Timeout Limits

**Hobby Plan (Free):**
- 10 seconds per API route execution
- Good for most API calls
- May timeout on complex database queries

**Pro Plan ($20/month):**
- 60 seconds per API route execution
- Better for long-running operations
- Recommended for production

**If you hit timeouts:**
- Optimize database queries
- Add pagination
- Use background jobs for long operations
- Consider upgrading to Pro plan

### 2. Database Connections

Vercel uses serverless functions, so:
- Each request may use a new connection
- Use connection pooling (you're already using Prisma with pg adapter ✅)
- Consider Vercel Postgres (if you want to migrate from RDS)

### 3. Cold Starts

- First request after inactivity may be slower (1-2 seconds)
- Subsequent requests are fast
- Not a big issue for most use cases

### 4. Environment Variables

- Set in Vercel dashboard → Project Settings → Environment Variables
- Can be different for Production, Preview, and Development
- Secrets are encrypted

---

## 📱 Using Your Deployed API

### From Your Website

**Option A: Same deployment (default)**
```typescript
// Uses relative URLs - same origin
import { api } from '@/lib/api/client'
const { data } = await api.get('/pre-con-projects')
```

**Option B: External API (if deployed separately)**
```env
# .env.production
NEXT_PUBLIC_API_URL=https://your-api-project.vercel.app
```

### From Mobile App

```typescript
const API_BASE_URL = 'https://your-project.vercel.app'

const response = await fetch(`${API_BASE_URL}/api/v1/pre-con-projects`, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`, // If using auth
  },
})

const data = await response.json()
if (data.success) {
  console.log(data.data.projects)
}
```

---

## 🧪 Testing Your Deployment

### 1. Test Health Endpoint

```bash
curl https://your-project.vercel.app/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "production"
  }
}
```

### 2. Test API Endpoint

```bash
curl https://your-project.vercel.app/api/v1/pre-con-projects?city=Toronto&page=1&limit=10
```

### 3. Test CORS

```bash
curl -H "Origin: https://your-mobile-app.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-project.vercel.app/api/v1/pre-con-projects
```

---

## 🔄 Auto-Deployment Setup

### GitHub Integration (Recommended)

1. **Connect GitHub** (if not already)
   - Vercel dashboard → Settings → Git
   - Connect your repository

2. **Auto-deploy on push:**
   - Every push to `main` branch → Production deployment
   - Every push to other branches → Preview deployment

3. **Preview deployments:**
   - Each PR gets its own preview URL
   - Great for testing before merging

### Custom Domain

1. **Go to Project Settings** → **Domains**
2. **Add your domain:**
   - Enter: `api.yourdomain.com`
   - Follow DNS setup instructions
3. **SSL is automatic** ✅

---

## 🚨 Troubleshooting

### Build Fails

**Problem:** Build fails with Prisma errors

**Solution:**
1. Ensure `postinstall` script runs Prisma generate:
   ```json
   "postinstall": "prisma generate"
   ```
2. Or add to build command in Vercel settings

**Problem:** Database connection fails

**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Check RDS security groups allow Vercel IPs
3. Ensure SSL is enabled (`?sslmode=require`)

### API Timeout

**Problem:** API routes timeout after 10 seconds

**Solution:**
1. Optimize database queries
2. Add pagination
3. Upgrade to Pro plan (60s timeout)
4. Consider background jobs for long operations

### CORS Issues

**Problem:** Mobile app gets CORS errors

**Solution:**
1. Check `src/lib/api/cors.ts` - add your mobile app origin
2. Verify CORS headers are being sent (check Network tab)
3. Test with curl (see Testing section above)

### Environment Variables Not Working

**Problem:** Variables not available in production

**Solution:**
1. Verify variables are set for "Production" environment
2. Redeploy after adding variables
3. Check variable names match exactly (case-sensitive)

---

## 📊 Monitoring

### Vercel Analytics

1. **Enable Analytics:**
   - Project Settings → Analytics
   - Enable Web Analytics (free)
   - Enable Speed Insights (free)

### Logs

1. **View logs:**
   - Vercel dashboard → Your project → Deployments
   - Click on a deployment → "Functions" tab
   - See real-time logs

### Error Tracking

Consider adding:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Vercel Analytics** - Built-in analytics

---

## 💰 Pricing

### Hobby Plan (Free)
- ✅ Unlimited deployments
- ✅ 100GB bandwidth/month
- ✅ 10s function execution
- ✅ Automatic HTTPS
- ✅ Preview deployments

### Pro Plan ($20/month)
- ✅ Everything in Hobby
- ✅ 60s function execution
- ✅ Team collaboration
- ✅ Advanced analytics
- ✅ Priority support

**For API deployment, Pro plan is recommended** if you have long-running operations.

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub/GitLab
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Build command configured (with Prisma)
- [ ] Environment variables set
- [ ] Deployed successfully
- [ ] Health endpoint tested
- [ ] API endpoint tested
- [ ] CORS tested (if using mobile app)
- [ ] Custom domain configured (optional)
- [ ] Monitoring set up (optional)

---

## 🎉 You're Done!

Your API is now deployed on Vercel and accessible at:
- `https://your-project.vercel.app/api/v1/...`

**Next steps:**
1. Test all endpoints
2. Update mobile app to use API URL
3. Monitor performance and errors
4. Set up custom domain (optional)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Function Configuration](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)

---

**Need help?** Check Vercel's documentation or their support chat! 🚀

