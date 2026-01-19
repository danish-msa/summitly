# Condo Assistant - Complete Documentation

## Overview

The Condo Assistant is a production-ready condo property search and management system that follows the `voice_assistant_clean.py` architecture. It handles **60+ condo-specific MLS fields** with dedicated handlers for each field type.

## Architecture

### Based on voice_assistant_clean.py
- ✅ Repliers API integration (CondoProperty class)
- ✅ Standardized property data extraction
- ✅ AI-powered natural language understanding
- ✅ Robust error handling and logging
- ✅ Flask API endpoints
- ✅ Field-specific handlers for all MLS fields

### Key Differences from voice_assistant_clean.py
1. **Condo-Only**: Searches exclusively for `CondoProperty` class
2. **60+ MLS Field Handlers**: Dedicated handler classes for each field type
3. **Condo-Specific Filters**: Floor level, amenities, pet policy, etc.
4. **Building Amenities**: Gym, pool, concierge, rooftop, etc.
5. **Maintenance Fees**: Tracking and filtering by monthly maintenance costs

## File Structure

```
app/
├── condo_assistant.py       # Core condo search engine (60+ field handlers)
├── condo_api.py              # Flask API endpoints
└── voice_assistant_clean.py  # Base architecture reference

test_condo_assistant.py       # Comprehensive test suite
```

## MLS Field Handlers

### Handler Architecture

Every MLS field has a dedicated handler class that implements:
- `extract()` - Extract value from raw property data
- `validate()` - Validate field value
- `format()` - Format value for display
- `search_filter()` - Filter properties by this field
- `matches()` - Check if value matches filter

### Handler Types

1. **StringFieldHandler** - Text fields (building name, unit number, etc.)
2. **NumberFieldHandler** - Numeric fields (price, maintenance fee, sqft, etc.)
3. **BooleanFieldHandler** - True/false fields (pets, balcony, elevator, etc.)
4. **ArrayFieldHandler** - List fields (amenities, appliances, features, etc.)
5. **AddressFieldHandler** - Special handler for address object

### All 60+ MLS Fields

#### Core Identification (3 fields)
- `mlsNumber` - MLS Listing Number
- `listingId` - Unique Listing ID
- `status` - Listing Status

#### Location (11 fields)
- `address` - Complete Address Object
  - `streetNumber` - Street Number
  - `streetName` - Street Name
  - `streetDirectionPrefix` - Direction Prefix (N, S, E, W)
  - `streetDirection` - Direction Suffix
  - `unitNumber` - Unit/Apartment Number
  - `city` - City/Municipality
  - `province` - Province/State
  - `postalCode` - Postal Code
  - `neighborhood` - Neighborhood Name
  - `area` - Area/District
  - `community` - Community Name

#### Building Information (4 fields)
- `buildingName` - Building/Complex Name
- `level` - Floor Level/Number
- `unitNumber` - Unit/Suite Number
- `exposure` - Unit Exposure (N, S, E, W)

#### Condo Corporation & Management (3 fields)
- `condoCorp` - Condo Corporation Number
- `condoRegistryOffice` - Condo Registry Office
- `propertyManagement` - Property Management Company

#### Financial (6 fields)
- `listPrice` - Listing Price
- `maintenanceFee` - Monthly Maintenance Fee
- `maintenanceIncludes` - Services Included in Maintenance Fee
- `specialAssessment` - Special Assessment Amount
- `propertyTaxes` - Annual Property Taxes
- `taxYear` - Tax Assessment Year

#### Physical Characteristics (5 fields)
- `bedrooms` - Number of Bedrooms
- `bathrooms` - Number of Bathrooms
- `sqft` - Square Footage
- `numRooms` - Total Number of Rooms
- `numKitchens` - Number of Kitchens

#### Interior Features (5 fields)
- `interiorFeatures` - Interior Features List
- `flooring` - Flooring Type
- `ceilingHeight` - Ceiling Height
- `appliances` - Included Appliances
- `laundryLevel` - Laundry Location

#### Condo-Specific Features (4 fields)
- `balcony` - Balcony Available
- `balconySize` - Balcony Size (sqft)
- `locker` - Storage Locker Available
- `lockerNumber` - Locker Number

#### Parking (5 fields)
- `totalParking` - Total Parking Spaces
- `garage` - Garage Available
- `garageType` - Garage Type
- `garageSpaces` - Number of Garage Spaces
- `visitorParking` - Visitor Parking Available

#### Building Amenities (8 fields)
- `condoAmenities` - Building Amenities List
- `gym` - Gym/Fitness Center
- `pool` - Swimming Pool
- `concierge` - Concierge Service
- `partyRoom` - Party Room
- `rooftop` - Rooftop Access
- `security` - Security System
- `elevator` - Elevator

#### Systems & Utilities (3 fields)
- `heatSource` - Heat Source
- `heatType` - Heat Type
- `airConditioning` - Air Conditioning

#### Restrictions & Policies (3 fields)
- `petsPermitted` - Pets Permitted
- `nonSmoking` - Non-Smoking Policy
- `accessibilityFeatures` - Accessibility Features

#### Lease/Rental (11 fields)
- `leaseType` - Lease/Rent Type
- `leasePrice` - Monthly Lease Price
- `leaseTerm` - Lease Term (months)
- `contractCommencement` - Contract Start Date
- `expiryDate` - Lease Expiry Date
- `possessionDate` - Possession Date
- `includedInLease` - Utilities/Services Included
- `rentalApplicationRequired` - Rental Application Required
- `depositRequired` - Deposit Required
- `creditCheck` - Credit Check Required

#### View & Exterior (3 fields)
- `view` - View Type (City, Water, Park)
- `waterfront` - Waterfront Property
- `exteriorFeatures` - Exterior Features

#### Listing Information (3 fields)
- `listDate` - Listing Date
- `daysOnMarket` - Days on Market

#### Remarks & Descriptions (4 fields)
- `comments` - General Comments
- `clientRemarks` - Remarks for Clients
- `inclusions` - Inclusions
- `exclusions` - Exclusions

#### Images & Media (2 fields)
- `images` - Property Images
- `virtualTourUrl` - Virtual Tour URL

**Total: 60+ MLS Fields**

## API Endpoints

### 1. Search Condo Properties

```bash
POST /api/condo/search
```

**Request Body:**
```json
{
  "query": "2 bedroom condo in Toronto with gym",
  "city": "Toronto",
  "bedrooms": 2,
  "bathrooms": 2,
  "min_price": 400000,
  "max_price": 600000,
  "min_sqft": 700,
  "max_sqft": 1200,
  "floor_level_min": 10,
  "pets_permitted": true,
  "amenities": ["gym", "pool"],
  "limit": 20
}
```

**Response:**
```json
{
  "success": true,
  "properties": [...],
  "total": 25,
  "criteria": {...},
  "message": "Found 25 condo properties"
}
```

### 2. Get MLS Field Definitions

```bash
GET /api/condo/fields
```

**Response:**
```json
{
  "success": true,
  "fields": {
    "mlsNumber": {
      "description": "MLS Listing Number",
      "type": "string",
      "required": true
    },
    ...
  },
  "total_fields": 60
}
```

### 3. Extract Criteria from Natural Language

```bash
POST /api/condo/extract-criteria
```

**Request Body:**
```json
{
  "query": "2 bedroom pet-friendly condo in Toronto with gym and pool"
}
```

**Response:**
```json
{
  "success": true,
  "query": "2 bedroom pet-friendly condo in Toronto with gym and pool",
  "criteria": {
    "city": "Toronto",
    "bedrooms": 2,
    "pets_permitted": true,
    "amenities": ["gym", "pool"]
  },
  "message": "Extracted 4 criteria"
}
```

### 4. Standardize Property Data

```bash
POST /api/condo/standardize
```

**Request Body:**
```json
{
  "property": {
    "mlsNumber": "C12345678",
    "price": 599000,
    "details": {
      "numBedrooms": 2,
      "numBathrooms": 2
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "property": {
    "mlsNumber": "C12345678",
    "listPrice": 599000,
    "bedrooms": 2,
    "bathrooms": 2,
    ...
  },
  "fields_extracted": 45
}
```

### 5. Health Check

```bash
GET /api/condo/health
```

**Response:**
```json
{
  "success": true,
  "service": "Condo Assistant API",
  "status": "healthy",
  "total_mls_fields": 60
}
```

## Usage Examples

### Python Code

```python
from app.condo_assistant import (
    search_condo_properties,
    extract_condo_criteria_with_ai,
    standardize_condo_property
)

# 1. Extract criteria from natural language
criteria = extract_condo_criteria_with_ai(
    "2 bedroom pet-friendly condo in Toronto with gym and balcony"
)
# Returns: {'city': 'Toronto', 'bedrooms': 2, 'pets_permitted': True, 'amenities': ['Gym'], 'balcony': True}

# 2. Search for condos
result = search_condo_properties(
    city="Toronto",
    bedrooms=2,
    min_price=400000,
    max_price=600000,
    pets_permitted=True,
    amenities=["Gym", "Pool"],
    limit=20
)

# 3. Standardize property data
raw_property = {...}  # Raw API response
standardized = standardize_condo_property(raw_property)
# Returns: {mlsNumber, listPrice, bedrooms, bathrooms, ...} (60+ fields)
```

### cURL Examples

```bash
# Search condos
curl -X POST http://localhost:5051/api/condo/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "2 bedroom condo in Toronto with gym",
    "max_price": 600000,
    "pets_permitted": true
  }'

# Get field definitions
curl http://localhost:5051/api/condo/fields

# Extract criteria
curl -X POST http://localhost:5051/api/condo/extract-criteria \
  -H "Content-Type: application/json" \
  -d '{
    "query": "luxury condo on 20th floor with city view and pool"
  }'
```

## Testing

Run the comprehensive test suite:

```bash
cd "c:\PropertyCH\Summitly v2\Summitly-AI-"
python test_condo_assistant.py
```

**Tests include:**
1. MLS field handler validation (60+ fields)
2. Property standardization
3. AI criteria extraction
4. Condo-specific filters
5. Repliers API search

## Condo-Specific Filters

### Floor Level Filter
```python
from app.condo_assistant import filter_by_floor_level

# Filter condos on floor 20 or higher
high_floor_condos = filter_by_floor_level(properties, min_level=20)
```

### Pet Policy Filter
```python
from app.condo_assistant import filter_by_pets

# Filter pet-friendly condos
pet_friendly = filter_by_pets(properties, pets_allowed=True)
```

### Amenities Filter
```python
from app.condo_assistant import filter_by_amenities

# Filter condos with gym AND pool
luxury_condos = filter_by_amenities(properties, required_amenities=["Gym", "Pool"])
```

## Integration with voice_assistant_clean.py

The condo assistant can be integrated into voice_assistant_clean.py:

```python
# In voice_assistant_clean.py

from app.condo_assistant import search_condo_properties, extract_condo_criteria_with_ai

@app.route('/api/condo-search', methods=['POST'])
def condo_search_endpoint():
    """Condo-specific search endpoint"""
    data = request.json
    query = data.get('message')
    
    # Extract criteria using AI
    criteria = extract_condo_criteria_with_ai(query)
    
    # Search condos
    result = search_condo_properties(**criteria, limit=10)
    
    return jsonify(result)
```

## Running the API Server

### Standalone Mode
```bash
cd "c:\PropertyCH\Summitly v2\Summitly-AI-"
python app/condo_api.py
```

Server runs on: `http://localhost:5051`

### Integrated Mode
Add to voice_assistant_clean.py:
```python
from app.condo_api import condo_api
app.register_blueprint(condo_api)
```

## Environment Variables

Required in `.env` file:

```env
REPLIERS_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here
```

## Error Handling

All functions return structured responses:

```python
{
    "success": True/False,
    "error": "Error message (if failed)",
    "properties": [...],
    "total": 0
}
```

## Performance Optimizations

1. **Early Termination**: Stops after finding sufficient properties
2. **Field Handler Caching**: Handlers initialized once at startup
3. **AI Rate Limiting**: Limited AI calls for relevance checking
4. **Efficient Filtering**: Multi-stage filtering (API → Python → AI)

## Comparison with voice_assistant_clean.py

| Feature | voice_assistant_clean.py | condo_assistant.py |
|---------|-------------------------|-------------------|
| Property Types | All (Residential, Commercial, Condo) | Condo Only |
| MLS Fields | ~30 generic fields | 60+ condo-specific fields |
| Field Handlers | Generic standardization | Dedicated handler classes |
| Condo Filters | Basic | Advanced (floor, pets, amenities) |
| Building Amenities | Not specialized | Full amenity filtering |
| Maintenance Fees | Not tracked | Full financial tracking |
| Pet Policy | Not specialized | Dedicated pet filter |
| Floor Level | Not specialized | Dedicated floor filter |

## Future Enhancements

1. **Virtual Tour Integration**: Embed 3D tours
2. **Maintenance Fee Analysis**: Trend analysis over time
3. **Amenity Recommendations**: AI-powered amenity suggestions
4. **Comparable Analysis**: Compare similar condos
5. **Investment Analysis**: ROI calculations for condo investments

## Support

For issues or questions:
- Check test suite: `python test_condo_assistant.py`
- Review logs: Check console output for detailed error messages
- API documentation: `GET /api/condo/fields` for field reference

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: January 2026
