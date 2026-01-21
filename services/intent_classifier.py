"""
Intent Classification Service
==============================
Classifies user messages into precise intent categories before
applying filters or calling Repliers MLS API.

This prevents:
- Automatic filter reuse without confirmation
- Off-topic messages triggering property searches
- Silent MLS queries when user intent is unclear

Author: Summitly Team
Date: December 18, 2024
"""

import logging
import re
from typing import Dict, Any, Optional, Tuple
from enum import Enum

logger = logging.getLogger(__name__)


class UserIntent(str, Enum):
    """User intent categories for conversation flow control."""
    
    # Primary property search intents (can trigger MLS)
    PROPERTY_SEARCH = "property_search"  # Explicit new search with criteria
    PROPERTY_REFINEMENT = "property_refinement"  # Modify existing search filters
    
    # Confirmation and change intents (require user interaction)
    PROPERTY_CHANGE_REQUEST = "property_change_request"  # Wants different location/criteria
    CONFIRMATION_NEEDED = "confirmation_needed"  # Vague request needing clarification
    
    # Non-property intents (never trigger MLS)
    OFF_TOPIC = "off_topic"  # Completely unrelated to real estate
    GENERAL_CHAT = "general_chat"  # Greetings, help requests, general questions
    
    # Special intents
    VALUATION = "valuation"  # Property valuation request
    DETAILS = "details"  # Details about specific property
    RESET = "reset"  # Clear search criteria


class IntentClassifier:
    """
    Classify user messages into precise intent categories.
    
    This is the first layer of defense against:
    - Unwanted MLS API calls
    - Filter reuse without confirmation
    - Off-topic message handling
    """
    
    def __init__(self):
        # Off-topic patterns (food, sports, politics, etc.)
        # NOTE: Do NOT include business types like 'restaurant' - these are valid commercial searches!
        self.off_topic_patterns = [
            # Food recipes and cooking (NOT restaurant as a business)
            r'\b(paneer|biryani|burger|pasta|sushi|curry|noodles|recipe|cooking|chef)\b',
            r'\b(breakfast|lunch|dinner|meal|dessert|drink|wine|beer)\b',
            
            # Sports and entertainment
            r'\b(football|basketball|soccer|hockey|baseball|cricket|tennis|golf)\b',
            r'\b(movie|film|series|netflix|spotify|game|gaming|concert|music)\b',
            
            # Technology (non-real-estate)
            r'\b(iphone|android|laptop|computer|software|app|website|coding|programming)\b',
            
            # Personal matters
            r'\b(birthday|anniversary|wedding|vacation|holiday|travel|trip|flight)\b',
            
            # Weather (unless combined with property terms)
            r'\b(weather|rain|snow|temperature|forecast)\b',
            
            # Politics and news
            r'\b(election|vote|president|minister|parliament|government|politics)\b'
        ]
        
        # ✅ Commercial business types that are VALID property searches (NOT off-topic)
        self.commercial_business_types = [
            'restaurant', 'bakery', 'cafe', 'coffee shop', 'bar', 'pub', 'pizzeria',
            'salon', 'spa', 'barber', 'gym', 'fitness', 'yoga',
            'office', 'retail', 'store', 'shop', 'boutique', 'showroom',
            'warehouse', 'industrial', 'manufacturing',
            'medical', 'dental', 'clinic', 'pharmacy',
            'hotel', 'motel', 'inn', 'car wash', 'gas station',
            'daycare', 'florist', 'laundry', 'dry cleaning', 'grocery', 'supermarket'
        ]
        
        # Vague request patterns (need confirmation)
        self.vague_patterns = [
            r'\b(other|another|different)\s+(properties|listings?|options?)\b',
            r'\bsomething\s+else\b',
            r'\bshow\s+me\s+(more|other|another|something)\b',
            r'\bwhat\s+else\b',
            r'\bany\s+other\b',
            r'\b(more|other)\s+options?\b',
            r'^(more|other|else)$'  # Single word vague requests
        ]
        
        # Location change patterns
        self.location_change_patterns = [
            r'\bhow about\s+(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',
            r'\bwhat about\s+(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',
            r'\bshow\s+me\s+(?:properties\s+)?(?:in\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+instead\b',
            r'\btry\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b',
            r'\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+instead\b'
        ]
        
        # Explicit search patterns (clear intent)
        self.explicit_search_patterns = [
            r'\bshow\s+me\s+\d+\s+bed',
            r'\bfind\s+(?:me\s+)?(?:a\s+)?\d+\s+bed',
            r'\blooking\s+for\s+(?:a\s+)?\d+\s+bed',
            r'\bonly\s+\d+\s+bed',  # "only 5 beds"
            r'\bjust\s+\d+\s+bed',  # "just 3 beds"
            r'\b\d+\s+bed(?:room)?s?\s+only\b',  # "5 bedrooms only"
            r'\bexactly\s+\d+\s+bed',  # "exactly 4 beds"
            r'\b(?:condos?|houses?|townhouses?|properties)\s+(?:in|at|near)\s+[A-Z]',
            r'\bunder\s+\$?\d+k?\b',
            r'\bbudget\s+(?:of\s+)?\$?\d+',
            r'\brentals?\s+under\b',
            r'\b(?:buy|purchase|rent)\s+(?:a\s+)?(?:property|condo|house)\b'
        ]
        
        # General chat patterns
        self.general_chat_patterns = [
            r'\b(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening)\b',
            r'\bhow\s+are\s+you\b',
            r'\bwhat\s+can\s+you\s+do\b',
            r'\bhelp\s+me\b',
            r'\bthank(?:s|you)\b',
            r'\bbye\b'
        ]
        
        # Valuation patterns
        self.valuation_patterns = [
            r'\b(?:value|worth|valuation|estimate|appraisal)\b.*\b(?:mls|property|home|house)\b',
            r'\bmls:?\s*[A-Z]?\d+',
            r'\bwhat(?:\'s| is)\s+(?:the\s+)?(?:value|worth|price)\b'
        ]
        
        logger.info("✅ IntentClassifier initialized")
    
    def classify(
        self,
        user_message: str,
        current_filters: Optional[Dict[str, Any]] = None,
        last_search_count: int = 0
    ) -> Tuple[UserIntent, Dict[str, Any]]:
        """
        Classify user message into intent category.
        
        Args:
            user_message: User's input message
            current_filters: Current active filters from state
            last_search_count: Number of results from last search
            
        Returns:
            Tuple of (intent, metadata)
            - intent: UserIntent enum value
            - metadata: Dict with additional context (reason, confidence, etc.)
        """
        user_message_lower = user_message.lower().strip()
        
        # Initialize metadata
        metadata = {
            "reason": "",
            "confidence": "medium",
            "requires_confirmation": False,
            "suggested_action": ""
        }
        
        # 1. Check for OFF-TOPIC first (highest priority)
        if self._is_off_topic(user_message_lower):
            metadata["reason"] = "Message contains non-real-estate topics"
            metadata["confidence"] = "high"
            metadata["suggested_action"] = "Redirect to property assistance"
            logger.info(f"🚫 [INTENT] OFF_TOPIC detected: '{user_message[:50]}...'")
            return UserIntent.OFF_TOPIC, metadata
        
        # 2. Check for GENERAL_CHAT (greetings, help)
        if self._is_general_chat(user_message_lower):
            metadata["reason"] = "General conversation or greeting"
            metadata["confidence"] = "high"
            metadata["suggested_action"] = "Provide friendly response without search"
            logger.info(f"💬 [INTENT] GENERAL_CHAT detected: '{user_message[:50]}...'")
            return UserIntent.GENERAL_CHAT, metadata
        
        # 3. Check for VALUATION
        if self._is_valuation_request(user_message_lower):
            metadata["reason"] = "Property valuation request"
            metadata["confidence"] = "high"
            metadata["suggested_action"] = "Process valuation"
            logger.info(f"💰 [INTENT] VALUATION detected: '{user_message[:50]}...'")
            return UserIntent.VALUATION, metadata
        
        # 4. Check for RESET
        if self._is_reset_request(user_message_lower):
            metadata["reason"] = "User wants to clear filters"
            metadata["confidence"] = "high"
            metadata["suggested_action"] = "Clear all filters"
            logger.info(f"🔄 [INTENT] RESET detected: '{user_message[:50]}...'")
            return UserIntent.RESET, metadata
        
        # 5. Check for LOCATION CHANGE
        location_change, new_location = self._detect_location_change(user_message)
        if location_change and current_filters and current_filters.get('location'):
            old_location = current_filters['location']
            if new_location.lower() != old_location.lower():
                metadata["reason"] = f"Location change detected: {old_location} → {new_location}"
                metadata["confidence"] = "high"
                metadata["requires_confirmation"] = True
                metadata["suggested_action"] = "Ask if user wants to keep other filters"
                metadata["new_location"] = new_location
                metadata["old_location"] = old_location
                logger.info(f"🌆 [INTENT] PROPERTY_CHANGE_REQUEST detected: {old_location} → {new_location}")
                return UserIntent.PROPERTY_CHANGE_REQUEST, metadata
        
        # 5.5 Check for FRAGMENTED MESSAGES EARLY (before vague request check)
        # This prevents "show me more" from being caught as vague when it's actually fragmented
        if current_filters and any(current_filters.values()):
            if self._is_fragmented_refinement(user_message_lower, user_message):
                metadata["reason"] = "Fragmented refinement with existing context"
                metadata["confidence"] = "medium"
                metadata["suggested_action"] = "Treat as continuation of previous search"
                logger.info(f"🧩 [INTENT] PROPERTY_REFINEMENT (fragmented): '{user_message[:50]}...'")
                return UserIntent.PROPERTY_REFINEMENT, metadata
        
        # 6. Check for VAGUE REQUEST (confirmation needed)
        if self._is_vague_request(user_message_lower):
            # Only flag as vague if we have previous filters
            if current_filters and any(current_filters.values()):
                metadata["reason"] = "Vague request without explicit criteria"
                metadata["confidence"] = "high"
                metadata["requires_confirmation"] = True
                metadata["suggested_action"] = "Ask what user wants to change"
                logger.info(f"❓ [INTENT] CONFIRMATION_NEEDED detected: '{user_message[:50]}...'")
                return UserIntent.CONFIRMATION_NEEDED, metadata
            else:
                # No previous filters, treat as vague general question
                metadata["reason"] = "Vague request with no context"
                metadata["suggested_action"] = "Ask for specific criteria"
                return UserIntent.GENERAL_CHAT, metadata
        
        # 7. Check for EXPLICIT SEARCH (clear new search)
        if self._is_explicit_search(user_message_lower):
            metadata["reason"] = "Explicit search criteria provided"
            metadata["confidence"] = "high"
            metadata["suggested_action"] = "Execute search with provided criteria"
            logger.info(f"🔍 [INTENT] PROPERTY_SEARCH detected: '{user_message[:50]}...'")
            return UserIntent.PROPERTY_SEARCH, metadata
        
        # 8. Check for REFINEMENT (modify existing filters)
        if current_filters and any(current_filters.values()):
            # Has previous filters, likely a refinement
            if self._is_refinement(user_message_lower):
                metadata["reason"] = "Refinement of existing search criteria"
                metadata["confidence"] = "medium"
                metadata["suggested_action"] = "Update filters and re-search"
                logger.info(f"🔧 [INTENT] PROPERTY_REFINEMENT detected: '{user_message[:50]}...'")
                return UserIntent.PROPERTY_REFINEMENT, metadata
            # Note: Fragmented message check moved to step 5.5 (before vague request check)
        
        # 9. Default: Check if contains property-related keywords
        if self._contains_property_keywords(user_message_lower):
            # Has property keywords but unclear intent
            if current_filters and any(current_filters.values()):
                # Has context, assume refinement
                metadata["reason"] = "Property-related with existing context"
                metadata["confidence"] = "low"
                return UserIntent.PROPERTY_REFINEMENT, metadata
            else:
                # No context, treat as general question
                metadata["reason"] = "Property-related but needs more info"
                metadata["suggested_action"] = "Ask for specific criteria"
                return UserIntent.GENERAL_CHAT, metadata
        
        # 10. Final fallback: GENERAL_CHAT
        metadata["reason"] = "No clear intent detected"
        metadata["confidence"] = "low"
        metadata["suggested_action"] = "Ask clarifying question"
        logger.info(f"💬 [INTENT] Fallback to GENERAL_CHAT: '{user_message[:50]}...'")
        return UserIntent.GENERAL_CHAT, metadata
    
    def _is_off_topic(self, message: str) -> bool:
        """
        Check if message is off-topic (non-real-estate).
        
        CRITICAL: Handles edge cases where postal codes appear in off-topic messages
        Example: "paneer chilli M5V" should be OFF-TOPIC, not a property search
        
        BUT: Commercial searches like "restaurant on King Street" are VALID!
        """
        # ✅ FIRST: Check if this is a commercial property search (NOT off-topic!)
        has_commercial_business = any(btype in message for btype in self.commercial_business_types)
        if has_commercial_business:
            # Check if it has location or property context
            location_terms = ['in ', 'on ', 'near ', 'at ', 'street', 'road', 'avenue', 
                            'toronto', 'ottawa', 'vancouver', 'mississauga', 'calgary',
                            'downtown', 'midtown', 'for sale', 'for lease', 'property',
                            'space', 'commercial', 'business']
            has_location_context = any(term in message for term in location_terms)
            if has_location_context:
                logger.info(f"✅ [OFF_TOPIC CHECK] Commercial search detected, NOT off-topic: '{message[:50]}...'")
                return False  # This is a VALID commercial property search
        
        # Check against off-topic patterns
        for pattern in self.off_topic_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                # Make sure it's not combined with property terms
                property_terms = r'\b(property|properties|house|condo|apartment|listing|real estate|mls|home|homes|rent|sale|buy|search|find|show|looking|commercial|business|space|lease)\b'
                if not re.search(property_terms, message, re.IGNORECASE):
                    # POSTAL CODE SAFETY CHECK
                    # If message contains postal code BUT also contains off-topic keywords,
                    # it's likely off-topic (e.g., "paneer chilli M5V")
                    postal_pattern = r'\b[A-Za-z]\d[A-Za-z](?:\s?\d[A-Za-z]\d)?\b'
                    if re.search(postal_pattern, message, re.IGNORECASE):
                        logger.info(
                            f"🚫 [OFF-TOPIC POSTAL CODE] Detected postal code in off-topic message: '{message[:50]}...'"
                        )
                    return True
        return False
    
    def _is_general_chat(self, message: str) -> bool:
        """Check if message is general chat/greeting."""
        for pattern in self.general_chat_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_valuation_request(self, message: str) -> bool:
        """Check if message is valuation request."""
        for pattern in self.valuation_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_reset_request(self, message: str) -> bool:
        """Check if user wants to reset/clear filters."""
        reset_keywords = [
            r'\b(start over|reset|clear|new search|fresh start)\b'
        ]
        for pattern in reset_keywords:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _detect_location_change(self, message: str) -> Tuple[bool, Optional[str]]:
        """
        Detect if user is requesting a location change.
        Returns (is_change, new_location)
        
        Property types like "condos", "detached homes" should NOT be treated as locations.
        """
        # Property type keywords that should NOT be treated as locations
        property_type_keywords = [
            'condo', 'condos', 'house', 'houses', 'apartment', 'apartments',
            'townhouse', 'townhouses', 'detached', 'semi-detached', 'duplex',
            'bungalow', 'cottage', 'villa', 'mansion', 'loft', 'studio',
            'commercial', 'residential', 'office', 'retail', 'industrial',
            # Multi-word property types
            'detached homes', 'detached houses', 'semi-detached homes',
            'townhomes', 'town homes', 'condo units', 'apartment units',
            'attached homes', 'single family', 'multi family'
        ]
        
        for pattern in self.location_change_patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if match:
                new_location = match.group(1)
                # Check if matched text is actually a property type, not location
                if new_location.lower() in property_type_keywords:
                    logger.debug(f"🏠 [LOCATION] Skipping '{new_location}' - it's a property type, not location")
                    continue  # Skip this match, it's a property type
                return True, new_location
        return False, None
    
    def _is_vague_request(self, message: str) -> bool:
        """Check if message is vague (needs confirmation)."""
        for pattern in self.vague_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_explicit_search(self, message: str) -> bool:
        """Check if message contains explicit search criteria."""
        for pattern in self.explicit_search_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_refinement(self, message: str) -> bool:
        """Check if message is refining existing search."""
        refinement_keywords = [
            r'\bwith\s+(?:a\s+)?pool\b',
            r'\bwith\s+(?:a\s+)?gym\b',
            r'\bwith\s+parking\b',
            r'\b\d+\s+bathrooms?\b',
            r'\bunder\s+\$?\d+',
            r'\blarger\b',
            r'\bsmaller\b',
            r'\bcheaper\b',
            r'\bmore\s+expensive\b'
        ]
        for pattern in refinement_keywords:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False
    
    def _is_fragmented_refinement(self, message_lower: str, original_message: str) -> bool:
        """
        Detect fragmented/incomplete messages that are continuations of previous search.
        
        Examples:
        - "condos..." → property type refinement
        - "in Hurontario Street..." → location refinement
        - "with 2 bedrooms..." → bedroom refinement
        - "instead mississauga..." → location change
        
        Args:
            message_lower: Lowercase message
            original_message: Original message (preserves case/punctuation)
            
        Returns:
            True if message is fragmented refinement
        """
        # Strip trailing punctuation for pattern matching
        clean_msg = message_lower.rstrip('.,;:!?… ')
        
        # Very short messages with ellipsis or trailing dots
        has_ellipsis = '...' in original_message or '…' in original_message
        is_very_short = len(clean_msg.split()) <= 3
        
        # Fragmented location patterns
        location_fragment_patterns = [
            r'^(?:in|at|on|near)\s+\w+',  # "in Toronto", "on King Street"
            r'^instead\s+\w+',  # "instead mississauga"
            r'^\w+\s+(?:street|road|avenue|boulevard|drive|lane|place|court)',  # "Hurontario Street"
        ]
        
        # Fragmented property type patterns
        property_type_patterns = [
            r'^(?:condos?|houses?|townhouses?|apartments?|rentals?)$',  # Just "condos" or "rentals"
            r'^(?:detached|semi-detached|attached)$',  # Just property style
            r'^(?:how|what)\s+about\s+(?:condos?|houses?|townhouses?|apartments?|rentals?|detached|semi-detached|bungalows?|cottages?|attached)',  # "how about condos"
            r'^(?:how|what)\s+about\s+(?:detached|semi-detached|attached)\s+(?:homes?|houses?)',  # "what about detached homes"
            r'^show\s+me\s+(?:condos?|houses?|townhouses?|apartments?|rentals?)',  # "show me condos" or "show me rentals"
        ]
        
        # Fragmented criteria patterns
        criteria_patterns = [
            r'^\d+\s+(?:bed(?:room)?s?|bath(?:room)?s?)$',  # "2 bedrooms"
            r'^with\s+\w+',  # "with parking"
            r'^under\s+\$?\d+',  # "under 500k"
            r'^show\s+me\s+(?:any|more|all|some)',  # "show me any", "show me more"
            r'^(?:any|more|all|some)\s+(?:properties|listings?)',  # "any properties"
        ]
        
        # Check all patterns
        for pattern in property_type_patterns:
            if re.match(pattern, clean_msg, re.IGNORECASE):
                # Property type patterns are always valid refinements (don't need ellipsis)
                return True
        
        # For location and criteria fragments, require short message or ellipsis
        location_and_criteria_patterns = location_fragment_patterns + criteria_patterns
        for pattern in location_and_criteria_patterns:
            if re.match(pattern, clean_msg, re.IGNORECASE):
                # If it matches a fragment pattern AND is short/has ellipsis, treat as refinement
                if is_very_short or has_ellipsis:
                    return True
        
        # Additional check: very short property-related words with ellipsis
        if has_ellipsis and is_very_short:
            # Check if contains any property-related words
            property_words = ['condo', 'house', 'apartment', 'townhouse', 'property', 
                            'bedroom', 'bathroom', 'street', 'road', 'avenue']
            if any(word in clean_msg for word in property_words):
                return True
        
        return False
    
    def _contains_property_keywords(self, message: str) -> bool:
        """Check if message contains property-related keywords."""
        property_keywords = [
            r'\b(property|properties|house|home|condo|apartment|townhouse)\b',
            r'\b(listing|listings|real estate|mls)\b',
            r'\b(bedroom|bathroom|sqft|square feet)\b',
            r'\b(buy|rent|purchase|lease|sale)\b',
            r'\b(toronto|mississauga|vaughan|markham|gta)\b'
        ]
        for pattern in property_keywords:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        return False


# Global instance
intent_classifier = IntentClassifier()


if __name__ == "__main__":
    # Test cases
    print("🧪 Testing Intent Classifier\n")
    
    classifier = IntentClassifier()
    
    test_cases = [
        # Off-topic
        ("paneer chilli", None),
        ("what's the weather like?", None),
        ("let's watch a movie", None),
        
        # General chat
        ("hello", None),
        ("what can you do?", None),
        ("thanks", None),
        
        # Explicit search
        ("show me 2 bedroom condos in Toronto under 600k", None),
        ("find houses in Mississauga", None),
        
        # Vague requests (with context)
        ("show me other properties", {"location": "Toronto", "bedrooms": 2}),
        ("what else do you have?", {"location": "Toronto"}),
        
        # Location change (with context)
        ("how about Vancouver?", {"location": "Toronto", "bedrooms": 2}),
        ("show me properties in Mississauga instead", {"location": "Toronto"}),
        
        # Refinement
        ("with a pool", {"location": "Toronto", "bedrooms": 2}),
        ("under 500k", {"location": "Toronto"}),
    ]
    
    for message, filters in test_cases:
        intent, metadata = classifier.classify(message, filters)
        print(f"Message: '{message}'")
        print(f"  Intent: {intent.value}")
        print(f"  Reason: {metadata['reason']}")
        print(f"  Confirmation needed: {metadata['requires_confirmation']}")
        print()
