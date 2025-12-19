"""
Postal Code Validator Service

Validates Canadian postal codes against their correct cities.
Helps prevent searches with mismatched postal code + city combinations.

Example:
    L5B (Mississauga) should not be searched in Toronto
    M5V (Toronto) should not be searched in Mississauga
"""

import logging

logger = logging.getLogger(__name__)


# Canadian FSA (Forward Sortation Area) to City Mapping
# First 3 characters of postal code determine the general area
FSA_TO_CITY_MAP = {
    # Toronto FSAs (M prefix)
    'M1B': 'Toronto', 'M1C': 'Toronto', 'M1E': 'Toronto', 'M1G': 'Toronto',
    'M1H': 'Toronto', 'M1J': 'Toronto', 'M1K': 'Toronto', 'M1L': 'Toronto',
    'M1M': 'Toronto', 'M1N': 'Toronto', 'M1P': 'Toronto', 'M1R': 'Toronto',
    'M1S': 'Toronto', 'M1T': 'Toronto', 'M1V': 'Toronto', 'M1W': 'Toronto',
    'M1X': 'Toronto',
    'M2H': 'Toronto', 'M2J': 'Toronto', 'M2K': 'Toronto', 'M2L': 'Toronto',
    'M2M': 'Toronto', 'M2N': 'Toronto', 'M2P': 'Toronto', 'M2R': 'Toronto',
    'M3A': 'Toronto', 'M3B': 'Toronto', 'M3C': 'Toronto', 'M3H': 'Toronto',
    'M3J': 'Toronto', 'M3K': 'Toronto', 'M3L': 'Toronto', 'M3M': 'Toronto',
    'M3N': 'Toronto',
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
    'M6R': 'Toronto', 'M6S': 'Toronto', 'M6T': 'Toronto', 'M6V': 'Toronto',
    'M6W': 'Toronto', 'M6X': 'Toronto', 'M6Y': 'Toronto', 'M6Z': 'Toronto',
    'M7A': 'Toronto',  # Queen's Park
    'M8V': 'Toronto', 'M8W': 'Toronto', 'M8X': 'Toronto', 'M8Y': 'Toronto',
    'M8Z': 'Toronto',
    'M9A': 'Toronto', 'M9B': 'Toronto', 'M9C': 'Toronto', 'M9L': 'Toronto',
    'M9M': 'Toronto', 'M9N': 'Toronto', 'M9P': 'Toronto', 'M9R': 'Toronto',
    'M9V': 'Toronto', 'M9W': 'Toronto',
    
    # Mississauga FSAs (L4T-L5W)
    'L4T': 'Mississauga', 'L4W': 'Mississauga', 'L4X': 'Mississauga',
    'L4Y': 'Mississauga', 'L4Z': 'Mississauga',
    'L5A': 'Mississauga', 'L5B': 'Mississauga', 'L5C': 'Mississauga',
    'L5E': 'Mississauga', 'L5G': 'Mississauga', 'L5H': 'Mississauga',
    'L5J': 'Mississauga', 'L5K': 'Mississauga', 'L5L': 'Mississauga',
    'L5M': 'Mississauga', 'L5N': 'Mississauga', 'L5R': 'Mississauga',
    'L5S': 'Mississauga', 'L5T': 'Mississauga', 'L5V': 'Mississauga',
    'L5W': 'Mississauga',
    
    # Brampton FSAs (L6P-L7A)
    'L6P': 'Brampton', 'L6R': 'Brampton', 'L6S': 'Brampton',
    'L6T': 'Brampton', 'L6V': 'Brampton', 'L6W': 'Brampton',
    'L6X': 'Brampton', 'L6Y': 'Brampton', 'L6Z': 'Brampton',
    'L7A': 'Brampton',
    
    # Markham FSAs (L3P-L6G)
    'L3P': 'Markham', 'L3R': 'Markham', 'L3S': 'Markham',
    'L6B': 'Markham', 'L6C': 'Markham', 'L6E': 'Markham',
    'L6G': 'Markham',
    
    # Vaughan FSAs (L4H-L6A)
    'L4H': 'Vaughan', 'L4J': 'Vaughan', 'L4K': 'Vaughan',
    'L4L': 'Vaughan', 'L6A': 'Vaughan',
    
    # Richmond Hill FSAs (L4B-L4S)
    'L4B': 'Richmond Hill', 'L4C': 'Richmond Hill', 'L4E': 'Richmond Hill',
    'L4S': 'Richmond Hill',
    
    # Oakville FSAs (L6H-L6M)
    'L6H': 'Oakville', 'L6J': 'Oakville', 'L6K': 'Oakville',
    'L6L': 'Oakville', 'L6M': 'Oakville',
    
    # Burlington FSAs (L7L-L7T)
    'L7L': 'Burlington', 'L7M': 'Burlington', 'L7N': 'Burlington',
    'L7P': 'Burlington', 'L7R': 'Burlington', 'L7S': 'Burlington',
    'L7T': 'Burlington',
    
    # Hamilton FSAs (L8E-L9K)
    'L8E': 'Hamilton', 'L8G': 'Hamilton', 'L8H': 'Hamilton',
    'L8J': 'Hamilton', 'L8K': 'Hamilton', 'L8L': 'Hamilton',
    'L8M': 'Hamilton', 'L8N': 'Hamilton', 'L8P': 'Hamilton',
    'L8R': 'Hamilton', 'L8S': 'Hamilton', 'L8T': 'Hamilton',
    'L8V': 'Hamilton', 'L8W': 'Hamilton', 'L9A': 'Hamilton',
    'L9B': 'Hamilton', 'L9C': 'Hamilton', 'L9G': 'Hamilton',
    'L9H': 'Hamilton', 'L9K': 'Hamilton',
    
    # Ottawa FSAs (K prefix)
    'K1A': 'Ottawa', 'K1B': 'Ottawa', 'K1C': 'Ottawa', 'K1E': 'Ottawa',
    'K1G': 'Ottawa', 'K1H': 'Ottawa', 'K1J': 'Ottawa', 'K1K': 'Ottawa',
    'K1L': 'Ottawa', 'K1M': 'Ottawa', 'K1N': 'Ottawa', 'K1P': 'Ottawa',
    'K1R': 'Ottawa', 'K1S': 'Ottawa', 'K1T': 'Ottawa', 'K1V': 'Ottawa',
    'K1W': 'Ottawa', 'K1X': 'Ottawa', 'K1Y': 'Ottawa', 'K1Z': 'Ottawa',
    'K2A': 'Ottawa', 'K2B': 'Ottawa', 'K2C': 'Ottawa', 'K2E': 'Ottawa',
    'K2G': 'Ottawa', 'K2H': 'Ottawa', 'K2J': 'Ottawa', 'K2K': 'Ottawa',
    'K2L': 'Ottawa', 'K2M': 'Ottawa', 'K2P': 'Ottawa', 'K2R': 'Ottawa',
    'K2S': 'Ottawa', 'K2T': 'Ottawa', 'K2V': 'Ottawa', 'K2W': 'Ottawa',
    'K4A': 'Ottawa', 'K4B': 'Ottawa', 'K4C': 'Ottawa', 'K4M': 'Ottawa',
    'K4P': 'Ottawa', 'K4R': 'Ottawa',
}


class PostalCodeValidator:
    """Validates Canadian postal codes against cities."""
    
    @staticmethod
    def extract_fsa(postal_code: str) -> str:
        """
        Extract FSA (first 3 characters) from postal code.
        
        Args:
            postal_code: Full or partial postal code (e.g., "M5V 1A1" or "M5V")
            
        Returns:
            FSA code (e.g., "M5V")
        """
        if not postal_code:
            return None
        
        # Remove spaces and convert to uppercase
        cleaned = postal_code.replace(' ', '').upper()
        
        # FSA is first 3 characters
        return cleaned[:3] if len(cleaned) >= 3 else cleaned
    
    @staticmethod
    def get_city_for_postal_code(postal_code: str) -> str:
        """
        Get the correct city for a postal code based on FSA.
        
        Args:
            postal_code: Full or partial postal code
            
        Returns:
            City name or None if FSA not found
        """
        fsa = PostalCodeValidator.extract_fsa(postal_code)
        
        if not fsa:
            return None
        
        city = FSA_TO_CITY_MAP.get(fsa)
        
        if city:
            logger.debug(f"📮 [POSTAL VALIDATOR] FSA {fsa} → {city}")
        else:
            logger.debug(f"⚠️ [POSTAL VALIDATOR] FSA {fsa} not found in mapping")
        
        return city
    
    @staticmethod
    def validate_postal_city_match(postal_code: str, city: str) -> dict:
        """
        Validate if postal code matches the provided city.
        
        Args:
            postal_code: Full or partial postal code
            city: City name provided by user
            
        Returns:
            dict with:
                - is_valid: bool (True if match or unknown FSA)
                - correct_city: str (correct city for postal code)
                - user_city: str (city user provided)
                - message: str (user-friendly message)
        """
        if not postal_code or not city:
            return {
                'is_valid': True,
                'correct_city': None,
                'user_city': city,
                'message': None
            }
        
        fsa = PostalCodeValidator.extract_fsa(postal_code)
        correct_city = FSA_TO_CITY_MAP.get(fsa)
        
        # If FSA not in our map, allow it (we don't know all postal codes)
        if not correct_city:
            logger.info(f"📮 [POSTAL VALIDATOR] Unknown FSA {fsa}, allowing city: {city}")
            return {
                'is_valid': True,
                'correct_city': None,
                'user_city': city,
                'message': None
            }
        
        # Normalize city names for comparison
        user_city_normalized = city.lower().strip()
        correct_city_normalized = correct_city.lower().strip()
        
        # Check if they match
        is_match = user_city_normalized == correct_city_normalized
        
        if is_match:
            logger.info(f"✅ [POSTAL VALIDATOR] {postal_code} matches {city}")
            return {
                'is_valid': True,
                'correct_city': correct_city,
                'user_city': city,
                'message': None
            }
        else:
            logger.warning(f"⚠️ [POSTAL VALIDATOR] Mismatch: {postal_code} ({correct_city}) vs user city ({city})")
            return {
                'is_valid': False,
                'correct_city': correct_city,
                'user_city': city,
                'message': f"The postal code {postal_code} is in {correct_city}, not {city}. I'll search in {correct_city} instead."
            }
    
    @staticmethod
    def suggest_city_for_postal(postal_code: str) -> str:
        """
        Suggest a city for a postal code that was provided without a city.
        
        Args:
            postal_code: Postal code without city
            
        Returns:
            Suggested city name or None
        """
        city = PostalCodeValidator.get_city_for_postal_code(postal_code)
        
        if city:
            logger.info(f"💡 [POSTAL VALIDATOR] Suggesting {city} for postal code {postal_code}")
        else:
            logger.info(f"💡 [POSTAL VALIDATOR] No suggestion for postal code {postal_code}")
        
        return city


# Singleton instance
postal_code_validator = PostalCodeValidator()
