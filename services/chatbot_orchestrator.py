"""
chatbot_orchestrator.py
Orchestrator routes messages through GPT-4 interpreter + summarizer pipeline.

IMPROVED Pipeline:
1. Add user message to state history
2. Parse with local NLP (fast heuristics)
3. Call GPT-4 to interpret intent & structured filters (primary intelligence)
4. Update ConversationState with interpreted filters
5. Call MLS with final filters
6. Call GPT-4 to create user-facing summary + follow-up suggestions

This fixes:
- Rental/sale mixing (GPT-4 interprets listing_type correctly)
- Contextual references ("how about those with a pool")
- Amenity detection (GPT-4 understands "swimming pool" = "pool")
- Crisp ChatGPT-style responses with suggestions
"""

import os
import logging
import json
import re
from typing import Dict, List, Optional, Any, Union, Tuple
from datetime import datetime

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(__file__).parent.parent / 'config' / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

from openai import OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Import existing services
from services.conversation_state import ConversationState, conversation_state_manager
from services.nlp_parser import nlp_parser
from services.enhanced_mls_service import enhanced_mls_service
from services.location_extractor import location_extractor, LocationState

# NEW: Import centralized confirmation tokens (single source of truth)
from services.confirmation_tokens import (
    CONFIRMATION_WORDS, ALL_CONFIRMATION_TOKENS,
    is_confirmation_word, is_positive_response, is_negative_response
)

# NEW: Import HybridIntentClassifier as the SINGLE source of truth for intent classification
# This provides LOCAL-FIRST classification (95%+ messages in < 5ms) with GPT-4 fallback
from services.hybrid_intent_classifier import intent_classifier, UserIntent

# NEW: Import UnifiedConversationState and UnifiedStateManager for centralized state management
from services.unified_conversation_state import (
    UnifiedConversationState,
    UnifiedStateManager,
    UnifiedConversationStateManager,  # Backwards compatibility alias
    LocationState as UnifiedLocationState,
    ActiveFilters,
    ConversationStage,
    ListingType,
)

# NEW: Import location validator for hybrid LLM + deterministic validation
from services.location_validator import get_location_validator

# NEW: Import address and street search services for priority routing
from services.address_intent_detector import get_address_intent_detector, AddressIntentType
from services.address_key_normalizer import get_address_key_normalizer
from services.repliers_filter_mapper import buildRepliersAddressSearchParams

# NEW: Import confirmation manager for robust UUID-based confirmation tracking
from services.confirmation_manager import (
    ConfirmationManager,
    get_confirmation_manager,
    ConfirmationType,
    ConfirmationStatus,
    ConfirmationResult
)

# NEW: Import AtomicTransactionManager for safe state updates with automatic rollback
from services.atomic_transaction_manager import AtomicTransactionManager, TransactionType

# NEW: Import Residential Search Integration for comprehensive residential property searches
# This provides extended filter support (90+ filters) for residential properties
from services.residential_chatbot_integration import (
    search_residential_properties,
    get_extended_gpt_prompt,
    get_residential_integration,
    RESIDENTIAL_FILTERS_EXTENSION,
)

# NEW: Import Property Type Interpreter for residential/commercial routing
# Moved to app folder as requested
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'app'))
from property_type_interpreter import (
    get_property_type_interpreter,
    classify_property_type,
    PropertyType
)

# NEW: Import Commercial Property Service for commercial property searches
from services.commercial_property_service import (
    get_commercial_service,
    search_commercial_properties
)

# NEW: Import Pre-Construction Property Service
from services.preconstruction_service import (
    detect_preconstruction_intent,
    search_preconstruction_properties
)

# NEW: Import Condo Property Service for condo property searches
from services.condo_property_service import (
    search_condo_properties
)

# NEW: Import Scalability Manager for high-performance concurrent request handling
from services.scalability_manager import (
    get_scalability_manager,
    RequestContext,
    with_request_context,
    with_performance_tracking,
    with_session_lock
)

logger = logging.getLogger(__name__)

# =============================================================================
# GLOBAL STATE MANAGER INITIALIZATION
# =============================================================================

# Initialize the global UnifiedStateManager with Redis URL from environment
# This is the SINGLE source of truth for all conversation state
_redis_url = os.getenv("REDIS_URL")
state_manager = UnifiedStateManager(redis_url=_redis_url)

# Initialize global ScalabilityManager for high-performance concurrent operations
# Provides: request context isolation, distributed locking, caching, performance monitoring
scalability_manager = get_scalability_manager(
    redis_url=_redis_url,
    cache_size=10000  # Cache up to 10,000 sessions in memory
)

# Log which backend is being used on startup
try:
    import structlog
    _startup_log = structlog.get_logger(__name__)
    _startup_log.info(
        "State manager initialized",
        backend=state_manager.backend,
        redis_available=state_manager.is_redis_available,
        redis_url_configured=bool(_redis_url),
    )
except ImportError:
    logger.info(
        f"State manager initialized | backend={state_manager.backend} | "
        f"redis_available={state_manager.is_redis_available} | "
        f"redis_url_configured={bool(_redis_url)}"
    )

# Backwards compatibility: keep unified_state_manager as alias
unified_state_manager = state_manager

logger = logging.getLogger(__name__)

# 🔧 CONFIRMATION WORDS - Now imported from services.confirmation_tokens
# (CONFIRMATION_WORDS and is_confirmation_word are imported at top of file)

# Lazy import helper to avoid circular dependency
def get_standardize_property_data():
    """Lazy import to avoid circular dependency with voice_assistant_clean."""
    try:
        import sys
        from pathlib import Path
        sys.path.insert(0, str(Path(__file__).parent.parent))
        from app.voice_assistant_clean import standardize_property_data
        return standardize_property_data
    except ImportError:
        # Fallback: return identity function if import fails
        return lambda x: x
logger.setLevel(logging.INFO)

# ------------- GPT-4 System Prompts -------------

SYSTEM_PROMPT_INTERPRETER = """You are a precise real-estate assistant interpreter for Canadian RESIDENTIAL AND COMMERCIAL properties (Toronto/GTA/Vancouver/Canada).

Input: user's message + current conversation filters (location, bedrooms, property_type, listing_type, amenities, etc.) + pending_clarification (if any) + recent_user_messages (conversation history)

CRITICAL - Conversation Context:
When "recent_user_messages" is provided, you MUST consider the context from previous messages:
1. If a location (city, neighborhood, street) was mentioned in a recent message, remember it
2. When user asks a follow-up question without mentioning location, use the location from recent context
3. Example conversation:
   - User (previous): "show me office places in brampton"
   - User (current): "I need a small office for my startup"
   - ACTION: Extract location as "Brampton" from recent context (the user is still talking about Brampton)

IMPORTANT - Property Type Classification:
This assistant handles BOTH:
1. RESIDENTIAL properties: houses, condos, apartments (may have bedrooms, bathrooms)
2. COMMERCIAL properties: offices, retail, restaurants, bakeries, warehouses (business types)

When user mentions a BUSINESS TYPE (bakery, restaurant, office, retail store, warehouse, etc.):
- intent: "search"
- property_type: "commercial" 
- business_type: Extract the business type in SINGULAR form (e.g., "bakeries" → "Bakery", "spas" → "Spa")
- DO NOT extract bedrooms/bathrooms for commercial properties

CRITICAL - Business Type Extraction Rules:
1. ALWAYS extract business_type when user mentions ANY business/commercial activity
2. Convert PLURAL to SINGULAR: "bakeries" → "Bakery", "restaurants" → "Restaurant", "gyms" → "Gym"
3. Recognize business type keywords: bakery, restaurant, cafe, bar, office, retail, store, shop, warehouse, spa, salon, gym, hotel, clinic, gas station, etc.
4. If unsure, extract the business word as-is (e.g., "pizza place" → "Restaurant", "coffee shop" → "Cafe")
5. DO NOT leave business_type as null if user mentions ANY business activity

CRITICAL - Typo Correction Rules (IMPORTANT):
- PRESERVE the user's exact search term whenever possible
- Only fix OBVIOUS, COMMON typos: "flouriest" → "Florist", "restarant" → "Restaurant", "ofice" → "Office"
- DO NOT make wild guesses or semantic conversions (e.g., "flouriest" should be "Florist" NOT "Bakery")
- If you're unsure, extract the term AS-IS and let the search engine handle fuzzy matching
- Common typos to fix:
  * "flouriest" → "Florist" (flower shop)
  * "restarant" → "Restaurant"
  * "ofice" → "Office"
  * "coffe shop" → "Cafe"
  * "saloon" → "Salon"
- DO NOT convert between different business types (Florist ≠ Bakery, Cafe ≠ Restaurant, etc.)

Examples of Commercial Searches:
- "show me bakeries in toronto" → intent: "search", property_type: "commercial", business_type: "Bakery", location: "Toronto"
- "bakeries near yonge and bloor" → intent: "search", property_type: "commercial", business_type: "Bakery", location: "Toronto"
- "office space downtown" → intent: "search", property_type: "commercial", business_type: "Office", location: extract from context
- "retail stores for sale" → intent: "search", property_type: "commercial", business_type: "Retail", listing_type: "sale"
- "restaurants in Montreal" → intent: "search", property_type: "commercial", business_type: "Restaurant", location: "Montreal"
- "warehouse in Toronto" → intent: "search", property_type: "commercial", business_type: "Warehouse", location: "Toronto"
- "spa properties in ottawa" → intent: "search", property_type: "commercial", business_type: "Spa", location: "Ottawa"
- "spas in downtown" → intent: "search", property_type: "commercial", business_type: "Spa", location: extract from context
- "salon for sale" → intent: "search", property_type: "commercial", business_type: "Salon", listing_type: "sale"
- "gym space in vancouver" → intent: "search", property_type: "commercial", business_type: "Gym", location: "Vancouver"
- "gyms near me" → intent: "search", property_type: "commercial", business_type: "Gym", location: extract from context
- "pizza place in toronto" → intent: "search", property_type: "commercial", business_type: "Restaurant", location: "Toronto"
- "coffee shops downtown" → intent: "search", property_type: "commercial", business_type: "Cafe", location: extract from context

IMPORTANT - Intent Classification System:
This system now has an INTENT CLASSIFIER that pre-screens messages. Your role is to extract FILTERS ONLY for messages that:
- Have explicit search criteria (location, bedrooms, price, business_type, etc.)
- Are refinements of existing searches
- Are property-related queries

DO NOT try to force search intent on:
- Off-topic messages (food recipes, sports, weather, etc.) - these are blocked before reaching you
- Vague requests without context ("show me more", "other properties") - these require confirmation
- General greetings or questions - these are handled separately

CRITICAL - Street Address Detection:
When user provides a STREET ADDRESS with a number (e.g., "123 King Street West", "50 Yorkville Avenue", "825 Church Street"):
1. This is ALWAYS a property search intent - DO NOT ask clarifying questions
2. Treat it as intent: "search" 
3. Location will be extracted by location_extractor (streetNumber, streetName)
4. If city not mentioned, assume Toronto for GTA addresses

Examples:
- "123 King Street West" → intent: "search" (location extracted separately)
- "50 Yorkville Avenue Unit 2503" → intent: "search" (unit numbers are ignored in search)
- "Show me properties at 825 Church" → intent: "search"
- "What's at 100 Queen Street" → intent: "search"

IMPORTANT - Clarifying Questions:
- If "pending_clarification" is present, the user's message is likely an ANSWER to that question, NOT a new intent.
- DO NOT ask clarifying questions for obvious street addresses (number + street name)
- DO NOT ask clarifying questions when user provides LOCATION + ANY PROPERTY CRITERION (property type, bedrooms, price, etc.)
  Examples: "condos in M5B" → SEARCH IMMEDIATELY, don't ask clarification
            "properties in M5V" → SEARCH IMMEDIATELY, don't ask clarification
            "3 bedroom homes in Toronto" → SEARCH IMMEDIATELY, don't ask clarification
- DO NOT ask clarifying questions for COMMERCIAL queries with business type + location
  Examples: "I want to open a QSR restaurant near University of Toronto, budget $40-$55/sqft, min 1000 sqft" → SEARCH IMMEDIATELY
            "bakery in Mississauga under $50/sqft" → SEARCH IMMEDIATELY
            "office space downtown Toronto" → SEARCH IMMEDIATELY
- ONLY ask clarifying questions when REQUIRED data is MISSING (e.g., no location at all AND no landmarks)
- Examples:
  - Previous: "Are you looking for specific schools or general information?" User: "yes" → intent: "refine" (user confirming)
  - Previous: "Are you looking for specific schools?" User: "general information" → intent: "general_question"
  - User: "yes" with no pending question → intent: depends on context (could be confirming a search)

Output: JSON ONLY with keys:
- intent: one of ["search","refine","details","valuation","compare","general_question","reset","special_query"]
- filters: {
    location: string or null (Toronto, Mississauga, Milton, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, Ajax, Whitby, Oshawa, Hamilton, Kitchener, Waterloo, Guelph, Cambridge, Barrie, London, Ottawa, Kingston, Vancouver, Calgary, Edmonton, Montreal, etc. - IMPORTANT: If user says "GTA", use "Toronto" as the default city, or ask which GTA city they prefer),
    property_type: string or null (FOR RESIDENTIAL: condo|detached|townhouse|semi-detached|house|duplex|triplex|multiplex OR FOR COMMERCIAL: commercial),
    business_type: string or null (FOR COMMERCIAL ONLY - CRITICAL: Extract business type from user query in SINGULAR form. Convert plurals to singular: "bakeries"→"Bakery", "spas"→"Spa", "gyms"→"Gym", "restaurants"→"Restaurant". Extract ANY business/commercial type: Bakery|Restaurant|Cafe|Bar|Pub|Office|Retail|Store|Shop|Warehouse|Industrial|Spa|Salon|Gym|Fitness|Hotel|Motel|Medical|Clinic|Pharmacy|Gas Station|Car Wash|Laundromat|Convenience Store|Grocery|Supermarket|Manufacturing|Workshop|Studio|Theatre|Cinema|Nightclub|etc. If user says "bakeries", "spas", "gyms", etc., extract as "Bakery", "Spa", "Gym". BE FLEXIBLE and ALWAYS extract business_type when user mentions ANY commercial activity.),
    property_style: string or null (FOR RESIDENTIAL: bungalow|2-storey|3-storey|split-level|raised-bungalow|loft|bachelor),
    bedrooms: number or null (FOR RESIDENTIAL ONLY),
    bathrooms: number or null (FOR RESIDENTIAL ONLY),
    min_price: number or null,
    max_price: number or null,
    min_sqft: number or null (minimum square footage),
    max_sqft: number or null (maximum square footage),
    listing_type: "sale" or "rent" or null (CRITICAL: ONLY set if user explicitly mentions "for sale", "buy", "purchase" OR "rent", "rental", "lease". If user just says "properties" or "condos" without specifying, leave as null to show BOTH sale AND rent),
    amenities: array of strings (pool, gym, parking, balcony, garden, etc.),
    list_date_from: string or null (YYYY-MM-DD format - start of date range),
    list_date_to: string or null (YYYY-MM-DD format - end of date range),
    
    // Extended Residential Filters (set when explicitly mentioned):
    basement_type: string or null (finished|unfinished|walkout|apartment|separate_entrance|partial|none),
    year_built_min: number or null,
    year_built_max: number or null,
    garage_type: string or null (attached|detached|underground|built-in|carport|none),
    garage_spaces: number or null,
    parking_spaces: number or null,
    heating_type: string or null (forced_air|radiant|geo_thermal|heat_pump|baseboard),
    cooling_type: string or null (central_air|none|heat_pump|ductless),
    pool: boolean or null,
    waterfront: boolean or null,
    fireplace: boolean or null,
    maintenance_fee_max: number or null (for condos - monthly fee),
    condo_exposure: string or null (north|south|east|west),
    floor_level_min: number or null,
    floor_level_max: number or null,
    has_balcony: boolean or null,
    has_locker: boolean or null,
    is_new_listing: boolean or null,
    condo_amenities: array of strings or null (gym, concierge, party_room, rooftop, security, etc.)
    
    // Extended Commercial Filters (FOR COMMERCIAL ONLY - set when mentioned):
    intersection: string or null (e.g., "Yonge & Eglinton", "King & Bay", "401 & Kennedy"),
    landmark: string or null (e.g., "Pearson Airport", "University of Toronto", "Square One", "CN Tower"),
    proximity: string or null (e.g., "5 km", "walkable", "near", "close to"),
    postal_code: string or null (e.g., "M5J 2N8", "M5V", "K1A"),
    exclude_streets: array of strings or null (e.g., ["Yonge Street"] if "not on Yonge Street"),
    exclude_areas: array of strings or null (e.g., ["Scarborough"] if "remove Scarborough"),
    business_use: string or null (e.g., "cloud kitchen", "QSR restaurant", "cannabis retail", "daycare", "medical clinic"),
    price_per_sqft_max: number or null (e.g., 45 for "under $45/sqft", 55 for "$40-$55/sqft"),
    ground_floor: boolean or null (true if "ground floor" or "ground-level" mentioned),
    food_use_allowed: boolean or null (true if "food use" mentioned),
    alcohol_allowed: boolean or null (true if "alcohol" mentioned),
    near_transit: boolean or null (true if "near subway", "near TTC", "near transit" mentioned),
    clear_height_min: number or null (warehouse ceiling height in feet, e.g., 28),
    loading_docks: boolean or null (true if "dock loading" or "loading docks" mentioned),
    property_class: string or null ("Class A", "Class B", "Class C" if mentioned),
    parking_included: boolean or null (true if "parking included" mentioned),
    no_lease: boolean or null (true if "not lease", "no lease", "for sale not lease"),
    no_automotive: boolean or null (true if "no automotive use", "no car dealership"),
    high_foot_traffic: boolean or null (true if "high foot traffic", "busy area" mentioned)
  }
- merge_with_previous: boolean (True = merge with existing filters, False = replace all - SET TO FALSE when user mentions a NEW/DIFFERENT city)
- clarifying_question: optional string (if you need clarification, ask user)

CRITICAL COMMERCIAL EXTRACTION EXAMPLES:
1. "I want to open a QSR restaurant near University of Toronto, budget $40-$55/sqft, min 1000 sqft, high foot traffic, alcohol optional"
   → intent: "search", property_type: "commercial", business_type: "Restaurant", business_use: "QSR restaurant", 
     location: "Toronto", landmark: "University of Toronto", price_per_sqft_max: 55, min_sqft: 1000, 
     high_foot_traffic: true, alcohol_allowed: true

2. "Show me commercial properties near Yonge & Eglinton, but not directly on Yonge Street"
   → intent: "search", property_type: "commercial", location: "Toronto", intersection: "Yonge & Eglinton", 
     exclude_streets: ["Yonge Street"]

3. "Anything available around Pearson Airport, within 5 km"
   → intent: "search", landmark: "Pearson Airport", location: "Mississauga", proximity: "5 km"

4. "Office spaces near M5V, walkable to TTC"
   → intent: "search", business_type: "Office", postal_code: "M5V", location: "Toronto", near_transit: true

5. "ground-floor retail Toronto, under $45/sqft, min 1200 sqft, food use, near subway"
   → intent: "search", business_type: "Retail", ground_floor: true, location: "Toronto", 
     price_per_sqft_max: 45, min_sqft: 1200, food_use_allowed: true, near_transit: true

6. "warehouse in Mississauga, clear height above 28 ft, dock loading, close to 401"
   → intent: "search", business_type: "Warehouse", location: "Mississauga", clear_height_min: 28, 
     loading_docks: true, landmark: "Highway 401"

7. "Class A office downtown Toronto, built after 2015, parking included"
   → intent: "search", business_type: "Office", property_class: "Class A", area: "Downtown", 
     location: "Toronto", year_built_min: 2015, parking_included: true

8. "commercial condo for sale in Vaughan, not lease, under 2.5M, no automotive"
   → intent: "search", property_type: "commercial", listing_type: "sale", no_lease: true, 
     location: "Vaughan", max_price: 2500000, no_automotive: true

CRITICAL LISTING_TYPE RULES:
- DO NOT set listing_type to "sale" by default
- ONLY set listing_type if user EXPLICITLY says:
  * "for sale", "buy", "purchase", "buying" → listing_type: "sale"
  * "rent", "rental", "lease", "renting" → listing_type: "rent"
- If user just says "properties", "condos", "homes" WITHOUT specifying sale/rent → listing_type: null
- Examples:
  * "properties in M5V" → listing_type: null (show BOTH sale AND rent)
  * "condos in M5B" → listing_type: null (show BOTH)
  * "properties for sale in M5V" → listing_type: "sale"
  * "rentals in M5V" → listing_type: "rent"

CRITICAL PRICING RULES:
- For RENTALS (listing_type: "rent"): Use monthly prices in CAD (e.g., 3000 = $3,000/month)
- For SALES (listing_type: "sale"): Use total prices in CAD (e.g., 600000 = $600,000 total)
- "under 5k" for rental = max_price: 5000 (monthly)
- "under 600k" for sale = max_price: 600000 (total)

CRITICAL - Broad Search Detection:
When the user says phrases like "any properties", "anything works", "show me what you have", "whatever you have", etc., this signals they want to:
1. CLEAR restrictive filters (bedrooms, bathrooms, price) to see broader results
2. KEEP the location they just specified (e.g., if they said "Show me properties in Mississauga instead", keep Mississauga)
3. DO NOT extract locations from previous messages in conversation history

Examples:
- User: "Show me properties in Mississauga instead" → User: "any properties work for me"
  → intent: "search", location: "Mississauga", bedrooms: null, bathrooms: null, min_price: null, max_price: null, merge_with_previous: false
  
- User: "2 bedroom condos in Toronto" → User: "any properties in Yorkville"
  → intent: "search", location: "Toronto", neighborhood: "Yorkville", bedrooms: null, bathrooms: null, merge_with_previous: false

Standard Examples:
- "Show me rentals under 4k" -> intent: "search", listing_type: "rent", max_price: 4000
- "I want to buy under 600k" -> intent: "search", listing_type: "sale", max_price: 600000
- "properties with 500 sqft" -> intent: "search", min_sqft: 500, max_sqft: 500
- "between 800 and 1200 square feet" -> intent: "search", min_sqft: 800, max_sqft: 1200
- "at least 1000 sqft" -> intent: "search", min_sqft: 1000, max_sqft: null
- "under 900 square feet" -> intent: "search", min_sqft: null, max_sqft: 900
- "How about those with a pool?" -> intent: "refine", amenities: ["pool"], merge_with_previous: true
- "I don't have any budgets" -> intent: "refine", min_price: null, max_price: null, merge_with_previous: true
- "Show me any price range" -> intent: "refine", min_price: null, max_price: null, merge_with_previous: true
- "show me what you have" -> intent: "search", min_sqft: null, max_sqft: null, bedrooms: null, bathrooms: null (clear restrictions)
- "any size" -> intent: "refine", min_sqft: null, max_sqft: null, merge_with_previous: true
- "any properties" -> intent: "search", bedrooms: null, bathrooms: null, min_price: null, max_price: null, min_sqft: null, max_sqft: null (CLEAR ALL RESTRICTIONS)
- "whatever you have" -> intent: "search", bedrooms: null, bathrooms: null, min_price: null, max_price: null, merge_with_previous: false
- "anything works for me" -> intent: "search", bedrooms: null, bathrooms: null, min_price: null, max_price: null, merge_with_previous: false
- "remove square footage filter" -> intent: "refine", min_sqft: null, max_sqft: null, merge_with_previous: true
- "Value of MLS: C12631086" -> intent: "valuation"
- "What is this property worth?" -> intent: "valuation"
- "Property valuation for MLS C123456" -> intent: "valuation"
- "Estimate the value of this home" -> intent: "valuation"
- "properties listed on November 1" -> intent: "search", list_date_from: "2024-11-01", list_date_to: "2024-11-01"
- "listed in the last 3 days" -> intent: "search", list_date_from: "{today - 3 days}", list_date_to: "{today}"
- "show me new listings from last week" -> intent: "search", list_date_from: "{today - 7 days}", list_date_to: "{today}"

CRITICAL - Commercial Follow-up Refinement Queries:
When user refines a commercial search with price/size filters WITHOUT re-stating business type:
1. Set intent: "refine" 
2. Set merge_with_previous: true (to preserve business_type and location from previous search)
3. Extract ONLY the new filter (max_price, min_price, sqft, etc.)
4. DO NOT clear business_type or location

Examples of Commercial Follow-ups:
- Previous search: "restaurants in Mississauga" (business_type: Restaurant, location: Mississauga)
  User now says: "under 300K" or "show me under $300,000"
  → intent: "refine", max_price: 300000, merge_with_previous: true
  (DO NOT extract business_type again - it will be preserved from session)

- Previous search: "spa properties in Toronto" (business_type: Spa, location: Toronto)  
  User now says: "can you show under $500K" or "please show under 500K"
  → intent: "refine", max_price: 500000, merge_with_previous: true

- Previous search: "offices downtown" (business_type: Office)
  User now says: "at least 1000 sqft"
  → intent: "refine", min_sqft: 1000, merge_with_previous: true

- Previous search: "retail in Brampton"
  User now says: "for lease only" 
  → intent: "refine", listing_type: "rent", merge_with_previous: true

CRITICAL - Follow-up Questions:
When the search returns 0 results AND the user has multiple restrictive filters (e.g., 4 beds + 2 baths + specific neighborhood), ask a clarifying question:
- clarifying_question: "I couldn't find any properties matching those exact criteria in [location]. Would you like me to show you properties with different bedroom/bathroom counts, or expand the search to nearby areas?"

When the user changes location significantly (e.g., Toronto → Mississauga) after no results:
- clarifying_question: "Would you like me to search for the same criteria (4 beds, 2 baths, condos for rent) in Mississauga, or would you prefer to see any available properties there?"

CRITICAL - Pending Clarification Response Handling:
If "pending_clarification" is present in the input, the user is responding to that question:
1. ALWAYS set merge_with_previous: true (preserve existing filters)
2. Extract ONLY the information they provided in response
3. DO NOT clear or reset other filters that weren't mentioned
4. DO NOT ask another clarifying question unless absolutely necessary

Examples:
- Bot asked: "Which location would you like me to search in?" → User: "toronto" 
  → intent: "search", location: "Toronto", merge_with_previous: true (preserve bedrooms, price, etc.)
- Bot asked: "What's your budget?" → User: "under 800k"
  → intent: "refine", max_price: 800000, merge_with_previous: true (preserve location, bedrooms, etc.)
- Bot asked: "Any specific requirements?" → User: "yes 3 beds with parking"
  → intent: "refine", bedrooms: 3, amenities: ["parking"], merge_with_previous: true

CRITICAL - Confirmation Flow:
If the user's message is responding to a pending_clarification question:
- Extract their answer and translate it to filters  
- DO NOT ask another clarifying question
- Example: User previously asked "Show me other properties" → Bot: "Would you like to change location or budget?" → User: "yes change location" → intent: "search", extract new location from context

CRITICAL - "Properties Near" vs Special Queries:
When user asks about "properties near [address/location]", this is a PROPERTY SEARCH, NOT a special query.
- "properties near 151 Dan Leckie Way Toronto" -> intent: "search", location: "Toronto" (extract street + city for radius search)
- "condos near King Street" -> intent: "search", location: "Toronto" (street-based search with radius)
- "homes near M5V 4B2" -> intent: "search", location: "Toronto" (postal code + radius search)

CRITICAL - Commercial Property Queries with Business Type:
When user mentions ANY business type or commercial use, this is ALWAYS a PROPERTY SEARCH, NOT a special query.
- "I want to open a QSR restaurant near University of Toronto" -> intent: "search", business_type: "Restaurant", location: "Toronto", landmark: "University of Toronto"
- "bakery in Mississauga" -> intent: "search", business_type: "Bakery", location: "Mississauga"
- "office space downtown Toronto" -> intent: "search", business_type: "Office", location: "Toronto", area: "Downtown"
- "warehouse near Highway 401" -> intent: "search", business_type: "Warehouse", landmark: "Highway 401"
- "retail near Pearson Airport" -> intent: "search", business_type: "Retail", landmark: "Pearson Airport"
- "commercial properties near Yonge & Eglinton" -> intent: "search", property_type: "commercial", intersection: "Yonge & Eglinton", location: "Toronto"

IMPORTANT - Location Extraction Rules:
- Landmarks like "University of Toronto", "Pearson Airport", "Square One", "CN Tower" should be extracted as landmarks
- When landmark is mentioned, ALWAYS infer the city (e.g., University of Toronto = Toronto)
- Intersections like "Yonge & Eglinton", "King & Bay", "401 & Kennedy" should extract as intersection + infer city
- DO NOT ask for clarification when location is clear from landmarks or intersections
- Extract ALL criteria from the query (price, sqft, features) WITHOUT asking clarifying questions

ONLY use "special_query" for NON-PROPERTY information requests:
- "schools near MLS C12633118" -> intent: "special_query", query_type: "schools", mls_number: "C12633118"
- "crime rates in this neighborhood" -> intent: "special_query", query_type: "crime_stats", location: {from_context}
- "walk score for this property" -> intent: "special_query", query_type: "walk_score", mls_number: {from_context}
- "transit options near property" -> intent: "special_query", query_type: "transit"

Output format for special queries:
{
    "intent": "special_query",
    "query_type": "schools|crime_stats|walk_score|transit|neighborhood_info",
    "mls_number": "C12633118" (if applicable),
    "location": "Toronto" (if applicable),
    "clarifying_question": "..." (if more info needed)
}

EXTENDED RESIDENTIAL FILTERS:
You can also extract these additional residential-specific filters when mentioned:

Building Features:
- basement_type: finished|unfinished|walkout|apartment|separate_entrance|partial|none
- construction_type: brick|stone|vinyl|stucco|wood|concrete (exterior material)
- heating_type: forced_air|radiant|geo_thermal|heat_pump|baseboard|electric
- cooling_type: central_air|window_ac|none|heat_pump|ductless
- fireplace: true/false
- year_built_min/year_built_max: year built range

Parking:
- garage_type: attached|detached|underground|built-in|carport|none
- garage_spaces: number of garage spaces
- parking_spaces_min/parking_spaces_max: parking spaces range

Condo Features:
- maintenance_fee_max: maximum monthly maintenance fee
- condo_exposure: north|south|east|west|north-east|etc.
- floor_level_min/floor_level_max: floor level range
- has_balcony: true/false
- has_locker: true/false
- condo_amenities: array of strings (pool, gym, concierge, party_room, etc.)

Outdoor/Lot Features:
- pool: true/false
- waterfront: true/false
- lot_size_min/lot_size_max: lot size range (sqft or acres)

Status & Timing:
- is_new_listing: true/false (listed in last 7 days)
- days_on_market_max: maximum days on market

Example Extended Queries:
- "condo with finished basement under 700k" → property_type: condo, basement_type: finished, max_price: 700000
- "house with pool and attached garage" → property_type: detached, pool: true, garage_type: attached
- "waterfront property" → waterfront: true
- "condo on 15th floor or higher with south exposure" → property_type: condo, floor_level_min: 15, condo_exposure: south
- "maintenance fee under 500" → maintenance_fee_max: 500
- "new listings only" → is_new_listing: true
- "built after 2015 with central air" → year_built_min: 2015, cooling_type: central_air

CRITICAL: Return ONLY valid JSON. No markdown code blocks (```json), no extra text, just pure JSON.
"""

SYSTEM_PROMPT_SUMMARIZER = """You are a friendly Canadian real estate assistant specializing in Toronto and the GTA region.

Your task: Create a brief, conversational response based on the user's property search.

Input:
- User's message  
- Search filters applied
- Property results (may be empty)

Response requirements:
1. Write 1-2 sentences acknowledging their request (keep it concise)
2. Briefly summarize what was found (or explain why no results)
3. Use a natural, helpful tone
4. Include 2-3 actionable follow-up suggestions

CRITICAL - JSON FORMAT REQUIREMENTS (MUST FOLLOW):
- You MUST return ONLY valid JSON
- Do NOT truncate strings
- Do NOT include unescaped line breaks in JSON strings (use \\n instead)
- Do NOT add markdown code blocks or extra text
- Return a single JSON object only
- Validate JSON before returning

CRITICAL - POSTAL CODE & STREET ADDRESS SPECIFICITY:
When user searches by postal code or street address, BE SPECIFIC in your response:

✅ CORRECT Examples:
- postalCode: "M5V 4B2" → "properties in postal code M5V 4B2, Toronto"
- postalCode: "M5V" → "properties in postal code M5V, Toronto"
- streetName: "King Street West" → "properties on King Street West"

❌ WRONG Examples:
- postalCode: "M5V 4B2" → "properties for sale in Toronto" (too generic!)
- streetName: "King Street West" → "properties in the area" (not specific!)

If results are too broad (500+) for postal/street searches:
- Acknowledge the broad results
- Suggest refinement: "To narrow this down, would you like to filter by price range or property type?"

CRITICAL - When NO RESULTS Found:
If properties_found = 0 and multiple restrictive filters are set (bedrooms, bathrooms, price, specific neighborhood):
1. Ask a clarifying follow-up question to help user decide next steps
2. Offer SPECIFIC alternatives based on what filters are set

Examples for 0 results:
- Filters: {location: "Mississauga", bedrooms: 4, bathrooms: 2, listing_type: "rent"}
  → response_text: "I couldn't find any 4-bedroom, 2-bathroom condos for rent in Mississauga at the moment."
  → suggestions: [
      "Would you like to see properties with different bedroom/bathroom counts?",
      "Should I search nearby areas like Toronto or Brampton?",
      "Would you prefer to see what's available for sale instead?"
    ]

- Filters: {location: "Mississauga", bedrooms: 4, bathrooms: 2} AND user just said "any properties work for me"
  → response_text: "I'm still searching for 4-bedroom, 2-bathroom properties. Did you want me to show you ANY properties in Mississauga (removing the bedroom/bathroom filters), or keep those requirements?"
  → suggestions: [
      "Show me any properties in Mississauga",
      "Keep the 4 bed/2 bath requirement but try other cities",
      "Let me know what matters most to you"
    ]

IMPORTANT - Be specific about what filters are ACTUALLY set:
- If no budget/price_range is set (null or None), DON'T mention "budget considerations" or "adjusting budget"
- If no location is set, suggest popular GTA locations like Toronto, Mississauga, Vaughan
- If bedrooms are set to unusual values (like 8+), that might need clarification
- If listing_type is "rent", focus on rental-specific suggestions (monthly rent, lease terms)
- If listing_type is "sale", focus on purchase-specific suggestions (financing, property value)
- Only suggest adjusting filters that are ACTUALLY set

Examples for successful searches:
- Filters: {location: "Toronto", bedrooms: 2, price_range: null} 
  → Good: "I can show you options across different price ranges"
  → Bad: "Consider adjusting your budget" (no budget was set!)

- Filters: {location: null, bedrooms: 3}
  → Good: "Where would you like to search? Toronto, Mississauga, or Vaughan?"
  → Bad: "Let me know if you want to adjust your location" (no location was set!)

Return valid JSON in this exact format:
{
  "response_text": "Your conversational response here",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "properties_summary": [],
  "enhanced_mode": true
}

Important: Return only the JSON object without any markdown formatting or additional text.
"""

# ------------- helper to call GPT-4 interpreter -------------
def ask_gpt_interpreter(session_summary: Dict[str, Any], user_message: str) -> Dict[str, Any]:
    """
    Ask GPT-4 to interpret user's message and return structured filters.
    FIX: Include current date for proper date interpretation.
    """
    # Add current date context for date filtering
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Inject current date into system prompt
    system_prompt_with_date = SYSTEM_PROMPT_INTERPRETER.replace(
        "CRITICAL: Return ONLY valid JSON.",
        f"IMPORTANT - Current Date: Today is {today}. Use this for relative dates like 'yesterday', 'last week', 'November 15th', etc.\n\nCRITICAL: Return ONLY valid JSON."
    )
    
    messages = [
        {"role": "system", "content": system_prompt_with_date},
        {"role": "assistant", "content": json.dumps(session_summary)},
        {"role": "user", "content": user_message}
    ]
    logger.info("🤖 Calling GPT-4 interpreter...")
    try:
        # GPT-5-nano has specific parameter requirements
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        params = {
            "model": model,
            "messages": messages
        }
        
        # GPT-5 models: use max_completion_tokens, temperature=1 only
        if "gpt-5" in model.lower():
            params["max_completion_tokens"] = 600
            # GPT-5-nano only supports temperature=1 (default), so we omit it
            # Try forcing JSON mode for GPT-5
            params["response_format"] = {"type": "json_object"}
        else:
            params["max_tokens"] = 600
            params["temperature"] = 0.0
        
        resp = client.chat.completions.create(**params)
        text = resp.choices[0].message.content.strip()
        logger.debug(f"Interpreter output: {text[:200]}...")
        
        # Try to parse JSON - handle markdown code blocks
        if text.startswith("```"):
            # Extract JSON from code block
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:].strip()
        
        # Parse JSON
        parsed = json.loads(text)
        return parsed
    except json.JSONDecodeError as e:
        logger.warning(f"⚠️ Interpreter returned non-JSON: {text[:200]}... - falling back to NLP parser")
        # Fallback to local parser
        local = nlp_parser.parse_message(user_message, current_state=session_summary)
        
        # CRITICAL FIX: Check if user is specifying a NEW city (not refining current search)
        # If they mentioned a city explicitly, treat it as a fresh search, not a refinement
        new_location = local.get("location")
        current_location = session_summary.get("filters", {}).get("location")
        
        # Detect if this is a fresh search (new city mentioned that's different from current)
        is_fresh_search = (
            new_location and 
            new_location != current_location and
            local.get("intent") in ["search", "refine"]
        )
        
        # Also detect if user is explicitly asking for a different city
        city_change_keywords = ["in ", "at ", "near "]  # "condos in Milton", "properties at Vancouver"
        mentions_location = any(keyword + new_location.lower() in user_message.lower() for keyword in city_change_keywords) if new_location else False
        
        if is_fresh_search or mentions_location:
            logger.info(f"🌆 [CITY CHANGE DETECTED] {current_location} → {new_location}, treating as fresh search")
            merge_with_previous = False  # Don't merge - this is a new search
        else:
            merge_with_previous = True  # Normal refinement
        
        return {
            "intent": local.get("intent", "general_question"),
            "filters": {
                "location": local.get("location"),
                "property_type": local.get("property_type"),
                "bedrooms": local.get("bedrooms"),
                "bathrooms": local.get("bathrooms"),
                "min_price": (local.get("price_range") or (None,None))[0],
                "max_price": (local.get("price_range") or (None,None))[1],
                "listing_type": local.get("listing_type") or "sale",
                "amenities": local.get("amenities", [])
            },
            "merge_with_previous": merge_with_previous,  # Dynamic based on city change detection
            "clarifying_question": None
        }
    except Exception as e:
        logger.exception("❌ Interpreter error")
        # Safe fallback
        return {
            "intent": "general_question",
            "filters": {},
            "merge_with_previous": True,
            "clarifying_question": None
        }


# ------------- helper to ask GPT-4 summarizer -------------
def ask_gpt_summarizer(user_message: str, filters: Dict[str, Any], properties: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Ask GPT-4 to create final user-facing message + suggestions.
    """
    # Simplified prompt to avoid content filtering issues
    context = {
        "user_request": user_message,
        "filters_applied": filters,
        "properties_found": len(properties),
        "sample_properties": properties[:3] if properties else []
    }
    
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_SUMMARIZER},
        {"role": "user", "content": f"Context: {json.dumps(context, default=str)}"}
    ]
    logger.info("🤖 Calling GPT-4 summarizer...")
    try:
        # GPT-5-nano has specific parameter requirements
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        params = {
            "model": model,
            "messages": messages
        }
        
        # GPT-5 models: use max_completion_tokens, temperature=1 only
        if "gpt-5" in model.lower():
            params["max_completion_tokens"] = 800  # Increased to prevent truncation
            # GPT-5-nano only supports temperature=1 (default), so we omit it
            # Try forcing JSON mode for GPT-5
            params["response_format"] = {"type": "json_object"}
        else:
            params["max_tokens"] = 1000  # Increased from 350 to prevent JSON truncation
            params["temperature"] = 0.3  # Slightly increased for more natural responses
        
        resp = client.chat.completions.create(**params)
        text = resp.choices[0].message.content.strip() if resp.choices[0].message.content else ""
        
        # Log the full response for debugging
        logger.info(f"📝 Summarizer full response (first 700 chars): {text[:700]}")
        
        # Check if response is empty - try fallback model if GPT-5 fails
        if not text:
            logger.warning("⚠️ Summarizer returned completely empty response")
            logger.warning(f"⚠️ Model used: {model}")
            logger.warning(f"⚠️ Input message: {user_message[:100]}")
            
            # If using GPT-5, try fallback to GPT-4o-mini
            if "gpt-5" in model.lower():
                logger.info("🔄 Trying fallback to GPT-4o-mini...")
                fallback_params = {
                    "model": "gpt-4o-mini",
                    "messages": messages,
                    "max_tokens": 600,
                    "temperature": 0.2
                }
                fallback_resp = client.chat.completions.create(**fallback_params)
                fallback_text = fallback_resp.choices[0].message.content.strip() if fallback_resp.choices[0].message.content else ""
                
                if fallback_text:
                    logger.info("✅ Fallback model succeeded")
                    text = fallback_text
                else:
                    raise ValueError("Both primary and fallback models returned empty responses")
            else:
                raise ValueError("Empty response from GPT summarizer")
        
        # Try to parse JSON - handle markdown code blocks
        original_text = text
        if text.startswith("```"):
            # Extract JSON from code block
            parts = text.split("```")
            if len(parts) >= 2:
                text = parts[1]
                if text.startswith("json"):
                    text = text[4:].strip()
        
        # Additional check after code block extraction
        if not text.strip():
            logger.warning(f"⚠️ Summarizer returned empty JSON after extraction. Original: {original_text[:200]}")
            raise ValueError("Empty JSON after extraction")
        
        # CRITICAL FIX #4: Enhanced JSON parsing with retry logic
        try:
            result = json.loads(text)
            logger.info("✅ Successfully parsed summarizer JSON response")
            
            # Validate required fields
            if not result.get("response_text"):
                logger.warning("⚠️ Summarizer JSON missing response_text, using fallback")
                raise ValueError("Invalid JSON structure: missing response_text")
            
            return result
        
        except json.JSONDecodeError as json_err:
            logger.error(f"❌ JSON parsing failed: {json_err}")
            logger.error(f"❌ Raw text (first 700 chars): {text[:700]}")
            
            # CRITICAL FIX #4: Try to fix common JSON issues
            # Remove trailing commas, fix quotes, etc.
            try:
                # Attempt 1: Remove trailing whitespace and try again
                cleaned_text = text.strip().rstrip(',').rstrip()
                result = json.loads(cleaned_text)
                logger.info("✅ Fixed JSON by cleaning whitespace")
                return result
            except:
                pass
            
            # Attempt 2: Try to fix truncated JSON (unterminated strings/arrays)
            try:
                # Check if JSON was truncated mid-array or mid-string
                if text.count('[') > text.count(']'):
                    # Close open arrays
                    text = text + ']' * (text.count('[') - text.count(']'))
                if text.count('{') > text.count('}'):
                    # Close open objects
                    text = text + '}' * (text.count('{') - text.count('}'))
                # Try to close unterminated strings by finding last quote
                if text.count('"') % 2 != 0:
                    # Odd number of quotes - add closing quote before last brace
                    last_brace = text.rfind('}')
                    if last_brace > 0:
                        text = text[:last_brace] + '"' + text[last_brace:]
                
                result = json.loads(text)
                logger.info("✅ Fixed truncated JSON by closing structures")
                return result
            except:
                pass
            
            # Attempt 3: Try to extract JSON object if wrapped in text
            try:
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
                if json_match:
                    extracted_json = json_match.group(0)
                    result = json.loads(extracted_json)
                    logger.info("✅ Fixed JSON by extracting object")
                    return result
            except:
                pass
            
            # All attempts failed - raise to trigger fallback
            raise
    
    except (json.JSONDecodeError, Exception) as e:
        if isinstance(e, json.JSONDecodeError):
            logger.error(f"⚠️ Summarizer returned invalid JSON after all retry attempts")
            logger.error(f"⚠️ Text: {text[:200] if 'text' in locals() else 'empty'}...")
        logger.exception("⚠️ Summarizer error, using fallback")
        
        # Enhanced fallback response with detailed property information
        count = len(properties)
        
        # Determine listing type for messaging
        listing_type = filters.get("transaction_type", "sale")
        type_text = "rental" if listing_type == "lease" else "sale"
        
        if count > 0:
            summary = f"I found {count} {type_text} {'property' if count == 1 else 'properties'} matching your criteria! Here are the details:"
            suggestions = [
                "Show properties with specific amenities",
                "Adjust price range" if listing_type == "sale" else "Adjust monthly rent",
                "Find similar properties in other areas"
            ]
        else:
            summary = f"I couldn't find any {type_text} properties matching those exact criteria. Try adjusting your filters or budget."
            suggestions = [
                "Increase budget range",
                "Expand search area",
                "Try different property types"
            ]
        
        # Enhanced property summary with all available details
        props_summary = []
        for p in properties[:6]:
            # Get the first image from images array, or construct from MLS number
            image_url = ""
            if p.get("images") and len(p.get("images")) > 0:
                image_url = p["images"][0]
            elif p.get("image"):
                image_url = p["image"]
            elif p.get("mls_number"):
                # Fallback: construct CDN URL from MLS number
                image_url = f"https://cdn.repliers.io/IMG-{p['mls_number']}_1.jpg"
            
            prop_summary = {
                "address": p.get("address", p.get("full_address", "Address not available")),
                "price": p.get("price", "$0"),
                "bedrooms": str(p.get("bedrooms", "N/A")),
                "bathrooms": str(p.get("bathrooms", "N/A")),
                "mls": p.get("mls_number", p.get("id", "N/A")),
                "sqft": p.get("sqft", "N/A"),
                "property_type": p.get("property_type", "Residential"),
                "image_url": image_url
            }
            props_summary.append(prop_summary)
        
        return {
            "response_text": summary, 
            "suggestions": suggestions, 
            "properties_summary": props_summary,
            "enhanced_mode": True  # Signal that this includes enhanced property data
        }


# ------------- orchestrator class -------------
class ChatGPTChatbot:
    """
    Main chatbot orchestrator - routes through GPT-4 interpreter + summarizer.
    
    Features:
    - GPT-4 interprets user intent and extracts filters
    - Maintains full conversation context using UnifiedConversationState (Pydantic v2)
    - Uses UnifiedStateManager as single session store with Redis persistence
    - Fixes rental/sale mixing
    - Detects amenities correctly
    - Returns crisp ChatGPT-style responses
    - Checkpoint/restore support for risky operations
    """
    
    def __init__(self):
        # Primary state manager - UnifiedStateManager (single source of truth)
        # Uses global state_manager which has Redis persistence with in-memory fallback
        self.state_manager = state_manager
        self.unified_state_manager = state_manager  # Backwards compatibility alias
        
        # Legacy state manager for backward compatibility during transition
        self.legacy_state_manager = conversation_state_manager
        
        # Confirmation manager for handling confirmation flows
        self.confirmation_manager = get_confirmation_manager()
        
        # Atomic transaction manager for safe state updates with automatic rollback
        self.transaction_manager = AtomicTransactionManager(state_manager=state_manager)
        
        # Scalability manager for high-performance concurrent operations
        self.scalability_manager = scalability_manager
        
        # Log initialization with backend info
        logger.info(
            f"✅ ChatGPTChatbot orchestrator loaded | "
            f"backend={state_manager.backend} | "
            f"GPT-4 pipeline + ConfirmationManager + AtomicTransactionManager enabled"
        )

    def _save_state_with_error_handling(
        self,
        unified_state: UnifiedConversationState,
        legacy_state: Optional[ConversationState] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Save state with comprehensive error handling and logging.
        
        Args:
            unified_state: The UnifiedConversationState to save.
            legacy_state: Optional legacy ConversationState for backwards compatibility.
            session_id: Session ID for logging (uses unified_state.session_id if not provided).
        
        Returns:
            True if save was successful, False otherwise.
        """
        sid = session_id or unified_state.session_id
        
        try:
            # Save to primary state manager (UnifiedStateManager with Redis/memory)
            success = self.state_manager.save(unified_state)
            
            if not success:
                logger.warning(
                    f"State save returned False | session_id={sid} | "
                    f"error_type=SAVE_FAILED"
                )
            
            # Also save legacy state if provided (during transition period)
            if legacy_state is not None:
                try:
                    self.legacy_state_manager.save(legacy_state)
                except Exception as legacy_error:
                    logger.warning(
                        f"Legacy state save failed | session_id={sid} | "
                        f"error={str(legacy_error)}"
                    )
            
            return success
            
        except ValueError as validation_error:
            # Pydantic validation error
            logger.warning(
                f"State validation failed | session_id={sid} | "
                f"error_type=VALIDATION_ERROR | error_message={str(validation_error)}"
            )
            return False
            
        except Exception as e:
            # Unexpected error (likely Redis)
            logger.error(
                f"State save failed | session_id={sid} | "
                f"error_type=SAVE_ERROR | error_message={str(e)}",
                exc_info=True
            )
            # State manager handles fallback to in-memory internally
            return False

    def _create_checkpoint_via_manager(
        self,
        unified_state: UnifiedConversationState
    ) -> Optional[str]:
        """
        Create a checkpoint through the state manager.
        
        Args:
            unified_state: The state to checkpoint.
            
        Returns:
            Checkpoint ID or None if failed.
        """
        try:
            checkpoint_id = self.state_manager.create_checkpoint(unified_state)
            logger.info(
                f"Checkpoint created | session_id={unified_state.session_id} | "
                f"checkpoint_id={checkpoint_id}"
            )
            return checkpoint_id
        except Exception as e:
            logger.error(
                f"Checkpoint creation failed | session_id={unified_state.session_id} | "
                f"error={str(e)}"
            )
            return None

    def _restore_from_checkpoint(
        self,
        checkpoint_id: str,
        session_id: str
    ) -> Optional[UnifiedConversationState]:
        """
        Restore state from a checkpoint.
        
        Args:
            checkpoint_id: The checkpoint to restore from.
            session_id: The session ID (for logging).
            
        Returns:
            Restored state or None if failed.
        """
        try:
            restored_state = self.state_manager.get_checkpoint(checkpoint_id)
            if restored_state:
                logger.info(
                    f"State restored from checkpoint | session_id={session_id} | "
                    f"checkpoint_id={checkpoint_id}"
                )
                # Update in-memory cache with restored state
                self.state_manager.save(restored_state)
            else:
                logger.warning(
                    f"Checkpoint not found | session_id={session_id} | "
                    f"checkpoint_id={checkpoint_id}"
                )
            return restored_state
        except Exception as e:
            logger.error(
                f"Checkpoint restore failed | session_id={session_id} | "
                f"checkpoint_id={checkpoint_id} | error={str(e)}"
            )
            return None

    def _resolve_postal_code_to_city(self, postal_code: str) -> Optional[str]:
        """
        🗺️  AI-POWERED LOCATION RESOLVER
        Uses OpenAI to resolve postal codes, landmarks, or street names to Ontario cities.
        
        Examples:
        - "M1A 2B6" → "Toronto"
        - "K1A 0A6" → "Ottawa"
        - "L5B 1M2" → "Mississauga"
        """
        try:
            prompt = f"""You are a geography expert for Ontario, Canada. The user mentioned a postal code: "{postal_code}"

Your task: Identify which Ontario CITY this postal code belongs to for MLS property searches.

Rules:
1. Return ONLY the city name (e.g., "Toronto", "Ottawa", "Mississauga")
2. No province, no explanation, just the city name
3. Must be a real Ontario city
4. M postal codes are typically Toronto or GTA cities
5. K postal codes are typically Ottawa

Examples:
- "M1A" → "Toronto"
- "M5V" → "Toronto"  
- "K1A" → "Ottawa"
- "L5B" → "Mississauga"
- "L4L" → "Vaughan"

Now resolve "{postal_code}":"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a geography expert. Return only the Ontario city name, nothing else."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=20
            )
            
            resolved_city = response.choices[0].message.content.strip()
            logger.info(f"🗺️  [AI RESOLVER] Postal code '{postal_code}' → '{resolved_city}'")
            return resolved_city
            
        except Exception as e:
            logger.error(f"❌ [AI RESOLVER] Error resolving postal code '{postal_code}': {e}")
            return None

    def _create_metadata_dict(
        self,
        intent: str,
        confidence: float = 0.0,
        reason: str = "N/A",
        cache_hit: bool = False,
        used_gpt_fallback: bool = False,
        requires_confirmation: bool = False
    ) -> Dict[str, Any]:
        """
        Create a standardized metadata dictionary for API responses.
        
        This ensures all responses have consistent metadata structure.
        """
        return {
            "intent": intent,
            "confidence": confidence,
            "reason": reason,
            "cache_hit": cache_hit,
            "used_gpt_fallback": used_gpt_fallback,
            "requires_confirmation": requires_confirmation
        }

    # =============================================================================
    # CONFIRMATION HANDLING (Central Methods)
    # =============================================================================

    def _handle_confirmation_response(
        self,
        session_id: str,
        user_message: str,
        unified_state: UnifiedConversationState
    ) -> Optional[Dict[str, Any]]:
        """
        Central handler for ALL confirmation responses.
        
        This is the SINGLE entry point for handling confirmation responses.
        Uses ConfirmationManager.apply_confirmation() for atomic state updates.
        
        Args:
            session_id: Session identifier
            user_message: User's response message
            unified_state: Current conversation state
            
        Returns:
            Response dict if confirmation was handled, None if no confirmation pending
        """
        # Check if there's a pending confirmation
        if not self.confirmation_manager.has_pending_confirmation(session_id):
            return None
        
        # Get pending confirmation details
        pending = self.confirmation_manager.get_pending_confirmation(session_id)
        if not pending:
            return None
        
        # Check if message is a confirmation response
        if not self.confirmation_manager.is_confirmation_response(user_message, pending):
            logger.info(
                f"[CONFIRMATION] Message not recognized as confirmation response",
                extra={
                    "session_id": session_id,
                    "user_response": user_message[:50],
                    "pending_type": pending['type']
                }
            )
            return None
        
        # Log confirmation handling
        logger.info(
            f"[CONFIRMATION] Processing response",
            extra={
                "session_id": session_id,
                "confirmation_type": pending['type'],
                "confirmation_id": pending['confirmation_id'],
                "user_response": user_message[:50]
            }
        )
        
        # Apply confirmation using ConfirmationManager (atomic state update)
        # ConfirmationManager already provides atomic operations
        result: ConfirmationResult = self.confirmation_manager.apply_confirmation(
            session_id=session_id,
            response=user_message,
            state=unified_state
        )
        
        # Log result
        logger.info(
            f"[CONFIRMATION] Applied",
            extra={
                "session_id": session_id,
                "success": result.success,
                "applied": result.applied,
                "next_action": result.next_action,
                "error": result.error
            }
        )
        
        # Handle result
        if not result.success:
            logger.warning(
                f"[CONFIRMATION] Application failed: {result.error}",
                extra={"session_id": session_id}
            )
            return None
        
        # Route based on next_action
        return self._handle_confirmation_result(
            session_id=session_id,
            result=result,
            unified_state=unified_state,
            user_message=user_message
        )

    def _handle_confirmation_result(
        self,
        session_id: str,
        result: ConfirmationResult,
        unified_state: UnifiedConversationState,
        user_message: str
    ) -> Dict[str, Any]:
        """
        Handle ConfirmationResult and route to appropriate action.
        
        This method routes based on result.next_action:
        - 'search': Perform search with updated state
        - 'parse_location': Parse new location from user's response
        - 'parse_filters': Parse new filters from user's response
        - 'parse_requirements': Parse requirements from user's response
        - 'continue': Acknowledge without state change
        
        Args:
            session_id: Session identifier
            result: ConfirmationResult from apply_confirmation()
            unified_state: Current conversation state (already updated if result.applied)
            user_message: Original user message
            
        Returns:
            Response dictionary
        """
        logger.info(
            f"[CONFIRMATION] Handling result",
            extra={
                "session_id": session_id,
                "next_action": result.next_action,
                "applied": result.applied,
                "reason": result.metadata.get('reason', 'N/A')
            }
        )
        
        # Update conversation history
        unified_state.add_conversation_turn("user", user_message)
        
        if result.next_action == 'search':
            # State already updated by apply_confirmation, perform search
            logger.info(f"[CONFIRMATION] Executing search with updated state")
            
            # Save state before search
            self._save_state_with_error_handling(unified_state)
            
            return self._execute_property_search(
                state=unified_state,
                user_message=user_message,
                session_id=session_id,
                intent_reason=result.metadata.get('reason', 'Confirmation applied'),
                confirmation_result="accepted" if result.applied else "modified"
            )
        
        elif result.next_action == 'parse_location':
            # Parse new location from user's response
            location_query = result.state_update.get('location_query', user_message)
            logger.info(
                f"[CONFIRMATION] Parsing new location: {location_query}",
                extra={"session_id": session_id}
            )
            
            # Extract location using location_extractor
            location_result = location_extractor.extract_location_entities(location_query)
            
            if location_result.city:
                # Apply location to state - use location_state AND active_filters
                unified_state.location_state.city = location_result.city
                # Note: province not in unified LocationState, skip it
                if location_result.postalCode:
                    unified_state.location_state.postal_code = location_result.postalCode
                
                # CRITICAL: Also update active_filters.location for search
                unified_state.active_filters.location = location_result.city
                
                logger.info(
                    f"[CONFIRMATION] Applied new location: {location_result.city}",
                    extra={"session_id": session_id}
                )
                
                # Save and search
                self._save_state_with_error_handling(unified_state)
                
                return self._execute_property_search(
                    state=unified_state,
                    user_message=user_message,
                    session_id=session_id,
                    intent_reason="User provided new location",
                    confirmation_result="location_changed"
                )
            else:
                # Couldn't parse location, ask for clarification
                response = f"I couldn't understand '{location_query}' as a location. Could you specify the city or area you're interested in?"
                unified_state.add_conversation_turn("assistant", response)
                self._save_state_with_error_handling(unified_state)
                
                return {
                    "success": True,
                    "response": response,
                    "suggestions": [
                        "Toronto",
                        "Ottawa",
                        "Mississauga"
                    ],
                    "properties": [],
                    "property_count": 0,
                    "state_summary": unified_state.get_summary(),
                    "filters": unified_state.get_active_filters(),
                    "intent": "clarification_needed",
                    "mode": "normal"
                }
        
        elif result.next_action == 'parse_filters':
            # Parse new filters from user's response
            filter_query = result.state_update.get('filter_query', user_message)
            logger.info(
                f"[CONFIRMATION] Parsing new filters: {filter_query}",
                extra={"session_id": session_id}
            )
            
            # Use GPT-4 to parse filters
            try:
                filter_result = self._parse_filters_with_gpt4(filter_query, unified_state)
                
                # Apply filters to state
                if filter_result.get('bedrooms'):
                    unified_state.filters.bedrooms = filter_result['bedrooms']
                if filter_result.get('bathrooms'):
                    unified_state.filters.bathrooms = filter_result['bathrooms']
                if filter_result.get('price_min') or filter_result.get('price_max'):
                    unified_state.filters.price_min = filter_result.get('price_min')
                    unified_state.filters.price_max = filter_result.get('price_max')
                
                # Save and search
                self._save_state_with_error_handling(unified_state)
                
                return self._execute_property_search(
                    state=unified_state,
                    user_message=user_message,
                    session_id=session_id,
                    intent_reason="User modified filters",
                    confirmation_result="filters_changed"
                )
            except Exception as e:
                logger.error(f"[CONFIRMATION] Filter parsing failed: {e}")
                # Fall back to asking for clarification
                response = "I had trouble understanding those filter changes. Could you specify what you're looking for?"
                unified_state.add_conversation_turn("assistant", response)
                self._save_state_with_error_handling(unified_state)
                
                return {
                    "success": True,
                    "response": response,
                    "suggestions": [
                        "3 bedrooms",
                        "Under $800k",
                        "With a pool"
                    ],
                    "properties": [],
                    "property_count": 0,
                    "state_summary": unified_state.get_summary(),
                    "filters": unified_state.get_active_filters(),
                    "intent": "clarification_needed",
                    "mode": "normal"
                }
        
        elif result.next_action == 'parse_requirements':
            # Parse requirements from user's response
            requirements_query = result.state_update.get('requirements_query', user_message)
            logger.info(
                f"[CONFIRMATION] Parsing requirements: {requirements_query}",
                extra={"session_id": session_id}
            )
            
            # Use GPT-4 to parse requirements
            try:
                filter_result = self._parse_filters_with_gpt4(requirements_query, unified_state)
                
                # Apply to state
                if filter_result.get('bedrooms'):
                    unified_state.filters.bedrooms = filter_result['bedrooms']
                if filter_result.get('bathrooms'):
                    unified_state.filters.bathrooms = filter_result['bathrooms']
                if filter_result.get('price_min') or filter_result.get('price_max'):
                    unified_state.filters.price_min = filter_result.get('price_min')
                    unified_state.filters.price_max = filter_result.get('price_max')
                if filter_result.get('property_type'):
                    unified_state.filters.property_type = filter_result['property_type']
                
                # Save and search
                self._save_state_with_error_handling(unified_state)
                
                return self._execute_property_search(
                    state=unified_state,
                    user_message=user_message,
                    session_id=session_id,
                    intent_reason="User provided requirements",
                    confirmation_result="requirements_applied"
                )
            except Exception as e:
                logger.error(f"[CONFIRMATION] Requirements parsing failed: {e}")
                # Continue with search using defaults
                self._save_state_with_error_handling(unified_state)
                
                return self._execute_property_search(
                    state=unified_state,
                    user_message=user_message,
                    session_id=session_id,
                    intent_reason="Searching with defaults",
                    confirmation_result="requirements_skipped"
                )
        
        elif result.next_action == 'continue':
            # No state change, just acknowledge
            response_text = result.metadata.get('acknowledgment', 
                "Got it! Let me know if you'd like to adjust anything.")
            
            unified_state.add_conversation_turn("assistant", response_text)
            self._save_state_with_error_handling(unified_state)
            
            return {
                "success": True,
                "response": response_text,
                "suggestions": self._generate_contextual_suggestions(unified_state),
                "properties": [],
                "property_count": 0,
                "state_summary": unified_state.get_summary(),
                "filters": unified_state.get_active_filters(),
                "intent": "confirmation_handled",
                "mode": "normal",
                "confirmation_result": "acknowledged"
            }
        
        else:
            # Unknown next_action
            logger.warning(
                f"[CONFIRMATION] Unknown next_action: {result.next_action}",
                extra={"session_id": session_id}
            )
            
            # Fall back to normal processing
            return None

    def _generate_contextual_suggestions(
        self,
        state: UnifiedConversationState
    ) -> List[str]:
        """Generate contextual suggestions based on current state."""
        suggestions = []
        
        # Safely get location
        location_city = None
        if hasattr(state, 'location_state') and state.location_state and state.location_state.city:
            location_city = state.location_state.city
        elif hasattr(state, 'location') and hasattr(state.location, 'city'):
            location_city = state.location.city
        
        if location_city:
            suggestions.append(f"Show me properties in {location_city}")
        
        # Safely check filters
        if hasattr(state, 'active_filters'):
            if state.active_filters.bedrooms:
                suggestions.append(f"Show {state.active_filters.bedrooms} bedroom homes")
        
        if not suggestions:
            suggestions = [
                "Show me 2 bedroom condos",
                "Properties under $700K",
                "Homes with a pool"
            ]
        
        return suggestions[:3]
    
    def _detect_and_route_property_type(
        self,
        user_message: str,
        session_id: str,
        conversation_history: Optional[List[str]] = None
    ) -> Tuple[PropertyType, float]:
        """
        Detect property type (residential vs commercial) from user message.
        
        Args:
            user_message: User's current message
            session_id: Session ID for logging
            conversation_history: Previous messages for context
        
        Returns:
            Tuple of (PropertyType, confidence_score)
        """
        try:
            # Use property type interpreter
            result = classify_property_type(user_message, conversation_history)
            
            property_type = result["property_type"]
            confidence = result["confidence"]
            method = result["method"]
            
            # Log detection
            icon = "🏠" if property_type == PropertyType.RESIDENTIAL else "🏢" if property_type == PropertyType.COMMERCIAL else "❓"
            logger.info(
                f"{icon} [PROPERTY TYPE] Detected: {property_type.value} "
                f"(confidence: {confidence:.0%}, method: {method})"
            )
            logger.debug(f"  Reasoning: {result['reasoning']}")
            
            return property_type, confidence
            
        except Exception as e:
            logger.warning(f"⚠️ Property type detection failed: {e}")
            # Default to residential
            return PropertyType.RESIDENTIAL, 0.0
    
    def _detect_multiple_cities(self, user_message: str) -> List[str]:
        """
        Detect multiple cities in a single query.
        
        Examples:
            - "bakeries in toronto and ottawa" → ["Toronto", "Ottawa"]
            - "show properties in mississauga, brampton and hamilton" → ["Mississauga", "Brampton", "Hamilton"]
            - "toronto properties" → ["Toronto"]
        
        Returns:
            List of detected city names
        """
        try:
            import re
            
            # List of major Ontario cities to detect
            ontario_cities = [
                'Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton',
                'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor',
                'Richmond Hill', 'Oakville', 'Burlington', 'Barrie', 'Oshawa',
                'St. Catharines', 'Cambridge', 'Waterloo', 'Guelph', 'Sudbury',
                'Kingston', 'Thunder Bay', 'Niagara Falls', 'Peterborough',
                'Pickering', 'Ajax', 'Whitby', 'Milton', 'Newmarket'
            ]
            
            detected_cities = []
            user_message_lower = user_message.lower()
            
            # Check each city name in the message
            for city in ontario_cities:
                # Use word boundary regex to avoid partial matches
                pattern = r'\b' + re.escape(city.lower()) + r'\b'
                if re.search(pattern, user_message_lower):
                    detected_cities.append(city)
            
            # If multiple cities detected, return all
            if len(detected_cities) > 1:
                logger.info(f"🌍 [MULTI-CITY DETECTION] Found {len(detected_cities)} cities: {detected_cities}")
                return detected_cities
            elif len(detected_cities) == 1:
                return detected_cities
            else:
                return []
                
        except Exception as e:
            logger.warning(f"⚠️ Multi-city detection failed: {e}")
            return []
    
    def _search_commercial_properties(
        self,
        user_message: str,
        session_id: str,
        interpreted_filters: Dict
    ) -> Dict:
        """
        Search for commercial properties using commercial service.
        
        Args:
            user_message: User's raw message (passed to commercialapp.py for OpenAI analysis)
            session_id: Session ID
            interpreted_filters: Filters from GPT-4 interpretation
        
        Returns:
            Search results in standard format
        """
        try:
            # CRITICAL: Pass raw user_message to commercialapp.py
            # commercialapp.py has its own OpenAI-powered method to extract business_type, 
            # street names, and other details from the user query
            
            # Only extract location from interpreted_filters
            location = interpreted_filters.get("location")
            
            if not location:
                return {
                    "success": False,
                    "properties": [],
                    "count": 0,
                    "message": "Please specify a city or location for commercial property search"
                }
            
            # Build minimal criteria - let commercialapp.py handle the rest
            criteria = {
                "location": location,
                "user_query": user_message,  # Pass raw query for OpenAI analysis
            }
            
            # CRITICAL: Pass business_type from GPT interpretation to commercial search
            # This is the key filter for finding spa/restaurant/salon/etc.
            if interpreted_filters.get("business_type"):
                criteria["business_type"] = interpreted_filters["business_type"]
                logger.info(f"🏢 [COMMERCIAL SEARCH] Business type: {criteria['business_type']}")
            
            # Optionally include price/sqft if provided (as hints)
            if interpreted_filters.get("min_price"):
                criteria["price_min"] = interpreted_filters["min_price"]
            if interpreted_filters.get("max_price"):
                criteria["price_max"] = interpreted_filters["max_price"]
            if interpreted_filters.get("min_sqft"):
                criteria["square_feet_min"] = interpreted_filters["min_sqft"]
            if interpreted_filters.get("max_sqft"):
                criteria["square_feet_max"] = interpreted_filters["max_sqft"]
            
            # Pass listing type (sale/lease) if provided
            if interpreted_filters.get("listing_type"):
                criteria["listing_type"] = interpreted_filters["listing_type"]
            
            # CRITICAL: Pass all commercial-specific filters to commercialapp.py
            # These are extracted by GPT-4 in chatbot_orchestrator
            commercial_filters = [
                "intersection", "landmark", "proximity", "postal_code",
                "exclude_streets", "exclude_areas", "business_use",
                "price_per_sqft_max", "ground_floor", "food_use_allowed",
                "alcohol_allowed", "near_transit", "clear_height_min",
                "loading_docks", "property_class", "parking_included",
                "no_lease", "no_automotive", "high_foot_traffic"
            ]
            
            for filter_name in commercial_filters:
                if interpreted_filters.get(filter_name) is not None:
                    criteria[filter_name] = interpreted_filters[filter_name]
                    logger.info(f"🏢 [COMMERCIAL FILTER] {filter_name}: {criteria[filter_name]}")
            
            logger.info(f"🏢 [COMMERCIAL SEARCH] Criteria: {criteria}")
            logger.info(f"🏢 [COMMERCIAL SEARCH] Raw user query: '{user_message}'")

            
            # Execute commercial search
            result = search_commercial_properties(criteria)
            
            logger.info(
                f"🏢 [COMMERCIAL SEARCH] "
                f"{'Success' if result['success'] else 'Failed'}: "
                f"{result['count']} properties found"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Commercial search error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "properties": [],
                "count": 0,
                "message": f"Error searching commercial properties: {str(e)}"
            }
    
    def _search_condo_properties(
        self,
        user_message: str,
        session_id: str,
        interpreted_filters: Dict
    ) -> Dict:
        """
        Search for condo properties using condo service.
        
        Args:
            user_message: User's raw message (passed to condo.py for OpenAI analysis)
            session_id: Session ID
            interpreted_filters: Filters from GPT-4 interpretation (used for location)
        
        Returns:
            Search results in standard format
        """
        try:
            # CRITICAL: Pass raw user_message to condo.py
            # condo.py has its own OpenAI-powered method to extract condo-specific fields
            
            # Only extract location from interpreted_filters
            location = interpreted_filters.get("location")
            
            if not location:
                return {
                    "success": False,
                    "properties": [],
                    "count": 0,
                    "message": "Please specify a city or location for condo search"
                }
            
            # Build minimal criteria - let condo.py handle the rest
            criteria = {
                "location": location,
                "user_query": user_message,  # Pass raw query for OpenAI analysis
            }
            
            # Optionally include price if provided (as hints)
            if interpreted_filters.get("min_price"):
                criteria["min_price"] = interpreted_filters["min_price"]
            if interpreted_filters.get("max_price"):
                criteria["max_price"] = interpreted_filters["max_price"]
            if interpreted_filters.get("bedrooms"):
                criteria["bedrooms"] = interpreted_filters["bedrooms"]
            if interpreted_filters.get("bathrooms"):
                criteria["bathrooms"] = interpreted_filters["bathrooms"]
            
            logger.info(f"🏙️ [CONDO SEARCH] Criteria: {criteria}")
            logger.info(f"🏙️ [CONDO SEARCH] Raw user query: '{user_message}'")

            
            # Execute condo search
            result = search_condo_properties(criteria)
            
            # Convert to standard format
            success = result.get("total", 0) > 0
            
            logger.info(
                f"🏙️ [CONDO SEARCH] "
                f"{'Success' if success else 'No results'}: "
                f"{result.get('total', 0)} condos found"
            )
            
            return {
                "success": success,
                "properties": result.get("properties", []),
                "count": result.get("total", 0),
                "message": result.get("message", "Condo search completed")
            }
            
        except Exception as e:
            logger.error(f"❌ Condo search error: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "properties": [],
                "count": 0,
                "message": f"Error searching condos: {str(e)}"
            }

    
    @with_performance_tracking
    def process_message(
        self,
        user_message: str,
        session_id: str,
        skip_address_detection: bool = False,
        user_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Process user message through complete GPT-4 pipeline.
        
        Pipeline:
        1. Load/create UnifiedConversationState via state_manager.get_or_create()
        2. Add user message to history (atomic append with validation)
        3. Get session summary (for interpreter)
        4. Call GPT-4 interpreter for structured filters
        5. Handle clarifying questions
        6. Update state with interpreted filters (validated via Pydantic)
        7. Execute MLS search (if needed)
        8. Call GPT-4 summarizer for final response
        9. Save state via state_manager.save() and return response
        
        SCALABILITY FEATURES:
        - Request context isolation (thread-safe)
        - Distributed session locking (prevents concurrent modifications)
        - Performance tracking (monitors response times)
        - State caching (reduces Redis/DB load)
        
        Args:
            user_message: The user's message
            session_id: Session ID
            skip_address_detection: Whether to skip address detection
            user_context: Optional context dict. Can include 'property_type_hint' from frontend buttons
        
        Returns:
            {
                "success": bool,
                "response": str (main message),
                "suggestions": [str] (follow-ups),
                "properties": [dict] (search results),
                "property_count": int,
                "state_summary": dict,
                "filters": dict,
                "request_id": str (unique request identifier)
            }
        """
        # Create isolated request context for thread-safety
        with RequestContext.create(session_id=session_id) as ctx:
            request_id = ctx['request_id']
            logger.info(
                f"📨 Processing message | "
                f"session={session_id} | "
                f"request={request_id} | "
                f"message='{user_message[:60]}...'"
            )
            
            # Extract property type hint from button selection (if provided)
            property_type_hint = None
            if user_context and 'property_type_hint' in user_context:
                property_type_hint = user_context['property_type_hint']
                logger.info(f"🎯 [BUTTON HINT] Property type from frontend button: {property_type_hint}")
            
            # Store checkpoint_id for potential rollback
            checkpoint_id: Optional[str] = None
            
            # Initialize intent classification variables
            classified_intent = None
            intent_metadata = {}
            
            try:
                # ★★★ SCALABILITY: Acquire distributed session lock ★★★
                # Prevents concurrent modifications to same session across server instances
                with self.scalability_manager.acquire_session_lock(session_id):
                    logger.debug(f"🔒 Acquired session lock | session={session_id} | request={request_id}")
                    
                    return self._process_message_locked(
                        user_message=user_message,
                        session_id=session_id,
                        request_id=request_id,
                        skip_address_detection=skip_address_detection,
                        user_context=user_context,
                        property_type_hint=property_type_hint
                    )
            
            except Exception as e:
                logger.exception(f"❌ Error processing message | session={session_id} | request={request_id}")
                return {
                    "success": False,
                    "response": "I encountered an error processing your request. Please try again.",
                    "suggestions": ["Try rephrasing your question", "Start a new search"],
                    "properties": [],
                    "property_count": 0,
                    "filters": {},
                    "request_id": request_id,
                    "error": str(e)
                }
    
    def _process_message_locked(
        self,
        user_message: str,
        session_id: str,
        request_id: str,
        skip_address_detection: bool,
        user_context: Optional[Dict],
        property_type_hint: Optional[str]
    ) -> Dict[str, Any]:
        """
        Internal method that processes message with session lock already acquired.
        This ensures no concurrent modifications to the same session.
        
        Args:
            user_message: User's message
            session_id: Session ID
            request_id: Unique request ID
            skip_address_detection: Whether to skip address detection
            user_context: Optional context dict
            property_type_hint: Property type hint from frontend
        
        Returns:
            Response dictionary
        """
        checkpoint_id: Optional[str] = None
        classified_intent = None
        intent_metadata = {}
        
        try:
            # STEP 1: Get or create UnifiedConversationState via state_manager
            # Extract user_id from context if available (for authenticated users)
            user_id = user_context.get('user_id') if user_context else None
            
            # Load unified state from primary state manager (Redis → memory fallback)
            unified_state = self.state_manager.get_or_create(session_id, user_id=user_id)
            
            # Validate session_id matches
            if unified_state.session_id != session_id:
                logger.warning(f"Session ID mismatch: expected {session_id}, got {unified_state.session_id}")
                unified_state.session_id = session_id
            
            logger.debug(f"Unified state summary: {unified_state.get_summary()}")
            logger.info(f"📊 [UNIFIED STATE] search_count={unified_state.search_count}, zero_results_count={unified_state.zero_results_count}, cached_results={len(unified_state.last_property_results)}")
            
            # Also load legacy state for backward compatibility during transition
            state = self.legacy_state_manager.get_or_create(session_id)
            logger.debug(f"Legacy state: {state.get_summary()}")
            
            # ═════════════════════════════════════════════════════════════════
            # STEP 1.1: PRIORITY CHECK - Handle Pending Confirmations FIRST
            # ═════════════════════════════════════════════════════════════════
            # This MUST come before any intent classification or processing
            # Confirmation responses take absolute precedence over everything else
            
            confirmation_response = self._handle_confirmation_response(
                session_id=session_id,
                user_message=user_message,
                unified_state=unified_state
            )
            
            if confirmation_response is not None:
                # Confirmation was handled, return the response directly
                logger.info(
                    f"[CONFIRMATION] Handled successfully, returning response",
                    extra={"session_id": session_id}
                )
                return confirmation_response
            
            # No pending confirmation or message wasn't a confirmation response
            # Continue with normal processing
            
            # STEP 1.1.5: PRE-CONSTRUCTION INTENT DETECTION (PRIORITY CHECK)
            # Check if user is asking for pre-construction properties
            # CRITICAL: Skip pre-construction check for commercial/business searches
            is_commercial_query = any(word in user_message.lower() for word in [
                'bakery', 'bakeries', 'restaurant', 'restaurants', 'office', 'retail', 
                'warehouse', 'industrial', 'commercial', 'business', 'store', 'shop',
                'gym', 'spa', 'salon', 'cafe', 'bar', 'hotel'
            ])
            
            if not is_commercial_query and detect_preconstruction_intent(user_message):
                logger.info(f"🏗️ [PRE-CONSTRUCTION] Intent detected in unified orchestrator")
                
                # Extract filters from unified state
                filters = unified_state.active_filters
                cached_location = filters.location or (filters.city if hasattr(filters, 'city') else None)
                
                # CRITICAL: Try manual city detection first (location_extractor sometimes fails)
                import re
                ontario_cities = ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan']
                detected_city = None
                for city in ontario_cities:
                    if re.search(r'\b' + re.escape(city.lower()) + r'\b', user_message.lower()):
                        detected_city = city
                        logger.info(f"📍 [PRE-CONSTRUCTION] Manual detection found: {city}")
                        break
                
                # Try location extractor if manual detection failed
                if not detected_city:
                    location_result = location_extractor.extract_location_entities(user_message)
                    detected_city = location_result.city or location_result.neighborhood
                
                # Use detected city, fallback to cached location
                if detected_city:
                    logger.info(f"📍 [PRE-CONSTRUCTION] Using location from message: {detected_city}")
                    location = detected_city
                    unified_state.active_filters.location = location
                elif cached_location:
                    logger.info(f"📍 [PRE-CONSTRUCTION] No location in message, using cached: {cached_location}")
                    location = cached_location
                else:
                    location = None
                
                # Search pre-construction properties
                precon_result = search_preconstruction_properties(
                    query=user_message,
                    city=location,
                    min_price=filters.min_price,
                    max_price=filters.max_price,
                    property_type=filters.property_type,
                    bedrooms=filters.bedrooms
                )
                
                properties = precon_result.get("properties", [])
                total_count = precon_result.get("total_count", 0)
                
                # Format response
                city_text = f" in {location}" if location else ""
                response_text = f"🏗️ I found {total_count} pre-construction project{'s' if total_count != 1 else ''}{city_text}! "
                
                if total_count > 0:
                    response_text += "These are brand new developments with the latest designs and amenities. "
                else:
                    response_text += "Try adjusting your search criteria or check back later for new projects."
                
                # Update state - use correct attributes
                unified_state.last_property_results = properties[:20]  # Max 20 as per field definition
                unified_state.search_count += 1
                if total_count == 0:
                    unified_state.zero_results_count += 1
                else:
                    unified_state.zero_results_count = 0  # Reset on success
                
                # Add assistant response to history
                unified_state.add_conversation_turn("assistant", response_text)
                
                # Update timestamp
                unified_state.updated_at = datetime.now()
                
                # Save state
                self.state_manager.save(unified_state)
                
                return {
                    "success": True,
                    "response": response_text,
                    "suggestions": ["Tell me more about these projects", "Show me other cities", "What amenities do they have?"],
                    "properties": properties[:50],
                    "property_count": total_count,
                    "filters": {
                        "location": location,
                        "min_price": filters.min_price,
                        "max_price": filters.max_price,
                        "property_type": filters.property_type,
                        "is_preconstruction": True
                    },
                    "source": "preconstruction",
                    "request_id": request_id
                }
            
            # STEP 1.2: Add user message to history (atomic append with timestamp validation)
            unified_state.add_conversation_turn("user", user_message)
            state.add_conversation_turn("user", user_message)
            
            # STEP 1.3: Sync unified state → legacy state if needed
            # This ensures legacy code paths still work
            self._sync_unified_to_legacy(unified_state, state)
            
            # ─────────────────────────────────────────────────────────────────
            # STEP 1.3.2: PROPERTY TYPE CHANGE DETECTION
            # ─────────────────────────────────────────────────────────────────
            # When user switches property type (e.g., commercial → residential),
            # clear irrelevant filters like bedrooms that don't make sense for new type
            if property_type_hint:
                current_property_type = unified_state.active_filters.property_type
                # Normalize property types for comparison
                current_type_lower = (current_property_type or "").lower()
                new_type_lower = property_type_hint.lower()
                
                # Map hint to normalized property type for comparison
                property_type_mapping = {
                    'commercial': 'commercial',
                    'residential': 'residential',
                    'condo': 'condo'
                }
                new_type_normalized = property_type_mapping.get(new_type_lower, new_type_lower)
                
                # Check if property type is changing
                if current_type_lower and new_type_normalized and current_type_lower != new_type_normalized:
                    logger.info(f"🔄 [PROPERTY TYPE CHANGE] Detected: {current_type_lower} → {new_type_normalized}")
                    
                    # Clear filters that don't carry over between property types
                    # Bedrooms from condo/commercial should not persist to residential search
                    # unless user explicitly mentions them in the new query
                    message_lower = user_message.lower()
                    bedroom_mentioned = any(kw in message_lower for kw in ['bedroom', 'bed', 'br', '1br', '2br', '3br', '4br', '5br'])
                    bathroom_mentioned = any(kw in message_lower for kw in ['bathroom', 'bath', 'ba'])
                    
                    if not bedroom_mentioned and unified_state.active_filters.bedrooms is not None:
                        logger.info(f"🧹 [FILTER CLEAR] Clearing bedrooms filter ({unified_state.active_filters.bedrooms}) on property type change (not mentioned in new query)")
                        unified_state.active_filters.bedrooms = None
                        state.bedrooms = None
                    
                    if not bathroom_mentioned and unified_state.active_filters.bathrooms is not None:
                        logger.info(f"🧹 [FILTER CLEAR] Clearing bathrooms filter ({unified_state.active_filters.bathrooms}) on property type change (not mentioned in new query)")
                        unified_state.active_filters.bathrooms = None
                        state.bathrooms = None
                    
                    # Clear business_type when switching FROM commercial
                    if current_type_lower == 'commercial' and new_type_normalized != 'commercial':
                        if hasattr(unified_state.active_filters, 'business_type') and unified_state.active_filters.business_type:
                            logger.info(f"🧹 [FILTER CLEAR] Clearing business_type ({unified_state.active_filters.business_type}) when switching from commercial")
                            unified_state.active_filters.business_type = None
                    
                    # Update property type
                    unified_state.active_filters.property_type = new_type_normalized.title()
                    state.property_type = new_type_normalized.title()
                    logger.info(f"✅ [PROPERTY TYPE CHANGE] Updated to: {new_type_normalized.title()}")
            
            # ─────────────────────────────────────────────────────────────────
            # STEP 1.3.5: ZERO RESULTS UX - View Results / Cached Results Check
            # ─────────────────────────────────────────────────────────────────
            # If user is asking to view results and we have cached results, reuse them
            # This avoids redundant MLS calls when user just wants to see what we have
            if unified_state.is_view_results_request(user_message):
                logger.info(f"📋 [VIEW RESULTS] User requesting to view accumulated results")
                
                if unified_state.last_property_results:
                    # User wants to see cached results - skip MLS, return cached
                    logger.info(f"✅ [CACHE HIT] Returning {len(unified_state.last_property_results)} cached results")
                    
                    # Standardize cached properties before returning
                    standardize_property_data = get_standardize_property_data()
                    formatted_cached_properties = []
                    for i, prop in enumerate(unified_state.last_property_results[:10]):
                        formatted_prop = standardize_property_data(prop)
                        formatted_cached_properties.append(formatted_prop)
                        logger.debug(f"✅ [CACHED] Property {i+1}: mls={formatted_prop.get('mls_number', 'N/A')}, price={formatted_prop.get('price')}")
                    
                    # Set stage to VIEWING since we're showing results
                    unified_state.set_conversation_stage(ConversationStage.VIEWING)
                    
                    response = (
                        f"Here are the best options I found based on your criteria! "
                        f"I have {len(unified_state.last_property_results)} properties that match."
                    )
                    
                    # Add assistant response to history
                    unified_state.add_conversation_turn("assistant", response)
                    state.add_conversation_turn("assistant", response)
                    
                    # Save states with error handling
                    self._save_state_with_error_handling(unified_state, state)
                    
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": [
                            "Show me more details on the first one",
                            "Refine my search",
                            "Search a different area"
                        ],
                        "properties": formatted_cached_properties,
                        "property_count": len(unified_state.last_property_results),
                        "state_summary": unified_state.get_summary(),
                        "filters": unified_state.get_active_filters(),
                        "intent": "view_cached_results",
                        "mode": "normal",
                        "cached_results": True,
                        "metadata": self._create_metadata_dict(
                            intent="view_cached_results",
                            confidence=0.98,
                            reason="User requesting to view accumulated cached results",
                            cache_hit=True,
                            used_gpt_fallback=False,
                            requires_confirmation=False
                        )
                    }
                
                elif unified_state.zero_results_count >= 2:
                    # Repeated zero results - suggest filter relaxation
                    logger.info(f"⚠️ [ZERO RESULTS] {unified_state.zero_results_count} consecutive zero-result searches")
                    
                    suggestions_list = unified_state.get_relaxation_suggestions()
                    relaxation_msg = unified_state.suggest_filter_relaxation()
                    
                    response = (
                        f"I haven't found any properties matching your exact criteria yet. "
                        f"{relaxation_msg}"
                    )
                    
                    # Add assistant response to history
                    unified_state.add_conversation_turn("assistant", response)
                    state.add_conversation_turn("assistant", response)
                    
                    # Save states with error handling
                    self._save_state_with_error_handling(unified_state, state)
                    
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": suggestions_list[:3] if suggestions_list else [
                            "Remove price limit",
                            "Search nearby areas",
                            "Try fewer bedrooms"
                        ],
                        "properties": [],
                        "property_count": 0,
                        "state_summary": unified_state.get_summary(),
                        "filters": unified_state.get_active_filters(),
                        "intent": "suggest_relaxation",
                        "mode": "zero_results",
                        "zero_results_count": unified_state.zero_results_count
                    }
            
            # STEP 1.4: Check if responding to pending confirmation OR requirements
            # Use ConfirmationManager for robust UUID-based confirmation tracking
            is_answering_confirmation = self.confirmation_manager.has_pending_confirmation(session_id)
            # Check both unified and legacy state for awaiting_requirements mode
            is_answering_requirements = (
                unified_state.metadata.conversation_stage == ConversationStage.CONFIRMATION.value
                or (hasattr(state, 'conversation_mode') and state.conversation_mode == "awaiting_requirements")
            )
            
            # Initialize flags for special handling
            came_from_requirements = False
            applied_location_in_requirements = None
            
            if is_answering_confirmation:
                pending_confirmation = self.confirmation_manager.get_active_confirmation(session_id)
                if pending_confirmation:
                    confirmation_type = pending_confirmation.type.value
                    logger.info(f"💬 [CONFIRMATION RESPONSE] User responding to pending confirmation: {confirmation_type}")
                    logger.info(f"🔒 [MODE] Conversation stage: {unified_state.metadata.conversation_stage}")
            elif is_answering_requirements:
                logger.info(f"📝 [REQUIREMENTS RESPONSE] User providing requirements after location change")
                logger.info(f"🔒 [MODE] Conversation stage: {unified_state.metadata.conversation_stage}")
            
            # 🔧 PRIORITY #0: Requirements responses NEVER go through confirmation logic
            # Rule: If bot asked "Any specific requirements?", the response is ALWAYS about filters
            # Even if user says "no" or "yes 3 beds", it's NOT a confirmation!
            if is_answering_requirements:
                logger.info(f"✅ [PRIORITY #0] Requirements mode - treating as filter specification")
                logger.info(f"✅ [PRIORITY #0] Will extract filters from: '{user_message}'")
                # Force classification as PROPERTY_SEARCH so filters get extracted
                classified_intent = UserIntent.PROPERTY_SEARCH
                intent_metadata = {
                    'reason': 'Requirements response - always extract filters',
                    'confidence': 'high',
                    'requires_confirmation': False,
                    'suggested_action': None
                }
            # 🔧 PRIORITY #1: Confirmation responses take ABSOLUTE precedence
            # If we're awaiting confirmation and user says a confirmation word, 
            # NEVER try to classify it as a search intent
            elif state.conversation_mode == "awaiting_confirmation" and is_confirmation_word(user_message):
                logger.info(f"✅ [PRIORITY #1] Confirmation word detected in awaiting_confirmation mode")
                logger.info(f"✅ [PRIORITY #1] Skipping intent classification - will handle in confirmation override")
                # Skip intent classification entirely - we know this is a confirmation response
                classified_intent = UserIntent.PROPERTY_SEARCH  # Will be used if confirmation applies successfully
                intent_metadata = {
                    'reason': 'Confirmation response - classification bypassed',
                    'confidence': 'high',
                    'requires_confirmation': False,
                    'suggested_action': None
                }
            elif state.conversation_mode == "awaiting_confirmation":
                # User is responding to confirmation but NOT with a simple confirmation word
                # This could be "no make it 3 beds" or other modifications
                logger.info(f"✅ [PRIORITY #1] Response in awaiting_confirmation mode (non-standard confirmation)")
                logger.info(f"✅ [PRIORITY #1] Will process in confirmation override - skipping normal classification")
                # Set to PROPERTY_SEARCH as we're likely modifying filters
                classified_intent = UserIntent.PROPERTY_SEARCH
                intent_metadata = {
                    'reason': 'Response during confirmation - treating as property search',
                    'confidence': 'high',
                    'requires_confirmation': False,
                    'suggested_action': None
                }
            else:
                # STEP 1.4.5: ADDRESS PRIORITY CHECK (HIGHEST PRIORITY)
                # Check for address/street search BEFORE standard intent classification
                if not skip_address_detection:
                    address_detector = get_address_intent_detector()
                    address_result = address_detector.detect_intent(
                        user_message, 
                        current_location=state.get_active_filters().get('location')
                    )
                    
                    if address_result.intent_type != AddressIntentType.NOT_ADDRESS:
                        logger.info(f"🏠 [ADDRESS PRIORITY] Detected {address_result.intent_type.value} - skipping confirmation logic")
                        logger.info(f"🏠 [ADDRESS PRIORITY] Components: {address_result.components.raw_input}")
                        
                        # RULE: Handle MLS lookup - BUT check for valuation request first!
                        if address_result.intent_type == AddressIntentType.MLS_LOOKUP:
                            mls_number = address_result.components.mls_number
                            
                            # CHECK: Is this actually a valuation request with an MLS number?
                            # Valuation keywords that should route to valuation handler instead
                            valuation_keywords = [
                                'valuation', 'estimate', 'worth', 'value', 'appraisal',
                                'what is it worth', 'how much is', 'price estimate',
                                'property valuation', 'home value', 'ai valuation'
                            ]
                            user_message_lower = user_message.lower()
                            is_valuation_request = any(kw in user_message_lower for kw in valuation_keywords)
                            
                            if is_valuation_request:
                                logger.info(f"💰 [MLS+VALUATION] Detected valuation request with MLS: {mls_number}")
                                logger.info(f"💰 [MLS+VALUATION] Routing to valuation handler instead of MLS lookup")
                                # Route to valuation handler with the MLS number
                                return self._handle_valuation_request(state, user_message)
                            
                            # Normal MLS lookup (no valuation keywords)
                            logger.info(f"🏷️ [MLS LOOKUP] Processing MLS: {mls_number}")
                            return self._handle_mls_lookup(
                                session_id=session_id,
                                user_message=user_message,
                                mls_number=mls_number,
                                state=state
                            )
                        
                        # RULE: Check for postal code exclusivity - clear street context if postal detected
                        extracted_location = location_extractor.extract_location_entities(user_message)
                        if extracted_location.postalCode:
                            logger.info(f"📮 [POSTAL CODE EXCLUSIVITY] Postal code detected: {extracted_location.postalCode} - clearing street context")
                            # Clear street/address context for postal code search
                            unified_state.clear_address_context()
                            # Handle as postal code search instead of address search
                            # CRITICAL: Pass property_type_hint so postal code handler knows to filter for commercial/residential
                            return self._handle_postal_code_search(
                                session_id=session_id,
                                user_message=user_message,
                                postal_code=extracted_location.postalCode,
                                city=extracted_location.city,
                                state=state,
                                property_type_hint=property_type_hint  # NEW: Pass button selection
                            )
                        
                        # Handle address search immediately (no confirmation needed)
                        # BUT: Check if commercial button was selected - commercial properties don't use intersection search
                        if property_type_hint == 'commercial':
                            logger.info(f"🏢 [COMMERCIAL OVERRIDE] Commercial button selected - skipping address handler, will use commercial search")
                            # Don't return early - let it fall through to commercial search logic below
                            pass
                        else:
                            # Residential/Condo - use address handler (intersection search works here)
                            return self._handle_address_search(
                                session_id=session_id,
                                user_message=user_message,
                                address_result=address_result,
                                state=state
                            )
                
                # STEP 1.5: HYBRID INTENT CLASSIFICATION (LOCAL-FIRST + GPT-4 fallback)
                # This is the SINGLE source of truth for intent detection
                logger.info("🎯 [HYBRID INTENT] Classifying user intent (local-first)...")
                
                # Build context for classification
                filters_dict = unified_state.get_active_filters()
                context = {
                    "has_previous_results": bool(unified_state.last_property_results),
                    "conversation_stage": unified_state.metadata.conversation_stage if unified_state.metadata else None,
                    "last_search_count": len(unified_state.last_property_results)
                }
                
                # Classify using HybridIntentClassifier (95%+ local, < 5ms)
                classified_intent, intent_metadata = intent_classifier.classify(
                    user_message=user_message,
                    current_filters=filters_dict,
                    context=context
                )
                
                # Store classified intent in state
                state.last_classification_intent = classified_intent.value
                
                # Structured logging for monitoring
                logger.info(
                    f"intent_classified | "
                    f"session_id={session_id} | "
                    f"intent={classified_intent.value} | "
                    f"confidence={intent_metadata.get('confidence', 0):.2f} | "
                    f"reason={intent_metadata.get('reason', 'N/A')} | "
                    f"cache_hit={intent_metadata.get('cache_hit', False)} | "
                    f"gpt_fallback={intent_metadata.get('used_gpt_fallback', False)} | "
                    f"requires_confirmation={intent_metadata.get('requires_confirmation', False)}"
                )
                
                # Warn on low confidence (< 0.5)
                confidence = intent_metadata.get('confidence', 0)
                if confidence < 0.5:
                    logger.warning(
                        f"⚠️ LOW CONFIDENCE INTENT | "
                        f"session_id={session_id} | "
                        f"intent={classified_intent.value} | "
                        f"confidence={confidence:.2f} | "
                        f"reason={intent_metadata.get('reason')} | "
                        f"message='{user_message[:50]}...'"
                    )
                    
                    # For very low confidence, ask clarifying question
                    if confidence < 0.5:
                        response = (
                            "I want to make sure I understand what you're looking for. "
                            "Could you provide more details? For example, are you searching for "
                            "properties in a specific location, or do you have a budget in mind?"
                        )
                        suggestions = [
                            "Show me condos in Toronto",
                            "Find houses under 800k",
                            "I'm looking for 2 bedroom apartments"
                        ]
                        state.add_conversation_turn("assistant", response)
                        self.state_manager.save(state)
                        return {
                            "success": True,
                            "response": response,
                            "suggestions": suggestions,
                            "properties": [],
                            "property_count": 0,
                            "state_summary": state.get_summary(),
                            "filters": state.get_active_filters(),
                            "intent": "clarification_needed",
                            "low_confidence": True,
                            "confidence": confidence,
                            "metadata": {
                                "intent": classified_intent.value if classified_intent else "clarification_needed",
                                "confidence": confidence,
                                "reason": intent_metadata.get('reason', 'Low confidence'),
                                "cache_hit": intent_metadata.get('cache_hit', False),
                                "used_gpt_fallback": intent_metadata.get('used_gpt_fallback', False),
                                "requires_confirmation": True
                            }
                        }
            
            # STEP 1.6: Handle special intents from HybridIntentClassifier
            # These intents are handled immediately without further GPT processing
            
            # Handle VALUATION - Route to valuation pipeline
            if classified_intent == UserIntent.VALUATION:
                logger.info("💰 [VALUATION] Detected valuation request, routing to valuation handler")
                return self._handle_valuation_request(state, user_message)
            
            # Handle GENERAL_QUESTION - Route to general knowledge/market info
            if classified_intent == UserIntent.GENERAL_QUESTION:
                logger.info("❓ [GENERAL_QUESTION] Detected general question, routing to knowledge handler")
                return self._handle_general_question(state, user_message)
            
            # Handle GENERAL_CHAT - Friendly response without search
            if classified_intent == UserIntent.GENERAL_CHAT:
                logger.info("💬 [GENERAL_CHAT] Detected general chat (greeting/help), responding gracefully")
                return self._handle_general_question(state, user_message)
            
            # Handle OFF_TOPIC - Never trigger MLS search
            if classified_intent == UserIntent.OFF_TOPIC:
                logger.info("🚫 [OFF-TOPIC] Detected off-topic message, responding gracefully")
                response = (
                    "I'm here to help you find properties and learn about real estate! "
                    "Let me know if you'd like to search for properties, learn about neighborhoods, "
                    "or get market insights in any location."
                )
                suggestions = [
                    "Show me properties in Toronto",
                    "Find condos in Vancouver",
                    "Tell me about neighborhoods"
                ]
                state.add_conversation_turn("assistant", response)
                self.state_manager.save(state)
                return {
                    "success": True,
                    "response": response,
                    "suggestions": suggestions,
                    "properties": [],
                    "property_count": 0,
                    "state_summary": state.get_summary(),
                    "filters": state.get_active_filters(),
                    "metadata": {
                        "intent": classified_intent.value,
                        "confidence": intent_metadata.get('confidence', 0),
                        "reason": intent_metadata.get('reason', 'N/A'),
                        "cache_hit": intent_metadata.get('cache_hit', False),
                        "used_gpt_fallback": intent_metadata.get('used_gpt_fallback', False),
                        "requires_confirmation": intent_metadata.get('requires_confirmation', False)
                    }
                }
            
            # Handle CONFIRMATION_NEEDED - Ask what user wants to change
            if classified_intent == UserIntent.CONFIRMATION_NEEDED:
                logger.info("❓ [CONFIRMATION] User request is vague, asking for clarification")
                
                # Build confirmation message based on current filters
                current_filters = state.get_active_filters()
                filter_parts = []
                if current_filters.get('location'):
                    filter_parts.append(f"location ({current_filters['location']})")
                if current_filters.get('bedrooms'):
                    filter_parts.append(f"bedrooms ({current_filters['bedrooms']})")
                if current_filters.get('property_type'):
                    filter_parts.append(f"property type ({current_filters['property_type']})")
                if current_filters.get('max_price'):
                    filter_parts.append(f"budget (under ${current_filters['max_price']:,})")
                
                if filter_parts:
                    response = (
                        f"I can show you other properties, but would you like to change any of your "
                        f"current criteria? Currently searching for: {', '.join(filter_parts)}."
                    )
                    suggestions = [
                        "Change the location",
                        "Adjust the budget",
                        "Different property type",
                        "Keep the same criteria"
                    ]
                else:
                    response = "I'd be happy to show you properties! Could you tell me what you're looking for? For example, location, property type, or budget?"
                    suggestions = [
                        "Show me condos in Toronto",
                        "Find houses under 800k",
                        "I'm looking for rentals"
                    ]
                
                # Set pending confirmation using ConfirmationManager
                confirmation_id = self.confirmation_manager.create_confirmation(
                    session_id=session_id,
                    confirmation_type=ConfirmationType.VAGUE_REQUEST,
                    question=response,
                    payload={"original_message": user_message, "current_filters": current_filters}
                )
                
                state.add_conversation_turn("assistant", response)
                self.state_manager.save(state)
                return {
                    "success": True,
                    "response": response,
                    "suggestions": suggestions,
                    "properties": [],
                    "property_count": 0,
                    "state_summary": state.get_summary(),
                    "filters": state.get_active_filters(),
                    "intent": "confirmation_needed",
                    "requires_confirmation": True
                }
            
            # Handle PROPERTY_CHANGE_REQUEST - SEAMLESS Location change (NO confirmation prompts)
            # User requested: "if one query is of ottawa...and another is of toronto...
            # it should give properties accordingly no need to ask 'are you switching from ottawa to toronto'"
            if classified_intent == UserIntent.PROPERTY_CHANGE_REQUEST:
                logger.info("🌆 [LOCATION CHANGE] Detected location change - switching SEAMLESSLY (no confirmation)")
                
                old_location = intent_metadata.get('old_location', 'previous location')
                new_location = intent_metadata.get('new_location', 'new location')
                current_filters = state.get_active_filters()
                
                # Extract the NEW location
                logger.info(f"📍 [LOCATION CHANGE] Extracting NEW location from: '{user_message}'")
                previous_location = state.location_state if hasattr(state, 'location_state') else LocationState()
                new_location_state = location_extractor.extract_location_entities(
                    user_message,
                    previous_location=previous_location
                )
                logger.info(f"✅ [LOCATION CHANGE] Switching: {old_location} → {new_location} (seamless, no prompt)")
                
                # SEAMLESS SWITCH: Update location immediately and execute search
                # Clear previous results but keep other filters
                state.location_state = new_location_state
                state.location = new_location_state.city if new_location_state.city else new_location
                state.last_property_results = []  # Clear old results
                
                # Also update unified state
                unified_state.location_state.city = new_location_state.city if new_location_state.city else new_location
                unified_state.active_filters.location = new_location_state.city if new_location_state.city else new_location
                unified_state.last_property_results = []  # Clear old results
                
                # Save state
                self._save_state_with_error_handling(unified_state, state)
                
                # Execute search immediately with new location (keeping other filters)
                logger.info(f"🔍 [SEAMLESS SEARCH] Executing search in new location: {new_location}")
                return self._execute_property_search(
                    state=unified_state,
                    user_message=user_message,
                    session_id=session_id,
                    intent_reason=f"Seamless location switch: {old_location} → {new_location}",
                    confirmation_result="location_switched_seamlessly"
                )
            
            # STEP 2: Build session summary for interpreter (with clarification context)
            # FIX #2: Check if the last assistant message was a clarifying question
            last_turn = state.conversation_history[-2] if len(state.conversation_history) >= 2 else None
            pending_clarification = None
            if last_turn and last_turn.get('role') == 'assistant':
                last_content = last_turn.get('content', '')
                if '?' in last_content:
                    pending_clarification = last_content
            
            # 🔧 FIX: Include recent conversation turns for location context
            # Get last 2 user messages to preserve location mentioned in previous turn
            recent_conversation = []
            for turn in reversed(state.conversation_history[-4:]):  # Last 4 turns (2 user + 2 assistant)
                if turn.get('role') == 'user':
                    recent_conversation.insert(0, turn.get('content', ''))
                    if len(recent_conversation) >= 2:  # Keep last 2 user messages
                        break
            
            session_summary = {
                "filters": state.get_active_filters(),
                "last_search_count": len(state.last_property_results),
                "search_count": state.search_count,
                "last_search_results": state.last_property_results[:3] if state.last_property_results else [],
                "pending_clarification": pending_clarification,  # NEW: helps interpreter understand context
                "recent_user_messages": recent_conversation  # 🔧 FIX: Include recent messages for location context
            }
            
            # STEP 3: Extract location entities FIRST (before GPT interpreter)
            logger.info("📍 Extracting location entities...")
            previous_location = state.location_state if hasattr(state, 'location_state') else LocationState()
            
            # 🔧 CRITICAL FIX: NEVER extract from confirmation words
            if is_confirmation_word(user_message):
                if state.conversation_mode == "awaiting_confirmation":
                    # This is a confirmation response - location already applied
                    logger.info(f"✅ [CONFIRMATION] '{user_message}' is confirmation word in awaiting_confirmation mode - using existing location")
                    extracted_location = state.location_state
                else:
                    # ═══════════════════════════════════════════════════════════════
                    # SMART CONTEXT: Check if user is confirming a zero-results suggestion
                    # ═══════════════════════════════════════════════════════════════
                    # If last assistant message suggested broadening filters, "sure" should
                    # trigger a broader search, not be treated as general chat
                    
                    last_assistant_msg = ""
                    if len(state.conversation_history) >= 2:
                        for turn in reversed(state.conversation_history[:-1]):  # Exclude current user msg
                            if turn.get('role') == 'assistant':
                                last_assistant_msg = turn.get('content', '').lower()
                                break
                    
                    # Patterns that indicate assistant suggested broadening the search
                    broaden_patterns = [
                        'different bedroom', 'any bedroom', 'remove bedroom',
                        'different bathroom', 'any bathroom',
                        'different price', 'any price', 'flexible budget',
                        'broader search', 'expand', 'widen',
                        'any properties', 'all properties', 'without filter',
                        'couldn\'t find', 'no results', 'no properties',
                        'would you like to see', 'would you prefer'
                    ]
                    
                    is_broadening_response = any(p in last_assistant_msg for p in broaden_patterns)
                    
                    logger.info(f"🔍 [BROADEN CHECK] last_assistant_msg: '{last_assistant_msg[:100]}...' | is_broadening_response={is_broadening_response} | zero_results_count={unified_state.zero_results_count}")
                    
                    if is_broadening_response and unified_state.zero_results_count >= 1:
                        logger.info(f"✅ [ZERO RESULTS CONFIRMATION] User said '{user_message}' to broaden search - clearing restrictive filters")
                        
                        # Clear restrictive filters to broaden search
                        current_location = unified_state.active_filters.location or state.location
                        current_property_type = unified_state.active_filters.property_type
                        
                        # Clear bedrooms/bathrooms
                        unified_state.active_filters.bedrooms = None
                        unified_state.active_filters.bathrooms = None
                        state.bedrooms = None
                        state.bathrooms = None
                        
                        # Reset zero results count since we're trying broader search
                        unified_state.zero_results_count = 0
                        
                        logger.info(f"🔍 [BROADER SEARCH] Executing search with cleared filters in: {current_location}")
                        
                        # Execute search with broader filters
                        return self._execute_property_search(
                            state=unified_state,
                            user_message=f"show me any {current_property_type or 'residential'} properties in {current_location}",
                            session_id=session_id,
                            intent_reason="User confirmed to broaden search after zero results",
                            confirmation_result="filters_broadened"
                        )
                    
                    # Original behavior: confirmation word without pending confirmation = general chat
                    logger.info(f"💬 [GENERAL CHAT] '{user_message}' is confirmation word with no pending confirmation - treating as chat")
                    response = "I'm here to help! What would you like to know about real estate in Toronto and the GTA?"
                    state.add_conversation_turn("assistant", response)
                    self.state_manager.save(state)
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": ["Show me properties in Toronto", "Find condos under $800K", "Properties with 3 bedrooms"],
                        "properties": [],
                        "property_count": 0,
                        "state_summary": state.get_summary(),
                        "filters": state.get_active_filters(),
                        "metadata": self._create_metadata_dict(
                            intent="general_chat",
                            confidence=0.95,
                            reason="Confirmation word without pending confirmation context"
                        )
                    }
            
            # 🔧 NEW FIX: If requirements mode already applied location, SKIP extraction
            elif is_answering_requirements and state.location_state:
                # Location was already applied in requirements handler from pending context
                # Don't let location extraction override it from conversation history
                logger.info(f"✅ [REQUIREMENTS] Using already-applied location state: {state.location_state.get_summary()}")
                extracted_location = state.location_state
            else:
                # Normal extraction flow
                message_for_location = user_message
                extracted_location = location_extractor.extract_location_entities(
                    message_for_location,
                    previous_location=previous_location
                )
                logger.info(f"📍 Extracted location: {extracted_location.get_summary()}")
            
            # STEP 3.5: POSTAL CODE CONFIRMATION CHECK
            # If postal code is provided WITHOUT city, ask user to confirm city
            if extracted_location.postalCode and not extracted_location.city:
                # Check if user is responding with "same city"
                message_lower = user_message.lower().strip()
                same_city_patterns = [
                    'same city', 'same location', 'same area', 'this city', 'current city'
                ]
                
                if any(pattern in message_lower for pattern in same_city_patterns):
                    # Reuse previous city
                    if previous_location and previous_location.city:
                        extracted_location.city = previous_location.city
                        logger.info(f"📮 [POSTAL CODE] User said 'same city', reusing: {previous_location.city}")
                    else:
                        # No previous city to reuse, ask for city
                        logger.info(f"📮 [POSTAL CODE] User said 'same city' but no previous city found")
                        response = (
                            f"I found postal code {extracted_location.postalCode}, but I need to know which city "
                            f"you're searching in. Could you please specify the city?"
                        )
                        suggestions = [
                            f"{extracted_location.postalCode} in Toronto",
                            f"{extracted_location.postalCode} in Mississauga",
                            f"{extracted_location.postalCode} in Vaughan"
                        ]
                        
                        confirmation_id = self.confirmation_manager.create_confirmation(
                            session_id=session_id,
                            confirmation_type=ConfirmationType.POSTAL_CODE_CITY,
                            question=response,
                            payload={
                                "postal_code": extracted_location.postalCode,
                                "original_message": user_message
                            }
                        )
                        
                        state.add_conversation_turn("assistant", response)
                        self.state_manager.save(state)
                        return {
                            "success": True,
                            "response": response,
                            "suggestions": suggestions,
                            "properties": [],
                            "property_count": 0,
                            "state_summary": state.get_summary(),
                            "filters": state.get_active_filters(),
                            "requires_confirmation": True,
                            "metadata": self._create_metadata_dict(
                                intent="postal_code_confirmation",
                                confidence=0.85,
                                reason="Postal code detected, asking for city confirmation",
                                requires_confirmation=True
                            )
                        }
                else:
                    # Try to auto-detect city from postal code
                    from services.postal_code_validator import postal_code_validator
                    suggested_city = postal_code_validator.suggest_city_for_postal(extracted_location.postalCode)
                    
                    if suggested_city:
                        # We know the city for this postal code - use it automatically
                        logger.info(f"✅ [POSTAL CODE AUTO-DETECT] Postal code {extracted_location.postalCode} → {suggested_city}")
                        extracted_location.city = suggested_city
                        # No confirmation needed - continue with GPT interpreter
                    else:
                        # 🗺️  Use AI to resolve postal code to city automatically
                        logger.info(f"🤖 [AI LOCATION RESOLVER] Using OpenAI to resolve postal code '{extracted_location.postalCode}' to city")
                        try:
                            ai_resolved_city = self._resolve_postal_code_to_city(extracted_location.postalCode)
                            if ai_resolved_city:
                                logger.info(f"✅ [AI RESOLVED] Postal code {extracted_location.postalCode} → {ai_resolved_city}")
                                extracted_location.city = ai_resolved_city
                                # Continue with GPT interpreter - no confirmation needed
                            else:
                                # Fallback: use Toronto as default for GTA postal codes starting with M
                                if extracted_location.postalCode.upper().startswith('M'):
                                    logger.info(f"⚠️  [FALLBACK] Using Toronto as default for postal code {extracted_location.postalCode}")
                                    extracted_location.city = "Toronto"
                                else:
                                    logger.warning(f"⚠️  [AI RESOLVER FAILED] Could not resolve {extracted_location.postalCode}, using as-is")
                        except Exception as e:
                            logger.error(f"❌ [AI RESOLVER ERROR] {e}")
                            # Fallback for GTA postal codes
                            if extracted_location.postalCode.upper().startswith('M'):
                                extracted_location.city = "Toronto"
                                logger.info(f"⚠️  [FALLBACK] Using Toronto for postal code {extracted_location.postalCode}")
            
            # STEP 3.9: Handle awaiting_requirements mode
            # If bot asked "Any specific requirements?" and user responded
            if is_answering_requirements:
                logger.info(f"📝 [REQUIREMENTS] Processing requirements response")
                requirements_context = state.pending_requirements_context
                
                # Apply the new location first
                if requirements_context.get('new_location_state'):
                    new_location_state = LocationState(**requirements_context['new_location_state'])
                    state.location_state = new_location_state
                    if new_location_state.city:
                        state.location = new_location_state.city
                    logger.info(f"📍 [REQUIREMENTS] Applied location: {state.location}")
                
                # Check if user said "no" (meaning no filters, proceed with search)
                user_message_clean = user_message.strip().lower()
                if user_message_clean in ['no', 'nope', 'no thanks', 'no preference', 'nothing specific', 'no filters needed']:
                    logger.info(f"✅ [REQUIREMENTS] User declined to add filters - proceeding with search")
                    # Clear requirements mode
                    state.conversation_mode = "normal"
                    state.pending_requirements_context = {}
                    
                    # Create a custom response that's clear about what's happening
                    location_name = state.location or "this area"
                    custom_message = f"Alright! Here are the available properties in {location_name}."
                    
                    # Execute search with current location, no additional filters
                    search_result = self._execute_property_search(
                        state=state,
                        session_summary=session_summary,
                        user_message=custom_message,  # Use our custom message
                        session_id=session_id
                    )
                    # Override the response message to be more user-friendly
                    if search_result.get('success'):
                        search_result['message'] = custom_message
                        search_result['agent_response'] = custom_message
                    return search_result
                
                # Check if user said "yes" (asking for help with filters)
                elif user_message_clean in ['yes', 'yeah', 'yep', 'sure', 'okay']:
                    logger.info(f"✅ [REQUIREMENTS] User wants to add filters - asking for specifics")
                    # Stay in requirements mode and ask for specific filters
                    response = "Sure! What filters would you like to apply? For example: 2 bedrooms, under $900K, condo, etc."
                    suggestions = [
                        "2 bedrooms",
                        "Under $800K", 
                        "Condos only"
                    ]
                    
                    state.add_conversation_turn("assistant", response)
                    self.state_manager.save(state)
                    
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": suggestions,
                        "properties": [],
                        "property_count": 0,
                        "state_summary": state.get_summary(),
                        "filters": state.get_active_filters(),
                        "intent": "awaiting_filter_details"
                    }
                
                # Otherwise, extract filters from user message and proceed
                # The message will go through normal GPT-4 interpreter below
                logger.info(f"📝 [REQUIREMENTS] Extracting filters from: '{user_message}'")
                # CRITICAL: Remember that we just applied a location in requirements mode
                came_from_requirements = True
                applied_location_in_requirements = state.location
                state.conversation_mode = "normal"  # Reset mode
                state.pending_requirements_context = {}
                # Continue to GPT-4 interpreter to extract filters
            
            # STEP 4: Call GPT-4 interpreter
            interpreter_out = ask_gpt_interpreter(session_summary, user_message)
            intent = interpreter_out.get("intent", "general_question")
            
            # STEP 4.0: CRITICAL FIX - Handle both nested and flat filter formats from GPT
            # GPT sometimes returns {"filters": {"bedrooms": 5}} and sometimes {"bedrooms": 5}
            filters_from_gpt = interpreter_out.get("filters", {})
            if not filters_from_gpt:
                # If no nested filters, check for flat format
                flat_filters = {}
                filter_keys = ["location", "property_type", "bedrooms", "bathrooms", "min_price", "max_price", 
                              "min_sqft", "max_sqft", "listing_type", "amenities", "list_date_from", "list_date_to",
                              "business_type", "street_name", "area", "postal_code"]  # Added commercial fields
                for key in filter_keys:
                    if key in interpreter_out:
                        flat_filters[key] = interpreter_out[key]
                
                if flat_filters:
                    logger.info(f"🔧 [FORMAT FIX] GPT returned flat format, converted to nested: {flat_filters}")
                    filters_from_gpt = flat_filters
            
            merge = interpreter_out.get("merge_with_previous", True)
            clarifying = interpreter_out.get("clarifying_question")
            
            # STEP 4.1: CRITICAL FIX - Override merge decision for pending clarification responses
            if session_summary.get("pending_clarification"):
                logger.info(f"🔧 [PENDING CLARIFICATION FIX] User responding to clarifying question - forcing merge=True to preserve existing filters")
                logger.info(f"🔧 [PENDING CLARIFICATION FIX] Previous question: '{session_summary['pending_clarification']}'")
                merge = True  # Always merge when responding to clarification to preserve existing filters
            
            logger.info(f"🎯 Intent: {intent}")
            logger.info(f"🎯 Merge with previous: {merge}")
            logger.debug(f"Filters from GPT: {filters_from_gpt}")
            
            # STEP 5: Merge extracted location into filters
            if came_from_requirements and applied_location_in_requirements:
                # 🔧 CRITICAL FIX: Don't override location applied in requirements mode
                logger.info(f"✅ [REQUIREMENTS FIX] Preserving location from requirements: {applied_location_in_requirements}")
                logger.info(f"🚫 [REQUIREMENTS FIX] Ignoring GPT location extraction to prevent override")
                filters_from_gpt['location'] = applied_location_in_requirements
                # Create location_state from the preserved location
                if not filters_from_gpt.get('location_state') or not filters_from_gpt['location_state'].city:
                    preserved_location_state = LocationState(city=applied_location_in_requirements)
                    filters_from_gpt['location_state'] = preserved_location_state
                    logger.info(f"✅ [REQUIREMENTS FIX] Created location_state: {preserved_location_state.get_summary()}")
            elif not extracted_location.is_empty():
                # Normal flow: Add location entities to filters
                if extracted_location.city:
                    filters_from_gpt['location'] = extracted_location.city
                
                # Store full location_state for later use
                filters_from_gpt['location_state'] = extracted_location
                logger.info(f"✅ Added location_state to filters: {extracted_location.get_summary()}")
            
            # STEP 5.3: NEW - Validate location extraction with hybrid system
            # This catches cases where GPT-4 returns wrong city (e.g., user says "Ottawa" but GPT returns "Toronto")
            location_validator = get_location_validator()
            llm_city = filters_from_gpt.get('location')
            previous_city = state.location
            
            # Prepare LLM candidates
            llm_candidates = []
            if llm_city:
                llm_candidates = [{"city": llm_city, "confidence": 0.85}]
            
            # Validate location
            validation_result = location_validator.validate_location_extraction(
                user_text=user_message,
                llm_candidates=llm_candidates,
                previous_city=previous_city,
                session_id=session_id,
                message_id=f"msg_{datetime.now().timestamp()}"
            )
            
            logger.info(f"🔍 [LOCATION_VALIDATION] Result: city={validation_result.final_city}, "
                       f"source={validation_result.source}, confidence={validation_result.confidence:.2f}")
            
            # Handle validation results
            if validation_result.needs_confirmation:
                # Location ambiguous - ask user to choose
                logger.warning(f"⚠️ [LOCATION_VALIDATION] Ambiguous location - asking user for confirmation")
                clarifying = f"I found multiple possible locations: {', '.join(validation_result.confirmation_choices)}. Which one did you mean?"
                # Don't update location yet - wait for user confirmation
            elif validation_result.final_city and validation_result.final_city != llm_city:
                # Deterministic override - GPT-4 was wrong!
                logger.warning(f"🔧 [LOCATION_VALIDATION] Override: LLM said '{llm_city}' but deterministic found '{validation_result.final_city}'")
                filters_from_gpt['location'] = validation_result.final_city
                # Update location_state if it exists
                if 'location_state' in filters_from_gpt:
                    filters_from_gpt['location_state'].city = validation_result.final_city
                else:
                    # Create new location_state - PRESERVE existing postal code from state!
                    new_location_state = LocationState()
                    new_location_state.city = validation_result.final_city
                    # CRITICAL: Preserve postal code from current state during refinements
                    if state.location_state and state.location_state.postalCode:
                        new_location_state.postal_code = state.location_state.postalCode
                        logger.info(f"📮 [LOCATION_VALIDATION] Preserved postal code: {state.location_state.postalCode}")
                    filters_from_gpt['location_state'] = new_location_state
                logger.info(f"✅ [LOCATION_VALIDATION] Corrected location to: {validation_result.final_city}")
            elif validation_result.final_city:
                # Validation passed - use the validated city
                filters_from_gpt['location'] = validation_result.final_city
                # CRITICAL FIX: Also create location_state if it doesn't exist
                if 'location_state' not in filters_from_gpt or filters_from_gpt['location_state'].is_empty():
                    new_location_state = LocationState()
                    new_location_state.city = validation_result.final_city
                    # CRITICAL: Preserve postal code from current state during refinements
                    if state.location_state and state.location_state.postalCode:
                        new_location_state.postal_code = state.location_state.postalCode
                        logger.info(f"📮 [LOCATION_VALIDATION] Preserved postal code: {state.location_state.postalCode}")
                    filters_from_gpt['location_state'] = new_location_state
                    logger.info(f"✅ [LOCATION_VALIDATION] Created location_state: {new_location_state.get_summary()}")
                else:
                    # Update existing location_state
                    filters_from_gpt['location_state'].city = validation_result.final_city
                logger.info(f"✅ [LOCATION_VALIDATION] Validated: {validation_result.final_city}")
            
            # STEP 6: If clarifying question, return immediately
            # BUT: Save location_state first if it was extracted (so it persists for next message)
            if clarifying:
                if 'location_state' in filters_from_gpt and not filters_from_gpt['location_state'].is_empty():
                    logger.info(f"💾 [CLARIFYING] Saving location_state before asking clarifying question: {filters_from_gpt['location_state'].get_summary()}")
                    # Save the extracted location_state
                    state.location_state = filters_from_gpt['location_state']
                    # Also update city in main state for backwards compatibility
                    if filters_from_gpt['location_state'].city:
                        filters_from_gpt['location'] = filters_from_gpt['location_state'].city
                
                state.add_conversation_turn("assistant", clarifying)
                self.state_manager.save(state)
                return {
                    "success": True,
                    "response": clarifying,
                    "suggestions": [],
                    "properties": [],
                    "property_count": 0,
                    "state_summary": state.get_summary(),
                    "filters": state.get_active_filters()
                }
            
            # STEP 7: Handle different intents (check general_question FIRST to prevent unwanted searches)
            if intent == 'reset':
                return self._handle_reset(state, user_message)
            elif intent == 'valuation':
                return self._handle_valuation_request(state, user_message)
            elif intent == 'details':
                return self._handle_details_request(state, user_message)
            elif intent == 'compare':
                return self._handle_compare_request(state, user_message)
            elif intent == 'special_query':
                # FIX #4: Handle special queries like schools, crime stats, walk score
                return self._handle_special_query(state, interpreter_out, user_message)
            elif intent == 'general_question':
                # FIX #1: Handle general questions without updating state or searching
                # Even if GPT extracted filters (like location from "market trends in Mississauga"),
                # we should NOT execute a search for general questions
                return self._handle_general_question(state, user_message)
            
            # STEP 8: Update state with interpreted filters (search or refine)
            updates = self._normalize_filters_for_state(filters_from_gpt, merge, user_message, state)
            logger.info(f"📝 Updates to apply: {list(updates.keys())}")
            if 'location_state' in updates:
                loc_state = updates['location_state']
                logger.info(f"📍 location_state in updates: {loc_state.get_summary() if hasattr(loc_state, 'get_summary') else loc_state}")
            
            # STEP 8.5: DETECT LOCATION CHANGE (before applying updates)
            # Check if user is trying to change location while they have an existing search
            if 'location_state' in updates or 'location' in updates:
                # Get the new location from updates
                new_location = None
                new_location_state = None
                if 'location_state' in updates:
                    new_location_state = updates['location_state']
                    if hasattr(new_location_state, 'city'):
                        new_location = new_location_state.city
                elif 'location' in updates:
                    new_location = updates['location']
                
                # Get the current location from state
                # ==================== SEAMLESS LOCATION SWITCHING ====================
                # Instead of asking for confirmation, we switch locations automatically
                # This provides a smooth user experience without interruptions
                
                current_location = None
                if hasattr(state, 'location_state') and state.location_state and state.location_state.city:
                    current_location = state.location_state.city
                elif state.location:
                    current_location = state.location
                
                # Check if this is a location change
                if (new_location and current_location and 
                    new_location.lower() != current_location.lower()):
                    
                    logger.info(f"🔄 [SEAMLESS LOCATION SWITCH] {current_location} → {new_location} (no confirmation needed)")
                    
                    # Clear previous search results for the new location search
                    if hasattr(state, 'last_search_results'):
                        state.last_search_results = []
                    if hasattr(unified_state, 'cached_results'):
                        unified_state.cached_results = []
                    
                    # Reset search count to start fresh in new location
                    # (Optional: keep for analytics, or reset for fresh start)
                    logger.info(f"✅ [LOCATION SWITCH] Cleared previous results, proceeding with {new_location} search")
            
            # STEP 8.6: Apply filter updates through AtomicTransactionManager
            if updates:
                # Use unified state with atomic transaction manager for validated updates
                try:
                    logger.info(f"🔒 [ATOMIC] Applying filter updates through transaction manager")
                    self._update_unified_filters_from_gpt(unified_state, updates, merge=True)
                    # Sync to legacy state
                    self._sync_unified_to_legacy(unified_state, state)
                    logger.info(f"✅ State updated with transaction: {unified_state.get_summary()}")
                except ValueError as ve:
                    logger.warning(f"⚠️ Filter validation failed: {ve}, falling back to legacy update")
                    # Fallback to legacy state update if validation fails
                    state.update_from_dict(updates)
                    logger.info(f"✅ Legacy state updated: {state.get_summary()}")
            
            # STEP 9: Log merged location state for debugging
            if hasattr(state, 'location_state') and state.location_state:
                logger.info(f"📍 Final location state: {state.location_state.get_summary()}")
                logger.debug(f"📍 Location hierarchy: city={state.location_state.city}, "
                           f"community={state.location_state.community}, "
                           f"neighborhood={state.location_state.neighborhood}, "
                           f"postalCode={state.location_state.postalCode}, "
                           f"streetName={state.location_state.streetName}, "
                           f"streetNumber={state.location_state.streetNumber}")
            
            # STEP 10: Check for street-only search (requires special handling)
            is_street_only_search = False
            needs_city_clarification = False
            
            if (state.location_state and 
                state.location_state.streetName and 
                not state.location_state.streetNumber):
                
                # User specified street but no street number
                is_street_only_search = True
                
                if not state.location_state.city:
                    # CRITICAL: Street-only without city → ask for clarification
                    needs_city_clarification = True
                    logger.warning(
                        f"🛣️ [STREET SEARCH] Street specified without city: "
                        f"'{state.location_state.streetName}' - asking for clarification"
                    )
            
            # STEP 11: SEARCH TRIGGER VALIDATION (NEW - Critical guard)
            # Only trigger search if:
            # 1. Intent from classifier allows search (property_search, property_refinement)
            # 2. Location is explicit OR user confirmed filter reuse
            # 3. Intent from GPT-4 is search/refine
            
            logger.info("🔍 [SEARCH GUARD] Evaluating whether to trigger MLS search...")
            
            # Check if intent allows search
            search_allowed_intents = [
                UserIntent.PROPERTY_SEARCH,
                UserIntent.PROPERTY_REFINEMENT
            ]
            classifier_allows_search = classified_intent in search_allowed_intents
            
            # Check if GPT-4 intent is search/refine
            gpt_allows_search = intent in ("search", "refine")
            
            # Check if we have explicit location or confirmation
            has_explicit_location = bool(state.location) or (
                state.location_state and not state.location_state.is_empty()
            )
            has_confirmation = state.has_pending_confirmation() and "keep" in user_message.lower()
            
            # Evaluate search criteria
            has_any_criteria = any([
                state.location,
                state.bedrooms,
                state.property_type,
                state.price_range
            ])
            
            # NEW LOGIC: Allow search if EITHER:
            # 1. Valid location exists AND (classifier OR GPT allows search)
            # 2. Both classifier AND GPT agree on search (old behavior)
            should_search = (
                (has_explicit_location and (classifier_allows_search or gpt_allows_search)) or
                (classifier_allows_search and gpt_allows_search)
            ) and has_any_criteria
            
            # Detailed logging of decision
            logger.info(f"🔍 [SEARCH GUARD] Decision: {'ALLOW' if should_search else 'BLOCK'}")
            logger.info(f"  - Classifier intent: {classified_intent.value} (allows: {classifier_allows_search})")
            logger.info(f"  - GPT-4 intent: {intent} (allows: {gpt_allows_search})")
            logger.info(f"  - Has explicit location: {has_explicit_location}")
            logger.info(f"  - Has confirmation: {has_confirmation}")
            logger.info(f"  - Has any criteria: {has_any_criteria}")
            logger.info(f"  - Logic: Location + (Classifier OR GPT) = {has_explicit_location and (classifier_allows_search or gpt_allows_search)}")
            
            if not should_search:
                # Log why search was blocked
                reasons = []
                if not classifier_allows_search:
                    reasons.append(f"classifier intent is {classified_intent.value}")
                if not gpt_allows_search:
                    reasons.append(f"GPT-4 intent is {intent}")
                if not has_explicit_location and not has_confirmation:
                    reasons.append("no explicit location and no confirmation")
                if not has_any_criteria:
                    reasons.append("no search criteria")
                
                logger.info(f"🚫 [SEARCH GUARD] Search blocked: {', '.join(reasons)}")
                
                # If search would have been triggered but we blocked it, ask for location
                if gpt_allows_search and has_any_criteria and not has_explicit_location:
                    logger.info("📍 [SEARCH GUARD] Criteria present but location missing - asking for location")
                    response = "I'd be happy to search for that! Which location would you like me to search in?"
                    suggestions = [
                        "Toronto",
                        "Mississauga",
                        "Vaughan",
                        "Markham"
                    ]
                    state.requires_location_clarification = True
                    state.add_conversation_turn("assistant", response)
                    self.state_manager.save(state)
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": suggestions,
                        "properties": [],
                        "property_count": 0,
                        "state_summary": state.get_summary(),
                        "filters": state.get_active_filters(),
                        "requires_location": True
                    }
            
            properties = []
            total = 0
            fallback_message = None
            
            # Handle city clarification for street-only searches
            if needs_city_clarification:
                logger.info("🏙️ [STREET SEARCH] Requesting city clarification")
                return {
                    "success": True,
                    "response": (
                        f"I'd be happy to search for properties on {state.location_state.streetName}! "
                        f"Which city should I search in? (e.g., Toronto, Mississauga, Markham)"
                    ),
                    "suggestions": [
                        "Toronto",
                        "Mississauga", 
                        "Markham",
                        "Show me all available cities"
                    ],
                    "properties": [],
                    "property_count": 0,
                    "requires_clarification": True,
                    "clarification_type": "city_for_street"
                }
            
            if should_search:
                # ═════════════════════════════════════════════════════════════════
                # STEP 11a: PROPERTY TYPE DETECTION (Residential vs Commercial)
                # ═════════════════════════════════════════════════════════════════
                # Use button hint if provided, otherwise detect from message
                
                property_type_detected = None
                confidence = 1.0
                
                # Check if user selected property type via button
                if property_type_hint:
                    logger.info(f"🎯 [BUTTON OVERRIDE] Using property type from button: {property_type_hint}")
                    if property_type_hint == 'commercial':
                        property_type_detected = PropertyType.COMMERCIAL
                        confidence = 1.0  # 100% confidence from button
                    elif property_type_hint == 'condo':
                        property_type_detected = PropertyType.CONDO
                        confidence = 1.0  # 100% confidence from button
                        logger.info("🏙️ [CONDO BUTTON] Routing to condo search")
                    elif property_type_hint == 'residential':
                        property_type_detected = PropertyType.RESIDENTIAL
                        confidence = 1.0  # 100% confidence from button
                else:
                    # No button hint - use AI detection
                    conversation_history = [turn.get("content", "") for turn in state.conversation_history[-5:]]
                    property_type_detected, confidence = self._detect_and_route_property_type(
                        user_message=user_message,
                        session_id=session_id,
                        conversation_history=conversation_history
                    )
                
                # If commercial property detected or selected, use commercial search
                if property_type_detected == PropertyType.COMMERCIAL and confidence >= 0.5:
                    logger.info(f"🏢 [COMMERCIAL] Routing to commercial property search (confidence: {confidence:.0%})")
                    
                    # ═══════════════════════════════════════════════════════════════
                    # 🌍 MULTI-LOCATION DETECTION: Check for multiple cities
                    # Example: "bakeries in toronto and ottawa" should search both cities
                    # ═══════════════════════════════════════════════════════════════
                    multi_location_cities = self._detect_multiple_cities(user_message)
                    if len(multi_location_cities) > 1:
                        logger.info(f"🌍 [MULTI-LOCATION] Detected {len(multi_location_cities)} cities: {multi_location_cities}")
                    
                    # ═══════════════════════════════════════════════════════════════
                    # CRITICAL FIX: Merge with existing session state for follow-up queries
                    # When user says "under 300K" after "restaurants in Mississauga",
                    # we need to preserve business_type and location from previous search
                    # ═══════════════════════════════════════════════════════════════
                    merged_filters = dict(filters_from_gpt)  # Start with GPT-extracted filters
                    
                    # Get existing filters from state
                    existing_filters = unified_state.get_active_filters()
                    
                    # CRITICAL: Preserve business_type from previous search if not in new message
                    if not merged_filters.get("business_type") and existing_filters.get("business_type"):
                        merged_filters["business_type"] = existing_filters["business_type"]
                        logger.info(f"🔄 [COMMERCIAL CONTEXT] Preserved business_type from session: {merged_filters['business_type']}")
                    
                    # Preserve location if not in new message
                    if not merged_filters.get("location") and existing_filters.get("location"):
                        merged_filters["location"] = existing_filters["location"]
                        logger.info(f"🔄 [COMMERCIAL CONTEXT] Preserved location from session: {merged_filters['location']}")
                    
                    # Preserve property_type if not in new message  
                    if not merged_filters.get("property_type") and existing_filters.get("property_type"):
                        merged_filters["property_type"] = existing_filters["property_type"]
                    
                    # Log merged filters for debugging
                    logger.info(f"🏢 [COMMERCIAL] Merged filters: {merged_filters}")
                    
                    # ═══════════════════════════════════════════════════════════════
                    # 🌍 MULTI-LOCATION SEARCH: Handle multiple cities
                    # ═══════════════════════════════════════════════════════════════
                    if len(multi_location_cities) > 1:
                        logger.info(f"🌍 [MULTI-LOCATION] Searching in {len(multi_location_cities)} cities...")
                        all_properties = []
                        city_results = []
                        
                        for city in multi_location_cities:
                            logger.info(f"🌍 [MULTI-LOCATION] Searching in {city}...")
                            city_filters = dict(merged_filters)
                            city_filters['location'] = city
                            
                            city_result = self._search_commercial_properties(
                                user_message=user_message,
                                session_id=session_id,
                                interpreted_filters=city_filters
                            )
                            
                            if city_result["success"] and city_result["properties"]:
                                city_props = city_result["properties"]
                                all_properties.extend(city_props)
                                city_results.append(f"{city} ({len(city_props)} properties)")
                                logger.info(f"✅ [MULTI-LOCATION] Found {len(city_props)} properties in {city}")
                        
                        # Combine results from all cities
                        commercial_result = {
                            "success": len(all_properties) > 0,
                            "properties": all_properties[:30],  # Limit to top 30 across all cities
                            "total": len(all_properties),
                            "message": f"Found {len(all_properties)} properties across {len(multi_location_cities)} cities: {', '.join(city_results)}",
                            "multi_location": True,
                            "cities_searched": multi_location_cities
                        }
                        logger.info(f"🌍 [MULTI-LOCATION] Combined: {len(all_properties)} total properties")
                    else:
                        # Single location search
                        commercial_result = self._search_commercial_properties(
                            user_message=user_message,
                            session_id=session_id,
                            interpreted_filters=merged_filters
                        )
                    
                    if commercial_result["success"]:
                        properties = commercial_result["properties"]
                        
                        # Update state with commercial results (limit to 20 for state storage)
                        unified_state.last_property_results = properties[:20]
                        unified_state.set_conversation_stage(ConversationStage.VIEWING)
                        state.update_search_results(properties, user_message)
                        
                        # ═══════════════════════════════════════════════════════════════
                        # CRITICAL: Save commercial context for follow-up queries
                        # This allows "under 300K" to work after "restaurants in Mississauga"
                        # ═══════════════════════════════════════════════════════════════
                        if merged_filters.get("business_type"):
                            unified_state.active_filters.business_type = merged_filters["business_type"]
                            logger.info(f"💾 [COMMERCIAL STATE] Saved business_type: {merged_filters['business_type']}")
                        if merged_filters.get("location"):
                            unified_state.active_filters.location = merged_filters["location"]
                            logger.info(f"💾 [COMMERCIAL STATE] Saved location: {merged_filters['location']}")
                        if merged_filters.get("property_type"):
                            unified_state.active_filters.property_type = merged_filters["property_type"]
                        if merged_filters.get("max_price"):
                            unified_state.active_filters.max_price = merged_filters["max_price"]
                        if merged_filters.get("min_price"):
                            unified_state.active_filters.min_price = merged_filters["min_price"]
                        
                        # Generate response
                        response_text = commercial_result["message"]
                        if properties:
                            response_text += f"\n\nWould you like to see different commercial properties or refine your search?"
                        
                        unified_state.add_conversation_turn("assistant", response_text)
                        self._save_state_with_error_handling(unified_state, state, session_id)
                        
                        return {
                            "success": True,
                            "response": response_text,
                            "suggestions": [
                                "Show me retail spaces",
                                "Find office buildings",
                                "Properties under $1M"
                            ],
                            "properties": properties,
                            "property_count": len(properties),
                            "state_summary": unified_state.get_summary(),
                            "filters": unified_state.get_active_filters(),
                            "intent": "commercial_search",
                            "property_type_detected": "commercial"
                        }
                    else:
                        # Commercial search failed, provide helpful message
                        location = filters_from_gpt.get("location", "the area")
                        error_response = (
                            f"I couldn't find commercial properties matching your criteria in {location}. "
                            f"{commercial_result.get('message', '')}\n\n"
                            f"Try:\n"
                            f"• Broadening your search (e.g., remove specific requirements)\n"
                            f"• Trying a different location\n"
                            f"• Searching for general commercial spaces\n"
                            f"• Looking at nearby cities"
                        )
                        
                        unified_state.add_conversation_turn("assistant", error_response)
                        self._save_state_with_error_handling(unified_state, state, session_id)
                        
                        # Generate location-specific suggestions
                        suggestions = [
                            f"Show commercial properties in {location}",
                            "Try a different city",
                            "Search for retail space",
                            "Find office buildings",
                            "Show me residential instead"
                        ]
                        
                        return {
                            "success": False,
                            "response": error_response,
                            "suggestions": suggestions,
                            "properties": [],
                            "property_count": 0,
                            "state_summary": unified_state.get_summary(),
                            "filters": unified_state.get_active_filters()
                        }
                
                # If condo property detected or selected, use condo search
                if property_type_detected == PropertyType.CONDO and confidence >= 0.5:
                    logger.info(f"🏙️ [CONDO] Routing to condo property search (confidence: {confidence:.0%})")
                    
                    # Execute condo search using filters from GPT interpreter
                    condo_result = self._search_condo_properties(
                        user_message=user_message,
                        session_id=session_id,
                        interpreted_filters=filters_from_gpt
                    )
                    
                    if condo_result["success"]:
                        properties = condo_result["properties"]
                        
                        # Update state with condo results (limit to 20 for state storage)
                        unified_state.last_property_results = properties[:20]
                        unified_state.set_conversation_stage(ConversationStage.VIEWING)
                        state.update_search_results(properties, user_message)
                        
                        # Generate response
                        response_text = condo_result["message"]
                        if properties:
                            response_text += f"\n\nWould you like to see different condos or refine your search?"
                        
                        unified_state.add_conversation_turn("assistant", response_text)
                        self._save_state_with_error_handling(unified_state, state, session_id)
                        
                        return {
                            "success": True,
                            "response": response_text,
                            "suggestions": [
                                "Show me pet-friendly condos",
                                "Find condos with balcony",
                                "Condos with gym and pool"
                            ],
                            "properties": properties,
                            "property_count": len(properties),
                            "state_summary": unified_state.get_summary(),
                            "filters": unified_state.get_active_filters(),
                            "intent": "condo_search",
                            "property_type_detected": "condo"
                        }
                    else:
                        # Condo search failed, provide helpful message
                        location = filters_from_gpt.get("location", "the area")
                        error_response = (
                            f"I couldn't find condos matching your criteria in {location}. "
                            f"{condo_result.get('message', '')}\n\n"
                            f"Try:\n"
                            f"• Relaxing your requirements (bedrooms, price, amenities)\n"
                            f"• Expanding to nearby neighborhoods\n"
                            f"• Searching without specific floor level\n"
                            f"• Looking at all available condos first"
                        )
                        
                        unified_state.add_conversation_turn("assistant", error_response)
                        self._save_state_with_error_handling(unified_state, state, session_id)
                        
                        # Generate location-specific suggestions
                        suggestions = [
                            f"Show all condos in {location}",
                            "2 bedroom condos under $3000",
                            "Pet-friendly condos",
                            "Condos with parking",
                            "Search residential houses instead"
                        ]
                        
                        return {
                            "success": False,
                            "response": error_response,
                            "suggestions": suggestions,
                            "properties": [],
                            "property_count": 0,
                            "state_summary": unified_state.get_summary(),
                            "filters": unified_state.get_active_filters()
                        }
                
                # Otherwise, proceed with residential search
                logger.info(f"🏠 [RESIDENTIAL] Using residential property search")
                
                # STEP 11b: Handle street-only search with specialized service
                if is_street_only_search and state.location_state.city:
                    logger.info(
                        f"🛣️ [STREET SEARCH] Using street search service: "
                        f"street='{state.location_state.streetName}' city='{state.location_state.city}'"
                    )
                    
                    # Import street search service
                    from services.street_search_service import street_search_service
                    
                    # Execute street-specific search
                    street_results = street_search_service.search_properties_by_street(
                        street_name=state.location_state.streetName,
                        city=state.location_state.city,
                        property_type=state.property_type,
                        min_bedrooms=state.bedrooms,
                        max_price=state.price_range[1] if state.price_range else None,
                        listing_type=state.listing_type or 'sale'
                    )
                    
                    if street_results['success']:
                        properties = street_results['properties']
                        total = street_results['total_matched']
                        
                        logger.info(
                            f"✅ [STREET SEARCH] Found {total} properties on "
                            f"{state.location_state.streetName} "
                            f"(fetched {street_results['total_fetched']} from {street_results['pages_fetched']} pages)"
                        )
                        
                        # Add note if we found results via street filtering
                        if total > 0:
                            fallback_message = (
                                f"Found {total} active listings on {state.location_state.streetName} "
                                f"in {state.location_state.city}."
                            )
                    else:
                        # Street search validation failed
                        logger.warning(f"⚠️ [STREET SEARCH] Search failed: {street_results.get('error')}")
                        return {
                            "success": False,
                            "response": street_results.get('error', 'Street search failed'),
                            "suggestions": [],
                            "properties": [],
                            "property_count": 0
                        }
                    
                    # Store results and continue to summarizer
                    state.update_search_results(properties, user_message)
                    
                # STEP 11b.0: Check if "near" query - triggers radius search
                elif 'near' in user_message.lower() and state.location_state:
                    logger.info("📍 [NEAR SEARCH] Detected 'near' keyword, using radius search strategy...")
                    
                    # For "near" queries with postal code, use postal fallback for broader area
                    if state.location_state.postalCode:
                        logger.info(f"📮 [NEAR + POSTAL] Searching broader area around postal code: {state.location_state.postalCode}")
                        
                        # Import postal code fallback service
                        from services.postal_code_fallback_service import postal_code_fallback_service
                        
                        # For "near" queries, we want to be more generous - use FSA if full postal returns few results
                        postal_results = postal_code_fallback_service.search_with_fallback(
                            state=state,
                            user_message=user_message
                        )
                        
                        if postal_results['success']:
                            properties = postal_results['properties']
                            total = len(properties)
                            
                            # Add "near" specific messaging
                            if postal_results.get('fallback_type') in ['exact', 'pagesize_retry']:
                                # Found results in exact postal code
                                fallback_message = f"Found {total} properties in postal code {postal_results.get('postal_code_used')}."
                            elif postal_results.get('fallback_message'):
                                # Use the FSA fallback message (already explains expansion)
                                fallback_message = postal_results['fallback_message']
                            
                            logger.info(
                                f"✅ [NEAR + POSTAL] Found {total} properties "
                                f"(fallback_type={postal_results.get('fallback_type')})"
                            )
                        else:
                            # Postal search failed
                            logger.warning(f"⚠️ [NEAR + POSTAL] Search failed: {postal_results.get('error')}")
                            return {
                                "success": False,
                                "response": postal_results.get('error', 'Postal code search failed'),
                                "suggestions": [],
                                "properties": [],
                                "property_count": 0
                            }
                        
                        # Store results and continue to summarizer
                        state.update_search_results(properties, user_message)
                    
                    # For "near" queries with street address, search broader city area
                    elif state.location_state.streetName and state.location_state.city:
                        logger.info(f"🛣️ [NEAR + STREET] Broadening search to city: {state.location_state.city}")
                        
                        # Create broader search: just city (remove street specificity)
                        from services.conversation_state import ConversationState
                        broad_state = ConversationState(session_id=state.session_id)
                        broad_state.location_state = LocationState(city=state.location_state.city)
                        broad_state.property_type = state.property_type
                        broad_state.bedrooms = state.bedrooms
                        broad_state.price_range = state.price_range
                        broad_state.listing_type = state.listing_type
                        
                        # Execute broader search
                        logger.info("🔍 Executing city-wide search for 'near' query...")
                        search_results = enhanced_mls_service.search_properties(
                            broad_state,
                            limit=50,  # Larger limit for "near" queries
                            user_message=user_message
                        )
                        
                        if search_results.get('success'):
                            properties = search_results.get('results', [])
                            total = search_results.get('total', len(properties))
                            
                            # Add transparency message
                            original_street = state.location_state.streetName
                            if state.location_state.streetNumber:
                                original_address = f"{state.location_state.streetNumber} {original_street}"
                            else:
                                original_address = original_street
                            
                            fallback_message = (
                                f"Showing properties near {original_address} in {state.location_state.city}. "
                                f"Found {total} listings in the area."
                            )
                            
                            logger.info(f"✅ [NEAR + STREET] Found {total} properties in {state.location_state.city}")
                        else:
                            logger.warning(f"⚠️ [NEAR + STREET] Search failed: {search_results.get('error')}")
                        
                        # Store results and continue to summarizer
                        state.update_search_results(properties, user_message)
                    
                    # For other "near" queries, continue to standard search
                    else:
                        logger.info("📍 [NEAR] No specific location details, continuing to standard search...")
                        # Fall through to standard search below
                        search_results = enhanced_mls_service.search_properties(
                            state,
                            limit=20,
                            user_message=user_message
                        )
                        
                        if search_results.get('success'):
                            properties = search_results.get('results', [])
                            total = search_results.get('total', len(properties))
                            state.update_search_results(properties, user_message)
                            
                            if search_results.get('validation_warnings'):
                                for warning in search_results['validation_warnings']:
                                    logger.info(f"📋 Filter info: {warning}")
                            
                            logger.info(f"✅ Found {total} properties")
                        else:
                            logger.warning(f"⚠️ MLS search failed: {search_results.get('error')}")
                
                # STEP 11b.1: Check if postal code search with fallback needed
                elif state.location_state and state.location_state.postalCode:
                    logger.info("📮 [POSTAL CODE SEARCH] Detected postal code, using fallback service...")
                    
                    # Import postal code fallback service
                    from services.postal_code_fallback_service import postal_code_fallback_service
                    
                    # Execute postal code search with 3-tier fallback
                    postal_results = postal_code_fallback_service.search_with_fallback(
                        state=state,
                        user_message=user_message
                    )
                    
                    if postal_results['success']:
                        properties = postal_results['properties']
                        total = len(properties)
                        
                        # Store fallback information for user transparency
                        if postal_results.get('fallback_message'):
                            fallback_message = postal_results['fallback_message']
                            logger.info(f"📮 [POSTAL FALLBACK] User message: {fallback_message}")
                        
                        logger.info(
                            f"✅ [POSTAL CODE SEARCH] Found {total} properties "
                            f"(fallback_type={postal_results.get('fallback_type')}, "
                            f"postal_code_used={postal_results.get('postal_code_used')})"
                        )
                    else:
                        # Postal search failed
                        logger.warning(f"⚠️ [POSTAL CODE SEARCH] Search failed: {postal_results.get('error')}")
                        return {
                            "success": False,
                            "response": postal_results.get('error', 'Postal code search failed'),
                            "suggestions": [],
                            "properties": [],
                            "property_count": 0
                        }
                    
                    # Store results and continue to summarizer
                    state.update_search_results(properties, user_message)
                
                else:
                    # STEP 11b.1.5: Check if we should ask for requirements instead of searching immediately
                    # This applies when:
                    # 1. User has no previous search results (first time)
                    # 2. User has no specific filters in their request
                    # 3. This is not a requirements response
                    should_ask_requirements = (
                        len(state.last_property_results) == 0 and  # No previous searches
                        not is_answering_requirements and          # Not already responding to requirements
                        not any([                                  # No specific filters mentioned
                            state.bedrooms, state.property_type, 
                            state.price_range, state.listing_type == 'rent'
                        ]) and
                        intent not in ["refine", "clarify"]       # Not a refinement/clarification
                    )
                    
                    if should_ask_requirements and state.location_state and not state.location_state.is_empty():
                        # Ask for requirements using improved prompt
                        location_name = state.location_state.city or state.location_state.to_display()
                        logger.info(f"❓ [REQUIREMENTS] First search in {location_name} - asking for requirements")
                        
                        response = f"Got it! I'll show you available properties in {location_name}.\nWould you like to add any filters like price range, bedrooms, or property type?"
                        suggestions = [
                            "No filters needed",
                            "2 bedroom condos", 
                            "Houses under 800k"
                        ]
                        
                        # Set mode to awaiting_requirements
                        state.conversation_mode = "awaiting_requirements"
                        state.pending_requirements_context = {
                            "location": location_name,
                            "location_state": state.location_state.to_dict()
                        }
                        
                        state.add_conversation_turn("assistant", response)
                        self.state_manager.save(state)
                        return {
                            "success": True,
                            "response": response,
                            "suggestions": suggestions,
                            "properties": [],
                            "property_count": 0,
                            "state_summary": state.get_summary(),
                            "filters": state.get_active_filters(),
                            "intent": "initial_requirements",
                            "requires_confirmation": False
                        }
                    
                    # STEP 11b.2: Standard search using enhanced_mls_service OR residential search service
                    logger.info("🔍 Executing standard MLS search...")
                    
                    # Check if we should use the new residential search service
                    # The residential service provides extended filter support (90+ filters)
                    use_residential_service = os.getenv("USE_RESIDENTIAL_SEARCH", "true").lower() == "true"
                    
                    if use_residential_service:
                        # Use new residential search service with extended filters
                        logger.info("🏠 Using ResidentialPropertySearchService for comprehensive filter support")
                        
                        # Extract any extended filters from GPT interpretation
                        gpt_extended_filters = {}
                        if 'filters' in locals() and isinstance(filters, dict):
                            # These are extended filters not normally in ConversationState
                            extended_keys = [
                                'basement_type', 'garage_type', 'garage_spaces', 'heating_type',
                                'cooling_type', 'pool', 'waterfront', 'fireplace', 'maintenance_fee_max',
                                'condo_exposure', 'floor_level_min', 'floor_level_max', 'has_balcony',
                                'has_locker', 'is_new_listing', 'condo_amenities', 'property_style'
                            ]
                            for key in extended_keys:
                                if key in filters and filters[key] is not None:
                                    gpt_extended_filters[key] = filters[key]
                        
                        # Call residential search service
                        search_results = search_residential_properties(
                            state=state,
                            user_message=user_message,
                            gpt_filters=gpt_extended_filters,
                            limit=20
                        )
                    else:
                        # Use legacy enhanced_mls_service
                        # Pass user_message for date intent detection
                        search_results = enhanced_mls_service.search_properties(
                            state, 
                            limit=20,
                            user_message=user_message
                        )
                    
                    if search_results.get('success'):
                        properties = search_results.get('results', [])
                        total = search_results.get('total', len(properties))
                        
                        # Note: Postal code validation is now handled by postal_code_fallback_service
                        
                        # PRODUCTION FIX: Exact Address Fallback
                        # If exact address (streetNumber + streetName) returns 0 results, retry with just streetName
                        if (total == 0 and 
                            state.location_state and 
                            state.location_state.streetNumber and 
                            state.location_state.streetName):
                            
                            street_number = state.location_state.streetNumber
                            street_name = state.location_state.streetName
                            city = state.location_state.city or "Toronto"
                            
                            logger.info(f"🔄 [EXACT ADDRESS FALLBACK] No results for {street_number} {street_name}, retrying with street name only...")
                            
                            # Create temporary state with just street name (no number)
                            from services.conversation_state import ConversationState
                            temp_state = ConversationState(session_id=state.session_id)
                            temp_state.location_state = LocationState(
                                streetName=street_name,
                                city=city
                            )
                            temp_state.property_type = state.property_type
                            temp_state.bedrooms = state.bedrooms
                            temp_state.price_range = state.price_range
                            temp_state.listing_type = state.listing_type
                            
                            # Retry search with broader criteria
                            fallback_results = enhanced_mls_service.search_properties(
                                temp_state,
                                limit=20,
                                user_message=user_message
                            )
                            
                            if fallback_results.get('success'):
                                properties = fallback_results.get('results', [])
                                total = fallback_results.get('total', len(properties))
                                
                                if total > 0:
                                    fallback_message = (
                                        f"No exact match found for {street_number} {street_name}. "
                                        f"Showing {total} properties on {street_name} in {city}."
                                    )
                                    logger.info(f"✅ [FALLBACK SUCCESS] Found {total} properties on {street_name}")
                        
                        state.update_search_results(properties, user_message)
                        
                        # Update unified state with search results (for zero results tracking)
                        unified_state.update_search_results(properties, increment_count=True)
                        self._save_state_with_error_handling(unified_state, state)
                        
                        # Log validation warnings if any
                        if search_results.get('validation_warnings'):
                            for warning in search_results['validation_warnings']:
                                logger.info(f"📋 Filter info: {warning}")
                        
                        logger.info(f"✅ Found {total} properties")
                    else:
                        logger.warning(f"⚠️ MLS search failed: {search_results.get('error')}")
            
            # STEP 11: Log final Repliers API payload for debugging
            logger.info("📤 Final Repliers API payload would include:")
            if hasattr(state, 'location_state') and state.location_state:
                location_dict = state.location_state.to_dict()
                logger.info(f"   Location fields: {json.dumps(location_dict, indent=2)}")
            logger.info(f"   Other filters: bedrooms={state.bedrooms}, property_type={state.property_type}, "
                       f"price_range={state.price_range}, listing_type={state.listing_type}")
            
            # STEP 12: Call GPT-4 summarizer for final response
            # REQUIRED FIX #3: Include location_state details for postal/street specificity
            active_filters = state.get_active_filters()
            if hasattr(state, 'location_state') and state.location_state:
                # Add location_state fields to filters for summarizer context
                location_dict = state.location_state.to_dict()
                if location_dict:
                    active_filters['location_state'] = location_dict
                    logger.info(f"📮 [SUMMARIZER CONTEXT] Added location_state: {location_dict}")
            
            # Add refinement flag if results are too broad
            if hasattr(state, 'needs_refinement') and state.needs_refinement:
                active_filters['needs_refinement'] = True
                logger.info(f"⚠️ [SUMMARIZER CONTEXT] Flagged for refinement suggestion")
            
            summarizer_result = ask_gpt_summarizer(user_message, active_filters, properties)
            
            assistant_text = summarizer_result.get("response_text") or "I'm here to help you find properties."
            suggestions = summarizer_result.get("suggestions", [])
            
            # Prepend postal city mismatch warning if needed
            if hasattr(state, 'postal_city_mismatch_message') and state.postal_city_mismatch_message:
                assistant_text = f"{state.postal_city_mismatch_message}\n\n{assistant_text}"
                # Clear the message after using it
                state.postal_city_mismatch_message = None
            
            # Prepend fallback message if we did an address fallback
            if fallback_message:
                assistant_text = f"{fallback_message}\n\n{assistant_text}"
            
            # Add assistant response to history
            state.add_conversation_turn("assistant", assistant_text)
            
            # Sync legacy state back to unified state (so filters, location, etc. persist)
            self._sync_legacy_to_unified(state, unified_state)
            
            # ─────────────────────────────────────────────────────────────────
            # STEP 12.5: UPDATE CONVERSATION STAGE
            # ─────────────────────────────────────────────────────────────────
            # Progress the conversation stage based on what happened
            if properties and len(properties) > 0:
                # We have results to show → VIEWING
                unified_state.set_conversation_stage(ConversationStage.VIEWING)
                logger.debug(f"📈 [STAGE] Set to VIEWING (found {len(properties)} properties)")
            elif unified_state.active_filters.location or unified_state.location_state.city:
                # User has provided location filters → FILTERING
                if unified_state.metadata.conversation_stage == ConversationStage.GREETING.value:
                    unified_state.set_conversation_stage(ConversationStage.FILTERING)
                    logger.debug(f"📈 [STAGE] Set to FILTERING (location: {unified_state.active_filters.location or unified_state.location_state.city})")
            # Note: CONFIRMATION stage is set by confirmation_manager when needed
            
            # Final save with error handling
            self._save_state_with_error_handling(unified_state, state)
            logger.debug(f"🔄 [SYNC] Synced legacy→unified: filters={unified_state.active_filters}, location={unified_state.location_state}")
            
            # Use existing property standardization from voice_assistant_clean.py
            standardize_property_data = get_standardize_property_data()  # Lazy import
            formatted_properties = []
            for i, prop in enumerate(properties[:10]):  # Return top 10
                logger.info(f"🏠 [DEBUG] Property {i+1} raw data keys: {list(prop.keys()) if isinstance(prop, dict) else type(prop)}")
                logger.info(f"🏠 [DEBUG] Sample prop data: price={prop.get('price')} address={prop.get('address')} bedrooms={prop.get('bedrooms')}")
                
                # Use the existing standardization function (no duplication)
                formatted_prop = standardize_property_data(prop)
                formatted_properties.append(formatted_prop)
                
                # Safe address logging (handle both dict and string)
                address_val = formatted_prop.get('address', 'N/A')
                if isinstance(address_val, dict):
                    address_str = address_val.get('full', str(address_val)[:50])
                else:
                    address_str = str(address_val)[:50] if address_val else 'N/A'
                logger.info(f"✅ [DEBUG] Standardized property {i+1}: price={formatted_prop.get('price')}, address={address_str}")
            
            # Return structured result
            return {
                "success": True,
                "response": assistant_text,
                "suggestions": suggestions,
                "properties": formatted_properties,
                "property_count": total,
                "state_summary": state.get_summary(),
                "filters": state.get_active_filters(),
                "metadata": {
                    "intent": classified_intent.value if classified_intent else "unknown",
                    "confidence": intent_metadata.get('confidence', 0) if intent_metadata else 0,
                    "reason": intent_metadata.get('reason', 'N/A') if intent_metadata else 'N/A',
                    "cache_hit": intent_metadata.get('cache_hit', False) if intent_metadata else False,
                    "used_gpt_fallback": intent_metadata.get('used_gpt_fallback', False) if intent_metadata else False,
                    "requires_confirmation": intent_metadata.get('requires_confirmation', False) if intent_metadata else False
                }
            }
        
        except Exception as e:
            logger.exception(f"❌ Error processing message")
            return self._handle_error(session_id, user_message, str(e))
    
    # Removed _format_price_for_frontend - using standardize_property_data from voice_assistant_clean.py instead

    # =========================================================================
    # UNIFIED STATE HELPER METHODS
    # =========================================================================
    
    def _sync_unified_to_legacy(
        self, 
        unified_state: UnifiedConversationState, 
        legacy_state: ConversationState
    ) -> None:
        """
        Sync UnifiedConversationState (Pydantic v2) to legacy ConversationState.
        
        This ensures backward compatibility during the transition period.
        The unified state is the source of truth.
        
        Args:
            unified_state: The Pydantic v2 unified state (source of truth)
            legacy_state: The legacy dataclass state (to be updated)
        """
        try:
            # Sync location - UnifiedConversationState stores in location_state, not 'location'
            if unified_state.active_filters.location:
                # Legacy state expects a simple string location
                legacy_state.location = unified_state.active_filters.location
            elif not unified_state.location_state.is_empty() and unified_state.location_state.city:
                # Fallback to location_state.city if no filter location
                legacy_state.location = unified_state.location_state.city
                
            if not unified_state.location_state.is_empty():
                # Convert UnifiedLocationState to legacy LocationState
                # Use camelCase for constructor (legacy format) but access snake_case properties
                loc = unified_state.location_state
                legacy_state.location_state = LocationState(
                    city=loc.city,
                    community=loc.community,
                    neighborhood=loc.neighborhood,
                    # Access using snake_case (our standard), LocationState now has camelCase aliases
                    postalCode=getattr(loc, 'postal_code', None) or getattr(loc, 'postalCode', None),
                    streetName=getattr(loc, 'street_name', None) or getattr(loc, 'streetName', None),
                    streetNumber=getattr(loc, 'street_number', None) or getattr(loc, 'streetNumber', None),
                )
            
            # Sync filters
            filters = unified_state.active_filters
            if filters.bedrooms is not None:
                legacy_state.bedrooms = filters.bedrooms
            else:
                # Clear bedrooms if unified state has None
                legacy_state.bedrooms = None
            if filters.bathrooms is not None:
                legacy_state.bathrooms = filters.bathrooms
            else:
                # Clear bathrooms if unified state has None
                legacy_state.bathrooms = None
            if filters.property_type:
                legacy_state.property_type = filters.property_type
            else:
                # Clear property_type if unified state has None/empty
                legacy_state.property_type = None
            if filters.listing_type:
                legacy_state.listing_type = filters.listing_type
            # CRITICAL FIX: Always sync price_range, including when clearing (both None)
            # This ensures "show me any price range" actually clears the price filter
            legacy_state.price_range = (filters.min_price, filters.max_price)
            logger.debug(f"💰 [SYNC] price_range synced to legacy: {legacy_state.price_range}")
            if filters.amenities:
                legacy_state.amenities = filters.amenities
            
            # Sync search results
            legacy_state.last_property_results = unified_state.last_property_results
            legacy_state.search_count = unified_state.search_count
            
            logger.debug(f"✅ Synced unified state to legacy state for session {unified_state.session_id}")
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to sync unified to legacy state: {e}")
    
    def _sync_legacy_to_unified(
        self, 
        legacy_state: ConversationState, 
        unified_state: UnifiedConversationState
    ) -> None:
        """
        Sync legacy ConversationState to UnifiedConversationState (Pydantic v2).
        
        Used when legacy code paths modify state and we need to update unified state.
        
        Args:
            legacy_state: The legacy dataclass state (source)
            unified_state: The Pydantic v2 unified state (to be updated)
        """
        try:
            # Build filter dict from legacy state
            filter_updates = {}
            
            # Handle location - legacy has 'location' string, unified uses location_state + active_filters.location
            if hasattr(legacy_state, 'location') and legacy_state.location:
                filter_updates['location'] = legacy_state.location
                
            if legacy_state.bedrooms is not None:
                filter_updates['bedrooms'] = legacy_state.bedrooms
            if legacy_state.bathrooms is not None:
                filter_updates['bathrooms'] = legacy_state.bathrooms
            if legacy_state.property_type:
                filter_updates['property_type'] = legacy_state.property_type
            if legacy_state.listing_type:
                filter_updates['listing_type'] = legacy_state.listing_type
            if legacy_state.price_range:
                min_p, max_p = legacy_state.price_range
                if min_p:
                    filter_updates['min_price'] = min_p
                if max_p:
                    filter_updates['max_price'] = max_p
            if legacy_state.amenities:
                filter_updates['amenities'] = legacy_state.amenities
            
            # Apply filter updates with validation
            if filter_updates:
                try:
                    unified_state.merge_filters(filter_updates, force_replace=True)
                except ValueError as ve:
                    logger.warning(f"⚠️ Validation failed syncing legacy to unified: {ve}")
            
            # Sync location state - use snake_case accessors (compatible with both naming conventions)
            if hasattr(legacy_state, 'location_state') and legacy_state.location_state:
                loc = legacy_state.location_state
                # Use getattr with fallbacks to handle both camelCase and snake_case fields
                unified_state.location_state = UnifiedLocationState(
                    city=getattr(loc, 'city', None),
                    community=getattr(loc, 'community', None),
                    neighborhood=getattr(loc, 'neighborhood', None),
                    # Use snake_case (our new standard) with camelCase fallback
                    postal_code=getattr(loc, 'postal_code', None) or getattr(loc, 'postalCode', None),
                    street_name=getattr(loc, 'street_name', None) or getattr(loc, 'streetName', None),
                    street_number=getattr(loc, 'street_number', None) or getattr(loc, 'streetNumber', None),
                )
            
            # Sync search results
            if legacy_state.last_property_results:
                unified_state.update_search_results(
                    legacy_state.last_property_results[:20],
                    increment_count=False
                )
                unified_state.search_count = legacy_state.search_count
            
            logger.debug(f"✅ Synced legacy state to unified state for session {unified_state.session_id}")
            
        except Exception as e:
            logger.warning(f"⚠️ Failed to sync legacy to unified state: {e}")
    
    def _update_unified_filters_from_gpt(
        self,
        unified_state: UnifiedConversationState,
        filters_from_gpt: Dict[str, Any],
        merge: bool = True
    ) -> None:
        """
        Update UnifiedConversationState filters from GPT interpreter output.
        
        Uses AtomicTransactionManager with FILTER_UPDATE transaction type for
        safe state updates with automatic rollback on validation errors.
        
        Args:
            unified_state: The unified state to update
            filters_from_gpt: Filters extracted by GPT interpreter
            merge: If True, merge with existing; if False, replace
        """
        # Normalize filter keys to match ActiveFilters model
        normalized = {}
        
        # Location
        if filters_from_gpt.get('location'):
            normalized['location'] = filters_from_gpt['location']
        
        # Property type
        if filters_from_gpt.get('property_type'):
            normalized['property_type'] = filters_from_gpt['property_type']
        
        # Bedrooms/Bathrooms
        if filters_from_gpt.get('bedrooms') is not None:
            normalized['bedrooms'] = filters_from_gpt['bedrooms']
        if filters_from_gpt.get('bathrooms') is not None:
            normalized['bathrooms'] = filters_from_gpt['bathrooms']
        
        # Price - handle both tuple format (price_range) and separate keys (min_price/max_price)
        # CRITICAL: Handle (None, None) to CLEAR price filters (e.g., "show me any price range")
        if 'price_range' in filters_from_gpt:
            # Handle tuple format: (min_price, max_price)
            price_range = filters_from_gpt['price_range']
            if isinstance(price_range, (tuple, list)) and len(price_range) == 2:
                min_p, max_p = price_range
                # Check if user wants to CLEAR price filter (both are None)
                if min_p is None and max_p is None:
                    # Explicit clear - pass None to transaction manager which will reset the filter
                    normalized['min_price'] = None
                    normalized['max_price'] = None
                    logger.info(f"💰 [PRICE CLEAR] User wants to clear price filter - setting min_price=None, max_price=None")
                else:
                    # Normal case - only set non-None values
                    if min_p is not None:
                        normalized['min_price'] = min_p
                    if max_p is not None:
                        normalized['max_price'] = max_p
                    logger.info(f"💰 [PRICE UNPACK] Unpacked price_range {price_range} → min_price={min_p}, max_price={max_p}")
        else:
            # Handle separate keys format
            if filters_from_gpt.get('min_price') is not None:
                normalized['min_price'] = filters_from_gpt['min_price']
            if filters_from_gpt.get('max_price') is not None:
                normalized['max_price'] = filters_from_gpt['max_price']
        
        # Square footage - handle both tuple format (sqft_range) and separate keys (min_sqft/max_sqft)
        if 'sqft_range' in filters_from_gpt:
            # Handle tuple format: (min_sqft, max_sqft)
            sqft_range = filters_from_gpt['sqft_range']
            if isinstance(sqft_range, (tuple, list)) and len(sqft_range) == 2:
                min_sqft, max_sqft = sqft_range
                if min_sqft is not None:
                    normalized['min_sqft'] = min_sqft
                if max_sqft is not None:
                    normalized['max_sqft'] = max_sqft
                logger.info(f"📐 [SQFT UNPACK] Unpacked sqft_range {sqft_range} → min_sqft={min_sqft}, max_sqft={max_sqft}")
        else:
            # Handle separate keys format
            if filters_from_gpt.get('min_sqft') is not None:
                normalized['min_sqft'] = filters_from_gpt['min_sqft']
            if filters_from_gpt.get('max_sqft') is not None:
                normalized['max_sqft'] = filters_from_gpt['max_sqft']
        
        # Listing type
        if filters_from_gpt.get('listing_type'):
            normalized['listing_type'] = filters_from_gpt['listing_type']
        
        # Amenities
        if filters_from_gpt.get('amenities'):
            normalized['amenities'] = filters_from_gpt['amenities']
        
        # Execute filter update as atomic transaction with automatic rollback
        try:
            success, result, error = self.transaction_manager.execute_transaction(
                transaction_type=TransactionType.FILTER_UPDATE.value,
                session_id=unified_state.session_id,
                data={
                    "filters": normalized,
                    "merge": merge
                }
            )
            
            if success:
                logger.info(f"✅ [TRANSACTION] Filter update successful: {normalized}")
                # ✅ FIX: Reload unified_state from Redis to sync with transaction manager's changes
                # The transaction manager saved the updated state to Redis, but our in-memory
                # unified_state is stale. We need to reload it so subsequent saves don't overwrite.
                try:
                    reloaded_state = self.state_manager.get_or_create(unified_state.session_id)
                    if reloaded_state:
                        # Update the in-memory unified_state object with the reloaded filters
                        unified_state.active_filters = reloaded_state.active_filters
                        unified_state.location_state = reloaded_state.location_state
                        unified_state.updated_at = reloaded_state.updated_at
                        logger.info(f"🔄 [RELOAD] Synced state after transaction - filters: {unified_state.get_active_filters()}")
                    else:
                        logger.warning(f"⚠️ [RELOAD] Failed to reload state after transaction")
                except Exception as reload_error:
                    logger.error(f"❌ [RELOAD] Error reloading state: {reload_error}", exc_info=True)
            else:
                logger.warning(f"⚠️ [TRANSACTION] Filter update failed: {error}")
                
        except Exception as e:
            logger.error(f"❌ [TRANSACTION] Filter update error: {e}", exc_info=True)
            # Transaction manager automatically rolls back on failure
    
    def _create_checkpoint_for_risky_operation(
        self,
        unified_state: UnifiedConversationState,
        operation_type: str
    ) -> str:
        """
        Create a checkpoint before risky operations (filter changes, search, etc.).
        
        Args:
            unified_state: The state to checkpoint
            operation_type: Description of the operation (for logging)
            
        Returns:
            The checkpoint ID for potential rollback
        """
        checkpoint_id = unified_state.create_checkpoint()
        logger.info(f"📸 Created checkpoint {checkpoint_id} before {operation_type}")
        return checkpoint_id

    def _normalize_filters_for_state(self, filters_from_gpt: Dict[str, Any], merge: bool, user_message: str = "", current_state=None) -> Dict[str, Any]:
        """
        Normalize GPT filter output to ConversationState update format.
        
        Key behavior:
        - If merge=True (refinement): only update fields explicitly mentioned
        - If merge=False (fresh search): clear old filters not mentioned (prevents price persistence)
        """
        updates = {}
        
        # CRITICAL FIX: Handle location_state FIRST before other filters
        if filters_from_gpt.get("location_state"):
            location_state = filters_from_gpt["location_state"]
            logger.info(f"🔧 [FIX] Adding location_state to updates: {location_state.get_summary() if hasattr(location_state, 'get_summary') else location_state}")
            updates["location_state"] = location_state
        
        # Only add filters that were explicitly set
        if filters_from_gpt.get("location"):
            updates["location"] = filters_from_gpt["location"]
        if filters_from_gpt.get("property_type"):
            updates["property_type"] = filters_from_gpt["property_type"]
        # CRITICAL: Pass business_type for commercial property searches
        if filters_from_gpt.get("business_type"):
            updates["business_type"] = filters_from_gpt["business_type"]
            logger.info(f"🏢 [COMMERCIAL] Adding business_type to updates: {filters_from_gpt['business_type']}")
        if filters_from_gpt.get("bedrooms") is not None:
            updates["bedrooms"] = filters_from_gpt["bedrooms"]
        if filters_from_gpt.get("bathrooms") is not None:
            updates["bathrooms"] = filters_from_gpt["bathrooms"]
        
        # Price range with smart Canadian real estate interpretation
        min_p = filters_from_gpt.get("min_price")
        max_p = filters_from_gpt.get("max_price")
        
        # CRITICAL FIX #1: NEVER clear price if extracted in this turn
        # If user provides price explicitly, it MUST be respected
        price_mentioned = min_p is not None or max_p is not None
        
        # CRITICAL: Check if user is refining (adding filters) vs starting fresh
        # Refining = adding bedrooms, bathrooms, or other criteria
        # Location changed = new location explicitly provided
        location_changed = (
            filters_from_gpt.get("location") is not None or 
            filters_from_gpt.get("location_state") is not None
        )
        
        # CRITICAL FIX: Location-only change should PRESERVE filters (not clear them)
        is_location_only_change = (
            location_changed and
            filters_from_gpt.get("bedrooms") is None and
            filters_from_gpt.get("bathrooms") is None and
            filters_from_gpt.get("property_type") is None and
            min_p is None and max_p is None
        )
        
        is_refining = (
            (filters_from_gpt.get("bedrooms") is not None or 
             filters_from_gpt.get("bathrooms") is not None or
             filters_from_gpt.get("property_type") is not None) and
            not location_changed  # Not a location change
        )
        
        # ═══════════════════════════════════════════════════════════════════════════
        # CRITICAL: Check for explicit filter removal patterns FIRST
        # ═══════════════════════════════════════════════════════════════════════════
        budget_removal_patterns = [
            r'i don\'?t have (?:any )?budget',
            r'no budget',
            r'any budget',
            r'show me any price(?: range)?',
            r'remove (?:the )?budget(?: limit)?',
            r'ignore budget',
            r'any price(?: range)?',
            r'without budget',
            r'clear (?:the )?(?:price|budget)',
            r'(?:price|budget) (?:doesn\'?t|does not) matter',
            r'(?:i\'?m )?flexible on (?:price|budget)',
            r'show (?:me )?all properties',  # "show all properties" = remove filters
            r'no (?:price )?limit',
            r'(?:any|all) price(?:s)?',
        ]
        
        should_remove_budget = any(re.search(pattern, user_message, re.I) for pattern in budget_removal_patterns)
        
        if should_remove_budget:
            logger.info(f"💰 [FILTER REMOVAL] User explicitly requested to remove price filter: '{user_message}'")
            updates["price_range"] = (None, None)  # Clear budget - mark as explicit clear
            updates["_explicit_price_clear"] = True  # Flag to prevent overwrite in refinement logic
        
        # ═══════════════════════════════════════════════════════════════════════════
        # CRITICAL FIX: PRESERVE ALL filters during location-only changes
        # ═══════════════════════════════════════════════════════════════════════════
        # Only clear price on TRUE fresh search if price was NOT extracted
        # PRESERVE if: 1) Location-only change, 2) Refining search, 3) Price mentioned
        if is_location_only_change and current_state and not should_remove_budget:
            # Location change without other filters = PRESERVE ALL existing filters
            logger.info(f"✅ [LOCATION CHANGE] Preserving ALL existing filters during location change")
            
            # Preserve price range
            if current_state.price_range != (None, None):
                if "price_range" not in updates or updates.get("price_range") == (None, None):
                    updates["price_range"] = current_state.price_range
                    logger.info(f"  💰 Preserved price range: {current_state.price_range}")
            
            # Preserve bedrooms
            if current_state.bedrooms is not None and "bedrooms" not in updates:
                updates["bedrooms"] = current_state.bedrooms
                logger.info(f"  🛏️ Preserved bedrooms: {current_state.bedrooms}")
            
            # Preserve bathrooms
            if current_state.bathrooms is not None and "bathrooms" not in updates:
                updates["bathrooms"] = current_state.bathrooms
                logger.info(f"  🚿 Preserved bathrooms: {current_state.bathrooms}")
            
            # Preserve property_type
            if current_state.property_type and "property_type" not in updates:
                updates["property_type"] = current_state.property_type
                logger.info(f"  🏠 Preserved property_type: {current_state.property_type}")
            
            # Preserve business_type (for commercial searches)
            if hasattr(current_state, 'business_type') and current_state.business_type and "business_type" not in updates:
                updates["business_type"] = current_state.business_type
                logger.info(f"  🏢 Preserved business_type: {current_state.business_type}")
            
            # Preserve amenities
            if hasattr(current_state, 'amenities') and current_state.amenities and "amenities" not in updates:
                updates["amenities"] = current_state.amenities
                logger.info(f"  ✨ Preserved amenities: {current_state.amenities}")
            
            # Preserve listing_type (sale/rent)
            if current_state.listing_type and "listing_type" not in updates:
                updates["listing_type"] = current_state.listing_type
                logger.info(f"  📋 Preserved listing_type: {current_state.listing_type}")
                
        elif not merge and not price_mentioned and not is_refining and not is_location_only_change and current_state and current_state.price_range != (None, None):
            if not should_remove_budget:  # Don't double-clear
                # TRUE fresh search (new criteria, not just location) - clear old filters
                logger.info(f"🏠 [FRESH SEARCH] New search with different criteria - clearing old price range")
                updates["price_range"] = (None, None)
        elif is_refining and current_state and current_state.price_range != (None, None):
            # User is refining search - KEEP existing price range UNLESS user explicitly wants to clear it
            if not should_remove_budget:  # Critical: Don't overwrite explicit budget removal
                logger.info(f"✅ [REFINEMENT] Keeping existing price range: {current_state.price_range}")
                if "price_range" not in updates or updates.get("price_range") == (None, None):
                    updates["price_range"] = current_state.price_range
        
        # Listing type handling - Critical for rental/sale distinction
        listing_type_mentioned = filters_from_gpt.get("listing_type") is not None
        if not merge and not listing_type_mentioned and current_state and current_state.listing_type:
            # Fresh search without explicit listing_type: inherit from state but log it
            logger.info(f"🏠 [FRESH SEARCH] No listing_type mentioned, keeping current: {current_state.listing_type}")
        
        # Check for "any properties" broad search patterns - clears ALL restrictive filters
        broad_search_patterns = [
            r'any properties',
            r'anything (?:works|is fine)',
            r'whatever you have',
            r'show me (?:any|anything)',
            r'any (?:property|listing)s? work',
            r'don\'?t (?:care|mind)(?: about)?'
        ]
        
        is_broad_search = any(re.search(pattern, user_message, re.I) for pattern in broad_search_patterns)
        
        if is_broad_search:
            logger.info(f"🔍 [BROAD SEARCH] User wants any properties - clearing restrictive filters: '{user_message}'")
            # Clear ALL restrictive filters to show broader results
            updates["bedrooms"] = None
            updates["bathrooms"] = None
            updates["price_range"] = (None, None)
            updates["sqft_range"] = (None, None)
            updates["property_type"] = None  # Also clear property type for maximum flexibility
            # Keep location and listing_type from current state
        elif not should_remove_budget:
            # Fix common misinterpretation: "$2-$3" should be $2M-$3M for sales
            # (skip this if budget was already cleared)
            listing_type = filters_from_gpt.get("listing_type") 
            if current_state:
                listing_type = listing_type or current_state.listing_type
            if listing_type == "sale" or (listing_type is None and "rent" not in user_message.lower()):
                if min_p is not None and 1 <= min_p <= 10:
                    min_p = int(min_p * 1000000)  # Convert to millions
                    logger.info(f"🏠 [PRICE FIX] Converted min_price {filters_from_gpt.get('min_price')} to {min_p} (millions)")
                if max_p is not None and 1 <= max_p <= 10:
                    max_p = int(max_p * 1000000)  # Convert to millions  
                    logger.info(f"🏠 [PRICE FIX] Converted max_price {filters_from_gpt.get('max_price')} to {max_p} (millions)")
            
            # Final validation: ignore extremely low prices for sale properties (likely parsing errors)
            if listing_type == "sale":
                if min_p is not None and min_p < 50000:  # Less than $50K is likely an error for sale properties
                    logger.warning(f"🏠 [PRICE VALIDATION] Ignoring unrealistic min_price {min_p} for sale property")
                    min_p = None
                if max_p is not None and max_p < 50000:  # Less than $50K is likely an error for sale properties  
                    logger.warning(f"🏠 [PRICE VALIDATION] Ignoring unrealistic max_price {max_p} for sale property")
                    max_p = None
            
            # CRITICAL FIX #1: Always apply extracted price (explicit user filter)
            if min_p is not None or max_p is not None:
                updates["price_range"] = (min_p, max_p)
                logger.info(f"✅ [PRICE FIX] Applied user-provided price range: ${min_p}-${max_p}")
        
        # CRITICAL FIX #2: Infer listing_type=sale for high prices (buy queries)
        # If price > $100k and listing_type not specified, assume sale
        extracted_listing_type = filters_from_gpt.get("listing_type")
        current_listing_type = current_state.listing_type if current_state else None
        
        if extracted_listing_type:
            updates["listing_type"] = extracted_listing_type
            logger.info(f"✅ [LISTING TYPE] User explicitly requested: {extracted_listing_type}")
        elif min_p is not None and min_p > 100000:
            # High price range indicates sale query
            updates["listing_type"] = "sale"
            logger.info(f"🏠 [LISTING TYPE AUTO-INFER] Price ${min_p} > $100k → Assuming 'sale'")
        elif max_p is not None and max_p > 100000:
            # High max price indicates sale query
            updates["listing_type"] = "sale"
            logger.info(f"🏠 [LISTING TYPE AUTO-INFER] Max price ${max_p} > $100k → Assuming 'sale'")
        elif current_listing_type and not extracted_listing_type and merge:
            # Merge mode: keep current listing type if not explicitly changed
            updates["listing_type"] = current_listing_type
            logger.info(f"🔄 [LISTING TYPE] Preserving current: {current_listing_type}")
        
        # Amenities (merge if specified)
        if filters_from_gpt.get("amenities"):
            updates["amenities"] = filters_from_gpt["amenities"]
        
        # Square footage range
        # Check if sqft was explicitly mentioned (even if null to remove it)
        sqft_mentioned = "min_sqft" in filters_from_gpt or "max_sqft" in filters_from_gpt
        if sqft_mentioned:
            min_sqft = filters_from_gpt.get("min_sqft")
            max_sqft = filters_from_gpt.get("max_sqft")
            
            # If both are null, user wants to remove sqft filter
            if min_sqft is None and max_sqft is None:
                updates["sqft_range"] = (None, None)
                logger.info(f"🏠 [SQFT FILTER] Removing sqft filter (user said 'any size' or 'show me what you have')")
            else:
                updates["sqft_range"] = (min_sqft, max_sqft)
                logger.info(f"🏠 [SQFT FILTER] Set sqft_range: {min_sqft}-{max_sqft} sqft")
        
        # FIX #3: Date filtering support
        if filters_from_gpt.get("list_date_from"):
            updates["list_date_from"] = filters_from_gpt["list_date_from"]
        if filters_from_gpt.get("list_date_to"):
            updates["list_date_to"] = filters_from_gpt["list_date_to"]
        
        # Remove internal flags before returning
        updates.pop("_explicit_price_clear", None)
        
        return updates
    
    def _handle_reset(self, state: ConversationState, user_message: str) -> Dict[str, Any]:
        """Handle reset intent."""
        state.reset()
        response = "Got it! I've cleared your search criteria. Let's start fresh. What kind of property are you looking for?"
        suggestions = [
            "Show me condos in Toronto",
            "Find houses in Mississauga",
            "I'm looking for rentals"
        ]
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": [],
            "property_count": 0,
            "state_summary": state.get_summary(),
            "filters": {},
            "metadata": {
                "intent": "reset",
                "confidence": 0.95,
                "reason": "User requested to reset/start over",
                "used_gpt_fallback": False
            }
        }
    
    def _handle_details_request(self, state: ConversationState, user_message: str) -> Dict[str, Any]:
        """Handle request for property details."""
        last_results = state.last_property_results
        
        if not last_results:
            response = "I don't have any properties to show you yet. Let me help you search for some!"
            suggestions = [
                "Find condos in Toronto",
                "Show me houses under 800k",
                "I'm looking for 2 bedroom properties"
            ]
        else:
            # Show details about first property
            prop = last_results[0]
            response = self._format_property_details(prop)
            suggestions = [
                "Tell me about the second property",
                "Show me similar properties",
                "Compare this with others"
            ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": last_results[:5] if last_results else [],
            "property_count": len(last_results) if last_results else 0,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters()
        }
    
    def _handle_compare_request(self, state: ConversationState, user_message: str) -> Dict[str, Any]:
        """Handle property comparison request."""
        last_results = state.last_property_results
        
        if not last_results or len(last_results) < 2:
            response = "I need at least 2 properties to compare. Let me help you search first!"
            suggestions = [
                "Find properties in Toronto",
                "Show me condos under 700k"
            ]
        else:
            response = self._build_comparison(last_results[:2])
            suggestions = [
                "Tell me more about the first one",
                "Show me similar properties"
            ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": last_results[:5] if last_results else [],
            "property_count": len(last_results) if last_results else 0,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters()
        }
    
    def _handle_valuation_request(self, state: ConversationState, user_message: str) -> Dict[str, Any]:
        """Handle property valuation requests."""
        try:
            # Import the valuation integration service
            from services.chatbot_valuation_integration import process_valuation_request, extract_property_identifier
            
            # Extract MLS number from user message
            mls_pattern = r'(?:mls:?\s*|mls\s+(?:number\s*)?|#\s*)([a-zA-Z]?\d+[a-zA-Z]?\d*)'
            mls_match = re.search(mls_pattern, user_message, re.IGNORECASE)
            
            if mls_match:
                mls_number = mls_match.group(1).upper()
                
                # Build chatbot context
                chatbot_context = {
                    'user_id': state.session_id,
                    'session_id': state.session_id,
                    'timestamp': datetime.now().isoformat()
                }
                
                # Try to get list price for context
                try:
                    from services.listings_service import ListingsService
                    listings_service = ListingsService()
                    property_details = listings_service.get_listing_details(mls_number)
                    
                    if property_details:
                        if 'success' in property_details and property_details.get('success'):
                            list_price = property_details.get('property', {}).get('listPrice', 0)
                        else:
                            list_price = property_details.get('listPrice', 0)
                        
                        if list_price and list_price > 0:
                            chatbot_context['listing_id'] = mls_number
                            chatbot_context['list_price'] = list_price
                except Exception as e:
                    logger.warning(f"Could not fetch list price: {e}")
                
                # Call the valuation integration service
                valuation_response = process_valuation_request(user_message, chatbot_context)
                
                # Extract data from valuation response
                if isinstance(valuation_response, dict):
                    markdown_response = valuation_response.get('markdown', f"I'll get the property valuation for MLS: {mls_number}")
                    structured_data = valuation_response.get('structured_data', {})
                    response_type = valuation_response.get('response_type', 'valuation')
                    
                    # Create response with valuation data
                    suggestions = [
                        "Show comparable sales",
                        "Investment analysis", 
                        "Market trends",
                        "Price history"
                    ]
                    
                    state.add_conversation_turn("assistant", markdown_response)
                    self.state_manager.save(state)
                    
                    return {
                        "success": True,
                        "response": markdown_response,
                        "response_type": response_type,
                        "structured_data": structured_data,
                        "mls_number": mls_number,
                        "suggestions": suggestions,
                        "properties": [],
                        "property_count": 0,
                        "filters": state.get_active_filters(),
                        "metadata": self._create_metadata_dict(
                            intent="valuation",
                            confidence=0.98,
                            reason="MLS-based valuation request detected"
                        )
                    }
                    
        except Exception as e:
            logger.error(f"Error processing valuation request: {e}")
            
        # Fallback response if MLS not found or error occurred
        response = "I'd be happy to help you get a property valuation! Please provide the MLS number or property address."
        suggestions = [
            "Value of MLS: C1234567", 
            "What is MLS W9876543 worth?",
            "Search for properties first"
        ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": [],
            "property_count": 0,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters(),
            "metadata": self._create_metadata_dict(
                intent="valuation",
                confidence=0.90,
                reason="Valuation request needs more details (MLS or address)"
            )
        }

    def _handle_general_question(self, state: ConversationState, user_message: str) -> Dict[str, Any]:
        """
        Handle general real estate questions using GPT-4.
        FIX: Use a dedicated prompt for general questions, not the search summarizer.
        """
        # Use GPT-4 for general questions with a specific prompt
        try:
            messages = [
                {
                    "role": "system", 
                    "content": """You are a helpful Canadian real estate assistant specializing in Toronto and the GTA region.

The user is asking a general question (NOT searching for properties).

Response requirements:
1. Answer naturally and conversationally
2. Be helpful and friendly
3. If asked what you can do, explain: property searches, market info, neighborhood advice, property valuations
4. Don't mention "no properties found" or "failed search" - the user hasn't searched yet!
5. Provide 2-3 relevant follow-up suggestions

Return valid JSON:
{
  "response_text": "Your natural response here",
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
}

Examples:
- "hey how are you" → Friendly greeting + ask what they're looking for
- "what can you do" → Explain capabilities (search, market info, valuations)
- "tell me about Toronto" → Brief overview + ask what specifically they want to know"""
                },
                {"role": "user", "content": user_message}
            ]
            
            model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
            params = {"model": model, "messages": messages}
            
            if "gpt-5" in model.lower():
                params["max_completion_tokens"] = 500
            else:
                params["max_tokens"] = 500
                params["temperature"] = 0.7
            
            resp = client.chat.completions.create(**params)
            text = resp.choices[0].message.content.strip()
            
            # Parse JSON
            if text.startswith("```"):
                text = text.split("```json")[-1].split("```")[0].strip()
            
            result = json.loads(text)
            response = result.get("response_text", "How can I help you find a property today?")
            suggestions = result.get("suggestions", [
                "Start a property search",
                "Tell me about Toronto neighborhoods",
                "What should I look for in a property?"
            ])
            
        except Exception as e:
            logger.warning(f"⚠️ General question handler error: {e}")
            # Fallback response based on common patterns
            user_lower = user_message.lower()
            
            if any(greeting in user_lower for greeting in ['hi', 'hello', 'hey', 'how are you']):
                response = "Hello! I'm here to help you find the perfect property in Toronto and the GTA. Whether you're looking to buy, rent, or just exploring the market, I can assist you. What are you interested in today?"
                suggestions = [
                    "Show me properties in Toronto",
                    "I'm looking for a rental",
                    "Tell me about the market"
                ]
            elif any(phrase in user_lower for phrase in ['what can you do', 'help me', 'how can you help']):
                response = "I can help you with:\n\n🏠 Property searches (buy or rent)\n📊 Market trends and insights\n🏘️ Neighborhood information\n💰 Property valuations\n\nJust tell me what you're looking for, and I'll get started!"
                suggestions = [
                    "Show me condos in Toronto",
                    "Find rentals under $3000",
                    "What's the market like in Mississauga?"
                ]
            else:
                response = "I'm your real estate assistant for Toronto and the GTA! I can help you search for properties, learn about neighborhoods, understand market trends, and get property valuations. What would you like to know?"
                suggestions = [
                    "Search for properties",
                    "Tell me about neighborhoods",
                    "Market trends"
                ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": [],
            "property_count": 0,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters(),
            "metadata": self._create_metadata_dict(
                intent="general_question",
                confidence=0.85,
                reason="General real estate question (not property search)"
            )
        }
    
    def _execute_property_search(
        self, 
        state: Union[ConversationState, UnifiedConversationState], 
        user_message: str, 
        session_id: str,
        intent_reason: str,
        confirmation_result: str
    ) -> Dict[str, Any]:
        """
        Execute property search after confirmation is resolved.
        This is a terminal action - returns immediately without continuing pipeline.
        
        Uses UnifiedConversationState for validated filter updates and state management.
        
        Args:
            state: Current conversation state (legacy ConversationState or UnifiedConversationState)
            user_message: User's message (may contain additional filters)
            session_id: Session identifier
            intent_reason: Reason for the search intent
            confirmation_result: "accepted" or "rejected"
            
        Returns:
            Response dict with mode, confirmation_result, and action fields for frontend
        """
        logger.info(f"🔍 [SEARCH EXECUTION] Starting property search after confirmation")
        
        # Handle both UnifiedConversationState and legacy ConversationState
        if isinstance(state, UnifiedConversationState):
            # State is already unified, use it directly
            unified_state = state
            # Get or create a legacy state for MLS service (which still expects legacy)
            legacy_state = conversation_state_manager.get_or_create(session_id)
            # Sync unified to legacy
            self._sync_unified_to_legacy(unified_state, legacy_state)
        else:
            # State is legacy, get unified state separately
            legacy_state = state
            unified_state = self.unified_state_manager.get_or_create(session_id)
        
        # Get location for logging
        location_str = "No location"
        if unified_state.location_state and unified_state.location_state.city:
            location_str = unified_state.location_state.city
        elif unified_state.active_filters.location:
            location_str = unified_state.active_filters.location
        elif hasattr(legacy_state, 'location') and legacy_state.location:
            location_str = legacy_state.location
            
        logger.info(f"📍 Location: {location_str}")
        logger.info(f"🔧 Filters: {unified_state.get_active_filters()}")
        logger.info(f"💬 User message: '{user_message}'")
        
        # Create checkpoint before risky filter changes
        checkpoint_id = self._create_checkpoint_for_risky_operation(
            unified_state, 
            "property_search_filter_update"
        )
        
        # Extract any additional filters from the user message using GPT-4
        # Build session summary for interpreter
        session_summary = {
            "filters": unified_state.get_active_filters(),
            "last_search_count": len(unified_state.last_property_results),
            "search_count": unified_state.search_count,
            "last_search_results": unified_state.last_property_results[:3] if unified_state.last_property_results else []
        }
        
        # Call GPT-4 interpreter to extract filters
        logger.info("🤖 [GPT-4 INTERPRETER] Extracting filters from confirmation response")
        interpreter_out = ask_gpt_interpreter(session_summary, user_message)
        
        # Apply interpreted filters using unified state (with Pydantic validation)
        intent = interpreter_out.get("intent", "search")
        filters = interpreter_out.get("filters", {})
        
        # Use unified state for validated filter updates
        try:
            self._update_unified_filters_from_gpt(unified_state, filters, merge=True)
            # Sync to legacy state for MLS service
            self._sync_unified_to_legacy(unified_state, legacy_state)
        except ValueError as ve:
            logger.warning(f"⚠️ Filter validation failed: {ve}")
            # Continue with legacy state if validation fails
        
        # Execute MLS search using legacy state (MLS service expects legacy format)
        logger.info("🔍 [MLS SEARCH] Executing property search")
        search_results = enhanced_mls_service.search_properties(
            legacy_state,
            limit=10,
            user_message=user_message
        )
        
        properties = search_results.get("results", [])
        total = search_results.get("total", 0)
        
        # Update both states with results
        legacy_state.last_property_results = properties[:10]
        legacy_state.search_count += 1
        unified_state.last_property_results = properties[:10]
        unified_state.search_count += 1
        
        # Update unified state with results (max 20, set stage to viewing)
        # This also tracks zero_results_count for UX improvements
        unified_state.update_search_results(properties[:20], increment_count=True)
        unified_state.set_conversation_stage(ConversationStage.VIEWING)
        
        # Generate response with improved zero results UX
        if properties:
            # Get location from unified state safely
            location_str = "this area"
            if unified_state.location_state and unified_state.location_state.city:
                location_str = unified_state.location_state.city
            elif unified_state.active_filters.location:
                location_str = unified_state.active_filters.location
            
            # Check if this was a location-only change (filters preserved)
            preserved_filters = []
            active_filters = unified_state.get_active_filters()
            if active_filters.get("max_price"):
                preserved_filters.append(f"under ${active_filters['max_price']:,}")
            if active_filters.get("min_price"):
                preserved_filters.append(f"over ${active_filters['min_price']:,}")
            if active_filters.get("bedrooms"):
                preserved_filters.append(f"{active_filters['bedrooms']} bedroom")
            if active_filters.get("bathrooms"):
                preserved_filters.append(f"{active_filters['bathrooms']} bathroom")
            if active_filters.get("business_type"):
                preserved_filters.append(f"{active_filters['business_type']}")
            
            # Build response with preserved filters mentioned
            if preserved_filters and confirmation_result == "location_changed":
                filter_desc = ", ".join(preserved_filters)
                response = interpreter_out.get("message", f"I found {total} properties in {location_str} {filter_desc}!")
                logger.info(f"📍 [LOCATION CHANGE] Response includes preserved filters: {filter_desc}")
            else:
                response = interpreter_out.get("message", f"I found {total} properties in {location_str}!")
            
            suggestions = [
                "Show me more details",
                "Adjust my filters",
                "Try a different location"
            ]
            mode = "normal"
        else:
            # Zero results - provide helpful relaxation suggestions
            relaxation_msg = unified_state.suggest_filter_relaxation()
            relaxation_suggestions = unified_state.get_relaxation_suggestions()
            
            # Get location safely from unified state
            location_str = "this area"
            if unified_state.location_state and unified_state.location_state.city:
                location_str = unified_state.location_state.city
            elif unified_state.active_filters.location:
                location_str = unified_state.active_filters.location
            
            if unified_state.zero_results_count >= 2:
                # Multiple consecutive zero results - be more helpful
                response = (
                    f"I still haven't found any properties matching your criteria in {location_str}. "
                    f"{relaxation_msg}"
                )
            else:
                response = (
                    f"I couldn't find any properties matching your exact criteria in {location_str}. "
                    f"{relaxation_msg}"
                )
            
            suggestions = relaxation_suggestions[:3] if relaxation_suggestions else [
                "Adjust my filters",
                "Try a different location",
                "Show me what's available"
            ]
            mode = "zero_results"
        
        # Save both states
        legacy_state.add_conversation_turn("assistant", response)
        unified_state.add_conversation_turn("assistant", response)
        
        # Sync legacy state back to unified state (so filters, location, etc. persist)
        self._sync_legacy_to_unified(legacy_state, unified_state)
        
        self.state_manager.save(legacy_state)
        self.unified_state_manager.save(unified_state)
        
        # Standardize properties for frontend
        standardize_property_data = get_standardize_property_data()
        formatted_properties = []
        for i, prop in enumerate(properties[:10]):
            try:
                formatted_prop = standardize_property_data(prop)
                formatted_properties.append(formatted_prop)
                
                # Safe address logging (handle both dict and string)
                address_val = formatted_prop.get('address', 'N/A')
                if isinstance(address_val, dict):
                    address_str = address_val.get('full', str(address_val)[:50])
                else:
                    address_str = str(address_val)[:50] if address_val else 'N/A'
                logger.debug(f"✅ Standardized property {i+1}: price={formatted_prop.get('price')}, address={address_str}")
            except Exception as e:
                logger.error(f"❌ Failed to standardize property {i+1}: {e}")
                # Still include the property but log the error
                formatted_properties.append(prop)
        
        # Return response with required fields for frontend
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": formatted_properties,
            "property_count": total,
            "state_summary": unified_state.get_summary(),  # Use unified state summary
            "filters": unified_state.get_active_filters(),  # Use unified filters
            "mode": mode,
            "confirmation_result": confirmation_result,
            "action": "search",
            "checkpoint_id": checkpoint_id,  # Include for potential undo
            "zero_results_count": unified_state.zero_results_count,
            "metadata": self._create_metadata_dict(
                intent="property_search",
                confidence=0.96,
                reason="Property search executed after confirmation"
            )
        }
    
    def _handle_special_query(self, state: ConversationState, interpreter_out: Dict[str, Any], user_message: str) -> Dict[str, Any]:
        """
        FIX #4: Handle special queries that aren't property searches.
        Examples: schools, crime stats, walk score, transit info, neighborhood info
        """
        query_type = interpreter_out.get('query_type', 'unknown')
        mls_number = interpreter_out.get('mls_number')
        location = interpreter_out.get('location') or state.location
        
        logger.info(f"🔍 Handling special query: {query_type} (MLS: {mls_number}, Location: {location})")
        
        # Build response based on query type
        if query_type == 'schools':
            if mls_number:
                response = f"I'd love to help you find schools near MLS {mls_number}! While I'm still learning about school information, you can search for schools on:\n\n• GreatSchools.org - Comprehensive school ratings and reviews\n• SchoolFinder.com - Ontario school search tool\n• TDSB.on.ca - Toronto District School Board (if in Toronto)\n\nWould you like me to continue helping you search for properties, or do you have questions about the property itself?"
            else:
                response = "I can help you find properties near great schools! Which area or city are you interested in? For example:\n\n• Toronto (Downtown, North York, Scarborough)\n• Mississauga\n• Markham\n• Richmond Hill\n\nOnce you tell me the area, I can search for properties there, and you can check school ratings on GreatSchools.org or SchoolFinder.com."
            
            suggestions = [
                "Show me properties in this area" if location else "Search for properties in Toronto",
                "Tell me about the neighborhood",
                "Continue with my property search"
            ]
        
        elif query_type == 'crime_stats':
            response = f"Safety is important! To check crime statistics for {location or 'a specific area'}, I recommend:\n\n• TorontoPolice.on.ca - Official crime maps and statistics\n• MacLean's City Safety Rankings - Annual Canadian city safety rankings\n• Local police websites - Most cities publish crime data\n\nWould you like me to help you find properties in safer neighborhoods, or continue with your current search?"
            suggestions = [
                "Show me safe neighborhoods" if location else "Find properties in safe areas",
                "Continue my property search",
                "Tell me about the area"
            ]
        
        elif query_type == 'walk_score':
            response = f"Walk Score is a great way to evaluate neighborhood walkability! To check the Walk Score for {f'MLS {mls_number}' if mls_number else location or 'a property'}:\n\n• Visit WalkScore.com and enter the address\n• Most real estate listings include Walk Score\n• Transit Score and Bike Score are also available\n\nWould you like me to show you properties in highly walkable areas?"
            suggestions = [
                "Show me walkable neighborhoods",
                "Properties near transit",
                "Continue my search"
            ]
        
        elif query_type == 'transit':
            response = f"Public transit access is key! For {location or 'Toronto'} transit information:\n\n• TTC.ca - Toronto Transit Commission routes and schedules\n• Google Maps - Real-time transit directions\n• MiWay.ca - Mississauga transit\n• YRT.ca - York Region transit\n\nI can help you find properties near subway stations or major transit hubs. Just let me know what you're looking for!"
            suggestions = [
                "Properties near subway",
                "Show me transit-accessible homes",
                "Continue searching"
            ]
        
        elif query_type == 'neighborhood_info':
            response = f"I'd love to tell you about {location or 'Toronto neighborhoods'}! What specifically interests you?\n\n• Demographics and lifestyle\n• Schools and parks\n• Shopping and dining\n• Safety and community\n• Property values and trends\n\nLet me know what you'd like to learn, and I can help you find properties that match your lifestyle!"
            suggestions = [
                "Show me properties in this area" if location else "Search for properties",
                "Tell me about property values",
                "Continue my search"
            ]
        
        else:
            # Unknown query type - generic fallback
            response = "That's a great question! While I specialize in helping you search for properties, I can point you to resources for additional information. How else can I help with your property search?"
            suggestions = [
                "Continue searching properties",
                "Tell me about neighborhoods",
                "Start a new search"
            ]
        
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": [],
            "property_count": 0,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters(),
            "query_type": query_type,
            "metadata": self._create_metadata_dict(
                intent="general_question",
                confidence=0.85,
                reason=f"Special query about {query_type} - providing resource information",
                cache_hit=False,
                used_gpt_fallback=False,
                requires_confirmation=False
            )
        }
    
    def _handle_address_search(
        self,
        session_id: str,
        user_message: str,
        address_result: Any,  # AddressIntentResult type
        state: Any  # ConversationState type
    ) -> Dict[str, Any]:
        """
        Handle address and street-level searches with highest priority.
        
        This method:
        1. Normalizes the address components to addressKey format
        2. Queries Repliers using addressKey matching
        3. Returns results immediately (no confirmation required)
        4. Does NOT fall back to city search if no results
        
        Args:
            session_id: Session identifier
            user_message: Original user message
            address_result: Address intent detection result
            state: Current conversation state
            
        Returns:
            Standard response dict with address search results
        """
        logger.info(f"🏠 [ADDRESS_HANDLER] Processing {address_result.intent_type.value}")
        
        try:
            # Import AddressIntentType for type checking
            from services.address_intent_detector import AddressIntentType
            
            # SPECIAL HANDLING: Intersection searches - use majorIntersection field matching
            if address_result.intent_type == AddressIntentType.INTERSECTION:
                return self._handle_intersection_search(
                    session_id, user_message, address_result, state
                )
            
            # SPECIAL HANDLING: Postal code searches - use postal code filtering
            if address_result.intent_type == AddressIntentType.POSTAL_CODE:
                # Extract postal code from address_result components
                postal_code = address_result.components.postal_code or address_result.raw_text
                city = address_result.components.city
                return self._handle_postal_code_search(
                    session_id=session_id,
                    user_message=user_message,
                    postal_code=postal_code,
                    city=city,
                    state=state
                )
            
            # NEW: Cross-city exact address search using streetNumber + streetName
            # This allows finding properties in ANY city, not just Toronto
            components = address_result.components
            if components.street_number and components.street_name:
                return self._handle_cross_city_address_search(
                    session_id=session_id,
                    user_message=user_message,
                    address_result=address_result,
                    state=state
                )
            
            # Step 1: Normalize address to addressKey format (for STREET_SEARCH only now)
            normalizer = get_address_key_normalizer()
            normalized = normalizer.normalize_address(
                address_result.components,
                force_city=state.get_active_filters().get('location')
            )
            
            if normalized.confidence < 0.5:
                logger.warning(f"⚠️ [ADDRESS_HANDLER] Low confidence normalization: {normalized.confidence}")
                return self._handle_error(
                    session_id, 
                    user_message,
                    f"I couldn't parse the address '{user_message}' clearly. Please provide a complete address with street number, name, and suffix (e.g., '55 Main Street')."
                )
            
            logger.info(f"✅ [ADDRESS_HANDLER] Normalized address (confidence: {normalized.confidence:.2f})")
            for note in normalized.normalization_notes:
                logger.info(f"   📝 {note}")
            
            # Step 2: Build Repliers search parameters
            listing_type = state.get_active_filters().get('listing_type', 'Sale')
            
            # NEW: Check if user's message mentions specific filters
            # If not, DON'T carry over stale session filters for new address searches
            additional_filters = self._get_address_search_filters(user_message, state.get_active_filters())
            
            repliers_params = buildRepliersAddressSearchParams(
                normalized_address=normalized,
                listing_type=listing_type,
                limit=25,
                additional_filters=additional_filters
            )
            
            if not repliers_params:
                logger.error("❌ [ADDRESS_HANDLER] Failed to build Repliers parameters")
                return self._handle_error(
                    session_id,
                    user_message, 
                    "I couldn't create a valid search for that address. Please check the address format."
                )
            
            # Step 3: Execute deterministic address search
            logger.info(f"🔍 [ADDRESS_HANDLER] Searching with params: {repliers_params}")
            
            try:
                # Import and call Repliers client directly for address searches
                from services.repliers_client import client as repliers_client
                
                # Check if this is a street search requiring post-filtering
                is_street_search = repliers_params.get('_search_type') == 'street_search'
                street_filter_key = repliers_params.get('_street_filter_key')
                
                # Remove internal params before API call
                api_params = {k: v for k, v in repliers_params.items() if not k.startswith('_')}
                
                # PAGINATION FOR STREET SEARCHES - Bay Street has hundreds of listings
                if is_street_search:
                    # Extract street name from address components for pagination
                    street_name_for_pagination = getattr(address_result.components, 'street_name', '') or ''
                    if not street_name_for_pagination and hasattr(address_result.components, 'streetName'):
                        street_name_for_pagination = address_result.components.streetName or ''
                    
                    raw_properties = self._fetch_street_properties_with_pagination(
                        repliers_client, api_params, street_name_for_pagination
                    )
                else:
                    # Exact address search - single API call
                    repliers_response = repliers_client.get('/listings', params=api_params)
                    raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
                
                logger.info(f"📊 [ADDRESS_HANDLER] Raw API results: {len(raw_properties)}")
                
                # Apply deterministic filtering for street searches
                if is_street_search and street_filter_key:
                    # Extract street name from address components for normalized matching
                    street_name = getattr(address_result.components, 'street_name', '') or ''
                    if not street_name and hasattr(address_result.components, 'streetName'):
                        street_name = address_result.components.streetName or ''
                    
                    logger.info(f"🔍 [STREET_MATCHING] Using street name: '{street_name}' for normalized matching")
                    
                    # RULE: Filter using normalized street token matching
                    properties = []
                    for prop in raw_properties:
                        address_data = prop.get('address', {})
                        prop_address_key = address_data.get('addressKey', '')
                        
                        # Use normalized token matching instead of exact string matching
                        if self._matches_street_address(prop_address_key, street_name):
                            properties.append(prop)
                    
                    logger.info(f"🏘️ [STREET_FILTER] Filtered {len(raw_properties)} → {len(properties)} using normalized street: '{street_name}'")
                else:
                    # Exact address search - FILTER to exact address only
                    street_number = getattr(address_result.components, 'street_number', '') or ''
                    street_name = getattr(address_result.components, 'street_name', '') or ''
                    unit_number = getattr(address_result.components, 'unit_number', '') or ''
                    
                    if street_number:
                        # Filter to properties matching the exact street number AND street name
                        properties = []
                        for prop in raw_properties:
                            address_data = prop.get('address', {})
                            prop_address_key = (address_data.get('addressKey', '') or '').lower()
                            prop_street_number = str(address_data.get('streetNumber', ''))
                            prop_street_name = (address_data.get('streetName', '') or '').lower()
                            prop_unit = str(address_data.get('unitNumber', '') or '')
                            
                            # Match by street number
                            number_match = prop_street_number == street_number or street_number.lower() in prop_address_key
                            
                            # Match by street name (if we have one)
                            if street_name:
                                street_name_match = (
                                    street_name.lower() in prop_street_name or 
                                    street_name.lower() in prop_address_key
                                )
                            else:
                                street_name_match = True
                            
                            # If unit specified, also match unit
                            if unit_number:
                                unit_match = prop_unit.lower() == unit_number.lower() or unit_number.lower() in prop_address_key
                                if number_match and street_name_match and unit_match:
                                    properties.append(prop)
                            else:
                                if number_match and street_name_match:
                                    properties.append(prop)
                        
                        logger.info(f"🏠 [EXACT_ADDRESS_FILTER] Filtered {len(raw_properties)} → {len(properties)} for address: {street_number} {street_name}")
                    else:
                        properties = raw_properties
                
                # Apply additional filters AFTER addressKey filtering
                # Get post-filters from repliers_params (stored there to avoid API-level filtering)
                post_filters = repliers_params.get('_post_filters', additional_filters)
                properties = self._apply_post_address_filters(properties, post_filters)
                
                # Log search results
                logger.info(f"📊 [ADDRESS_HANDLER] Final results after filtering: {len(properties)}")
                
                # Step 4: Handle results - WITH INTELLIGENT FALLBACK
                if not properties:
                    address_description = self._format_address_for_user(address_result.components)
                    search_type = "exact address" if not is_street_search else "street"
                    city = normalized.components.city or 'Toronto'
                    
                    logger.info(f"🔄 [ADDRESS_HANDLER] No results on {address_description}, activating fallback system")
                    
                    # Get current active filters from state
                    active_filters = state.get_active_filters()
                    
                    # Build fallback filters - try condo search in the same city
                    fallback_filters = {
                        "location": city,
                        "property_type": "condo"  # Default to condos for most searches
                    }
                    
                    # Preserve user's search criteria
                    if active_filters.get("bedrooms"):
                        fallback_filters["bedrooms"] = active_filters["bedrooms"]
                    if active_filters.get("price_max"):
                        fallback_filters["price_max"] = active_filters["price_max"]
                    if active_filters.get("price_min"):
                        fallback_filters["price_min"] = active_filters["price_min"]
                    
                    # Try condo search with universal fallback
                    try:
                        logger.info(f"🔍 [ADDRESS_HANDLER] Fallback filters: {fallback_filters}")
                        fallback_result = self._search_condo_properties(
                            user_message=f"condos in {city}",
                            session_id=session_id,
                            interpreted_filters=fallback_filters
                        )
                        
                        if fallback_result.get("success") and fallback_result.get("count", 0) > 0:
                            fallback_properties = fallback_result.get("properties", [])
                            
                            # Generate intelligent response
                            response_parts = [
                                f"I couldn't find properties on {address_description}, "
                                f"but I found {fallback_result['count']} condos available in {city}."
                            ]
                            
                            # Mention preserved filters
                            kept_filters = []
                            if active_filters.get("bedrooms"):
                                kept_filters.append(f"{active_filters['bedrooms']} bedroom")
                            if active_filters.get("price_max"):
                                kept_filters.append(f"under ${active_filters['price_max']:,}")
                            
                            if kept_filters:
                                response_parts.append(f" These match your criteria: {', '.join(kept_filters)}.")
                            
                            response_parts.append(" Here are some nearby options:")
                            
                            # Add to conversation history
                            state.add_conversation_turn("assistant", "".join(response_parts))
                            
                            return {
                                "success": True,
                                "response": "".join(response_parts),
                                "properties": fallback_properties[:20],
                                "property_count": len(fallback_properties[:20]),
                                "suggestions": [
                                    f"Show condos near {address_result.components.street_name or 'this area'}",
                                    "Filter by neighborhood",
                                    "Adjust price range",
                                    f"Search all of {city}"
                                ],
                                "filters": state.get_active_filters(),
                                "address_search": True,
                                "address_result": "fallback_results",
                                "search_type": "address_fallback",
                                "metadata": self._create_metadata_dict(
                                    intent="address_search_fallback",
                                    confidence=0.75,
                                    reason=f"Broadened search from {address_description} to all of {city}",
                                    cache_hit=False,
                                    used_gpt_fallback=False,
                                    requires_confirmation=False
                                )
                            }
                        else:
                            logger.warning(f"⚠️ [ADDRESS_HANDLER] Fallback search returned no results")
                    except Exception as fallback_error:
                        logger.error(f"❌ [ADDRESS_HANDLER] Fallback search error: {fallback_error}", exc_info=True)
                    
                    # If fallback also fails, return helpful message
                    response = f"No active listings found on {address_description}."
                    
                    suggestions = [
                        "Search nearby streets",
                        "Remove filters", 
                        f"Search the entire {city}"
                    ]
                    
                    # Add to conversation history
                    state.add_conversation_turn("assistant", response)
                    
                    return {
                        "success": True,
                        "response": response,
                        "suggestions": suggestions,
                        "properties": [],
                        "property_count": 0,
                        "state_summary": state.get_summary(),
                        "filters": api_params,
                        "address_search": True,
                        "address_result": "no_results",
                        "search_type": search_type
                    }
                
                # Step 5: Format successful results
                # Apply property standardization
                standardize_func = get_standardize_property_data()
                properties = [standardize_func(prop) for prop in properties]
                
                # Update state
                state.last_property_results = properties
                state.last_search_params = repliers_params
                
                # Generate response
                address_description = self._format_address_for_user(address_result.components)
                intent_name = "exact address" if address_result.intent_type == AddressIntentType.ADDRESS_SEARCH else "street"
                
                if len(properties) == 1:
                    response = f"I found 1 property on {address_description}."
                else:
                    response = f"I found {len(properties)} properties on {address_description}."
                
                suggestions = []
                if address_result.intent_type == AddressIntentType.STREET_SEARCH and len(properties) > 5:
                    suggestions.append("Show me only condos on this street")
                    suggestions.append("Filter by price range") 
                
                # Add to conversation history
                state.add_conversation_turn("assistant", response)
                
                return {
                    "success": True,
                    "response": response,
                    "suggestions": suggestions,
                    "properties": properties,
                    "property_count": len(properties),
                    "state_summary": state.get_summary(),
                    "filters": repliers_params,
                    "address_search": True,
                    "address_result": "found_results",
                    "search_type": intent_name
                }
                
            except Exception as search_error:
                logger.error(f"❌ [ADDRESS_HANDLER] Search failed: {search_error}")
                return self._handle_error(
                    session_id,
                    user_message,
                    "I encountered an issue searching for properties at that address. Please try again."
                )
            
        except Exception as e:
            logger.error(f"❌ [ADDRESS_HANDLER] Unexpected error: {e}")
            return self._handle_error(session_id, user_message, "I had trouble processing that address search.")
    
    def _handle_intersection_search(
        self,
        session_id: str,
        user_message: str,
        address_result: Any,  # AddressIntentResult type
        state: Any  # ConversationState type
    ) -> Dict[str, Any]:
        """
        Handle intersection searches by querying city and filtering by majorIntersection.
        
        For queries like "Yonge and Bloor" or "King and Spadina", we:
        1. Extract the two street names
        2. Search for properties in the city (default: Toronto)
        3. Filter results where majorIntersection contains both street names
        
        Args:
            session_id: Session identifier
            user_message: Original user message
            address_result: Address intent detection result with intersection streets
            state: Current conversation state
            
        Returns:
            Standard response dict with intersection search results
        """
        components = address_result.components
        street1 = components.intersection_street1 or ""
        street2 = components.intersection_street2 or ""
        
        logger.info(f"🚦 [INTERSECTION_HANDLER] Searching near {street1} & {street2}")
        
        try:
            # Get city from state or default to Toronto
            city = state.get_active_filters().get('location', 'Toronto')
            listing_type = state.get_active_filters().get('listing_type', 'Sale')
            
            # Build search params for city-level search
            from services.repliers_client import client as repliers_client
            
            api_params = {
                'city': city,
                'status': 'A',  # Active listings
                'type': listing_type.lower() if listing_type else 'sale',
                'pageSize': 100,  # Get more results for filtering
            }
            
            # Add property type filter if specified
            prop_type = state.get_active_filters().get('property_type')
            if prop_type:
                api_params['class'] = prop_type
            
            # Add bedroom filter if specified
            bedrooms = state.get_active_filters().get('bedrooms')
            if bedrooms:
                api_params['minBeds'] = bedrooms
            
            logger.info(f"🔍 [INTERSECTION_HANDLER] API params: {api_params}")
            
            # Execute search
            repliers_response = repliers_client.get('/listings', params=api_params)
            raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
            
            logger.info(f"📊 [INTERSECTION_HANDLER] Raw results: {len(raw_properties)}")
            
            # Filter by majorIntersection containing both street names
            street1_lower = street1.lower().strip()
            street2_lower = street2.lower().strip()
            
            filtered_properties = []
            for prop in raw_properties:
                address_data = prop.get('address', {})
                major_intersection = (address_data.get('majorIntersection') or '').lower()
                
                # Check if both streets appear in the majorIntersection field
                # Handle variations like "Yonge & Bloor", "Yonge St & Bloor St", etc.
                has_street1 = street1_lower in major_intersection
                has_street2 = street2_lower in major_intersection
                
                if has_street1 and has_street2:
                    filtered_properties.append(prop)
            
            logger.info(f"✅ [INTERSECTION_HANDLER] Filtered to {len(filtered_properties)} properties near {street1} & {street2}")
            
            # CRITICAL FIX: If no results, fall back to broader condo search in that area
            if len(filtered_properties) == 0:
                logger.info("🔄 [INTERSECTION_HANDLER] No exact intersection matches, trying broader area search")
                
                # Try street name fallback first
                for prop in raw_properties[:50]:  # Check first 50
                    address_data = prop.get('address', {})
                    street_name = (address_data.get('streetName') or '').lower()
                    neighborhood = (address_data.get('neighborhood') or '').lower()
                    
                    # Match if street name matches either search street
                    if street1_lower in street_name or street2_lower in street_name:
                        filtered_properties.append(prop)
                    elif street1_lower in neighborhood or street2_lower in neighborhood:
                        filtered_properties.append(prop)
                
                logger.info(f"✅ [INTERSECTION_HANDLER] Street name fallback found {len(filtered_properties)} properties")
                
                # If STILL no results, use condo search for the city
                if len(filtered_properties) == 0:
                    logger.info(f"🔄 [INTERSECTION_HANDLER] No street matches, falling back to city-wide condo search in {city}")
                    
                    # Get current active filters from state
                    active_filters = state.get_active_filters()
                    
                    # Build fallback filters - include location + any user-specified criteria
                    fallback_filters = {
                        "location": city,
                        "property_type": "condo"  # Ensure we're searching for condos
                    }
                    
                    # Preserve user's search criteria (bedrooms, price, etc.)
                    if bedrooms:
                        fallback_filters["bedrooms"] = bedrooms
                    if active_filters.get("price_max"):
                        fallback_filters["price_max"] = active_filters["price_max"]
                    if active_filters.get("price_min"):
                        fallback_filters["price_min"] = active_filters["price_min"]
                    
                    # Use condo search with extracted filters
                    try:
                        logger.info(f"🔍 [INTERSECTION_HANDLER] Fallback filters: {fallback_filters}")
                        fallback_result = self._search_condo_properties(
                            user_message=f"condos in {city}",
                            session_id=session_id,
                            interpreted_filters=fallback_filters
                        )
                        
                        if fallback_result.get("success") and fallback_result.get("count", 0) > 0:
                            fallback_properties = fallback_result.get("properties", [])
                            
                            # Generate intelligent response based on what we found
                            response_parts = [
                                f"I couldn't find properties exactly at the intersection of {street1} and {street2}, "
                                f"but I found {fallback_result['count']} similar condos available in {city}."
                            ]
                            
                            # Mention if we kept any filters
                            kept_filters = []
                            if bedrooms:
                                kept_filters.append(f"{bedrooms} bedroom")
                            if active_filters.get("price_max"):
                                kept_filters.append(f"under ${active_filters['price_max']:,}")
                            
                            if kept_filters:
                                response_parts.append(f" These match your criteria: {', '.join(kept_filters)}.")
                            
                            response_parts.append(" Here are some nearby options:")
                            
                            return {
                                "success": True,
                                "response": "".join(response_parts),
                                "properties": fallback_properties[:20],
                                "suggestions": [
                                    f"Show condos near {street1}",
                                    f"Show condos near {street2}",
                                    "Filter by neighborhood",
                                    "Adjust price range"
                                ],
                                "filters": state.get_active_filters(),
                                "metadata": self._create_metadata_dict(
                                    intent="intersection_search_fallback",
                                    confidence=0.75,
                                    reason=f"Broadened search from {street1} & {street2} to all of {city}",
                                    cache_hit=False,
                                    used_gpt_fallback=False,
                                    requires_confirmation=False
                                )
                            }
                        else:
                            logger.warning(f"⚠️ [INTERSECTION_HANDLER] Fallback search returned no results")
                    except Exception as fallback_error:
                        logger.error(f"❌ [INTERSECTION_HANDLER] Fallback search error: {fallback_error}", exc_info=True)
                
                # Deduplicate after street fallback
                if filtered_properties:
                    seen_mls = set()
                    unique_properties = []
                    for prop in filtered_properties:
                        mls = prop.get('mlsNumber', '')
                        if mls not in seen_mls:
                            seen_mls.add(mls)
                            unique_properties.append(prop)
                    filtered_properties = unique_properties
            
            
            # Limit results
            properties = filtered_properties[:20]
            
            if not properties:
                return {
                    "success": True,
                    "response": f"I couldn't find any properties near the intersection of {street1} and {street2} in {city}. Would you like to search a broader area or try different criteria?",
                    "properties": [],
                    "suggestions": [
                        f"Search all of {city}",
                        "Try a different intersection",
                        "Expand search radius"
                    ],
                    "filters": state.get_active_filters(),
                    "metadata": self._create_metadata_dict(
                        intent="intersection_search",
                        confidence=0.85,
                        reason=f"No properties found near {street1} & {street2}",
                        cache_hit=False,
                        used_gpt_fallback=False,
                        requires_confirmation=False
                    )
                }
            
            # Standardize properties
            standardize_func = get_standardize_property_data()
            standardized = [standardize_func(p) for p in properties]
            
            # Create response message
            response_text = f"I found {len(properties)} properties near the intersection of {street1} and {street2} in {city}!"
            if len(filtered_properties) > 20:
                response_text += f" (Showing 20 of {len(filtered_properties)} results)"
            
            return {
                "success": True,
                "response": response_text,
                "properties": standardized,
                "suggestions": [
                    "Filter by price range",
                    "Filter by bedrooms",
                    "Show more details"
                ],
                "filters": state.get_active_filters(),
                "metadata": self._create_metadata_dict(
                    intent="intersection_search",
                    confidence=0.90,
                    reason=f"Properties near {street1} & {street2}",
                    cache_hit=False,
                    used_gpt_fallback=False,
                    requires_confirmation=False
                )
            }
            
        except Exception as e:
            logger.error(f"❌ [INTERSECTION_HANDLER] Error: {e}")
            import traceback
            traceback.print_exc()
            return self._handle_error(
                session_id,
                user_message,
                f"I had trouble searching near {street1} and {street2}. Please try again or search by city."
            )

    def _handle_cross_city_address_search(
        self,
        session_id: str,
        user_message: str,
        address_result: Any,
        state: Any
    ) -> Dict[str, Any]:
        """
        Handle exact address searches across ALL cities (not just Toronto).
        
        Uses Repliers streetNumber + streetName parameters for cross-city matching.
        
        Args:
            session_id: Session identifier
            user_message: Original user message
            address_result: Address intent detection result
            state: Current conversation state
            
        Returns:
            Standard response dict with matching properties
        """
        components = address_result.components
        street_number = components.street_number
        street_name = components.street_name
        unit_number = components.unit_number
        
        logger.info(f"🌍 [CROSS_CITY_ADDRESS] Searching: {street_number} {street_name} (unit: {unit_number})")
        
        try:
            from services.repliers_client import client as repliers_client
            
            # Build cross-city search params using streetNumber + streetName
            api_params = {
                'streetNumber': street_number,
                'streetName': street_name,
                'status': 'A',  # Active listings
                'pageSize': 50
            }
            
            # Add city filter ONLY if explicitly specified in user's query
            if components.city:
                api_params['city'] = components.city
                logger.info(f"🌍 [CROSS_CITY_ADDRESS] City specified: {components.city}")
            
            logger.info(f"🔍 [CROSS_CITY_ADDRESS] API params: {api_params}")
            
            # Execute search
            repliers_response = repliers_client.get('/listings', params=api_params)
            raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
            
            logger.info(f"📊 [CROSS_CITY_ADDRESS] Raw results: {len(raw_properties)}")
            
            # Filter by unit number if specified
            if unit_number:
                filtered = []
                unit_lower = unit_number.lower().replace('#', '').strip()
                for prop in raw_properties:
                    addr = prop.get('address', {})
                    prop_unit = str(addr.get('unitNumber', '') or '').lower().strip()
                    if prop_unit == unit_lower or unit_lower in prop_unit:
                        filtered.append(prop)
                raw_properties = filtered if filtered else raw_properties[:1]  # Fallback to first match
                logger.info(f"📊 [CROSS_CITY_ADDRESS] After unit filter: {len(raw_properties)}")
            
            if not raw_properties:
                address_str = f"{street_number} {street_name}"
                if unit_number:
                    address_str += f" Unit {unit_number}"
                return {
                    "success": True,
                    "response": f"I couldn't find any active listings at {address_str}. The property might be off-market or the address may need verification.",
                    "properties": [],
                    "property_count": 0,
                    "suggestions": [
                        "Try searching without the unit number",
                        f"Search properties on {street_name}",
                        "Check if address is correct"
                    ],
                    "filters": state.get_active_filters(),
                    "metadata": self._create_metadata_dict(
                        intent="address_search",
                        confidence=0.90,
                        reason=f"No active listings at {address_str}"
                    )
                }
            
            # Standardize properties
            standardize_func = get_standardize_property_data()
            standardized = [standardize_func(p) for p in raw_properties[:10]]
            
            # Update state
            state.last_property_results = standardized
            self.state_manager.save(state)
            
            # Build response
            first_prop = raw_properties[0]
            first_addr = first_prop.get('address', {})
            city = first_addr.get('city', 'Unknown city')
            
            address_str = f"{street_number} {street_name}"
            if unit_number:
                address_str += f" Unit {unit_number}"
            
            if len(raw_properties) == 1:
                response = f"Found 1 property at {address_str} in {city}."
            else:
                response = f"Found {len(raw_properties)} properties at {address_str}."
            
            logger.info(f"✅ [CROSS_CITY_ADDRESS] Found {len(raw_properties)} properties")
            
            return {
                "success": True,
                "response": response,
                "agent_response": response,
                "properties": standardized,
                "property_count": len(standardized),
                "suggestions": [
                    "Tell me more about this property",
                    "What's the neighborhood like?",
                    "Show similar properties"
                ],
                "filters": state.get_active_filters(),
                "metadata": self._create_metadata_dict(
                    intent="address_search",
                    confidence=0.95,
                    reason=f"Found properties at {address_str}"
                )
            }
            
        except Exception as e:
            logger.error(f"❌ [CROSS_CITY_ADDRESS] Error: {e}")
            import traceback
            traceback.print_exc()
            return self._handle_error(
                session_id,
                user_message,
                f"I had trouble searching for that address. Please try again."
            )

    def _handle_mls_lookup(
        self,
        session_id: str,
        user_message: str,
        mls_number: str,
        state: Any  # ConversationState type
    ) -> Dict[str, Any]:
        """
        Handle MLS number lookups to find a specific property.
        
        Args:
            session_id: Session identifier
            user_message: Original user message
            mls_number: MLS number to lookup (e.g., "C12652668")
            state: Current conversation state
            
        Returns:
            Standard response dict with the specific property (or not found message)
        """
        logger.info(f"🏷️ [MLS_HANDLER] Looking up MLS: {mls_number}")
        
        try:
            from services.repliers_client import client as repliers_client
            
            # Try direct MLS lookup first
            api_params = {
                'mlsNumber': mls_number,
                'status': 'A',  # Active listings
            }
            
            logger.info(f"🔍 [MLS_HANDLER] API params: {api_params}")
            
            # Execute search
            repliers_response = repliers_client.get('/listings', params=api_params)
            raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
            
            logger.info(f"📊 [MLS_HANDLER] Results: {len(raw_properties)}")
            
            # If no active listings found, try without status filter
            if not raw_properties:
                logger.info(f"🔄 [MLS_HANDLER] No active listings, trying all statuses")
                api_params_all = {'mlsNumber': mls_number}
                repliers_response = repliers_client.get('/listings', params=api_params_all)
                raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
                logger.info(f"📊 [MLS_HANDLER] Results (all statuses): {len(raw_properties)}")
            
            if not raw_properties:
                # MLS not found
                logger.info(f"❌ [MLS_HANDLER] MLS {mls_number} not found")
                return {
                    "success": True,
                    "response": f"I couldn't find a property with MLS number {mls_number}. Please verify the MLS number and try again.",
                    "properties": [],
                    "property_count": 0,
                    "suggestions": [
                        "Search by address instead",
                        "Try a different MLS number",
                        "Search properties in Toronto"
                    ],
                    "filters": state.get_active_filters(),
                    "metadata": self._create_metadata_dict(
                        intent="mls_lookup",
                        confidence=0.95,
                        reason=f"MLS {mls_number} not found"
                    )
                }
            
            # Standardize the property
            standardize_func = get_standardize_property_data()
            property_data = raw_properties[0]  # Should only be one result
            standardized = standardize_func(property_data)
            
            # Extract property details for response
            address = standardized.get('address', 'Unknown address')
            price = standardized.get('price', 'Price not available')
            beds = standardized.get('bedrooms', 'N/A')
            baths = standardized.get('bathrooms', 'N/A')
            
            # Update state with this property
            state.last_property_results = [standardized]
            self.state_manager.save(state)
            
            # Generate detailed response
            response_text = f"Found property MLS {mls_number}:\n\n📍 {address}\n💰 {price}\n🛏️ {beds} beds | 🚿 {baths} baths"
            
            logger.info(f"✅ [MLS_HANDLER] Found property: {address}")
            
            return {
                "success": True,
                "response": response_text,
                "agent_response": response_text,
                "properties": [standardized],
                "property_count": 1,
                "suggestions": [
                    "Tell me more about this property",
                    "What's the neighborhood like?",
                    "Show similar properties"
                ],
                "filters": state.get_active_filters(),
                "metadata": self._create_metadata_dict(
                    intent="mls_lookup",
                    confidence=0.98,
                    reason=f"Found property MLS {mls_number}"
                )
            }
            
        except Exception as e:
            logger.error(f"❌ [MLS_HANDLER] Error: {e}")
            import traceback
            traceback.print_exc()
            return self._handle_error(
                session_id,
                user_message,
                f"I had trouble looking up MLS {mls_number}. Please try again."
            )

    def _handle_postal_code_search(
        self,
        session_id: str,
        user_message: str,
        postal_code: str,
        city: Optional[str],
        state: Any,  # ConversationState type
        property_type_hint: Optional[str] = None  # NEW: 'commercial', 'residential', or 'condo'
    ) -> Dict[str, Any]:
        """
        Handle postal code searches with ACTUAL postal code filtering.
        
        RULE: When postal code is detected, search by city and FILTER by postal code FSA.
        This ensures properties returned actually match the postal code area.
        
        NEW: Supports property_type_hint from frontend buttons to filter for commercial/residential.
        """
        logger.info(f"📮 [POSTAL_CODE_HANDLER] Processing postal code search: {postal_code}")
        if property_type_hint:
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Property type from button: {property_type_hint}")
        
        # Get unified state for context clearing
        unified_state = self.state_manager.get_or_create(session_id)
        
        # Clear conflicting location context
        unified_state.clear_address_context()
        unified_state.location_state.neighborhood = None
        
        # Extract FSA (Forward Sortation Area) - first 3 characters of postal code
        # Canadian postal codes are in format: A1A 1A1 (letter-number-letter space number-letter-number)
        postal_code_clean = postal_code.replace(" ", "").upper()
        fsa = postal_code_clean[:3] if len(postal_code_clean) >= 3 else postal_code_clean
        
        logger.info(f"📮 [POSTAL_CODE_HANDLER] FSA extracted: {fsa} from postal code: {postal_code}")
        
        # Determine city for API search (FSA or auto-detect)
        search_city = city
        if not search_city:
            # Try to auto-detect city from postal code
            from services.postal_code_validator import postal_code_validator
            search_city = postal_code_validator.suggest_city_for_postal(postal_code)
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Auto-detected city: {search_city}")
        
        # Build API parameters - search with OR without city depending on availability
        api_params = {
            "pageSize": 100  # Get more results to filter from
        }
        
        # Only add city if we know it - allows cross-Canada postal code searches
        if search_city:
            api_params["city"] = search_city
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Searching in city: {search_city}")
        else:
            # For unknown postal codes, search without city restriction
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Unknown postal code region - searching across all cities")
        
        # CRITICAL: Add property type filter from button hint FIRST (highest priority)
        if property_type_hint == 'commercial':
            api_params['class'] = 'CommercialProperty'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Filtering for COMMERCIAL properties (button selection)")
        elif property_type_hint == 'condo':
            api_params['class'] = 'CondoProperty'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Filtering for CONDO properties (button selection)")
        elif property_type_hint == 'residential':
            api_params['class'] = 'ResidentialProperty'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Filtering for RESIDENTIAL properties (button selection)")
        
        # Add any existing filters (if no button hint was provided)
        current_filters = state.get_active_filters()
        if not property_type_hint and current_filters.get('property_type'):
            api_params['class'] = current_filters['property_type']
        if current_filters.get('bedrooms'):
            api_params['minBeds'] = current_filters['bedrooms']
        if current_filters.get('bathrooms'):
            api_params['minBaths'] = current_filters['bathrooms']
        if current_filters.get('min_price'):
            api_params['minPrice'] = current_filters['min_price']
        if current_filters.get('max_price'):
            api_params['maxPrice'] = current_filters['max_price']
        
        # CRITICAL FIX: Add listing_type filter to prevent rental/sale mixing
        # Check user message for explicit sale/rent request OR use existing filter
        listing_type = current_filters.get('listing_type')
        
        # If no explicit listing_type, check user message for sale/rent keywords
        if not listing_type:
            user_msg_lower = user_message.lower()
            if any(kw in user_msg_lower for kw in ['for sale', 'buy', 'purchase', 'buying']):
                listing_type = 'sale'
                logger.info(f"📮 [POSTAL_CODE_HANDLER] Detected 'sale' intent from message")
            elif any(kw in user_msg_lower for kw in ['rent', 'rental', 'lease', 'renting']):
                listing_type = 'rent'
                logger.info(f"📮 [POSTAL_CODE_HANDLER] Detected 'rent' intent from message")
        
        # Apply listing_type to API params
        if listing_type == 'rent':
            api_params['type'] = 'lease'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Added type: lease (rent requested)")
        elif listing_type == 'sale':
            api_params['type'] = 'sale'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Added type: sale (sale requested)")
        else:
            # Default to sale if not specified (most common use case)
            api_params['type'] = 'sale'
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Added type: sale (default)")
        
        logger.info(f"📮 [POSTAL_CODE_HANDLER] Searching with params: {api_params}")
        
        # Call Repliers API
        try:
            from services.repliers_client import client as repliers_client
            
            repliers_response = repliers_client.get('/listings', params=api_params)
            raw_properties = repliers_response.get('results', repliers_response.get('listings', []))
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Raw results from API: {len(raw_properties)}")
            
            # DEBUG: Log first property structure to understand postal code location
            if raw_properties and len(raw_properties) > 0:
                sample_prop = raw_properties[0]
                logger.info(f"📮 [DEBUG] Sample property keys: {list(sample_prop.keys())}")
                if 'address' in sample_prop:
                    logger.info(f"📮 [DEBUG] Address keys: {list(sample_prop['address'].keys())}")
                    logger.info(f"📮 [DEBUG] Sample postal code: {sample_prop['address'].get('zip', sample_prop['address'].get('postalCode', 'NOT FOUND'))}")
            
            # CRITICAL: Filter properties by postal code FSA with MULTIPLE fallback strategies
            # NEW: Early termination to prevent slow searches
            matched_properties = []
            no_postal_code_count = 0
            MAX_RESULTS = 20  # Stop after finding 20 matching properties
            
            for prop in raw_properties:
                # Early termination check - stop processing if we have enough results
                if len(matched_properties) >= MAX_RESULTS:
                    logger.info(f"✅ [EARLY_TERMINATION] Found {len(matched_properties)} properties matching FSA {fsa} - stopping search")
                    break
                
                # Strategy 1: Check multiple possible locations for postal code
                prop_zip = ''
                
                # Top-level fields
                prop_zip = prop.get('zip', '') or prop.get('postalCode', '') or prop.get('postal_code', '') or prop.get('postalcode', '')
                
                # Nested in address object
                if not prop_zip:
                    address_data = prop.get('address', {})
                    if address_data:
                        prop_zip = (address_data.get('zip', '') or 
                                   address_data.get('postalCode', '') or 
                                   address_data.get('postal_code', '') or 
                                   address_data.get('postalcode', '') or
                                   address_data.get('Zip', '') or
                                   address_data.get('PostalCode', ''))
                
                # Clean and normalize
                prop_zip_clean = prop_zip.replace(" ", "").replace("-", "").upper() if prop_zip else ''
                
                # Match if FSA (first 3 chars) matches
                if prop_zip_clean and prop_zip_clean.startswith(fsa):
                    matched_properties.append(prop)
                    logger.debug(f"📮 [POSTAL_CODE_HANDLER] ✅ Match: {prop_zip_clean} starts with {fsa}")
                elif not prop_zip_clean:
                    no_postal_code_count += 1
                    logger.debug(f"📮 [POSTAL_CODE_HANDLER] ⚠️ Property missing postal code")
                else:
                    logger.debug(f"📮 [POSTAL_CODE_HANDLER] ❌ No match: {prop_zip_clean} does not start with {fsa}")
            
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Filtered to {len(matched_properties)} properties matching FSA {fsa}")
            logger.info(f"📮 [POSTAL_CODE_HANDLER] {no_postal_code_count} properties missing postal code data")
            
            # FALLBACK: If no exact matches, find CLOSEST properties by sorting by distance or return first 10-15
            if len(matched_properties) == 0 and len(raw_properties) > 0:
                logger.warning(f"📮 [POSTAL_CODE_HANDLER] No exact FSA matches found. Using fallback: returning closest 15 properties in {search_city}")
                matched_properties = raw_properties[:15]  # Return first 15 as fallback
                logger.info(f"📮 [POSTAL_CODE_HANDLER] FALLBACK: Showing {len(matched_properties)} closest properties")
            
            # Determine if we're using fallback results
            using_fallback = (len(matched_properties) > 0 and 
                            no_postal_code_count == len(raw_properties))  # All properties lacked postal codes
            
            # Limit to reasonable number
            if not using_fallback:
                matched_properties = matched_properties[:10]
            else:
                matched_properties = matched_properties[:15]  # Show more when using fallback
            
            # Standardize properties
            standardize_func = get_standardize_property_data()
            standardized = [standardize_func(p) for p in matched_properties]
            
            # Update state (BOTH legacy and unified)
            state.location = search_city
            state.location_state.city = search_city
            state.location_state.postal_code = postal_code
            state.last_property_results = standardized
            
            # CRITICAL: Also save postal code to unified state for refinements
            unified_state.location_state.city = search_city
            unified_state.location_state.postal_code = postal_code
            logger.info(f"📮 [POSTAL_CODE_HANDLER] Saved postal code {postal_code} to unified state")
            
            # Save state (both legacy and unified)
            self.state_manager.save(state)
            self.unified_state_manager.save(unified_state)
            
            # Generate response with context about fallback
            if matched_properties:
                if using_fallback:
                    response_text = (f"I found {len(matched_properties)} properties near postal code {postal_code} in {search_city}. "
                                   f"Note: Exact postal code data wasn't available, so I'm showing nearby properties in the area.")
                else:
                    response_text = f"I found {len(matched_properties)} properties in postal code {postal_code}, {search_city}."
                    if len(matched_properties) >= 10:
                        response_text = f"I found several properties in postal code {postal_code}, {search_city}. Here are the top 10 listings."
            else:
                response_text = f"I couldn't find any properties currently listed in postal code {postal_code}. Try expanding your search to nearby areas."
            
            return {
                "success": True,
                "response": response_text,
                "agent_response": response_text,
                "properties": standardized,
                "property_count": len(standardized),
                "state_summary": state.get_summary(),
                "filters": state.get_active_filters(),
                "metadata": self._create_metadata_dict(
                    intent="postal_code_search",
                    confidence=0.95,
                    reason=f"Postal code search filtered by FSA {fsa}"
                )
            }
            
        except Exception as e:
            logger.error(f"📮 [POSTAL_CODE_HANDLER] Error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            
            # Fallback to general search
            return {
                "success": False,
                "response": f"I had trouble searching for postal code {postal_code}. Please try again.",
                "properties": [],
                "property_count": 0,
                "error": str(e)
            }
    
    def _extract_address_filters(self, current_filters: Dict[str, Any]) -> Dict[str, Any]:
        """Extract non-location filters for address search."""
        address_filters = {}
        
        # Property type and listing type
        if current_filters.get('property_type'):
            address_filters['propertyType'] = current_filters['property_type']
        if current_filters.get('listing_type'):
            address_filters['transactionType'] = current_filters['listing_type']
            
        # Price range
        if current_filters.get('min_price'):
            address_filters['minPrice'] = current_filters['min_price']
        if current_filters.get('max_price'):
            address_filters['maxPrice'] = current_filters['max_price']
            
        # Bedrooms/bathrooms  
        if current_filters.get('bedrooms'):
            address_filters['minBeds'] = current_filters['bedrooms']
        if current_filters.get('bathrooms'):
            address_filters['minBaths'] = current_filters['bathrooms']
            
        return address_filters
    
    def _get_address_search_filters(self, user_message: str, current_filters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Smart filter extraction for address searches.
        
        RULE: Only apply session filters if the user's message EXPLICITLY mentions them.
        For new address searches without filter keywords, return empty filters to avoid
        carrying over stale session state.
        
        This prevents: User searches "condos under $600K in Toronto" then
        "properties on King Street" - the second search should NOT auto-apply
        the $600K and condo filters from the first search.
        
        Args:
            user_message: The user's current search query
            current_filters: Session filters from previous searches
            
        Returns:
            Dict of filters to apply (only those mentioned in user_message)
        """
        message_lower = user_message.lower()
        address_filters = {}
        
        # Keywords that indicate user wants specific filters applied
        price_keywords = ['under', 'below', 'less than', 'max', 'budget', 'over', 'above', 'more than', 'min', '$', 'k', 'm', 'million', 'thousand']
        bedroom_keywords = ['bed', 'bedroom', 'br', '1 bed', '2 bed', '3 bed', '4 bed', '5 bed', '1br', '2br', '3br', '4br', '5br']
        bathroom_keywords = ['bath', 'bathroom', 'washroom']
        type_keywords = ['condo', 'house', 'townhouse', 'detached', 'semi', 'apartment', 'bungalow', 'duplex']
        
        # Check if user mentioned price
        has_price_mention = any(kw in message_lower for kw in price_keywords)
        if has_price_mention:
            if current_filters.get('min_price'):
                address_filters['minPrice'] = current_filters['min_price']
            if current_filters.get('max_price'):
                address_filters['maxPrice'] = current_filters['max_price']
            logger.info(f"💰 [ADDRESS_FILTERS] Price mentioned in query - applying price filters")
        
        # Check if user mentioned bedrooms
        has_bedroom_mention = any(kw in message_lower for kw in bedroom_keywords)
        if has_bedroom_mention:
            if current_filters.get('bedrooms'):
                address_filters['minBeds'] = current_filters['bedrooms']
            logger.info(f"🛏️ [ADDRESS_FILTERS] Bedrooms mentioned in query - applying bedroom filter")
        
        # Check if user mentioned bathrooms
        has_bathroom_mention = any(kw in message_lower for kw in bathroom_keywords)
        if has_bathroom_mention:
            if current_filters.get('bathrooms'):
                address_filters['minBaths'] = current_filters['bathrooms']
            logger.info(f"🛁 [ADDRESS_FILTERS] Bathrooms mentioned in query - applying bathroom filter")
        
        # Check if user mentioned property type
        has_type_mention = any(kw in message_lower for kw in type_keywords)
        if has_type_mention:
            if current_filters.get('property_type'):
                address_filters['propertyType'] = current_filters['property_type']
            logger.info(f"🏠 [ADDRESS_FILTERS] Property type mentioned in query - applying type filter")
        
        # Always apply listing type (sale/rent) as it's usually what user wants
        if current_filters.get('listing_type'):
            address_filters['transactionType'] = current_filters['listing_type']
        
        if not address_filters or address_filters.keys() == {'transactionType'}:
            logger.info(f"🔄 [ADDRESS_FILTERS] No specific filters in query - searching all properties on street")
        else:
            logger.info(f"✅ [ADDRESS_FILTERS] Applied filters from query: {address_filters}")
            
        return address_filters
    
    def _normalize_address_key(self, key: str) -> str:
        """
        Normalize addressKey for flexible street matching.
        
        Removes common street suffixes and directionals that cause mismatches.
        
        Args:
            key: Address key to normalize
            
        Returns:
            str: Normalized key for matching
        """
        if not key:
            return ""
        return (
            key.lower()
            .replace("street", "")
            .replace("st", "")
            .replace("road", "")
            .replace("rd", "")
            .replace("avenue", "")
            .replace("ave", "")
            .replace("boulevard", "")
            .replace("blvd", "")
            .replace("east", "")
            .replace("west", "")
            .replace("north", "")
            .replace("south", "")
            .replace("toronto", "")  # Remove city suffix
            .strip()  # Remove any leftover whitespace
        )
    
    def _matches_street_address(self, address_key: str, street_name: str) -> bool:
        """
        Check if a property's addressKey matches the street search using normalized tokens.
        
        NEW APPROACH: Match normalized street tokens instead of exact strings
        
        Example:
        - addressKey: "1581baystreettoronto" → normalized: "1581bay"
        - street_name: "Bay Street" → normalized: "bay" 
        - Result: "bay" in "1581bay" = True ✅
        
        This handles:
        - Different street suffixes (Street, St, Road, etc.)
        - Directionals (East, West, North, South)
        - Case variations
        - City suffixes
        
        Args:
            address_key: Property's addressKey (e.g. "1581baystreettoronto")
            street_name: User input street name (e.g. "Bay Street", "bay")
        
        Returns:
            bool: True if property is on this street
        """
        if not address_key or not street_name:
            return False
        
        # Normalize both sides for comparison
        norm_key = self._normalize_address_key(address_key)
        norm_street = self._normalize_address_key(street_name)
        
        # Match normalized street token within normalized address key
        return norm_street in norm_key and len(norm_street) >= 3  # Minimum 3 chars to avoid false matches
    
    def _fetch_street_properties_with_pagination(self, repliers_client, base_params: Dict, street_name: str) -> List[Dict]:
        """
        Fetch properties across multiple pages for street searches.
        
        PERFORMANCE IMPROVEMENT: Bay Street has hundreds of listings.
        Fetching only pageSize=200 from page 1 may miss them.
        
        Strategy:
        1. Loop through pages 1-5 (MAX_PAGES = 5)
        2. Use PAGE_SIZE = 200 per page  
        3. Stop early if we find enough street matches
        4. Deduplicate results by MLS number
        
        Args:
            repliers_client: API client
            base_params: Base search parameters
            street_name: Street name for normalized matching (e.g. "Bay Street")
        
        Returns:
            List[Dict]: All properties from paginated search
        """
        MAX_PAGES = 5
        PAGE_SIZE = 200
        MIN_MATCHES_TO_STOP = 50  # Stop early if we find enough matches
        
        all_properties = []
        seen_mls_numbers = set()
        total_matches_found = 0
        
        logger.info(f"🔄 [PAGINATION] Starting paginated search for street: '{street_name}'")
        
        for page in range(1, MAX_PAGES + 1):
            # Set pagination parameters
            page_params = base_params.copy()
            page_params['page'] = page
            page_params['pageSize'] = PAGE_SIZE
            
            logger.info(f"📄 [PAGINATION] Fetching page {page}/{MAX_PAGES} (pageSize={PAGE_SIZE})")
            
            try:
                # Make API call
                repliers_response = repliers_client.get('/listings', params=page_params)
                page_properties = repliers_response.get('results', repliers_response.get('listings', []))
                
                if not page_properties:
                    logger.info(f"📄 [PAGINATION] Page {page} returned 0 results - stopping pagination")
                    break
                
                # Deduplicate by MLS number
                new_properties = []
                for prop in page_properties:
                    mls_number = prop.get('mlsNumber') or prop.get('mls_number')
                    if mls_number and mls_number not in seen_mls_numbers:
                        seen_mls_numbers.add(mls_number)
                        new_properties.append(prop)
                
                all_properties.extend(new_properties)
                
                # Count potential street matches for early stopping
                page_matches = 0
                for prop in new_properties:
                    address_data = prop.get('address', {})
                    prop_address_key = address_data.get('addressKey', '')
                    if self._matches_street_address(prop_address_key, street_name):
                        page_matches += 1
                
                total_matches_found += page_matches
                
                logger.info(f"📄 [PAGINATION] Page {page}: {len(new_properties)} new properties, {page_matches} street matches")
                
                # Early stopping if we have enough matches
                if total_matches_found >= MIN_MATCHES_TO_STOP:
                    logger.info(f"🎯 [PAGINATION] Found {total_matches_found} matches - stopping early")
                    break
                
                # Stop if this page returned fewer results than PAGE_SIZE (last page)
                if len(page_properties) < PAGE_SIZE:
                    logger.info(f"📄 [PAGINATION] Page {page} incomplete ({len(page_properties)} < {PAGE_SIZE}) - last page reached")
                    break
                
            except Exception as e:
                logger.error(f"❌ [PAGINATION] Error fetching page {page}: {e}")
                break
        
        logger.info(f"✅ [PAGINATION] Completed: {len(all_properties)} total properties across {page} pages")
        return all_properties
    
    def _apply_post_address_filters(self, properties: List[Dict], filters: Optional[Dict[str, Any]]) -> List[Dict]:
        """
        Apply bedrooms, price, property type filters AFTER addressKey filtering.
        
        RULE: Apply filters after street/address filtering to maintain deterministic results.
        """
        if not filters:
            return properties
            
        filtered = properties.copy()
        
        # Apply bedroom filter
        if filters.get('minBeds'):
            min_beds = filters['minBeds']
            filtered = [
                prop for prop in filtered 
                if prop.get('bedrooms', 0) >= min_beds or prop.get('beds', 0) >= min_beds
            ]
            logger.info(f"🛏️ [POST_FILTER] Bedroom filter {min_beds}+: {len(properties)} → {len(filtered)}")
        
        # Apply price filters  
        if filters.get('minPrice'):
            min_price = filters['minPrice']
            filtered = [
                prop for prop in filtered
                if prop.get('listPrice', 0) >= min_price or prop.get('price', 0) >= min_price  
            ]
            logger.info(f"💰 [POST_FILTER] Min price ${min_price}: {len(properties)} → {len(filtered)}")
            
        if filters.get('maxPrice'):
            max_price = filters['maxPrice']
            filtered = [
                prop for prop in filtered
                if prop.get('listPrice', 0) <= max_price or prop.get('price', 0) <= max_price
            ]
            logger.info(f"💰 [POST_FILTER] Max price ${max_price}: {len(properties)} → {len(filtered)}")
        
        # Apply property type filter
        if filters.get('propertyType'):
            prop_type = filters['propertyType'].lower()
            filtered = [
                prop for prop in filtered
                if prop_type in (prop.get('details', {}).get('propertyType', '') or '').lower()
            ]
            logger.info(f"🏠 [POST_FILTER] Property type '{prop_type}': {len(properties)} → {len(filtered)}")
        
        return filtered
    
    def _format_address_for_user(self, components: Any) -> str:  # AddressComponents type
        """Format address components for user-friendly display."""
        parts = []
        
        if components.street_number:
            parts.append(components.street_number)
        if components.street_name:
            parts.append(components.street_name)
        if components.street_suffix:
            parts.append(components.street_suffix.title())
        if components.unit_number:
            parts.insert(-2, f"Unit {components.unit_number}")
            
        return " ".join(parts) if parts else "that address"
    
    def _convert_params_to_snake_case(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Convert camelCase parameters to snake_case for listings service."""
        conversion_map = {
            'transactionType': 'transaction_type',
            'pageSize': 'page_size',
            'propertyType': 'property_type',
            'minPrice': 'min_price',
            'maxPrice': 'max_price',
            'minBeds': 'min_bedrooms',
            'maxBeds': 'max_bedrooms',
            'minBaths': 'min_bathrooms',
            'maxBaths': 'max_bathrooms',
            'minSqft': 'min_sqft',
            'maxSqft': 'max_sqft',
            'postalCode': 'postal_code',
            'streetName': 'street_name',
            'streetNumber': 'street_number'
        }
        
        converted = {}
        for key, value in params.items():
            # Special handling for Repliers-specific parameters
            if key == 'addressKey':
                # For exact address matches, we'll need to parse the address
                # For now, skip this and let it fall back to city search
                continue
            elif key == 'q':
                # Text search - not supported by listings service directly
                # Skip for now, could be enhanced to parse into components
                continue
            else:
                snake_key = conversion_map.get(key, key)
                converted[snake_key] = value
            
        return converted
    
    def _handle_error(self, session_id: str, user_message: str, error: str) -> Dict[str, Any]:
        """Handle general errors."""
        response = "I'm sorry, I encountered an unexpected issue. Let's try again!"
        suggestions = [
            "Start a new search",
            "Show me properties in Toronto",
            "Help me find a property"
        ]
        
        return {
            "success": False,
            "response": response,
            "suggestions": suggestions,
            "properties": [],
            "property_count": 0,
            "error": error
        }
    
    def _format_property_details(self, property_data: Dict) -> str:
        """Format detailed property information."""
        details = f"**Property Details**\n\n"
        
        if property_data.get('address'):
            details += f"📍 **Address:** {property_data['address']}\n"
        if property_data.get('price'):
            details += f"💰 **Price:** ${property_data['price']:,}\n"
        if property_data.get('bedrooms'):
            details += f"🛏️ **Bedrooms:** {property_data['bedrooms']}\n"
        if property_data.get('bathrooms'):
            details += f"🚿 **Bathrooms:** {property_data['bathrooms']}\n"
        if property_data.get('sqft'):
            details += f"📏 **Square Feet:** {property_data['sqft']:,}\n"
        if property_data.get('property_type'):
            details += f"🏠 **Type:** {property_data['property_type']}\n"
        
        return details
    
    def _build_comparison(self, properties: List[Dict]) -> str:
        """Build a comparison between properties."""
        comparison = "**Property Comparison**\n\n"
        
        for i, prop in enumerate(properties, 1):
            comparison += f"**Property {i}:**\n"
            comparison += f"• {prop.get('address', 'N/A')}\n"
            comparison += f"• ${prop.get('price', 0):,}\n"
            comparison += f"• {prop.get('bedrooms', 'N/A')} bed, {prop.get('bathrooms', 'N/A')} bath\n"
            comparison += f"• {prop.get('sqft', 'N/A')} sqft\n\n"
        
        return comparison
    
    def get_intent_classifier_stats(self) -> Dict[str, Any]:
        """
        Get performance statistics from the HybridIntentClassifier.
        Useful for monitoring local vs GPT-4 usage.
        
        Returns:
            Dict with cache_hit_rate and other metrics
        """
        try:
            cache_hit_rate = intent_classifier.get_cache_hit_rate()
            return {
                "success": True,
                "cache_hit_rate": cache_hit_rate,
                "cache_hit_rate_percent": f"{cache_hit_rate:.2%}",
                "description": "Intent classification performance metrics",
                "local_first": "95%+ messages classified locally in < 5ms",
                "gpt_fallback": "Only used when confidence < 70%"
            }
        except Exception as e:
            logger.error(f"Error getting intent classifier stats: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# =============================================================================
# GLOBAL CHATBOT INSTANCE
# =============================================================================

# Initialize single global chatbot instance for use by API endpoints and process_user_message
chatbot_instance = ChatGPTChatbot()

# Alias for backwards compatibility
chatbot = chatbot_instance

logger.info(
    "Global chatbot instance initialized",
    extra={
        "backend": chatbot_instance.state_manager.backend,
        "transaction_manager_enabled": True
    }
)


def process_user_message(
    message: str,
    session_id: str,
    context: Optional[Dict] = None,
    property_type_hint: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to process a user message using the global chatbot instance.
    
    Args:
        message: User's message
        session_id: Session ID
        context: Optional context dictionary
        property_type_hint: Optional property type from frontend buttons ('residential', 'commercial', 'condo')
    """
    if property_type_hint:
        context = context or {}
        context['property_type_hint'] = property_type_hint
        logger.info(f"🎯 [BUTTON SELECTION] User selected property type: {property_type_hint}")
    
    return chatbot_instance.process_message(message, session_id, user_context=context)


# =============================================================================
# CLI TESTING
# =============================================================================

if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    
    print("🧪 Testing Enhanced ChatGPTChatbot (GPT-4 Pipeline)\n")
    
    bot = ChatGPTChatbot()
    sid = "cli_test_123"
    tests = [
        "Show me 2 bedroom condos in Toronto under 600k",
        "I'm looking for rentals",
        "How about condos with a swimming pool?",
        "Show houses under 800k"
    ]
    
    for t in tests:
        print("=" * 60)
        print(f"USER: {t}")
        out = bot.process_message(t, sid)
        print(f"BOT: {out['response']}")
        print(f"SUGGESTIONS: {out['suggestions']}")
        print(f"PROPERTIES: {out['property_count']}")
        print(f"STATE: {out['state_summary']}")
        print()
    
    print("✅ CLI tests completed!")
