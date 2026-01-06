# Testing Your API Endpoints on Vercel

Your API is now live! Here's how to test it.

## 🔍 Find Your API URL

Your Vercel deployment URL should be something like:
- `https://your-project.vercel.app`
- Or a custom domain if you've set one up

Your API endpoints are at:
- `https://your-project.vercel.app/api/v1/...`

---

## 🧪 Test Endpoints

### 1. Health Check Endpoint

**Endpoint:** `GET /api/v1/health`

**Test in Browser:**
```
https://your-project.vercel.app/api/v1/health
```

**Test with curl:**
```bash
curl https://your-project.vercel.app/api/v1/health
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "production"
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

---

### 2. Pre-Construction Projects Endpoint

**Endpoint:** `GET /api/v1/pre-con-projects`

**Test in Browser:**
```
https://your-project.vercel.app/api/v1/pre-con-projects
```

**With Query Parameters:**
```
https://your-project.vercel.app/api/v1/pre-con-projects?city=Toronto&page=1&limit=10
```

**Test with curl:**
```bash
# Basic request
curl https://your-project.vercel.app/api/v1/pre-con-projects

# With filters
curl "https://your-project.vercel.app/api/v1/pre-con-projects?city=Toronto&page=1&limit=10&featured=true"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "123",
        "mlsNumber": "MLS001",
        "projectName": "Luxury Condos",
        "developer": "ABC Developers",
        "location": {
          "city": "Toronto",
          "state": "ON",
          ...
        },
        "pricing": {
          "starting": 500000,
          "ending": 800000,
          ...
        },
        ...
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

---

## 🛠️ Testing Tools

### Option 1: Browser (Easiest)

1. Open your browser
2. Go to: `https://your-project.vercel.app/api/v1/health`
3. You should see JSON response

**Note:** For endpoints with query params, use the full URL in the address bar.

### Option 2: curl (Command Line)

**Windows PowerShell:**
```powershell
# Health check
curl https://your-project.vercel.app/api/v1/health

# Pre-con projects
curl "https://your-project.vercel.app/api/v1/pre-con-projects?city=Toronto&page=1&limit=5"
```

**Windows CMD:**
```cmd
curl https://your-project.vercel.app/api/v1/health
```

**Mac/Linux:**
```bash
curl https://your-project.vercel.app/api/v1/health
```

### Option 3: Postman (Recommended for Complex Testing)

1. **Download Postman:** https://www.postman.com/downloads/
2. **Create a new request:**
   - Method: `GET`
   - URL: `https://your-project.vercel.app/api/v1/health`
3. **Click "Send"**
4. **View response**

### Option 4: Browser DevTools (For Website Integration)

1. Open your website in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Run:
```javascript
fetch('/api/v1/health')
  .then(res => res.json())
  .then(data => console.log(data))
```

---

## 📋 Test Checklist

### Basic Tests

- [ ] **Health endpoint works**
  - URL: `/api/v1/health`
  - Should return `{ "success": true, "data": { "status": "healthy" } }`

- [ ] **Pre-con projects endpoint works**
  - URL: `/api/v1/pre-con-projects`
  - Should return projects array

- [ ] **Pagination works**
  - URL: `/api/v1/pre-con-projects?page=1&limit=5`
  - Should return 5 projects max

- [ ] **Filtering works**
  - URL: `/api/v1/pre-con-projects?city=Toronto`
  - Should return only Toronto projects

### Advanced Tests

- [ ] **CORS headers present**
  - Check response headers include `Access-Control-Allow-Origin`

- [ ] **Error handling works**
  - Try invalid endpoint: `/api/v1/invalid`
  - Should return proper error response

- [ ] **Response format is consistent**
  - All responses should have `success`, `data`/`error`, `meta` structure

---

## 🔍 Verify Response Format

All v1 endpoints should return this structure:

```typescript
{
  success: boolean
  data?: T              // Your actual data
  error?: {             // Only if error
    code: string
    message: string
    details?: unknown
  }
  meta: {
    pagination?: {      // If paginated
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string   // Always present
    version: string     // Always "v1"
  }
}
```

---

## 🐛 Troubleshooting

### Getting 404?

- **Check URL:** Make sure you're using `/api/v1/` not `/api/`
- **Check deployment:** Verify your latest code is deployed on Vercel
- **Check logs:** Vercel Dashboard → Your Project → Deployments → View logs

### Getting 500 Error?

- **Check database:** Verify `DATABASE_URL` is set in Vercel environment variables
- **Check logs:** View function logs in Vercel dashboard
- **Test locally first:** Run `npm run dev` and test locally

### Getting CORS Error?

- **Check origins:** Verify your mobile app domain is in `src/lib/api/cors.ts`
- **Check headers:** Response should include CORS headers

### No Data Returned?

- **Check database:** Verify database connection
- **Check filters:** Maybe no data matches your filters
- **Check published status:** Projects must have `isPublished: true`

---

## 📊 Quick Test Script

Save this as `test-api.js` and run with `node test-api.js`:

```javascript
const API_BASE = 'https://your-project.vercel.app';

async function testAPI() {
  console.log('Testing API endpoints...\n');

  // Test 1: Health check
  try {
    const health = await fetch(`${API_BASE}/api/v1/health`);
    const healthData = await health.json();
    console.log('✅ Health check:', healthData.data.status);
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }

  // Test 2: Pre-con projects
  try {
    const projects = await fetch(`${API_BASE}/api/v1/pre-con-projects?limit=5`);
    const projectsData = await projects.json();
    console.log('✅ Pre-con projects:', projectsData.data.projects.length, 'projects');
    console.log('   Pagination:', projectsData.meta.pagination);
  } catch (error) {
    console.log('❌ Pre-con projects failed:', error.message);
  }

  // Test 3: With filters
  try {
    const filtered = await fetch(`${API_BASE}/api/v1/pre-con-projects?city=Toronto&limit=3`);
    const filteredData = await filtered.json();
    console.log('✅ Filtered projects:', filteredData.data.projects.length, 'Toronto projects');
  } catch (error) {
    console.log('❌ Filtered projects failed:', error.message);
  }
}

testAPI();
```

**Run it:**
```bash
node test-api.js
```

---

## 🎯 Next Steps

1. ✅ **Test all endpoints** - Verify they work
2. ✅ **Check response format** - Ensure consistency
3. ✅ **Test from mobile app** - Use the API URL in your app
4. ✅ **Monitor performance** - Check Vercel analytics
5. ✅ **Add more endpoints** - Migrate other routes to v1

---

## 📝 Example: Testing from Your Website

In your React components, you can now use:

```typescript
import { api } from '@/lib/api/client'

// In your component
const { data, isLoading, error } = useQuery({
  queryKey: ['pre-con-projects'],
  queryFn: async () => {
    const response = await api.get('/pre-con-projects', {
      params: { city: 'Toronto', page: 1, limit: 10 }
    })
    return response.data
  },
})
```

---

**Ready to test?** Start with the health endpoint! 🚀

