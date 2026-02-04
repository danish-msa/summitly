#!/usr/bin/env python3
"""
CONVERSATION ENHANCEMENTS - Context Preservation & Multi-Location Support
========================================================================
Fixes for all 3 property search systems (residential, commercial, condo):

1. Context Preservation: Carry forward filters when location changes
2. Multi-Location Search: Handle multiple locations in single query
3. Flexible Purpose Matching: Understand non-traditional use cases (e.g., 2BR condo for business)

Author: Assistant
Date: January 26, 2026
"""

import re
import logging
from typing import Dict, List, Optional, Tuple, Any
import openai
import os

logger = logging.getLogger(__name__)

# ==================== HELPER: MERGE CRITERIA WITH CONTEXT PRESERVATION ====================

def merge_criteria_with_context(
    session_criteria: Dict,
    new_criteria: Dict,
    conversation_history: List[Dict] = None
) -> Dict:
    """
    Intelligently merge new criteria with existing session context.
    
    KEY BEHAVIOR:
    - When location changes, preserve all other filters (price, size, etc.)
    - Only clear results, not the criteria
    - This solves Issue #1
    
    Example:
        Session: {"location": "Toronto", "price_max": 700000, "business_type": "Shop"}
        User says: "show me in Oshawa"
        New: {"location": "Oshawa"}
        Result: {"location": "Oshawa", "price_max": 700000, "business_type": "Shop"}
    """
    merged = session_criteria.copy()
    
    # Track what changed
    location_changed = False
    old_location = session_criteria.get("location")
    new_location = new_criteria.get("location")
    
    if new_location and old_location and new_location.lower() != old_location.lower():
        location_changed = True
        logger.info(f"📍 Location changed: {old_location} → {new_location}")
        logger.info(f"✅ Preserving filters: {[k for k in session_criteria if k != 'location']}")
    
    # Merge new criteria (overwrites old values, keeps unmentioned fields)
    merged.update(new_criteria)
    
    # Special handling for arrays (don't overwrite, append)
    for key in ['exclude_areas', 'exclude_streets', 'amenities']:
        if key in new_criteria and key in session_criteria:
            # Combine arrays, deduplicate
            merged[key] = list(set(session_criteria[key] + new_criteria[key]))
    
    return merged


# ==================== HELPER: EXTRACT MULTIPLE LOCATIONS ====================

def extract_multiple_locations(query: str) -> List[Dict]:
    """
    Extract multiple locations from a single query.
    Handles streets, neighborhoods, landmarks, cities, and intersections.
    
    This solves Issue #2
    
    Examples:
        "properties in Toronto and Mississauga" → 
            [{"location": "Toronto"}, {"location": "Mississauga"}]
        
        "near King Street and properties in Oshawa" → 
            [{"street_name": "King Street", "location": None}, {"location": "Oshawa"}]
        
        "condos in Toronto downtown and near Yonge & Eglinton" → 
            [{"location": "Toronto", "area": "Downtown"}, {"intersection": "Yonge & Eglinton", "location": "Toronto"}]
    """
    locations = []
    
    # Pattern 1: Multiple cities separated by "and", "or", ","
    city_pattern = r'\b(Toronto|Mississauga|Ottawa|Vaughan|Markham|Brampton|Kitchener|Waterloo|London|Hamilton|Windsor|Kingston|Oshawa|Scarborough|North York|Etobicoke|Oakville|Burlington|Richmond Hill|Pickering|Ajax|Whitby|Barrie)\b'
    cities_found = re.findall(city_pattern, query, re.IGNORECASE)
    
    if len(cities_found) > 1:
        # Multiple cities mentioned
        logger.info(f"🗺️  Multiple cities detected: {cities_found}")
        for city in cities_found:
            locations.append({"location": city.title(), "type": "city"})
    elif len(cities_found) == 1:
        # Single city
        locations.append({"location": cities_found[0].title(), "type": "city"})
    
    # Pattern 2: Street names (look for "Street", "Road", "Avenue", "Boulevard", "Drive")
    street_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(Street|Road|Avenue|Boulevard|Drive|Lane|Court|Crescent|Way|Place)\b'
    streets_found = re.findall(street_pattern, query, re.IGNORECASE)
    
    if streets_found:
        logger.info(f"🛣️  Streets detected: {streets_found}")
        for street_name, street_type in streets_found:
            full_street = f"{street_name} {street_type}"
            # Try to determine which city this street is in
            # If a city is already in locations, associate street with it
            if locations and locations[-1]['type'] == 'city':
                locations[-1]['street_name'] = full_street
            else:
                locations.append({"street_name": full_street, "type": "street"})
    
    # Pattern 3: Intersections (e.g., "Yonge & Eglinton", "401 and Kennedy")
    intersection_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:&|and|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b'
    intersections_found = re.findall(intersection_pattern, query, re.IGNORECASE)
    
    if intersections_found:
        logger.info(f"🔀 Intersections detected: {intersections_found}")
        for street1, street2 in intersections_found:
            intersection = f"{street1} & {street2}"
            if locations and locations[-1]['type'] == 'city':
                locations[-1]['intersection'] = intersection
            else:
                locations.append({"intersection": intersection, "type": "intersection"})
    
    # Pattern 4: Neighborhoods/Areas (Downtown, Midtown, etc.)
    area_pattern = r'\b(Downtown|Midtown|Uptown|Financial District|Yorkville|Annex|Junction|Leslieville|Liberty Village|Distillery District|Beaches|Rosedale|Forest Hill)\b'
    areas_found = re.findall(area_pattern, query, re.IGNORECASE)
    
    if areas_found:
        logger.info(f"🏘️  Areas detected: {areas_found}")
        for area in areas_found:
            if locations and 'area' not in locations[-1]:
                locations[-1]['area'] = area.title()
            else:
                locations.append({"area": area.title(), "type": "area"})
    
    # Pattern 5: Postal codes
    postal_pattern = r'\b([A-Z]\d[A-Z][\s]?\d[A-Z]\d)\b'
    postals_found = re.findall(postal_pattern, query, re.IGNORECASE)
    
    if postals_found:
        logger.info(f"📮 Postal codes detected: {postals_found}")
        for postal in postals_found:
            if locations and 'postal_code' not in locations[-1]:
                locations[-1]['postal_code'] = postal.upper()
            else:
                locations.append({"postal_code": postal.upper(), "type": "postal_code"})
    
    # If no locations detected, return empty list (caller should use session context)
    if not locations:
        logger.info("ℹ️  No locations detected in query")
        return []
    
    logger.info(f"✅ Extracted {len(locations)} location(s): {locations}")
    return locations


# ==================== HELPER: FLEXIBLE PURPOSE/INTENT UNDERSTANDING ====================

def understand_flexible_purpose(query: str, property_type: str = "condo") -> Dict:
    """
    Use AI to understand non-traditional property use cases.
    
    This solves Issue #3
    
    Examples:
        "2 bedroom condo for business" → {
            "purpose": "business",
            "suggestions": ["home office", "professional office", "commercial condo"],
            "search_strategy": "hybrid",
            "search_both": ["residential_condo", "commercial_space"]
        }
        
        "3 bedroom house for daycare" → {
            "purpose": "daycare",
            "suggestions": ["residential zoned for daycare", "commercial with residential features"],
            "search_strategy": "commercial_focus"
        }
        
        "studio for art gallery" → {
            "purpose": "art_gallery",
            "suggestions": ["commercial retail", "gallery space", "creative loft"],
            "search_strategy": "commercial_focus"
        }
    """
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    
    if not OPENAI_API_KEY:
        logger.warning("⚠️  OpenAI API key not found, using fallback purpose detection")
        return _fallback_purpose_detection(query, property_type)
    
    try:
        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """You are a real estate assistant that understands flexible property usage.

Users often have non-traditional use cases:
- "2 bedroom condo for business" → Could be home office, professional office, Airbnb business
- "3 bedroom house for daycare" → Residential property with commercial daycare license
- "studio for art gallery" → Creative space that could be residential loft or commercial gallery
- "1 bedroom for medical practice" → Small professional office

Your job:
1. Identify the TRUE PURPOSE (not just the property type)
2. Suggest what types of properties would work
3. Recommend search strategy

Return JSON:
{
    "purpose": "business|residential|hybrid|creative|professional",
    "intent": "human-readable description",
    "property_types_to_search": ["residential_condo", "commercial_office", "live_work_unit"],
    "search_strategy": "residential_focus|commercial_focus|hybrid|both_equally",
    "filters_to_add": {"key": "value"},
    "explanation": "why this strategy makes sense"
}

Examples:

Q: "2 bedroom condo for business"
A: {
    "purpose": "business",
    "intent": "Small business office or home-based business",
    "property_types_to_search": ["residential_condo", "commercial_office", "live_work_unit"],
    "search_strategy": "both_equally",
    "filters_to_add": {"business_use_allowed": true, "home_office_suitable": true},
    "explanation": "2BR condo could be used for home business, professional office, or live-work space"
}

Q: "3 bedroom house for daycare"
A: {
    "purpose": "business",
    "intent": "Licensed daycare facility",
    "property_types_to_search": ["residential_house", "commercial_daycare"],
    "search_strategy": "hybrid",
    "filters_to_add": {"daycare_zoning": true, "commercial_use_allowed": true},
    "explanation": "Daycare can operate in residential property with proper permits, or commercial space"
}

Q: "studio for art gallery"
A: {
    "purpose": "creative",
    "intent": "Art gallery or creative studio",
    "property_types_to_search": ["commercial_retail", "gallery_space", "creative_loft"],
    "search_strategy": "commercial_focus",
    "filters_to_add": {"business_type": "Art Gallery", "listing_type": "sale"},
    "explanation": "Art gallery typically requires commercial space with high ceilings and good lighting"
}"""
                },
                {
                    "role": "user",
                    "content": f"Property search query: '{query}'\nProperty type mentioned: {property_type}"
                }
            ],
            temperature=0.3,
            max_tokens=400,
            response_format={"type": "json_object"}
        )
        
        result = response.choices[0].message.content
        import json
        purpose_data = json.loads(result)
        
        logger.info(f"🧠 AI Purpose Understanding: {purpose_data.get('intent', 'N/A')}")
        logger.info(f"📋 Search Strategy: {purpose_data.get('search_strategy', 'N/A')}")
        
        return purpose_data
        
    except Exception as e:
        logger.error(f"❌ AI purpose detection failed: {e}")
        return _fallback_purpose_detection(query, property_type)


def _fallback_purpose_detection(query: str, property_type: str) -> Dict:
    """
    Fallback purpose detection without AI (pattern matching)
    """
    query_lower = query.lower()
    
    # Business keywords
    business_keywords = ["business", "office", "commercial", "professional", "practice", "clinic", "shop", "store"]
    creative_keywords = ["art", "gallery", "studio", "creative", "workshop", "maker"]
    hospitality_keywords = ["airbnb", "rental", "bnb", "vacation", "short term"]
    daycare_keywords = ["daycare", "day care", "childcare", "child care", "preschool"]
    
    if any(kw in query_lower for kw in business_keywords):
        return {
            "purpose": "business",
            "intent": "Business or professional use",
            "property_types_to_search": ["commercial_office", "commercial_retail", "residential_condo"],
            "search_strategy": "both_equally",
            "filters_to_add": {},
            "explanation": "User likely wants space for business use - search both commercial and residential"
        }
    
    if any(kw in query_lower for kw in creative_keywords):
        return {
            "purpose": "creative",
            "intent": "Creative or gallery space",
            "property_types_to_search": ["commercial_retail", "gallery_space", "creative_loft"],
            "search_strategy": "commercial_focus",
            "filters_to_add": {"business_type": "Art Gallery"},
            "explanation": "Creative spaces typically need commercial zoning"
        }
    
    if any(kw in query_lower for kw in hospitality_keywords):
        return {
            "purpose": "rental_business",
            "intent": "Airbnb or rental business",
            "property_types_to_search": ["residential_condo", "residential_house"],
            "search_strategy": "residential_focus",
            "filters_to_add": {},
            "explanation": "Airbnb/rental business typically uses residential properties"
        }
    
    if any(kw in query_lower for kw in daycare_keywords):
        return {
            "purpose": "daycare",
            "intent": "Daycare facility",
            "property_types_to_search": ["residential_house", "commercial_daycare"],
            "search_strategy": "hybrid",
            "filters_to_add": {"daycare_zoning": True},
            "explanation": "Daycare can operate in residential or commercial properties with permits"
        }
    
    # Default: standard residential use
    return {
        "purpose": "residential",
        "intent": "Standard residential use",
        "property_types_to_search": [f"{property_type}"],
        "search_strategy": "residential_focus",
        "filters_to_add": {},
        "explanation": "Standard residential property search"
    }


# ==================== HELPER: PARALLEL MULTI-LOCATION SEARCH ====================

def search_multiple_locations_sync(
    locations: List[Dict],
    base_criteria: Dict,
    search_function,  # Pass the actual search function (commercial/residential/condo)
    max_results_per_location: int = 25
) -> Dict:
    """
    Execute synchronous searches for multiple locations and combine results.
    ✅ Works with all 3 systems (residential, commercial, condo)
    
    Args:
        locations: List of location dicts from extract_multiple_locations()
        base_criteria: Base search criteria (price, size, etc.)
        search_function: The search function to call (takes criteria, returns properties)
        max_results_per_location: Max properties per location
    
    Returns:
    {
        "combined_results": [...],  # All results merged
        "by_location": {
            "Toronto": [...],
            "King Street": [...]
        },
        "total_count": 123,
        "location_counts": {"Toronto": 50, "King Street": 73}
    }
    """
    results_by_location = {}
    all_results = []
    
    # Execute searches sequentially (fast enough for real-time use)
    for loc in locations:
        # Merge location-specific criteria with base criteria
        criteria = base_criteria.copy()
        criteria.update(loc)
        
        # Get location name for logging
        location_key = loc.get('location') or loc.get('street_name') or loc.get('intersection') or loc.get('postal_code') or 'Unknown'
        
        try:
            logger.info(f"🔍 Searching {location_key}...")
            
            # Call search function (format depends on system)
            # For commercial: search_function(criteria, max_results)
            # For residential: search_function(city, criteria) 
            # For condo: search_function(**criteria)
            
            # Try to determine which system we're using
            import inspect
            sig = inspect.signature(search_function)
            params = list(sig.parameters.keys())
            
            if 'city' in params and len(params) <= 3:
                # Residential format: search_function(city, max_price, bedrooms, ...)
                city = criteria.get('location') or criteria.get('city', 'Ontario')
                results = search_function(
                    city=city,
                    max_price=criteria.get('max_price'),
                    bedrooms=criteria.get('bedrooms'),
                    bathrooms=criteria.get('bathrooms'),
                    property_type=criteria.get('property_type'),
                    limit=max_results_per_location
                )
            elif 'criteria' in params:
                # Commercial format: search_function(criteria, max_results)
                results = search_function(criteria, max_results_per_location)
            else:
                # Condo format: search_function(**criteria)
                results = search_function(**criteria, limit=max_results_per_location)
            
            # Handle different return formats
            if isinstance(results, tuple):
                properties = results[0] if results else []
            elif isinstance(results, dict):
                properties = results.get('properties', [])
            elif isinstance(results, list):
                properties = results
            else:
                properties = []
            
            # Tag with search location
            for prop in properties:
                if isinstance(prop, dict):
                    prop['search_location'] = location_key
            
            results_by_location[location_key] = properties
            all_results.extend(properties)
            logger.info(f"✅ {location_key}: {len(properties)} properties")
            
        except Exception as e:
            logger.error(f"❌ Search failed for {location_key}: {e}")
            import traceback
            traceback.print_exc()
    
    # Deduplicate by MLS number
    seen_mls = set()
    unique_results = []
    for prop in all_results:
        mls = prop.get('mlsNumber') or prop.get('mls') or prop.get('MlsNumber')
        if mls and mls not in seen_mls:
            seen_mls.add(mls)
            unique_results.append(prop)
        elif not mls:
            # No MLS number, include anyway
            unique_results.append(prop)
    
    location_counts = {k: len(v) for k, v in results_by_location.items()}
    
    return {
        "combined_results": unique_results,
        "by_location": results_by_location,
        "total_count": len(unique_results),
        "location_counts": location_counts
    }


async def search_multiple_locations_parallel(
    locations: List[Dict],
    base_criteria: Dict,
    search_function,  # Pass the actual search function (commercial/residential/condo)
    max_results_per_location: int = 25
) -> Dict:
    """
    Execute parallel searches for multiple locations and combine results (async version).
    
    Returns:
    {
        "combined_results": [...],  # All results merged
        "by_location": {
            "Toronto": [...],
            "King Street": [...]
        },
        "total_count": 123,
        "location_counts": {"Toronto": 50, "King Street": 73}
    }
    """
    import asyncio
    
    results_by_location = {}
    all_results = []
    
    # Execute searches in parallel
    tasks = []
    for loc in locations:
        # Merge location-specific criteria with base criteria
        criteria = base_criteria.copy()
        criteria.update(loc)
        
        # Create async task
        task = asyncio.create_task(_execute_search_async(search_function, criteria, max_results_per_location))
        tasks.append((loc, task))
    
    # Wait for all searches to complete
    for loc, task in tasks:
        try:
            results = await task
            location_key = loc.get('location') or loc.get('street_name') or loc.get('intersection') or loc.get('postal_code')
            results_by_location[location_key] = results
            all_results.extend(results)
            logger.info(f"✅ {location_key}: {len(results)} properties")
        except Exception as e:
            logger.error(f"❌ Search failed for {loc}: {e}")
    
    # Deduplicate by MLS number
    seen_mls = set()
    unique_results = []
    for prop in all_results:
        mls = prop.get('mlsNumber') or prop.get('mls')
        if mls and mls not in seen_mls:
            seen_mls.add(mls)
            unique_results.append(prop)
    
    location_counts = {k: len(v) for k, v in results_by_location.items()}
    
    return {
        "combined_results": unique_results,
        "by_location": results_by_location,
        "total_count": len(unique_results),
        "location_counts": location_counts
    }


async def _execute_search_async(search_function, criteria, max_results):
    """Execute a single search asynchronously"""
    import asyncio
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, search_function, criteria, max_results)


# ==================== EXPORT ====================

__all__ = [
    'merge_criteria_with_context',
    'extract_multiple_locations',
    'understand_flexible_purpose',
    'search_multiple_locations_parallel',
    'search_multiple_locations_sync'  # Added sync version
]
