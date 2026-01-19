# Comprehensive 60+ Field Handling Strategy
## Universal Edge Case Management for Condo Search

## Overview
This document outlines the comprehensive handling strategy for all 60+ condo-specific MLS fields, ensuring robust search results with intelligent fallbacks when exact matches aren't found.

---

## 🎯 Core Philosophy

**NEVER return 0 results when properties exist nearby**

For EVERY field type, implement:
1. **Exact Match** - Try precise matching first
2. **Fuzzy Match** - Handle typos, variations, synonyms
3. **Partial Match** - Relax constraints progressively
4. **Smart Fallback** - Show nearby alternatives
5. **Clear Communication** - Explain what was found vs. requested

---

## 📊 Field Categories & Handling Strategies

### **Category 1: Location Fields** (10 fields)
**Fields**: city, neighborhood, intersection, street_name, postal_code, area, community, building_name

**Strategy**: Geographic Expansion Fallback
```
Level 1: Exact match (e.g., "Yorkville")
Level 2: Fuzzy match (e.g., "yorkville" → "Yorkville", "york ville")
Level 3: Nearby neighborhoods (e.g., "Yorkville" → "Downtown", "Midtown")
Level 4: City-wide search (e.g., show all Toronto condos)
Level 5: Adjacent cities (e.g., Toronto → North York, Mississauga)
```

**Implementation**:
- Normalize typos (Younge→Yonge, King→Kings)
- Use Levenshtein distance for fuzzy matching
- Maintain neighborhood proximity map
- Expand radius progressively (1km → 3km → 5km → city-wide)

---

### **Category 2: Numeric Range Fields** (12 fields)
**Fields**: bedrooms, bathrooms, sqft, floor_level, parking_spaces, maintenance_fee, property_taxes, price, balcony_size

**Strategy**: Progressive Range Expansion
```
Level 1: Exact match (e.g., bedrooms = 2)
Level 2: ±1 tolerance (e.g., 1-3 bedrooms)
Level 3: Similar properties (e.g., 2 bed → show 1 bed with den)
Level 4: Remove constraint entirely
```

**Implementation**:
```python
def smart_numeric_match(requested, available, field_type):
    # Exact match
    if available == requested:
        return {"match": "exact", "score": 100}
    
    # Within tolerance
    tolerance = TOLERANCES.get(field_type, 1)
    if abs(available - requested) <= tolerance:
        return {"match": "close", "score": 90}
    
    # Acceptable alternative
    if is_acceptable_alternative(requested, available, field_type):
        return {"match": "alternative", "score": 70}
    
    # No match
    return {"match": "none", "score": 0}

TOLERANCES = {
    "bedrooms": 1,           # 2 bed → accept 1-3 bed
    "bathrooms": 0.5,        # 2 bath → accept 1.5-2.5 bath
    "sqft": 200,             # 800 sqft → accept 600-1000 sqft
    "floor_level": 5,        # 15th floor → accept 10-20 floors
    "parking_spaces": 0,     # 1 space → must have 1+ (strict)
    "maintenance_fee": 200,  # $800/mo → accept $600-$1000/mo
    "price": 50000,          # $500k → accept $450k-$550k
}
```

---

### **Category 3: Boolean Fields** (15 fields)
**Fields**: pets_permitted, balcony, locker, gym, pool, concierge, elevator, waterfront, furnished, non_smoking, security, rooftop, party_room

**Strategy**: Must-Have vs. Nice-to-Have Classification
```
MUST_HAVE: pets_permitted, parking (if car owner)
NICE_TO_HAVE: gym, pool, concierge, rooftop

Level 1: All must-haves + all nice-to-haves
Level 2: All must-haves + 80% nice-to-haves
Level 3: All must-haves only
Level 4: Show properties explaining missing features
```

**Implementation**:
```python
def classify_boolean_requirements(criteria):
    must_have = []
    nice_to_have = []
    
    for field, value in criteria.items():
        if field in CRITICAL_BOOLEANS and value:
            must_have.append(field)
        elif value:
            nice_to_have.append(field)
    
    return must_have, nice_to_have

CRITICAL_BOOLEANS = ["pets_permitted", "elevator", "wheelchair_accessible"]

def match_boolean_requirements(property, must_have, nice_to_have):
    # MUST pass all critical requirements
    for field in must_have:
        if not property.get(field):
            return {"match": False, "score": 0, "reason": f"Missing required: {field}"}
    
    # Score based on nice-to-haves
    matched_nice = sum(1 for field in nice_to_have if property.get(field))
    score = 100 if not nice_to_have else (matched_nice / len(nice_to_have)) * 100
    
    return {"match": True, "score": score, "matched": matched_nice, "total": len(nice_to_have)}
```

---

### **Category 4: String/Enum Fields** (18 fields)
**Fields**: view, exposure, laundry_level, flooring, heat_type, air_conditioning, garage_type, lease_type, style, property_type

**Strategy**: Synonym Expansion + Fuzzy Matching
```
Level 1: Exact match (e.g., "Lake View")
Level 2: Synonym match (e.g., "Lake" → "Water", "Waterfront")
Level 3: Partial match (e.g., "View" → any property with view)
Level 4: Remove constraint
```

**Implementation**:
```python
FIELD_SYNONYMS = {
    "view": {
        "lake": ["water", "waterfront", "lake view", "lake ontario"],
        "city": ["skyline", "downtown", "urban"],
        "park": ["greenspace", "ravine", "nature"],
    },
    "exposure": {
        "south": ["s", "southern", "south facing"],
        "north": ["n", "northern", "north facing"],
    },
    "laundry_level": {
        "in unit": ["ensuite", "in-unit", "in suite"],
        "in building": ["shared", "common"],
    },
    "heat_type": {
        "radiant": ["floor heating", "underfloor"],
        "forced air": ["hvac", "central air"],
    },
}

def smart_string_match(requested, available, field_type):
    # Normalize
    req_lower = requested.lower().strip()
    avail_lower = str(available).lower().strip()
    
    # Exact match
    if req_lower == avail_lower:
        return {"match": "exact", "score": 100}
    
    # Synonym match
    synonyms = FIELD_SYNONYMS.get(field_type, {}).get(req_lower, [])
    if any(syn in avail_lower for syn in synonyms):
        return {"match": "synonym", "score": 90}
    
    # Partial match
    if req_lower in avail_lower or avail_lower in req_lower:
        return {"match": "partial", "score": 70}
    
    # Fuzzy match (Levenshtein distance)
    similarity = calculate_similarity(req_lower, avail_lower)
    if similarity > 0.8:
        return {"match": "fuzzy", "score": 80}
    
    return {"match": "none", "score": 0}
```

---

### **Category 5: Array Fields** (8 fields)
**Fields**: amenities, interior_features, exterior_features, appliances, maintenance_includes, accessibility_features

**Strategy**: Partial Match with Prioritization
```
Level 1: ALL items present (100% match)
Level 2: 80%+ items present (good match)
Level 3: 50%+ items present (acceptable match)
Level 4: ANY item present (weak match)
Level 5: Similar alternatives suggested
```

**Implementation**:
```python
def smart_array_match(requested_items, available_items, field_type):
    if not requested_items:
        return {"match": "no_requirement", "score": 100}
    
    # Normalize
    req_normalized = [item.lower().strip() for item in requested_items]
    avail_normalized = [item.lower().strip() for item in available_items]
    
    # Calculate matches with synonym expansion
    matches = 0
    for req in req_normalized:
        # Direct match
        if req in avail_normalized:
            matches += 1
            continue
        
        # Synonym match
        synonyms = get_array_item_synonyms(req, field_type)
        if any(syn in avail_normalized for syn in synonyms):
            matches += 1
            continue
    
    match_percentage = (matches / len(req_normalized)) * 100
    
    if match_percentage == 100:
        return {"match": "complete", "score": 100}
    elif match_percentage >= 80:
        return {"match": "good", "score": 90}
    elif match_percentage >= 50:
        return {"match": "partial", "score": 70}
    elif match_percentage > 0:
        return {"match": "weak", "score": 50}
    else:
        return {"match": "none", "score": 0}

ARRAY_ITEM_SYNONYMS = {
    "amenities": {
        "gym": ["fitness center", "workout room", "exercise room"],
        "pool": ["swimming pool", "indoor pool", "lap pool"],
        "concierge": ["24hr security", "doorman", "front desk"],
    },
    "appliances": {
        "dishwasher": ["built-in dishwasher", "dishwashing machine"],
        "washer": ["washing machine", "w/d", "laundry"],
    },
}
```

---

## 🔄 Universal Fallback Pipeline

### Step-by-Step Fallback for ANY Field Combination

```python
class UniversalCondoSearchFallback:
    """
    Handles intelligent fallbacks for all 60+ condo fields.
    Guarantees non-zero results when properties exist.
    """
    
    def search_with_fallback(self, criteria: Dict) -> Dict:
        """
        Progressive fallback strategy for comprehensive field support.
        
        Args:
            criteria: All search criteria (60+ possible fields)
        
        Returns:
            {
                "properties": [...],
                "match_level": "exact|relaxed|fallback",
                "relaxed_constraints": [list of fields that were relaxed],
                "message": "user-friendly explanation"
            }
        """
        
        # LEVEL 1: Try exact match
        results = self._search_exact(criteria)
        if len(results) >= MIN_RESULTS:
            return {
                "properties": results,
                "match_level": "exact",
                "message": f"Found {len(results)} properties matching all your criteria"
            }
        
        # LEVEL 2: Relax non-critical constraints
        relaxed_criteria, relaxed_fields = self._relax_non_critical(criteria)
        results = self._search_exact(relaxed_criteria)
        if len(results) >= MIN_RESULTS:
            return {
                "properties": results,
                "match_level": "relaxed",
                "relaxed_constraints": relaxed_fields,
                "message": f"Found {len(results)} properties. Relaxed: {', '.join(relaxed_fields)}"
            }
        
        # LEVEL 3: Expand geographic scope
        expanded_criteria = self._expand_location(relaxed_criteria)
        results = self._search_exact(expanded_criteria)
        if len(results) >= MIN_RESULTS:
            return {
                "properties": results,
                "match_level": "geographic_expansion",
                "message": f"Found {len(results)} properties in nearby areas"
            }
        
        # LEVEL 4: Keep only critical fields (bedrooms, price, pets)
        critical_criteria = self._extract_critical_only(criteria)
        results = self._search_exact(critical_criteria)
        if len(results) >= MIN_RESULTS:
            removed = set(criteria.keys()) - set(critical_criteria.keys())
            return {
                "properties": results,
                "match_level": "critical_only",
                "message": f"Found {len(results)} properties matching essential criteria"
            }
        
        # LEVEL 5: Location-only search (last resort)
        location = criteria.get("location", criteria.get("city"))
        if location:
            results = self._search_by_location_only(location)
            return {
                "properties": results[:20],
                "match_level": "location_only",
                "message": f"Showing {len(results)} available condos in {location}"
            }
        
        # LEVEL 6: Emergency fallback - show popular condos
        return {
            "properties": self._get_popular_condos(limit=10),
            "match_level": "popular",
            "message": "Here are some popular condo properties you might like"
        }
    
    def _relax_non_critical(self, criteria: Dict) -> Tuple[Dict, List[str]]:
        """
        Relax nice-to-have constraints while keeping must-haves.
        
        Priority Order (keep these):
        1. pets_permitted (if specified)
        2. bedrooms (±1)
        3. price range (±10%)
        4. location
        
        Relax (in this order):
        1. Specific amenities → general building quality
        2. Floor level → any floor
        3. View type → any view
        4. Exposure → any exposure
        5. Maintenance fee limit → higher tolerance
        """
        relaxed = criteria.copy()
        relaxed_fields = []
        
        # Relax amenities (keep critical ones only)
        if "amenities" in relaxed and len(relaxed["amenities"]) > 2:
            critical_amenities = [a for a in relaxed["amenities"] if a in CRITICAL_AMENITIES]
            if critical_amenities != relaxed["amenities"]:
                relaxed["amenities"] = critical_amenities
                relaxed_fields.append("some amenities")
        
        # Relax floor level
        if "floor_level_min" in relaxed:
            original = relaxed["floor_level_min"]
            relaxed["floor_level_min"] = max(1, original - 5)
            relaxed_fields.append(f"floor level (now {relaxed['floor_level_min']}+)")
        
        # Relax view requirement
        if "view" in relaxed:
            del relaxed["view"]
            relaxed_fields.append("view type")
        
        # Relax exposure
        if "exposure" in relaxed:
            del relaxed["exposure"]
            relaxed_fields.append("unit exposure")
        
        # Increase maintenance fee tolerance
        if "maintenance_fee_max" in relaxed:
            relaxed["maintenance_fee_max"] = int(relaxed["maintenance_fee_max"] * 1.2)
            relaxed_fields.append("maintenance fee limit")
        
        return relaxed, relaxed_fields
    
    def _expand_location(self, criteria: Dict) -> Dict:
        """Expand geographic scope to nearby areas"""
        expanded = criteria.copy()
        
        location = criteria.get("location", criteria.get("city", "")).lower()
        
        # Neighborhood → City
        if location in NEIGHBORHOOD_TO_CITY:
            expanded["location"] = NEIGHBORHOOD_TO_CITY[location]
            return expanded
        
        # City → Metropolitan Area
        if location in CITY_TO_METRO:
            expanded["location_list"] = CITY_TO_METRO[location]
            del expanded["location"]
            return expanded
        
        return expanded
    
    def _extract_critical_only(self, criteria: Dict) -> Dict:
        """Keep only critical search criteria"""
        critical = {}
        
        CRITICAL_FIELDS = [
            "location", "city",
            "bedrooms",  # ±1 tolerance
            "min_price", "max_price",  # ±10% tolerance
            "pets_permitted",  # If specified, must match
            "wheelchair_accessible",  # If specified, must match
        ]
        
        for field in CRITICAL_FIELDS:
            if field in criteria:
                critical[field] = criteria[field]
        
        # Add tolerance to numeric fields
        if "bedrooms" in critical:
            critical["bedrooms_min"] = max(0, critical["bedrooms"] - 1)
            critical["bedrooms_max"] = critical["bedrooms"] + 1
        
        if "min_price" in critical:
            critical["min_price"] = int(critical["min_price"] * 0.9)
        
        if "max_price" in critical:
            critical["max_price"] = int(critical["max_price"] * 1.1)
        
        return critical


# Constants
MIN_RESULTS = 10
CRITICAL_AMENITIES = ["gym", "elevator", "concierge"]
CRITICAL_BOOLEANS = ["pets_permitted", "elevator", "wheelchair_accessible"]

NEIGHBORHOOD_TO_CITY = {
    "yorkville": "Toronto",
    "liberty village": "Toronto",
    "distillery district": "Toronto",
    "downtown": "Toronto",
    # ... add more
}

CITY_TO_METRO = {
    "toronto": ["Toronto", "North York", "Scarborough", "Etobicoke", "Mississauga"],
    "ottawa": ["Ottawa", "Gatineau", "Kanata"],
    "vancouver": ["Vancouver", "Burnaby", "Richmond", "Surrey"],
}
```

---

## 📝 User Communication Strategy

### Message Templates for Each Fallback Level

```python
MESSAGE_TEMPLATES = {
    "exact": "✅ Found {count} condos matching all your criteria!",
    
    "relaxed": "📊 Found {count} condos. We relaxed: {relaxed_list} to show you more options.",
    
    "geographic_expansion": "🗺️ No exact matches in {original_area}, but found {count} great condos in nearby {expanded_area}.",
    
    "critical_only": "🎯 Showing {count} condos matching your essential requirements: {critical_list}.",
    
    "location_only": "📍 Here are {count} available condos in {location}. Let me know if you'd like to add specific requirements!",
    
    "alternative_suggestion": "💡 I couldn't find condos with {missing_features}, but here are {count} similar properties. Would you like to adjust your criteria?",
}

def generate_user_message(match_level, data):
    """Generate friendly, informative message for user"""
    template = MESSAGE_TEMPLATES.get(match_level, "Found {count} properties")
    return template.format(**data)
```

---

## 🧪 Testing Strategy

### Test Every Field Category

```python
TEST_CASES = {
    "location": [
        "typo: Toront → Toronto",
        "neighborhood: Yorkville → Toronto",
        "intersection: Yonge & Bloor",
        "non-existent: Mars City",
    ],
    
    "numeric": [
        "exact: bedrooms=2",
        "range: 600-800 sqft",
        "extreme: floor_level_min=50",
        "impossible: price=0",
    ],
    
    "boolean": [
        "required: pets_permitted=true",
        "combination: gym + pool + concierge",
        "rare: rooftop + waterfront",
    ],
    
    "string": [
        "exact: view='Lake'",
        "synonym: view='Water' → Lake",
        "typo: exposure='Sourth' → South",
    ],
    
    "array": [
        "all: amenities=[gym, pool, concierge, rooftop]",
        "partial: amenities=[gym, pool]",
        "synonyms: appliances=['W/D'] → washer/dryer",
    ],
}
```

---

## 🚀 Implementation Checklist

- [ ] Implement `UniversalCondoSearchFallback` class
- [ ] Add synonym dictionaries for all string/enum fields
- [ ] Create tolerance mappings for all numeric fields
- [ ] Build neighborhood/city relationship maps
- [ ] Implement Levenshtein distance for fuzzy matching
- [ ] Add comprehensive logging for debugging
- [ ] Create user-friendly message generation
- [ ] Write unit tests for each field category
- [ ] Test with 100+ real-world queries
- [ ] Document all fallback strategies
- [ ] Add performance monitoring
- [ ] Create admin dashboard for fallback analytics

---

## 📈 Success Metrics

1. **Zero Result Rate**: < 1% (down from current X%)
2. **Exact Match Rate**: > 60%
3. **Relaxed Match Rate**: > 30%
4. **Average Fallback Levels**: < 2
5. **User Satisfaction**: > 90% (from feedback)

---

## 🎓 Examples of Comprehensive Handling

### Example 1: Complex Multi-Field Query
```
Query: "2 bedroom pet-friendly condo in Yorkville with lake view, 
        south exposure, parking, gym, and pool, under $3000/month, 
        15th floor or higher"

Fields Extracted (12):
- bedrooms: 2
- pets_permitted: true
- location: "Yorkville" → "Toronto"
- view: "Lake"
- exposure: "South"
- parking_spaces: 1
- gym: true
- pool: true
- max_price: 3000
- floor_level_min: 15
- listing_type: "rent"

Fallback Strategy:
Level 1: Try exact (0 results)
Level 2: Relax view + exposure (5 results) ✓
Message: "Found 5 pet-friendly 2-bedroom condos in Yorkville with gym, 
         pool, and parking under $3000/month on 15+ floors. Some don't 
         have lake views or south exposure."
```

### Example 2: Impossible Combination
```
Query: "Studio condo with 3 parking spaces, rooftop pool, 
        penthouse level, under $1500/month in downtown Toronto"

Fallback Strategy:
Level 1: Exact match (0 results - impossible combination)
Level 2: Relax parking (3 spaces → 1 space) (0 results)
Level 3: Relax penthouse + rooftop (0 results)
Level 4: Keep studio + price + location (15 results) ✓
Message: "Found 15 studio condos under $1500/month in downtown Toronto. 
         However, condos with 3 parking spaces and rooftop pools are 
         typically much higher priced. Would you like to adjust your budget 
         or parking requirements?"
```

---

## 🔧 Configuration

```python
# config/search_config.py

SEARCH_CONFIG = {
    "min_results_target": 10,
    "max_fallback_levels": 5,
    "enable_fuzzy_matching": True,
    "fuzzy_threshold": 0.8,
    "enable_synonym_expansion": True,
    "enable_geographic_expansion": True,
    "max_geographic_expansion_km": 10,
    "numeric_tolerance_multiplier": 1.0,
    "array_match_threshold": 0.5,  # 50% match minimum
    "enable_ai_relevance_check": True,
    "max_ai_relevance_checks": 50,
}
```
