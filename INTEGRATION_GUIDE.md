# Integration Guide: Estimates Service & Market Analysis

## Summary of Changes Needed

###  1. Summitly's Value Integration (`COMPLETED ✅`)

The estimates service import has been added to `voice_assistant_clean.py`:

```python
# Estimates Service Integration (for Summitly's Value)
try:
    from services.estimates_service import estimates_service
    ESTIMATES_SERVICE_AVAILABLE = True
    print("✅ Estimates service loaded")
except ImportError as e:
    ESTIMATES_SERVICE_AVAILABLE = False
    print(f"⚠️ Estimates service not available: {e}")

# Market Analysis Service Integration (for AI Summaries)
try:
    from services.market_analysis_service import market_analysis_service
    MARKET_ANALYSIS_SERVICE_AVAILABLE = True
    print("✅ Market analysis service loaded")
except ImportError as e:
    MARKET_ANALYSIS_SERVICE_AVAILABLE = False
    print(f"⚠️ Market analysis service not available: {e}")
```

### 2. Update `generate_quick_ai_insights` Function (LINE ~1950)

**ADD** market analysis integration after line 1968 (after "sources" assignment):

```python
        # ========== 🧠 ENHANCED AI SUMMARY with Market Analysis ==========
        ai_summary = ""
        if MARKET_ANALYSIS_SERVICE_AVAILABLE:
            try:
                # Extract city from location
                city = location.split(',')[0].strip() if ',' in location else location
                province = 'ON'
                
                print(f"📊 [MARKET ANALYSIS] Fetching market data for {city}, {province}")
                market_data = market_analysis_service.get_market_analysis_for_location(
                    city=city,
                    province=province,
                    mls_number=mls_number
                )
                
                if market_data and market_data.get('success'):
                    stats = market_data.get('statistics', {})
                    analysis_text = market_data.get('analysis', '')
                    
                    # Build enhanced AI summary
                    summary_parts = []
                    summary_parts.append(f"This property in {city} is in a dynamic market.")
                    
                    if stats:
                        avg_price = stats.get('average_price', 0)
                        days_on_market = stats.get('days_on_market', 0)
                        market_condition = stats.get('market_condition', 'Balanced')
                        
                        if days_on_market > 0:
                            pace = "fast" if days_on_market < 20 else "moderate" if days_on_market < 35 else "slower"
                            summary_parts.append(f"Properties are selling at a {pace} pace ({days_on_market:.0f} days on market), indicating a {market_condition.lower()}.")
                    
                    if analysis_text:
                        # Add first 2 sentences from AI analysis
                        analysis_snippet = '. '.join(analysis_text.split('.')[:2]) + '.'
                        summary_parts.append(analysis_snippet)
                    
                    ai_summary = ' '.join(summary_parts)
                    
                    # Add market data to insights
                    market_trend['market_analysis'] = {
                        'statistics': stats,
                        'analysis': analysis_text,
                        'graphs': market_data.get('graphs', [])
                    }
                    print(f"✅ [MARKET ANALYSIS] Enhanced insights with market data")
                else:
                    ai_summary = generate_fallback_ai_summary(property_info, {})
            except Exception as e:
                print(f"❌ [MARKET ANALYSIS] Error: {e}")
                ai_summary = generate_fallback_ai_summary(property_info, {})
        else:
            ai_summary = generate_fallback_ai_summary(property_info, {})
```

**THEN UPDATE** the return statement (around line 1970) to include `ai_summary`:

```python
        return {
            "success": True,
            "mls_number": mls_number,
            "insights": {
                "estimated_value": estimated_value,
                "actual_price": actual_price,
                "schools": schools,
                "neighborhood": neighborhood,
                "connectivity": connectivity,
                "market_trend": market_trend,
                "rental_potential": rental,
                "pros": pros_cons["pros"],
                "cons": pros_cons["cons"],
                "mls_number": mls_number,
                "ai_summary": ai_summary  # ⬅️ ADD THIS LINE
            },
            "sources": sources
        }
```

### 3. Fix [object][object] Bug in Chatbot (LINE ~5800)

In the `chat_gpt4()` function around line 5800, find the multi-location property loop and **UPDATE**:

```python
                    try:
                        # Search this location with preserved filters
                        properties = get_live_properties(
                            city=loc_criteria.get('location', 'Toronto'),
                            max_price=filters.get('max_price'),
                            bedrooms=filters.get('bedrooms'),
                            bathrooms=filters.get('bathrooms'),
                            property_type=filters.get('property_type'),
                            limit=25
                        )
                        
                        if properties:
                            # Fix [object][object] bug - ensure proper string conversion
                            for prop in properties:
                                prop['search_location'] = loc_name
                                # Convert address object to string if needed
                                if isinstance(prop.get('address'), dict):
                                    addr = prop['address']
                                    prop['address_display'] = f"{addr.get('streetNumber', '')} {addr.get('streetName', '')}, {addr.get('city', '')}".strip()
                                elif not isinstance(prop.get('address'), str):
                                    prop['address_display'] = prop.get('title', 'Property')
                                else:
                                    prop['address_display'] = prop.get('address', 'Property')
```

### 4. Fix [object][object] in Frontend Display

In `AiChatAppIntegrated.tsx` (around line 175), **UPDATE**:

```typescript
        // Add properties section if available
        if (response.properties && response.properties.length > 0) {
          assistantMsg.assistant!.sections!.push({
            title: `Found ${response.properties.length} Properties`,
            bullets: response.properties.slice(0, 5).map((p: any) => {
              // Fix [object][object] - extract string properly
              let propertyName = 'Property';
              if (typeof p.address === 'string') {
                propertyName = p.address;
              } else if (p.address_display) {
                propertyName = p.address_display;
              } else if (typeof p.address === 'object' && p.address !== null) {
                propertyName = `${p.address.streetNumber || ''} ${p.address.streetName || ''}, ${p.address.city || ''}`.trim();
              } else if (p.title) {
                propertyName = String(p.title);
              }
              
              const price = typeof p.price === 'number' ? p.price : (p.listPrice || 0);
              return `${propertyName} - $${price.toLocaleString()}`;
            }),
          });
        }
```

## Testing Instructions

1. **Restart Backend**:
   ```powershell
   .\stop.ps1
   .\start.ps1
   ```

2. **Test Summitly's Value**:
   - Open any property detail page
   - Check the price card shows "Summitly's Value"
   - Value should come from `estimates_service` (check console logs for "💰 [SUMMITLY'S VALUE]")

3. **Test AI Summary**:
   - Click "AI Analysis" button on property card
   - AI Summary section should show market-specific insights
   - Check console for "📊 [MARKET ANALYSIS]" logs

4. **Test Chatbot**:
   - Search for properties: "Show me condos in Toronto and Ottawa"
   - Property names should display correctly (not `[object][object]`)
   - Check console logs show "Fix [object][object]" processing

## Expected Console Output

```
✅ Estimates service loaded
✅ Market analysis service loaded
💰 [SUMMITLY'S VALUE] Getting AI-powered estimate for MLS: C1234567
✅ [SUMMITLY'S VALUE] Estimate: $850,000 (confidence: high)
📊 [MARKET ANALYSIS] Fetching market data for Toronto, ON
✅ [MARKET ANALYSIS] Enhanced insights with market data
```

## Rollback Plan

If issues occur, revert by removing the added code sections and restart services.
