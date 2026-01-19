# Performance Fix: Commercial Property Search

## Problem
User reported "car wash properties near Yonge and Bloor" took 5+ minutes and returned irrelevant results (parking lot, warehouse instead of car wash).

### Root Causes
1. **Sequential Multi-City Search**: Searches Toronto → North York → Scarborough → Vaughan → Markham → Etobicoke → Mississauga sequentially (7 cities × 100 properties each = slow)
2. **No Early Termination**: Continues searching all cities even after finding results
3. **No Keyword Relevance Scoring**: Parking lot ranks same as car wash
4. **No Convertible Property Suggestions**: Doesn't show retail/service spaces that could be converted to car wash
5. **No Timeout Enforcement**: No maximum search time limit

## Solutions Implemented

### 1. Early Termination (CRITICAL)
```python
# Stop after finding 10-15 relevant properties
if len(matched_properties) >= 15:
    logger.info(f"✅ [EARLY TERMINATION] Found {len(matched_properties)} properties - stopping search")
    break  # Don't search remaining cities
```

### 2. Keyword Relevance Scoring
```python
def calculate_relevance_score(property_data: Dict, search_keywords: List[str]) -> int:
    """
    Calculate relevance score based on keyword matching.
    
    Args:
        property_data: Property dictionary
        search_keywords: Keywords from user query (e.g., ['car', 'wash'])
    
    Returns:
        Relevance score (0-100)
    """
    score = 0
    description = str(property_data.get('description', '')).lower()
    property_type = str(property_data.get('propertyType', '')).lower()
    
    # Exact keyword match in description
    for keyword in search_keywords:
        if keyword.lower() in description:
            score += 20
    
    # Related business type matching
    business_keywords = {
        'car wash': ['auto', 'automotive', 'service', 'detailing', 'wash'],
        'restaurant': ['food', 'dining', 'kitchen', 'cafe', 'bar'],
        'retail': ['store', 'shop', 'boutique', 'outlet'],
        'office': ['workspace', 'suite', 'commercial', 'professional']
    }
    
    # Check for related keywords
    for main_keyword in search_keywords:
        related = business_keywords.get(main_keyword, [])
        for related_kw in related:
            if related_kw in description or related_kw in property_type:
                score += 10
    
    return min(score, 100)
```

### 3. Convertible Property Suggestions
```python
def find_convertible_properties(
    properties: List[Dict],
    target_business: str
) -> List[Dict]:
    """
    Find properties that could be converted to target business type.
    
    Args:
        properties: List of all properties
        target_business: Target business type (e.g., 'car wash')
    
    Returns:
        List of convertible properties with conversion notes
    """
    convertible = []
    
    conversion_map = {
        'car wash': ['retail', 'service', 'automotive', 'parking lot', 'warehouse'],
        'restaurant': ['retail', 'cafe', 'bar', 'commercial'],
        'gym': ['warehouse', 'retail', 'commercial'],
        'bakery': ['cafe', 'retail', 'restaurant']
    }
    
    convertible_types = conversion_map.get(target_business.lower(), [])
    
    for prop in properties:
        prop_type = str(prop.get('propertyType', '')).lower()
        description = str(prop.get('description', '')).lower()
        
        # Check if property type is convertible
        is_convertible = any(conv_type in prop_type or conv_type in description 
                            for conv_type in convertible_types)
        
        if is_convertible:
            prop_copy = prop.copy()
            prop_copy['conversion_note'] = f"Could be converted to {target_business}"
            prop_copy['is_convertible'] = True
            convertible.append(prop_copy)
    
    return convertible
```

### 4. Timeout Enforcement
```python
import time

start_time = time.time()
MAX_SEARCH_TIME = 30  # 30 seconds maximum

for city in cities_to_search:
    # Check timeout
    if time.time() - start_time > MAX_SEARCH_TIME:
        logger.warning(f"⏰ [TIMEOUT] Search exceeded {MAX_SEARCH_TIME}s - returning {len(properties)} properties")
        break
    
    # Search city...
```

### 5. Response Message Updates
```python
# When exact matches found
if len(exact_matches) > 0:
    response = f"I found {len(exact_matches)} {business_type} properties near {location}."

# When no exact matches but convertible properties available
elif len(convertible_properties) > 0:
    response = (
        f"I couldn't find any {business_type} properties currently listed, "
        f"but I found {len(convertible_properties)} properties that could be converted. "
        f"These include retail spaces, service locations, and commercial properties suitable for conversion."
    )
    properties_to_return = convertible_properties[:10]

# When no properties found at all
else:
    response = f"I couldn't find any {business_type} properties or convertible spaces in {location} right now."
```

## Implementation Plan

### Phase 1: Early Termination (IMMEDIATE - 5 minutes)
- Add counter for matched properties
- Break loop after 15 properties found
- Test with "car wash properties near Yonge and Bloor"

### Phase 2: Timeout Enforcement (IMMEDIATE - 5 minutes)
- Add time tracking
- Break loop after 30 seconds
- Log timeout warnings

### Phase 3: Convertible Suggestions (HIGH PRIORITY - 30 minutes)
- Implement conversion map
- Add filtering logic
- Update response messages
- Test with various business types

### Phase 4: Relevance Scoring (MEDIUM PRIORITY - 1 hour)
- Implement scoring function
- Sort properties by relevance
- Prioritize high-scoring properties

## Expected Results

### Before Fix
- Search time: 5+ minutes
- Results: Parking lot, warehouse (irrelevant)
- User experience: "User will lose interest"

### After Fix
- Search time: <30 seconds
- Results: Car wash properties OR convertible retail/service spaces
- User experience: Fast, relevant results with alternatives

## Testing Commands

```bash
# Test 1: Car wash search (original issue)
curl -X POST http://localhost:5050/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "perf_test_1",
    "message": "Car wash properties near Yonge and Bloor"
  }'

# Test 2: Restaurant search
curl -X POST http://localhost:5050/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "perf_test_2",
    "message": "Show me restaurant properties in Toronto"
  }'

# Test 3: Retail search with early termination
curl -X POST http://localhost:5050/chat \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "perf_test_3",
    "message": "Retail properties near downtown Toronto"
  }'
```

## Success Criteria

✅ Search completes in <30 seconds
✅ Returns relevant properties (exact or convertible)
✅ Shows conversion suggestions when exact match not found
✅ Doesn't search all 7 cities unnecessarily
✅ User stays engaged (doesn't lose interest)

## Files to Modify

1. **services/chatbot_orchestrator.py**
   - Add early termination logic (lines ~5360-5470)
   - Add timeout enforcement
   - Update response messages

2. **services/property_relevance_scorer.py** (NEW FILE)
   - Create relevance scoring utility
   - Implement conversion map
   - Add business type matching

3. **services/commercial_search_optimizer.py** (NEW FILE)
   - Implement fast search strategy
   - Handle early termination
   - Manage convertible property suggestions

## Priority Order

1. **CRITICAL**: Early termination + timeout (fixes 5-minute issue)
2. **HIGH**: Convertible suggestions (shows alternatives when exact match missing)
3. **MEDIUM**: Relevance scoring (improves result quality)

---

**Status**: READY TO IMPLEMENT
**Estimated Time**: 1-2 hours total
**Impact**: High (fixes critical UX issue)
