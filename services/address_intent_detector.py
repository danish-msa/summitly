"""
Address Intent Detection Service
================================
Detects address-level and street-level search queries from user input.
This service has HIGHER PRIORITY than city-level searches and prevents
confirmation logic from triggering for address/street searches.

New Intent Types:
- ADDRESS_SEARCH: Exact address queries (with unit numbers)
- STREET_SEARCH: Street-level queries (without specific addresses)

Author: Summitly Team
Date: December 20, 2025
"""

import logging
import re
from typing import Dict, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

logger = logging.getLogger(__name__)


class AddressIntentType(str, Enum):
    """Address-specific intent categories."""
    ADDRESS_SEARCH = "address_search"      # Exact address with unit/number
    STREET_SEARCH = "street_search"        # Street-level search only
    NOT_ADDRESS = "not_address"            # Not an address query


@dataclass
class AddressComponents:
    """Extracted address components from user input."""
    street_number: Optional[str] = None
    street_name: Optional[str] = None
    street_suffix: Optional[str] = None
    unit_number: Optional[str] = None
    city: Optional[str] = None
    raw_input: str = ""
    
    def has_exact_address(self) -> bool:
        """Check if this represents an exact address."""
        return (self.street_number is not None and 
                self.street_name is not None and
                self.street_suffix is not None)
    
    def has_street_only(self) -> bool:
        """Check if this is street-level only."""
        return (self.street_name is not None and 
                self.street_suffix is not None and
                self.street_number is None)


@dataclass
class AddressIntentResult:
    """Result of address intent detection."""
    intent_type: AddressIntentType
    components: AddressComponents
    confidence: float
    reason: str
    metadata: Dict[str, Any]


class AddressIntentDetector:
    """
    Detects address and street-level search intents with high precision.
    
    This detector runs BEFORE confirmation management and city-level
    search logic to ensure address searches get priority handling.
    """
    
    def __init__(self):
        # Street suffixes (Canadian/North American standard)
        self.street_suffixes = {
            # Full forms
            'street', 'avenue', 'road', 'drive', 'circle', 'boulevard',
            'lane', 'way', 'crescent', 'court', 'place', 'terrace',
            'parkway', 'trail', 'path', 'grove', 'square', 'gardens',
            'heights', 'hill', 'valley', 'ridge', 'green', 'close',
            
            # Abbreviations
            'st', 'ave', 'rd', 'dr', 'cir', 'blvd', 'ln', 'cr', 'ct',
            'pl', 'ter', 'pkwy', 'tr', 'gr', 'sq', 'gdns', 'hts',
            'hl', 'vly', 'rdg', 'grn', 'cl'
        }
        
        # Address indicator phrases
        self.address_indicators = {
            'on ', 'at ', 'near ', 'along ', 'down ', 'up ',
            'properties on', 'listings on', 'homes on', 'condos on',
            'houses on', 'property at', 'listing at', 'home at'
        }
        
        # Unit/suite indicators
        self.unit_indicators = {
            'unit', 'suite', 'apt', 'apartment', '#', 'ph', 'penthouse'
        }
        
        logger.info("✅ AddressIntentDetector initialized")
    
    def detect_intent(
        self, 
        user_message: str, 
        current_location: Optional[str] = None
    ) -> AddressIntentResult:
        """
        Detect if user message is an address or street search query.
        
        Args:
            user_message: User's input message
            current_location: Current session location context
            
        Returns:
            AddressIntentResult with detected intent and components
        """
        user_message_lower = user_message.lower().strip()
        
        # Extract address components
        components = self._extract_address_components(user_message, current_location)
        
        # Determine intent type based on components
        intent_type, confidence, reason = self._classify_address_intent(
            components, user_message_lower
        )
        
        metadata = {
            "has_street_suffix": bool(components.street_suffix),
            "has_street_number": bool(components.street_number),
            "has_unit": bool(components.unit_number),
            "has_indicators": self._has_address_indicators(user_message_lower),
            "word_count": len(user_message.split()),
            "original_message": user_message
        }
        
        result = AddressIntentResult(
            intent_type=intent_type,
            components=components,
            confidence=confidence,
            reason=reason,
            metadata=metadata
        )
        
        if intent_type != AddressIntentType.NOT_ADDRESS:
            logger.info(
                f"🏠 [ADDRESS_INTENT] {intent_type.value} detected: "
                f"'{user_message[:50]}...' (confidence: {confidence:.2f})"
            )
        
        return result
    
    def _extract_address_components(
        self, 
        user_message: str, 
        current_location: Optional[str] = None
    ) -> AddressComponents:
        """Extract address components from user input."""
        components = AddressComponents(raw_input=user_message)
        
        # Extract unit number first (to avoid confusing with street number)
        unit_match = self._extract_unit_number(user_message)
        if unit_match:
            components.unit_number = unit_match
        
        # Extract street number (digits at start or after "on"/"at")
        street_number_match = self._extract_street_number(user_message)
        if street_number_match:
            components.street_number = street_number_match
        
        # Extract street name and suffix
        street_info = self._extract_street_info(user_message)
        if street_info:
            components.street_name = street_info['name']
            components.street_suffix = street_info['suffix']
        
        # Use current location as city if not explicitly provided
        if current_location and not components.city:
            components.city = current_location
        elif not components.city:
            components.city = "Toronto"  # Default fallback
        
        return components
    
    def _extract_unit_number(self, text: str) -> Optional[str]:
        """Extract unit/suite number from text."""
        patterns = [
            r'\bunit\s+(\d+[a-zA-Z]?)\b',
            r'\bsuite\s+(\d+[a-zA-Z]?)\b', 
            r'\bapt\s+(\d+[a-zA-Z]?)\b',
            r'\bapartment\s+(\d+[a-zA-Z]?)\b',
            r'\bph\s+(\d+[a-zA-Z]?)\b',
            r'#(\d+[a-zA-Z]?)\b',
            r'\b(\d+[a-zA-Z]?)\s+(?=\d+\s+\w+\s+(?:' + '|'.join(self.street_suffixes) + '))'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def _extract_street_number(self, text: str) -> Optional[str]:
        """
        Extract street number from text.
        
        RULE: Do NOT treat bedroom count as street number
        """
        # Exclude bedroom/bathroom counts from street number detection
        bedroom_patterns = [
            r'\b\d+\s+bed(room)?s?\b',
            r'\b\d+\s+bath?(room)?s?\b', 
            r'\b\d+\s+br\b',
            r'\b\d+\s+ba\b'
        ]
        
        # Check if number is part of a bedroom/bathroom specification
        for pattern in bedroom_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                logger.info(f"🚫 [ANTI_PATTERN] Bedroom/bathroom count detected - NOT treating as street number: '{text}'")
                return None
        
        # Look for numbers that precede street names (but avoid bedroom counts)
        patterns = [
            r'\b(\d+(?:-\d+)?[a-zA-Z]?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(' + 
            '|'.join(self.street_suffixes) + r')\b',
            r'(?:on|at|near)\s+(\d+(?:-\d+)?[a-zA-Z]?)\s+',
            r'^(\d+(?:-\d+)?[a-zA-Z]?)\s+'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Double-check that this isn't a bedroom count
                number = match.group(1)
                context_before = text[:match.start()].lower()
                context_after = text[match.end():].lower()
                
                # Skip if preceded by words indicating it's a bedroom count
                if any(word in context_before for word in ['bedroom', 'bath', 'bed', 'room']):
                    continue
                    
                return number
        
        return None
    
    def _extract_street_info(self, text: str) -> Optional[Dict[str, str]]:
        """Extract street name and suffix."""
        # First, try to find street names after specific indicators
        indicator_pattern = r'(?:on|at|near|along|about)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+(' + \
                          '|'.join(self.street_suffixes) + r')\b'
        
        match = re.search(indicator_pattern, text, re.IGNORECASE)
        if match:
            return {
                'name': match.group(1).strip(),
                'suffix': match.group(2).lower()
            }
        
        # Pattern to match: [number] StreetName StreetSuffix
        pattern = (
            r'\b(?:\d+\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*?)\s+(' + 
            '|'.join(self.street_suffixes) + r')\b'
        )
        
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            street_name = match.group(1).strip()
            # Remove indicator words from street name
            indicator_words = ['properties', 'listings', 'homes', 'condos', 'houses', 'property', 'listing', 'home', 'how', 'what', 'any', 'some']
            street_name_words = street_name.split()
            filtered_words = [word for word in street_name_words if word.lower() not in indicator_words]
            
            if filtered_words:  # Make sure we have something left
                return {
                    'name': ' '.join(filtered_words),
                    'suffix': match.group(2).lower()
                }
        
        return None
    
    def _classify_address_intent(
        self, 
        components: AddressComponents, 
        user_message_lower: str
    ) -> Tuple[AddressIntentType, float, str]:
        """Classify the intent based on extracted components."""
        
        # High confidence ADDRESS_SEARCH (exact address)
        if components.has_exact_address():
            if components.unit_number:
                return AddressIntentType.ADDRESS_SEARCH, 0.95, \
                       f"Complete address with unit: {components.street_number} {components.street_name} {components.street_suffix} unit {components.unit_number}"
            else:
                return AddressIntentType.ADDRESS_SEARCH, 0.90, \
                       f"Complete address: {components.street_number} {components.street_name} {components.street_suffix}"
        
        # Medium-high confidence STREET_SEARCH
        if components.has_street_only():
            has_indicators = self._has_address_indicators(user_message_lower)
            confidence = 0.85 if has_indicators else 0.75
            reason = f"Street-level search: {components.street_name} {components.street_suffix}"
            if has_indicators:
                reason += " (with location indicators)"
            return AddressIntentType.STREET_SEARCH, confidence, reason
        
        # Lower confidence checks
        if components.street_name and components.street_suffix:
            # Has street components but missing classification above
            return AddressIntentType.STREET_SEARCH, 0.60, \
                   f"Partial street match: {components.street_name} {components.street_suffix}"
        
        # Check for address indicators without clear street pattern
        if self._has_address_indicators(user_message_lower):
            # Look for any street suffix in the message
            for suffix in self.street_suffixes:
                if f' {suffix} ' in user_message_lower or user_message_lower.endswith(f' {suffix}'):
                    return AddressIntentType.STREET_SEARCH, 0.50, \
                           f"Address indicators with street suffix '{suffix}'"
        
        return AddressIntentType.NOT_ADDRESS, 0.0, "No address components detected"
    
    def _has_address_indicators(self, text: str) -> bool:
        """Check if text contains address indicator phrases."""
        return any(indicator in text for indicator in self.address_indicators)
    
    def is_address_query(self, user_message: str) -> bool:
        """
        Quick check if message is likely an address query.
        Used for priority routing in orchestrator.
        """
        result = self.detect_intent(user_message)
        return result.intent_type != AddressIntentType.NOT_ADDRESS


# Singleton instance
_address_detector_instance = None


def get_address_intent_detector() -> AddressIntentDetector:
    """Get singleton instance of AddressIntentDetector."""
    global _address_detector_instance
    if _address_detector_instance is None:
        _address_detector_instance = AddressIntentDetector()
    return _address_detector_instance