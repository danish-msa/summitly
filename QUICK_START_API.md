# Quick Start: Using Your API

This is a quick reference guide for using your new API structure.

## 🎯 What's Been Set Up

✅ **API Versioning**: All endpoints under `/api/v1/`  
✅ **Standardized Responses**: Consistent format across all endpoints  
✅ **CORS Support**: Ready for mobile apps  
✅ **Error Handling**: Proper error responses  
✅ **Configuration**: Easy to switch between local and external API  

---

## 📍 Current API Endpoints

### Available v1 Endpoints

- `GET /api/v1/pre-con-projects` - List pre-construction projects
  - Query params: `city`, `status`, `propertyType`, `page`, `limit`, etc.

### More endpoints coming...
- `/api/v1/pre-con-projects/[mlsNumber]` - Single project
- `/api/v1/properties` - List properties
- `/api/v1/market-trends/[locationType]/[locationName]` - Market trends
- `/api/v1/users/me` - Current user
- And more...

---

## 💻 Using the API

### Option 1: Using the API Client (Recommended)

```typescript
import { api } from '@/lib/api/client'

// GET request
const response = await api.get('/pre-con-projects', {
  params: {
    city: 'Toronto',
    page: 1,
    limit: 20,
    featured: true,
  }
})

console.log(response.data.projects)
console.log(response.meta.pagination)

// POST request
try {
  const response = await api.post('/properties/save', {
    mlsNumber: '12345',
    notes: 'Great property',
  })
  console.log('Saved!', response.data)
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Error:', error.code, error.message)
  }
}
```

### Option 2: Direct Fetch

```typescript
import { getApiUrl } from '@/lib/api/config'

// GET request
const response = await fetch(
  getApiUrl('/v1/pre-con-projects?city=Toronto&page=1')
)
const data = await response.json()

if (data.success) {
  console.log(data.data.projects)
} else {
  console.error(data.error)
}
```

### Option 3: React Query (Recommended for React)

```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

function usePreConProjects(filters: { city?: string; page?: number }) {
  return useQuery({
    queryKey: ['pre-con-projects', filters],
    queryFn: async () => {
      const response = await api.get('/pre-con-projects', {
        params: filters,
      })
      return response.data
    },
  })
}

// Usage in component
function ProjectsList() {
  const { data, isLoading, error } = usePreConProjects({ city: 'Toronto' })
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {data?.projects.map(project => (
        <div key={project.id}>{project.projectName}</div>
      ))}
    </div>
  )
}
```

---

## 🌐 Configuration

### For Website (Same Deployment)

**Default behavior** - API calls use same origin (relative URLs):
```typescript
// Automatically uses: /api/v1/pre-con-projects
const response = await api.get('/pre-con-projects')
```

### For Website (External API)

Set environment variable:
```env
# .env.local or production
NEXT_PUBLIC_API_URL=https://your-project.vercel.app
```

Now all API calls go to external API:
```typescript
// Automatically uses: https://your-project.vercel.app/api/v1/pre-con-projects
const response = await api.get('/pre-con-projects')
```

### For Mobile App

```typescript
// In your mobile app (React Native, Flutter, etc.)
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

## 📦 Response Format

All v1 endpoints return this format:

```typescript
{
  success: boolean
  data?: {
    // Your actual data here
    projects: [...]
  }
  error?: {
    code: string        // e.g., "NOT_FOUND", "UNAUTHORIZED"
    message: string     // Human-readable message
    details?: unknown   // Additional error details (dev only)
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
    version: string     // Always "v1"
  }
}
```

### Success Example

```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "123",
        "mlsNumber": "MLS001",
        "projectName": "Luxury Condos",
        "city": "Toronto",
        ...
      }
    ]
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

### Error Example

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

## 🔐 Authentication

### For Website (NextAuth)

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In API route
const session = await getServerSession(authOptions)
if (!session) {
  return ApiErrors.UNAUTHORIZED()
}
```

### For Mobile App (JWT)

```typescript
// In mobile app
const token = await getAuthToken() // Your auth logic

const response = await fetch(`${API_BASE_URL}/api/v1/users/me`, {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
```

---

## 🚀 Next Steps

1. **Deploy API** - Follow `API_DEPLOYMENT_GUIDE.md`
2. **Add More Endpoints** - Migrate existing routes to `/api/v1/`
3. **Update Frontend** - Use `api` client instead of direct fetch
4. **Test** - Test all endpoints from website and mobile app
5. **Add Authentication** - Implement JWT for mobile app

---

## 📚 Files Created

- `src/lib/api/response.ts` - Response utilities
- `src/lib/api/config.ts` - API configuration
- `src/lib/api/cors.ts` - CORS middleware
- `src/lib/api/middleware.ts` - Common middleware
- `src/lib/api/client.ts` - Frontend API client
- `src/app/api/v1/` - Versioned API routes
- `API_DEPLOYMENT_GUIDE.md` - Full deployment guide

---

## ❓ Common Questions

**Q: Do I need to migrate all routes to v1?**  
A: No, you can gradually migrate. Old routes still work.

**Q: Can I use both old and new routes?**  
A: Yes! Old `/api/` routes still work. New ones are in `/api/v1/`.

**Q: How do I add a new endpoint?**  
A: Create it in `src/app/api/v1/your-endpoint/route.ts` using the standardized format.

**Q: What about authentication?**  
A: Website uses NextAuth (already set up). Mobile app will need JWT tokens (to be implemented).

---

**Ready to deploy?** Check out `API_DEPLOYMENT_GUIDE.md`! 🚀

