# Mobile App Authentication Guide

This guide explains how to authenticate with the Summitly API from mobile apps using Bearer tokens.

## Overview

The API now supports **two authentication methods**:

1. **Session Cookies** (Web/Browser) - Uses NextAuth session cookies
2. **Bearer Tokens** (Mobile Apps) - Uses JWT tokens in Authorization header

## Authentication Flow

### Step 1: Login

**POST** `/api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
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
      "email": "user@example.com",
      "role": "SUBSCRIBER",
      "image": "https://..."
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "message": "Login successful. Use NextAuth session for web or Bearer token for mobile apps."
  }
}
```

**Important:** Save the `token` from the response. This is your JWT token that expires in 30 days.

### Step 2: Use Bearer Token in API Requests

Include the token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Example: Flutter/Dart

```dart
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  static const String baseUrl = 'https://summitly.vercel.app/api/v1';
  late Dio _dio;
  String? _authToken;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Add interceptor to include Bearer token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
    ));
  }

  // Login and save token
  Future<void> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.data['success'] == true) {
        _authToken = response.data['data']['token'];
        
        // Save token to persistent storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _authToken!);
      }
    } catch (e) {
      print('Login error: $e');
      rethrow;
    }
  }

  // Load saved token on app start
  Future<void> loadSavedToken() async {
    final prefs = await SharedPreferences.getInstance();
    _authToken = prefs.getString('auth_token');
    if (_authToken != null) {
      // Verify token is still valid by checking auth status
      try {
        final response = await _dio.get('/auth/status');
        if (response.data['data']['authenticated'] == false) {
          // Token expired, clear it
          _authToken = null;
          await prefs.remove('auth_token');
        }
      } catch (e) {
        // Token invalid, clear it
        _authToken = null;
        await prefs.remove('auth_token');
      }
    }
  }

  // Get saved properties (requires authentication)
  Future<List<dynamic>> getSavedProperties() async {
    try {
      final response = await _dio.get('/saved-properties');
      return response.data['data']['savedProperties'];
    } catch (e) {
      if (e is DioException && e.response?.statusCode == 401) {
        // Token expired or invalid
        _authToken = null;
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('auth_token');
        throw Exception('Session expired. Please login again.');
      }
      rethrow;
    }
  }
}
```

## Example: React Native

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://summitly.vercel.app/api/v1';

class ApiClient {
  constructor() {
    this.token = null;
  }

  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      this.token = data.data.token;
      await AsyncStorage.setItem('auth_token', this.token);
      return data.data.user;
    }
    
    throw new Error(data.error?.message || 'Login failed');
  }

  async loadSavedToken() {
    this.token = await AsyncStorage.getItem('auth_token');
    
    if (this.token) {
      // Verify token is still valid
      try {
        const response = await fetch(`${API_BASE_URL}/auth/status`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });
        
        const data = await response.json();
        if (!data.data.authenticated) {
          this.token = null;
          await AsyncStorage.removeItem('auth_token');
        }
      } catch (e) {
        this.token = null;
        await AsyncStorage.removeItem('auth_token');
      }
    }
  }

  async getSavedProperties() {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/saved-properties`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (response.status === 401) {
      // Token expired
      this.token = null;
      await AsyncStorage.removeItem('auth_token');
      throw new Error('Session expired. Please login again.');
    }

    const data = await response.json();
    return data.data.savedProperties;
  }
}

export default new ApiClient();
```

## Example: Postman

1. **Login:**
   - Method: `POST`
   - URL: `https://summitly.vercel.app/api/v1/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "your@email.com",
       "password": "yourpassword"
     }
     ```
   - Copy the `token` from the response

2. **Use Token:**
   - Go to **Authorization** tab
   - Type: **Bearer Token**
   - Token: Paste the token from step 1

3. **Test Endpoint:**
   - Method: `GET`
   - URL: `https://summitly.vercel.app/api/v1/saved-properties`
   - The Bearer token will be automatically included

## Token Expiration

- **Token Lifetime:** 30 days
- **Check Status:** Use `/api/v1/auth/status` to verify if token is still valid
- **Refresh:** When token expires, user needs to login again

## Error Handling

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to save properties"
  }
}
```

**Action:** Token expired or invalid. User needs to login again.

### Token Expired
The token includes an `exp` (expiration) claim. Check this before making requests:

```javascript
// Decode JWT to check expiration
const payload = JSON.parse(atob(token.split('.')[1]));
if (payload.exp < Date.now() / 1000) {
  // Token expired, login again
}
```

## Security Best Practices

1. **Store tokens securely:**
   - Use secure storage (Keychain on iOS, Keystore on Android)
   - Never log tokens
   - Don't commit tokens to version control

2. **Handle token refresh:**
   - Check token validity before requests
   - Implement automatic re-login on token expiration

3. **Use HTTPS only:**
   - All API requests must use HTTPS
   - Never send tokens over HTTP

4. **Clear tokens on logout:**
   - Remove token from storage
   - Clear any cached user data

## Testing

### Check Authentication Status
**GET** `/api/v1/auth/status`

**With Bearer Token:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://summitly.vercel.app/api/v1/auth/status
```

**Response (Authenticated):**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "user@example.com",
      "role": "SUBSCRIBER"
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

## Migration from Web to Mobile

If you're migrating from web (cookies) to mobile (tokens):

1. **Web:** Uses NextAuth session cookies automatically
2. **Mobile:** Use the `token` from login response as Bearer token
3. **Both work:** The API supports both methods simultaneously

## Support

All `/api/v1/*` endpoints now support Bearer token authentication. The authentication is handled automatically by the `getAuthenticatedUser()` utility function, which checks:
1. First: NextAuth session cookies (for web)
2. Second: Bearer token in Authorization header (for mobile)

This means your existing web app continues to work with cookies, while mobile apps can use Bearer tokens.
