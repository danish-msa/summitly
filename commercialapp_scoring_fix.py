#!/usr/bin/env python3
"""
COMMERCIAL SEARCH - RESIDENTIAL PATTERN FIX
===========================================
This file contains the CORRECT scoring logic that matches voice_assistant_clean.py
Replace the broken pre-categorization + fixed-score system with this.

KEY CHANGES:
1. NO pre-categorization (EXACT/POTENTIAL/GENERIC)
2. Score each property by searching ALL its fields
3. Graduated scoring based on actual data matches
4. Field-by-field comparison like residential search
"""

def score_commercial_property_NEW(prop: Dict, criteria: Dict) -> Tuple[int, Dict, List[str]]:
    """
    RESIDENTIAL-STYLE SCORING - Search ALL property fields against criteria
    
    Returns: (total_score, field_scores, match_details)
    
    Scoring breakdown:
    - Business Type: 0-40 points (EXACT → CONTAINS → DESCRIPTION → CATEGORY)
    - Location: 0-30 points (STREET → POSTAL → AREA → CITY)
    - Price: 0-15 points (IN_BUDGET + deal_quality)
    - Size: 0-10 points (MATCH ± tolerance)
    - Parking: 0-5 points (MEETS_REQUIREMENT)
    Total: 0-100 points
    """
    total_score = 0
    field_scores = {}
    match_details = []
    
    # Extract ALL property data
    details = prop.get("details", {}) or {}
    commercial = prop.get("commercial", {}) or {}
    address = prop.get("address", {}) or {}
    
    # Business type fields
    prop_business = (
        commercial.get("businessType") or
        details.get("businessType") or
        details.get("propertyType") or
        ""
    ).lower()
    
    prop_desc = (details.get("description") or "").lower()
    prop_extras = (details.get("extras") or "").lower()
    
    # Location fields  
    prop_street = (address.get("streetName") or "").lower()
    prop_postal = (address.get("postalCode") or address.get("zip") or "").lower().replace(" ", "")
    prop_area = (address.get("area") or address.get("neighborhood") or "").lower()
    prop_city = (address.get("city") or "").lower()
    
    # Numeric fields
    prop_price = prop.get("listPrice") or 0
    prop_sqft = details.get("sqft") or commercial.get("buildingSize") or 0
    prop_parking = details.get("numParkingSpaces") or commercial.get("totalParking") or 0
    
    # ==================== BUSINESS TYPE SCORING (0-40 pts) ====================
    
    search_business = (criteria.get("business_type") or "").lower()
    
    if search_business:
        # EXACT match
        if search_business == prop_business:
            total_score += 40
            field_scores["business_type"] = 100
            match_details.append("🎯 EXACT business type")
        
        # CONTAINS match
        elif search_business in prop_business or prop_business in search_business:
            total_score += 35
            field_scores["business_type"] = 90
            match_details.append("✅ Business type contains")
        
        # DESCRIPTION mention
        elif search_business in prop_desc or any(kw in prop_desc for kw in search_business.split()):
            total_score += 25
            field_scores["business_type"] = 65
            match_details.append("📝 Business mentioned in description")
        
        # EXTRAS mention
        elif search_business in prop_extras:
            total_score += 20
            field_scores["business_type"] = 55
            match_details.append("📋 Business mentioned in extras")
        
        # CATEGORY match (same category like both food_service)
        else:
            # Simple category matching
            from commercialapp import get_business_category
            search_cat, _ = get_business_category(search_business)
            prop_cat, _ = get_business_category(prop_business)
            
            if search_cat and prop_cat and search_cat == prop_cat:
                total_score += 15
                field_scores["business_type"] = 40
                match_details.append(f"🏷️ Same category ({search_cat})")
            else:
                total_score += 5
                field_scores["business_type"] = 20
                match_details.append("🔄 Convertible")
    
    # ==================== LOCATION SCORING (0-30 pts) ====================
    
    # STREET match
    search_street = (criteria.get("street_name") or "").lower()
    if search_street and search_street in prop_street:
        total_score += 20
        field_scores["street"] = 100
        match_details.append(f"📍 Street: {prop_street}")
    
    # POSTAL match
    search_postal = (criteria.get("postal_code") or "").lower().replace(" ", "")
    if search_postal:
        if search_postal == prop_postal:
            total_score += 15
            field_scores["postal"] = 100
            match_details.append(f"📮 Exact postal: {prop_postal}")
        elif search_postal[:3] == prop_postal[:3]:  # FSA match
            total_score += 10
            field_scores["postal"] = 75
            match_details.append(f"📮 Postal area: {prop_postal[:3]}")
    
    # AREA match
    search_area = (criteria.get("area") or "").lower()
    if search_area and search_area in prop_area:
        total_score += 10
        field_scores["area"] = 100
        match_details.append(f"🏘️ Area: {prop_area}")
    
    # CITY match
    search_city = (criteria.get("location") or "").lower()
    if search_city and search_city == prop_city:
        total_score += 5
        field_scores["city"] = 100
        match_details.append(f"🏙️ City: {prop_city}")
    elif prop.get("_nearby_city"):
        # Nearby city penalty
        tier = prop.get("_distance_tier", 3)
        penalty = min(10, tier * 3)
        total_score = max(0, total_score - penalty)
        match_details.append(f"🗺️ Nearby: {prop['_nearby_city']} (-{penalty})")
    
    # ==================== PRICE SCORING (0-15 pts) ====================
    
    price_max = criteria.get("price_max")
    if price_max:
        if prop_price > price_max:
            # REJECT - over budget
            return 0, {"price": 0}, ["❌ Over budget"]
        
        # Within budget
        field_scores["price"] = 100
        match_details.append(f"💰 ${prop_price:,}")
        
        if prop_price <= price_max * 0.7:
            total_score += 15  # Great deal (30% under)
            match_details.append("💰 Great deal (30% under)")
        elif prop_price <= price_max * 0.85:
            total_score += 12  # Good deal (15% under)
        else:
            total_score += 10  # Within budget
    
    # ==================== SIZE SCORING (0-10 pts) ====================
    
    size_min = criteria.get("building_size_min")
    size_max = criteria.get("building_size_max")
    
    if size_min or size_max:
        if prop_sqft:
            in_range = True
            
            if size_min and prop_sqft < size_min:
                in_range = False
            if size_max and prop_sqft > size_max:
                in_range = False
            
            if in_range:
                total_score += 10
                field_scores["size"] = 100
                match_details.append(f"📏 {prop_sqft:,} sqft")
            else:
                total_score += 3  # Wrong size but close
                field_scores["size"] = 30
    
    # ==================== PARKING SCORING (0-5 pts) ====================
    
    parking_min = criteria.get("parking_spaces_min")
    if parking_min:
        if prop_parking >= parking_min:
            total_score += 5
            field_scores["parking"] = 100
            match_details.append(f"🅿️ {prop_parking} spaces")
        else:
            field_scores["parking"] = 50  # Has parking but not enough
    
    # Cap score at 100
    total_score = min(100, total_score)
    
    return total_score, field_scores, match_details


def filter_and_rank_commercial_NEW(properties: List[Dict], criteria: Dict, limit: int = 15) -> List[Dict]:
    """
    RESIDENTIAL-STYLE FILTERING AND RANKING
    
    NO PRE-CATEGORIZATION - Just score each property based on actual field matches.
    """
    print(f"🎯 [SCORING] Scoring {len(properties)} properties with residential pattern...")
    
    scored_properties = []
    
    for prop in properties:
        # Score using new residential-style scoring
        score, field_scores, match_details = score_commercial_property_NEW(prop, criteria)
        
        # Skip rejected properties (score = 0)
        if score == 0:
            continue
        
        scored_properties.append({
            "property": prop,
            "score": score,
            "field_scores": field_scores,
            "match_details": match_details
        })
    
    # Sort by score (highest first)
    scored_properties.sort(key=lambda x: x["score"], reverse=True)
    
    print(f"✅ [SCORING] {len(scored_properties)} properties passed filters")
    print(f"📊 Score range: {scored_properties[0]['score']} (highest) to {scored_properties[-1]['score']} (lowest)")
    
    # Format properties
    formatted = []
    for idx, sp in enumerate(scored_properties[:limit], 1):
        prop = sp["property"]
        formatted_prop = format_property_simple(prop, idx, criteria)
        formatted_prop["match_score"] = sp["score"]
        formatted_prop["match_details"] = sp["match_details"]
        formatted_prop["field_scores"] = sp["field_scores"]
        formatted.append(formatted_prop)
        
        # Log for debugging
        mls = prop.get("mlsNumber", "N/A")
        print(f"   🎯 #{idx}: {mls} = {sp['score']} pts | {', '.join(sp['match_details'][:3])}")
    
    return formatted


def format_property_simple(prop: Dict, index: int, criteria: Dict) -> Dict:
    """Simple property formatter matching residential style"""
    details = prop.get("details", {}) or {}
    commercial = prop.get("commercial", {}) or {}
    address = prop.get("address", {}) or {}
    
    return {
        "index": index,
        "mls": prop.get("mlsNumber") or prop.get("id"),
        "mlsNumber": prop.get("mlsNumber"),
        "address": address.get("streetName", ""),
        "unit": address.get("unitNumber", ""),
        "city": address.get("city", ""),
        "area": address.get("area", ""),
        "listPrice": prop.get("listPrice", 0),
        "price": prop.get("listPrice", 0),
        "price_text": f"${prop.get('listPrice', 0):,}" if prop.get("listPrice") else "Call for price",
        "business_type": commercial.get("businessType") or details.get("businessType") or details.get("propertyType") or "Commercial",
        "building_size": details.get("sqft") or commercial.get("buildingSize"),
        "parking": details.get("numParkingSpaces") or commercial.get("totalParking"),
        "images": prop.get("images", [])[:1],  # First image only
        "description": details.get("description", "")[:200],  # First 200 chars
    }
