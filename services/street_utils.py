"""
Street Name Utilities for MLS Search
=====================================
Production-grade street name normalization and matching utilities.

DESIGN DECISIONS:
- Deterministic normalization (no fuzzy matching)
- Handles Canadian street naming conventions
- Fast: O(1) lookups after normalization
- Safe: No regex guessing or substring matches

Author: Summitly Team  
Date: December 18, 2024
"""

import re
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Common street suffixes in Canadian addresses
STREET_SUFFIXES = {
    'street', 'st', 'st.', 'str',
    'avenue', 'ave', 'ave.', 'av',
    'road', 'rd', 'rd.',
    'drive', 'dr', 'dr.',
    'boulevard', 'blvd', 'blvd.',
    'lane', 'ln', 'ln.',
    'court', 'ct', 'ct.',
    'circle', 'cir', 'cir.',
    'way',
    'place', 'pl', 'pl.',
    'crescent', 'cres', 'cres.',
    'terrace', 'ter', 'ter.',
    'square', 'sq', 'sq.',
    'parkway', 'pkwy', 'pkwy.'
}

# Directional indicators
DIRECTIONS = {'n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw', 'north', 'south', 'east', 'west'}


def normalize_street_name(street: str) -> str:
    """
    Normalize street name for exact matching.
    
    Rules:
    1. Convert to lowercase
    2. Remove punctuation (periods, commas)
    3. Strip common suffixes (Street, Ave, etc.) FROM END ONLY
    4. Strip directional prefixes/suffixes (N, South, etc.)
    5. Remove extra whitespace
    6. Return core street name only
    
    Examples:
        "Yonge Street" → "yonge"
        "Yonge St." → "yonge"
        "YONGE" → "yonge"
        "King Street West" → "king west"
        "King St W" → "king west"
        "123 Bloor Avenue" → "bloor"  # Numbers stripped
        "St. Clair Avenue" → "st clair"  # "st" preserved (not at end)
        
    Args:
        street: Raw street name from user or MLS data
        
    Returns:
        Normalized street name (lowercase, no suffixes)
    """
    if not street:
        return ""
    
    # Convert to lowercase
    normalized = street.lower().strip()
    
    # Remove punctuation
    normalized = normalized.replace('.', '').replace(',', '').replace('-', ' ')
    
    # Remove leading numbers (street numbers like "123 King Street" → "King Street")
    normalized = re.sub(r'^\d+\s+', '', normalized)
    
    # Split into words
    words = normalized.split()
    
    # Expand directional abbreviations for consistency
    # "w" → "west", "e" → "east", etc.
    direction_map = {
        'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
        'ne': 'northeast', 'nw': 'northwest', 'se': 'southeast', 'sw': 'southwest'
    }
    words = [direction_map.get(word, word) for word in words]
    
    # Remove ALL suffix words (not just from end)
    # But preserve if it's the first word (like "St. Clair")
    filtered_words = []
    for i, word in enumerate(words):
        # Keep first word even if it's a suffix (handles "St. Clair")
        # Remove suffix words that appear in middle or end
        if i == 0 or word not in STREET_SUFFIXES:
            filtered_words.append(word)
    
    # Rejoin
    normalized = ' '.join(filtered_words).strip()
    
    # Handle edge case: if everything was removed, return original lowercase
    if not normalized:
        normalized = street.lower().strip()
    
    return normalized


def extract_street_direction(street: str) -> Tuple[str, Optional[str]]:
    """
    Extract directional indicator from street name.
    
    Examples:
        "King Street West" → ("King Street", "west")
        "Queen St E" → ("Queen St", "east")
        "Queen St W" → ("Queen St", "west")  # W expanded
        "Yonge Street" → ("Yonge Street", None)
        
    Args:
        street: Full street name with potential direction
        
    Returns:
        Tuple of (street_without_direction, direction_or_none)
    """
    if not street:
        return "", None
    
    words = street.lower().strip().split()
    
    # Expand directional abbreviations first
    direction_map = {
        'n': 'north', 's': 'south', 'e': 'east', 'w': 'west',
        'ne': 'northeast', 'nw': 'northwest', 'se': 'southeast', 'sw': 'southwest'
    }
    words = [direction_map.get(word, word) for word in words]
    
    # Check last word for direction
    if words and words[-1] in DIRECTIONS:
        direction = words[-1]
        street_without_dir = ' '.join(words[:-1])
        return street_without_dir, direction
    
    # Check first word for direction (less common)
    if words and words[0] in DIRECTIONS:
        direction = words[0]
        street_without_dir = ' '.join(words[1:])
        return street_without_dir, direction
    
    return street, None


def streets_match(user_street: str, listing_street: str, strict_direction: bool = True) -> bool:
    """
    Check if two street names match after normalization.
    
    Rules:
    - Both streets are normalized first
    - Exact match required (NO substring/fuzzy matching)
    - Directional indicators respected if strict_direction=True
    
    Examples (strict_direction=True):
        "Yonge Street", "Yonge St" → True
        "King Street West", "King St W" → True
        "King Street West", "King Street East" → False
        "Yonge", "Yonge Street" → True
        "Yonge", "Young Street" → False
        
    Examples (strict_direction=False):
        "King Street West", "King Street East" → True
        
    Args:
        user_street: Street name from user input
        listing_street: Street name from MLS listing
        strict_direction: If True, directions must match
        
    Returns:
        True if streets match, False otherwise
    """
    if not user_street or not listing_street:
        return False
    
    # Extract directions first
    user_base, user_dir = extract_street_direction(user_street)
    listing_base, listing_dir = extract_street_direction(listing_street)
    
    # Normalize base names (without direction)
    norm_user_base = normalize_street_name(user_base)
    norm_listing_base = normalize_street_name(listing_base)
    
    # If not strict about direction, just compare base names
    if not strict_direction:
        return norm_user_base == norm_listing_base
    
    # Base names must match
    if norm_user_base != norm_listing_base:
        return False
    
    # If user specified direction, it must match
    if user_dir and listing_dir:
        return user_dir == listing_dir
    
    # If user didn't specify direction, accept any direction
    return True


def validate_street_search_params(street_name: Optional[str], city: Optional[str]) -> Tuple[bool, str]:
    """
    Validate that street search has minimum required parameters.
    
    Rules:
    - street_name is required
    - city is required (Repliers limitation)
    - street_name must be at least 3 characters
    
    Args:
        street_name: Street name to search
        city: City to search in
        
    Returns:
        Tuple of (is_valid, error_message_or_empty)
    """
    if not street_name or len(street_name.strip()) < 3:
        return False, "Street name must be at least 3 characters"
    
    if not city or len(city.strip()) < 2:
        return False, "City is required for street searches. Which city should I search in?"
    
    return True, ""


def extract_street_from_address(full_address: str) -> Optional[str]:
    """
    Extract just the street name from a full address.
    
    Handles MLS address formats like:
    - "920 Yonge Street, Toronto, ON"
    - "Unit 203, 123 King Street West"
    - "45 Bay Street"
    
    Args:
        full_address: Full address string from MLS
        
    Returns:
        Extracted street name or None
    """
    if not full_address:
        return None
    
    # Remove unit numbers
    address = re.sub(r'^Unit\s+\w+,?\s*', '', full_address, flags=re.IGNORECASE)
    
    # Split by comma to get just street part
    parts = address.split(',')
    street_part = parts[0].strip()
    
    # Remove leading numbers (street address number)
    street_name = re.sub(r'^\d+\s+', '', street_part).strip()
    
    return street_name if street_name else None


# ==================== LOGGING HELPERS ====================

def log_street_search(user_street: str, city: str, normalized_street: str):
    """Log street search parameters for debugging"""
    logger.info(
        f"🛣️ [STREET SEARCH] "
        f"user_input='{user_street}' | "
        f"normalized='{normalized_street}' | "
        f"city='{city}'"
    )


def log_street_match(user_street: str, listing_street: str, matched: bool):
    """Log street matching decision for debugging"""
    if matched:
        logger.debug(
            f"✅ [STREET MATCH] '{user_street}' matches '{listing_street}'"
        )
    else:
        logger.debug(
            f"❌ [STREET NO-MATCH] '{user_street}' != '{listing_street}'"
        )


def log_street_filter_stats(total_fetched: int, matches_found: int, pages_fetched: int):
    """Log street filtering statistics"""
    logger.info(
        f"📊 [STREET FILTER] "
        f"fetched={total_fetched} | "
        f"matched={matches_found} | "
        f"pages={pages_fetched} | "
        f"match_rate={matches_found/total_fetched*100:.1f}% "
        if total_fetched > 0 else f"📊 [STREET FILTER] No properties fetched"
    )
