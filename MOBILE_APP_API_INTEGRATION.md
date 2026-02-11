# Flutter API Integration Guide

Complete guide for integrating Summitly API into your Flutter mobile app.

## 🔗 API Base URL

```
https://summitly.vercel.app/api/v1
```

---

## 📦 Dependencies

Add to `pubspec.yaml`:

```yaml
dependencies:
  dio: ^5.4.0
  # Optional but recommended
  json_annotation: ^4.8.1
```

```yaml
dev_dependencies:
  json_serializable: ^6.7.1
  build_runner: ^2.4.7
```

---

## 🔧 API Client Setup

### Create API Client

`lib/api/client.dart`:

```dart
import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'https://summitly.vercel.app/api/v1';
  
  late Dio _dio;
  String? _authToken;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {
        'Content-Type': 'application/json',
      },
    ));

    // Request interceptor - Add auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        return handler.next(options);
      },
      onError: (error, handler) {
        // Handle errors
        if (error.response != null) {
          final data = error.response?.data;
          if (data is Map && data['error'] != null) {
            error = DioException(
              requestOptions: error.requestOptions,
              response: error.response,
              error: data['error']['message'],
            );
          }
        }
        return handler.next(error);
      },
    ));
  }

  // Set auth token
  void setAuthToken(String? token) {
    _authToken = token;
  }

  Dio get dio => _dio;
}
```

---

## 📋 API Response Models

### Base Response Model

`lib/models/api_response.dart`:

```dart
class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;
  final Meta? meta;

  ApiResponse({
    required this.success,
    this.data,
    this.error,
    this.meta,
  });

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : json['data'] as T?,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'])
          : null,
      meta: json['meta'] != null ? Meta.fromJson(json['meta']) : null,
    );
  }
}

class ApiError {
  final String code;
  final String message;
  final dynamic details;

  ApiError({
    required this.code,
    required this.message,
    this.details,
  });

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      code: json['code'] ?? '',
      message: json['message'] ?? '',
      details: json['details'],
    );
  }
}

class Meta {
  final Pagination? pagination;
  final String timestamp;
  final String version;

  Meta({
    this.pagination,
    required this.timestamp,
    required this.version,
  });

  factory Meta.fromJson(Map<String, dynamic> json) {
    return Meta(
      pagination: json['pagination'] != null
          ? Pagination.fromJson(json['pagination'])
          : null,
      timestamp: json['timestamp'] ?? '',
      version: json['version'] ?? '',
    );
  }
}

class Pagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;

  Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
    );
  }
}
```

---

## 🏗️ Pre-Construction Projects Models

`lib/models/pre_con_project.dart`:

```dart
class PreConProject {
  final String id;
  final String mlsNumber;
  final String projectName;
  final String? developer;
  final Location location;
  final Pricing pricing;
  final String? status;
  final Completion completion;
  final ProjectDetails details;
  final List<String> amenities;
  final List<String> features;
  final List<String> images;
  final List<String> videos;
  final bool featured;

  PreConProject({
    required this.id,
    required this.mlsNumber,
    required this.projectName,
    this.developer,
    required this.location,
    required this.pricing,
    this.status,
    required this.completion,
    required this.details,
    this.amenities = const [],
    this.features = const [],
    this.images = const [],
    this.videos = const [],
    this.featured = false,
  });

  factory PreConProject.fromJson(Map<String, dynamic> json) {
    return PreConProject(
      id: json['id'] ?? '',
      mlsNumber: json['mlsNumber'] ?? '',
      projectName: json['projectName'] ?? '',
      developer: json['developer'],
      location: Location.fromJson(json['location'] ?? {}),
      pricing: Pricing.fromJson(json['pricing'] ?? {}),
      status: json['status'],
      completion: Completion.fromJson(json['completion'] ?? {}),
      details: ProjectDetails.fromJson(json['details'] ?? {}),
      amenities: List<String>.from(json['amenities'] ?? []),
      features: List<String>.from(json['features'] ?? []),
      images: List<String>.from(json['images'] ?? []),
      videos: List<String>.from(json['videos'] ?? []),
      featured: json['featured'] ?? false,
    );
  }
}

class Location {
  final String? address;
  final String? city;
  final String? state;
  final String? zip;
  final String? neighborhood;
  final Coordinates? coordinates;

  Location({
    this.address,
    this.city,
    this.state,
    this.zip,
    this.neighborhood,
    this.coordinates,
  });

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      address: json['address'],
      city: json['city'],
      state: json['state'],
      zip: json['zip'],
      neighborhood: json['neighborhood'],
      coordinates: json['coordinates'] != null
          ? Coordinates.fromJson(json['coordinates'])
          : null,
    );
  }
}

class Coordinates {
  final double lat;
  final double lng;

  Coordinates({required this.lat, required this.lng});

  factory Coordinates.fromJson(Map<String, dynamic> json) {
    return Coordinates(
      lat: (json['lat'] ?? 0).toDouble(),
      lng: (json['lng'] ?? 0).toDouble(),
    );
  }
}

class Pricing {
  final double? starting;
  final double? ending;
  final PriceRange? range;
  final double? avgPricePerSqft;

  Pricing({
    this.starting,
    this.ending,
    this.range,
    this.avgPricePerSqft,
  });

  factory Pricing.fromJson(Map<String, dynamic> json) {
    return Pricing(
      starting: json['starting']?.toDouble(),
      ending: json['ending']?.toDouble(),
      range: json['range'] != null ? PriceRange.fromJson(json['range']) : null,
      avgPricePerSqft: json['avgPricePerSqft']?.toDouble(),
    );
  }
}

class PriceRange {
  final double? min;
  final double? max;

  PriceRange({this.min, this.max});

  factory PriceRange.fromJson(Map<String, dynamic> json) {
    return PriceRange(
      min: json['min']?.toDouble(),
      max: json['max']?.toDouble(),
    );
  }
}

class Completion {
  final String? date;
  final int? progress;

  Completion({this.date, this.progress});

  factory Completion.fromJson(Map<String, dynamic> json) {
    return Completion(
      date: json['date'],
      progress: json['progress'],
    );
  }
}

class ProjectDetails {
  final String? propertyType;
  final String? subPropertyType;
  final String? bedroomRange;
  final String? bathroomRange;
  final String? sqftRange;
  final int? totalUnits;
  final int? availableUnits;
  final int? storeys;
  final String? height;

  ProjectDetails({
    this.propertyType,
    this.subPropertyType,
    this.bedroomRange,
    this.bathroomRange,
    this.sqftRange,
    this.totalUnits,
    this.availableUnits,
    this.storeys,
    this.height,
  });

  factory ProjectDetails.fromJson(Map<String, dynamic> json) {
    return ProjectDetails(
      propertyType: json['propertyType'],
      subPropertyType: json['subPropertyType'],
      bedroomRange: json['bedroomRange'],
      bathroomRange: json['bathroomRange'],
      sqftRange: json['sqftRange'],
      totalUnits: json['totalUnits'],
      availableUnits: json['availableUnits'],
      storeys: json['storeys'],
      height: json['height'],
    );
  }
}
```

---

## 🚀 API Service

### Pre-Construction Projects Service

`lib/services/pre_con_projects_service.dart`:

```dart
import 'package:dio/dio.dart';
import '../api/client.dart';
import '../models/api_response.dart';
import '../models/pre_con_project.dart';

class PreConProjectsService {
  final ApiClient _apiClient = ApiClient();

  /// Get all pre-construction projects
  /// 
  /// Parameters:
  /// - city: Filter by city name
  /// - status: Filter by status (e.g., "Pre-construction", "Under Construction")
  /// - propertyType: Filter by property type
  /// - subPropertyType: Filter by sub property type
  /// - completionYear: Filter by completion year
  /// - developer: Filter by developer name
  /// - featured: Filter featured projects only (true/false)
  /// - page: Page number (default: 1)
  /// - limit: Items per page (default: 20)
  Future<ApiResponse<PreConProjectsData>> getProjects({
    String? city,
    String? status,
    String? propertyType,
    String? subPropertyType,
    String? completionYear,
    String? developer,
    bool? featured,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (city != null && city.isNotEmpty) queryParams['city'] = city;
      if (status != null && status.isNotEmpty) queryParams['status'] = status;
      if (propertyType != null && propertyType.isNotEmpty) {
        queryParams['propertyType'] = propertyType;
      }
      if (subPropertyType != null && subPropertyType.isNotEmpty) {
        queryParams['subPropertyType'] = subPropertyType;
      }
      if (completionYear != null && completionYear.isNotEmpty) {
        queryParams['completionYear'] = completionYear;
      }
      if (developer != null && developer.isNotEmpty) {
        queryParams['developer'] = developer;
      }
      if (featured != null) queryParams['featured'] = featured.toString();

      final response = await _apiClient.dio.get(
        '/pre-con-projects',
        queryParameters: queryParams,
      );

      return ApiResponse.fromJson(
        response.data,
        (data) => PreConProjectsData.fromJson(data),
      );
    } on DioException catch (e) {
      throw Exception('Failed to fetch projects: ${e.message}');
    }
  }
}

class PreConProjectsData {
  final List<PreConProject> projects;

  PreConProjectsData({required this.projects});

  factory PreConProjectsData.fromJson(Map<String, dynamic> json) {
    return PreConProjectsData(
      projects: (json['projects'] as List? ?? [])
          .map((item) => PreConProject.fromJson(item))
          .toList(),
    );
  }
}
```

### Health Check Service

`lib/services/health_service.dart`:

```dart
import 'package:dio/dio.dart';
import '../api/client.dart';
import '../models/api_response.dart';

class HealthData {
  final String status;
  final String database;
  final String timestamp;
  final String environment;

  HealthData({
    required this.status,
    required this.database,
    required this.timestamp,
    required this.environment,
  });

  factory HealthData.fromJson(Map<String, dynamic> json) {
    return HealthData(
      status: json['status'] ?? '',
      database: json['database'] ?? '',
      timestamp: json['timestamp'] ?? '',
      environment: json['environment'] ?? '',
    );
  }
}

class HealthService {
  final ApiClient _apiClient = ApiClient();

  Future<ApiResponse<HealthData>> checkHealth() async {
    try {
      final response = await _apiClient.dio.get('/health');
      return ApiResponse.fromJson(
        response.data,
        (data) => HealthData.fromJson(data),
      );
    } on DioException catch (e) {
      throw Exception('Health check failed: ${e.message}');
    }
  }
}
```

---

## 📱 Using in Flutter Widgets

### Example: Projects List Screen

`lib/screens/projects_screen.dart`:

```dart
import 'package:flutter/material.dart';
import '../services/pre_con_projects_service.dart';
import '../models/pre_con_project.dart';

class ProjectsScreen extends StatefulWidget {
  @override
  _ProjectsScreenState createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  final PreConProjectsService _service = PreConProjectsService();
  List<PreConProject> _projects = [];
  bool _loading = true;
  String? _error;
  int _currentPage = 1;
  int _totalPages = 1;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _fetchProjects();
  }

  Future<void> _fetchProjects({bool loadMore = false}) async {
    if (_loading && !loadMore) return;

    try {
      setState(() {
        _loading = true;
        _error = null;
      });

      final page = loadMore ? _currentPage + 1 : 1;
      final response = await _service.getProjects(
        city: 'Toronto',
        page: page,
        limit: 20,
      );

      if (response.success && response.data != null) {
        setState(() {
          if (loadMore) {
            _projects.addAll(response.data!.projects);
          } else {
            _projects = response.data!.projects;
          }
          _currentPage = response.meta?.pagination?.page ?? page;
          _totalPages = response.meta?.pagination?.totalPages ?? 1;
          _hasMore = _currentPage < _totalPages;
          _loading = false;
        });
      } else {
        setState(() {
          _error = response.error?.message ?? 'Failed to load projects';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Pre-Construction Projects'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading && _projects.isEmpty) {
      return Center(child: CircularProgressIndicator());
    }

    if (_error != null && _projects.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_error'),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _fetchProjects(),
              child: Text('Retry'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _fetchProjects(),
      child: ListView.builder(
        itemCount: _projects.length + (_hasMore ? 1 : 0),
        itemBuilder: (context, index) {
          if (index == _projects.length) {
            // Load more indicator
            if (_loading) {
              return Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: CircularProgressIndicator(),
                ),
              );
            }
            return Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: ElevatedButton(
                  onPressed: () => _fetchProjects(loadMore: true),
                  child: Text('Load More'),
                ),
              ),
            );
          }

          final project = _projects[index];
          return _buildProjectCard(project);
        },
      ),
    );
  }

  Widget _buildProjectCard(PreConProject project) {
    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        leading: project.images.isNotEmpty
            ? Image.network(
                project.images.first,
                width: 60,
                height: 60,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Icon(Icons.home);
                },
              )
            : Icon(Icons.home),
        title: Text(
          project.projectName,
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (project.location.city != null)
              Text('📍 ${project.location.city}'),
            if (project.pricing.starting != null)
              Text(
                '💰 \$${project.pricing.starting!.toStringAsFixed(0)}',
                style: TextStyle(color: Colors.green),
              ),
          ],
        ),
        trailing: project.featured
            ? Icon(Icons.star, color: Colors.amber)
            : null,
        onTap: () {
          // Navigate to project details
          // Navigator.push(context, MaterialPageRoute(
          //   builder: (context) => ProjectDetailsScreen(project: project),
          // ));
        },
      ),
    );
  }
}
```

### Example: Filter Projects

```dart
Future<void> _searchProjects({
  String? city,
  String? propertyType,
  bool? featured,
}) async {
  try {
    setState(() => _loading = true);
    
    final response = await _service.getProjects(
      city: city,
      propertyType: propertyType,
      featured: featured,
      page: 1,
      limit: 20,
    );

    if (response.success && response.data != null) {
      setState(() {
        _projects = response.data!.projects;
        _loading = false;
      });
    }
  } catch (e) {
    setState(() {
      _error = e.toString();
      _loading = false;
    });
  }
}
```

---

## 📍 Available Endpoints

### 1. Health Check

**Endpoint:** `GET /api/v1/health`

**Response:**
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

**Usage:**
```dart
final healthService = HealthService();
final response = await healthService.checkHealth();
if (response.success) {
  print('API is healthy: ${response.data?.status}');
  print('Database: ${response.data?.database}');
}
```

---

### 2. Pre-Construction Projects

**Endpoint:** `GET /api/v1/pre-con-projects`

**Query Parameters:**
- `city` (string, optional) - Filter by city
- `status` (string, optional) - Filter by status
- `propertyType` (string, optional) - Filter by property type
- `subPropertyType` (string, optional) - Filter by sub property type
- `completionYear` (string, optional) - Filter by completion year
- `developer` (string, optional) - Filter by developer
- `featured` (boolean, optional) - Filter featured projects
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20) - Items per page

**Response:**
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
          "address": "123 Main St",
          "city": "Toronto",
          "state": "ON",
          "zip": "M5H 1A1",
          "neighborhood": "Downtown",
          "coordinates": {
            "lat": 43.6532,
            "lng": -79.3832
          }
        },
        "pricing": {
          "starting": 500000,
          "ending": 800000,
          "range": {
            "min": 500000,
            "max": 800000
          },
          "avgPricePerSqft": 750
        },
        "status": "Pre-construction",
        "completion": {
          "date": "2025-12-31",
          "progress": 0
        },
        "details": {
          "propertyType": "Condo",
          "subPropertyType": "High-Rise",
          "bedroomRange": "1-3",
          "bathroomRange": "1-2",
          "sqftRange": "600-1200",
          "totalUnits": 200,
          "availableUnits": 150,
          "storeys": 30,
          "height": "300ft"
        },
        "amenities": ["Gym", "Pool", "Concierge"],
        "features": ["Balcony", "Parking"],
        "images": ["https://..."],
        "videos": [],
        "featured": true
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

**Usage Examples:**

```dart
// Get all projects
final response = await _service.getProjects();

// Filter by city
final response = await _service.getProjects(city: 'Toronto');

// Filter by multiple criteria
final response = await _service.getProjects(
  city: 'Toronto',
  propertyType: 'Condo',
  featured: true,
  page: 1,
  limit: 10,
);

// Pagination
final response = await _service.getProjects(
  page: 2,
  limit: 20,
);
```

---

## 🔐 Authentication

### Setting Auth Token

```dart
final apiClient = ApiClient();
apiClient.setAuthToken('your-jwt-token-here');
```

### Using with State Management

```dart
// In your auth service/store
class AuthService {
  final ApiClient _apiClient = ApiClient();
  
  Future<void> login(String email, String password) async {
    // Your login logic
    final token = 'jwt-token-from-login';
    _apiClient.setAuthToken(token);
    // Store token locally
    await storage.write(key: 'authToken', value: token);
  }
  
  Future<void> loadStoredToken() async {
    final token = await storage.read(key: 'authToken');
    if (token != null) {
      _apiClient.setAuthToken(token);
    }
  }
}
```

---

## 🎯 Error Handling

### Handling API Errors

```dart
try {
  final response = await _service.getProjects();
  
  if (response.success) {
    // Use response.data
    final projects = response.data?.projects ?? [];
  } else {
    // Handle API error
    final errorCode = response.error?.code;
    final errorMessage = response.error?.message;
    
    if (errorCode == 'NOT_FOUND') {
      // Handle not found
    } else if (errorCode == 'UNAUTHORIZED') {
      // Handle unauthorized - redirect to login
    } else {
      // Show error message
      showError(errorMessage ?? 'Unknown error');
    }
  }
} catch (e) {
  // Handle network errors
  if (e is DioException) {
    if (e.type == DioExceptionType.connectionTimeout) {
      showError('Connection timeout. Please check your internet.');
    } else if (e.type == DioExceptionType.receiveTimeout) {
      showError('Request timeout. Please try again.');
    } else {
      showError('Network error: ${e.message}');
    }
  } else {
    showError('Error: $e');
  }
}
```

---

## 📊 Response Format

All endpoints return this consistent format:

```dart
ApiResponse<T> {
  success: bool          // true if successful
  data: T?               // Your data (if success)
  error: ApiError?       // Error info (if failed)
  meta: Meta?            // Metadata (pagination, timestamp, version)
}
```

**Success Response:**
```dart
ApiResponse(
  success: true,
  data: PreConProjectsData(projects: [...]),
  error: null,
  meta: Meta(
    pagination: Pagination(page: 1, limit: 20, total: 100, totalPages: 5),
    timestamp: "2024-01-15T10:30:00.000Z",
    version: "v1"
  )
)
```

**Error Response:**
```dart
ApiResponse(
  success: false,
  data: null,
  error: ApiError(
    code: "NOT_FOUND",
    message: "Resource not found"
  ),
  meta: Meta(...)
)
```

---

## ✅ Best Practices

### 1. Error Handling

Always check `response.success` before using `response.data`:

```dart
if (response.success && response.data != null) {
  // Safe to use response.data
} else {
  // Handle error
  showError(response.error?.message);
}
```

### 2. Loading States

Show loading indicators during API calls:

```dart
setState(() => _loading = true);
try {
  final response = await _service.getProjects();
  // Handle response
} finally {
  setState(() => _loading = false);
}
```

### 3. Pagination

Use pagination for large lists:

```dart
int _currentPage = 1;
bool _hasMore = true;

Future<void> loadMore() async {
  if (!_hasMore || _loading) return;
  
  final response = await _service.getProjects(page: _currentPage + 1);
  if (response.success && response.data != null) {
    _projects.addAll(response.data!.projects);
    _currentPage++;
    _hasMore = response.meta?.pagination?.page ?? 0 < 
                response.meta?.pagination?.totalPages ?? 0;
  }
}
```

### 4. Caching

Consider caching responses for offline support:

```dart
import 'package:shared_preferences/shared_preferences.dart';

Future<void> cacheProjects(List<PreConProject> projects) async {
  final prefs = await SharedPreferences.getInstance();
  final json = projects.map((p) => p.toJson()).toList();
  await prefs.setString('cached_projects', jsonEncode(json));
}
```

---

## 🐛 Troubleshooting

### CORS Errors

If you get CORS errors, ensure your API's CORS configuration includes your app's origin. Contact backend team to add your domain.

### Network Timeout

Increase timeout if needed:

```dart
_dio = Dio(BaseOptions(
  connectTimeout: const Duration(seconds: 30), // Increase from 10
  receiveTimeout: const Duration(seconds: 30),
));
```

### SSL Errors

Ensure you're using `https://` not `http://` in the base URL.

---

## 📚 Quick Reference

### API Base URL
```
https://summitly.vercel.app/api/v1
```

### Available Endpoints
- `GET /health` - Health check
- `GET /pre-con-projects` - List projects (with filters & pagination)

### Response Structure
```dart
ApiResponse<T> {
  success: bool
  data: T?
  error: ApiError?
  meta: Meta?
}
```

---

**Ready to integrate?** Copy the code above and start using the API in your Flutter app! 🚀
