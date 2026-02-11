# API Deployment Guide - Hybrid Approach

This guide explains how to deploy your Next.js API routes as a separate service that can be used by both your website and mobile app.

## 📋 Overview

**Architecture:**
```
┌─────────────────┐
│  Next.js Web    │ ──┐
│  (Frontend)     │   │
└─────────────────┘   │
                      │ HTTP/REST
                      │
┌─────────────────┐   │
│  API Service    │ ◄─┘
│  (Next.js API)  │
│                 │
│  Deployed on:   │
│  - Vercel       │ (Recommended)
│  - Render       │
│  - AWS Lambda   │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼────────┐
│  Mobile App     │
│  (iOS/Android)  │
└─────────────────┘
```

## 🎯 What We've Set Up

### 1. API Versioning (`/api/v1/`)
- All new API endpoints are under `/api/v1/`
- Standardized response format
- CORS support for mobile apps
- Error handling

### 2. API Utilities
- `src/lib/api/response.ts` - Standardized responses
- `src/lib/api/config.ts` - API base URL configuration
- `src/lib/api/cors.ts` - CORS middleware
- `src/lib/api/middleware.ts` - Common middleware

### 3. Configuration
- Environment variable support for external API URL
- Standalone build option for separate deployment

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

**Why Vercel:**
- ✅ Made by Next.js creators
- ✅ Excellent Next.js support
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ GitHub integration (auto-deploy on push)
- ✅ Edge network (fast global CDN)
- ⚠️ Function timeout limits (10s hobby, 60s pro)

#### Steps:

1. **Push your code to GitHub** (if not already):
```bash
git add .
git commit -m "Add API v1 structure"
git push
```

2. **Deploy via Vercel Dashboard**:
   - Go to https://vercel.com
   - Click **"Add New..."** → **"Project"**
   - Import your GitHub repository
   - Click **"Deploy"** (Vercel auto-detects Next.js)

3. **Or deploy via CLI**:
```bash
npm i -g vercel
vercel login
vercel --prod
```

4. **Set environment variables** in Vercel dashboard:
   - Project Settings → Environment Variables
   - Add all required variables (see Configuration section below)

5. **Your API URL**: `https://your-project.vercel.app/api/v1/...`

**Note**: For detailed Vercel setup, see `VERCEL_DEPLOYMENT_GUIDE.md`

---

### Option 2: Render

**Why Render:**
- ✅ Free tier
- ✅ Automatic deployments from GitHub
- ✅ Easy setup

#### Steps:

1. **Connect GitHub** to Render
2. **Create new Web Service**
3. **Configure**:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`
   - **Node Version**: `20.x`

4. **Set environment variables** (see Configuration section below)

5. **Deploy** - Render will auto-deploy on git push

---

### Option 3: AWS Lambda (Serverless)

**Why AWS Lambda:**
- ✅ Pay per use
- ✅ Auto-scaling
- ⚠️ More complex setup
- ⚠️ Cold starts

#### Steps:

1. **Install Serverless Framework**:
```bash
npm install -g serverless
npm install --save-dev serverless-nextjs-plugin
```

2. **Create `serverless.yml`**:
```yaml
service: summitly-api

provider:
  name: aws
  runtime: nodejs20.x
  region: ca-central-1
  environment:
    DATABASE_URL: ${env:DATABASE_URL}
    NEXTAUTH_SECRET: ${env:NEXTAUTH_SECRET}
    # ... other env vars

plugins:
  - serverless-nextjs-plugin

functions:
  api:
    handler: serverless-handler.handler
    events:
      - http:
          path: /api/{proxy+}
          method: ANY
          cors: true
```

3. **Deploy**:
```bash
serverless deploy
```

---

## 🔧 Configuration

### Environment Variables

Create `.env.production` or set in your deployment platform:

```env
# Database
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/db?sslmode=require

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=https://your-api-domain.com

# Site URL (for CORS and redirects)
NEXT_PUBLIC_SITE_URL=https://your-api-domain.com

# API URL (if different from site URL)
# Leave empty to use same origin
NEXT_PUBLIC_API_URL=https://your-api-domain.com
# For Vercel: https://your-project.vercel.app

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=ca-central-1
AWS_S3_BUCKET=summitly-storage

# External APIs
NEXT_PUBLIC_REPLIERS_API_KEY=your-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key
```

### CORS Configuration

Update `src/lib/api/cors.ts` to add your mobile app domains:

```typescript
const ALLOWED_ORIGINS = [
  'https://your-mobile-app.com',
  'capacitor://localhost', // For Capacitor apps
  // ... other origins
]
```

---

## 📱 Using the API

### From Your Website

**Option A: Same deployment (default)**
```typescript
// Uses relative URLs - same origin
const response = await fetch('/api/v1/pre-con-projects')
```

**Option B: External API**
```env
# Set in .env.local or production
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

```typescript
// Automatically uses external API
import { getApiUrl } from '@/lib/api/config'
const response = await fetch(getApiUrl('/v1/pre-con-projects'))
```

### From Mobile App

```typescript
// iOS/Android/React Native
const API_BASE_URL = 'https://your-project.vercel.app'

const response = await fetch(`${API_BASE_URL}/api/v1/pre-con-projects`, {
  headers: {
    'Content-Type': 'application/json',
    // Add auth token if needed
    'Authorization': `Bearer ${userToken}`,
  },
})

const data = await response.json()
// data = { success: true, data: { projects: [...] }, meta: {...} }
```

### API Response Format

All v1 endpoints return this format:

```typescript
{
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    version: string
  }
}
```

**Success Example:**
```json
{
  "success": true,
  "data": {
    "projects": [...]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

**Error Example:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

---

## 🔄 Migration Strategy

### Phase 1: Create v1 Routes (✅ Done)
- Created `/api/v1/` structure
- Standardized responses
- CORS support

### Phase 2: Deploy API Separately
1. Choose deployment platform (Vercel recommended)
2. Deploy your Next.js app as API service
3. Get API URL

### Phase 3: Update Website
1. Set `NEXT_PUBLIC_API_URL` in production
2. Update components to use `getApiUrl()` helper
3. Test all endpoints

### Phase 4: Mobile App Integration
1. Use API URL in mobile app
2. Implement authentication (JWT tokens)
3. Test all endpoints

### Phase 5: Gradual Migration
- Keep old `/api/` routes for backward compatibility
- Migrate endpoints one by one to `/api/v1/`
- Eventually deprecate old routes

---

## 🧪 Testing

### Test API Locally

```bash
# Start dev server
npm run dev

# Test v1 endpoint
curl http://localhost:3000/api/v1/pre-con-projects

# Test with CORS
curl -H "Origin: http://localhost:3001" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:3000/api/v1/pre-con-projects
```

### Test Deployed API

```bash
# Replace with your API URL
curl https://your-project.vercel.app/api/v1/pre-con-projects

# Test CORS
curl -H "Origin: https://your-mobile-app.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-project.vercel.app/api/v1/pre-con-projects
```

---

## 📊 Monitoring

### Recommended Tools

1. **Vercel**: Built-in logs and metrics
2. **Sentry**: Error tracking
3. **LogRocket**: API monitoring
4. **Postman**: API testing and documentation

### Health Check Endpoint

Create `/api/v1/health/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { successResponse } from '@/lib/api/response'
import { apiMiddleware } from '@/lib/api/middleware'

async function handler() {
  return successResponse({
    status: 'healthy',
    database: 'connected', // Add actual DB check
    timestamp: new Date().toISOString(),
  })
}

export async function GET(request: NextRequest) {
  return apiMiddleware(request, handler)
}
```

---

## 🚨 Troubleshooting

### CORS Issues

**Problem**: Mobile app gets CORS errors

**Solution**:
1. Check `src/lib/api/cors.ts` - add your mobile app origin
2. Verify API is returning CORS headers
3. Check browser console for specific error

### Database Connection

**Problem**: API can't connect to database

**Solution**:
1. Verify `DATABASE_URL` is set correctly
2. Check RDS security groups allow connections
3. Test connection locally first

### Build Failures

**Problem**: Deployment fails during build

**Solution**:
1. Run `npm run build` locally first
2. Check Prisma generate runs before build
3. Verify all environment variables are set

---

## 📝 Next Steps

1. ✅ **API structure created** - `/api/v1/` routes
2. ⏳ **Deploy to Vercel** - Follow VERCEL_DEPLOYMENT_GUIDE.md
3. ⏳ **Update website** - Use external API URL
4. ⏳ **Create mobile app** - Integrate API
5. ⏳ **Add authentication** - JWT tokens for mobile
6. ⏳ **Add more endpoints** - Migrate remaining routes to v1

---

## 🆘 Need Help?

- Check deployment platform docs
- Review Next.js deployment docs
- Test locally first
- Check logs in deployment platform

---

**Ready to deploy?** Choose a platform above and follow the steps! 🚀

