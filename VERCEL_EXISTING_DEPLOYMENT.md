# Deploying API on Existing Vercel Project

Since you already have your project deployed on Vercel, here are your options:

---

## ✅ Option 1: API Already Deployed (Recommended)

**Good news!** Your API routes are **already deployed** with your website!

### How It Works

When you deploy a Next.js app to Vercel:
- ✅ All API routes in `src/app/api/` are automatically deployed
- ✅ Your `/api/v1/` routes are already live
- ✅ They're accessible at: `https://your-project.vercel.app/api/v1/...`

### Test It Now

```bash
# Replace with your actual Vercel URL
curl https://your-project.vercel.app/api/v1/health
curl https://your-project.vercel.app/api/v1/pre-con-projects
```

### Using the API

**From your website (same domain):**
```typescript
// Uses relative URLs - already works!
import { api } from '@/lib/api/client'
const { data } = await api.get('/pre-con-projects')
```

**From mobile app:**
```typescript
const API_BASE_URL = 'https://your-project.vercel.app'
const response = await fetch(`${API_BASE_URL}/api/v1/pre-con-projects`)
```

### What You Need to Do

1. **Push your latest code** (if you haven't already):
   ```bash
   git add .
   git commit -m "Add API v1 structure"
   git push
   ```
   Vercel will auto-deploy!

2. **Verify environment variables** are set in Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Ensure all required vars are set (DATABASE_URL, NEXTAUTH_SECRET, etc.)

3. **Test the endpoints** (see above)

**That's it! Your API is already live!** 🎉

---

## 🔄 Option 2: Deploy API Separately (If Needed)

Only do this if you want:
- Separate domain for API (e.g., `api.yourdomain.com`)
- Different scaling/configuration
- Separate monitoring

### Steps

1. **Create a new Vercel project:**
   - Vercel Dashboard → "Add New..." → "Project"
   - Import the **same GitHub repository**
   - Name it differently (e.g., `summitly-api`)

2. **Configure as API-only:**
   - Same build settings
   - Same environment variables
   - Optional: Set custom domain

3. **Update your website** to use external API:
   ```env
   # .env.production in your main project
   NEXT_PUBLIC_API_URL=https://summitly-api.vercel.app
   ```

4. **Update mobile app** to use the new API URL

### When to Use This

- ✅ You want `api.yourdomain.com` separate from `www.yourdomain.com`
- ✅ You need different scaling for API vs frontend
- ✅ You want separate monitoring/analytics

**Most people don't need this** - Option 1 is simpler and works great!

---

## 🎯 Recommended Approach

### For Most Cases: Use Option 1

**Why:**
- ✅ Already deployed - no extra work
- ✅ Same domain - simpler CORS
- ✅ One deployment to manage
- ✅ Lower cost (one project)

**Your API is at:**
- `https://your-project.vercel.app/api/v1/...`

### For Special Cases: Use Option 2

Only if you specifically need:
- Separate domains
- Different scaling
- Separate teams managing API vs frontend

---

## 📝 Action Items

### If Using Option 1 (Recommended):

1. ✅ **Verify your code is pushed:**
   ```bash
   git status
   git push  # If you have new changes
   ```

2. ✅ **Check Vercel deployment:**
   - Go to Vercel Dashboard
   - Check latest deployment is successful
   - View deployment logs if needed

3. ✅ **Test your API:**
   ```bash
   curl https://your-project.vercel.app/api/v1/health
   ```

4. ✅ **Update mobile app** (when ready):
   ```typescript
   const API_BASE_URL = 'https://your-project.vercel.app'
   ```

### If Using Option 2 (Separate Deployment):

1. Create new Vercel project from same repo
2. Configure environment variables
3. Deploy
4. Update `NEXT_PUBLIC_API_URL` in main project
5. Update mobile app to use new URL

---

## 🔍 How to Check Your Current Setup

### Check if API is Already Working

1. **Go to your Vercel project**
2. **Click on a deployment**
3. **Check "Functions" tab** - you should see your API routes listed
4. **Or test directly:**
   ```bash
   curl https://your-project.vercel.app/api/v1/health
   ```

### Check Environment Variables

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - All other required vars

---

## 🚨 Troubleshooting

### API Returns 404

**Problem:** API endpoint not found

**Solution:**
1. Check if code is pushed to GitHub
2. Check Vercel deployment logs
3. Verify route exists: `src/app/api/v1/health/route.ts`
4. Redeploy if needed

### API Returns 500

**Problem:** Server error

**Solution:**
1. Check Vercel function logs
2. Verify environment variables are set
3. Check database connection
4. Review error logs in Vercel dashboard

### CORS Issues

**Problem:** Mobile app can't access API

**Solution:**
1. Check `src/lib/api/cors.ts` - add your mobile app origin
2. Verify CORS headers are being sent
3. Test with curl (see testing section)

---

## ✅ Summary

**Most Likely:** Your API is already deployed! Just:
1. Push latest code (if needed)
2. Test endpoints
3. Use the same Vercel URL for mobile app

**If you need separate deployment:**
- Create new Vercel project from same repo
- Configure separately
- Update website/mobile app to use new URL

---

**Quick Test:**
```bash
# Replace with your actual Vercel URL
curl https://your-project.vercel.app/api/v1/health
```

If this works, you're all set! 🎉

