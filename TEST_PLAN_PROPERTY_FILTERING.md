# 🧪 TEST PLAN: Property Type & Bedroom Filtering

## Test Scenarios

### **Scenario 1: Property Type Mismatch**
**Query**: "show me detached properties in toronto"  
**Button**: Condo selected  
**Expected Behavior**:
- ✅ System filters out all detached properties
- ✅ Returns 0 results (no detached properties in condo search)
- ✅ Universal fallback may offer condos in Toronto as alternatives
- ✅ Clear messaging: "No detached properties found in condo search"

**Verification**:
```bash
# Check logs for type filter rejections:
grep "TYPE FILTER" logs/voice_assistant.log
# Should see: "❌ [TYPE FILTER] Rejected: type='detached'"
```

---

### **Scenario 2: Bedroom Count Accuracy**
**Query**: "2 bedroom condos in toronto"  
**Button**: Condo selected  
**Expected Results**:
- ✅ 2-bedroom condos (exact match)
- ✅ 3-bedroom condos (tolerance +1)
- ❌ 1-bedroom condos (filtered out)
- ❌ 4+ bedroom condos (filtered out)

**Verification**:
1. Check first 5 results - all should be 2br or 3br
2. Check MLS details - no 6br properties
3. Verify property cards show correct bedroom counts

---

### **Scenario 3: Combined Filters**
**Query**: "2 bhk condos north facing in toronto"  
**Button**: Condo selected  
**Expected Results**:
- ✅ Only condos (no detached/townhouses)
- ✅ 2br or 3br only (not 6br)
- ✅ North exposure where available
- ✅ Fallback may relax exposure if needed

**Verification**:
1. Check property type: All should show "Condo", "Condo Apt", or "Condo/Strata"
2. Check bedrooms: Range 2-3 only
3. Check exposure: Prefer North, but may have others in fallback

---

### **Scenario 4: Edge Case - Missing Bedroom Data**
**Query**: "2 bedroom condos in toronto"  
**Expected Behavior**:
- ❌ Properties without bedroom data are filtered out
- ✅ Only properties with explicit bedroom count shown

---

### **Scenario 5: Property Type Variations**
**Test Queries**:
1. "condo in toronto" → Should return condos only
2. "detached in toronto" (commercial button) → Should route to commercial/residential handler
3. "townhouse in toronto" → Should NOT appear in condo results

---

## Debug Commands

### **Enable Type Filter Logging**
```python
# In app/condo_assistant.py (line ~1090)
# Change:
logger.debug(f"❌ [TYPE FILTER] Rejected...")
# To:
logger.info(f"❌ [TYPE FILTER] Rejected...")
```

### **Check Property Types in Results**
```python
# In browser console after search:
properties.forEach((p, i) => {
    console.log(`${i+1}. ${p.mlsNumber}: Type=${p.propertyType}, Style=${p.style}, Beds=${p.bedrooms}`);
});
```

### **Verify Bedroom Filtering**
```python
# In browser console:
const bedCounts = properties.map(p => p.bedrooms);
console.log('Bedroom counts:', bedCounts);
console.log('Min:', Math.min(...bedCounts), 'Max:', Math.max(...bedCounts));
// For 2br search: Min should be 2, Max should be 3
```

---

## Expected Log Patterns

### **Before Fix** (Problems):
```
✅ [CONDO SEARCH] Found 8318 total condos, processing 100 listings
✅ [CONDO SEARCH] Returning 99 filtered condos
# NO type validation logs
# Result: Mixed detached + condo properties
```

### **After Fix** (Correct):
```
✅ [CONDO SEARCH] Found 8318 total condos, processing 100 listings
❌ [TYPE FILTER] Rejected: type='detached', style='detached', class='residentialproperty'
❌ [TYPE FILTER] Rejected: type='semi-detached', style='semi-detached', class='residentialproperty'
❌ [TYPE FILTER] Rejected: type='townhouse', style='2-storey', class='residentialproperty'
✅ [CONDO SEARCH] Returning 45 filtered condos
# Result: Only actual condos
```

---

## Regression Tests

### **Test 1: Existing Functionality**
Ensure these searches still work correctly:
- ✅ "condos near Yonge and Bloor"
- ✅ "2 bedroom condos under $800k"
- ✅ "condos with gym and pool"
- ✅ "waterfront condos"

### **Test 2: Universal Fallback**
Ensure fallback still activates when needed:
- ✅ "2 bedroom north facing condos" (0 exact matches → relaxes to 2br condos)
- ✅ "condos near Bay Street" (0 street matches → shows Toronto condos)

### **Test 3: State Storage**
Ensure no validation errors:
- ✅ Results limited to 20 items in state storage (previous fix still works)
- ✅ Full results returned to frontend

---

## Success Criteria

### **All Tests Must Pass**:
1. ✅ **No detached properties** in condo search results
2. ✅ **No 6+ bedroom properties** when searching for 2 bedrooms
3. ✅ **No townhouses, duplexes** in condo results
4. ✅ **Bedroom range** is strict: 2br search → 2-3br only
5. ✅ **Property type fields** visible in API response
6. ✅ **No Pydantic errors** (previous fix still working)
7. ✅ **Fallback system** still operational

---

## Deployment Checklist

- [x] Code changes applied to `app/condo_assistant.py`
- [x] Property type validation added (lines ~1054-1090)
- [x] Bedroom filtering updated (lines ~1155-1163)
- [x] Property type output enhanced (lines ~820-825)
- [x] Documentation created (PROPERTY_TYPE_FILTERING_FIX.md)
- [ ] Server restarted
- [ ] Manual testing completed
- [ ] Regression tests passed
- [ ] User acceptance testing

---

## Rollback Plan

If issues arise, revert changes:
```bash
# Revert condo_assistant.py to previous version
git diff app/condo_assistant.py  # Review changes
git checkout HEAD -- app/condo_assistant.py  # Revert if needed
```

---

## Next Steps

1. **Restart Server**: Apply changes by restarting Flask
2. **Test Scenario 1-3**: Verify property type and bedroom filtering
3. **Monitor Logs**: Check for type filter rejections
4. **User Feedback**: Confirm improved search accuracy
