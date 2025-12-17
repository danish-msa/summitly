"""
Neighborhood Normalizer Service
================================
Maps conversational neighborhood names to official MLS neighborhood names.

PROBLEM: Users say "King West" or "Downtown Toronto" but Repliers API expects
exact MLS neighborhood names like "Niagara" or "Waterfront Communities C1".

SOLUTION: Maintain mapping of common aliases to actual MLS neighborhoods.
"""

from typing import List, Optional, Dict
import logging

logger = logging.getLogger(__name__)

# Toronto Neighborhood Alias Mapping
# Key: Conversational name (lowercase)
# Value: List of actual MLS neighborhoods to query
NEIGHBORHOOD_ALIAS_MAP: Dict[str, List[str]] = {
    # Downtown areas
    "downtown toronto": [
        "Waterfront Communities C1",
        "Church-Yonge Corridor",
        "Bay Street Corridor",
        "Niagara",
        "St. Lawrence",
        "Moss Park",
        "Corktown"
    ],
    "downtown": [
        "Waterfront Communities C1",
        "Church-Yonge Corridor",
        "Bay Street Corridor",
        "Niagara",
        "St. Lawrence",
        "Moss Park",
        "Corktown"
    ],
    "downtown core": [
        "Bay Street Corridor",
        "Church-Yonge Corridor",
        "Waterfront Communities C1"
    ],
    
    # Financial District
    "financial district": [
        "Bay Street Corridor",
        "Church-Yonge Corridor"
    ],
    "financial core": [
        "Bay Street Corridor",
        "Church-Yonge Corridor"
    ],
    
    # King West / Entertainment District
    "king west": [
        "Niagara",
        "Waterfront Communities C1",
        "Fashion District"
    ],
    "king west village": [
        "Niagara",
        "Waterfront Communities C1"
    ],
    "entertainment district": [
        "Niagara",
        "Waterfront Communities C1"
    ],
    
    # Liberty Village
    "liberty village": [
        "Niagara",
        "Trinity-Bellwoods"
    ],
    
    # Waterfront areas
    "waterfront": [
        "Waterfront Communities C1",
        "Waterfront Communities C8",
        "Niagara"
    ],
    "harbourfront": [
        "Waterfront Communities C1"
    ],
    
    # Yonge-Dundas / Entertainment
    "yonge and dundas": [
        "Church-Yonge Corridor",
        "Bay Street Corridor"
    ],
    "yonge-dundas": [
        "Church-Yonge Corridor",
        "Bay Street Corridor"
    ],
    
    # Yorkville
    "yorkville": [
        "Yonge-St.Clair",
        "Church-Yonge Corridor"
    ],
    
    # The Annex
    "the annex": [
        "Annex",
        "University"
    ],
    "annex": [
        "Annex",
        "University"
    ],
    
    # Distillery District
    "distillery district": [
        "Corktown",
        "St. Lawrence"
    ],
    "distillery": [
        "Corktown",
        "St. Lawrence"
    ],
    
    # Fashion District
    "fashion district": [
        "Fashion District",
        "Niagara"
    ],
    
    # Queen West
    "queen west": [
        "Trinity-Bellwoods",
        "Niagara"
    ],
    
    # Leslieville
    "leslieville": [
        "South Riverdale",
        "East End-Danforth"
    ],
    
    # The Beaches
    "the beaches": [
        "The Beaches"
    ],
    "beaches": [
        "The Beaches"
    ],
    
    # North York areas
    "north york": [
        "Willowdale East",
        "Willowdale West",
        "Newtonbrook East",
        "Newtonbrook West",
        "York Mills"
    ],
    "north york centre": [
        "Willowdale East",
        "Newtonbrook West"
    ],
    
    # Scarborough
    "scarborough": [
        "Agincourt North",
        "Agincourt South-Malvern West",
        "Birch Cliff-Cliffside",
        "Clairlea-Birchmount",
        "Cliffcrest",
        "Golden Mile",
        "Scarborough Village"
    ],
    
    # Etobicoke
    "etobicoke": [
        "Kingsway South",
        "Mimico",
        "New Toronto",
        "Long Branch",
        "Humber Bay"
    ],
    
    # Midtown
    "midtown": [
        "Yonge-Eglinton",
        "Yonge-St.Clair",
        "Mount Pleasant East",
        "Mount Pleasant West"
    ],
    "midtown toronto": [
        "Yonge-Eglinton",
        "Yonge-St.Clair",
        "Mount Pleasant East",
        "Mount Pleasant West"
    ],
    
    # High Park
    "high park": [
        "High Park-Swansea",
        "High Park North"
    ],
}


def normalize_neighborhood(conversational_name: Optional[str]) -> List[str]:
    """
    Convert conversational neighborhood name to MLS neighborhood(s).
    
    Args:
        conversational_name: User's input like "King West" or "Downtown"
        
    Returns:
        List of MLS neighborhood names to query. If no mapping found,
        returns original name in a list (Repliers might still recognize it).
        
    Examples:
        >>> normalize_neighborhood("King West")
        ['Niagara', 'Waterfront Communities C1', 'Fashion District']
        
        >>> normalize_neighborhood("Downtown Toronto")
        ['Waterfront Communities C1', 'Church-Yonge Corridor', ...]
        
        >>> normalize_neighborhood("Rosedale")  # Exact MLS name
        ['Rosedale']
    """
    if not conversational_name:
        return []
    
    # Normalize to lowercase for lookup
    key = conversational_name.lower().strip()
    
    # Check if we have an alias mapping
    if key in NEIGHBORHOOD_ALIAS_MAP:
        mls_neighborhoods = NEIGHBORHOOD_ALIAS_MAP[key]
        logger.info(
            f"Neighborhood alias expanded: '{conversational_name}' -> {mls_neighborhoods}"
        )
        return mls_neighborhoods
    
    # No mapping found - return original (might be exact MLS name)
    logger.debug(
        f"No neighborhood alias for '{conversational_name}', using as-is"
    )
    return [conversational_name]


def should_expand_neighborhood(neighborhood: Optional[str]) -> bool:
    """
    Check if a neighborhood name should be expanded to multiple MLS neighborhoods.
    
    Args:
        neighborhood: Neighborhood name to check
        
    Returns:
        True if we have an alias mapping for this neighborhood
    """
    if not neighborhood:
        return False
    
    return neighborhood.lower().strip() in NEIGHBORHOOD_ALIAS_MAP


def get_neighborhood_aliases() -> Dict[str, List[str]]:
    """
    Get the full neighborhood alias mapping (for debugging/documentation).
    
    Returns:
        Dictionary of conversational names -> MLS neighborhoods
    """
    return NEIGHBORHOOD_ALIAS_MAP.copy()
