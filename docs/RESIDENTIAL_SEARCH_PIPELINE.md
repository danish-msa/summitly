# Residential Property Search Pipeline - Integration Summary

## Overview

This document summarizes the comprehensive residential property search pipeline that has been created and integrated with the chatbot orchestrator.

## Files Created

### 1. `/services/residential_filter_mapper.py` (936 lines)
**Purpose**: Comprehensive filter mapping between natural language/internal filters and Repliers API.

**Key Components**:
- `ResidentialFilters` dataclass with 90+ filter fields covering:
  - Property basics (class, type, style, ownership)
  - Location (city, neighborhood, postal code, street, geo coords)
  - Price (list, sold, per sqft)
  - Rooms (beds, baths, total rooms)
  - Size (sqft, lot size, frontage, depth)
  - Parking (spaces, garage type, driveway)
  - Building (year built, basement, construction, heating/cooling)
  - Condo-specific (maintenance fee, exposure, balcony, locker, amenities)
  - Features (pool, waterfront, utilities)
  - Dates (list date, sold date, DOM)
  - MLS/rental specific fields

- `ResidentialFilterExtractor` class for NLP parsing
- `build_residential_api_params()` function for API parameter conversion
- Comprehensive mapping dictionaries (property types, styles, basements, etc.)

### 2. `/services/residential_search_service.py` (707 lines)
**Purpose**: High-level search service with convenience methods.

**Key Methods**:
- `search(filters, limit)` - Main search method
- `search_condos(city, bedrooms, max_price)` - Condo-specific search
- `search_houses(city, bedrooms)` - House-specific search
- `search_rentals(city, max_rent)` - Rental search
- `search_sold(city, property_type)` - Recently sold properties
- `search_with_natural_language(query)` - NLP query parsing
- `get_listing_details(mls_number)` - MLS lookup

### 3. `/services/residential_chatbot_integration.py` (734 lines)
**Purpose**: Integration layer between ResidentialPropertySearchService and chatbot orchestrator.

**Key Components**:
- `StateToFiltersConverter` - Converts ConversationState to ResidentialFilters
- `ResidentialSearchIntegration` - Main integration class
- `RESIDENTIAL_FILTERS_EXTENSION` - Extended GPT prompt documentation
- `search_residential_properties()` - Convenience function for orchestrator
- `get_extended_gpt_prompt()` - Returns extended filter documentation

### 4. `/tests/test_residential_search_pipeline.py` (22 tests)
**Purpose**: Core pipeline tests.

**Test Coverage**:
- Filter extraction from natural language
- API parameter building
- Real API search calls
- Edge cases

### 5. `/tests/test_residential_chatbot_integration.py` (36 tests)
**Purpose**: Chatbot integration tests with various prompts.

**Test Coverage**:
- State-to-filter conversion
- GPT prompt extensions
- Extended filter extraction
- Natural language query handling
- End-to-end search pipeline
- Multiple prompt scenarios

### 6. `/scripts/demo_residential_search.py`
**Purpose**: Demo script to showcase the complete pipeline.

## Orchestrator Integration

### Changes to `/services/chatbot_orchestrator.py`:

1. **Added Import** (line 88-94):
```python
from services.residential_chatbot_integration import (
    search_residential_properties,
    get_extended_gpt_prompt,
    get_residential_integration,
    RESIDENTIAL_FILTERS_EXTENSION,
)
```

2. **Extended GPT Interpreter Prompt** (lines 189-230):
Added comprehensive documentation for extended residential filters including:
- basement_type, garage_type, garage_spaces
- heating_type, cooling_type
- pool, waterfront, fireplace
- maintenance_fee_max, condo_exposure, floor_level
- has_balcony, has_locker, is_new_listing
- condo_amenities, property_style, year_built_min/max

3. **Extended Filter Extraction** (lines 353-395):
Added extended filter examples in the prompt for GPT to understand.

4. **Search Integration** (lines 2848-2889):
Added conditional logic to use the new residential search service:
```python
use_residential_service = os.getenv("USE_RESIDENTIAL_SEARCH", "true").lower() == "true"

if use_residential_service:
    # Extract GPT extended filters
    # Call search_residential_properties()
else:
    # Fall back to legacy enhanced_mls_service
```

## Configuration

### Environment Variable
```bash
# Enable/disable residential search service (default: true)
USE_RESIDENTIAL_SEARCH=true
```

## Filter Categories Supported

### Property Basics
- `property_class`: residential
- `property_type`: condo, house, townhouse, semi-detached, detached, duplex, triplex, etc.
- `property_style`: bungalow, 2-storey, 3-storey, split-level, loft, bachelor, etc.
- `ownership_type`: freehold, condo, co-operative, leasehold, etc.

### Building Features
- `basement_type`: finished, unfinished, walkout, apartment, separate_entrance
- `construction_type`: brick, stone, vinyl, stucco, wood, concrete
- `heating_type`: forced_air, radiant, geo_thermal, heat_pump, baseboard
- `cooling_type`: central_air, window_ac, none, heat_pump, ductless
- `has_fireplace`: true/false
- `min_year_built`/`max_year_built`: year range

### Parking
- `garage_type`: attached, detached, underground, built-in, carport, none
- `garage_spaces`: number
- `min_parking_spaces`/`max_parking_spaces`: range
- `driveway`: paved, gravel, concrete, interlocking

### Condo Features
- `max_maintenance`: monthly maintenance fee limit
- `exposure`: north, south, east, west
- `floor_level`: specific floor or minimum
- `balcony`: Yes/No or type (terrace, juliet)
- `locker`: Yes/No
- `building_amenities`: gym, concierge, party_room, etc.

### Outdoor/Lot Features
- `has_pool`: true/false
- `pool`: type (inground, above_ground, indoor)
- `waterfront`: true/false
- `min_lot_size`/`max_lot_size`: lot size range

### Status & Timing
- `status`: A (active), U (under contract)
- `min_list_date`/`max_list_date`: listing date range
- `min_dom`/`max_dom`: days on market range

## Usage Examples

### From ConversationState (Chatbot)
```python
from services.residential_chatbot_integration import search_residential_properties

state = ConversationState(session_id="user-123")
state.location_state = LocationState(city="Toronto")
state.property_type = "condo"
state.bedrooms = 2
state.price_range = (500000, 800000)

results = search_residential_properties(
    state=state,
    user_message="2 bed condo with pool",
    gpt_filters={"has_pool": True, "floor_level_min": 10},
    limit=20
)
```

### Direct Search
```python
from services.residential_search_service import get_residential_search_service
from services.residential_filter_mapper import ResidentialFilters

service = get_residential_search_service()
filters = ResidentialFilters()
filters.city = "Toronto"
filters.property_type = "Condo Apt"
filters.min_bedrooms = 2
filters.max_price = 700000
filters.has_pool = True

results = service.search(filters=filters, limit=20)
```

### Natural Language Search
```python
from services.residential_search_service import get_residential_search_service

service = get_residential_search_service()
results = service.search_with_natural_language(
    "3 bedroom house in Mississauga with pool under 1.2 million"
)
```

## Testing

Run all tests:
```bash
# Core pipeline tests (22 tests)
pytest tests/test_residential_search_pipeline.py -v

# Chatbot integration tests (36 tests)
pytest tests/test_residential_chatbot_integration.py -v

# All tests
pytest tests/test_residential*.py -v
```

## Demo

```bash
python scripts/demo_residential_search.py
```

## Notes

1. **API Limitation**: Repliers API only supports status 'A' (Active) and 'U' (Under Contract). Sold properties must be searched using the `lastStatus` field.

2. **Property Type Normalization**: Property types are automatically normalized to Repliers API format (e.g., "condo" → "Condo Apt", "house" → "Detached").

3. **Feature Flag**: The residential search service can be disabled by setting `USE_RESIDENTIAL_SEARCH=false` in environment variables. The system will fall back to the legacy `enhanced_mls_service`.

4. **Backwards Compatibility**: The integration is designed to work alongside the existing chatbot infrastructure without breaking any current functionality.
