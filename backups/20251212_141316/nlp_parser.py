"""
Advanced NLP Parser for Real Estate Chatbot
===========================================
Extracts search criteria from conversational messages with ChatGPT-level understanding.

Handles:
- Natural language phrases ("show me", "I want", "looking for")
- Follow-up references ("those", "that area", "same location")
- Implicit context ("with pool" = add amenity to existing search)
- Conversational refinements ("actually make it 3 bedrooms", "show rentals instead")

Author: Summitly Team
Date: December 12, 2025
"""

import re
import logging
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)


class AdvancedNLPParser:
    """
    Advanced NLP parser that extracts structured data from conversational messages.
    Designed to work like ChatGPT - understands context, references, and implications.
    """
    
    # Location mappings for Canadian cities
    LOCATION_KEYWORDS = {
        'toronto': 'Toronto',
        'mississauga': 'Mississauga',
        'markham': 'Markham',
        'vaughan': 'Vaughan',
        'brampton': 'Brampton',
        'richmond hill': 'Richmond Hill',
        'north york': 'North York',
        'scarborough': 'Scarborough',
        'etobicoke': 'Etobicoke',
        'oakville': 'Oakville',
        'burlington': 'Burlington',
        'milton': 'Milton',
        'ajax': 'Ajax',
        'pickering': 'Pickering',
        'oshawa': 'Oshawa',
        'whitby': 'Whitby',
        'hamilton': 'Hamilton',
        'kitchener': 'Kitchener',
        'waterloo': 'Waterloo',
        'guelph': 'Guelph',
        'cambridge': 'Cambridge',
        'barrie': 'Barrie',
        'london': 'London',
        'ottawa': 'Ottawa',
        'kingston': 'Kingston',
        'niagara falls': 'Niagara Falls',
        'st. catharines': 'St. Catharines',
        'downtown': 'Downtown Toronto',
        'gta': 'Greater Toronto Area',
        'yorkville': 'Yorkville',
        'liberty village': 'Liberty Village',
        'city place': 'CityPlace',
        'king west': 'King West',
        'queen west': 'Queen West',
        'danforth': 'The Danforth',
        'beaches': 'The Beaches',
        'leaside': 'Leaside',
        'forest hill': 'Forest Hill',
        'rosedale': 'Rosedale',
    }
    
    # Property type keywords
    PROPERTY_TYPE_KEYWORDS = {
        'condo': ['condo', 'condominium', 'apartment', 'apt', 'unit'],
        'detached': ['house', 'detached', 'single family', 'single-family', 'home'],
        'townhouse': ['townhouse', 'townhome', 'town house', 'town home', 'row house'],
        'semi-detached': ['semi-detached', 'semi detached', 'semi'],
    }
    
    # Amenity keywords
    AMENITY_KEYWORDS = {
        'pool': ['pool', 'swimming pool', 'swim'],
        'gym': ['gym', 'fitness', 'workout room', 'exercise room'],
        'parking': ['parking', 'garage', 'car space', 'parking spot'],
        'balcony': ['balcony', 'terrace', 'patio'],
        'garden': ['garden', 'yard', 'backyard', 'front yard'],
        'ensuite': ['ensuite', 'en-suite', 'master bathroom'],
        'laundry': ['laundry', 'washer', 'dryer', 'laundry room'],
        'storage': ['storage', 'locker', 'storage locker', 'storage space'],
        'concierge': ['concierge', 'doorman', '24/7 concierge'],
        'elevator': ['elevator', 'lift'],
        'pets': ['pet friendly', 'pets allowed', 'dogs allowed', 'cats allowed'],
        'waterfront': ['waterfront', 'water view', 'lake view', 'lakefront'],
    }
    
    # Listing type keywords
    LISTING_TYPE_KEYWORDS = {
        'sale': ['buy', 'purchase', 'sale', 'for sale', 'buying', 'own'],
        'rent': ['rent', 'rental', 'lease', 'for rent', 'renting', 'to rent'],
    }
    
    def __init__(self):
        """Initialize the parser."""
        logger.info("AdvancedNLPParser initialized")
    
    def parse_message(
        self, 
        message: str, 
        current_state: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Parse a conversational message and extract structured search criteria.
        
        Args:
            message: User's message
            current_state: Optional current conversation state for context-aware parsing
            
        Returns:
            Dictionary of extracted criteria (only fields that were mentioned)
            
        Example:
            >>> parser.parse_message("Show me 2 bedroom condos in Toronto under 600k")
            {
                'location': 'Toronto',
                'bedrooms': 2,
                'property_type': 'condo',
                'price_range': (None, 600000)
            }
        """
        message_lower = message.lower().strip()
        extracted = {}
        
        # Check for context references (these, those, that area, same location, etc.)
        is_reference = self._is_contextual_reference(message_lower)
        
        # Extract location (unless it's a pure reference like "show me those")
        if not is_reference or 'in' in message_lower or 'at' in message_lower:
            location = self.extract_location(message_lower)
            if location:
                extracted['location'] = location
        
        # Extract bedrooms
        bedrooms = self.extract_bedrooms(message_lower)
        if bedrooms is not None:
            extracted['bedrooms'] = bedrooms
        
        # Extract bathrooms
        bathrooms = self.extract_bathrooms(message_lower)
        if bathrooms is not None:
            extracted['bathrooms'] = bathrooms
        
        # Extract property type
        property_type = self.extract_property_type(message_lower)
        if property_type:
            extracted['property_type'] = property_type
        
        # Extract price range
        price_range = self.extract_price_range(message_lower)
        if price_range:
            extracted['price_range'] = price_range
        
        # Extract listing type (sale vs rent)
        listing_type = self.extract_listing_type(message_lower)
        if listing_type:
            extracted['listing_type'] = listing_type
        
        # Extract amenities
        amenities = self.extract_amenities(message_lower)
        if amenities:
            extracted['amenities'] = amenities
        
        # Extract square footage
        sqft_range = self.extract_sqft_range(message_lower)
        if sqft_range:
            extracted['sqft_range'] = sqft_range
        
        # Extract parking spots
        parking = self.extract_parking_spots(message_lower)
        if parking is not None:
            extracted['parking_spots'] = parking
        
        # Determine intent
        intent = self.classify_intent(message_lower, extracted, current_state)
        extracted['intent'] = intent
        
        logger.info(f"Parsed message: '{message[:50]}...' -> {len(extracted)} criteria extracted")
        logger.debug(f"Extracted: {extracted}")
        
        return extracted
    
    def extract_location(self, message: str) -> Optional[str]:
        """
        Extract location from message.
        
        Examples:
            "in Toronto" -> "Toronto"
            "Mississauga area" -> "Mississauga"
            "downtown condos" -> "Downtown Toronto"
        """
        # Check for explicit location phrases
        for keyword, location in self.LOCATION_KEYWORDS.items():
            # Match whole words or phrases
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, message):
                logger.debug(f"Extracted location: {location}")
                return location
        
        return None
    
    def extract_bedrooms(self, message: str) -> Optional[int]:
        """
        Extract bedroom count from message.
        
        Examples:
            "2 bedroom" -> 2
            "3 bed" -> 3
            "one bedroom" -> 1
            "studio" -> 0
        """
        # Handle "studio" = 0 bedrooms
        if 'studio' in message:
            return 0
        
        # Handle written numbers
        number_words = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
            'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        }
        
        for word, num in number_words.items():
            patterns = [
                f'{word} bedroom',
                f'{word} bed',
                f'{word}br',
                f'{word}-bedroom',
                f'{word}-bed'
            ]
            if any(p in message for p in patterns):
                logger.debug(f"Extracted bedrooms: {num}")
                return num
        
        # Handle numeric patterns
        patterns = [
            r'(\d+)\s*(?:bedroom|bed|br)',
            r'(\d+)(?:\s*)?[-]?(?:bedroom|bed|br)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                bedrooms = int(match.group(1))
                logger.debug(f"Extracted bedrooms: {bedrooms}")
                return bedrooms
        
        return None
    
    def extract_bathrooms(self, message: str) -> Optional[float]:
        """
        Extract bathroom count from message.
        
        Examples:
            "2 bathroom" -> 2.0
            "1.5 bath" -> 1.5
            "two bathrooms" -> 2.0
        """
        # Handle written numbers
        number_words = {
            'one': 1.0, 'two': 2.0, 'three': 3.0, 'four': 4.0, 'five': 5.0
        }
        
        for word, num in number_words.items():
            patterns = [
                f'{word} bathroom',
                f'{word} bath',
                f'{word}-bathroom',
                f'{word}-bath'
            ]
            if any(p in message for p in patterns):
                logger.debug(f"Extracted bathrooms: {num}")
                return num
        
        # Handle numeric patterns (including decimals like 1.5, 2.5)
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:bathroom|bath)',
            r'(\d+(?:\.\d+)?)(?:\s*)?[-]?(?:bathroom|bath)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, message)
            if match:
                bathrooms = float(match.group(1))
                logger.debug(f"Extracted bathrooms: {bathrooms}")
                return bathrooms
        
        return None
    
    def extract_property_type(self, message: str) -> Optional[str]:
        """
        Extract property type from message.
        
        Examples:
            "condo" -> "condo"
            "detached house" -> "detached"
            "townhome" -> "townhouse"
        """
        for prop_type, keywords in self.PROPERTY_TYPE_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message:
                    logger.debug(f"Extracted property type: {prop_type}")
                    return prop_type
        
        return None
    
    def extract_price_range(self, message: str) -> Optional[Tuple[Optional[int], Optional[int]]]:
        """
        Extract price range from message.
        
        Examples:
            "under 600k" -> (None, 600000)
            "between 500k and 800k" -> (500000, 800000)
            "over 1 million" -> (1000000, None)
            "around 700k" -> (630000, 770000)  # +/- 10%
        """
        # Normalize the message: handle 'k', 'm', and commas
        def parse_price(price_str: str) -> int:
            """Convert price string to integer."""
            price_str = price_str.replace(',', '').replace('$', '').strip()
            
            if 'k' in price_str.lower():
                return int(float(price_str.lower().replace('k', '')) * 1000)
            elif 'm' in price_str.lower():
                return int(float(price_str.lower().replace('m', '')) * 1000000)
            else:
                return int(price_str)
        
        # Pattern: "between X and Y"
        range_pattern = r'between\s+\$?\s*([0-9,.]+[km]?)\s+and\s+\$?\s*([0-9,.]+[km]?)'
        match = re.search(range_pattern, message, re.IGNORECASE)
        if match:
            min_price = parse_price(match.group(1))
            max_price = parse_price(match.group(2))
            logger.debug(f"Extracted price range: ${min_price:,} - ${max_price:,}")
            return (min_price, max_price)
        
        # Pattern: "X to Y" or "X - Y"
        range_pattern2 = r'\$?\s*([0-9,.]+[km]?)\s+(?:to|-|–)\s+\$?\s*([0-9,.]+[km]?)'
        match = re.search(range_pattern2, message, re.IGNORECASE)
        if match:
            min_price = parse_price(match.group(1))
            max_price = parse_price(match.group(2))
            logger.debug(f"Extracted price range: ${min_price:,} - ${max_price:,}")
            return (min_price, max_price)
        
        # Pattern: "under/below/max X"
        max_patterns = [
            r'(?:under|below|up to|max|maximum)\s+\$?\s*([0-9,.]+[km]?)',
            r'less than\s+\$?\s*([0-9,.]+[km]?)',
        ]
        for pattern in max_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                max_price = parse_price(match.group(1))
                logger.debug(f"Extracted max price: ${max_price:,}")
                return (None, max_price)
        
        # Pattern: "over/above/min X"
        min_patterns = [
            r'(?:over|above|starting at|min|minimum)\s+\$?\s*([0-9,.]+[km]?)',
            r'more than\s+\$?\s*([0-9,.]+[km]?)',
        ]
        for pattern in min_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                min_price = parse_price(match.group(1))
                logger.debug(f"Extracted min price: ${min_price:,}")
                return (min_price, None)
        
        # Pattern: "around/approximately X" (interpret as +/- 10%)
        around_pattern = r'(?:around|approximately|about|roughly)\s+\$?\s*([0-9,.]+[km]?)'
        match = re.search(around_pattern, message, re.IGNORECASE)
        if match:
            target_price = parse_price(match.group(1))
            min_price = int(target_price * 0.9)
            max_price = int(target_price * 1.1)
            logger.debug(f"Extracted approximate price: ${min_price:,} - ${max_price:,}")
            return (min_price, max_price)
        
        return None
    
    def extract_listing_type(self, message: str) -> Optional[str]:
        """
        Extract listing type (sale or rent) from message.
        
        Examples:
            "buy a house" -> "sale"
            "looking to rent" -> "rent"
            "show me rentals" -> "rent"
        """
        # Check for rental keywords
        for keyword in self.LISTING_TYPE_KEYWORDS['rent']:
            if keyword in message:
                logger.debug("Extracted listing type: rent")
                return 'rent'
        
        # Check for sale keywords
        for keyword in self.LISTING_TYPE_KEYWORDS['sale']:
            if keyword in message:
                logger.debug("Extracted listing type: sale")
                return 'sale'
        
        return None
    
    def extract_amenities(self, message: str) -> List[str]:
        """
        Extract amenities from message.
        
        Examples:
            "with pool and gym" -> ["pool", "gym"]
            "parking included" -> ["parking"]
            "waterfront property" -> ["waterfront"]
        """
        found_amenities = []
        
        for amenity, keywords in self.AMENITY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in message:
                    if amenity not in found_amenities:
                        found_amenities.append(amenity)
                    break
        
        if found_amenities:
            logger.debug(f"Extracted amenities: {found_amenities}")
        
        return found_amenities
    
    def extract_sqft_range(self, message: str) -> Optional[Tuple[Optional[int], Optional[int]]]:
        """
        Extract square footage range from message.
        
        Examples:
            "over 2000 sqft" -> (2000, None)
            "1500 to 2500 square feet" -> (1500, 2500)
        """
        # Pattern: "X to Y sqft"
        range_pattern = r'(\d+)\s+(?:to|-)\s+(\d+)\s+(?:sqft|sq ft|square feet|square foot)'
        match = re.search(range_pattern, message, re.IGNORECASE)
        if match:
            min_sqft = int(match.group(1))
            max_sqft = int(match.group(2))
            logger.debug(f"Extracted sqft range: {min_sqft} - {max_sqft}")
            return (min_sqft, max_sqft)
        
        # Pattern: "over/above X sqft"
        min_pattern = r'(?:over|above|minimum)\s+(\d+)\s+(?:sqft|sq ft|square feet|square foot)'
        match = re.search(min_pattern, message, re.IGNORECASE)
        if match:
            min_sqft = int(match.group(1))
            logger.debug(f"Extracted min sqft: {min_sqft}")
            return (min_sqft, None)
        
        # Pattern: "under/below X sqft"
        max_pattern = r'(?:under|below|maximum)\s+(\d+)\s+(?:sqft|sq ft|square feet|square foot)'
        match = re.search(max_pattern, message, re.IGNORECASE)
        if match:
            max_sqft = int(match.group(1))
            logger.debug(f"Extracted max sqft: {max_sqft}")
            return (None, max_sqft)
        
        return None
    
    def extract_parking_spots(self, message: str) -> Optional[int]:
        """
        Extract parking spot count from message.
        
        Examples:
            "2 parking spots" -> 2
            "double garage" -> 2
            "single car garage" -> 1
        """
        # Pattern: "X parking spots/spaces"
        pattern = r'(\d+)\s+(?:parking spot|parking space|car space|garage spot)'
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            spots = int(match.group(1))
            logger.debug(f"Extracted parking spots: {spots}")
            return spots
        
        # Special cases
        if 'double garage' in message or 'two car garage' in message:
            return 2
        if 'single garage' in message or 'one car garage' in message:
            return 1
        
        return None
    
    def classify_intent(
        self, 
        message: str, 
        extracted: Dict[str, Any],
        current_state: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Classify user intent based on message and extracted data.
        
        Returns:
            One of: 'search', 'refine', 'details', 'compare', 'general_question', 'reset'
        """
        # Reset intent
        reset_keywords = ['start over', 'new search', 'reset', 'clear filters', 'forget everything']
        if any(keyword in message for keyword in reset_keywords):
            return 'reset'
        
        # Details intent (asking about specific property)
        details_keywords = ['tell me more', 'details', 'info about', 'show me property', 'mls']
        if any(keyword in message for keyword in details_keywords):
            return 'details'
        
        # Compare intent
        compare_keywords = ['compare', 'comparison', 'difference between', 'vs']
        if any(keyword in message for keyword in compare_keywords):
            return 'compare'
        
        # Refine intent (modifying existing search)
        refine_keywords = [
            'instead', 'actually', 'change', 'different', 'show me other',
            'what about', 'how about', 'adjust', 'modify'
        ]
        is_refinement = any(keyword in message for keyword in refine_keywords)
        has_previous_state = current_state and current_state.get('search_count', 0) > 0
        
        if is_refinement and has_previous_state:
            return 'refine'
        
        # Search intent (has search criteria)
        if extracted and any(k in extracted for k in ['location', 'bedrooms', 'property_type', 'price_range']):
            return 'search' if not has_previous_state else 'refine'
        
        # Default to general question
        return 'general_question'
    
    def _is_contextual_reference(self, message: str) -> bool:
        """
        Check if message contains contextual references that require previous state.
        
        Examples:
            "those" -> True
            "that area" -> True
            "same location" -> True
            "show me rentals instead" -> False (explicit change)
        """
        reference_phrases = [
            'these', 'those', 'that area', 'same area', 'same location',
            'same neighborhood', 'there', 'that place'
        ]
        
        return any(phrase in message for phrase in reference_phrases)


# Global parser instance
nlp_parser = AdvancedNLPParser()


if __name__ == "__main__":
    # Test the parser
    print("🧪 Testing AdvancedNLPParser...\n")
    
    parser = AdvancedNLPParser()
    
    test_cases = [
        "Show me 2 bedroom condos in Toronto under 600k",
        "Looking for a house in Mississauga with 3 beds and pool",
        "I want rentals in downtown with gym and parking",
        "Find properties between 500k and 800k",
        "Show me something with 2 bathrooms instead",
        "What about townhouses in that area?",
        "Over 2000 sqft please",
        "I'm looking to buy a waterfront property",
    ]
    
    for i, test_message in enumerate(test_cases, 1):
        print(f"{i}️⃣  Message: '{test_message}'")
        result = parser.parse_message(test_message)
        print(f"   Extracted: {result}")
        print()
    
    print("✅ All tests completed!")
