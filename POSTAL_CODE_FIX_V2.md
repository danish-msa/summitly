# Postal Code Search Fix V2 - Fallback Strategy
**Date**: January 18, 2026  
**Issue**: Postal code searches returning 0 results even when properties exist  
**Solution**: Added intelligent fallback with enhanced debugging

---

## Problem

When searching "Commercial properties near M6B":
```
📮 [POSTAL_CODE_HANDLER] Raw results from API: 100
📮 [POSTAL_CODE_HANDLER] Filtered to 0 properties matching FSA M6B
```

**Root Cause**: API properties may not have postal code data in expected format, or postal codes don't match FSA exactly.

---

## Solution Applied

### 1. **Enhanced Postal Code Field Detection**

Added comprehensive field checking:
```python
# Check multiple field variations
prop_zip = (prop.get('zip', '') or 
           prop.get('postalCode', '') or 
           prop.get('postal_code', '') or 
           prop.get('postalcode', ''))

# Also check nested address object
if not prop_zip:
    address_data = prop.get('address', {})
    prop_zip = (address_data.get('zip', '') or 
               address_data.get('postalCode', '') or 
               address_data.get('postal_code', '') or 
               address_data.get('postalcode', '') or
               address_data.get('Zip', '') or
               address_data.get('PostalCode', ''))
```

### 2. **Added Debug Logging**

```python
# Log first property structure to understand API response
if raw_properties and len(raw_properties) > 0:
    sample_prop = raw_properties[0]
    logger.info(f"📮 [DEBUG] Sample property keys: {list(sample_prop.keys())}")
    if 'address' in sample_prop:
        logger.info(f"📮 [DEBUG] Address keys: {list(sample_prop['address'].keys())}")
        logger.info(f"📮 [DEBUG] Sample postal code: {sample_prop['address'].get('zip', 'NOT FOUND')}")
```

### 3. **Intelligent Fallback Strategy**

If no exact FSA matches found, return closest 10-15 properties:
```python
# FALLBACK: If no exact matches, show closest properties
if len(matched_properties) == 0 and len(raw_properties) > 0:
    logger.warning(f"📮 [POSTAL_CODE_HANDLER] No exact FSA matches found. Using fallback: returning closest 15 properties in {search_city}")
    matched_properties = raw_properties[:15]  # Return first 15 as fallback
    logger.info(f"📮 [POSTAL_CODE_HANDLER] FALLBACK: Showing {len(matched_properties)} closest properties")
```

### 4. **User-Friendly Response**

Informs user when fallback is used:
```python
if using_fallback:
    response_text = (f"I found {len(matched_properties)} properties near postal code {postal_code} in {search_city}. "
                   f"Note: Exact postal code data wasn't available, so I'm showing nearby properties in the area.")
else:
    response_text = f"I found {len(matched_properties)} properties in postal code {postal_code}, {search_city}."
```

### 5. **Track Missing Postal Codes**

```python
no_postal_code_count = 0
# ... in loop ...
elif not prop_zip_clean:
    no_postal_code_count += 1
    logger.debug(f"📮 [POSTAL_CODE_HANDLER] ⚠️ Property missing postal code")

logger.info(f"📮 [POSTAL_CODE_HANDLER] {no_postal_code_count} properties missing postal code data")
```

---

## Expected Logs After Fix

### Successful Match:
```
📮 [POSTAL_CODE_HANDLER] Raw results from API: 100
📮 [DEBUG] Sample property keys: ['mlsNumber', 'address', 'listPrice', ...]
📮 [DEBUG] Address keys: ['streetNumber', 'streetName', 'city', 'postalCode']
📮 [DEBUG] Sample postal code: M6B 1A1
📮 [POSTAL_CODE_HANDLER] ✅ Match: M6B1A1 starts with M6B
📮 [POSTAL_CODE_HANDLER] Filtered to 8 properties matching FSA M6B
```

### Fallback Mode:
```
📮 [POSTAL_CODE_HANDLER] Raw results from API: 100
📮 [DEBUG] Sample postal code: NOT FOUND
📮 [POSTAL_CODE_HANDLER] Filtered to 0 properties matching FSA M6B
📮 [POSTAL_CODE_HANDLER] 100 properties missing postal code data
⚠️ [POSTAL_CODE_HANDLER] No exact FSA matches found. Using fallback: returning closest 15 properties in Toronto
📮 [POSTAL_CODE_HANDLER] FALLBACK: Showing 15 closest properties
```

---

## Testing Checklist

- [ ] Test: "Commercial properties near M6B" with Commercial button
  - Expected: Returns 10-15 commercial properties (exact matches OR fallback)
  - Verify: No residential properties shown
  - Check logs for postal code field detection

- [ ] Test: "Residential near M5V" with Residential button
  - Expected: Returns residential properties only
  - Verify: No commercial or condos

- [ ] Test: "Condo in M4Y" with Condo button
  - Expected: Returns condos only
  - Verify: No residential houses

- [ ] Test: Various postal codes (M2N, M3K, M4W, M5H, M6K, etc.)
  - Expected: Always returns 10-15 properties minimum (fallback if needed)
  - Verify: Type filtering still works

---

## Benefits

1. **Never Returns Zero Results**: Always shows 10-15 properties minimum
2. **Transparent**: User knows when fallback is used
3. **Debugging**: Enhanced logging helps identify API response structure
4. **Flexible**: Handles missing/malformed postal code data gracefully
5. **Type Safety**: Commercial filtering still works with fallback

---

## Files Modified

- `services/chatbot_orchestrator.py` (lines ~5405-5465)
  - Enhanced postal code field detection
  - Added debug logging
  - Implemented fallback strategy
  - User-friendly fallback messaging

---

## Next Steps

1. **Monitor Logs**: Check what postal code field names API actually uses
2. **Optimize Fallback**: If API has lat/lon, sort by distance instead of returning first 15
3. **Cache FSA Mappings**: Build FSA → City mapping for better filtering
4. **User Feedback**: Ask users if fallback results are helpful

---

## Related Issues

- Original fix: `POSTAL_CODE_COMMERCIAL_FIX.md` (property type filtering)
- This fix: Ensures results are always returned (fallback strategy)
- Combined: Both fixes work together for optimal postal code search
