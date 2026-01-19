# Condo Search - Complete Field Reference

## 🎯 All 60+ Condo-Specific Fields Supported

### 📍 Location Fields
- **city**: City name (Toronto, Ottawa, Vancouver, etc.)
- **neighborhood**: Neighborhood name (Yorkville, Downtown, Liberty Village, etc.)
- **building_name**: Building/complex name (One Bloor, Harbour Plaza, etc.)
- **street_name**: Street name
- **intersection**: Street intersection (e.g., "Yonge & Bloor")

### 🏠 Basic Requirements
- **bedrooms**: Number of bedrooms (0 = studio)
- **bathrooms**: Number of bathrooms (1, 1.5, 2, 2.5, etc.)
- **min_price**: Minimum price
- **max_price**: Maximum price
- **min_sqft**: Minimum square footage
- **max_sqft**: Maximum square footage
- **listing_type**: "sale" or "rent"

### 🏢 Floor & Location
- **floor_level_min**: Minimum floor number
- **floor_level_max**: Maximum floor number
- **level**: Exact floor number
- **exposure**: Unit exposure (North, South, East, West, N, S, E, W)
- **view**: View type (City, Water, Park, Lake, Mountain, etc.)
- **waterfront**: Waterfront property (boolean)

### 🚗 Parking & Storage
- **parking_spaces**: Number of parking spaces
- **totalParking**: Total parking spaces
- **garage**: Garage available (boolean)
- **garageType**: Type of garage
- **garageSpaces**: Number of garage spaces
- **locker**: Storage locker available (boolean)
- **lockerNumber**: Locker number
- **visitorParking**: Visitor parking (boolean)

### 🛋️ Unit Features
- **balcony**: Balcony available (boolean)
- **balcony_size**: Balcony size in sqft
- **furnished**: Furnished unit (boolean)
- **laundry_level**: Laundry location ("In Unit", "In Building", "Ensuite")
- **num_kitchens**: Number of kitchens
- **numKitchens**: Number of kitchens
- **numKitchensPlus**: Additional kitchens
- **ceiling_height**: Ceiling height (e.g., "9 ft", "10 ft")
- **flooring**: Flooring type
- **appliances**: Included appliances (array)
- **interiorFeatures**: Interior features (array)

### 🏋️ Building Amenities
- **amenities**: General amenity list (array)
- **condoAmenities**: Building amenities (array)
- **gym**: Gym/fitness center (boolean)
- **pool**: Swimming pool (boolean)
- **concierge**: 24/7 concierge service (boolean)
- **rooftop**: Rooftop terrace/deck (boolean)
- **party_room**: Party room (boolean)
- **partyRoom**: Party room (boolean)
- **elevator**: Elevator (boolean)
- **security**: Security system/guard (boolean)

### 💰 Financial
- **listPrice**: List price
- **maintenanceFee**: Monthly maintenance fee
- **maintenance_fee_max**: Maximum monthly maintenance fee
- **maintenanceIncludes**: Services included in maintenance fee (array)
- **specialAssessment**: Special assessment amount
- **propertyTaxes**: Annual property taxes
- **taxYear**: Tax assessment year

### 🐕 Restrictions & Policies
- **pets_permitted**: Pets allowed (boolean)
- **petsPermitted**: Pets permitted (boolean)
- **non_smoking**: Non-smoking policy (boolean)
- **nonSmoking**: Non-smoking policy (boolean)
- **accessibilityFeatures**: Accessibility features (array)

### 🏗️ Building Information
- **buildingName**: Building/complex name
- **unitNumber**: Unit/suite number
- **condoCorp**: Condo corporation number
- **condoRegistryOffice**: Condo registry office
- **propertyManagement**: Property management company

### 🌡️ Systems & Utilities
- **heatSource**: Heat source type
- **heatType**: Heat type
- **airConditioning**: Air conditioning type
- **centralAirConditioning**: Central AC (boolean)

### 🏞️ Exterior Features
- **exteriorFeatures**: Exterior features (array)
- **exteriorConstruction1**: Exterior construction material
- **exteriorConstruction2**: Secondary exterior material

### 📝 Listing Information
- **status**: Listing status
- **listDate**: Listing date
- **daysOnMarket**: Days on market
- **mlsNumber**: MLS number
- **listingId**: Listing ID

### 📸 Media
- **images**: Property images (array)
- **virtualTourUrl**: Virtual tour URL
- **photoCount**: Number of photos

### 📄 Descriptions
- **comments**: General comments
- **description**: Property description
- **clientRemarks**: Remarks for clients
- **inclusions**: Inclusions
- **exclusions**: Exclusions

## 🔍 Example Queries

### Basic Searches
```
"2 bedroom condo in Toronto under $700K"
"1 bed condo with balcony"
"studio condo downtown"
```

### Location-Specific
```
"condo near Yonge and Bloor"
"condo in Yorkville"
"waterfront condo"
```

### Floor & View
```
"condo on 20th floor or higher"
"penthouse condo"
"condo with lake view"
"south-facing condo"
```

### Amenities
```
"condo with gym and pool"
"luxury condo with concierge"
"condo with rooftop terrace"
```

### Special Features
```
"pet-friendly condo"
"furnished condo"
"condo with parking and locker"
"condo with in-unit laundry"
```

### Combined Criteria
```
"2 bed 2 bath condo with gym, pool, and concierge in Toronto under $600K"
"pet-friendly 1 bedroom condo with balcony and parking near Yonge and Bloor"
"furnished studio with gym on 15th floor or higher"
"luxury waterfront condo with lake view and rooftop access"
```

## 🚀 How It Works

1. **AI Extraction**: GPT-4o-mini extracts ALL relevant fields from natural language
2. **Comprehensive Filtering**: 20+ filter conditions applied to API results
3. **Field Standardization**: 71 MLS field handlers ensure complete data extraction
4. **Smart Matching**: Intersection detection, amenity matching, and more

## 📊 Filter Priority

Filters are applied in this order:
1. Intersection proximity (if specified)
2. Listing type (sale vs rent)
3. Price range
4. Bedrooms/bathrooms
5. Square footage
6. Floor level
7. Pet policy
8. Unit features (balcony, locker, parking)
9. View & exposure
10. Maintenance fee
11. Building amenities (gym, pool, concierge, etc.)

## ✅ Testing

Run comprehensive tests:
```bash
python test_condo_comprehensive.py
```

Run edge case tests:
```bash
python test_condo_edge_cases.py
```

## 🔧 API Integration

The condo search integrates with:
- **Repliers API**: Professional MLS data
- **OpenAI GPT-4o-mini**: Natural language understanding
- **Listings Service**: Standardized property search
- **Field Handlers**: 71 condo-specific field extractors

## 📝 Notes

- **Intersection Search**: Automatically detects street intersections (e.g., "Yonge & Bloor")
- **Amenity Matching**: Supports both specific fields (gym=true) and amenity arrays
- **Price Inference**: "under $X" vs "over $X" automatically set min/max
- **Listing Type**: "rent", "rental", "lease" → listing_type="rent"
- **Studio Detection**: "studio" automatically sets bedrooms=0
- **Penthouse**: Automatically sets floor_level_min=20

## 🎯 Production Ready

✅ All 60+ condo fields supported  
✅ AI-powered extraction  
✅ Comprehensive filtering  
✅ Intersection search  
✅ Image handling (25 images per property)  
✅ Frontend compatibility  
✅ Error handling  
✅ Professional architecture  
