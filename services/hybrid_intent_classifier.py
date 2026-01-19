"""
Intent Classification Service (HYBRID LOCAL-FIRST + GPT-4 FALLBACK)
===================================================================
Classifies user messages into precise intent categories before
applying filters or calling Repliers MLS API.

This prevents:
- Automatic filter reuse without confirmation
- Off-topic messages triggering property searches
- Silent MLS queries when user intent is unclear

Architecture:
- LOCAL-FIRST: Pattern matching for 95%+ of messages (instant, no API cost)
- GPT-4 FALLBACK: Only for ambiguous cases with confidence < 70%
- LRU CACHING: 1000 most common messages cached for 24 hours

Author: Summitly Team
Date: December 22, 2024
"""

import logging
import re
import hashlib
import json
import os
from typing import Dict, Any, Optional, Tuple, List
from enum import Enum
from datetime import datetime, timedelta
from collections import OrderedDict

# Import shared confirmation tokens (single source of truth)
from services.confirmation_tokens import (
    CONFIRMATION_REGEX_PATTERNS,
    is_confirmation_response,
    detect_confirmation_with_regex
)

logger = logging.getLogger(__name__)


class UserIntent(str, Enum):
    """User intent categories for conversation flow control."""
    
    # Primary property search intents (can trigger MLS)
    PROPERTY_SEARCH = "property_search"  # Explicit new search with criteria
    PROPERTY_REFINEMENT = "property_refinement"  # Modify existing search filters
    
    # Confirmation and change intents (require user interaction)
    PROPERTY_CHANGE_REQUEST = "property_change_request"  # Wants different location/criteria
    CONFIRMATION_NEEDED = "confirmation_needed"  # Vague request needing clarification
    CONFIRMATION = "confirmation"  # Yes/No/Keep confirmations
    
    # Non-property intents (never trigger MLS)
    OFF_TOPIC = "off_topic"  # Completely unrelated to real estate
    GENERAL_CHAT = "general_chat"  # Greetings, help requests, general questions
    GENERAL_QUESTION = "general_question"  # Questions about properties
    
    # Special intents
    VALUATION = "valuation"  # Property valuation request
    DETAILS = "details"  # Details about specific property
    RESET = "reset"  # Clear search criteria


class IntentCache:
    """
    LRU cache for intent classification results.
    Stores most common 1000 messages with 24-hour timeout.
    """
    
    def __init__(self, max_size: int = 1000, timeout_hours: int = 24):
        self.max_size = max_size
        self.timeout = timedelta(hours=timeout_hours)
        self.cache: OrderedDict = OrderedDict()
        self.hits = 0
        self.misses = 0
    
    def _make_key(self, message: str, filters: Optional[Dict] = None) -> str:
        """Create cache key from message and filters."""
        normalized_msg = message.lower().strip()
        filter_hash = hashlib.md5(
            json.dumps(filters or {}, sort_keys=True).encode()
        ).hexdigest()[:8]
        return hashlib.md5(
            f"{normalized_msg}:{filter_hash}".encode()
        ).hexdigest()
    
    def get(self, message: str, filters: Optional[Dict] = None) -> Optional[Tuple[UserIntent, Dict[str, Any]]]:
        """Get cached result if exists and not expired."""
        key = self._make_key(message, filters)
        
        if key in self.cache:
            cached_data, timestamp = self.cache[key]
            
            # Check if expired
            if datetime.now() - timestamp < self.timeout:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.hits += 1
                return cached_data
            else:
                # Expired, remove
                del self.cache[key]
        
        self.misses += 1
        return None
    
    def set(self, message: str, filters: Optional[Dict], result: Tuple[UserIntent, Dict[str, Any]]):
        """Store result in cache."""
        key = self._make_key(message, filters)
        
        # Add to cache
        self.cache[key] = (result, datetime.now())
        self.cache.move_to_end(key)
        
        # Evict oldest if over limit
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)
    
    def get_hit_rate(self) -> float:
        """Calculate cache hit rate for monitoring."""
        total = self.hits + self.misses
        if total == 0:
            return 0.0
        return self.hits / total
    
    def clear(self):
        """Clear cache (useful for testing)."""
        self.cache.clear()
        self.hits = 0
        self.misses = 0


class HybridIntentClassifier:
    """
    Hybrid Intent Classifier with LOCAL-FIRST processing + GPT-4 fallback.
    
    This is the first layer of defense against:
    - Unwanted MLS API calls
    - Filter reuse without confirmation
    - Off-topic message handling
    
    Process:
    1. Check cache (instant)
    2. Try local pattern matching (99% confidence)
    3. If confidence < 70%, fallback to GPT-4
    4. Cache result for future
    """
    
    def __init__(self):
        # Initialize cache
        self.cache = IntentCache(max_size=1000, timeout_hours=24)
        
        # Confidence thresholds
        self.HIGH_CONFIDENCE = 0.95
        self.MEDIUM_CONFIDENCE = 0.85
        self.LOW_CONFIDENCE = 0.70
        self.GPT_FALLBACK_THRESHOLD = 0.70
        
        # Initialize OpenAI client for fallback
        self.openai_client = None
        self.openai_model = None
        try:
            from openai import OpenAI
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = OpenAI(api_key=api_key)
                self.openai_model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
                logger.info("✅ OpenAI client initialized for intent fallback")
        except Exception as e:
            logger.warning(f"⚠️ OpenAI client not available for intent fallback: {e}")
        
        # Confirmation patterns - now using shared module (CONFIRMATION_REGEX_PATTERNS)
        # Imported from services.confirmation_tokens for consistency
        self.confirmation_patterns = CONFIRMATION_REGEX_PATTERNS
        
        # Off-topic keywords (95% confidence)
        self.off_topic_keywords = [
            'weather', 'sports', 'news', 'cooking', 'music', 'movie', 'film',
            'food', 'restaurant', 'recipe', 'paneer', 'biryani', 'pizza',
            'football', 'basketball', 'soccer', 'hockey', 'game', 'gaming',
            'birthday', 'anniversary', 'wedding', 'vacation', 'travel',
            'politics', 'election', 'vote', 'president'
        ]
        
        # Valuation patterns (98% confidence)
        self.valuation_keywords = ['value', 'worth', 'estimate', 'appraisal', 'mls']
        self.valuation_patterns = [
            r'\bmls:?\s*[A-Z]?C?\d+',
            r'\bwhat\s+is\s+.*\s+worth\b',
            r'\bvalue\s+of\b',
            r'\bestimate\s+for\b',
        ]
        
        # Property search patterns (96% confidence)
        self.property_search_patterns = [
            r'\b\d+\s+bed(?:room)?s?\b',
            r'\b\d+\s+bath(?:room)?s?\b',
            r'\bunder\s+\$\d+',
            r'\bfrom\s+\$\d+',
            r'\b(condo|house|townhouse|apartment)\b',
            r'\bshow\s+me\s+\d+\s+bed',
            r'\bfind\s+.*\s+in\s+[A-Z]',
        ]
        
        # Refinement keywords (92% confidence)
        self.refinement_keywords = [
            'more', 'fewer', 'different', 'instead', 'change', 'adjust',
            'actually', 'modify', 'update', 'with', 'without', 'larger',
            'smaller', 'cheaper', 'expensive', 'pool', 'gym', 'parking'
        ]
        
        # General question patterns (85% confidence)
        self.question_keywords = [
            'what', 'how', 'when', 'why', 'where', 'tell me', 'explain',
            'can you', 'could you', 'would you'
        ]
        
        logger.info("✅ HybridIntentClassifier initialized with local-first + GPT-4 fallback")
    
    def classify(
        self,
        user_message: str,
        current_filters: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[UserIntent, Dict[str, Any]]:
        """
        Classify user message using LOCAL-FIRST approach with GPT-4 fallback.
        
        Process:
        1. Check cache (instant hit for common messages)
        2. Try local pattern matching (95%+ confidence)
        3. If confidence < 70%, fallback to GPT-4
        4. Cache result for future
        
        DEBUG: Log current_filters at entry point
        
        Args:
            user_message: User's input message
            current_filters: Current active filters from state
            context: Additional context (last_search_count, etc.)
            
        Returns:
            Tuple of (intent, metadata)
            - intent: UserIntent enum value
            - metadata: Dict with confidence, reason, requires_confirmation, suggested_action
        """
        # DEBUG: Log filters at entry point
        logger.info(f"🔍 [CLASSIFY] current_filters={current_filters}, context={context}")
        
        # STEP 1: Check cache first
        cached_result = self.cache.get(user_message, current_filters)
        if cached_result:
            intent, metadata = cached_result
            metadata = metadata.copy()  # Don't modify cached dict
            metadata['cache_hit'] = True
            logger.debug(f"💾 [CACHE HIT] Intent: {intent.value} (hit rate: {self.cache.get_hit_rate():.2%})")
            return intent, metadata
        
        # STEP 2: Try local classification
        intent, metadata = self._local_classify(user_message, current_filters, context)
        
        # STEP 3: Check confidence - fallback to GPT-4 if too low
        confidence_value = self._confidence_to_float(metadata.get('confidence', 0.5))
        
        if confidence_value < self.GPT_FALLBACK_THRESHOLD and self.openai_client:
            logger.info(f"⚠️ Low confidence ({confidence_value:.2f}) - falling back to GPT-4")
            gpt_result = self._gpt_fallback_classify(user_message, current_filters, context)
            if gpt_result:
                intent, metadata = gpt_result
                metadata['used_gpt_fallback'] = True
        
        # STEP 4: Cache result
        metadata['cache_hit'] = False
        self.cache.set(user_message, current_filters, (intent, metadata))
        
        return intent, metadata
    
    def _local_classify(
        self,
        user_message: str,
        current_filters: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Tuple[UserIntent, Dict[str, Any]]:
        """
        LOCAL-FIRST classification using pattern matching.
        Returns intent with confidence score.
        """
        user_message_lower = user_message.lower().strip()
        
        # Initialize metadata
        metadata = {
            "reason": "",
            "confidence": 0.5,  # Start with low confidence
            "requires_confirmation": False,
            "suggested_action": ""
        }
        
        # 1. CONFIRMATION detection (99% confidence)
        if self.detect_confirmation_intent(user_message_lower):
            metadata["reason"] = "Simple yes/no/keep confirmation"
            metadata["confidence"] = 0.99
            logger.info(f"✅ [LOCAL] CONFIRMATION detected: '{user_message[:50]}...'")
            return UserIntent.CONFIRMATION, metadata
        
        # 2. OFF-TOPIC detection (95% confidence)
        if self._detect_off_topic(user_message_lower):
            metadata["reason"] = "Message contains non-real-estate topics"
            metadata["confidence"] = 0.95
            metadata["suggested_action"] = "Redirect to property assistance"
            logger.info(f"🚫 [LOCAL] OFF_TOPIC detected: '{user_message[:50]}...'")
            return UserIntent.OFF_TOPIC, metadata
        
        # 3. VALUATION detection (98% confidence)
        if self._detect_valuation(user_message_lower):
            metadata["reason"] = "Property valuation request"
            metadata["confidence"] = 0.98
            metadata["suggested_action"] = "Process valuation"
            logger.info(f"💰 [LOCAL] VALUATION detected: '{user_message[:50]}...'")
            return UserIntent.VALUATION, metadata
        
        # 3B. GENERAL MARKET/INVESTMENT QUESTION detection (90% confidence)
        # WHY: "Is Toronto a good place to invest?" should be general question, NOT property search
        # Pattern: Question words + investment/market terms (regardless of location mention)
        market_investment_patterns = [
            r'\bgood\s+(place|area|time|city)\s+to\s+invest',
            r'\binvest(ing|ment)?\s+(in|opportunity)',
            r'\bmarket\s+(trend|condition|outlook)',
            r'\breal estate\s+market',
            r'\bshould\s+i\s+(buy|invest)',
            r'\bis\s+\w+\s+a\s+good\s+(market|investment|place)',
            r'\bhow\s+is\s+the\s+market',
        ]
        has_market_question = any(re.search(pattern, user_message_lower) for pattern in market_investment_patterns)
        if has_market_question and '?' in user_message:
            metadata["reason"] = "General market/investment question (not property search)"
            metadata["confidence"] = 0.90
            metadata["suggested_action"] = "Provide market insights"
            logger.info(f"📊 [LOCAL] GENERAL_QUESTION (market) detected: '{user_message[:50]}...'")
            return UserIntent.GENERAL_QUESTION, metadata
        
        # 4. PROPERTY SEARCH detection (96% confidence)
        criteria = self.extract_property_criteria(user_message_lower)
        has_location = any(word in user_message_lower for word in ['in ', 'near ', 'at ', 'toronto', 'mississauga', 'ottawa', 'vancouver'])
        
        logger.info(f"🔍 [LOCAL CHECK] Property search: criteria={criteria}, has_location={has_location}, message='{user_message_lower[:60]}'")
        
        if criteria and (criteria.get('bedrooms') or criteria.get('price') or criteria.get('property_type')):
            if has_location:
                metadata["reason"] = f"Explicit search with criteria: {list(criteria.keys())}"
                metadata["confidence"] = 0.96
                metadata["suggested_action"] = "Execute property search"
                logger.info(f"🔍 [LOCAL] PROPERTY_SEARCH detected: '{user_message[:50]}...'")
                return UserIntent.PROPERTY_SEARCH, metadata
            elif current_filters and any(current_filters.values()):
                # ✅ NEW: Incremental filter update - user has context and adding more criteria
                metadata["reason"] = f"Adding criteria to existing search: {list(criteria.keys())}"
                metadata["confidence"] = 0.93
                metadata["suggested_action"] = "Update filters with new criteria"
                logger.info(f"🔧 [LOCAL] PROPERTY_REFINEMENT detected (incremental): '{user_message[:50]}...'")
                return UserIntent.PROPERTY_REFINEMENT, metadata
            else:
                logger.info(f"⚠️  [LOCAL] Has criteria but no location detected")
        else:
            logger.info(f"⚠️  [LOCAL] No sufficient criteria detected")
        
        # 5. REFINEMENT detection (92% confidence)
        if current_filters and any(current_filters.values()):
            refinement_kw = self.detect_refinement_keywords(user_message_lower)
            if refinement_kw:
                metadata["reason"] = f"Refinement with keywords: {refinement_kw}"
                metadata["confidence"] = 0.92
                metadata["suggested_action"] = "Update existing filters"
                logger.info(f"🔧 [LOCAL] PROPERTY_REFINEMENT detected: '{user_message[:50]}...'")
                return UserIntent.PROPERTY_REFINEMENT, metadata
        
        # 🔧 5B. LISTING TYPE REFINEMENT guard (95% confidence)
        # WHY: "show me only rentals" must be property_refinement, not general_question
        # Pattern: User has active search + mentions rent/rental/lease
        has_previous_results = context and context.get('has_previous_results', False)
        conversation_stage_viewing = context and context.get('conversation_stage') == 'viewing'
        
        listing_type_patterns = [
            r'\b(only|just|show)\s+(rentals?|for\s+rent|leases?)\b',
            r'\b(rentals?|for\s+rent)\s+(only|instead)\b',
            r'\b(change\s+to|switch\s+to)\s+(rentals?|for\s+rent|sales?)\b',
            r'\brental\s+properties\b',
            r'\bfor\s+rent\b',
            r'\bfor\s+sale\b',
        ]
        
        matches_listing_type = any(re.search(pattern, user_message_lower) for pattern in listing_type_patterns)
        
        if matches_listing_type and (has_previous_results or (current_filters and any(current_filters.values()))):
            metadata["reason"] = "Listing type refinement (rent/sale)"
            metadata["confidence"] = 0.95
            metadata["suggested_action"] = "Update listing_type filter"
            logger.info(f"🏠 [LOCAL] LISTING_TYPE_REFINEMENT detected: '{user_message[:50]}...'")
            return UserIntent.PROPERTY_REFINEMENT, metadata
        
        # 5C. AMENITY REFINEMENT detection (93% confidence)
        # WHY: "do any have a balcony?" or "with pool and gym" should be refinement, not general question
        amenity_keywords = [
            'pool', 'pools', 'balcony', 'balconies', 'parking', 'garage', 'gym', 
            'fitness', 'locker', 'storage', 'terrace', 'patio', 'garden', 
            'laundry', 'washer', 'dryer', 'dishwasher', 'fireplace', 'view', 
            'views', 'waterfront', 'rooftop', 'concierge', 'doorman', 'elevator',
            'security', 'amenities', 'amenity'
        ]
        
        has_amenity = any(kw in user_message_lower for kw in amenity_keywords)
        amenity_question_patterns = [
            r'\b(do any|does any|any of them|which ones?)\s+(have|has|with|include)\b',
            r'\bwith\s+(pool|balcony|parking|gym|locker|view)',
            r'\bhave\s+(a\s+)?(pool|balcony|parking|gym|locker|view)',
            r'\b(pool|balcony|parking|gym)\s+(and|or)\s+(pool|balcony|parking|gym)\b',
        ]
        matches_amenity_question = any(re.search(pattern, user_message_lower) for pattern in amenity_question_patterns)
        
        if has_amenity and (has_previous_results or (current_filters and any(current_filters.values()))):
            metadata["reason"] = f"Amenity refinement query"
            metadata["confidence"] = 0.93
            metadata["suggested_action"] = "Add amenity filter to search"
            logger.info(f"🏊 [LOCAL] AMENITY_REFINEMENT detected: '{user_message[:50]}...'")
            return UserIntent.PROPERTY_REFINEMENT, metadata
        
        # 5D. FILTER REMOVAL/BUDGET REMOVAL detection (94% confidence)
        # WHY: "show me any price range", "remove budget", "no budget constraints" should clear filters
        # NOT be treated as general questions about price
        filter_removal_patterns = [
            r'\b(show me )?any price( range)?',
            r'\b(remove|clear|no|without) (the )?(budget|price)( filter| limit| constraints?)?',
            r'\bdon\'?t have (any )?budget',
            r'\bi\'?m flexible on (price|budget)',
            r'\b(any|no) budget (constraints?|limit)',
            r'\bprice (doesn\'?t|does not) matter',
            r'\b(any|all) (price|budget) (works?|is fine)',
        ]
        
        matches_filter_removal = any(re.search(pattern, user_message_lower) for pattern in filter_removal_patterns)
        
        if matches_filter_removal and current_filters and any(current_filters.values()):
            metadata["reason"] = "Filter removal request (budget/price)"
            metadata["confidence"] = 0.94
            metadata["suggested_action"] = "Clear budget/price filter and re-search"
            logger.info(f"💰 [LOCAL] FILTER_REMOVAL detected: '{user_message[:50]}...'")
            return UserIntent.PROPERTY_REFINEMENT, metadata
        
        # 6. GENERAL QUESTION detection (85% confidence)
        has_question = any(kw in user_message_lower for kw in self.question_keywords)
        has_question_mark = '?' in user_message
        no_numbers = not any(char.isdigit() for char in user_message)
        
        # Skip general question if this is an amenity query
        if (has_question or has_question_mark) and no_numbers and not has_location and not has_amenity:
            metadata["reason"] = "Question without specific criteria"
            metadata["confidence"] = 0.85
            metadata["suggested_action"] = "Provide general information"
            logger.info(f"❓ [LOCAL] GENERAL_QUESTION detected: '{user_message[:50]}...'")
            return UserIntent.GENERAL_QUESTION, metadata
        
        # 7. Default: LOW CONFIDENCE (triggers GPT-4 fallback)
        metadata["reason"] = "No clear pattern match - needs GPT-4"
        metadata["confidence"] = 0.60
        metadata["suggested_action"] = "Use GPT-4 for classification"
        logger.info(f"🤷 [LOCAL] Low confidence - will fallback to GPT-4: '{user_message[:50]}...'")
        return UserIntent.GENERAL_CHAT, metadata
    
    def detect_confirmation_intent(self, message: str) -> bool:
        """
        Detect yes/no/keep confirmations (99% confidence).
        
        Uses shared confirmation detection from services.confirmation_tokens
        for consistency across the codebase.
        
        Examples:
        - "yes", "yeah", "yep", "sure", "ok", "y", "k"
        - "no", "nope", "nah", "n"
        - "keep", "sounds good", "that works"
        """
        # Use shared detection function for consistency
        if is_confirmation_response(message):
            return True
        # Also check regex patterns for edge cases
        return detect_confirmation_with_regex(message)
    
    def detect_refinement_keywords(self, message: str) -> List[str]:
        """
        Detect refinement keywords in message.
        Returns list of found keywords.
        """
        found = []
        for keyword in self.refinement_keywords:
            if keyword in message:
                found.append(keyword)
        return found
    
    def extract_property_criteria(self, message: str) -> Dict[str, Any]:
        """
        Extract property criteria from message.
        
        Returns dict with:
        - bedrooms: int
        - bathrooms: int
        - price: dict (min, max)
        - property_type: str
        """
        criteria = {}
        
        # Extract bedrooms
        bed_match = re.search(r'(\d+)\s+bed(?:room)?s?', message, re.IGNORECASE)
        if bed_match:
            criteria['bedrooms'] = int(bed_match.group(1))
        
        # Extract bathrooms
        bath_match = re.search(r'(\d+)\s+bath(?:room)?s?', message, re.IGNORECASE)
        if bath_match:
            criteria['bathrooms'] = int(bath_match.group(1))
        
        # Extract price
        price_match = re.search(r'under\s+\$?(\d+)k?', message, re.IGNORECASE)
        if price_match:
            price_val = int(price_match.group(1))
            if price_val < 1000:  # Assume it's in thousands
                price_val *= 1000
            criteria['price'] = {'max': price_val}
        
        price_from_match = re.search(r'from\s+\$?(\d+)k?', message, re.IGNORECASE)
        if price_from_match:
            price_val = int(price_from_match.group(1))
            if price_val < 1000:
                price_val *= 1000
            criteria['price'] = criteria.get('price', {})
            criteria['price']['min'] = price_val
        
        # Extract property type (check for exact words, not substrings)
        for prop_type in ['townhouse', 'condo', 'house', 'apartment']:
            # Use word boundary to avoid matching 'house' in 'townhouse'
            if re.search(r'\b' + prop_type + r'\b', message, re.IGNORECASE):
                criteria['property_type'] = prop_type
                break
        
        return criteria
    
    def _detect_off_topic(self, message: str) -> bool:
        """Detect off-topic messages (non-real-estate)."""
        # Check for off-topic keywords
        for keyword in self.off_topic_keywords:
            if keyword in message:
                # Make sure it's not combined with property/neighborhood/real estate terms
                property_terms = ['property', 'properties', 'house', 'houses', 'condo', 'condos', 
                                 'apartment', 'apartments', 'real estate', 'mls', 'listing', 'listings',
                                 'home', 'homes', 'rent', 'buy', 'sale', 'near', 'show me', 'find',
                                 'neighborhood', 'neighbourhood', 'area', 'location', 'district',
                                 'families', 'family', 'schools', 'school', 'kids', 'children',
                                 'community', 'amenities', 'safe', 'safety', 'walkable']
                has_property_term = any(term in message for term in property_terms)
                logger.debug(f"🔍 Off-topic check: keyword='{keyword}', has_property_term={has_property_term}")
                if not has_property_term:
                    return True
        return False
    
    def _detect_valuation(self, message: str) -> bool:
        """Detect valuation requests."""
        # Check for valuation keywords
        has_keyword = any(kw in message for kw in self.valuation_keywords)
        if has_keyword:
            return True
        
        # Check for valuation patterns
        for pattern in self.valuation_patterns:
            if re.search(pattern, message, re.IGNORECASE):
                return True
        
        return False
    
    def _confidence_to_float(self, confidence: any) -> float:
        """Convert confidence string/float to float value."""
        if isinstance(confidence, float):
            return confidence
        elif isinstance(confidence, str):
            mapping = {
                'high': 0.95,
                'medium': 0.75,
                'low': 0.50
            }
            return mapping.get(confidence.lower(), 0.50)
        return 0.50
    
    def _gpt_fallback_classify(
        self,
        user_message: str,
        current_filters: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> Optional[Tuple[UserIntent, Dict[str, Any]]]:
        """
        Fallback to GPT-4 for ambiguous cases.
        Only called when local confidence < 70%.
        """
        if not self.openai_client:
            return None
        
        try:
            # Create minimal system prompt
            system_prompt = """You are an intent classifier for a GLOBAL real estate chatbot that helps users search for BOTH RESIDENTIAL AND COMMERCIAL properties ANYWHERE in the world.

CRITICAL: Property searches in ANY city or country should ALWAYS be classified as 'property_search', NOT 'off_topic'.

IMPORTANT: Commercial property searches (offices, retail, restaurants, bakeries, warehouses, etc.) are VALID property searches!

Classify the user's message into ONE of these intents:

property_search: Search request for residential OR commercial properties
- RESIDENTIAL: "condos in Vancouver", "houses in Calgary under 800k", "2 bedroom apartments"
- COMMERCIAL: "bakeries in Toronto", "office space downtown", "retail stores", "restaurants for sale", "warehouse in Montreal"
- MUST classify as property_search if message mentions: location + (property type OR business type OR bedrooms OR price)

property_refinement: Modifying existing search filters (needs current filters in context)
- Examples: "with a pool", "under 500k", "make it 3 bedrooms"

confirmation: Yes/No/Keep/Change responses to a question
- Examples: "yes", "no", "sure", "okay", "keep it"

general_question: Questions about neighborhoods, market trends, or property features  
- Examples: "what's the market like in Toronto?", "tell me about Mississauga", "are there good schools?"

valuation: Property value estimation requests
- Examples: "what's this property worth?", "estimate value of MLS#123", "how much is my home worth?"

general_chat: Greetings, help requests, thank you messages
- Examples: "hello", "thanks", "help me", "what can you do?"

off_topic: ONLY for messages completely unrelated to real estate (weather, sports, food recipes, politics, etc.)
- Examples: "what's the weather?", "who won the game?", "how to make pizza?"
- DO NOT classify business/commercial property searches as off_topic!

FORMAT: intent_name|confidence|reason

EXAMPLES:
"Show me 2 bedroom condos in Vancouver under 900k" → property_search|0.98|Specifies location (Vancouver), bedrooms (2), property type (condos), and price (under 900k)
"Find houses in Calgary" → property_search|0.92|Specifies location (Calgary) and property type (houses)
"Show me bakeries in Toronto" → property_search|0.95|Searching for commercial properties (bakeries) in Toronto
"Office space downtown" → property_search|0.90|Searching for commercial office properties
"Restaurant for sale in Montreal" → property_search|0.95|Searching for commercial property (restaurant)
"What's the weather like?" → off_topic|0.99|About weather, not real estate"""
            
            # Build user prompt
            filter_context = ""
            if current_filters and any(current_filters.values()):
                filter_context = f"\n\nCurrent filters: {json.dumps(current_filters)}"
            
            user_prompt = f"Message: \"{user_message}\"{filter_context}"
            
            # Call GPT-4
            logger.info("🤖 Calling GPT-4 for intent classification...")
            logger.debug(f"📝 System prompt length: {len(system_prompt)} chars")
            logger.debug(f"📝 User prompt: {user_prompt}")
            logger.info(f"📨 Sending to GPT-4: System prompt starts with: '{system_prompt[:100]}...'")
            response = self.openai_client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_tokens=100
            )
            
            # Parse response
            result = response.choices[0].message.content.strip()
            logger.info(f"📤 GPT-4 raw response: '{result}'")
            parts = result.split('|')
            
            if len(parts) >= 3:
                intent_str, confidence_str, reason = parts[0].strip(), parts[1].strip(), parts[2].strip()
                
                # Map to UserIntent
                intent_mapping = {
                    'property_search': UserIntent.PROPERTY_SEARCH,
                    'property_refinement': UserIntent.PROPERTY_REFINEMENT,
                    'confirmation': UserIntent.CONFIRMATION,
                    'off_topic': UserIntent.OFF_TOPIC,
                    'general_question': UserIntent.GENERAL_QUESTION,
                    'valuation': UserIntent.VALUATION,
                    'general_chat': UserIntent.GENERAL_CHAT,
                }
                
                intent = intent_mapping.get(intent_str.lower(), UserIntent.GENERAL_CHAT)
                confidence = float(confidence_str)
                
                metadata = {
                    'reason': reason,
                    'confidence': confidence,
                    'requires_confirmation': False,
                    'suggested_action': '',
                    'gpt_fallback': True
                }
                
                logger.info(f"✅ [GPT-4] Classified as {intent.value} with confidence {confidence:.2f}")
                return intent, metadata
            
        except Exception as e:
            logger.error(f"❌ GPT-4 fallback failed: {e}")
        
        return None
    
    def get_cache_hit_rate(self) -> float:
        """Get cache hit rate for monitoring."""
        return self.cache.get_hit_rate()


# Global instance
intent_classifier = HybridIntentClassifier()


if __name__ == "__main__":
    # Test cases
    print("🧪 Testing Hybrid Intent Classifier\n")
    
    classifier = HybridIntentClassifier()
    
    test_cases = [
        # Confirmation (99% confidence)
        ("yes", None, "Confirmation"),
        ("nope", None, "Confirmation"),
        ("keep", None, "Confirmation"),
        
        # Off-topic (95% confidence)
        ("paneer chilli", None, "Off-topic - food"),
        ("what's the weather like?", None, "Off-topic - weather"),
        ("let's watch a movie", None, "Off-topic - entertainment"),
        
        # Valuation (98% confidence)
        ("what is MLS C123456 worth?", None, "Valuation"),
        ("estimate value of 123 Main St", None, "Valuation"),
        
        # Property search (96% confidence)
        ("show me 2 bedroom condos in Toronto under 600k", None, "Property search"),
        ("find houses in Mississauga", None, "Property search"),
        ("3 bed 2 bath in Ottawa", None, "Property search"),
        
        # Refinement (92% confidence)
        ("with a pool", {"location": "Toronto", "bedrooms": 2}, "Refinement"),
        ("under 500k", {"location": "Toronto"}, "Refinement"),
        ("more expensive", {"location": "Toronto", "bedrooms": 3}, "Refinement"),
        
        # General question (85% confidence)
        ("what areas have the best schools?", None, "General question"),
        ("how does the buying process work?", None, "General question"),
        
        # Low confidence (triggers GPT-4 if available)
        ("show me something nice", None, "Ambiguous"),
    ]
    
    for message, filters, expected in test_cases:
        intent, metadata = classifier.classify(message, filters)
        print(f"Message: '{message}'")
        print(f"  Expected: {expected}")
        print(f"  Intent: {intent.value}")
        print(f"  Confidence: {metadata['confidence']}")
        print(f"  Reason: {metadata['reason']}")
        if metadata.get('cache_hit'):
            print(f"  ✅ Cache hit!")
        if metadata.get('used_gpt_fallback'):
            print(f"  🤖 Used GPT-4 fallback")
        print()
    
    # Show cache stats
    print(f"📊 Cache hit rate: {classifier.get_cache_hit_rate():.2%}")
