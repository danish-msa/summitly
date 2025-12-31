"""
Location Entity Extraction Service
===================================
Robust, GPT-powered location entity extraction for real estate chatbot.

Features:
- Extracts ONLY location-related fields from user messages
- Uses OpenAI GPT to parse: city, community, neighborhood, postalCode, streetName, streetNumber
- Normalizes location values (e.g., "DT Toronto" → "Toronto")
- Does NOT guess missing fields
- Returns None for unspecified fields
- Context-aware: understands "only in this neighborhood", "same area but rentals"

Author: Summitly Team  
Date: December 17, 2025
"""

import os
import json
import logging
import re
from typing import Dict, Optional, Any
from dataclasses import dataclass
from openai import OpenAI

logger = logging.getLogger(__name__)

# Initialize OpenAI client
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

if not client:
    logger.warning("⚠️ OPENAI_API_KEY not set - location extraction will use fallback mode")


@dataclass
class LocationState:
    """
    Represents location-specific state for property search.
    Follows Repliers API location hierarchy.
    
    COMPATIBILITY NOTE:
    - Primary fields use camelCase (postalCode, streetName, streetNumber) for Repliers API
    - Properties provide snake_case aliases (postal_code, street_name, street_number) for UnifiedConversationState
    - Both access patterns work: state.postalCode == state.postal_code
    """
    city: Optional[str] = None
    community: Optional[str] = None
    neighborhood: Optional[str] = None
    postalCode: Optional[str] = None
    streetName: Optional[str] = None
    streetNumber: Optional[str] = None
    
    # ═══════════════════════════════════════════════════════════════════════════
    # COMPATIBILITY PROPERTIES - Allow snake_case access (for UnifiedConversationState)
    # ═══════════════════════════════════════════════════════════════════════════
    
    @property
    def postal_code(self) -> Optional[str]:
        """Snake_case alias for postalCode (UnifiedConversationState compatibility)."""
        return self.postalCode
    
    @postal_code.setter
    def postal_code(self, value: Optional[str]):
        """Setter for snake_case postal_code."""
        self.postalCode = value
    
    @property
    def street_name(self) -> Optional[str]:
        """Snake_case alias for streetName (UnifiedConversationState compatibility)."""
        return self.streetName
    
    @street_name.setter
    def street_name(self, value: Optional[str]):
        """Setter for snake_case street_name."""
        self.streetName = value
    
    @property
    def street_number(self) -> Optional[str]:
        """Snake_case alias for streetNumber (UnifiedConversationState compatibility)."""
        return self.streetNumber
    
    @street_number.setter
    def street_number(self, value: Optional[str]):
        """Setter for snake_case street_number."""
        self.streetNumber = value
    
    def to_dict(self) -> Dict[str, Optional[str]]:
        """Convert to dictionary, excluding None values. Returns camelCase keys for API."""
        return {
            k: v for k, v in {
                'city': self.city,
                'community': self.community,
                'neighborhood': self.neighborhood,
                'postalCode': self.postalCode,
                'streetName': self.streetName,
                'streetNumber': self.streetNumber
            }.items() if v is not None
        }
    
    def to_snake_case_dict(self) -> Dict[str, Optional[str]]:
        """Convert to dictionary with snake_case keys (for UnifiedConversationState)."""
        return {
            k: v for k, v in {
                'city': self.city,
                'community': self.community,
                'neighborhood': self.neighborhood,
                'postal_code': self.postalCode,
                'street_name': self.streetName,
                'street_number': self.streetNumber
            }.items() if v is not None
        }
    
    def is_empty(self) -> bool:
        """Check if all fields are None."""
        return all(v is None for v in [
            self.city, self.community, self.neighborhood,
            self.postalCode, self.streetName, self.streetNumber
        ])
    
    def get_summary(self) -> str:
        """Get human-readable summary."""
        parts = []
        if self.streetNumber and self.streetName:
            parts.append(f"{self.streetNumber} {self.streetName}")
        elif self.streetName:
            parts.append(self.streetName)
        if self.neighborhood:
            parts.append(self.neighborhood)
        if self.community:
            parts.append(self.community)
        if self.city:
            parts.append(self.city)
        if self.postalCode:
            parts.append(self.postalCode)
        return ", ".join(parts) if parts else "No location specified"


# GPT System Prompt for Location Extraction
LOCATION_EXTRACTION_PROMPT = """You are a precise location entity extractor for Canadian real estate searches (GTA, Toronto, Ontario, Canada).

Your ONLY job: Extract location-related entities from user messages.

Return JSON with these fields (set to null if not mentioned):
- city: City name (Toronto, Mississauga, Vaughan, Markham, Brampton, Richmond Hill, Oakville, Burlington, etc.)
- community: Larger neighborhood/community (Downtown Core, Etobicoke, North York, Scarborough, Port Credit, etc.)
- neighborhood: Specific neighborhood (Yorkville, Liberty Village, King West, Distillery District, etc.)
- postalCode: Canadian postal code (M5V, M5V 3A8, M4W 1A9, etc.) - supports FSA (3 chars) and full format (6 chars)
- streetName: Full street name WITH suffix (King Street West, Yorkville Avenue, Church Street, etc.) - NO street number
- streetNumber: Street number only (123, 456, etc.) - just the number

CRITICAL RULES:
1. Extract ONLY what the user explicitly mentions
2. Do NOT guess or infer missing fields EXCEPT for well-known GTA streets (see rule 3)
3. Normalize values:
   - "DT Toronto" → city: "Toronto", community: "Downtown Core"
   - "downtown" → community: "Downtown Core" (if context is Toronto)
   - "GTA" → city: "Toronto" (default to largest GTA city)
   - "North York" → community: "North York", city: "Toronto"
   - Famous Toronto streets → ALWAYS add city: "Toronto" if not mentioned:
     * "Yonge Street" → city: "Toronto", streetName: "Yonge Street"
     * "Bloor Street" → city: "Toronto", streetName: "Bloor Street"
     * "King Street" → city: "Toronto", streetName: "King Street West" or "King Street East"
     * "Queen Street" → city: "Toronto", streetName: "Queen Street West" or "Queen Street East"
     * "Dundas Street" → city: "Toronto", streetName: "Dundas Street West" or "Dundas Street East"
     * "Bay Street" → city: "Toronto", streetName: "Bay Street"
     * "University Avenue" → city: "Toronto", streetName: "University Avenue"
     * "Spadina Avenue" → city: "Toronto", streetName: "Spadina Avenue"
4. Handle contextual references:
   - "only in this neighborhood" → keep previous neighborhood
   - "same area" → keep previous city/community/neighborhood
   - "same city" → keep previous city
   - "on this street" → keep previous streetName
   - "nearby" → keep previous city/community
5. Handle "near" queries for property searches:
   - "properties near 151 Dan Leckie Way Toronto" → extract streetName: "Dan Leckie Way", streetNumber: "151", city: "Toronto"
   - "condos near King Street" → extract streetName: "King Street", city: "Toronto" (infer from famous street)
   - "homes near M5V 4B2" → extract postalCode: "M5V 4B2" (system will add radius search later)
6. Postal code format:
   - FSA format (3 characters): M5V, K1A → normalize to uppercase "M5V"
   - Full format (6 characters): M5V3A8, m5v 3a8, M5V 3A8 → normalize to uppercase with space "M5V 3A8"
   - Accept any spacing/casing: "m5v", "m5v3a8", "M5V 3A8" all valid
7. Street names: KEEP full name including "Street", "Avenue", "Road", "Boulevard", "Drive", "Way", "West", "East", "North", "South"
8. Postal code PRIORITY: When postal code is mentioned, do NOT extract streetName, neighborhood, or community unless explicitly specified separately
9. EXCEPTION to rule 8: For "near [address with postal code]" queries, extract BOTH street address AND postal code if both are present

Examples:

Input: "Find condos in Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": null, "streetNumber": null}

Input: "Show me properties in Yorkville"
Output: {"city": "Toronto", "community": null, "neighborhood": "Yorkville", "postalCode": null, "streetName": null, "streetNumber": null}

Input: "123 King Street West, Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": "King Street West", "streetNumber": "123"}

Input: "123 King Street West"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": "King Street West", "streetNumber": "123"}

Input: "50 Yorkville Avenue"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": "Yorkville Avenue", "streetNumber": "50"}

Input: "825 Church Street"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": "Church Street", "streetNumber": "825"}

Input: "Properties in North York"
Output: {"city": "Toronto", "community": "North York", "neighborhood": null, "postalCode": null, "streetName": null, "streetNumber": null}

Input: "only in this neighborhood" (with previous_location: {"city": "Toronto", "neighborhood": "Liberty Village"})
Output: {"city": null, "community": null, "neighborhood": "Liberty Village", "postalCode": null, "streetName": null, "streetNumber": null}

Input: "same area but rentals" (with previous_location: {"city": "Mississauga", "community": "Port Credit"})
Output: {"city": "Mississauga", "community": "Port Credit", "neighborhood": null, "postalCode": null, "streetName": null, "streetNumber": null}

Input: "on this street" (with previous_location: {"streetName": "Yonge Street"})
Output: {"city": null, "community": null, "neighborhood": null, "postalCode": null, "streetName": "Yonge Street", "streetNumber": null}

Input: "properties in M5V 3A8"
Output: {"city": null, "community": null, "neighborhood": null, "postalCode": "M5V 3A8", "streetName": null, "streetNumber": null}

Input: "condos in M5V"
Output: {"city": null, "community": null, "neighborhood": null, "postalCode": "M5V", "streetName": null, "streetNumber": null}

Input: "condos in M5V Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": "M5V", "streetName": null, "streetNumber": null}

Input: "rentals in M5V 3A8 Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": "M5V 3A8", "streetName": null, "streetNumber": null}

Input: "m5v3a8"
Output: {"city": null, "community": null, "neighborhood": null, "postalCode": "M5V 3A8", "streetName": null, "streetNumber": null}

Input: "properties near 151 Dan Leckie Way M5V 4B2 Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": "M5V 4B2", "streetName": "Dan Leckie Way", "streetNumber": "151"}

Input: "condos near King Street Toronto"
Output: {"city": "Toronto", "community": null, "neighborhood": null, "postalCode": null, "streetName": "King Street", "streetNumber": null}

Input: "homes near M5V 4B2"
Output: {"city": null, "community": null, "neighborhood": null, "postalCode": "M5V 4B2", "streetName": null, "streetNumber": null}

CRITICAL: Return ONLY valid JSON. No markdown, no extra text."""


class LocationExtractor:
    """
    Service to extract location entities from user messages using GPT.
    """
    
    def __init__(self):
        """Initialize the location extractor."""
        self.client = client
        self.model = os.getenv('OPENAI_MODEL', 'gpt-4o-mini')
        logger.info(f"LocationExtractor initialized with model: {self.model}")
    
    def extract_location_entities(
        self,
        user_message: str,
        previous_location: Optional[LocationState] = None
    ) -> LocationState:
        """
        Extract location entities from user message.
        
        Args:
            user_message: User's message
            previous_location: Previous location state for contextual references
            
        Returns:
            LocationState with extracted entities
        """
        if not self.client:
            logger.warning("⚠️ OpenAI client not available, using fallback extractor")
            return self._fallback_extract(user_message, previous_location)
        
        try:
            # Build context for GPT
            context = {}
            if previous_location and not previous_location.is_empty():
                context = {
                    "previous_location": previous_location.to_dict(),
                    "note": "User may reference 'this area', 'same neighborhood', 'on this street' - use previous_location for context"
                }
            
            # Build messages
            messages = [
                {"role": "system", "content": LOCATION_EXTRACTION_PROMPT},
            ]
            
            if context:
                messages.append({
                    "role": "system",
                    "content": f"Context: {json.dumps(context)}"
                })
            
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Call GPT
            logger.debug(f"🔍 Extracting location from: '{user_message}'")
            
            params = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.0,  # Deterministic extraction
                "max_tokens": 300
            }
            
            # Add response format for JSON mode if supported
            if "gpt-4" in self.model.lower() or "gpt-5" in self.model.lower():
                params["response_format"] = {"type": "json_object"}
            
            response = client.chat.completions.create(**params)
            text = response.choices[0].message.content.strip()
            
            # Parse JSON response
            text = self._clean_json_response(text)
            location_data = json.loads(text)
            
            # Create LocationState
            location = LocationState(
                city=self._normalize_city(location_data.get('city')),
                community=self._normalize_text(location_data.get('community')),
                neighborhood=self._normalize_text(location_data.get('neighborhood')),
                postalCode=self._normalize_postal_code(location_data.get('postalCode')),
                streetName=self._normalize_text(location_data.get('streetName')),
                streetNumber=self._normalize_text(location_data.get('streetNumber'))
            )
            
            logger.info(f"✅ Extracted location: {location.get_summary()}")
            return location
            
        except json.JSONDecodeError as e:
            logger.warning(f"⚠️ Failed to parse GPT response as JSON: {e}")
            return self._fallback_extract(user_message, previous_location)
        except Exception as e:
            logger.error(f"❌ Location extraction error: {e}")
            return self._fallback_extract(user_message, previous_location)
    
    def _clean_json_response(self, text: str) -> str:
        """Remove markdown code blocks and extra text."""
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:].strip()
        return text.strip()
    
    def _normalize_city(self, city: Optional[str]) -> Optional[str]:
        """Normalize city names."""
        if not city:
            return None
        
        city = city.strip()
        
        # Handle GTA → Toronto
        if city.upper() == 'GTA':
            return 'Toronto'
        
        # Handle "Downtown Toronto" → "Toronto"
        if 'Toronto' in city:
            return 'Toronto'
        
        # Title case
        return city.title()
    
    def _normalize_text(self, text: Optional[str]) -> Optional[str]:
        """Normalize generic text fields."""
        if not text:
            return None
        return text.strip().title()
    
    def _normalize_postal_code(self, postal_code: Optional[str]) -> Optional[str]:
        """
        Normalize Canadian postal code format.
        
        Supports:
        - FSA format (3 characters): M5V, K1A → "M5V"
        - Full format (6 characters): M5V3A8, m5v 3a8 → "M5V 3A8"
        
        Returns:
            Normalized postal code or None if invalid
        """
        if not postal_code:
            return None
        
        # Remove all spaces and convert to uppercase
        pc = postal_code.replace(' ', '').upper()
        
        # Canadian postal code regex: Letter-Digit-Letter (Digit-Letter-Digit)
        # FSA format: A1A (3 chars)
        # Full format: A1A1A1 (6 chars)
        
        if len(pc) == 3:
            # FSA format (Forward Sortation Area)
            # Validate: Letter-Digit-Letter
            if pc[0].isalpha() and pc[1].isdigit() and pc[2].isalpha():
                logger.debug(f"📮 Normalized FSA postal code: {pc}")
                return pc
            else:
                logger.warning(f"⚠️ Invalid FSA postal code format: {postal_code}")
                return None
        
        elif len(pc) == 6:
            # Full postal code format
            # Validate: A1A 1A1 pattern
            if (pc[0].isalpha() and pc[1].isdigit() and pc[2].isalpha() and
                pc[3].isdigit() and pc[4].isalpha() and pc[5].isdigit()):
                # Add space: A1A 1A1
                normalized = f"{pc[:3]} {pc[3:]}"
                logger.debug(f"📮 Normalized full postal code: {normalized}")
                return normalized
            else:
                logger.warning(f"⚠️ Invalid postal code format: {postal_code}")
                return None
        
        else:
            logger.warning(f"⚠️ Invalid postal code length ({len(pc)}): {postal_code}")
            return None
    
    def _fallback_extract(
        self,
        user_message: str,
        previous_location: Optional[LocationState] = None
    ) -> LocationState:
        """
        Fallback extraction using regex patterns.
        """
        logger.debug("Using fallback location extraction")
        
        # Check for contextual references
        message_lower = user_message.lower()
        
        # "only in this neighborhood", "same area", etc.
        contextual_keywords = [
            'this neighborhood', 'same neighborhood', 'this area', 'same area',
            'on this street', 'same street', 'nearby', 'around here'
        ]
        
        if any(keyword in message_lower for keyword in contextual_keywords):
            if previous_location:
                logger.debug("Detected contextual reference, using previous location")
                return previous_location
        
        # Basic city extraction
        cities = [
            'Toronto', 'Mississauga', 'Brampton', 'Markham', 'Vaughan',
            'Richmond Hill', 'Oakville', 'Burlington', 'Ajax', 'Whitby',
            'Oshawa', 'Hamilton', 'Milton', 'Kitchener', 'Waterloo',
            'Cambridge', 'Guelph', 'Barrie', 'London', 'Ottawa', 'Kingston',
            'Vancouver', 'Calgary', 'Edmonton', 'Montreal'
        ]
        
        city = None
        for c in cities:
            if c.lower() in message_lower:
                city = c
                break
        
        # GTA handling
        if 'gta' in message_lower and not city:
            city = 'Toronto'
        
        # Postal code extraction (supports FSA and full format)
        # Try full format first: A1A 1A1 or A1A1A1
        postal_pattern_full = r'[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d'
        postal_match = re.search(postal_pattern_full, user_message, re.IGNORECASE)
        
        if not postal_match:
            # Try FSA format: A1A (standalone, not part of full postal code)
            postal_pattern_fsa = r'\b[A-Za-z]\d[A-Za-z]\b'
            postal_match = re.search(postal_pattern_fsa, user_message, re.IGNORECASE)
        
        postal_code = self._normalize_postal_code(postal_match.group(0)) if postal_match else None
        
        # Communities (basic)
        communities = [
            'Downtown Core', 'North York', 'Scarborough', 'Etobicoke',
            'East York', 'Port Credit', 'Streetsville', 'Woodbridge',
            'Thornhill', 'Unionville'
        ]
        
        community = None
        for comm in communities:
            if comm.lower() in message_lower:
                community = comm
                break
        
        return LocationState(
            city=city,
            community=community,
            neighborhood=None,
            postalCode=postal_code,
            streetName=None,
            streetNumber=None
        )
    
    def merge_location_state(
        self,
        current: LocationState,
        new: LocationState,
        user_explicitly_changed: bool = False
    ) -> LocationState:
        """
        Intelligently merge new location state with current state.
        
        Args:
            current: Current location state
            new: Newly extracted location state
            user_explicitly_changed: If True, new values override current values
            
        Returns:
            Merged LocationState
        """
        # If new state is empty, keep current
        if new.is_empty():
            logger.debug("New location state is empty, keeping current")
            return current
        
        # If user explicitly changed location (e.g., "show me Milton instead")
        if user_explicitly_changed:
            logger.info("🔄 User explicitly changed location, using new state")
            return new
        
        # Intelligent merge: preserve current values unless new values are specified
        merged = LocationState(
            city=new.city if new.city is not None else current.city,
            community=new.community if new.community is not None else current.community,
            neighborhood=new.neighborhood if new.neighborhood is not None else current.neighborhood,
            postalCode=new.postalCode if new.postalCode is not None else current.postalCode,
            streetName=new.streetName if new.streetName is not None else current.streetName,
            streetNumber=new.streetNumber if new.streetNumber is not None else current.streetNumber
        )
        
        logger.debug(f"Merged location: {current.get_summary()} + {new.get_summary()} → {merged.get_summary()}")
        return merged


# Global instance
location_extractor = LocationExtractor()


if __name__ == "__main__":
    # Test the location extractor
    print("🧪 Testing LocationExtractor...\n")
    
    extractor = LocationExtractor()
    
    # Test 1: Basic city extraction
    loc1 = extractor.extract_location_entities("Find condos in Toronto")
    print(f"1️⃣  'Find condos in Toronto' → {loc1.get_summary()}")
    
    # Test 2: Neighborhood
    loc2 = extractor.extract_location_entities("Properties in Yorkville")
    print(f"2️⃣  'Properties in Yorkville' → {loc2.get_summary()}")
    
    # Test 3: Contextual reference
    loc3 = extractor.extract_location_entities("only in this neighborhood", previous_location=loc2)
    print(f"3️⃣  'only in this neighborhood' (prev: Yorkville) → {loc3.get_summary()}")
    
    # Test 4: Postal code
    loc4 = extractor.extract_location_entities("properties in M5V 3A8")
    print(f"4️⃣  'properties in M5V 3A8' → {loc4.get_summary()}")
    
    # Test 5: Street address
    loc5 = extractor.extract_location_entities("123 King Street West")
    print(f"5️⃣  '123 King Street West' → {loc5.get_summary()}")
    
    # Test 6: Merging
    current = LocationState(city="Toronto", neighborhood="Liberty Village")
    new = LocationState(community="Downtown Core")
    merged = extractor.merge_location_state(current, new)
    print(f"\n6️⃣  Merge test: {current.get_summary()} + {new.get_summary()} → {merged.get_summary()}")
    
    print("\n✅ All tests completed!")
