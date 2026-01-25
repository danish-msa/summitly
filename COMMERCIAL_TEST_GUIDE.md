# Commercial Search - Quick Test Guide

## 🚀 Start Server
```bash
cd "c:\PropertyCH\Summitly v2\Summitly-AI-"
python app.py
```

---

## ✅ Quick Tests (5 minutes)

### 1. **City-Specific Test** (Most Important)
```
Query: "office for sale in Toronto under 900k"
Expected: ONLY Toronto properties (no Mississauga, no Vaughan)
Check: Look at addresses - all should say "Toronto"
```

### 2. **Intersection Test**
```
Query: "commercial near Yonge & Eglinton, but not on Yonge Street"
Expected: Properties near intersection, excluding Yonge Street addresses
Check: No addresses contain "Yonge Street" as the street name
```

### 3. **Landmark Test**
```
Query: "retail near Pearson Airport, within 5 km"
Expected: Properties near Mississauga (airport location)
Check: Results mention proximity to airport or nearby area
```

### 4. **Complex Filter Test**
```
Query: "ground-floor retail in Toronto, under $45 per sq ft, min 1200 sqft, food use, near subway"
Expected: Only ground floor properties meeting ALL criteria
Check: All 5 filters applied (ground floor + price + size + food + transit)
```

### 5. **Conversational Test**
```
Step 1: "retail in Toronto under $50/sqft"
Step 2: "only near universities"  
Step 3: "remove Scarborough"

Expected: Each step refines previous results
Check: Final results exclude Scarborough but keep other filters
```

---

## 🎯 Expected Behavior

### ✅ CORRECT:
- Toronto search → **ONLY** Toronto properties
- "not on Yonge Street" → **No** Yonge Street addresses
- "ground floor" → **Rejects** upper floor properties
- Follow-up queries → **Preserves** previous filters

### ❌ WRONG:
- Toronto search → Shows Mississauga properties
- "not on Yonge Street" → Shows Yonge Street properties
- "ground floor" → Shows random floors
- Follow-up queries → Forgets previous context

---

## 📋 All 10 Production Tests

Run these one by one in the browser:

```
1. "near Yonge & Eglinton, not on Yonge Street"
2. "around Pearson Airport, within 5 km"
3. "near M5V, walkable to TTC"
4. "near 401 & Kennedy, Scarborough only"
5. "near Brampton downtown"
6. "ground-floor retail Toronto, under $45/sqft, min 1200 sqft, food use, near subway"
7. "warehouse Mississauga, clear height 28ft+, dock loading, close to 401"
8. "Class A office downtown Toronto, built after 2015, parking included"
9. "commercial condo for sale Vaughan, not lease, under 2.5M, no automotive"
10. "QSR restaurant near University of Toronto, $40-55/sqft, min 1000 sqft, alcohol optional"
```

---

## 🔍 What to Check

For each query, verify:

1. **City Match:**
   - Toronto → ONLY Toronto properties
   - Mississauga → ONLY Mississauga properties
   - No auto-expansion to nearby cities

2. **Filters Applied:**
   - Check descriptions mention criteria
   - Price within range
   - Size within range

3. **Exclusions Work:**
   - "not on X" → No X in results
   - "remove Y" → No Y in results

4. **Conversational Memory:**
   - Follow-up queries preserve context
   - Can refine/add filters
   - Can exclude areas

5. **Response Quality:**
   - Relevant properties shown
   - Honest about limitations
   - No hallucinated information

---

## 🚨 If Something Fails

### Problem: Toronto shows Mississauga properties
**Fix:** Check `search_properties_progressive()` - should NOT have nearby city expansion

### Problem: "not on Yonge Street" still shows Yonge Street
**Fix:** Check `exclude_streets` in scoring function

### Problem: "ground floor" shows any floor
**Fix:** Check `ground_floor` filter in scoring function

### Problem: Follow-up loses context
**Fix:** Check `ConversationContext.update_criteria()` merging logic

---

## ✅ Success Criteria

**Pass if:**
- [ ] City-specific search works (no other cities)
- [ ] Intersection/landmark matching works
- [ ] Exclusions work ("not on X")
- [ ] Complex filters work (5+ criteria)
- [ ] Conversational memory works (follow-ups)

**Ready for production if ALL 5 criteria pass.**

---

## 📞 Quick Validation Commands

After starting server, open browser console and run:

```javascript
// Test 1: City-specific
fetch('/api/chat-gpt4', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'office in Toronto under 900k',
        session_id: 'test_' + Date.now()
    })
}).then(r => r.json()).then(d => {
    console.log('Properties:', d.data.properties.length);
    console.log('Cities:', [...new Set(d.data.properties.map(p => p.city))]);
    // Should show ONLY ["Toronto"]
});

// Test 2: Intersection
fetch('/api/chat-gpt4', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: 'near Yonge & Eglinton, not on Yonge Street',
        session_id: 'test_' + Date.now()
    })
}).then(r => r.json()).then(d => {
    console.log('Streets:', [...new Set(d.data.properties.map(p => p.address))]);
    // Should have NO "Yonge Street" in addresses
});
```

---

## 🎯 Quick Status Check

**5-Minute Test:**
1. Toronto query → Only Toronto? ✅/❌
2. Intersection query → Correct area? ✅/❌
3. "not on X" → X excluded? ✅/❌
4. Complex filters → All applied? ✅/❌
5. Follow-up → Context preserved? ✅/❌

**If all 5 pass → PRODUCTION READY ✅**
