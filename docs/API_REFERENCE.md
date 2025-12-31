# API Reference - Summitly Backend

## Base URL
```
http://localhost:5050/api
```

## Authentication
Most endpoints don't require authentication in development. For production, add:
```
Authorization: Bearer YOUR_TOKEN
```

---

## Endpoints

### 1. Chat Endpoint

**Intelligent Chat (Synchronous)**

```http
POST /intelligent-chat-sync
```

**Request:**
```json
{
  "message": "Show me properties in Toronto",
  "session_id": "user_123",
  "user_preferences": {
    "location": "Toronto",
    "budget_min": 400000,
    "budget_max": 900000,
    "bedrooms": 2,
    "property_type": "condo"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "reply": "I found 5 luxury condos in downtown Toronto...",
  "properties": [
    {
      "id": "PROP001",
      "title": "Luxury Downtown Condo",
      "price": "$850,000",
      "bedrooms": 2,
      "bathrooms": 2,
      "image_url": "https://...",
      "summitly_url": "https://summitly.ca/property/PROP001"
    }
  ],
  "session_id": "user_123"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request
- `500` - Server error

---

### 2. Property Analysis

**Quick Insights**

```http
POST /property-analysis
```

**Request:**
```json
{
  "mode": "quick_insights",
  "mls_number": "N12584160"
}
```

**Response:**
```json
{
  "status": "success",
  "mls_number": "N12584160",
  "insights": {
    "price_assessment": "Market competitive",
    "neighborhood_score": 8.5,
    "investment_potential": "High",
    "key_features": ["Modern architecture", "Prime location"]
  }
}
```

**Mode Options:**
- `quick_insights` - Basic property analysis
- `detailed_valuation` - Comprehensive valuation
- `market_comparison` - Comparable properties analysis
- `investment_analysis` - Investment potential

---

### 3. Multimodal Endpoint

**Voice + Text Processing**

```http
POST /multimodal
Content-Type: multipart/form-data
```

**Parameters:**
- `audio` (file) - WAV, MP3, or M4A audio file
- `text` (string, optional) - Accompanying text
- `session_id` (string) - Session identifier

**Example:**
```bash
curl -X POST http://localhost:5050/api/multimodal \
  -F "audio=@voice_message.wav" \
  -F "session_id=user_123"
```

**Response:**
```json
{
  "status": "success",
  "transcribed_text": "Show me condos in Toronto under 800k",
  "response": "I found 12 condos matching your criteria...",
  "session_id": "user_123"
}
```

---

### 4. Lead Management

**Create Lead**

```http
POST /leads
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "(416) 555-1234",
  "interested_properties": ["PROP001", "PROP002"],
  "message": "Interested in these properties"
}
```

**Response:**
```json
{
  "status": "success",
  "lead_id": "LEAD_12345",
  "created_at": "2025-11-28T10:30:00Z"
}
```

**Get Leads**

```http
GET /leads?limit=50&offset=0
```

---

### 5. Search Management

**Save Search**

```http
POST /saved-searches
```

**Request:**
```json
{
  "name": "Toronto Condos Under 800k",
  "criteria": {
    "location": "Toronto",
    "budget_max": 800000,
    "property_type": "condo",
    "bedrooms": 2
  }
}
```

**Get Saved Searches**

```http
GET /saved-searches/{user_id}
```

---

### 6. Health & Status

**Health Check**

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "3.0.0",
  "services": {
    "repliers_api": "connected",
    "openai_api": "connected",
    "database": "connected"
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "status": "error",
  "error_code": "INVALID_REQUEST",
  "message": "Missing required field: session_id",
  "details": {
    "field": "session_id",
    "reason": "required"
  }
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `INVALID_REQUEST` | Missing or invalid parameters |
| `UNAUTHORIZED` | Authentication failed |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |
| `SERVICE_UNAVAILABLE` | External service unavailable |
| `INTERNAL_ERROR` | Server error |

---

## Rate Limiting

- **Default**: 100 requests per minute per session
- **Premium**: 1000 requests per minute
- **Headers**:
  ```
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1672387200
  ```

---

## Pagination

For list endpoints:

```
GET /resource?limit=50&offset=0&sort=created_at&order=desc
```

**Parameters:**
- `limit` - Results per page (default: 20, max: 100)
- `offset` - Starting position (default: 0)
- `sort` - Sort field (default: created_at)
- `order` - asc or desc (default: desc)

---

## Webhook Events

Subscribe to events via:

```http
POST /webhooks
```

**Request:**
```json
{
  "url": "https://example.com/webhook",
  "events": ["lead_created", "property_updated"]
}
```

**Events:**
- `lead_created`
- `lead_updated`
- `property_updated`
- `search_triggered`

---

## Code Examples

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:5050/api/intelligent-chat-sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Show me properties in Toronto',
    session_id: 'user_123'
  })
});
const data = await response.json();
console.log(data);
```

### Python

```python
import requests

response = requests.post(
    'http://localhost:5050/api/intelligent-chat-sync',
    json={
        'message': 'Show me properties in Toronto',
        'session_id': 'user_123'
    }
)
print(response.json())
```

### cURL

```bash
curl -X POST http://localhost:5050/api/intelligent-chat-sync \
  -H "Content-Type: application/json" \
  -d '{"message":"Show me properties in Toronto","session_id":"user_123"}'
```

---

## Changelog

**v3.0.0** (Nov 28, 2025)
- Reorganized project structure
- Added comprehensive API documentation
- Improved error handling
- Added rate limiting

**v2.0.0** (Nov 20, 2025)
- Added Repliers integration
- Implemented lead management

**v1.0.0** (Nov 1, 2025)
- Initial release

---

**Last Updated**: November 28, 2025
