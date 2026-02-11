# Complete API Endpoints Documentation

This document provides a comprehensive overview of **ALL** available API endpoints in the project, including both `/api/v1/` and legacy `/api/` endpoints.

## Table of Contents

- [API v1 Endpoints](#api-v1-endpoints)
- [Legacy API Endpoints](#legacy-api-endpoints)
- [Admin API Endpoints](#admin-api-endpoints)
- [NextAuth Endpoints](#nextauth-endpoints)
- [Response Formats](#response-formats)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## API v1 Endpoints

All `/api/v1/*` endpoints follow a standardized response format and use the `apiMiddleware` for CORS, authentication, and rate limiting.

### Base URL
All v1 endpoints are prefixed with `/api/v1/`

### Response Format
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

---

## 🔐 Authentication Endpoints (v1)

### Register User
**POST** `/api/v1/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
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
      "agentProfile": null
    }
  }
}
```

### Check Authentication Status
**GET** `/api/v1/auth/status`

**Description:** Check if the user is currently authenticated. This endpoint never returns an error - it always returns a status indicating whether the user is logged in or not.

**Response (Authenticated):**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SUBSCRIBER",
      "image": "https://..."
    }
  }
}
```

**Response (Not Authenticated):**
```json
{
  "success": true,
  "data": {
    "authenticated": false,
    "user": null
  }
}
```

**Note:** Unlike `/api/v1/auth/me`, this endpoint does not require authentication and will not return an error if the user is not logged in. Use this endpoint to check authentication status without triggering error responses.

---

## 👤 User Endpoints (v1)

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

## 🔍 Saved Searches Endpoints (v1)

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

## 💾 Saved Properties Endpoints (v1)

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

## 🔔 Watchlists Endpoints (v1)

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

## 🏠 Tours Endpoints (v1)

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

## 📊 Comparables Endpoints (v1)

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

## 🏗️ Pre-Construction Projects Endpoints (v1)

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

## ❤️ Health Check (v1)

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

## Legacy API Endpoints

These endpoints use the legacy `/api/` prefix and may have different response formats.

---

## 🔐 Authentication Endpoints (Legacy)

### Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## 🏠 Properties Endpoints (Legacy)

### Save Property
**POST** `/api/properties/save`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "notes": "Great property!",
  "tags": ["favorite", "viewed"]
}
```

**Response:**
```json
{
  "success": true,
  "savedProperty": {
    "id": "saved_id",
    "userId": "user_id",
    "mlsNumber": "MLS123456",
    "notes": "Great property!",
    "tags": ["favorite", "viewed"],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Saved Properties
**GET** `/api/properties/saved?mlsNumber=MLS123456`

**Query Parameters:**
- `mlsNumber` (optional) - Check if specific property is saved

**Response (with mlsNumber):**
```json
{
  "isSaved": true,
  "savedProperty": {
    "id": "saved_id",
    "userId": "user_id",
    "mlsNumber": "MLS123456",
    "notes": "Great property!",
    "tags": ["favorite", "viewed"]
  }
}
```

**Response (without mlsNumber - all saved):**
```json
{
  "savedProperties": [
    {
      "id": "saved_id",
      "userId": "user_id",
      "mlsNumber": "MLS123456",
      "notes": "Great property!",
      "tags": ["favorite", "viewed"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Unsave Property
**DELETE** `/api/properties/unsave?mlsNumber=MLS123456`

**Response:**
```json
{
  "success": true
}
```

### Get/Submit Property Ratings
**GET** `/api/properties/[propertyId]/ratings?propertyType=regular`

**Query Parameters:**
- `propertyType` - "regular" or "pre-construction" (default: "regular")

**Response:**
```json
{
  "average": 4.5,
  "total": 10,
  "userRating": 5,
  "ratings": [5, 4, 5, 4, 5, 4, 5, 4, 5, 4]
}
```

**POST** `/api/properties/[propertyId]/ratings`

**Request Body:**
```json
{
  "rating": 5,
  "propertyType": "regular"
}
```

**Response:**
```json
{
  "success": true,
  "rating": 5,
  "average": 4.6,
  "total": 11
}
```

---

## 📊 Comparables Endpoints (Legacy)

### Save Comparable
**POST** `/api/comparables/save`

**Request Body:**
```json
{
  "mlsNumber": "MLS789012",
  "basePropertyMlsNumber": "MLS123456"
}
```

**Response:**
```json
{
  "success": true,
  "savedComparable": {
    "id": "comparable_id",
    "userId": "user_id",
    "basePropertyMlsNumber": "MLS123456",
    "mlsNumber": "MLS789012",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get Saved Comparables
**GET** `/api/comparables/saved?basePropertyMlsNumber=MLS123456`

**Response:**
```json
{
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
```

### Unsave Comparable
**POST** `/api/comparables/unsave`

**Request Body:**
```json
{
  "mlsNumber": "MLS789012",
  "basePropertyMlsNumber": "MLS123456"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 🔔 Alerts/Watchlists Endpoints (Legacy)

### Get Alerts
**GET** `/api/alerts?mlsNumber=MLS123456&cityName=Toronto&neighborhood=Downtown`

**Query Parameters:**
- `mlsNumber` (optional)
- `cityName` (optional)
- `neighborhood` (optional)

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert_id",
      "userId": "user_id",
      "mlsNumber": "MLS123456",
      "cityName": "Toronto",
      "neighborhood": "Downtown",
      "propertyType": "CONDO",
      "watchProperty": true,
      "newProperties": true,
      "soldListings": false,
      "expiredListings": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Save Alert
**POST** `/api/alerts/save`

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

**Response:**
```json
{
  "alert": {
    "id": "alert_id",
    "userId": "user_id",
    "mlsNumber": "MLS123456",
    "cityName": "Toronto",
    "neighborhood": "Downtown",
    "propertyType": "CONDO",
    "watchProperty": true,
    "newProperties": true,
    "soldListings": false,
    "expiredListings": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Delete Alert
**POST** `/api/alerts/delete`

**Request Body:**
```json
{
  "id": "alert_id"
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 🏗️ Pre-Construction Projects Endpoints (Legacy)

### List Pre-Con Projects
**GET** `/api/pre-con-projects?status=selling&city=Toronto&propertyType=Condo&featured=true&limit=20`

**Query Parameters:**
- `status` - selling, coming-soon, sold-out
- `city` - Filter by city
- `propertyType` - Filter by property type
- `subPropertyType` - Filter by sub property type
- `completionYear` - Filter by completion year
- `developer` - Filter by developer name or ID
- `featured` - true/false
- `limit` - Number of results

**Response:**
```json
{
  "projects": [
    {
      "mlsNumber": "MLS123456",
      "projectName": "Luxury Condos",
      "developer": "Developer Name",
      "status": "selling",
      "startingPrice": 500000,
      "endingPrice": 1000000,
      "city": "Toronto",
      "neighborhood": "Downtown",
      "propertyType": "Condo",
      "bedroomRange": "1-3",
      "bathroomRange": "1-2",
      "sqftRange": "500-1200",
      "totalUnits": 100,
      "availableUnits": 25,
      "images": ["https://..."],
      "amenities": ["Pool", "Gym", "Parking"],
      "features": ["Balcony", "Hardwood Floors"],
      "preCon": {
        "projectName": "Luxury Condos",
        "developer": "Developer Name",
        "startingPrice": 500000,
        "endingPrice": 1000000,
        "status": "selling",
        "completion": {
          "date": "2025-12-31",
          "progress": "Pre-construction"
        }
      }
    }
  ]
}
```

### Get Pre-Con Project
**GET** `/api/pre-con-projects/[mlsNumber]`

**Response:**
```json
{
  "project": {
    "mlsNumber": "MLS123456",
    "projectName": "Luxury Condos",
    "developer": "Developer Name",
    "status": "selling",
    "startingPrice": 500000,
    "endingPrice": 1000000,
    "city": "Toronto",
    "neighborhood": "Downtown",
    "propertyType": "Condo",
    "bedroomRange": "1-3",
    "bathroomRange": "1-2",
    "sqftRange": "500-1200",
    "totalUnits": 100,
    "availableUnits": 25,
    "images": {
      "imageUrl": "https://...",
      "allImages": ["https://..."]
    },
    "preCon": {
      "projectName": "Luxury Condos",
      "developer": "Developer Name",
      "startingPrice": 500000,
      "endingPrice": 1000000,
      "status": "selling",
      "completion": {
        "date": "2025-12-31",
        "progress": "Pre-construction"
      },
      "details": {
        "bedroomRange": "1-3",
        "bathroomRange": "1-2",
        "sqftRange": "500-1200",
        "totalUnits": 100,
        "availableUnits": 25
      },
      "amenities": ["Pool", "Gym", "Parking"],
      "features": ["Balcony", "Hardwood Floors"],
      "videos": [],
      "units": [
        {
          "id": "unit_id",
          "name": "Unit 101",
          "beds": 2,
          "baths": 2,
          "sqft": 1000,
          "price": 750000,
          "maintenanceFee": 500,
          "status": "for-sale",
          "images": ["https://..."],
          "description": "Beautiful unit",
          "features": [],
          "amenities": []
        }
      ]
    }
  }
}
```

### Search Pre-Con Projects
**GET** `/api/pre-con-projects/search?query=Toronto&city=Toronto`

**Query Parameters:**
- `query` - Search query
- `city` - Filter by city

**Response:**
```json
{
  "projects": [
    {
      "mlsNumber": "MLS123456",
      "projectName": "Luxury Condos",
      "city": "Toronto",
      "status": "selling"
    }
  ]
}
```

### Get Pre-Con Project Filters
**GET** `/api/pre-con-projects/filters`

**Response:**
```json
{
  "cities": ["Toronto", "Vancouver", "Montreal"],
  "propertyTypes": ["Condo", "House", "Townhouse"],
  "statuses": ["selling", "coming-soon", "sold-out"],
  "developers": ["Developer A", "Developer B"]
}
```

### Get Pre-Con Project Page Content
**GET** `/api/pre-con-projects/page-content?mlsNumber=MLS123456`

**Response:**
```json
{
  "content": {
    "title": "Luxury Condos",
    "description": "Beautiful pre-construction project",
    "sections": []
  }
}
```

### Get Pre-Con Cities
**GET** `/api/pre-con-cities`

**Response:**
```json
{
  "cities": [
    {
      "name": "Toronto",
      "count": 50
    },
    {
      "name": "Vancouver",
      "count": 30
    }
  ]
}
```

### Get Pre-Con Project Unit
**GET** `/api/pre-con-projects/[mlsNumber]/units/[unitId]`

**Response:**
```json
{
  "unit": {
    "id": "unit_id",
    "name": "Unit 101",
    "beds": 2,
    "baths": 2,
    "sqft": 1000,
    "price": 750000,
    "maintenanceFee": 500,
    "status": "for-sale",
    "images": ["https://..."],
    "description": "Beautiful unit",
    "features": [],
    "amenities": []
  }
}
```

### Get/Submit Project Ratings
**GET** `/api/projects/[projectId]/ratings?propertyType=pre-construction`

**Response:**
```json
{
  "average": 4.5,
  "total": 10,
  "userRating": 5,
  "ratings": [5, 4, 5, 4, 5, 4, 5, 4, 5, 4]
}
```

**POST** `/api/projects/[projectId]/ratings`

**Request Body:**
```json
{
  "rating": 5,
  "propertyType": "pre-construction"
}
```

---

## 🏠 Tours Endpoints (Legacy)

### List Tours
**GET** `/api/tours`

**Response:**
```json
{
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
```

### Get Tour
**GET** `/api/tours/[id]`

### Create/Update Tour
**POST** `/api/tours`

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

### Update/Delete Tour
**PATCH** `/api/tours/[id]`
**DELETE** `/api/tours/[id]`

---

## 📊 Market Trends Endpoints

### Get Market Trends by Location
**GET** `/api/market-trends/[locationType]/[locationName]?parentCity=Toronto&years=2&propertyType=CONDO&refresh=false`

**Path Parameters:**
- `locationType` - city, area, neighbourhood, intersection, community
- `locationName` - Name of the location (URL encoded)

**Query Parameters:**
- `parentCity` (optional) - Parent city for filtering
- `parentArea` (optional) - Parent area for filtering
- `parentNeighbourhood` (optional) - Parent neighbourhood for filtering
- `propertyType` (optional) - Filter by property type
- `community` (optional) - Filter by community
- `years` (optional) - Number of years of data (default: 2)
- `refresh` (optional) - Force refresh from API (default: false)

**Response:**
```json
{
  "priceOverview": {
    "average": 750000,
    "median": 700000,
    "min": 500000,
    "max": 1000000
  },
  "averageSoldPrice": {
    "current": 750000,
    "previous": 720000,
    "change": 4.17
  },
  "averageSoldPriceByType": {
    "CONDO": 600000,
    "HOUSE": 900000
  },
  "salesVolumeByType": {
    "CONDO": 150,
    "HOUSE": 80
  },
  "priceByBedrooms": {
    "1": 500000,
    "2": 650000,
    "3": 800000
  },
  "inventoryOverview": {
    "total": 200,
    "new": 50,
    "sold": 30
  },
  "newClosedAvailable": {
    "new": 50,
    "closed": 30,
    "available": 120
  },
  "daysOnMarket": {
    "average": 45,
    "median": 40
  }
}
```

### Get Location Rankings
**GET** `/api/market-trends/[locationType]/[locationName]/rankings?years=2`

**Response:**
```json
{
  "rankings": {
    "byPrice": [
      {
        "location": "Downtown",
        "averagePrice": 800000,
        "rank": 1
      }
    ],
    "byVolume": [
      {
        "location": "Downtown",
        "salesVolume": 200,
        "rank": 1
      }
    ]
  }
}
```

### Get City Breakdown
**GET** `/api/market-trends/city-breakdown?refresh=false`

**Query Parameters:**
- `refresh` (optional) - Force refresh from API (default: false)

**Response:**
```json
{
  "month": "2024-01",
  "breakdownData": [
    {
      "city": "Toronto",
      "averagePrice": 750000,
      "medianPrice": 700000,
      "averageOneYearChange": 5.2,
      "medianOneYearChange": 4.8,
      "totalTransactions": 500
    }
  ],
  "cached": true
}
```

### Get Property Type Breakdown
**GET** `/api/market-trends/property-type-breakdown?refresh=false`

**Response:**
```json
{
  "month": "2024-01",
  "breakdownData": [
    {
      "propertyType": "CONDO",
      "averagePrice": 600000,
      "medianPrice": 550000,
      "averageOneYearChange": 3.5,
      "medianOneYearChange": 3.2,
      "totalTransactions": 300
    }
  ],
  "cached": true
}
```

---

## 📍 Location & Amenities Endpoints

### Get Neighborhood Amenities
**GET** `/api/neighborhood-amenities?lat=43.6532&lng=-79.3832&category=schools&schoolType=Public`

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude
- `category` (optional) - schools, parks, safety, transit, entertainment, shopping, worship, sports, food, miscellaneous (default: schools)
- `schoolType` (optional) - For schools: All, Public, Catholic, Private, Alternative (default: All)

**Response:**
```json
{
  "category": {
    "id": "schools",
    "label": "Schools",
    "items": [
      {
        "id": "place_id",
        "name": "Public Elementary School",
        "type": "school",
        "rating": 4.5,
        "walkTime": "5 min",
        "driveTime": "2 min",
        "distance": "0.3 km",
        "latitude": 43.6532,
        "longitude": -79.3832
      }
    ],
    "filters": [
      {
        "label": "All",
        "count": 15,
        "isPredefined": true,
        "types": ["school"]
      },
      {
        "label": "Public",
        "count": 8,
        "isPredefined": true,
        "types": ["school"]
      }
    ]
  }
}
```

### Get Amenity Details
**GET** `/api/amenity-details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4`

**Query Parameters:**
- `placeId` (required) - Google Places place ID

**Response:**
```json
{
  "place": {
    "id": "place_id",
    "name": "Public Elementary School",
    "address": "123 Main St, Toronto, ON",
    "phone": "+1234567890",
    "website": "https://...",
    "rating": 4.5,
    "reviews": 100,
    "openingHours": {
      "openNow": true,
      "weekdayText": ["Monday: 8:00 AM – 4:00 PM", ...]
    },
    "photos": ["https://..."],
    "geometry": {
      "location": {
        "lat": 43.6532,
        "lng": -79.3832
      }
    }
  }
}
```

### Get Demographics
**GET** `/api/demographics?lat=43.6532&lng=-79.3832`

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude

**Response:**
```json
{
  "stats": {
    "population": 50000,
    "averageAge": 35,
    "averageIncome": 75000,
    "renters": 45,
    "householdSize": 2.5,
    "single": 30,
    "householdsWithChildren": 40,
    "notInLabourForce": 25
  },
  "charts": {
    "income": [
      {
        "name": "$0-$50k",
        "value": 10000,
        "percentage": 20
      }
    ],
    "age": [
      {
        "name": "25-34",
        "value": 15000,
        "percentage": 30
      }
    ],
    "occupation": [],
    "ethnicity": [],
    "language": [],
    "yearBuilt": [],
    "propertyType": [],
    "commute": []
  },
  "disseminationArea": "DA123456",
  "lastUpdated": "2024-01-15T10:30:00.000Z"
}
```

### Get Property Categories
**GET** `/api/property-categories`

**Response:**
```json
{
  "categories": [
    {
      "id": "CONDO",
      "name": "Condo",
      "count": 500
    },
    {
      "id": "HOUSE",
      "name": "House",
      "count": 300
    }
  ]
}
```

---

## 🏢 Development Team Endpoints

### List Development Teams
**GET** `/api/development-team`

**Response:**
```json
{
  "teams": [
    {
      "id": "team_id",
      "name": "Developer Name",
      "slug": "developer-name",
      "type": "developer",
      "description": "Leading developer",
      "website": "https://...",
      "image": "https://...",
      "stats": {
        "totalProjects": 50,
        "activelySelling": 20,
        "launchingSoon": 5,
        "registrationPhase": 3,
        "soldOut": 15,
        "resale": 5,
        "cancelled": 2
      }
    }
  ]
}
```

### Get Development Team
**GET** `/api/development-team/[type]/[slug]`

**Path Parameters:**
- `type` - developer, architect, builder, etc.
- `slug` - URL slug of the team

**Response:**
```json
{
  "team": {
    "id": "team_id",
    "name": "Developer Name",
    "slug": "developer-name",
    "type": "developer",
    "description": "Leading developer",
    "website": "https://...",
    "image": "https://...",
    "email": "contact@developer.com",
    "phone": "+1234567890",
    "stats": {
      "totalProjects": 50,
      "activelySelling": 20,
      "launchingSoon": 5,
      "registrationPhase": 3,
      "soldOut": 15,
      "resale": 5,
      "cancelled": 2
    },
    "projects": [
      {
        "mlsNumber": "MLS123456",
        "projectName": "Luxury Condos",
        "status": "selling"
      }
    ]
  }
}
```

---

## 📊 Activity Endpoints

### Get User Activity
**GET** `/api/activity`

**Response:**
```json
{
  "activities": [
    {
      "id": "saved-saved_id",
      "type": "property_saved",
      "action": "Property saved",
      "mlsNumber": "MLS123456",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "tour-tour_id",
      "type": "tour_scheduled",
      "action": "Tour scheduled",
      "mlsNumber": "MLS123456",
      "tourType": "IN_PERSON",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "alert-new-alert_id",
      "type": "alert_new",
      "action": "New listing alert set up",
      "location": "Toronto",
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Health Check (Legacy)

### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## Admin API Endpoints

All admin endpoints require **SUPER_ADMIN** role authentication.

### Base URL
All admin endpoints are prefixed with `/api/admin/`

---

## 👥 User Management (Admin)

### List Users
**GET** `/api/admin/users?page=1&limit=10&search=john&role=SUBSCRIBER`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `search` (optional) - Search by name or email
- `role` (optional) - Filter by role (SUBSCRIBER, ADMIN, SUPER_ADMIN)

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SUBSCRIBER",
      "image": "https://...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

### Get User
**GET** `/api/admin/users/[id]`

### Update User
**PATCH** `/api/admin/users/[id]`

**Request Body:**
```json
{
  "name": "John Updated",
  "role": "ADMIN"
}
```

### Delete User
**DELETE** `/api/admin/users/[id]`

---

## 🏗️ Pre-Construction Projects Management (Admin)

### List Pre-Con Projects
**GET** `/api/admin/pre-con-projects?page=1&limit=20&status=selling`

**Response:**
```json
{
  "projects": [
    {
      "id": "project_id",
      "mlsNumber": "MLS123456",
      "projectName": "Luxury Condos",
      "status": "selling",
      "isPublished": true,
      "featured": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Pre-Con Project
**POST** `/api/admin/pre-con-projects`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "projectName": "Luxury Condos",
  "developer": "developer_id",
  "status": "selling",
  "city": "Toronto",
  "neighborhood": "Downtown",
  "propertyType": "Condo",
  "startingPrice": 500000,
  "endingPrice": 1000000,
  "bedroomRange": "1-3",
  "bathroomRange": "1-2",
  "sqftRange": "500-1200",
  "totalUnits": 100,
  "availableUnits": 25,
  "images": ["https://..."],
  "isPublished": true,
  "featured": false
}
```

### Get Pre-Con Project
**GET** `/api/admin/pre-con-projects/[id]`

### Update Pre-Con Project
**PATCH** `/api/admin/pre-con-projects/[id]`

**Request Body:**
```json
{
  "status": "sold-out",
  "featured": true,
  "isPublished": true
}
```

### Delete Pre-Con Project
**DELETE** `/api/admin/pre-con-projects/[id]`

### Toggle Featured Status
**PATCH** `/api/admin/pre-con-projects/[id]/featured`

**Request Body:**
```json
{
  "featured": true
}
```

### Get Draft Projects
**GET** `/api/admin/pre-con-projects/draft`

**Response:**
```json
{
  "projects": [
    {
      "id": "project_id",
      "mlsNumber": "MLS123456",
      "projectName": "Draft Project",
      "isPublished": false,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get/Update Page Content
**GET** `/api/admin/pre-con-projects/page-content?mlsNumber=MLS123456`

**POST** `/api/admin/pre-con-projects/page-content`

**Request Body:**
```json
{
  "mlsNumber": "MLS123456",
  "content": {
    "title": "Luxury Condos",
    "description": "Beautiful project",
    "sections": []
  }
}
```

---

## 🏢 Development Team Management (Admin)

### List Development Teams
**GET** `/api/admin/development-team?page=1&limit=20`

**Response:**
```json
{
  "teams": [
    {
      "id": "team_id",
      "name": "Developer Name",
      "type": "developer",
      "slug": "developer-name",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Development Team
**POST** `/api/admin/development-team`

**Request Body:**
```json
{
  "name": "Developer Name",
  "type": "developer",
  "slug": "developer-name",
  "description": "Leading developer",
  "website": "https://...",
  "email": "contact@developer.com",
  "phone": "+1234567890"
}
```

### Get Development Team
**GET** `/api/admin/development-team/[id]`

### Update Development Team
**PATCH** `/api/admin/development-team/[id]`

### Delete Development Team
**DELETE** `/api/admin/development-team/[id]`

### Get Development Team Stats
**GET** `/api/admin/development-team/[id]/stats`

**Response:**
```json
{
  "stats": {
    "totalProjects": 50,
    "activelySelling": 20,
    "launchingSoon": 5,
    "registrationPhase": 3,
    "soldOut": 15,
    "resale": 5,
    "cancelled": 2
  }
}
```

---

## 📄 Page Management (Admin)

### List Pages
**GET** `/api/admin/pages?page=1&limit=20`

**Response:**
```json
{
  "pages": [
    {
      "id": "page_id",
      "title": "About Us",
      "slug": "about-us",
      "categoryId": "category_id",
      "published": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Page
**POST** `/api/admin/pages`

**Request Body:**
```json
{
  "title": "About Us",
  "slug": "about-us",
  "content": "Page content...",
  "categoryId": "category_id",
  "published": true
}
```

### Get Page
**GET** `/api/admin/pages/[id]`

### Update Page
**PATCH** `/api/admin/pages/[id]`

### Delete Page
**DELETE** `/api/admin/pages/[id]`

---

## 📁 Page Categories Management (Admin)

### List Page Categories
**GET** `/api/admin/page-categories`

**Response:**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Information",
      "slug": "information",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Create Page Category
**POST** `/api/admin/page-categories`

**Request Body:**
```json
{
  "name": "Information",
  "slug": "information"
}
```

### Get Page Category
**GET** `/api/admin/page-categories/[id]`

### Update Page Category
**PATCH** `/api/admin/page-categories/[id]`

### Delete Page Category
**DELETE** `/api/admin/page-categories/[id]`

---

## 📤 Upload Endpoints (Admin)

### Upload Image
**POST** `/api/admin/upload/image`

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "success": true,
  "url": "https://s3.amazonaws.com/bucket/image.jpg",
  "key": "images/image.jpg"
}
```

### Upload Document
**POST** `/api/admin/upload/document`

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "success": true,
  "url": "https://s3.amazonaws.com/bucket/document.pdf",
  "key": "documents/document.pdf"
}
```

---

## NextAuth Endpoints

### NextAuth Handler
**GET/POST** `/api/auth/[...nextauth]`

This endpoint handles all NextAuth.js authentication flows including:
- OAuth providers (Google, GitHub, etc.)
- Credentials authentication
- Session management
- Callback handling

**Note:** This endpoint is automatically handled by NextAuth.js and doesn't require manual implementation.

---

## Response Formats

### Standard v1 Response
All `/api/v1/*` endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-01-15T10:30:00.000Z",
    "version": "v1"
  }
}
```

### Legacy Response
Legacy `/api/*` endpoints may return various formats:
```json
{
  "success": true,
  "data": { ... }
}
```
or
```json
{
  "data": { ... }
}
```

---

## Authentication

### v1 Endpoints
Most v1 endpoints require authentication via NextAuth session. Include session cookies in requests or use Bearer token authentication.

### Legacy Endpoints
Legacy endpoints also require authentication via NextAuth session.

### Admin Endpoints
All admin endpoints require **SUPER_ADMIN** role. Unauthorized requests return:
```json
{
  "error": "Forbidden - Super Admin access required"
}
```
with status `403`.

---

## Error Handling

### Standard Error Response (v1)
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

### Legacy Error Response
```json
{
  "error": "Unauthorized"
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

All endpoints support CORS and can be accessed from mobile apps and external domains. CORS headers are automatically applied by the middleware for v1 endpoints.

---

## Rate Limiting

Rate limiting is implemented via middleware for v1 endpoints. Default limits:
- 100 requests per minute per IP address

---

## Notes

- All timestamps are in ISO 8601 format
- All endpoints require authentication unless specified otherwise
- Pagination defaults: page=1, limit=20
- All string IDs are CUIDs
- Property types follow the enum: HOUSE, APARTMENT, CONDO, TOWNHOUSE, VILLA, OFFICE, COMMERCIAL, LAND, OTHER
- v1 endpoints use standardized response format with `success`, `data`, `error`, and `meta` fields
- Legacy endpoints may have varying response formats
- Admin endpoints require SUPER_ADMIN role
- Market trends endpoints cache data for 30 days (revalidate: 2592000 seconds)
- Neighborhood amenities endpoints cache data for 7 days (revalidate: 604800 seconds)

---

## Test Endpoints

### Test Database Connection
**GET** `/api/test-db`

**Response:**
```json
{
  "status": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Query
**GET** `/api/test-query`

**Response:**
```json
{
  "result": "Query executed successfully"
}
```

**Note:** These endpoints are for development/testing purposes only and should not be exposed in production.
