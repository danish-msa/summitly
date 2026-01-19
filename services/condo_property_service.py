"""
Condo Property Service
Handles condo property searches using the new condo_assistant.py architecture
WITH UNIVERSAL FALLBACK SYSTEM for all 60+ fields
"""
import sys
import os
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Configure logging
logger = logging.getLogger(__name__)

# Add app directory to path
app_dir = Path(__file__).parent.parent / "app"
sys.path.insert(0, str(app_dir))

try:
    from condo_assistant import (
        search_condo_properties as _search_condo_properties_core,
        extract_condo_criteria_with_ai,
        standardize_condo_property,
        CONDO_MLS_FIELDS
    )
    print("[OK] Condo assistant module imported successfully")
except ImportError as e:
    print(f"[ERROR] Failed to import condo_assistant module: {e}")
    raise

# Import universal fallback system
try:
    from services.universal_fallback import (
        UniversalCondoSearchFallback,
        SearchConfig,
        MatchLevel
    )
    print("[OK] Universal fallback system imported successfully")
    FALLBACK_ENABLED = True
except ImportError as e:
    print(f"[WARNING] Universal fallback system not available: {e}")
    FALLBACK_ENABLED = False


# ==================== FALLBACK SYSTEM INITIALIZATION ====================

# Initialize fallback system once
_fallback_system = None

def _get_fallback_system():
    """Get or create fallback system singleton"""
    global _fallback_system
    if _fallback_system is None and FALLBACK_ENABLED:
        def search_wrapper(criteria: Dict) -> List[Dict]:
            """Wrapper for search function used by fallback system"""
            result = _direct_search(criteria)
            return result.get("properties", [])
        
        _fallback_system = UniversalCondoSearchFallback(
            search_function=search_wrapper,
            config=SearchConfig()
        )
        logger.info("✅ Fallback system initialized")
    return _fallback_system


def _direct_search(criteria: Dict) -> Dict:
    """Direct search without fallback (internal use)"""
    location = criteria.get("location", "").strip()
    if not location:
        return {
            "success": False,
            "properties": [],
            "total": 0,
            "message": "Location required"
        }
    
    # Call core search
    result = _search_condo_properties_core(
        city=location,
        bedrooms=criteria.get("bedrooms"),
        bathrooms=criteria.get("bathrooms"),
        min_price=criteria.get("min_price"),
        max_price=criteria.get("max_price"),
        min_sqft=criteria.get("min_sqft"),
        max_sqft=criteria.get("max_sqft"),
        floor_level_min=criteria.get("floor_level_min"),
        floor_level_max=criteria.get("floor_level_max"),
        pets_permitted=criteria.get("pets_permitted"),
        amenities=criteria.get("amenities", []),
        listing_type=criteria.get("listing_type", "sale"),
        limit=criteria.get("limit", 100),
        balcony=criteria.get("balcony"),
        locker=criteria.get("locker"),
        parking_spaces=criteria.get("parking_spaces"),
        view=criteria.get("view"),
        exposure=criteria.get("exposure"),
        maintenance_fee_max=criteria.get("maintenance_fee_max"),
        laundry_level=criteria.get("laundry_level"),
        furnished=criteria.get("furnished"),
        waterfront=criteria.get("waterfront"),
        gym=criteria.get("gym"),
        pool=criteria.get("pool"),
        concierge=criteria.get("concierge"),
        elevator=criteria.get("elevator"),
        intersection=criteria.get("intersection"),
        **{k: v for k, v in criteria.items() if k not in [
            'city', 'location', 'bedrooms', 'bathrooms', 
            'min_price', 'max_price', 'min_sqft', 'max_sqft',
            'floor_level_min', 'floor_level_max', 'pets_permitted',
            'amenities', 'listing_type', 'limit', 'balcony', 'locker',
            'parking_spaces', 'view', 'exposure', 'maintenance_fee_max',
            'laundry_level', 'furnished', 'waterfront', 'gym', 'pool',
            'concierge', 'elevator', 'user_query', 'intersection'
        ]}
    )
    
    return result

def search_condo_properties(criteria: Dict) -> Dict:
    """
    Search for condo properties based on criteria.
    Uses new condo_assistant.py with voice_assistant_clean.py architecture.
    NOW WITH UNIVERSAL FALLBACK SYSTEM for all 60+ fields!
    
    Args:
        criteria: Dict containing search parameters
            - location: City name (required)
            - user_query: Natural language query (optional)
            - bedrooms: Number of bedrooms
            - bathrooms: Number of bathrooms
            - min_price/max_price: Price range
            - min_sqft/max_sqft: Square footage range
            - floor_level_min: Minimum floor level
            - pets_permitted: Boolean
            - amenities: List of amenities (gym, pool, concierge, etc.)
            - listing_type: 'sale' or 'rent' (default: 'sale')
            - limit: Max results (default: 20)
            - ... ALL 60+ condo fields supported ...
    
    Returns:
        Dict with:
            - success: Boolean
            - properties: List of matching condos
            - total: Total count
            - criteria: Search criteria used
            - message: Status message (includes fallback info)
            - match_level: Quality of match (if fallback used)
            - relaxed_constraints: List of fields relaxed (if any)
    """
    try:
        print(f"\n{'='*60}")
        print(f"🏙️ CONDO SEARCH REQUEST (WITH UNIVERSAL FALLBACK)")
        print(f"{'='*60}")
        print(f"Criteria: {criteria}")
        
        # Extract location
        location = criteria.get("location", "").strip()
        if not location:
            return {
                "success": False,
                "properties": [],
                "total": 0,
                "message": "Please specify a city or location",
                "error": "missing_location"
            }
        
        print(f"📍 Location: {location}")
        
        # Extract user query for AI processing
        user_query = criteria.get("user_query", "")
        if user_query:
            print(f"🤖 User Query: '{user_query}'")
            
            # Extract criteria from natural language
            extracted = extract_condo_criteria_with_ai(user_query)
            
            # Handle intersection searches specially
            if 'intersection' in extracted:
                print(f"🚦 Intersection detected: {extracted['intersection']}")
                # Intersection overrides specific location
                extracted['location'] = location  # Keep city but search by intersection
            
            # Merge with provided criteria (provided takes precedence)
            criteria = {**extracted, **criteria}
            print(f"🤖 Extracted criteria: {extracted}")
            print(f"📊 Final merged criteria: {list(criteria.keys())}")
        
        
        print(f"\n{'='*60}")
        print(f"STEP 1: SEARCHING WITH UNIVERSAL FALLBACK SYSTEM")
        print(f"{'='*60}")
        
        # Use universal fallback system if available
        if FALLBACK_ENABLED:
            fallback = _get_fallback_system()
            result = fallback.search_with_fallback(criteria)
            
            print(f"\n🎯 FALLBACK RESULT:")
            print(f"   Match Level: {result.match_level.value}")
            print(f"   Properties: {result.count}")
            print(f"   Score: {result.score}")
            if result.relaxed_constraints:
                print(f"   Relaxed: {', '.join(result.relaxed_constraints)}")
            print(f"   Message: {result.message}")
            
            return {
                "success": result.count > 0,
                "properties": result.properties,
                "total": result.count,
                "message": result.message,
                "criteria": criteria,
                "match_level": result.match_level.value,
                "relaxed_constraints": result.relaxed_constraints,
                "match_score": result.score
            }
        
        # Fallback not available - use direct search
        else:
            print("⚠️ Universal fallback not available, using direct search")
            result = _direct_search(criteria)
            
            if not result.get("success"):
                return {
                    "success": False,
                    "properties": [],
                    "total": 0,
                    "message": result.get("error", "Search failed"),
                    "error": result.get("error")
                }
            
            properties = result.get("properties", [])
            total = result.get("total", 0)
            
            print(f"\n{'='*60}")
            print(f"🎯 FINAL RESULTS: {total} condos")
            print(f"{'='*60}\n")
            
            return {
                "success": True,
                "properties": properties,
                "total": total,
                "message": f"Found {total} condos in {location}",
                "criteria": criteria
            }
        
    except Exception as e:
        print(f"❌ Error in condo search: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "properties": [],
            "total": 0,
            "message": f"Error searching condos: {str(e)}",
            "error": str(e)
        }

def get_condo_field_definitions() -> Dict:
    """
    Get all available condo-specific field definitions.
    Useful for understanding what fields can be searched.
    """
    return CONDO_MLS_FIELDS



# Export for external use
__all__ = [
    "search_condo_properties",
    "get_condo_field_definitions"
]
