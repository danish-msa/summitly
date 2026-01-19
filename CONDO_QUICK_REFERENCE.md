# Condo Assistant - Quick Reference Guide

## 🚀 Quick Start

### 1. Import and Use
```python
from app.condo_assistant import search_condo_properties, extract_condo_criteria_with_ai

# Search condos with AI extraction
criteria = extract_condo_criteria_with_ai("2 bedroom condo in Toronto with gym")
result = search_condo_properties(**criteria, limit=10)
```

### 2. Run API Server
```bash
cd "c:\PropertyCH\Summitly v2\Summitly-AI-"
python app/condo_api.py
```

### 3. Run Tests
```bash
python test_condo_assistant.py
```

## 📋 60+ MLS Fields Organized by Category

### 🏢 **Building & Unit** (11 fields)
```python
- buildingName          # "Harbour Plaza Tower 1"
- level                 # 25 (floor number)
- unitNumber            # "2505"
- exposure              # "South" (N/S/E/W)
- condoCorp             # "YRCC 1234"
- condoRegistryOffice   # "Toronto Registry"
- propertyManagement    # "FirstService Residential"
```

### 💰 **Financial** (6 fields)
```python
- listPrice             # 599000
- maintenanceFee        # 650 (monthly)
- maintenanceIncludes   # ["Heat", "Water", "Hydro"]
- specialAssessment     # 5000 (one-time)
- propertyTaxes         # 3500 (annual)
- taxYear               # 2025
```

### 🛏️ **Physical Space** (10 fields)
```python
- bedrooms              # 2
- bathrooms             # 2
- sqft                  # 850
- numRooms              # 5
- numKitchens           # 1
- balcony               # True
- balconySize           # 120 (sqft)
- locker                # True
- lockerNumber          # "L-42"
- ceilingHeight         # "9 feet"
```

### 🏋️ **Amenities** (8 fields)
```python
- condoAmenities        # ["Gym", "Pool", "Concierge"]
- gym                   # True
- pool                  # True
- concierge             # True
- partyRoom             # True
- rooftop               # True
- security              # True
- elevator              # True
```

### 🚗 **Parking** (5 fields)
```python
- totalParking          # 2
- garage                # True
- garageType            # "Underground"
- garageSpaces          # 1
- visitorParking        # True
```

### 🏠 **Interior** (8 fields)
```python
- interiorFeatures      # ["Hardwood", "Granite", "SS Appliances"]
- flooring              # "Hardwood"
- appliances            # ["Fridge", "Stove", "Dishwasher"]
- laundryLevel          # "In Unit"
- heatSource            # "Natural Gas"
- heatType              # "Forced Air"
- airConditioning       # "Central"
- accessibilityFeatures # ["Wheelchair Accessible"]
```

### 🐕 **Policies** (3 fields)
```python
- petsPermitted         # True
- nonSmoking            # True
- accessibilityFeatures # ["Wheelchair Ramp"]
```

### 🌆 **View & Location** (3 fields)
```python
- view                  # "City" / "Water" / "Park"
- waterfront            # True
- exteriorFeatures      # ["Balcony", "Terrace"]
```

### 📄 **Lease/Rental** (11 fields)
```python
- leaseType             # "Month-to-Month" / "1 Year"
- leasePrice            # 2500 (monthly)
- leaseTerm             # 12 (months)
- contractCommencement  # "2025-02-01"
- expiryDate            # "2026-02-01"
- possessionDate        # "2025-02-01"
- includedInLease       # ["Heat", "Water"]
- rentalApplicationRequired  # True
- depositRequired       # True
- creditCheck           # True
```

### 📝 **Listing Details** (6 fields)
```python
- mlsNumber             # "C12345678"
- listDate              # "2025-01-15"
- status                # "Active"
- daysOnMarket          # 5
- comments              # "Stunning condo..."
- inclusions            # "All appliances"
```

## 🔧 Handler Classes

### Every field has 5 methods:

```python
handler = CONDO_FIELD_HANDLERS['bedrooms']

# 1. Extract value from raw data
value = handler.extract(property_data)

# 2. Validate value
is_valid = handler.validate(value)

# 3. Format for display
formatted = handler.format(value)

# 4. Filter properties
filtered = handler.search_filter(properties, filter_value)

# 5. Check if matches
matches = handler.matches(prop_value, filter_value)
```

## 🎯 Common Use Cases

### Use Case 1: Pet-Friendly Condos
```python
result = search_condo_properties(
    city="Toronto",
    bedrooms=2,
    pets_permitted=True,
    max_price=600000,
    limit=10
)
```

### Use Case 2: High Floor with View
```python
result = search_condo_properties(
    city="Toronto",
    floor_level_min=20,
    amenities=["Gym", "Pool"],
    limit=10
)
```

### Use Case 3: Luxury with Amenities
```python
result = search_condo_properties(
    city="Toronto",
    bedrooms=2,
    bathrooms=2,
    min_price=800000,
    amenities=["Gym", "Pool", "Concierge", "Rooftop"],
    limit=10
)
```

### Use Case 4: Budget Friendly
```python
result = search_condo_properties(
    city="Toronto",
    bedrooms=1,
    max_price=400000,
    limit=10
)
```

### Use Case 5: Natural Language
```python
# AI extracts: city, bedrooms, pets_permitted, amenities
criteria = extract_condo_criteria_with_ai(
    "2 bedroom pet-friendly condo in Toronto with gym and parking"
)
result = search_condo_properties(**criteria, limit=10)
```

## 📡 API Endpoints

### Search
```bash
POST /api/condo/search
{
  "query": "2 bed condo in Toronto with gym",
  "max_price": 600000,
  "pets_permitted": true
}
```

### Get Fields
```bash
GET /api/condo/fields
# Returns all 60+ field definitions
```

### Extract Criteria
```bash
POST /api/condo/extract-criteria
{
  "query": "luxury condo on 20th floor with city view"
}
```

### Health Check
```bash
GET /api/condo/health
```

## 🔍 Filters

### Floor Level
```python
from app.condo_assistant import filter_by_floor_level

# Condos on floor 20+
high_floors = filter_by_floor_level(properties, min_level=20)
```

### Pet Policy
```python
from app.condo_assistant import filter_by_pets

# Pet-friendly only
pet_friendly = filter_by_pets(properties, pets_allowed=True)
```

### Amenities
```python
from app.condo_assistant import filter_by_amenities

# Must have Gym AND Pool
luxury = filter_by_amenities(properties, required_amenities=["Gym", "Pool"])
```

## 🧪 Testing

```bash
# Run full test suite
python test_condo_assistant.py

# Tests include:
# 1. 60+ Field Handler Validation
# 2. Property Standardization
# 3. AI Criteria Extraction
# 4. Condo-Specific Filters
# 5. Repliers API Search
```

## 🎨 Field Handler Types

| Type | Examples | Features |
|------|----------|----------|
| **StringFieldHandler** | buildingName, unitNumber | Case-insensitive matching |
| **NumberFieldHandler** | listPrice, maintenanceFee | Range support (min/max) |
| **BooleanFieldHandler** | balcony, petsPermitted | True/False filtering |
| **ArrayFieldHandler** | amenities, appliances | "Contains any" matching |
| **AddressFieldHandler** | address object | Smart formatting |

## 💡 Tips

### 1. Always Use Standardization
```python
# ❌ Don't use raw data
bedrooms = raw_property['details']['numBedrooms']  # Might fail

# ✅ Use standardized data
standardized = standardize_condo_property(raw_property)
bedrooms = standardized['bedrooms']  # Always works
```

### 2. Leverage AI Extraction
```python
# ❌ Manual parsing
query = "2 bed condo with gym"
bedrooms = 2 if "2 bed" in query else None

# ✅ AI extraction
criteria = extract_condo_criteria_with_ai(query)
# Returns: {'bedrooms': 2, 'amenities': ['gym']}
```

### 3. Chain Filters
```python
# Apply multiple filters
result = search_condo_properties(city="Toronto", bedrooms=2, limit=100)
properties = result['properties']

# Then filter by floor
properties = filter_by_floor_level(properties, min_level=15)

# Then filter by pets
properties = filter_by_pets(properties, pets_allowed=True)

# Then filter by amenities
properties = filter_by_amenities(properties, required_amenities=["Gym"])
```

## 📊 Response Structure

All functions return consistent structure:

```python
{
    "success": True,           # Boolean
    "properties": [...],       # List of standardized properties
    "total": 25,              # Total count
    "raw_count": 100,         # Before filtering (if applicable)
    "error": "..."            # Error message (if failed)
}
```

## 🌟 Key Advantages

1. **60+ Field Coverage**: Every MLS field has a handler
2. **Type Safety**: Dedicated handlers for each field type
3. **Validation**: Built-in validation for all fields
4. **Formatting**: Consistent display formatting
5. **Filtering**: Field-specific filtering logic
6. **AI-Powered**: Natural language criteria extraction
7. **Robust**: Based on production-tested voice_assistant_clean.py
8. **Condo-Specific**: Amenities, floor level, pet policy, etc.

## 🔗 Integration

### With voice_assistant_clean.py
```python
# Add to voice_assistant_clean.py
from app.condo_api import condo_api

app.register_blueprint(condo_api)

# Now available at:
# POST /api/condo/search
# GET /api/condo/fields
# etc.
```

## 📚 Documentation

- Full docs: `CONDO_ASSISTANT_DOCUMENTATION.md`
- Test file: `test_condo_assistant.py`
- Core code: `app/condo_assistant.py`
- API endpoints: `app/condo_api.py`

---

**Quick Reference Version 1.0**  
**Last Updated: January 2026**
