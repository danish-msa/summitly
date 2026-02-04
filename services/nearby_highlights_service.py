"""
Nearby Highlights Service - Property Area Amenities & Points of Interest
Provides information about parks, shopping, transit, and other highlights near properties
"""
import os
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class NearbyHighlightsService:
    """Service for fetching nearby highlights and amenities for properties"""
    
    def __init__(self):
        """Initialize the nearby highlights service"""
        logger.info("✅ Nearby Highlights Service initialized")
    
    def get_nearby_highlights(self, city: str, neighborhood: str = None, property_data: Dict = None) -> Dict:
        """
        Get nearby highlights for a property location.
        
        Args:
            city: City name
            neighborhood: Neighborhood/area name (optional)
            property_data: Full property data with coordinates (optional)
        
        Returns:
            {
                'success': bool,
                'city': str,
                'neighborhood': str,
                'highlights': {
                    'parks': [{'name': str, 'type': str, 'distance': str, 'features': [str]}],
                    'shopping': [{'name': str, 'type': str, 'distance': str}],
                    'transit': [{'name': str, 'type': str, 'distance': str}],
                    'dining': [{'name': str, 'type': str, 'distance': str}],
                    'recreation': [{'name': str, 'type': str, 'distance': str}]
                },
                'summary': str,
                'timestamp': str,
                'is_fallback': bool (optional),
                'data_source': str (optional),
                'note': str (optional)
            }
        """
        try:
            from datetime import datetime
            
            city_lower = city.lower() if city else ''
            neighborhood_lower = neighborhood.lower() if neighborhood else ''
            
            # Get highlights from curated data
            highlights = self._get_curated_highlights(city_lower, neighborhood_lower)
            
            is_fallback = False
            if not highlights or not any(highlights.values()):
                # Fallback to generic highlights
                highlights = self._get_generic_highlights(city)
                is_fallback = True
            
            # Count total highlights
            total_count = sum(len(v) for v in highlights.values())
            
            # Create summary
            categories = []
            for cat, items in highlights.items():
                if items:
                    categories.append(f"{len(items)} {cat}")
            summary = f"Found {', '.join(categories)} near {city}"
            
            logger.info(f"✅ [HIGHLIGHTS] Found {total_count} highlights for {city}")
            
            result = {
                'success': True,
                'city': city,
                'neighborhood': neighborhood or '',
                'highlights': highlights,
                'summary': summary,
                'timestamp': datetime.now().isoformat()
            }
            
            if is_fallback:
                result['is_fallback'] = True
                result['data_source'] = 'Generic Ontario neighborhood data'
                result['note'] = 'Showing typical amenities for Ontario neighborhoods'
            
            return result
            
        except Exception as e:
            logger.error(f"❌ [HIGHLIGHTS] Error: {e}")
            import traceback
            traceback.print_exc()
            
            # Return generic fallback on error
            from datetime import datetime
            return {
                'success': True,
                'city': city,
                'neighborhood': neighborhood or '',
                'highlights': self._get_generic_highlights(city),
                'summary': f'Showing typical amenities near {city}',
                'timestamp': datetime.now().isoformat(),
                'is_fallback': True,
                'data_source': 'Generic Ontario data',
                'note': 'Error fetching specific data - showing generic amenities'
            }
    
    def _get_curated_highlights(self, city: str, neighborhood: str = '') -> Dict:
        """Get curated highlights for major Ontario cities"""
        
        # Comprehensive curated data for major cities
        curated_data = {
            'toronto': {
                'parks': [
                    {'name': 'High Park', 'type': 'Large Urban Park', 'distance': '2-5 km', 'features': ['Zoo', 'Trails', 'Sports Fields', 'Cherry Blossoms']},
                    {'name': 'Toronto Islands', 'type': 'Island Parks', 'distance': 'Downtown area', 'features': ['Beaches', 'Bike Paths', 'Picnic Areas']},
                    {'name': 'Trinity Bellwoods Park', 'type': 'Community Park', 'distance': '1-3 km', 'features': ['Dog Park', 'Sports Courts', 'Community Events']},
                    {'name': 'Local Parks', 'type': 'Neighborhood Parks', 'distance': 'Within 1 km', 'features': ['Playgrounds', 'Green Space', 'Walking Paths']},
                ],
                'shopping': [
                    {'name': 'Eaton Centre', 'type': 'Shopping Mall', 'distance': 'Downtown'},
                    {'name': 'Yorkdale Shopping Centre', 'type': 'Premium Mall', 'distance': '5-10 km'},
                    {'name': 'Local Shopping Plazas', 'type': 'Retail Centers', 'distance': 'Within 2 km'},
                    {'name': 'Farmers Markets', 'type': 'Weekend Markets', 'distance': 'Various locations'},
                ],
                'transit': [
                    {'name': 'TTC Subway', 'type': 'Rapid Transit', 'distance': '500m-1km'},
                    {'name': 'Streetcar Routes', 'type': 'Local Transit', 'distance': '300-500m'},
                    {'name': 'Bus Routes', 'type': 'Local Transit', 'distance': '200-400m'},
                    {'name': 'GO Transit', 'type': 'Regional Rail', 'distance': 'Major stations'},
                ],
                'dining': [
                    {'name': 'Diverse Restaurants', 'type': 'International Cuisine', 'distance': 'Within 1-2 km'},
                    {'name': 'Local Cafes', 'type': 'Coffee Shops', 'distance': 'Within 500m'},
                    {'name': 'Food Halls', 'type': 'Dining Districts', 'distance': '2-5 km'},
                ],
                'recreation': [
                    {'name': 'Community Centers', 'type': 'Recreation Facilities', 'distance': 'Within 2 km'},
                    {'name': 'Cinemas', 'type': 'Entertainment', 'distance': 'Within 3 km'},
                    {'name': 'Fitness Centers', 'type': 'Gyms', 'distance': 'Within 1 km'},
                ]
            },
            'mississauga': {
                'parks': [
                    {'name': 'Jack Darling Memorial Park', 'type': 'Waterfront Park', 'distance': '3-7 km', 'features': ['Beach', 'Marina', 'Trails']},
                    {'name': 'Kariya Park', 'type': 'Japanese Garden', 'distance': '2-4 km', 'features': ['Zen Garden', 'Walking Paths']},
                    {'name': 'Credit River Parks', 'type': 'River Valley Parks', 'distance': '1-5 km', 'features': ['Trails', 'Nature', 'Fishing']},
                    {'name': 'Neighborhood Parks', 'type': 'Local Parks', 'distance': 'Within 1 km', 'features': ['Playgrounds', 'Sports Fields']},
                ],
                'shopping': [
                    {'name': 'Square One Shopping Centre', 'type': 'Major Mall', 'distance': 'Central'},
                    {'name': 'Erin Mills Town Centre', 'type': 'Shopping Mall', 'distance': '5-10 km'},
                    {'name': 'Local Plazas', 'type': 'Retail Centers', 'distance': 'Within 2 km'},
                ],
                'transit': [
                    {'name': 'MiWay Bus', 'type': 'Local Transit', 'distance': '300-500m'},
                    {'name': 'GO Transit', 'type': 'Regional Rail', 'distance': '2-5 km'},
                    {'name': 'Transitway BRT', 'type': 'Rapid Transit', 'distance': '1-3 km'},
                ],
                'dining': [
                    {'name': 'Port Credit Restaurants', 'type': 'Dining District', 'distance': '5-10 km'},
                    {'name': 'Local Restaurants', 'type': 'Various Cuisine', 'distance': 'Within 2 km'},
                    {'name': 'Food Courts', 'type': 'Quick Dining', 'distance': 'In malls'},
                ],
                'recreation': [
                    {'name': 'Recreation Centers', 'type': 'Community Facilities', 'distance': 'Within 3 km'},
                    {'name': 'Cineplex Cinemas', 'type': 'Entertainment', 'distance': 'Multiple locations'},
                ]
            },
            'ottawa': {
                'parks': [
                    {'name': 'Gatineau Park', 'type': 'Large Regional Park', 'distance': '10-20 km', 'features': ['Hiking', 'Skiing', 'Lakes']},
                    {'name': 'Major\'s Hill Park', 'type': 'Downtown Park', 'distance': 'Downtown area', 'features': ['Events', 'Views', 'Monuments']},
                    {'name': 'Rideau Canal Parkway', 'type': 'Linear Park', 'distance': 'Throughout city', 'features': ['Skating', 'Biking', 'Walking']},
                    {'name': 'Local Parks', 'type': 'Neighborhood Parks', 'distance': 'Within 1 km', 'features': ['Playgrounds', 'Sports']},
                ],
                'shopping': [
                    {'name': 'Rideau Centre', 'type': 'Shopping Mall', 'distance': 'Downtown'},
                    {'name': 'Bayshore Shopping Centre', 'type': 'Major Mall', 'distance': '5-10 km'},
                    {'name': 'ByWard Market', 'type': 'Market District', 'distance': 'Downtown'},
                ],
                'transit': [
                    {'name': 'OC Transpo', 'type': 'Bus System', 'distance': '300-500m'},
                    {'name': 'O-Train', 'type': 'Light Rail', 'distance': '1-2 km'},
                ],
                'dining': [
                    {'name': 'ByWard Market Restaurants', 'type': 'Dining District', 'distance': 'Downtown'},
                    {'name': 'Local Restaurants', 'type': 'Various Cuisine', 'distance': 'Within 2 km'},
                ],
                'recreation': [
                    {'name': 'Community Centers', 'type': 'Recreation', 'distance': 'Within 3 km'},
                    {'name': 'Museums', 'type': 'Cultural', 'distance': 'Downtown area'},
                ]
            },
            'brampton': {
                'parks': [
                    {'name': 'Gage Park', 'type': 'Urban Park', 'distance': '2-5 km', 'features': ['Sports', 'Trails', 'Community Events']},
                    {'name': 'Heart Lake Conservation Area', 'type': 'Conservation Park', 'distance': '5-10 km', 'features': ['Beach', 'Trails', 'Nature']},
                    {'name': 'Local Parks', 'type': 'Neighborhood Parks', 'distance': 'Within 1 km', 'features': ['Playgrounds', 'Sports Fields']},
                ],
                'shopping': [
                    {'name': 'Bramalea City Centre', 'type': 'Shopping Mall', 'distance': '3-7 km'},
                    {'name': 'Trinity Common', 'type': 'Shopping Center', 'distance': '2-5 km'},
                    {'name': 'Local Plazas', 'type': 'Retail', 'distance': 'Within 2 km'},
                ],
                'transit': [
                    {'name': 'Brampton Transit', 'type': 'Local Bus', 'distance': '300-500m'},
                    {'name': 'GO Transit', 'type': 'Regional Rail', 'distance': '2-5 km'},
                ],
                'dining': [
                    {'name': 'Local Restaurants', 'type': 'Diverse Cuisine', 'distance': 'Within 2 km'},
                    {'name': 'Food Courts', 'type': 'Quick Dining', 'distance': 'In malls'},
                ],
                'recreation': [
                    {'name': 'Community Centers', 'type': 'Recreation', 'distance': 'Within 3 km'},
                    {'name': 'Cinemas', 'type': 'Entertainment', 'distance': '3-5 km'},
                ]
            },
        }
        
        # Check for city match
        for known_city, highlights in curated_data.items():
            if known_city in city or city in known_city:
                return highlights
        
        return {}
    
    def _get_generic_highlights(self, city: str) -> Dict:
        """Get generic highlights when specific data isn't available"""
        return {
            'parks': [
                {'name': f'{city} Parks & Green Spaces', 'type': 'Various Parks', 'distance': 'Throughout area', 'features': ['Playgrounds', 'Trails', 'Sports Fields', 'Dog Parks']},
                {'name': 'Conservation Areas', 'type': 'Natural Areas', 'distance': 'Regional', 'features': ['Hiking', 'Nature', 'Wildlife']},
            ],
            'shopping': [
                {'name': 'Local Shopping Centers', 'type': 'Retail', 'distance': 'Within 2-5 km'},
                {'name': 'Grocery Stores', 'type': 'Essentials', 'distance': 'Within 1-2 km'},
                {'name': 'Specialty Shops', 'type': 'Local Businesses', 'distance': 'Throughout area'},
            ],
            'transit': [
                {'name': 'Local Transit', 'type': 'Bus Service', 'distance': 'Within 500m'},
                {'name': 'GO Transit', 'type': 'Regional Rail', 'distance': 'Major hubs'},
            ],
            'dining': [
                {'name': 'Local Restaurants', 'type': 'Various Cuisine', 'distance': 'Within 1-3 km'},
                {'name': 'Cafes & Coffee Shops', 'type': 'Quick Bites', 'distance': 'Within 500m-1km'},
                {'name': 'Fast Food', 'type': 'Quick Service', 'distance': 'Within 1-2 km'},
            ],
            'recreation': [
                {'name': 'Community Centers', 'type': 'Recreation Facilities', 'distance': 'Within 2-3 km'},
                {'name': 'Fitness Centers', 'type': 'Gyms', 'distance': 'Within 1-2 km'},
                {'name': 'Entertainment Venues', 'type': 'Cinemas, Theaters', 'distance': 'Within 3-5 km'},
            ]
        }


# Global instance
nearby_highlights_service = NearbyHighlightsService()


# Export function for easy import
def get_nearby_highlights(city: str, neighborhood: str = None, property_data: Dict = None) -> Dict:
    """Get nearby highlights for a property"""
    return nearby_highlights_service.get_nearby_highlights(city, neighborhood, property_data)


__all__ = ['NearbyHighlightsService', 'nearby_highlights_service', 'get_nearby_highlights']
