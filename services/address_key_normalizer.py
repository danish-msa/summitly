"""
Address Key Normalizer Service
==============================
Converts user address input into Repliers-compatible addressKey format.
This normalizer handles various address formats and creates consistent
keys for exact matching and street-level contains queries.

Format Rules:
- Lowercase everything
- Remove spaces and punctuation  
- Concatenate: [unitNumber][streetNumber][streetName][streetSuffix][city]

Examples:
- "55 Bamburgh Circle unit 1209" → "120955bamburghcircletoronto"
- "Bamburgh Circle" → "bamburghcircletoronto"

Author: Summitly Team
Date: December 20, 2025
"""

import logging
import re
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from services.address_intent_detector import AddressComponents

logger = logging.getLogger(__name__)


@dataclass
class NormalizedAddress:
    """Normalized address data for Repliers API."""
    exact_address_key: Optional[str] = None      # For exact address matching
    street_address_key: Optional[str] = None     # For street-level matching
    search_query: Optional[str] = None           # For text search fallback
    components: Optional[AddressComponents] = None
    confidence: float = 0.0
    normalization_notes: List[str] = None
    
    def __post_init__(self):
        if self.normalization_notes is None:
            self.normalization_notes = []


class AddressKeyNormalizer:
    """
    Normalizes address components into Repliers API compatible formats.
    
    This service creates multiple search strategies:
    1. Exact addressKey matching for specific addresses
    2. Street-level addressKey contains/like queries  
    3. Text search fallbacks for complex cases
    """
    
    def __init__(self):
        # Street suffix normalization mapping
        self.suffix_normalizations = {
            # Standard forms to use in addressKey
            'street': 'street', 'st': 'street',
            'avenue': 'avenue', 'ave': 'avenue', 
            'road': 'road', 'rd': 'road',
            'drive': 'drive', 'dr': 'drive',
            'circle': 'circle', 'cir': 'circle',
            'boulevard': 'boulevard', 'blvd': 'boulevard',
            'lane': 'lane', 'ln': 'lane',
            'way': 'way',
            'crescent': 'crescent', 'cr': 'crescent', 'cres': 'crescent',
            'court': 'court', 'ct': 'court',
            'place': 'place', 'pl': 'place',
            'terrace': 'terrace', 'ter': 'terrace',
            'parkway': 'parkway', 'pkwy': 'parkway',
            'trail': 'trail', 'tr': 'trail',
            'path': 'path',
            'grove': 'grove', 'gr': 'grove',
            'square': 'square', 'sq': 'square',
            'gardens': 'gardens', 'gdns': 'gardens',
            'heights': 'heights', 'hts': 'heights',
            'hill': 'hill', 'hl': 'hill',
            'valley': 'valley', 'vly': 'valley',
            'ridge': 'ridge', 'rdg': 'ridge',
            'green': 'green', 'grn': 'green',
            'close': 'close', 'cl': 'close'
        }
        
        # City name normalizations
        self.city_normalizations = {
            'toronto': 'toronto',
            'mississauga': 'mississauga', 
            'vaughan': 'vaughan',
            'brampton': 'brampton',
            'markham': 'markham',
            'richmond hill': 'richmondhill',
            'oakville': 'oakville',
            'burlington': 'burlington',
            'ajax': 'ajax',
            'whitby': 'whitby',
            'pickering': 'pickering',
            'milton': 'milton',
            'georgetown': 'georgetown',
            'newmarket': 'newmarket',
            'aurora': 'aurora',
            'king city': 'kingcity',
            'bradford': 'bradford',
            'caledon': 'caledon',
            'halton hills': 'haltonhills'
        }
        
        logger.info("✅ AddressKeyNormalizer initialized")
    
    def normalize_address(
        self, 
        components: AddressComponents,
        force_city: Optional[str] = None
    ) -> NormalizedAddress:
        """
        Normalize address components into Repliers addressKey format.
        
        Args:
            components: Extracted address components
            force_city: Override city if provided
            
        Returns:
            NormalizedAddress with exact and street-level keys
        """
        notes = []
        
        # Determine city
        city = force_city or components.city or "toronto"
        normalized_city = self._normalize_city(city)
        notes.append(f"Using city: {city} → {normalized_city}")
        
        # Normalize street components
        street_name = self._normalize_street_name(components.street_name) if components.street_name else None
        street_suffix = self._normalize_street_suffix(components.street_suffix) if components.street_suffix else None
        
        if not street_name or not street_suffix:
            notes.append("Missing required street name or suffix")
            return NormalizedAddress(
                components=components,
                confidence=0.0,
                normalization_notes=notes
            )
        
        # Build addressKey components
        unit_part = self._normalize_unit(components.unit_number) if components.unit_number else ""
        number_part = self._normalize_street_number(components.street_number) if components.street_number else ""
        
        # Create street-level addressKey (always available)
        street_key = f"{street_name}{street_suffix}{normalized_city}"
        notes.append(f"Street key: {street_key}")
        
        # Create exact addressKey if we have a street number
        exact_key = None
        if number_part:
            exact_key = f"{unit_part}{number_part}{street_name}{street_suffix}{normalized_city}"
            notes.append(f"Exact key: {exact_key}")
        
        # Create search query fallback
        search_query = self._create_search_query(components)
        notes.append(f"Search query: {search_query}")
        
        # Calculate confidence
        confidence = self._calculate_confidence(components, street_key, exact_key)
        
        return NormalizedAddress(
            exact_address_key=exact_key,
            street_address_key=street_key,
            search_query=search_query,
            components=components,
            confidence=confidence,
            normalization_notes=notes
        )
    
    def _normalize_city(self, city: str) -> str:
        """Normalize city name for addressKey."""
        clean_city = city.lower().strip()
        return self.city_normalizations.get(clean_city, clean_city.replace(' ', ''))
    
    def _normalize_street_name(self, street_name: str) -> str:
        """Normalize street name for addressKey."""
        if not street_name:
            return ""
        
        # Convert to lowercase, remove spaces and punctuation
        normalized = re.sub(r'[^a-z0-9]', '', street_name.lower())
        return normalized
    
    def _normalize_street_suffix(self, street_suffix: str) -> str:
        """Normalize street suffix for addressKey."""
        if not street_suffix:
            return ""
        
        clean_suffix = street_suffix.lower().strip()
        return self.suffix_normalizations.get(clean_suffix, clean_suffix)
    
    def _normalize_unit(self, unit_number: str) -> str:
        """Normalize unit number for addressKey."""
        if not unit_number:
            return ""
        
        # Remove any non-alphanumeric characters and convert to lowercase
        normalized = re.sub(r'[^a-z0-9]', '', unit_number.lower())
        return normalized
    
    def _normalize_street_number(self, street_number: str) -> str:
        """Normalize street number for addressKey."""
        if not street_number:
            return ""
        
        # Remove any non-alphanumeric characters and convert to lowercase  
        normalized = re.sub(r'[^a-z0-9]', '', street_number.lower())
        return normalized
    
    def _create_search_query(self, components: AddressComponents) -> str:
        """Create text search query as fallback."""
        parts = []
        
        if components.street_number:
            parts.append(components.street_number)
        
        if components.street_name:
            parts.append(components.street_name)
            
        if components.street_suffix:
            parts.append(components.street_suffix)
        
        return " ".join(parts) if parts else ""
    
    def _calculate_confidence(
        self, 
        components: AddressComponents,
        street_key: Optional[str],
        exact_key: Optional[str]
    ) -> float:
        """Calculate confidence score for normalization."""
        score = 0.0
        
        # Base score for having street components
        if street_key:
            score += 0.5
        
        # Bonus for exact address
        if exact_key:
            score += 0.3
        
        # Bonus for unit number
        if components.unit_number:
            score += 0.1
        
        # Bonus for clean components (no special characters)
        if components.street_name and re.match(r'^[a-zA-Z\s]+$', components.street_name):
            score += 0.1
        
        return min(score, 1.0)
    
    def normalize_from_user_input(
        self, 
        user_input: str,
        current_location: Optional[str] = None
    ) -> NormalizedAddress:
        """
        Convenience method to normalize directly from user input.
        
        Args:
            user_input: Raw user message
            current_location: Session location context
            
        Returns:
            NormalizedAddress with normalized keys
        """
        from services.address_intent_detector import get_address_intent_detector
        
        detector = get_address_intent_detector()
        intent_result = detector.detect_intent(user_input, current_location)
        
        if intent_result.intent_type.value in ['address_search', 'street_search']:
            return self.normalize_address(intent_result.components, current_location)
        
        # Return empty result for non-address queries
        return NormalizedAddress(
            components=intent_result.components,
            confidence=0.0,
            normalization_notes=["Not an address query"]
        )


# Example usage patterns for different search strategies
SEARCH_STRATEGY_EXAMPLES = {
    "exact_match": {
        "description": "Use exact_address_key for precise address matching",
        "repliers_param": "addressKey",
        "example": "addressKey=120955bamburghcircletoronto"
    },
    "street_contains": {
        "description": "Use street_address_key with CONTAINS/LIKE for street-level search",
        "repliers_param": "addressKey LIKE '%{street_key}%'",  
        "example": "addressKey LIKE '%bamburghcircletoronto%'"
    },
    "text_search": {
        "description": "Use search_query for text-based fallback search",
        "repliers_param": "q",
        "example": "q=bamburgh circle"
    }
}


# Singleton instance
_normalizer_instance = None


def get_address_key_normalizer() -> AddressKeyNormalizer:
    """Get singleton instance of AddressKeyNormalizer."""
    global _normalizer_instance
    if _normalizer_instance is None:
        _normalizer_instance = AddressKeyNormalizer()
    return _normalizer_instance