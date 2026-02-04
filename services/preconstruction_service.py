#!/usr/bin/env python3
"""
PRE-CONSTRUCTION PROPERTY SERVICE
==================================
Fetches and formats pre-construction properties from Summitly API
Integrates with commercial, residential, and condo systems

Features:
- In-memory caching of all pre-construction properties
- Intelligent project name matching
- Developer search
- Amenity-based filtering
- Property details lookup by MLS number
"""

import requests
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Pre-construction API endpoint
PRECONSTRUCTION_API_URL = "https://summitly.vercel.app/api/v1/pre-con-projects"

# Global cache for pre-construction properties
_PRECONSTRUCTION_CACHE = {
    "properties": [],
    "last_fetched": None,
    "cache_duration": timedelta(hours=6),  # Refresh every 6 hours
    "by_mls": {},  # MLS number lookup
    "by_project_name": {},  # Project name lookup
    "by_developer": {},  # Developer lookup
}

# Keywords that indicate pre-construction intent
# CRITICAL: Only match explicit pre-construction keywords to avoid false positives
PRECONSTRUCTION_KEYWORDS = [
    "pre-construction", "preconstruction", "pre construction",
    "new construction", "new build", "new development",
    "under construction", "coming soon", "future project",
    "development project", "new project", "upcoming project",
    "pre-con", "precon", "new launch", "launching soon",
    "condo development", "upcoming condo", "future condo",
]


def detect_preconstruction_intent(query: str) -> bool:
    """
    Detect if user is asking about pre-construction properties
    
    Args:
        query: User's search query
        
    Returns:
        True if pre-construction intent detected, False otherwise
    """
    query_lower = query.lower()
    
    # Check for pre-construction keywords
    for keyword in PRECONSTRUCTION_KEYWORDS:
        if keyword in query_lower:
            logger.info(f"✅ Pre-construction intent detected: '{keyword}' found in query")
            return True
    
    # ONLY check for exact project name matches (not partial words)
    # This prevents false positives like "television" matching "television city"
    if _PRECONSTRUCTION_CACHE["properties"]:
        for prop in _PRECONSTRUCTION_CACHE["properties"]:
            project_name = prop.get("projectName", "").lower()
            
            # Only match if the FULL project name is in the query
            if project_name and len(project_name) > 5 and project_name in query_lower:
                logger.info(f"✅ Pre-construction intent detected: exact project '{project_name}' mentioned")
                return True
    
    logger.info(f"❌ No pre-construction intent detected in query")
    return False


def is_preconstruction_mls(mls_number: str) -> bool:
    """
    Check if an MLS number belongs to a pre-construction property
    
    Args:
        mls_number: MLS number to check
        
    Returns:
        True if it's a pre-construction property
    """
    # Ensure cache is populated
    if not _PRECONSTRUCTION_CACHE["properties"]:
        logger.info("🔄 Cache empty, fetching pre-construction properties...")
        fetch_preconstruction_properties()
    
    is_precon = mls_number in _PRECONSTRUCTION_CACHE["by_mls"]
    logger.info(f"🔍 Checking MLS '{mls_number}': {'✅ IS' if is_precon else '❌ NOT'} pre-construction")
    
    # Debug: Show available MLS numbers if not found
    if not is_precon and _PRECONSTRUCTION_CACHE["by_mls"]:
        available_mls = list(_PRECONSTRUCTION_CACHE["by_mls"].keys())[:5]
        logger.info(f"📋 Available MLS numbers (first 5): {available_mls}")
    
    return is_precon


def get_preconstruction_by_mls(mls_number: str) -> Optional[Dict]:
    """
    Get pre-construction property by MLS number
    
    Args:
        mls_number: MLS number to lookup
        
    Returns:
        Standardized property dict or None
    """
    # Ensure cache is populated
    if not _PRECONSTRUCTION_CACHE["properties"]:
        logger.info("🔄 Cache empty, fetching pre-construction properties...")
        fetch_preconstruction_properties()
    
    prop = _PRECONSTRUCTION_CACHE["by_mls"].get(mls_number)
    
    if prop:
        logger.info(f"✅ Found pre-construction property: {prop.get('projectName', 'Unknown')}")
    else:
        logger.warning(f"⚠️ Pre-construction property not found for MLS: {mls_number}")
    
    return prop


def fetch_preconstruction_properties() -> List[Dict]:
    """
    Fetch all pre-construction properties from Summitly API
    Uses cache to avoid repeated API calls
    
    Returns:
        List of pre-construction properties
    """
    # Check cache validity
    if _PRECONSTRUCTION_CACHE["properties"] and _PRECONSTRUCTION_CACHE["last_fetched"]:
        time_since_fetch = datetime.now() - _PRECONSTRUCTION_CACHE["last_fetched"]
        if time_since_fetch < _PRECONSTRUCTION_CACHE["cache_duration"]:
            logger.info(f"✅ Using cached pre-construction properties ({len(_PRECONSTRUCTION_CACHE['properties'])} items)")
            return _PRECONSTRUCTION_CACHE["properties"]
    
    try:
        logger.info(f"🔍 Fetching pre-construction properties from {PRECONSTRUCTION_API_URL}")
        response = requests.get(PRECONSTRUCTION_API_URL, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Handle API response structure: {success: bool, data: {projects: [...]}, meta: {...}}
        if isinstance(data, dict):
            if data.get("success") and "data" in data:
                # Extract projects from data.projects
                projects = data.get("data", {}).get("projects", [])
            elif "projects" in data:
                # Fallback: direct projects key
                projects = data.get("projects", [])
            else:
                # Fallback: treat as list
                projects = data if isinstance(data, list) else []
        elif isinstance(data, list):
            projects = data
        else:
            logger.error(f"❌ Unexpected response format: {type(data)}")
            projects = []
        
        # Update cache
        _PRECONSTRUCTION_CACHE["properties"] = projects
        _PRECONSTRUCTION_CACHE["last_fetched"] = datetime.now()
        
        # Build lookup indexes
        _PRECONSTRUCTION_CACHE["by_mls"] = {}
        _PRECONSTRUCTION_CACHE["by_project_name"] = {}
        _PRECONSTRUCTION_CACHE["by_developer"] = {}
        
        logger.info(f"📊 Building indexes for {len(projects)} projects...")
        
        for prop in projects:
            # Index by MLS number
            mls = prop.get("mlsNumber")
            if mls:
                standardized = standardize_preconstruction_property(prop)
                _PRECONSTRUCTION_CACHE["by_mls"][mls] = standardized
                logger.debug(f"   ✅ Indexed MLS: {mls} → {prop.get('projectName', 'Unknown')}")
            
            # Index by project name
            project_name = prop.get("projectName", "").lower()
            if project_name:
                if project_name not in _PRECONSTRUCTION_CACHE["by_project_name"]:
                    _PRECONSTRUCTION_CACHE["by_project_name"][project_name] = []
                _PRECONSTRUCTION_CACHE["by_project_name"][project_name].append(prop)
            
            # Index by developer
            developer = prop.get("developer", "").lower()
            if developer:
                if developer not in _PRECONSTRUCTION_CACHE["by_developer"]:
                    _PRECONSTRUCTION_CACHE["by_developer"][developer] = []
                _PRECONSTRUCTION_CACHE["by_developer"][developer].append(prop)
        
        logger.info(f"✅ Fetched and cached {len(projects)} pre-construction properties")
        logger.info(f"📊 Indexed: {len(_PRECONSTRUCTION_CACHE['by_mls'])} by MLS, "
                   f"{len(_PRECONSTRUCTION_CACHE['by_project_name'])} project names, "
                   f"{len(_PRECONSTRUCTION_CACHE['by_developer'])} developers")
        
        # Log first few MLS numbers for debugging
        if _PRECONSTRUCTION_CACHE["by_mls"]:
            sample_mls = list(_PRECONSTRUCTION_CACHE["by_mls"].keys())[:3]
            logger.info(f"📋 Sample MLS numbers: {sample_mls}")
        
        return projects
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Error fetching pre-construction properties: {e}")
        # Return cached data if available
        return _PRECONSTRUCTION_CACHE["properties"]
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return _PRECONSTRUCTION_CACHE["properties"]


def filter_preconstruction_properties(
    properties: List[Dict],
    city: str = None,
    min_price: float = None,
    max_price: float = None,
    property_type: str = None,
    bedrooms: int = None,
    status: str = None
) -> List[Dict]:
    """
    Filter pre-construction properties based on criteria
    
    Args:
        properties: List of pre-construction properties
        city: City name to filter by
        min_price: Minimum price
        max_price: Maximum price
        property_type: Property type (Houses, Condos, Townhouse, etc.)
        bedrooms: Minimum number of bedrooms
        status: Status filter (now-selling, coming-soon, etc.)
        
    Returns:
        Filtered list of properties
    """
    filtered = properties
    
    # Filter by city
    if city:
        city_lower = city.lower()
        filtered = [
            p for p in filtered
            if p.get("location", {}).get("city", "").lower() == city_lower
        ]
        logger.info(f"🔍 Filtered by city '{city}': {len(filtered)} properties")
    
    # Filter by price range
    if min_price or max_price:
        def price_matches(prop):
            pricing = prop.get("pricing", {})
            starting = pricing.get("starting", 0)
            ending = pricing.get("ending", float('inf'))
            
            if min_price and ending < min_price:
                return False
            if max_price and starting > max_price:
                return False
            return True
        
        filtered = [p for p in filtered if price_matches(p)]
        logger.info(f"💰 Filtered by price: {len(filtered)} properties")
    
    # Filter by property type (SKIP for 'commercial' - pre-construction doesn't use this label)
    if property_type and property_type.lower() not in ['commercial', 'condo', 'residential']:
        type_lower = property_type.lower()
        filtered = [
            p for p in filtered
            if type_lower in p.get("details", {}).get("propertyType", "").lower() or
               type_lower in p.get("details", {}).get("subPropertyType", "").lower()
        ]
        logger.info(f"🏠 Filtered by type '{property_type}': {len(filtered)} properties")
    elif property_type:
        logger.info(f"⏭️ Skipping property type filter for '{property_type}' (pre-construction uses different categorization)")
    
    # Filter by bedrooms
    if bedrooms:
        def bedroom_matches(prop):
            bedroom_range = prop.get("details", {}).get("bedroomRange", "")
            if not bedroom_range:
                return True
            
            try:
                parts = bedroom_range.split("-")
                min_bed = int(parts[0])
                max_bed = int(parts[-1]) if len(parts) > 1 else min_bed
                return bedrooms >= min_bed and bedrooms <= max_bed
            except:
                return True
        
        filtered = [p for p in filtered if bedroom_matches(p)]
        logger.info(f"🛏️ Filtered by bedrooms: {len(filtered)} properties")
    
    # Filter by status
    if status:
        status_lower = status.lower()
        filtered = [
            p for p in filtered
            if status_lower in p.get("status", "").lower()
        ]
        logger.info(f"📊 Filtered by status '{status}': {len(filtered)} properties")
    
    return filtered


def standardize_preconstruction_property(prop: Dict) -> Dict:
    """
    Convert pre-construction API format to standard property format
    Used by all three systems (commercial, residential, condo)
    
    Args:
        prop: Pre-construction property from API
        
    Returns:
        Standardized property format matching existing systems
    """
    location = prop.get("location", {})
    pricing = prop.get("pricing", {})
    details = prop.get("details", {})
    
    # Parse bedroom and bathroom ranges
    bedroom_range = details.get("bedroomRange", "")
    bathroom_range = details.get("bathroomRange", "")
    
    try:
        bedrooms = int(bedroom_range.split("-")[0]) if bedroom_range else None
    except:
        bedrooms = None
    
    try:
        bathrooms = float(bathroom_range.split("-")[0]) if bathroom_range else None
    except:
        bathrooms = None
    
    # Parse square footage range
    sqft_range = details.get("sqftRange", "")
    try:
        sqft = int(sqft_range.split("-")[0]) if sqft_range else None
    except:
        sqft = None
    
    # Safely get pricing values (handle None)
    starting_price = pricing.get("starting") or 0
    ending_price = pricing.get("ending") or 0
    min_price = pricing.get("range", {}).get("min") or 0
    max_price = pricing.get("range", {}).get("max") or 0
    price_per_sqft = pricing.get("avgPricePerSqft") or 0
    
    # Build standardized property
    standardized = {
        # Core identification
        "mls": prop.get("mlsNumber"),
        "mlsNumber": prop.get("mlsNumber"),
        "listingId": prop.get("id"),
        "id": prop.get("id"),
        
        # Property type
        "property_type": details.get("propertyType", "Pre-Construction"),
        "propertyType": details.get("propertyType", "Pre-Construction"),
        "type": details.get("subPropertyType", details.get("propertyType", "Pre-Construction")),
        "class": "PreConstruction",
        
        # Project information
        "projectName": prop.get("projectName"),
        "developer": prop.get("developer"),
        "status": prop.get("status", ""),
        "isPreconstruction": True,
        
        # Location - format address properly for display
        "address": f"{location.get('address', '')}, {location.get('city', '')}, {location.get('state', '')} {location.get('zip', '')}".strip(", "),
        "fullAddress": f"{location.get('address', '')}, {location.get('city', '')}, {location.get('state', '')} {location.get('zip', '')}".strip(", "),
        "addressObject": {
            "full": f"{location.get('address', '')}, {location.get('city', '')}, {location.get('state', '')} {location.get('zip', '')}".strip(", "),
            "streetNumber": "",
            "streetName": location.get("address", ""),
            "city": location.get("city", ""),
            "province": location.get("state", ""),
            "postalCode": location.get("zip", ""),
            "neighborhood": location.get("neighborhood", ""),
            "area": location.get("neighborhood", ""),
        },
        "city": location.get("city", ""),
        "location": location.get("city", ""),
        "neighborhood": location.get("neighborhood", ""),
        "streetAddress": location.get("address", ""),
        
        # Coordinates
        "coordinates": location.get("coordinates", {}),
        "latitude": location.get("coordinates", {}).get("lat"),
        "longitude": location.get("coordinates", {}).get("lng"),
        
        # Pricing - intelligent display
        # If starting_price > 0, use it. Otherwise use price_per_sqft. Never show 0.
        "listPrice": starting_price if starting_price > 0 else (price_per_sqft * 500 if price_per_sqft > 0 else None),
        "price": starting_price if starting_price > 0 else (price_per_sqft * 500 if price_per_sqft > 0 else None),
        "priceRange": {
            "min": min_price,
            "max": max_price
        },
        "startingPrice": starting_price,
        "endingPrice": ending_price,
        "pricePerSqft": price_per_sqft,
        "priceDisplay": (
            f"${starting_price:,.0f}" if starting_price > 0
            else f"${price_per_sqft:,.0f}/sqft" if price_per_sqft > 0
            else "Contact for Pricing"
        ),
        
        # Physical characteristics
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "bedroomRange": bedroom_range,
        "bathroomRange": bathroom_range,
        "sqft": sqft,
        "sqftRange": sqft_range,
        "totalUnits": details.get("totalUnits"),
        "availableUnits": details.get("availableUnits"),
        "storeys": details.get("storeys"),
        
        # Features and amenities
        "amenities": prop.get("amenities", []),
        "features": prop.get("features", []),
        "condoAmenities": prop.get("amenities", []),
        
        # Media
        "images": prop.get("images", []),
        "photos": prop.get("images", []),
        "virtualTourUrl": prop.get("videos", [{}])[0] if prop.get("videos") else None,
        
        # Description - handle pricing intelligently
        "remarks": f"🏗️ Pre-Construction Project: {prop.get('projectName', '')} by {prop.get('developer', '')}. "
                  f"Status: {prop.get('status', '').replace('-', ' ').title()}. "
                  f"Units available: {details.get('availableUnits', 'N/A')}. "
                  f"{f'Price/sqft: ${price_per_sqft:,.0f}' if price_per_sqft > 0 else 'Contact for pricing'}.",
        
        "description": (
            f"{prop.get('projectName', '')} is a new {details.get('propertyType', 'development')} "
            f"by {prop.get('developer', '')} in {location.get('city', '')}. "
            + (f"Starting from ${starting_price:,.0f}. " if starting_price > 0
               else f"From ${price_per_sqft:,.0f}/sqft. " if price_per_sqft > 0
               else "Pricing available upon request. ")
            + f"{details.get('totalUnits', 'Multiple')} units total, {details.get('availableUnits', 'several')} available. "
            + (f"Completion: {prop.get('completion', {}).get('date', 'TBD')}." if prop.get('completion') else "")
        ),
        
        # Completion status
        "completion": prop.get("completion", {}),
        "completionDate": prop.get("completion", {}).get("date"),
        
        # Listing information
        "featured": prop.get("featured", False),
        "listingType": "Pre-Construction",
        
        # Original data
        "_raw": prop
    }
    
    return standardized


def search_preconstruction_properties(
    query: str = "",
    city: str = None,
    min_price: float = None,
    max_price: float = None,
    property_type: str = None,
    bedrooms: int = None,
    status: str = None,
    limit: int = 50
) -> Dict:
    """
    Search pre-construction properties with filters
    
    Args:
        query: Search query (for intent detection)
        city: City name
        min_price: Minimum price
        max_price: Maximum price
        property_type: Property type
        bedrooms: Minimum bedrooms
        status: Status filter
        limit: Maximum results
        
    Returns:
        Dict with properties and metadata
    """
    logger.info(f"🏗️ Searching pre-construction properties: query='{query}', city={city}, price={min_price}-{max_price}")
    
    # Fetch all properties
    all_properties = fetch_preconstruction_properties()
    
    if not all_properties:
        return {
            "properties": [],
            "total_count": 0,
            "source": "preconstruction",
            "message": "No pre-construction properties found."
        }
    
    # PRIORITY 1: Check if query contains a specific project name
    # This allows users to search by project name directly
    project_name_matches = []
    developer_matches = []
    if query:
        query_lower = query.lower()
        # Remove common words that might interfere, but keep important ones like city names
        # Also normalize hyphens and spaces for better matching
        search_terms = query_lower.replace('preconstruction', '').replace('pre-construction', '').replace('project', '').replace('properties', '').replace('show me', '').strip()
        # Normalize: "television-city" becomes "television city" and vice versa
        search_terms_normalized = search_terms.replace('-', ' ')
        search_terms_hyphenated = search_terms.replace(' ', '-')
        
        # Check cache for project name matches
        for project_name_key, projects in _PRECONSTRUCTION_CACHE["by_project_name"].items():
            # Normalize project name key too
            project_normalized = project_name_key.replace('-', ' ')
            project_hyphenated = project_name_key.replace(' ', '-')
            
            # Check multiple variations
            if (project_name_key in search_terms or 
                search_terms in project_name_key or
                project_normalized in search_terms_normalized or
                search_terms_normalized in project_normalized or
                project_hyphenated in search_terms_hyphenated or
                search_terms_hyphenated in project_hyphenated):
                
                project_name_matches.extend(projects)
                logger.info(f"🎯 [PROJECT NAME MATCH] Found '{project_name_key}' matching query '{search_terms}'")
        
        # Check cache for developer name matches
        for developer_key, projects in _PRECONSTRUCTION_CACHE["by_developer"].items():
            # Check if developer name is in the query (minimum 3 characters to avoid false positives)
            if len(developer_key) >= 3 and (developer_key in search_terms or search_terms in developer_key):
                developer_matches.extend(projects)
                logger.info(f"🏢 [DEVELOPER MATCH] Found '{developer_key}' in query")
        
        # Prioritize project name matches over developer matches
        if project_name_matches:
            logger.info(f"🎯 [PROJECT SEARCH] Using {len(project_name_matches)} project name matches")
            
            # Still apply city filter if specified to narrow down
            if city:
                city_lower = city.lower()
                project_name_matches = [
                    p for p in project_name_matches
                    if p.get("location", {}).get("city", "").lower() == city_lower
                ]
                logger.info(f"🔍 Further filtered by city '{city}': {len(project_name_matches)} properties")
            
            # Use project matches as the filtered list
            filtered = project_name_matches
        elif developer_matches:
            logger.info(f"🏢 [DEVELOPER SEARCH] Using {len(developer_matches)} developer matches")
            
            # Apply other filters to developer matches
            filtered = filter_preconstruction_properties(
                developer_matches,
                city=city,
                min_price=min_price,
                max_price=max_price,
                property_type=property_type,
                bedrooms=bedrooms,
                status=status
            )
        else:
            # No project/developer match - use normal filtering
            filtered = filter_preconstruction_properties(
                all_properties,
                city=city,
                min_price=min_price,
                max_price=max_price,
                property_type=property_type,
                bedrooms=bedrooms,
                status=status
            )
    else:
        # No query - use normal filtering
        filtered = filter_preconstruction_properties(
            all_properties,
            city=city,
            min_price=min_price,
            max_price=max_price,
            property_type=property_type,
            bedrooms=bedrooms,
            status=status
        )
    
    # Limit results
    filtered = filtered[:limit]
    
    # Standardize format
    standardized = [standardize_preconstruction_property(p) for p in filtered]
    
    logger.info(f"✅ Returning {len(standardized)} pre-construction properties")
    
    return {
        "properties": standardized,
        "total_count": len(standardized),
        "source": "preconstruction",
        "message": f"Found {len(standardized)} pre-construction projects."
    }


# Export functions
__all__ = [
    "detect_preconstruction_intent",
    "search_preconstruction_properties",
    "standardize_preconstruction_property",
    "is_preconstruction_mls",
    "get_preconstruction_by_mls",
    "fetch_preconstruction_properties"
]

# Initialize cache on module load (fetch in background)
try:
    import threading
    def _init_cache():
        try:
            fetch_preconstruction_properties()
        except:
            pass
    
    # Start background fetch (non-blocking)
    threading.Thread(target=_init_cache, daemon=True).start()
    logger.info("🚀 Pre-construction cache initialization started in background")
except Exception as e:
    logger.warning(f"⚠️ Could not start background cache initialization: {e}")

