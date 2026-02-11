# API v1 Endpoints Documentation

This document provides a comprehensive overview of all available `/api/v1/` endpoints.

## Base URL

All endpoints are prefixed with `/api/v1/`

## Response Format

All endpoints follow a standardized response format:

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
    version: "v1"
  }
}
```

## Authentication

Most endpoints require authentication via NextAuth session. Include session cookies in requests or use Bearer token authentication.

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "SUBSCRIBER",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### Login
**POST** `/api/v1/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SUBSCRIBER"
    },
    "message": "Login successful. Use NextAuth session for authentication."
  }
}
```

### Get Current User
**GET** `/api/v1/auth/me`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "SUBSCRIBER",
      "image": "https://...",
      "emailVerified": "2024-01-15T10:30:00.000Z",
      "agentProfile": null // or agent profile if exists
    }
  }
}
```

---

## 👤 User Endpoints

### Get/Update User Profile
**GET** `/api/v1/users/me` - Get user profile
**PATCH** `/api/v1/users/me` - Update user profile

**Update Request Body:**
```json
{
  "name": "John Updated",
  "phone": "+1234567890",
  "image": "https://example.com/avatar.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Updated",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "SUBSCRIBER",
      "image": "https://example.com/avatar.jpg",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

## 🔍 Saved Searches Endpoints

### List Saved Searches
**GET** `/api/v1/saved-searches?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "searches": [
      {
        "id": "search_id",
        "userId": "user_id",
        "query": "Toronto condos",
        "location": "Toronto",
        "minPrice": 500000,
        "maxPrice": 1000000,
        "bedrooms": 2,
        "bathrooms": 2,
        "propertyType": "CONDO",
        "searchedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

### Create Saved Search
**POST** `/api/v1/saved-searches`

**Request Body:**
```json
{
  "query": "Toronto condos",
  "location": "Toronto",
  "minPrice": 500000,
  "maxPrice": 1000000,
  "bedrooms": 2,
  "bathrooms": 2,
  "propertyType": "CONDO"
}
```

### Get Saved Search
**GET** `/api/v1/saved-searches/[id]`

### Delete Saved Search
**DELETE** `/api/v1/saved-searches/[id]`

---

## 💾 Saved Properties Endpoints

### List Saved Properties
**GET** `/api/v1/saved-properties?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "savedProperties": [
      {
        "id": "saved_id",
        "userId": "user_id",
        "mlsNumber": "MLS123456",
        "notes": "Great property!",
        "tags": ["favorite", "viewed"],
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

### Save Property
**POST** `/api/v1/saved-properties`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "notes": "Great property!",
  "tags": ["favorite", "viewed"]
}
```

### Get Saved Property
**GET** `/api/v1/saved-properties/[mlsNumber]`

### Update Saved Property
**PATCH** `/api/v1/saved-properties/[mlsNumber]`

**Request Body:**
```json
{
  "notes": "Updated notes",
  "tags": ["favorite", "viewed", "potential"]
}
```

### Delete Saved Property
**DELETE** `/api/v1/saved-properties/[mlsNumber]`

---

## 🔔 Watchlists Endpoints

### List Watchlists
**GET** `/api/v1/watchlists?page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "watchlists": [
      {
        "id": "watchlist_id",
        "userId": "user_id",
        "mlsNumber": "MLS123456",
        "cityName": "Toronto",
        "neighborhood": "Downtown",
        "propertyType": "CONDO",
        "watchProperty": true,
        "newProperties": true,
        "soldListings": false,
        "expiredListings": false,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Create Watchlist
**POST** `/api/v1/watchlists`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "cityName": "Toronto",
  "neighborhood": "Downtown",
  "propertyType": "CONDO",
  "watchProperty": true,
  "newProperties": true,
  "soldListings": false,
  "expiredListings": false
}
```

### Get Watchlist
**GET** `/api/v1/watchlists/[id]`

### Update Watchlist
**PATCH** `/api/v1/watchlists/[id]`

**Request Body:**
```json
{
  "watchProperty": false,
  "newProperties": true,
  "soldListings": true
}
```

### Delete Watchlist
**DELETE** `/api/v1/watchlists/[id]`

---

## 🏠 Tours Endpoints

### List Tours
**GET** `/api/v1/tours?page=1&limit=20&status=PENDING`

**Response:**
```json
{
  "success": true,
  "data": {
    "tours": [
      {
        "id": "tour_id",
        "userId": "user_id",
        "mlsNumber": "MLS123456",
        "tourType": "IN_PERSON",
        "scheduledDate": "2024-02-15T14:00:00.000Z",
        "name": "John Doe",
        "phone": "+1234567890",
        "email": "john@example.com",
        "preApproval": true,
        "status": "PENDING",
        "notes": "Interested in viewing",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Schedule Tour
**POST** `/api/v1/tours`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "tourType": "IN_PERSON",
  "scheduledDate": "2024-02-15T14:00:00.000Z",
  "name": "John Doe",
  "phone": "+1234567890",
  "email": "john@example.com",
  "preApproval": true,
  "notes": "Interested in viewing"
}
```

### Get Tour
**GET** `/api/v1/tours/[id]`

### Update Tour
**PATCH** `/api/v1/tours/[id]`

**Request Body:**
```json
{
  "scheduledDate": "2024-02-20T14:00:00.000Z",
  "status": "CONFIRMED",
  "notes": "Updated notes"
}
```

### Cancel Tour
**DELETE** `/api/v1/tours/[id]`

---

## 📊 Comparables Endpoints

### List Comparables
**GET** `/api/v1/comparables?basePropertyMlsNumber=MLS123456&page=1&limit=20`

**Response:**
```json
{
  "success": true,
  "data": {
    "comparables": [
      {
        "id": "comparable_id",
        "userId": "user_id",
        "basePropertyMlsNumber": "MLS123456",
        "mlsNumber": "MLS789012",
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Save Comparable
**POST** `/api/v1/comparables`

**Request Body:**
```json
{
  "basePropertyMlsNumber": "MLS123456",
  "mlsNumber": "MLS789012"
}
```

### Get Comparable
**GET** `/api/v1/comparables/[baseMlsNumber]/[mlsNumber]`

### Delete Comparable
**DELETE** `/api/v1/comparables/[baseMlsNumber]/[mlsNumber]`

---

## 🏗️ Pre-Construction Projects Endpoints

### List Pre-Con Projects
**GET** `/api/v1/pre-con-projects?city=Toronto&status=selling&page=1&limit=20`

**Query Parameters:**
- `city` - Filter by city
- `status` - Filter by status (selling, coming-soon, sold-out)
- `propertyType` - Filter by property type
- `subPropertyType` - Filter by sub property type
- `completionYear` - Filter by completion year
- `developer` - Filter by developer
- `featured` - Filter featured projects (true/false)
- `bedrooms` - Filter by bedrooms
- `bathrooms` - Filter by bathrooms
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `minSqft` - Minimum square feet
- `maxSqft` - Maximum square feet
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "project_id",
        "mlsNumber": "MLS123456",
        "projectName": "Luxury Condos",
        "developer": "Developer Name",
        "location": {
          "address": "123 Main St",
          "city": "Toronto",
          "state": "ON",
          "neighborhood": "Downtown"
        },
        "pricing": {
          "starting": 500000,
          "ending": 1000000,
          "range": {
            "min": 500000,
            "max": 1000000
          }
        },
        "status": "selling",
        "completion": {
          "date": "2025-12-31",
          "progress": 50
        },
        "details": {
          "propertyType": "Condo",
          "bedroomRange": "1-3",
          "bathroomRange": "1-2",
          "sqftRange": "500-1200",
          "totalUnits": 100,
          "availableUnits": 25
        },
        "images": ["https://..."],
        "featured": true
      }
    ]
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## ❤️ Health Check

### Health Check
**GET** `/api/v1/health`

**Response:**
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

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `BAD_REQUEST` (400) - Invalid request
- `VALIDATION_ERROR` (400) - Validation failed
- `INTERNAL_ERROR` (500) - Server error
- `RATE_LIMIT` (429) - Too many requests

---

## CORS

All endpoints support CORS and can be accessed from mobile apps and external domains. CORS headers are automatically applied by the middleware.

---

## Rate Limiting

Rate limiting is implemented via middleware. Default limits:
- 100 requests per minute per IP address

---

## Notes

- All timestamps are in ISO 8601 format
- All endpoints require authentication unless specified otherwise
- Pagination defaults: page=1, limit=20
- All string IDs are CUIDs
- Property types follow the enum: HOUSE, APARTMENT, CONDO, TOWNHOUSE, VILLA, OFFICE, COMMERCIAL, LAND, OTHER
