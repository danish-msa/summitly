# 🧪 AI Analysis Feature - Quick Test Guide

## Prerequisites

✅ Backend running on port 5050
✅ Frontend running on port 3000
✅ OpenAI API key configured in backend
✅ Repliers API key configured

## Test Scenarios

### Test 1: Button Visibility ✨
**Goal**: Verify AI Analysis button appears on property cards

**Steps**:
1. Navigate to: http://localhost:3000/buy/toronto
2. Scroll to property grid
3. Look at any property card

**Expected**:
- Two buttons at bottom: "✨ AI Analysis" and "View Details"
- Buttons are equal width
- Sparkles icon visible on AI button

**Result**: ✅ PASS / ❌ FAIL

---

### Test 2: Dialog Opens 🪟
**Goal**: Verify clicking button opens analysis dialog

**Steps**:
1. On any property card
2. Click "✨ AI Analysis" button
3. Observe screen

**Expected**:
- Modal dialog opens
- Property summary visible immediately
- Address, price, specs displayed correctly
- Loading spinner appears

**Result**: ✅ PASS / ❌ FAIL

---

### Test 3: AI Analysis Loads 🤖
**Goal**: Verify backend processes analysis request

**Steps**:
1. With dialog open and loading
2. Wait 2-5 seconds
3. Watch for results

**Expected**:
- Loading spinner disappears
- Valuation section appears with:
  - Estimated value
  - Value range
  - Confidence score
- Investment insights list appears
- Market analysis paragraph appears
- (Optional) Comparable properties appear

**Result**: ✅ PASS / ❌ FAIL

---

### Test 4: Error Handling ⚠️
**Goal**: Verify graceful failure if backend unavailable

**Steps**:
1. Stop backend: Close Python window or run `.\stop.ps1`
2. Click "✨ AI Analysis" on a property
3. Wait for response

**Expected**:
- Error message appears in dialog
- "Try Again" button visible
- No crash or blank screen

**Result**: ✅ PASS / ❌ FAIL

---

### Test 5: Dialog Actions 🎯
**Goal**: Verify dialog action buttons work

**Steps**:
1. With analysis results displayed
2. Test both buttons:
   - Click "Close" → Dialog should close
   - Click "Chat with AI About This Property" → Opens /ai page

**Expected**:
- Close button: Dialog closes smoothly
- Chat button: Opens /ai page in new tab with property context

**Result**: ✅ PASS / ❌ FAIL

---

### Test 6: Multiple Opens 🔄
**Goal**: Verify analysis can be opened multiple times

**Steps**:
1. Open AI Analysis on Property A
2. Close dialog
3. Open AI Analysis on Property B
4. Verify different data

**Expected**:
- Each property shows its own analysis
- No data from previous property
- Loading occurs for each new property

**Result**: ✅ PASS / ❌ FAIL

---

### Test 7: Mobile Responsiveness 📱
**Goal**: Verify works on mobile viewport

**Steps**:
1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Navigate to property card
4. Click AI Analysis

**Expected**:
- Button visible and clickable on mobile
- Dialog responsive (full width on mobile)
- All sections readable
- Scrollable if content exceeds viewport

**Result**: ✅ PASS / ❌ FAIL

---

## Quick Backend Test

### Verify Backend Endpoint Directly

```bash
# Test the backend endpoint
curl -X POST http://127.0.0.1:5050/api/property-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "mls_number": "W12345678",
    "mode": "quick",
    "property": {
      "id": "W12345678",
      "title": "Test Property",
      "price": "$1,000,000",
      "location": "Toronto, ON",
      "bedrooms": 3,
      "bathrooms": 2,
      "sqft": 2000
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "mode": "quick_insights",
  "analysis": {
    "insights": ["...", "...", "..."],
    "valuation": {...},
    "market_analysis": "..."
  }
}
```

---

## PowerShell Quick Test

```powershell
# Check if services are running
Get-Process | Where-Object {$_.ProcessName -eq "python" -or $_.ProcessName -eq "node"}

# Check ports
netstat -ano | Select-String "LISTENING" | Select-String "5050|3000"

# Test backend health
Invoke-RestMethod -Uri "http://127.0.0.1:5050/api/health" -Method Get
```

---

## Troubleshooting

### Issue: Button doesn't appear
**Solution**:
- Verify PropertyCard component is used
- Check browser console for errors
- Refresh page (Ctrl+R)

### Issue: Dialog opens but shows "Failed to generate analysis"
**Solution**:
- Check backend is running (port 5050)
- Verify NEXT_PUBLIC_AI_BACKEND_URL in .env.local
- Check browser Network tab for 500 errors
- View backend terminal for Python errors

### Issue: Long loading time (> 10 seconds)
**Solution**:
- Normal for first request (cold start)
- Check OpenAI API key is valid
- Verify Repliers API key is configured
- Check backend terminal for rate limit errors

### Issue: Dialog closes immediately
**Solution**:
- Check browser console for JavaScript errors
- Verify React state is not conflicting
- Clear browser cache (Ctrl+Shift+R)

---

## Test Checklist Summary

- [ ] AI Analysis button visible on property cards
- [ ] Button has Sparkles icon (✨)
- [ ] Clicking button opens dialog
- [ ] Property summary displays correctly
- [ ] Loading spinner appears
- [ ] Analysis results populate after 2-5 seconds
- [ ] Valuation section shows estimated value
- [ ] Investment insights appear
- [ ] Market analysis shows
- [ ] Comparable properties listed (if available)
- [ ] Close button works
- [ ] "Chat with AI" button opens /ai page
- [ ] Error handling works when backend down
- [ ] Multiple properties can be analyzed
- [ ] Mobile responsive
- [ ] No console errors

---

## Success Criteria

✅ **FEATURE WORKING** if:
- All 7 test scenarios pass
- No critical console errors
- Analysis completes in < 10 seconds
- User experience is smooth

⚠️ **NEEDS ATTENTION** if:
- Some tests fail but core functionality works
- Intermittent errors occur
- Performance is slow but acceptable

❌ **NOT WORKING** if:
- Button doesn't appear
- Dialog doesn't open
- Analysis never completes
- Critical errors in console

---

## Report Results

After testing, report findings:
1. Which tests passed/failed
2. Error messages seen
3. Browser console logs
4. Backend terminal output
5. Performance observations

---

**Last Updated**: February 5, 2026
**Feature**: AI Property Analysis
**Status**: Ready for Testing
