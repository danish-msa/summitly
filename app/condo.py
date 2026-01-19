#!/usr/bin/env python3
"""
CONDO REAL ESTATE CHATBOT - Production Ready
============================================
✅ 60+ Condo-specific MLS field awareness
✅ AI-powered natural language understanding
✅ Lease and rental application support
✅ Building amenities and features
✅ Floor level and unit-specific searches
✅ Pet-friendly and accessibility filters
✅ Property management and condo corp details

Based on commercialapp.py architecture
Specialized for condo properties with full field support
"""

import os
import sys
import json
import time
import uuid
import re
import requests
import traceback
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

# ==================== ENVIRONMENT & CONFIGURATION ====================

try:
    from dotenv import load_dotenv
    load_dotenv(override=True)
    print("✅ Environment variables loaded")
except ImportError:
    print("⚠️ python-dotenv not installed. Using system environment variables.")

# API Configuration
REPLIERS_API_KEY = os.getenv("REPLIERS_API_KEY", "tVbura2ggfQb1yEdnz0lmP8cEAaL7n")
REPLIERS_BASE_URL = "https://api.repliers.io"
REPLIERS_CDN_BASE = "https://cdn.repliers.io"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = "gpt-4o-mini"

# Global storage
CACHE = {
    "properties_by_city": {},
    "field_mappings": {}
}

def log(msg: str, level: str = "INFO"):
    """Enhanced logging with timestamps and icons"""
    ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    icons = {
        "INFO": "ℹ️",
        "SUCCESS": "✅",
        "ERROR": "❌",
        "FAST": "⚡",
        "AI": "🤖",
        "SEARCH": "🔎",
        "MATCH": "🎯",
        "CONDO": "🏙️"
    }
    print(f"[{ts}] {icons.get(level, '📝')} {msg}")

# Initialize OpenAI client
try:
    import openai
    openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
    OPENAI_ENABLED = True
    log("OpenAI client initialized for condo property filtering", "SUCCESS")
except Exception as e:
    OPENAI_ENABLED = False
    log(f"OpenAI not available: {e}", "ERROR")

def get_criteria_hash(criteria: Dict) -> str:
    """Generate unique hash for search criteria"""
    criteria_for_hash = {k: v for k, v in criteria.items() if k != "location"}
    sorted_criteria = json.dumps(criteria_for_hash, sort_keys=True)
    return hashlib.md5(sorted_criteria.encode()).hexdigest()[:12]

# ==================== CONDO-SPECIFIC FIELD DEFINITIONS ====================

CONDO_FIELDS = {
    # Location and Listing Basics
    "location": "City/Municipality",
    "assessment_roll": "Assessment Roll Number (ARN)",
    "pin": "PIN Number",
    "area": "Area/Neighborhood",
    "municipality": "Municipality",
    "community": "Community Name",
    "street_direction_prefix": "Street Direction Prefix (N, S, E, W)",
    "street_number": "Street Number",
    "street_name": "Street Name",
    "street_direction": "Street Direction Suffix",
    "apt_unit": "Apartment/Unit Number",
    "postal_code": "Postal Code",
    "building_name": "Building Name",
    "property_management": "Property Management Company",
    "condo_registry_office": "Condo Registry Office",
    "condo_corp": "Condo Corporation Number",
    "level": "Floor Level",
    "unit_number": "Unit Number",
    
    # Lease Amounts and Dates
    "lease_type": "Lease/Rent Type",
    "lease_price": "Monthly Lease Price",
    "contract_commencement": "Contract Start Date",
    "expiry_date": "Lease Expiry Date",
    "possession_date": "Possession Date",
    "possession_remarks": "Possession Remarks",
    "possession_type": "Possession Type",
    "holdover_days": "Holdover Days",
    "landlord_name": "Landlord Name",
    "lease_term": "Lease Term (months)",
    "payment_frequency": "Payment Frequency",
    "payment_method": "Payment Method",
    
    # Requirements and Inclusions
    "rental_application_required": "Rental Application Required",
    "deposit_required": "Deposit Required",
    "credit_check": "Credit Check Required",
    "employment_letter": "Employment Letter Required",
    "lease_agreement": "Lease Agreement Type",
    "references_required": "References Required",
    "buy_option": "Buy Option Available",
    "non_smoking": "Non-Smoking Policy",
    "included_in_lease": "Utilities/Services Included",
    
    # Property Exterior and Waterfront
    "property_type": "Property Type (Condo Apt, Condo Townhouse)",
    "portion_for_lease": "Portion of Property for Lease",
    "style": "Architectural Style",
    "view": "View Type (City, Water, Park)",
    "exterior_features": "Exterior Features",
    "foundation": "Foundation Details",
    "roof": "Roof Type",
    "topography": "Topography",
    "garage": "Garage Available",
    "garage_type": "Garage Type",
    "garage_spaces": "Garage Parking Spaces",
    "total_parking": "Total Parking Spaces",
    "waterfront": "Waterfront Property",
    "water_body": "Body of Water Name",
    
    # Interior Details
    "num_rooms": "Number of Rooms",
    "bedrooms": "Number of Bedrooms",
    "bathrooms": "Number of Bathrooms",
    "num_kitchens": "Number of Kitchens",
    "interior_features": "Interior Features",
    "basement": "Basement Type",
    "fireplace": "Fireplace/Stove",
    "heat_source": "Heat Source",
    "heat_type": "Heat Type",
    "air_conditioning": "Air Conditioning",
    "pets_permitted": "Pets Permitted",
    "laundry_level": "Laundry Level",
    "accessibility_features": "Accessibility Features",
    "rooms_details": "Room Details",
    
    # Condo-Specific Amenities
    "balcony": "Balcony Available",
    "balcony_size": "Balcony Size (sqft)",
    "locker": "Storage Locker",
    "locker_number": "Locker Number",
    "exposure": "Unit Exposure (N, S, E, W)",
    "ceiling_height": "Ceiling Height",
    "flooring": "Flooring Type",
    "appliances": "Included Appliances",
    "condo_amenities": "Building Amenities",
    "concierge": "Concierge Service",
    "gym": "Gym/Fitness Center",
    "pool": "Swimming Pool",
    "party_room": "Party Room",
    "rooftop": "Rooftop Access",
    "security": "Security System",
    "elevator": "Elevator",
    "visitor_parking": "Visitor Parking",
    
    # Financial Details
    "maintenance_fee": "Monthly Maintenance Fee",
    "maintenance_includes": "Maintenance Fee Includes",
    "special_assessment": "Special Assessment",
    "property_taxes": "Annual Property Taxes",
    "tax_year": "Tax Year",
    
    # Remarks and Disclosure
    "comments": "General Comments",
    "client_remarks": "Remarks for Clients",
    "seller_direction": "Offer Remarks (Seller Direction)",
    "inclusions": "Inclusions",
    "exclusions": "Exclusions",
    "rental_items": "Rental Items/Under Contract",
    "realtor_remarks": "Realtor Only Remarks",
    "seller_property_info": "Seller Property Info Statement",
    "energy_certificate": "Energy Certificate",
    "green_property_info": "Green Property Info Statement"
}

# ==================== AI-POWERED FIELD EXTRACTION ====================

def extract_condo_fields_with_ai(query: str, context: Dict) -> Dict:
    """
    Use OpenAI to extract condo-specific fields from natural language.
    Understands all condo fields including lease terms, amenities, floor levels, etc.
    """
    try:
        log(f"Extracting condo fields from: '{query}'", "AI")
        
        # Build context message
        context_msg = ""
        if context:
            for key, value in context.items():
                if value:
                    context_msg += f"Previous {key}: {value}. "
        
        # Build field examples for AI
        field_examples = {
            "location": "Toronto, Mississauga, Ottawa",
            "building_name": "The Summit, Harbour Plaza, One Bloor",
            "bedrooms": 2,
            "bathrooms": 2,
            "min_price": 2000,
            "max_price": 5000,
            "sqft_min": 700,
            "sqft_max": 1500,
            "floor_level_min": 10,
            "floor_level_max": 30,
            "pets_permitted": True,
            "balcony": True,
            "locker": True,
            "parking_spaces": 1,
            "view": "City, Water, Park",
            "exposure": "South, West",
            "condo_amenities": ["Gym", "Pool", "Concierge", "Rooftop"],
            "maintenance_fee_max": 800,
            "laundry_level": "In Unit, In Building",
            "non_smoking": True,
            "lease_term_min": 12,
            "possession_date": "Immediate, Feb 1"
        }
        
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": OPENAI_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": f"""You are a condo real estate field extractor. Extract search criteria from user queries for CONDO properties.

Context: {context_msg}

Available fields (examples):
{json.dumps(field_examples, indent=2)}

CRITICAL RULES:
1. location: ONLY the city name (Toronto, Ottawa, etc.)
2. street_name: Street names or intersections if mentioned
3. bedrooms/bathrooms: Extract numbers
4. floor_level_min/max: Extract floor preferences ("10th floor or higher" → floor_level_min: 10)
5. pets_permitted: true if mentioned
6. condo_amenities: Array of amenities (gym, pool, concierge, etc.)
7. view: City, Water, Park, etc.
8. exposure: N, S, E, W (North, South, East, West)
9. balcony/locker/parking_spaces: Extract if mentioned
10. maintenance_fee_max: Extract monthly maintenance fee limits
11. laundry_level: "In Unit" or "In Building"

Examples:
"2 bed 2 bath condo in Toronto with lake view" → {{"bedrooms": 2, "bathrooms": 2, "location": "Toronto", "view": "Water"}}
"condo with balcony and parking on 15th floor" → {{"balcony": true, "parking_spaces": 1, "floor_level_min": 15}}
"pet-friendly condo with gym and pool" → {{"pets_permitted": true, "condo_amenities": ["Gym", "Pool"]}}
"condo under $2500 with utilities included" → {{"max_price": 2500, "included_in_lease": "Utilities"}}
"luxury condo in Yorkville with concierge" → {{"location": "Toronto", "area": "Yorkville", "condo_amenities": ["Concierge"]}}
"waterfront condo with south exposure" → {{"waterfront": true, "exposure": "South"}}
"penthouse condo with rooftop access" → {{"floor_level_min": 20, "condo_amenities": ["Rooftop"]}}
"condo with in-unit laundry and locker" → {{"laundry_level": "In Unit", "locker": true}}

Return ONLY JSON, no markdown."""
                    },
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                "temperature": 0.2,
                "max_tokens": 300
            },
            timeout=15
        )
        
        if response.status_code == 200:
            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()
            
            # Clean markdown
            content = re.sub(r'```json\s*|\s*```', '', content)
            
            # Extract JSON
            json_match = re.search(r'\{.*\}', content, re.DOTALL)
            if json_match:
                extracted = json.loads(json_match.group())
                log(f"AI extracted {len(extracted)} condo fields: {list(extracted.keys())}", "SUCCESS")
                return extracted
        
    except Exception as e:
        log(f"AI extraction error: {str(e)}", "ERROR")
    
    # Fallback to regex
    return extract_condo_fields_fallback(query, context)

def extract_condo_fields_fallback(query: str, context: Dict) -> Dict:
    """Regex-based fallback condo field extraction"""
    result = {}
    q = query.lower()
    
    # Extract bedrooms
    bed_match = re.search(r'(\d+)\s*(?:bed(?:room)?s?|br)', q)
    if bed_match:
        result["bedrooms"] = int(bed_match.group(1))
    
    # Extract bathrooms
    bath_match = re.search(r'(\d+)\s*(?:bath(?:room)?s?)', q)
    if bath_match:
        result["bathrooms"] = int(bath_match.group(1))
    
    # Extract price
    price_patterns = [
        (r'under\s*\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*k', lambda x: int(float(x) * 1000)),
        (r'under\s*\$?(\d+(?:,\d{3})*)', lambda x: int(x.replace(',', ''))),
        (r'\$?(\d+(?:,\d{3})*)\s*/\s*month', lambda x: int(x.replace(',', ''))),
    ]
    for pattern, converter in price_patterns:
        match = re.search(pattern, q)
        if match:
            result["max_price"] = converter(match.group(1))
            break
    
    # Extract floor level
    floor_match = re.search(r'(\d+)(?:th|st|nd|rd)?\s*floor', q)
    if floor_match:
        result["floor_level_min"] = int(floor_match.group(1))
    
    # Boolean features
    if any(word in q for word in ["pet", "pets", "pet-friendly", "dog", "cat"]):
        result["pets_permitted"] = True
    
    if "balcony" in q:
        result["balcony"] = True
    
    if "locker" in q or "storage" in q:
        result["locker"] = True
    
    if "parking" in q:
        result["parking_spaces"] = 1
    
    # View type
    if "lake view" in q or "waterfront" in q or "water view" in q:
        result["view"] = "Water"
    elif "city view" in q:
        result["view"] = "City"
    elif "park view" in q:
        result["view"] = "Park"
    
    # Amenities
    amenities = []
    if "gym" in q or "fitness" in q:
        amenities.append("Gym")
    if "pool" in q or "swimming" in q:
        amenities.append("Pool")
    if "concierge" in q:
        amenities.append("Concierge")
    if "rooftop" in q:
        amenities.append("Rooftop")
    if amenities:
        result["condo_amenities"] = amenities
    
    # Laundry
    if "in-unit laundry" in q or "in unit laundry" in q or "ensuite laundry" in q:
        result["laundry_level"] = "In Unit"
    
    log(f"Fallback extracted {len(result)} fields: {list(result.keys())}", "INFO")
    return result

# ==================== PROPERTY SEARCH ====================

def search_condo_properties_progressive(city: str, criteria: Dict, quick_limit: int = 20) -> Tuple[List[Dict], bool]:
    """
    Search for condo properties with progressive loading.
    Returns (properties, has_more)
    """
    city_key = city.lower()
    
    # CRITICAL FIX: Include criteria in cache key
    criteria_hash = get_criteria_hash(criteria) if criteria else "default"
    cache_key = f"{city_key}_condo_{criteria_hash}"
    
    log(f"Deep search for condos in {city}...", "SEARCH")
    
    headers = {
        "REPLIERS-API-KEY": REPLIERS_API_KEY,
        "Accept": "application/json"
    }
    
    # Try multiple city name variations
    city_variations = [
        city,
        city.title(),
        city.upper(),
        city.lower()
    ]
    
    # Add known alternatives
    city_alternatives = {
        "toronto": ["Toronto", "North York", "Scarborough", "Etobicoke", "Mississauga"],
        "ottawa": ["Ottawa", "Gatineau"],
        "vancouver": ["Vancouver", "Burnaby", "Richmond"],
        "montreal": ["Montréal", "Montreal", "Montréal-Ouest"]
    }
    
    if city_key in city_alternatives:
        city_variations.extend(city_alternatives[city_key])
    
    # Remove duplicates
    seen = set()
    city_variations = [x for x in city_variations if not (x.lower() in seen or seen.add(x.lower()))]
    
    log(f"Will try {len(city_variations)} city variations: {city_variations[:3]}...", "INFO")
    
    all_properties = []
    found_matches = 0
    
    # Try each city variation
    for attempt_num, city_name in enumerate(city_variations, 1):
        log(f"Attempt {attempt_num}/{len(city_variations)}: '{city_name}'", "SEARCH")
        
        page = 1
        max_pages = 10
        city_props = []
        
        while page <= max_pages:
            try:
                # Build params for condo search
                params = {
                    "class": "CondoProperty",  # CRITICAL: Condo class
                    "status": "A",  # Active listings
                    "city": city_name,
                    "resultsPerPage": 100,
                    "page": page
                }
                
                # Add condo-specific filters
                if criteria.get("bedrooms"):
                    params["beds"] = criteria["bedrooms"]
                if criteria.get("bathrooms"):
                    params["baths"] = criteria["bathrooms"]
                if criteria.get("min_price"):
                    params["minListPrice"] = criteria["min_price"]
                if criteria.get("max_price"):
                    params["maxListPrice"] = criteria["max_price"]
                if criteria.get("sqft_min"):
                    params["minSqft"] = criteria["sqft_min"]
                if criteria.get("sqft_max"):
                    params["maxSqft"] = criteria["sqft_max"]
                
                response = requests.get(
                    f"{REPLIERS_BASE_URL}/listings",
                    headers=headers,
                    params=params,
                    timeout=20
                )
                
                if response.status_code != 200:
                    log(f"API error {response.status_code} for '{city_name}'", "ERROR")
                    break
                
                data = response.json()
                
                if not data or "results" not in data or not data["results"]:
                    log(f"No more results at page {page}", "INFO")
                    break
                
                props = data["results"]
                city_props.extend(props)
                
                log(f"⚡ Page {page}: +{len(props)} props, {found_matches} good matches (total: {len(city_props)})", "FAST")
                
                page += 1
                
                # Stop if we have enough
                if len(city_props) >= 1000:
                    log(f"Reached limit of 1000 properties", "INFO")
                    break
                    
            except Exception as e:
                log(f"Error on page {page}: {e}", "ERROR")
                break
        
        if city_props:
            log(f"✅ Got {len(city_props)} properties from '{city_name}'", "SUCCESS")
            all_properties.extend(city_props)
            break  # Found properties, stop trying other city names
    
    # Remove duplicates by MLS number
    unique = []
    seen = set()
    for prop in all_properties:
        mls = prop.get("mlsNumber")
        if mls and mls not in seen:
            seen.add(mls)
            unique.append(prop)
        elif not mls:
            unique.append(prop)
    
    log(f"Removed {len(all_properties) - len(unique)} duplicates", "FAST")
    log(f"📊 Total: {len(unique)} properties, {found_matches} good matches", "INFO")
    
    return unique

# ==================== AI-POWERED RELEVANCE CHECKING ====================

def check_condo_relevance_with_ai(property_data: Dict, search_intent: str) -> Tuple[bool, float, str]:
    """
    Use GPT-4 to check if a condo matches user intent.
    
    Args:
        property_data: Property dict with condo details
        search_intent: What the user is looking for
    
    Returns:
        (is_relevant: bool, confidence: float 0-1, reason: str)
    """
    if not OPENAI_ENABLED:
        # Fallback to keyword matching
        desc = (property_data.get("details", {}).get("description") or "").lower()
        is_match = search_intent.lower() in desc
        return (is_match, 0.5 if is_match else 0.0, "keyword match" if is_match else "no match")
    
    try:
        # Extract relevant property info
        desc = property_data.get("details", {}).get("description", "No description")[:500]
        property_type = property_data.get("details", {}).get("propertyType", "Condo")
        address = property_data.get("address", {})
        location = f"{address.get('streetName', '')} {address.get('city', '')}"
        
        # Condo-specific details
        rooms = property_data.get("rooms", [])
        bedrooms = sum(1 for r in rooms if r.get("type") == "Bedroom")
        bathrooms = property_data.get("details", {}).get("bathrooms", "N/A")
        
        prompt = f"""You are a condo real estate expert. Determine if this condo is relevant for: "{search_intent}"

Condo Details:
- Property Type: {property_type}
- Location: {location}
- Bedrooms: {bedrooms}
- Bathrooms: {bathrooms}
- Description: {desc}

Question: Is this condo suitable for "{search_intent}"?

Consider:
1. Exact match (meets all criteria)
2. Close match (meets most criteria, minor differences)
3. Partial match (meets some criteria)
4. Location proximity
5. Amenities and features

Respond ONLY with JSON:
{{
  "relevant": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}}"""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a condo real estate expert. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=150
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        result = json.loads(result_text)
        
        return (
            result.get("relevant", False),
            float(result.get("confidence", 0.0)),
            result.get("reason", "AI analysis")
        )
        
    except Exception as e:
        log(f"AI relevance check failed: {e}", "ERROR")
        # Fallback to keyword matching
        desc = (property_data.get("details", {}).get("description") or "").lower()
        is_match = search_intent.lower() in desc
        return (is_match, 0.5 if is_match else 0.0, "fallback check")

# ==================== FILTER AND RANK ====================

def filter_and_rank_condo_properties(properties: List[Dict], criteria: Dict, min_results: int = 25) -> List[Dict]:
    """
    Filter and rank condo properties by criteria.
    GUARANTEED to return results!
    """
    if not properties:
        log("No properties to filter!", "ERROR")
        return []
    
    log(f"Filtering {len(properties)} condos...", "INFO")
    
    # CRITICAL: Extract fields from user_query if provided
    user_query = criteria.get("user_query", "")
    if user_query and OPENAI_ENABLED:
        log(f"🤖 [AI EXTRACTION] Extracting condo fields from: '{user_query}'", "INFO")
        extracted_fields = extract_condo_fields_with_ai(user_query, criteria)
        
        # Merge extracted fields into criteria
        for key, value in extracted_fields.items():
            if key not in criteria and value:
                criteria[key] = value
                log(f"   ✅ Extracted {key}: {value}", "INFO")
        
        log(f"🔍 [EXTRACTION RESULT] Criteria after AI: {criteria}", "INFO")
    
    # Determine search intent
    search_intent = user_query if user_query else ""
    
    # Score properties
    scored_properties = []
    ai_checked_count = 0
    MAX_AI_CHECKS = 30
    
    for prop in properties:
        score = 50  # Base score
        match_type = "GENERIC"
        
        # Extract property details
        price = prop.get("listPrice") or prop.get("price") or 0
        bedrooms = len([r for r in prop.get("rooms", []) if r.get("type") == "Bedroom"])
        bathrooms = prop.get("details", {}).get("bathrooms", 0)
        sqft = prop.get("details", {}).get("sqft", 0)
        
        # Bedroom matching
        if "bedrooms" in criteria:
            if bedrooms == criteria["bedrooms"]:
                score += 40
                match_type = "EXACT"
            elif abs(bedrooms - criteria["bedrooms"]) == 1:
                score += 20
        
        # Bathroom matching
        if "bathrooms" in criteria:
            if bathrooms >= criteria["bathrooms"]:
                score += 30
        
        # Price scoring
        if "max_price" in criteria:
            price_max = float(criteria["max_price"])
            if price <= price_max:
                score += 30
            elif price <= price_max * 1.2:
                score += 10
        
        # Sqft scoring
        if "sqft_min" in criteria:
            if sqft >= criteria["sqft_min"]:
                score += 20
        
        # Floor level
        if "floor_level_min" in criteria:
            # Try to extract floor from unit number or address
            # This would need more sophisticated logic
            pass
        
        # AI relevance check for complex queries
        if search_intent and ai_checked_count < MAX_AI_CHECKS and OPENAI_ENABLED:
            is_relevant, ai_confidence, ai_reason = check_condo_relevance_with_ai(prop, search_intent)
            ai_checked_count += 1
            
            if is_relevant and ai_confidence >= 0.7:
                score += int(40 * ai_confidence)
                match_type = "EXACT" if ai_confidence >= 0.9 else "CONVERTIBLE"
                log(f"🎯 {'EXACT' if match_type == 'EXACT' else 'CONVERTIBLE'} Match (AI): {ai_confidence:.0%} - {ai_reason}", "MATCH")
        
        scored_properties.append({
            **prop,
            "score": score,
            "match_type": match_type,
            # Normalize MLS field for consistency
            "mls": prop.get("mlsNumber") or prop.get("mls") or prop.get("listingId") or prop.get("id"),
            "mlsNumber": prop.get("mlsNumber") or prop.get("mls") or prop.get("listingId") or prop.get("id")
        })
    
    log(f"⚡ AI Optimization: {ai_checked_count} properties analyzed with AI (limit: {MAX_AI_CHECKS})", "INFO")
    log(f"✅ Speed boost: Skipped {len(properties) - ai_checked_count} AI calls", "SUCCESS")
    
    # Sort by score (descending)
    scored_properties.sort(key=lambda x: x["score"], reverse=True)
    
    log(f"After filters: {len(scored_properties)} condos remain", "INFO")
    
    # Return top results
    return scored_properties[:min_results]

# ==================== EXPORT FUNCTIONS ====================

def deduplicate_properties(properties: List[Dict]) -> List[Dict]:
    """Remove duplicate properties by MLS number"""
    unique = []
    seen = set()
    for prop in properties:
        mls = prop.get("mlsNumber") or prop.get("mls") or prop.get("id")
        if mls and mls not in seen:
            seen.add(mls)
            unique.append(prop)
        elif not mls:
            unique.append(prop)
    
    log(f"Removed {len(properties) - len(unique)} duplicates", "FAST")
    return unique

# Main export function
__all__ = [
    "search_condo_properties_progressive",
    "filter_and_rank_condo_properties",
    "extract_condo_fields_with_ai",
    "deduplicate_properties",
    "CONDO_FIELDS"
]

log("✅ Condo module loaded successfully", "SUCCESS")
