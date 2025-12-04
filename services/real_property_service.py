"""
Real Property Search Service - Replaces Mock Data
Integrates with Repliers API and Exa AI for live property data
"""
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests

logger = logging.getLogger(__name__)

# Check if services are available
try:
    from services.listings_service import listings_service
    from services.nlp_service import nlp_service
    from services.estimates_service import estimates_service
    REPLIERS_AVAILABLE = True
except ImportError as e:
    REPLIERS_AVAILABLE = False
    logger.warning(f"Repliers services not available: {e}")

try:
    from exa_py import Exa
    exa_client = Exa(os.environ.get('EXA_API_KEY', ''))
    EXA_AVAILABLE = bool(os.environ.get('EXA_API_KEY'))
except:
    EXA_AVAILABLE = False
    exa_client = None


class RealPropertyService:
    """Service for fetching and transforming real property data"""
    
    def __init__(self):
        self.repliers_available = REPLIERS_AVAILABLE
        self.exa_available = EXA_AVAILABLE
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes
    
    def search_properties(
        self,
        location: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        bedrooms: Optional[int] = None,
        bathrooms: Optional[float] = None,
        property_type: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search for real properties using Repliers API
        
        Returns:
            {
                "success": bool,
                "properties": List[Dict],
                "count": int,
                "source": str,
                "message": str
            }
        """
        try:
            if not self.repliers_available:
                return self._fallback_search(location, limit)
            
            # Use Repliers NLP service for intelligent search
            search_query = self._build_search_query(
                location, min_price, max_price, bedrooms, bathrooms, property_type
            )
            
            logger.info(f"Searching properties with query: {search_query}")
            
            # Call Repliers NLP search
            result = nlp_service.process_query(
                prompt=search_query,
                user_id="system",
                execute_search=True
            )
            
            if result.get('error'):
                logger.error(f"NLP search error: {result.get('error')}")
                return self._fallback_search(location, limit)
            
            # Transform Repliers response to our format
            properties = self._transform_repliers_properties(
                result.get('results', [])
            )
            
            return {
                "success": True,
                "properties": properties[:limit],
                "count": len(properties),
                "source": "repliers_api",
                "message": f"Found {len(properties)} properties"
            }
            
        except Exception as e:
            logger.error(f"Property search error: {e}")
            return self._fallback_search(location, limit)
    
    def _build_search_query(
        self,
        location: Optional[str],
        min_price: Optional[int],
        max_price: Optional[int],
        bedrooms: Optional[int],
        bathrooms: Optional[float],
        property_type: Optional[str]
    ) -> str:
        """Build natural language search query"""
        parts = []
        
        if property_type:
            parts.append(f"{property_type}s")
        else:
            parts.append("properties")
        
        if location:
            parts.append(f"in {location}")
        
        if bedrooms:
            parts.append(f"with {bedrooms}+ bedrooms")
        
        if bathrooms:
            parts.append(f"and {bathrooms}+ bathrooms")
        
        if min_price and max_price:
            parts.append(f"priced between ${min_price:,} and ${max_price:,}")
        elif min_price:
            parts.append(f"priced above ${min_price:,}")
        elif max_price:
            parts.append(f"under ${max_price:,}")
        
        return " ".join(parts)
    
    def _transform_repliers_properties(self, raw_properties: List[Dict]) -> List[Dict]:
        """Transform Repliers API response to frontend format"""
        transformed = []
        
        for prop in raw_properties:
            try:
                transformed_prop = {
                    'id': prop.get('ListingKey') or prop.get('mlsNumber', f"PROP{len(transformed)+1}"),
                    'mls_number': prop.get('mlsNumber') or prop.get('ListingKey'),
                    'title': self._generate_title(prop),
                    'location': self._extract_location(prop),
                    'address': prop.get('UnparsedAddress') or prop.get('address', 'Address not available'),
                    'price': self._format_price(prop.get('ListPrice') or prop.get('price')),
                    'price_raw': prop.get('ListPrice') or prop.get('price', 0),
                    'beds': str(prop.get('BedroomsTotal') or prop.get('bedrooms', 0)),
                    'bedrooms': str(prop.get('BedroomsTotal') or prop.get('bedrooms', 0)),
                    'baths': str(prop.get('BathroomsTotalDecimal') or prop.get('bathrooms', 0)),
                    'bathrooms': str(prop.get('BathroomsTotalDecimal') or prop.get('bathrooms', 0)),
                    'sqft': self._format_sqft(prop.get('LivingArea') or prop.get('sqft')),
                    'property_type': prop.get('PropertyType') or prop.get('type', 'Residential'),
                    'image': self._get_primary_image(prop),
                    'image_url': self._get_primary_image(prop),
                    'images': prop.get('Media', []),
                    'listing_url': f"https://summitly.ca/properties/{prop.get('ListingKey', prop.get('mlsNumber', ''))}",
                    'description': prop.get('PublicRemarks') or prop.get('description', ''),
                    'status': prop.get('StandardStatus', 'Active'),
                    'days_on_market': prop.get('DaysOnMarket', 0),
                    'year_built': prop.get('YearBuilt'),
                    'lot_size': prop.get('LotSizeSquareFeet'),
                    'parking_spaces': prop.get('ParkingTotal', 0),
                    'raw_data': prop  # Keep raw data for advanced features
                }
                
                transformed.append(transformed_prop)
            except Exception as e:
                logger.error(f"Error transforming property: {e}")
                continue
        
        return transformed
    
    def _generate_title(self, prop: Dict) -> str:
        """Generate attractive property title"""
        property_type = prop.get('PropertyType', 'Property')
        beds = prop.get('BedroomsTotal', prop.get('bedrooms', ''))
        location = prop.get('City', prop.get('location', ''))
        
        if beds:
            return f"{beds} Bedroom {property_type} in {location}"
        return f"{property_type} in {location}"
    
    def _extract_location(self, prop: Dict) -> str:
        """Extract location string"""
        city = prop.get('City', '')
        state = prop.get('StateOrProvince', '')
        
        if city and state:
            return f"{city}, {state}"
        return city or state or "Location not available"
    
    def _format_price(self, price) -> str:
        """Format price for display"""
        if not price:
            return "Price upon request"
        
        try:
            price_num = float(price)
            if price_num >= 1000000:
                return f"${price_num/1000000:.2f}M"
            return f"${price_num:,.0f}"
        except:
            return str(price)
    
    def _format_sqft(self, sqft) -> str:
        """Format square footage"""
        if not sqft:
            return "N/A"
        
        try:
            return f"{int(sqft):,}"
        except:
            return str(sqft)
    
    def _get_primary_image(self, prop: Dict) -> str:
        """Get primary property image"""
        # Check for Media array
        media = prop.get('Media', [])
        if media and len(media) > 0:
            return media[0].get('MediaURL', self._get_placeholder_image())
        
        # Check for direct image field
        if prop.get('image'):
            return prop['image']
        
        # Return placeholder
        return self._get_placeholder_image()
    
    def _get_placeholder_image(self) -> str:
        """Get placeholder image"""
        return "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=250&fit=crop"
    
    def _fallback_search(self, location: Optional[str], limit: int) -> Dict[str, Any]:
        """Fallback when APIs are unavailable"""
        logger.warning("Using fallback search - no real API data available")
        
        return {
            "success": False,
            "properties": [],
            "count": 0,
            "source": "fallback",
            "message": "Property search temporarily unavailable. Please try again later or contact support.",
            "error": "API_UNAVAILABLE"
        }
    
    def get_property_details(self, mls_number: str) -> Dict[str, Any]:
        """Get detailed property information"""
        try:
            if not self.repliers_available:
                return {"success": False, "error": "Service unavailable"}
            
            # Get details from Repliers
            result = listings_service.get_listing_details(mls_number)
            
            if not result:
                return {"success": False, "error": "Property not found"}
            
            # Transform to frontend format
            property_data = self._transform_repliers_properties([result])
            
            return {
                "success": True,
                "property": property_data[0] if property_data else None
            }
            
        except Exception as e:
            logger.error(f"Error fetching property details: {e}")
            return {"success": False, "error": str(e)}
    
    def get_market_insights(self, location: str) -> Dict[str, Any]:
        """Get market insights using Exa AI"""
        try:
            if not self.exa_available:
                return self._fallback_insights(location)
            
            # Search for recent market data
            search_query = f"real estate market trends {location} Canada 2025"
            
            results = exa_client.search(
                search_query,
                num_results=5,
                use_autoprompt=True,
                type="neural"
            )
            
            # Extract insights from results
            insights = {
                "location": location,
                "average_price": "Data analyzing...",
                "price_trend": "neutral",
                "market_conditions": "balanced",
                "sources": [
                    {
                        "title": r.title,
                        "url": r.url,
                        "snippet": r.text[:200] if hasattr(r, 'text') else ""
                    }
                    for r in results.results
                ],
                "last_updated": datetime.now().isoformat()
            }
            
            return {
                "success": True,
                "insights": insights
            }
            
        except Exception as e:
            logger.error(f"Error fetching market insights: {e}")
            return self._fallback_insights(location)
    
    def _fallback_insights(self, location: str) -> Dict[str, Any]:
        """Fallback insights when Exa is unavailable"""
        return {
            "success": False,
            "insights": {
                "location": location,
                "message": "Market insights temporarily unavailable"
            }
        }


# Singleton instance
real_property_service = RealPropertyService()
