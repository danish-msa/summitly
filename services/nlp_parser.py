"""
nlp_parser.py
AdvancedNLPParser - extracts structured criteria from user messages.

IMPROVED VERSION with:
- Better listing_type detection (rental/sale mixing fix)
- Enhanced amenity extraction
- Contextual reference detection
- Returns only fields mentioned (preserves context)

- returns dict with only fields mentioned e.g.:
  {'intent':'search', 'location':'Toronto', 'bedrooms':2, 'listing_type':'rent', 'amenities':['pool']}
"""

import re
import logging
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class AdvancedNLPParser:
    LOCATION_KEYWORDS = {
        'toronto': 'Toronto', 'mississauga': 'Mississauga', 'vaughan': 'Vaughan',
        'brampton': 'Brampton', 'markham': 'Markham', 'oakville': 'Oakville',
        'richmond hill': 'Richmond Hill', 'north york': 'North York',
        'scarborough': 'Scarborough', 'etobicoke': 'Etobicoke',
        'burlington': 'Burlington', 'milton': 'Milton', 'ajax': 'Ajax',
        'pickering': 'Pickering', 'oshawa': 'Oshawa', 'whitby': 'Whitby',
        'hamilton': 'Hamilton', 'kitchener': 'Kitchener', 'waterloo': 'Waterloo',
        'guelph': 'Guelph', 'cambridge': 'Cambridge', 'barrie': 'Barrie',
        'london': 'London', 'ottawa': 'Ottawa', 'kingston': 'Kingston',
        'vancouver': 'Vancouver', 'burnaby': 'Burnaby', 'surrey': 'Surrey',
        'richmond': 'Richmond', 'coquitlam': 'Coquitlam', 'langley': 'Langley',
        'calgary': 'Calgary', 'edmonton': 'Edmonton', 'montreal': 'Montreal',
        'quebec city': 'Quebec City', 'winnipeg': 'Winnipeg', 'halifax': 'Halifax',
        'niagara falls': 'Niagara Falls', 'st. catharines': 'St. Catharines',
        'downtown': 'Downtown Toronto', 'gta': 'Greater Toronto Area',
        'yorkville': 'Yorkville', 'liberty village': 'Liberty Village',
        'city place': 'CityPlace', 'king west': 'King West',
        'queen west': 'Queen West', 'danforth': 'The Danforth',
        'beaches': 'The Beaches', 'leaside': 'Leaside',
        'forest hill': 'Forest Hill', 'rosedale': 'Rosedale',
    }

    PROPERTY_TYPE_KEYWORDS = {
        'condo': ['condo', 'condominium', 'apartment', 'apt', 'unit'],
        'detached': ['house', 'detached', 'single family', 'home'],
        'townhouse': ['townhouse', 'townhome', 'town house'],
        'semi-detached': ['semi-detached', 'semi detached', 'semi'],
    }

    AMENITY_KEYWORDS = {
        'pool': ['pool', 'swimming pool', 'swim'],
        'gym': ['gym', 'fitness', 'workout room'],
        'parking': ['parking', 'garage', 'car space'],
        'balcony': ['balcony', 'terrace', 'patio'],
        'garden': ['garden', 'yard', 'backyard'],
        'ensuite': ['ensuite', 'master bathroom'],
        'laundry': ['laundry', 'washer', 'dryer'],
        'storage': ['storage', 'locker'],
        'concierge': ['concierge', 'doorman'],
        'elevator': ['elevator', 'lift'],
        'pets': ['pet friendly', 'pets allowed'],
        'waterfront': ['waterfront', 'water view', 'lake view'],
    }

    LISTING_TYPE_KEYWORDS = {
        'sale': ['buy', 'purchase', 'sale', 'for sale', 'own', 'buying'],
        'rent': ['rent', 'rental', 'lease', 'for rent', 'renting', 'to rent']
    }

    def __init__(self):
        logger.info("AdvancedNLPParser initialized")

    # ---------- utility extractors ----------
    def extract_location(self, text: str) -> Optional[str]:
        for k, v in self.LOCATION_KEYWORDS.items():
            if k in text:
                return v
        return None

    def extract_bedrooms(self, text: str) -> Optional[int]:
        # matches "2 bed", "two-bedroom", "2 bedrooms"
        # Handle studio
        if 'studio' in text:
            return 0
        m = re.search(r'(\d+)\s*-?\s*(?:bed|beds|bedroom|bedrooms)\b', text)
        if m:
            return int(m.group(1))
        # words like "two"
        words_to_num = {'one':1,'two':2,'three':3,'four':4,'five':5, 'six':6, 'seven':7, 'eight':8, 'nine':9, 'ten':10}
        for w, n in words_to_num.items():
            if f"{w} bedroom" in text or f"{w}-bedroom" in text or f"{w} bed" in text:
                return n
        return None

    def extract_bathrooms(self, text: str) -> Optional[float]:
        m = re.search(r'(\d+(?:\.\d+)?)\s*-?\s*(?:bath|baths|bathroom|bathrooms)\b', text)
        if m:
            return float(m.group(1))
        # word numbers
        words_to_num = {'one':1.0,'two':2.0,'three':3.0,'four':4.0,'five':5.0}
        for w, n in words_to_num.items():
            if f"{w} bathroom" in text or f"{w}-bathroom" in text or f"{w} bath" in text:
                return n
        return None

    def extract_price_range(self, text: str) -> Optional[tuple]:
        # Check for budget removal patterns first
        budget_removal_patterns = [
            r'i don\'?t have (?:any )?budget',
            r'no budget',
            r'any budget',
            r'show me any price',
            r'remove budget',
            r'ignore budget',
            r'any price range',
            r'without budget'
        ]
        
        for pattern in budget_removal_patterns:
            if re.search(pattern, text, re.I):
                return ('remove_budget', None)  # Special signal to remove budget
        
        # "under 600k", "below $800,000", "between 500k and 800k"
        text = text.replace(',', '')
        
        def parse_price(price_str: str) -> int:
            price_str = price_str.replace('$', '').strip()
            if 'k' in price_str.lower():
                return int(float(price_str.lower().replace('k', '')) * 1000)
            elif 'm' in price_str.lower():
                return int(float(price_str.lower().replace('m', '')) * 1000000)
            else:
                # Smart interpretation for Canadian real estate:
                # Small numbers (1-10) in sale context likely mean millions
                num = float(price_str)
                if 1 <= num <= 10 and 'rent' not in text.lower() and 'lease' not in text.lower():
                    return int(num * 1000000)  # Assume millions for sale properties
                else:
                    return int(num)
        
        # "between X and Y"
        m2 = re.search(r'between\s+\$?(\d+(?:\.\d+)?[km]?)\s*(?:and|-|to)\s*\$?(\d+(?:\.\d+)?[km]?)', text, re.I)
        if m2:
            a = parse_price(m2.group(1))
            b = parse_price(m2.group(2))
            return (min(a,b), max(a,b))
        
        # "X to Y"
        m3 = re.search(r'\$?(\d+(?:\.\d+)?[km]?)\s+(?:to|-)\s+\$?(\d+(?:\.\d+)?[km]?)', text, re.I)
        if m3:
            a = parse_price(m3.group(1))
            b = parse_price(m3.group(2))
            return (min(a,b), max(a,b))
        
        # "under X"
        m1 = re.search(r'(?:under|below|up to|max)\s+\$?(\d+(?:\.\d+)?[km]?)', text, re.I)
        if m1:
            val = parse_price(m1.group(1))
            return (None, val)
        
        # "over X"
        m4 = re.search(r'(?:over|above|starting at|min)\s+\$?(\d+(?:\.\d+)?[km]?)', text, re.I)
        if m4:
            val = parse_price(m4.group(1))
            return (val, None)
        
        # "around X" +/- 10%
        m5 = re.search(r'(?:around|approximately|about)\s+\$?(\d+(?:\.\d+)?[km]?)', text, re.I)
        if m5:
            target = parse_price(m5.group(1))
            return (int(target * 0.9), int(target * 1.1))
        
        return None

    def extract_property_type(self, text: str) -> Optional[str]:
        for canonical, variants in self.PROPERTY_TYPE_KEYWORDS.items():
            for v in variants:
                if v in text:
                    return canonical
        return None

    def extract_amenities(self, text: str) -> List[str]:
        found = []
        for amen, variants in self.AMENITY_KEYWORDS.items():
            for v in variants:
                if v in text:
                    found.append(amen)
                    break
        return found

    def extract_listing_type(self, text: str) -> Optional[str]:
        # Check rent first (higher priority since rentals were being filtered out)
        for v in self.LISTING_TYPE_KEYWORDS['rent']:
            if v in text:
                return 'rent'
        for v in self.LISTING_TYPE_KEYWORDS['sale']:
            if v in text:
                return 'sale'
        return None

    def extract_sqft_range(self, text: str) -> Optional[tuple]:
        # "over 2000 sqft", "1500 to 2500 square feet"
        m1 = re.search(r'(\d+)\s+(?:to|-)\s+(\d+)\s+(?:sqft|sq ft|square feet)', text, re.I)
        if m1:
            return (int(m1.group(1)), int(m1.group(2)))
        m2 = re.search(r'(?:over|above|minimum)\s+(\d+)\s+(?:sqft|sq ft|square feet)', text, re.I)
        if m2:
            return (int(m2.group(1)), None)
        m3 = re.search(r'(?:under|below|maximum)\s+(\d+)\s+(?:sqft|sq ft|square feet)', text, re.I)
        if m3:
            return (None, int(m3.group(1)))
        return None

    def extract_parking_spots(self, text: str) -> Optional[int]:
        m = re.search(r'(\d+)\s+(?:parking spot|parking space|car space)', text, re.I)
        if m:
            return int(m.group(1))
        if 'double garage' in text or 'two car garage' in text:
            return 2
        if 'single garage' in text or 'one car garage' in text:
            return 1
        return None

    # ---------- intent detection ----------
    def detect_intent(self, text: str, current_state: Optional[Dict[str, Any]] = None) -> str:
        t = text.lower()
        
        # Reset
        if any(k in t for k in ['start over', 'new search', 'reset', 'clear filters']):
            return 'reset'
        
        # Valuation (check BEFORE details since "value of MLS" contains "mls")
        valuation_keywords = ['value', 'valuation', 'estimate', 'worth', 'appraisal', 'price estimate', 'property value']
        # Also check for specific patterns like "value of MLS:"
        valuation_patterns = [
            r'value\s+of\s+mls',
            r'what\s+is\s+.*worth',
            r'how\s+much\s+is\s+.*worth',
            r'estimate\s+for\s+mls',
            r'valuation\s+of',
            r'price\s+of\s+mls'
        ]
        
        if any(k in t for k in valuation_keywords):
            return 'valuation'
        
        if any(re.search(pattern, t) for pattern in valuation_patterns):
            return 'valuation'
        
        # Details (now excludes valuation patterns)
        details_keywords = ['details', 'show me details', 'analyze', 'analysis', 'tell me more']
        # Only match "mls" if it's NOT in a valuation context
        if any(k in t for k in details_keywords):
            return 'details'
        
        # Check for plain "mls" only if no valuation keywords
        if 'mls' in t and not any(k in t for k in valuation_keywords):
            return 'details'
        
        # Compare
        compare_keywords = ['compare', 'difference', 'vs', 'comparison']
        if any(k in t for k in compare_keywords):
            return 'compare'
        
        # Refine (contextual modification)
        refine_keywords = ['instead', 'actually', 'how about', 'what about', 'change', 'different', 'adjust']
        has_previous = current_state and (current_state.get('last_search_results') or current_state.get('search_count', 0) > 0)
        if any(k in t for k in refine_keywords) and has_previous:
            return 'refine'
        
        # Search
        search_triggers = ['show', 'find', 'looking', 'search', 'any', 'listings', 'properties', 'want']
        if any(k in t for k in search_triggers):
            return 'refine' if has_previous else 'search'
        
        return 'general_question'

    # ---------- main parse ----------
    def parse_message(self, message: str, current_state: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Return only fields mentioned in the message."""
        text = (message or "").lower().strip()
        extracted: Dict[str, Any] = {}
        
        # intent
        extracted['intent'] = self.detect_intent(text, current_state)

        # contextual reference detection (if user wrote 'how about those', no location replace)
        is_reference = any(ref in text for ref in ['those', 'these', 'that area', 'same location', 'there', 'that place', 'same area'])

        # location (only if explicit or not a pure reference)
        loc = self.extract_location(text)
        if loc and not is_reference:
            extracted['location'] = loc

        # numeric and categorical extracts
        bedrooms = self.extract_bedrooms(text)
        if bedrooms is not None:
            extracted['bedrooms'] = bedrooms

        bathrooms = self.extract_bathrooms(text)
        if bathrooms is not None:
            extracted['bathrooms'] = bathrooms

        prop_type = self.extract_property_type(text)
        if prop_type:
            extracted['property_type'] = prop_type

        price_range = self.extract_price_range(text)
        if price_range:
            extracted['price_range'] = price_range

        listing_type = self.extract_listing_type(text)
        if listing_type:
            extracted['listing_type'] = listing_type  # 'rent' or 'sale'

        amenities = self.extract_amenities(text)
        if amenities:
            extracted['amenities'] = amenities

        sqft_range = self.extract_sqft_range(text)
        if sqft_range:
            extracted['sqft_range'] = sqft_range

        parking = self.extract_parking_spots(text)
        if parking is not None:
            extracted['parking_spots'] = parking

        return extracted


# Single instance
nlp_parser = AdvancedNLPParser()


# Quick CLI test
if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    
    test_sentences = [
        "Show me 2 bedroom condos in Toronto under 600k",
        "I'm looking for rentals in downtown with gym and parking",
        "How about condos with swimming pool?",
        "Show houses under $800,000",
        "What about those with 3 beds instead?",
        "Find me rental apartments with a balcony",
        "I want to buy a house with a pool",
        "Show properties for sale in Mississauga"
    ]
    
    print("🧪 Testing Enhanced NLP Parser\n")
    for s in test_sentences:
        print("INPUT:", s)
        result = nlp_parser.parse_message(s)
        print("PARSED:", result)
        print()
    
    print("✅ All tests completed!")
