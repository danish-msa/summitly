"""
Commercial Property Service
===========================
Handles commercial property searches using commercialapp.py logic.
Integrates with chatbot_orchestrator for unified residential + commercial support.
"""

import os
import sys
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

# Import commercial app functions
app_path = Path(__file__).parent.parent / 'app'
sys.path.insert(0, str(app_path))

# Import from commercialapp.py
from commercialapp import (
    search_properties_progressive,
    filter_and_rank_properties,
    extract_fields_with_ai,
    REPLIERS_API_KEY,
    REPLIERS_BASE_URL,
    REPLIERS_CDN_BASE,
    log
)

class CommercialPropertyService:
    """Service for searching and managing commercial properties"""
    
    def __init__(self):
        """Initialize commercial property service"""
        self.api_key = REPLIERS_API_KEY
        self.base_url = REPLIERS_BASE_URL
        self.cdn_base = REPLIERS_CDN_BASE
        log("✅ Commercial Property Service initialized", "SUCCESS")
    
    def search_properties(self, criteria: Dict) -> Dict:
        """
        Search for commercial properties based on criteria.
        Uses commercialapp.py search logic.
        
        Args:
            criteria: {
                "location": "Toronto",
                "business_type": "retail",
                "price_min": 500000,
                "price_max": 2000000,
                "square_feet_min": 1000,
                ...
            }
        
        Returns:
            {
                "success": bool,
                "properties": [...],
                "count": int,
                "message": str
            }
        """
        try:
            log(f"🏢 [COMMERCIAL SEARCH] Starting with criteria: {criteria}", "SEARCH")
            
            # Extract location
            location = criteria.get("location", "")
            if not location:
                return {
                    "success": False,
                    "properties": [],
                    "count": 0,
                    "message": "Please specify a city or location"
                }
            
            # Use commercialapp.py's progressive search
            log(f"🏢 [COMMERCIAL] Calling search_properties_progressive for {location}", "SEARCH")
            properties, has_more = search_properties_progressive(
                city=location,
                criteria=criteria,
                quick_limit=20
            )
            
            if not properties:
                return {
                    "success": True,
                    "properties": [],
                    "count": 0,
                    "message": f"No commercial properties found in {location} matching your criteria"
                }
            
            # Use commercialapp.py's filter and rank
            log(f"🏢 [COMMERCIAL] Filtering and ranking {len(properties)} properties", "MATCH")
            filtered = filter_and_rank_properties(properties, criteria, min_results=15)
            
            # Format for frontend (take top 20)
            formatted = filtered[:20]
            
            # Count Sale vs Lease
            sale_count = sum(1 for p in formatted if p.get('property_type') == 'Sale')
            lease_count = sum(1 for p in formatted if p.get('property_type') == 'Lease')
            
            # DEBUG: Check prices and types AND MLS fields
            if formatted:
                sample_info = []
                for p in formatted[:3]:
                    sample_info.append({
                        'mls': p.get('mls'),
                        'mlsNumber': p.get('mlsNumber'),
                        'type': p.get('property_type'),
                        'listPrice': p.get('listPrice'),
                        'price': p.get('price'),
                        'price_text': p.get('price_text'),
                        'has_mls': bool(p.get('mls') or p.get('mlsNumber'))
                    })
                log(f"🔍 [DEBUG] Sample properties with MLS check: {sample_info}", "INFO")
                
                # Log ALL property keys for first property
                if formatted:
                    log(f"🔍 [DEBUG] First property keys: {list(formatted[0].keys())[:20]}", "INFO")
            
            # Build message
            if sale_count > 0 and lease_count > 0:
                type_msg = f"({sale_count} for sale, {lease_count} for lease)"
            elif lease_count > 0:
                type_msg = "(for lease)"
            elif sale_count > 0:
                type_msg = "(for sale)"
            else:
                type_msg = ""
            
            log(f"✅ [COMMERCIAL] Returning {len(formatted)} properties", "SUCCESS")
            
            return {
                "success": True,
                "properties": formatted,
                "count": len(formatted),
                "message": f"Found {len(formatted)} commercial properties {type_msg} in {location}"
            }
            
        except Exception as e:
            log(f"Commercial property search error: {e}", "ERROR")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "properties": [],
                "count": 0,
                "message": f"Error searching commercial properties: {str(e)}"
            }

# Singleton instance
_commercial_service = None

def get_commercial_service() -> CommercialPropertyService:
    """Get singleton commercial service instance"""
    global _commercial_service
    if _commercial_service is None:
        _commercial_service = CommercialPropertyService()
    return _commercial_service


# Convenience function
def search_commercial_properties(criteria: Dict) -> Dict:
    """
    Search commercial properties.
    
    Usage:
        result = search_commercial_properties({
            "location": "Toronto",
            "business_type": "retail",
            "price_max": 1000000
        })
    """
    service = get_commercial_service()
    return service.search_properties(criteria)
