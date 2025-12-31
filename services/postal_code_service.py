"""
Canadian postal code handling service.
Supports FSA (3-char) and full postal codes (6-char).
Includes FSA radius expansion for comprehensive searches.

Features:
- Postal code validation (FSA and full format)
- Province mapping from postal code prefix
- Urban vs rural detection for appropriate search radius
- City validation against postal code
- No external API calls (local validation only)
"""

import logging
import re
from typing import Optional, List, Dict, Tuple, Any
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class PostalCodeInfo:
    """Information about a Canadian postal code"""
    code: str  # Normalized code with space for full (e.g., "M5V 1A1")
    fsa: str  # Forward Sortation Area (first 3 chars, e.g., "M5V")
    is_full: bool  # True if 6-char, False if FSA only
    city: Optional[str] = None
    province: Optional[str] = None
    is_urban: bool = True  # True if urban FSA, False if rural
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            'code': self.code,
            'fsa': self.fsa,
            'is_full': self.is_full,
            'city': self.city,
            'province': self.province,
            'is_urban': self.is_urban
        }


class PostalCodeService:
    """
    Handles Canadian postal code validation, normalization, and lookup.
    
    Canadian Postal Code Format:
    - FSA (Forward Sortation Area): 3 characters (e.g., "M5V")
      - 1st char: Province/territory/region (letter)
      - 2nd char: Urban (digit 0-9) or Rural (letter, except D, F, I, O, Q, U, W, Z)
      - 3rd char: Delivery area (letter, except D, F, I, O, Q, U)
    - LDU (Local Delivery Unit): 3 characters (e.g., "1A1")
      - 4th char: Sector within FSA (digit)
      - 5th char: Block face (letter)
      - 6th char: Individual delivery point (digit)
    
    Full postal code: FSA + LDU (e.g., "M5V 1A1")
    """
    
    # Canadian FSA first letter -> Province mapping
    PROVINCE_MAPPING: Dict[str, List[str]] = {
        'A': ['NL'],  # Newfoundland and Labrador
        'B': ['NS'],  # Nova Scotia
        'C': ['PE'],  # Prince Edward Island
        'E': ['NB'],  # New Brunswick
        'G': ['QC'],  # Quebec (East)
        'H': ['QC'],  # Montreal
        'J': ['QC'],  # Quebec (West)
        'K': ['ON'],  # Ontario (East)
        'L': ['ON'],  # Ontario (Central - GTA)
        'M': ['ON'],  # Toronto
        'N': ['ON'],  # Ontario (Southwest)
        'P': ['ON'],  # Ontario (North)
        'R': ['MB'],  # Manitoba
        'S': ['SK'],  # Saskatchewan
        'T': ['AB'],  # Alberta
        'V': ['BC'],  # British Columbia
        'X': ['NU', 'NT'],  # Nunavut and Northwest Territories
        'Y': ['YT'],  # Yukon
    }
    
    # Province codes to full names
    PROVINCE_NAMES: Dict[str, str] = {
        'NL': 'Newfoundland and Labrador',
        'NS': 'Nova Scotia',
        'PE': 'Prince Edward Island',
        'NB': 'New Brunswick',
        'QC': 'Quebec',
        'ON': 'Ontario',
        'MB': 'Manitoba',
        'SK': 'Saskatchewan',
        'AB': 'Alberta',
        'BC': 'British Columbia',
        'NU': 'Nunavut',
        'NT': 'Northwest Territories',
        'YT': 'Yukon',
    }
    
    # Known FSA to city mapping for major areas (subset for validation)
    # This extends the existing FSA_TO_CITY_MAP in postal_code_validator.py
    FSA_CITY_HINTS: Dict[str, str] = {
        # Toronto core
        'M4A': 'Toronto', 'M4B': 'Toronto', 'M4C': 'Toronto', 'M4E': 'Toronto',
        'M4G': 'Toronto', 'M4H': 'Toronto', 'M4J': 'Toronto', 'M4K': 'Toronto',
        'M4L': 'Toronto', 'M4M': 'Toronto', 'M4N': 'Toronto', 'M4P': 'Toronto',
        'M4R': 'Toronto', 'M4S': 'Toronto', 'M4T': 'Toronto', 'M4V': 'Toronto',
        'M4W': 'Toronto', 'M4X': 'Toronto', 'M4Y': 'Toronto',
        'M5A': 'Toronto', 'M5B': 'Toronto', 'M5C': 'Toronto', 'M5E': 'Toronto',
        'M5G': 'Toronto', 'M5H': 'Toronto', 'M5J': 'Toronto', 'M5K': 'Toronto',
        'M5L': 'Toronto', 'M5M': 'Toronto', 'M5N': 'Toronto', 'M5P': 'Toronto',
        'M5R': 'Toronto', 'M5S': 'Toronto', 'M5T': 'Toronto', 'M5V': 'Toronto',
        'M5W': 'Toronto', 'M5X': 'Toronto',
        'M6A': 'Toronto', 'M6B': 'Toronto', 'M6C': 'Toronto', 'M6E': 'Toronto',
        'M6G': 'Toronto', 'M6H': 'Toronto', 'M6J': 'Toronto', 'M6K': 'Toronto',
        'M6L': 'Toronto', 'M6M': 'Toronto', 'M6N': 'Toronto', 'M6P': 'Toronto',
        'M6R': 'Toronto', 'M6S': 'Toronto',
        # Mississauga
        'L4T': 'Mississauga', 'L4W': 'Mississauga', 'L4X': 'Mississauga',
        'L4Y': 'Mississauga', 'L4Z': 'Mississauga',
        'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5C': 'Mississauga',
        'L5E': 'Mississauga', 'L5G': 'Mississauga', 'L5H': 'Mississauga',
        'L5J': 'Mississauga', 'L5K': 'Mississauga', 'L5L': 'Mississauga',
        'L5M': 'Mississauga', 'L5N': 'Mississauga', 'L5R': 'Mississauga',
        'L5S': 'Mississauga', 'L5T': 'Mississauga', 'L5V': 'Mississauga',
        # Brampton
        'L6P': 'Brampton', 'L6R': 'Brampton', 'L6S': 'Brampton',
        'L6T': 'Brampton', 'L6V': 'Brampton', 'L6W': 'Brampton',
        'L6X': 'Brampton', 'L6Y': 'Brampton', 'L6Z': 'Brampton',
        # Vancouver area
        'V5A': 'Vancouver', 'V5B': 'Vancouver', 'V5C': 'Vancouver',
        'V5E': 'Vancouver', 'V5G': 'Vancouver', 'V5H': 'Vancouver',
        'V5J': 'Vancouver', 'V5K': 'Vancouver', 'V5L': 'Vancouver',
        'V5M': 'Vancouver', 'V5N': 'Vancouver', 'V5P': 'Vancouver',
        'V5R': 'Vancouver', 'V5S': 'Vancouver', 'V5T': 'Vancouver',
        'V5V': 'Vancouver', 'V5W': 'Vancouver', 'V5X': 'Vancouver',
        'V5Y': 'Vancouver', 'V5Z': 'Vancouver',
        'V6A': 'Vancouver', 'V6B': 'Vancouver', 'V6C': 'Vancouver',
        'V6E': 'Vancouver', 'V6G': 'Vancouver', 'V6H': 'Vancouver',
        'V6J': 'Vancouver', 'V6K': 'Vancouver', 'V6L': 'Vancouver',
        'V6M': 'Vancouver', 'V6N': 'Vancouver', 'V6P': 'Vancouver',
        'V6R': 'Vancouver', 'V6S': 'Vancouver', 'V6T': 'Vancouver',
        'V6V': 'Vancouver', 'V6W': 'Vancouver', 'V6X': 'Vancouver',
        'V6Y': 'Vancouver', 'V6Z': 'Vancouver',
        # Calgary
        'T2A': 'Calgary', 'T2B': 'Calgary', 'T2C': 'Calgary',
        'T2E': 'Calgary', 'T2G': 'Calgary', 'T2H': 'Calgary',
        'T2J': 'Calgary', 'T2K': 'Calgary', 'T2L': 'Calgary',
        'T2M': 'Calgary', 'T2N': 'Calgary', 'T2P': 'Calgary',
        'T2R': 'Calgary', 'T2S': 'Calgary', 'T2T': 'Calgary',
        'T2V': 'Calgary', 'T2W': 'Calgary', 'T2X': 'Calgary',
        'T2Y': 'Calgary', 'T2Z': 'Calgary',
        'T3A': 'Calgary', 'T3B': 'Calgary', 'T3C': 'Calgary',
        'T3E': 'Calgary', 'T3G': 'Calgary', 'T3H': 'Calgary',
        'T3J': 'Calgary', 'T3K': 'Calgary', 'T3L': 'Calgary',
        'T3M': 'Calgary', 'T3N': 'Calgary', 'T3P': 'Calgary',
        'T3R': 'Calgary', 'T3S': 'Calgary', 'T3Z': 'Calgary',
        # Ottawa
        'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1C': 'Ottawa',
        'K1E': 'Ottawa', 'K1G': 'Ottawa', 'K1H': 'Ottawa',
        'K1J': 'Ottawa', 'K1K': 'Ottawa', 'K1L': 'Ottawa',
        'K1M': 'Ottawa', 'K1N': 'Ottawa', 'K1P': 'Ottawa',
        'K1R': 'Ottawa', 'K1S': 'Ottawa', 'K1T': 'Ottawa',
        'K1V': 'Ottawa', 'K1W': 'Ottawa', 'K1X': 'Ottawa',
        'K1Y': 'Ottawa', 'K1Z': 'Ottawa',
        'K2A': 'Ottawa', 'K2B': 'Ottawa', 'K2C': 'Ottawa',
        'K2E': 'Ottawa', 'K2G': 'Ottawa', 'K2H': 'Ottawa',
        'K2J': 'Ottawa', 'K2K': 'Ottawa', 'K2L': 'Ottawa',
        'K2M': 'Ottawa', 'K2P': 'Ottawa', 'K2R': 'Ottawa',
        'K2S': 'Ottawa', 'K2T': 'Ottawa', 'K2V': 'Ottawa',
        'K2W': 'Ottawa',
    }
    
    # Letters not allowed in postal codes
    INVALID_LETTERS = set('DFIOQU')  # D, F, I, O, Q, U not used
    
    # Regex patterns for Canadian postal codes
    # FSA: Letter + Digit + Letter (e.g., "M5V")
    FSA_PATTERN = re.compile(r'^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]$', re.IGNORECASE)
    # Full: FSA + space? + Digit + Letter + Digit (e.g., "M5V 1A1" or "M5V1A1")
    FULL_PATTERN = re.compile(
        r'^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$', 
        re.IGNORECASE
    )
    
    def __init__(self):
        """Initialize the postal code service"""
        logger.info("📮 [POSTAL_CODE_SERVICE] Initialized")
    
    def normalize_postal_code(self, postal_code: str) -> Optional[PostalCodeInfo]:
        """
        Normalize and validate a Canadian postal code.
        
        Args:
            postal_code: Raw postal code input (e.g., "m5v 1a1", "M5V", "m5v1a1")
            
        Returns:
            PostalCodeInfo if valid, None if invalid
            
        Example:
            >>> service = PostalCodeService()
            >>> info = service.normalize_postal_code("m5v 1a1")
            >>> print(info.code)  # "M5V 1A1"
            >>> print(info.fsa)   # "M5V"
            >>> print(info.is_full)  # True
        """
        if not postal_code or not isinstance(postal_code, str):
            logger.warning(f"❌ [POSTAL] Invalid input: {postal_code}")
            return None
        
        # Normalize: uppercase, strip whitespace
        normalized = postal_code.upper().strip()
        # Remove spaces for validation
        no_spaces = normalized.replace(" ", "")
        
        # Check if FSA (3-char)
        if len(no_spaces) == 3:
            if self.FSA_PATTERN.match(no_spaces):
                logger.info(f"📮 [POSTAL] Detected FSA: {no_spaces}")
                
                first_letter = no_spaces[0]
                province_codes = self.PROVINCE_MAPPING.get(first_letter, [])
                province = province_codes[0] if province_codes else None
                
                # Check if urban (2nd char is digit) or rural (2nd char is letter)
                is_urban = no_spaces[1].isdigit()
                
                # Try to get city from known mappings
                city = self.FSA_CITY_HINTS.get(no_spaces)
                
                return PostalCodeInfo(
                    code=no_spaces,
                    fsa=no_spaces,
                    is_full=False,
                    city=city,
                    province=province,
                    is_urban=is_urban
                )
            else:
                logger.warning(f"❌ [POSTAL] Invalid FSA format: {postal_code}")
                return None
        
        # Check if full postal code (6-char)
        elif len(no_spaces) == 6:
            if self.FULL_PATTERN.match(no_spaces):
                # Format with space: A1A 1A1
                formatted = f"{no_spaces[:3]} {no_spaces[3:]}"
                fsa = no_spaces[:3]
                
                logger.info(f"📮 [POSTAL] Detected full postal code: {formatted}")
                
                first_letter = fsa[0]
                province_codes = self.PROVINCE_MAPPING.get(first_letter, [])
                province = province_codes[0] if province_codes else None
                
                # Check if urban or rural
                is_urban = fsa[1].isdigit()
                
                # Try to get city from known mappings
                city = self.FSA_CITY_HINTS.get(fsa)
                
                return PostalCodeInfo(
                    code=formatted,
                    fsa=fsa,
                    is_full=True,
                    city=city,
                    province=province,
                    is_urban=is_urban
                )
            else:
                logger.warning(f"❌ [POSTAL] Invalid full postal code format: {postal_code}")
                return None
        
        else:
            logger.warning(f"❌ [POSTAL] Invalid length ({len(no_spaces)}): {postal_code}")
            return None
    
    def is_valid_postal_code(self, postal_code: str) -> bool:
        """
        Check if a postal code is valid.
        
        Args:
            postal_code: Postal code to validate
            
        Returns:
            True if valid, False otherwise
        """
        return self.normalize_postal_code(postal_code) is not None
    
    def extract_fsa(self, postal_code: str) -> Optional[str]:
        """
        Extract FSA (first 3 characters) from a postal code.
        
        Args:
            postal_code: Full or partial postal code
            
        Returns:
            FSA string (e.g., "M5V") or None if invalid
        """
        info = self.normalize_postal_code(postal_code)
        return info.fsa if info else None
    
    def get_province(self, postal_code: str) -> Optional[str]:
        """
        Get the province code for a postal code.
        
        Args:
            postal_code: Postal code
            
        Returns:
            Province code (e.g., "ON") or None if invalid
        """
        info = self.normalize_postal_code(postal_code)
        return info.province if info else None
    
    def get_province_from_postal_code(self, postal_code: str) -> Optional[str]:
        """
        Alias for get_province() for backward compatibility.
        
        Args:
            postal_code: Postal code
            
        Returns:
            Province code (e.g., "ON") or None if invalid
        """
        return self.get_province(postal_code)
    
    def get_province_name(self, postal_code: str) -> Optional[str]:
        """
        Get the full province name for a postal code.
        
        Args:
            postal_code: Postal code
            
        Returns:
            Full province name (e.g., "Ontario") or None if invalid
        """
        province_code = self.get_province(postal_code)
        if province_code:
            return self.PROVINCE_NAMES.get(province_code)
        return None
    
    def get_fsa_radius(self, fsa: str) -> float:
        """
        Get appropriate search radius (in km) for FSA-level search.
        
        FSAs vary significantly in size:
        - Urban FSAs (2nd char is digit): ~1-3 km²
        - Rural FSAs (2nd char is letter): ~10-100+ km²
        
        Args:
            fsa: 3-character FSA code
            
        Returns:
            Recommended radius in kilometers
        """
        if not fsa or len(fsa) != 3:
            logger.warning(f"⚠️ [POSTAL] Invalid FSA for radius: {fsa}")
            return 2.0  # Default radius
        
        # Normalize
        fsa = fsa.upper()
        
        # Second character: digit = urban, letter = rural
        second_char = fsa[1]
        
        if second_char.isdigit():
            # Urban FSA - smaller, more dense area
            # Downtown cores might be even smaller
            if fsa[0] == 'M' and fsa[1] in '456':
                # Downtown Toronto (M4x, M5x, M6x core areas)
                return 1.0  # 1km radius
            elif fsa[0] in 'MV':
                # Other Toronto/Vancouver urban
                return 1.5  # 1.5km radius
            else:
                # General urban
                return 2.0  # 2km radius
        else:
            # Rural FSA - larger, less dense area
            return 5.0  # 5km radius
    
    def get_full_postal_code_radius(self) -> float:
        """
        Get appropriate search radius for full postal code search.
        
        Full postal codes are very specific, covering ~8,000 households max.
        
        Returns:
            Recommended radius in kilometers (typically 0.5-1km)
        """
        return 0.5  # 500m radius for full postal codes
    
    def get_search_radius(self, postal_code: str) -> float:
        """
        Get appropriate search radius based on postal code type.
        
        Convenience method that automatically determines if postal code is
        FSA (3 chars) or full (6 chars) and returns appropriate radius.
        
        Args:
            postal_code: Postal code (FSA or full)
            
        Returns:
            Recommended radius in kilometers
        """
        if not postal_code:
            return 2.0  # Default
        
        # Normalize and remove spaces
        normalized = postal_code.upper().replace(" ", "")
        
        if len(normalized) == 3:
            # FSA - use FSA radius
            return self.get_fsa_radius(normalized)
        elif len(normalized) == 6:
            # Full postal code - use full postal code radius
            return self.get_full_postal_code_radius()
        else:
            logger.warning(f"⚠️ [POSTAL] Invalid postal code length: {postal_code}")
            return 2.0  # Default
    
    def validate_city_for_postal_code(
        self, 
        postal_code: str, 
        city: str
    ) -> Tuple[bool, Optional[str]]:
        """
        Validate if a city matches the postal code.
        
        Args:
            postal_code: Postal code to validate
            city: City name to check
            
        Returns:
            Tuple of (is_valid, suggested_city)
            - is_valid: True if city matches postal code
            - suggested_city: Correct city if mismatch, None otherwise
        """
        info = self.normalize_postal_code(postal_code)
        if not info:
            return False, None
        
        # Get expected city from FSA mapping
        expected_city = info.city
        
        if not expected_city:
            # No city in mapping - can't validate
            logger.debug(f"⚠️ [POSTAL] No city mapping for FSA: {info.fsa}")
            return True, None  # Assume valid if no mapping
        
        # Normalize cities for comparison
        city_normalized = city.lower().strip()
        expected_normalized = expected_city.lower().strip()
        
        if city_normalized == expected_normalized:
            return True, None
        
        # Check common variations
        variations = {
            'north york': 'toronto',
            'scarborough': 'toronto',
            'etobicoke': 'toronto',
            'york': 'toronto',
            'east york': 'toronto',
            'downtown toronto': 'toronto',
        }
        
        city_base = variations.get(city_normalized, city_normalized)
        expected_base = variations.get(expected_normalized, expected_normalized)
        
        if city_base == expected_base:
            return True, None
        
        # Mismatch detected
        logger.warning(
            f"⚠️ [POSTAL] City mismatch: postal code {info.fsa} is in {expected_city}, "
            f"not {city}"
        )
        return False, expected_city
    
    def expand_fsa_for_search(self, fsa: str) -> List[str]:
        """
        Expand FSA to include adjacent FSAs for comprehensive search.
        
        Note: For production, this would use a database of adjacent FSAs.
        Currently returns just the original FSA (use radius search instead).
        
        Args:
            fsa: 3-character FSA code (e.g., "M5V")
            
        Returns:
            List of FSA codes to search (including original)
        """
        info = self.normalize_postal_code(fsa)
        if not info:
            return []
        
        # For now, just return the original FSA
        # Recommend using geocoding + radius search instead
        logger.debug(f"📮 [POSTAL] FSA expansion not implemented - use radius search")
        return [info.fsa]
    
    def detect_postal_code_in_text(self, text: str) -> Optional[PostalCodeInfo]:
        """
        Detect and extract a postal code from free-form text.
        
        Args:
            text: Text that may contain a postal code
            
        Returns:
            PostalCodeInfo if found, None otherwise
            
        Example:
            >>> service = PostalCodeService()
            >>> info = service.detect_postal_code_in_text("Looking for homes near M5V 1A1")
            >>> print(info.code)  # "M5V 1A1"
        """
        if not text:
            return None
        
        # Pattern to find postal codes in text
        # Full postal code pattern (with optional space)
        full_match = re.search(
            r'\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\s?(\d[ABCEGHJ-NPRSTV-Z]\d)\b',
            text.upper()
        )
        
        if full_match:
            postal_code = f"{full_match.group(1)} {full_match.group(2)}"
            logger.info(f"📮 [POSTAL] Found full postal code in text: {postal_code}")
            return self.normalize_postal_code(postal_code)
        
        # FSA pattern only
        fsa_match = re.search(
            r'\b([ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z])\b',
            text.upper()
        )
        
        if fsa_match:
            fsa = fsa_match.group(1)
            logger.info(f"📮 [POSTAL] Found FSA in text: {fsa}")
            return self.normalize_postal_code(fsa)
        
        return None


# Global singleton instance
_postal_code_service: Optional[PostalCodeService] = None


def get_postal_code_service() -> PostalCodeService:
    """
    Get singleton postal code service instance.
    
    Returns:
        PostalCodeService instance
        
    Example:
        >>> from services.postal_code_service import get_postal_code_service
        >>> service = get_postal_code_service()
        >>> info = service.normalize_postal_code("M5V 1A1")
    """
    global _postal_code_service
    if _postal_code_service is None:
        _postal_code_service = PostalCodeService()
    return _postal_code_service


def reset_postal_code_service() -> None:
    """Reset the singleton instance (useful for testing)"""
    global _postal_code_service
    _postal_code_service = None
