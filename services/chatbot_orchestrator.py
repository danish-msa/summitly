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
from typing import Dict, List, Optional, Any
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
from services.intent_classifier import intent_classifier, UserIntent

# NEW: Import location validator for hybrid LLM + deterministic validation
from services.location_validator import get_location_validator

# NEW: Import address and street search services for priority routing
from services.address_intent_detector import get_address_intent_detector, AddressIntentType
from services.address_key_normalizer import get_address_key_normalizer
from services.repliers_filter_mapper import buildRepliersAddressSearchParams

# NEW: Import confirmation manager for robust UUID-based confirmation tracking
from services.confirmation_manager import (
    get_confirmation_manager,
    ConfirmationType,
    ConfirmationStatus
)

logger = logging.getLogger(__name__)

# 🔧 CONFIRMATION WORDS - Never extract entities from these
CONFIRMATION_WORDS = {
    'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'alright', 'correct', 'right',
    'no', 'nah', 'nope', 'not', 'never',
    'keep it same', 'keep same', 'keep it', 'same', 'that\'s fine', 'sounds good',
    'y', 'k', 'n'  # Single letter confirmations
}

def is_confirmation_word(message: str) -> bool:
    """
    Check if message is purely a confirmation word with no additional information.
    Critical: These messages should NOT be parsed as location/property queries.
    """
    clean = message.strip().lower()
    # Remove punctuation
    clean = re.sub(r'[.,!?]', '', clean)
    return clean in CONFIRMATION_WORDS

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

SYSTEM_PROMPT_INTERPRETER = """You are a precise real-estate assistant interpreter for Canadian properties (Toronto/GTA/Vancouver/Canada).

Input: user's message + current conversation filters (location, bedrooms, property_type, price_range, listing_type, amenities, etc.) + pending_clarification (if any)

IMPORTANT - Intent Classification System:
This system now has an INTENT CLASSIFIER that pre-screens messages. Your role is to extract FILTERS ONLY for messages that:
- Have explicit search criteria (location, bedrooms, price, etc.)
- Are refinements of existing searches
- Are property-related queries

DO NOT try to force search intent on:
- Off-topic messages (food, sports, weather, etc.) - these are blocked before reaching you
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
- ONLY ask clarifying questions when REQUIRED data is MISSING (e.g., no location at all)
- Examples:
  - Previous: "Are you looking for specific schools or general information?" User: "yes" → intent: "refine" (user confirming)
  - Previous: "Are you looking for specific schools?" User: "general information" → intent: "general_question"
  - User: "yes" with no pending question → intent: depends on context (could be confirming a search)

Output: JSON ONLY with keys:
- intent: one of ["search","refine","details","valuation","compare","general_question","reset","special_query"]
- filters: {
    location: string or null (Toronto, Mississauga, Milton, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, Ajax, Whitby, Oshawa, Hamilton, Kitchener, Waterloo, Guelph, Cambridge, Barrie, London, Ottawa, Kingston, Vancouver, Calgary, Edmonton, Montreal, etc. - IMPORTANT: If user says "GTA", use "Toronto" as the default city, or ask which GTA city they prefer),
    property_type: string or null (condo|detached|townhouse|semi-detached),
    bedrooms: number or null,
    bathrooms: number or null,
    min_price: number or null,
    max_price: number or null,
    min_sqft: number or null (minimum square footage),
    max_sqft: number or null (maximum square footage),
    listing_type: "sale" or "rent" or null (CRITICAL: ONLY set if user explicitly mentions "for sale", "buy", "purchase" OR "rent", "rental", "lease". If user just says "properties" or "condos" without specifying, leave as null to show BOTH sale AND rent),
    amenities: array of strings (pool, gym, parking, balcony, garden, etc.),
    list_date_from: string or null (YYYY-MM-DD format - start of date range),
    list_date_to: string or null (YYYY-MM-DD format - end of date range)
  }
- merge_with_previous: boolean (True = merge with existing filters, False = replace all - SET TO FALSE when user mentions a NEW/DIFFERENT city)
- clarifying_question: optional string (if you need clarification, ask user)

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

CRITICAL - Follow-up Questions:
When the search returns 0 results AND the user has multiple restrictive filters (e.g., 4 beds + 2 baths + specific neighborhood), ask a clarifying question:
- clarifying_question: "I couldn't find any properties matching those exact criteria in [location]. Would you like me to show you properties with different bedroom/bathroom counts, or expand the search to nearby areas?"

When the user changes location significantly (e.g., Toronto → Mississauga) after no results:
- clarifying_question: "Would you like me to search for the same criteria (4 beds, 2 baths, condos for rent) in Mississauga, or would you prefer to see any available properties there?"

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
            params["max_completion_tokens"] = 300  # Reduced for faster responses
            # GPT-5-nano only supports temperature=1 (default), so we omit it
            # Try forcing JSON mode for GPT-5
            params["response_format"] = {"type": "json_object"}
        else:
            params["max_tokens"] = 350  # Optimized: Reduced from 600 to 350 for 40% faster responses
            params["temperature"] = 0.3  # Slightly increased for more natural responses
        
        resp = client.chat.completions.create(**params)
        text = resp.choices[0].message.content.strip() if resp.choices[0].message.content else ""
        
        # Log the full response for debugging
        logger.info(f"📝 Summarizer full response (first 500 chars): {text[:500]}")
        
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
            logger.error(f"❌ Raw text (first 500 chars): {text[:500]}")
            
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
            
            # Attempt 2: Try to extract JSON object if wrapped in text
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
    - Maintains full conversation context
    - Fixes rental/sale mixing
    - Detects amenities correctly
    - Returns crisp ChatGPT-style responses
    """
    
    def __init__(self):
        self.state_manager = conversation_state_manager
        self.confirmation_manager = get_confirmation_manager()
        logger.info("✅ ChatGPTChatbot orchestrator loaded (GPT-4 pipeline + ConfirmationManager enabled)")

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
        1. Load/create conversation state
        2. Add user message to history
        3. Get session summary (for interpreter)
        4. Call GPT-4 interpreter for structured filters
        5. Handle clarifying questions
        6. Update state with interpreted filters
        7. Execute MLS search (if needed)
        8. Call GPT-4 summarizer for final response
        9. Save state
        
        Returns:
            {
                "success": bool,
                "response": str (main message),
                "suggestions": [str] (follow-ups),
                "properties": [dict] (search results),
                "property_count": int,
                "state_summary": str,
                "filters": dict
            }
        """
        logger.info(f"📨 Processing message for session {session_id}: '{user_message[:60]}...'")
        
        try:
            # STEP 1: Get conversation state
            state = self.state_manager.get_or_create(session_id)
            logger.debug(f"Current state: {state.get_summary()}")
            
            # Add user message to history
            state.add_conversation_turn("user", user_message)
            
            # STEP 1.4: Check if responding to pending confirmation OR requirements
            # Use ConfirmationManager for robust UUID-based confirmation tracking
            is_answering_confirmation = self.confirmation_manager.has_pending_confirmation(session_id)
            is_answering_requirements = (state.conversation_mode == "awaiting_requirements")
            
            # Initialize flags for special handling
            came_from_requirements = False
            applied_location_in_requirements = None
            
            if is_answering_confirmation:
                pending_confirmation = self.confirmation_manager.get_active_confirmation(session_id)
                if pending_confirmation:
                    confirmation_type = pending_confirmation.type.value
                    logger.info(f"💬 [CONFIRMATION RESPONSE] User responding to pending confirmation: {confirmation_type}")
                    logger.info(f"🔒 [MODE] Conversation mode: {state.conversation_mode}")
            elif is_answering_requirements:
                logger.info(f"📝 [REQUIREMENTS RESPONSE] User providing requirements after location change")
                logger.info(f"🔒 [MODE] Conversation mode: awaiting_requirements")
            
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
                        
                        # RULE: Check for postal code exclusivity - clear street context if postal detected
                        extracted_location = location_extractor.extract_location_entities(user_message)
                        if extracted_location.postalCode:
                            logger.info(f"📮 [POSTAL CODE EXCLUSIVITY] Postal code detected: {extracted_location.postalCode} - clearing street context")
                            # Clear street/address context for postal code search
                            state.clear_address_context()
                            # Handle as postal code search instead of address search
                            return self._handle_postal_code_search(
                                session_id=session_id,
                                user_message=user_message,
                                postal_code=extracted_location.postalCode,
                                city=extracted_location.city,
                                state=state
                            )
                        
                        # Handle address search immediately (no confirmation needed)
                        return self._handle_address_search(
                            session_id=session_id,
                            user_message=user_message,
                            address_result=address_result,
                            state=state
                        )
                
                # STEP 1.5: INTENT CLASSIFICATION (NEW - First line of defense)
                logger.info("🎯 [INTENT CLASSIFIER] Classifying user intent...")
                classified_intent, intent_metadata = intent_classifier.classify(
                    user_message=user_message,
                    current_filters=state.get_active_filters(),
                    last_search_count=len(state.last_property_results)
                )
                
                # Store classified intent in state
                state.last_classification_intent = classified_intent.value
                
                # Log classification results
                logger.info(f"🎯 [INTENT CLASSIFIER] Intent: {classified_intent.value}")
                logger.info(f"🎯 [INTENT CLASSIFIER] Reason: {intent_metadata['reason']}")
                logger.info(f"🎯 [INTENT CLASSIFIER] Confidence: {intent_metadata['confidence']}")
                if intent_metadata['requires_confirmation']:
                    logger.info(f"🎯 [INTENT CLASSIFIER] ⚠️ Requires confirmation: {intent_metadata['suggested_action']}")
            
            # STEP 1.5.5: PRIORITY #2 - Override intent if answering confirmation
            # Confirmation responses ALWAYS take precedence over classifier output
            confirmation_handled = False  # Track if we successfully handle confirmation
            if is_answering_confirmation:
                pending_confirmation = self.confirmation_manager.get_active_confirmation(session_id)
                if pending_confirmation:
                    confirmation_type = pending_confirmation.type.value
                    confirmation_context = pending_confirmation.payload or {}
                    logger.info(f"🔄 [PRIORITY #2] Processing confirmation override for: {confirmation_type}")
                    
                    # Check if user is providing a city name (single word city)
                    user_message_clean = user_message.strip().lower()
                    potential_cities = ['toronto', 'ottawa', 'mississauga', 'vancouver', 'calgary', 
                                       'edmonton', 'montreal', 'markham', 'vaughan', 'brampton',
                                       'hamilton', 'london', 'kitchener', 'windsor', 'halifax']
                    
                    # Positive confirmation patterns (yes, sure, ok, etc.)
                    positive_patterns = [
                        r'^(yes|yeah|yep|yup|sure|ok|okay|alright|correct|right)\.{0,3}$',
                        r'^(y|k)$',  # Single letter confirmations
                    ]
                    is_positive_response = any(re.match(pattern, user_message_clean) for pattern in positive_patterns)
                    
                    # Negative confirmation patterns (no, but with additional criteria)
                    negative_patterns = [
                        r'^(no|nope|nah|not)',  # Starts with "no"
                    ]
                    is_negative_response = any(re.match(pattern, user_message_clean) for pattern in negative_patterns)
                    has_additional_criteria = len(user_message.split()) > 1  # More than just "no"
                    
                    # Handle VAGUE_REQUEST confirmations (city name provided)
                    if confirmation_type == "vague_request" and user_message_clean in potential_cities:
                        # User answered with a city name - update location directly
                        logger.info(f"✅ [PRIORITY #2] User provided new location: {user_message_clean}")
                        
                        # Update the state location immediately (before GPT processing)
                        new_city = user_message_clean.capitalize()
                        state.location = new_city
                        state.location_state = LocationState(city=new_city)
                        logger.info(f"📍 [PRIORITY #2] Updated state location to: {new_city}")
                        
                        # Override the intent to property_search
                        classified_intent = UserIntent.PROPERTY_SEARCH
                        intent_metadata['reason'] = f"User answered confirmation with new location: {new_city}"
                        
                        # Clear the pending confirmation using ConfirmationManager
                        self.confirmation_manager.apply_confirmation(session_id, user_message)
                    
                    # Handle LOCATION_CHANGE confirmations (yes/no response)
                    elif confirmation_type == "location_change" and is_positive_response and not has_additional_criteria:
                        # User confirmed they want to proceed with the location change (simple "yes")
                        logger.info(f"✅ [PRIORITY #2] User confirmed location change")
                        logger.info(f"✅ [PRIORITY #2] Applying stored LocationState (NO re-extraction)")
                        
                        # 🔧 FIX: APPLY the stored location directly (don't re-extract)
                        new_location_state_dict = confirmation_context.get('new_location_state')
                        if new_location_state_dict:
                            # Reconstruct LocationState from stored dict
                            new_location_state = LocationState(**new_location_state_dict)
                            
                            # Apply it directly to state
                            state.location_state = new_location_state
                            if new_location_state.city:
                                state.location = new_location_state.city
                            
                            logger.info(f"📍 [PRIORITY #2] Applied location: {new_location_state.get_summary()}")
                            logger.info(f"🔒 [PRIORITY #2] Filters preserved: bedrooms={state.bedrooms}, price_range={state.price_range}, listing_type={state.listing_type}")
                        else:
                            logger.warning("⚠️ [PRIORITY #2] No new_location_state found in context!")
                        
                        # Clear confirmation using ConfirmationManager
                        self.confirmation_manager.apply_confirmation(session_id, user_message)
                        logger.info(f"✅ [CONFIRMATION] Resolved — exiting pipeline")
                        
                        # HARD RETURN - Trigger search immediately, do NOT continue pipeline
                        return self._execute_property_search(
                            state=state,
                            user_message=user_message,
                            session_id=session_id,
                            intent_reason="User confirmed location change - filters preserved",
                            confirmation_result="accepted"
                        )
                    
                    # Handle LOCATION_CHANGE with positive response + modifications (e.g., "yes show me with 2 beds")
                    elif confirmation_type == "location_change" and is_positive_response and has_additional_criteria:
                        # User said "yes" AND added modifications (e.g., "yes show me with 2 beds")
                        logger.info(f"✅ [PRIORITY #2] User confirmed location change with modifications")
                        logger.info(f"✅ [PRIORITY #2] Applying stored LocationState AND processing additional criteria")
                        
                        # Apply the stored location
                        new_location_state_dict = confirmation_context.get('new_location_state')
                        if new_location_state_dict:
                            new_location_state = LocationState(**new_location_state_dict)
                            state.location_state = new_location_state
                            if new_location_state.city:
                                state.location = new_location_state.city
                            logger.info(f"📍 [PRIORITY #2] Applied location: {new_location_state.get_summary()}")
                        
                        logger.info(f"🔧 [PRIORITY #2] Processing additional criteria: '{user_message}'")
                        
                        # Clear confirmation using ConfirmationManager
                        self.confirmation_manager.apply_confirmation(session_id, user_message)
                        logger.info(f"✅ [CONFIRMATION] Resolved — exiting pipeline")
                        
                        # HARD RETURN - Trigger search with additional criteria, do NOT continue pipeline
                        return self._execute_property_search(
                            state=state,
                            user_message=user_message,
                            session_id=session_id,
                            intent_reason="User confirmed location change and added new filters",
                            confirmation_result="accepted"
                        )
                    
                    # 🔧 SPECIAL CASE: Handle "start fresh" responses (should accept location change but clear filters)
                    elif (confirmation_type == "location_change" and 
                          ('start fresh' in user_message_clean or 
                           'fresh start' in user_message_clean or 
                           'new search' in user_message_clean or
                           (is_negative_response and ('fresh' in user_message_clean or 'new' in user_message_clean)))):
                        # User wants to accept location change but start with no filters
                        logger.info(f"🆕 [PRIORITY #2] User wants to start fresh with new location")
                        
                        # Apply the new location from stored confirmation context
                        new_location_state_dict = confirmation_context.get('new_location_state')
                        if new_location_state_dict:
                            new_location_state = LocationState(**new_location_state_dict)
                            state.location_state = new_location_state
                            if new_location_state.city:
                                state.location = new_location_state.city
                            logger.info(f"📍 [PRIORITY #2] Applied new location: {new_location_state.get_summary()}")
                        
                        # Clear ALL other filters for fresh start
                        state.property_type = None
                        state.bedrooms = None
                        state.price_range = (None, None)
                        state.listing_type = None
                        logger.info(f"🧹 [PRIORITY #2] Cleared all filters for fresh start")
                        
                        # Clear the pending confirmation using ConfirmationManager
                        self.confirmation_manager.apply_confirmation(session_id, user_message)
                        logger.info(f"✅ [CONFIRMATION] Resolved — starting fresh with new location")
                        
                        # HARD RETURN - Execute search with new location, no filters
                        return self._execute_property_search(
                            state=state,
                            user_message=user_message,
                            session_id=session_id,
                            intent_reason="User chose to start fresh with new location",
                            confirmation_result="start_fresh"
                        )
                    
                    # Handle LOCATION_CHANGE with negative response + modifications
                    elif confirmation_type == "location_change" and is_negative_response and has_additional_criteria:
                        # User said "no" but added modifications (e.g., "no make it 3 beds")
                        logger.info(f"❌ [PRIORITY #2] User rejected location change with modifications")
                        logger.info(f"🔒 [PRIORITY #2] Keeping original location: {state.location}")
                        logger.info(f"🔧 [PRIORITY #2] Processing additional criteria: '{user_message}'")
                        
                        # Clear the pending confirmation using ConfirmationManager (user rejected it)
                        self.confirmation_manager.reject_confirmation(session_id, user_message)
                        logger.info(f"✅ [CONFIRMATION] Resolved — exiting pipeline")
                        
                        # HARD RETURN - Search with current location and new filters, do NOT continue pipeline
                        return self._execute_property_search(
                            state=state,
                            user_message=user_message,
                            session_id=session_id,
                            intent_reason="User rejected location change but added filters",
                            confirmation_result="rejected"
                        )
                    
                    # Handle pure negative response (just "no")
                    elif confirmation_type == "location_change" and is_negative_response and not has_additional_criteria:
                        # User just said "no" without modifications
                        logger.info(f"❌ [PRIORITY #2] User rejected location change")
                        logger.info(f"🔒 [PRIORITY #2] Keeping original location: {state.location}")
                        
                        # Clear the pending confirmation using ConfirmationManager
                        self.confirmation_manager.reject_confirmation(session_id, user_message)
                        logger.info(f"✅ [CONFIRMATION] Resolved — exiting pipeline")
                        
                        # Respond and don't trigger search - HARD RETURN
                        response = f"Got it! I'll keep searching in {state.location}. Let me know if you'd like to adjust any filters."
                        state.add_conversation_turn("assistant", response)
                        self.state_manager.save(state)
                        return {
                            "success": True,
                            "response": response,
                        "suggestions": [
                            f"Show me properties under $800k",
                            f"Find 3 bedroom homes",
                            f"Actually, let's try Ottawa"
                        ],
                        "properties": [],
                        "property_count": 0,
                        "state_summary": state.get_summary(),
                        "filters": state.get_active_filters(),
                        "intent": "confirmation_rejected",
                        "mode": "normal",
                        "confirmation_result": "rejected",
                        "action": "none"
                    }
            
            # 🔒 CATCH-ALL: If we're still in awaiting_confirmation mode but didn't match any handler above
            # This handles edge cases like:
            # - Ambiguous responses ("maybe", "I'm not sure")
            # - Non-standard confirmation types that weren't handled
            # - Missing confirmation context
            # CRITICAL: We must NEVER let confirmation responses be treated as general chat
            if is_answering_confirmation:
                logger.warning(f"⚠️ [CONFIRMATION CATCH-ALL] Still in awaiting_confirmation mode but no handler matched")
                pending_confirmation = self.confirmation_manager.get_active_confirmation(session_id)
                if pending_confirmation:
                    confirmation_type = pending_confirmation.type.value
                    logger.warning(f"⚠️ [CONFIRMATION CATCH-ALL] Confirmation type: {confirmation_type}")
                logger.warning(f"⚠️ [CONFIRMATION CATCH-ALL] User message: {user_message}")
                
                # Clear confirmation to prevent getting stuck
                self.confirmation_manager.expire_confirmation(session_id, "Ambiguous response - clearing to prevent stuck state")
                
                # Ask for clarification rather than treating as general chat
                response = (
                    f"I didn't quite catch that. Could you please confirm with 'yes' if you'd like to proceed, "
                    f"or 'no' if you'd like to stay with {state.location}?"
                )
                
                state.add_conversation_turn("assistant", response)
                self.state_manager.save(state)
                
                return {
                    "success": True,
                    "response": response,
                    "suggestions": [
                        "Yes, let's proceed",
                        "No, keep it as is",
                        f"No, but show me 3 bedrooms in {state.location}"
                    ],
                    "properties": [],
                    "property_count": 0,
                    "state_summary": state.get_summary(),
                    "filters": state.get_active_filters(),
                    "intent": "confirmation_clarification_needed"
                }
            
            # STEP 1.6: Handle special intents that don't need GPT processing
            
            # Handle OFF_TOPIC - Never trigger MLS search
            if classified_intent == UserIntent.OFF_TOPIC:
                logger.info("🚫 [OFF-TOPIC] Detected off-topic message, responding gracefully")
                response = (
                    "Nice! Though I'm specifically here to help with real estate in Toronto and the GTA. "
                    "Let me know if you'd like to search for properties, learn about neighborhoods, "
                    "or get market insights!"
                )
                suggestions = [
                    "Show me properties in Toronto",
                    "Tell me about neighborhoods",
                    "What's the market like?"
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
                    "intent": "off_topic"
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
                    message=response,
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
            
            # Handle PROPERTY_CHANGE_REQUEST - Location change confirmation
            if classified_intent == UserIntent.PROPERTY_CHANGE_REQUEST:
                logger.info("🌆 [LOCATION CHANGE] Detected location change, asking for confirmation")
                
                old_location = intent_metadata.get('old_location', 'previous location')
                new_location = intent_metadata.get('new_location', 'new location')
                current_filters = state.get_active_filters()
                
                # 🔧 FIX: Extract the NEW location NOW (before confirmation) and store it
                logger.info(f"📍 [LOCATION CHANGE] Extracting NEW location from: '{user_message}'")
                previous_location = state.location_state if hasattr(state, 'location_state') else LocationState()
                new_location_state = location_extractor.extract_location_entities(
                    user_message,
                    previous_location=previous_location
                )
                logger.info(f"✅ [LOCATION CHANGE] Extracted new location state: {new_location_state.get_summary()}")
                
                # Build list of current criteria (excluding location)
                other_criteria = []
                if current_filters.get('bedrooms'):
                    other_criteria.append(f"{current_filters['bedrooms']} bedrooms")
                if current_filters.get('property_type'):
                    other_criteria.append(current_filters['property_type'])
                if current_filters.get('max_price'):
                    price_str = f"under ${current_filters['max_price']:,}"
                    other_criteria.append(price_str)
                if current_filters.get('listing_type'):
                    other_criteria.append(f"for {current_filters['listing_type']}")
                
                if other_criteria:
                    criteria_str = ", ".join(other_criteria)
                    response = (
                        f"Sure! I can search in {new_location}. Would you like me to keep "
                        f"your current criteria ({criteria_str}), or start fresh?"
                    )
                    suggestions = [
                        f"Yes, keep {criteria_str}",
                        "Show me any properties",
                        "Let me specify new criteria"
                    ]
                    
                    # CONFIRMATION QUESTION - user must answer yes/no
                    # Set pending confirmation with STORED LocationState using ConfirmationManager
                    confirmation_id = self.confirmation_manager.create_confirmation(
                        session_id=session_id,
                        confirmation_type=ConfirmationType.LOCATION_CHANGE,
                        message=response,
                        payload={
                            "old_location": old_location,
                            "new_location": new_location,
                            "new_location_state": new_location_state.to_dict(),
                            "keep_filters": other_criteria
                        }
                    )
                    response_mode = "awaiting_confirmation"
                    requires_confirmation = True
                    
                else:
                    # REQUIREMENTS QUESTION - user can provide filters OR say "no" to proceed
                    # This is NOT a confirmation - don't set pending_confirmation
                    response = f"Got it! I'll show you available properties in {new_location}.\nWould you like to add any filters like price range, bedrooms, or property type?"
                    suggestions = [
                        "No filters needed",
                        "2 bedroom condos", 
                        "Houses under 800k"
                    ]
                    
                    # 🔧 CRITICAL FIX: Set mode to awaiting_requirements, NOT awaiting_confirmation
                    # "no" here means "no filters, proceed" NOT "reject location change"
                    state.conversation_mode = "awaiting_requirements"
                    state.pending_requirements_context = {
                        "new_location": new_location,
                        "new_location_state": new_location_state.to_dict()
                    }
                    response_mode = "awaiting_requirements"
                    requires_confirmation = False
                
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
                    "intent": "location_change_confirmation" if requires_confirmation else "location_change_requirements",
                    "requires_confirmation": requires_confirmation,
                    "mode": response_mode,
                    "confirmation_result": None,
                    "action": "none"
                }
            
            # STEP 2: Build session summary for interpreter (with clarification context)
            # FIX #2: Check if the last assistant message was a clarifying question
            last_turn = state.conversation_history[-2] if len(state.conversation_history) >= 2 else None
            pending_clarification = None
            if last_turn and last_turn.get('role') == 'assistant':
                last_content = last_turn.get('content', '')
                if '?' in last_content:
                    pending_clarification = last_content
            
            session_summary = {
                "filters": state.get_active_filters(),
                "last_search_count": len(state.last_property_results),
                "search_count": state.search_count,
                "last_search_results": state.last_property_results[:3] if state.last_property_results else [],
                "pending_clarification": pending_clarification  # NEW: helps interpreter understand context
            }
            
            # STEP 3: Extract location entities FIRST (before GPT interpreter)
            logger.info("📍 Extracting location entities...")
            previous_location = state.location_state if hasattr(state, 'location_state') else LocationState()
            
            # 🔧 CRITICAL FIX: NEVER extract from confirmation words
            if is_confirmation_word(user_message):
                if confirmation_handled:
                    # This confirmation was already handled in Priority #2 - skip extraction
                    logger.info(f"✅ [CONFIRMATION] Confirmation already handled - using existing location")
                    extracted_location = state.location_state
                elif state.conversation_mode == "awaiting_confirmation":
                    # This is a confirmation response - location already applied
                    logger.info(f"✅ [CONFIRMATION] '{user_message}' is confirmation word in awaiting_confirmation mode - using existing location")
                    extracted_location = state.location_state
                else:
                    # Confirmation word WITHOUT pending confirmation = treat as general chat
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
                        "intent": "general_chat"
                    }
            
            # 🔧 FIX: If confirmation already applied location, SKIP extraction
            elif (is_answering_confirmation and 
                state.pending_confirmation_type == "location_change"):
                # LocationState was already applied in confirmation handler
                # Just reuse the current state.location_state
                logger.info(f"✅ [CONFIRMATION] Using already-applied location state: {state.location_state.get_summary()}")
                extracted_location = state.location_state
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
                            message=response,
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
                            "intent": "postal_code_confirmation",
                            "requires_confirmation": True
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
                        # Ask user to confirm city (postal code not in our map)
                        logger.info(f"📮 [POSTAL CODE CONFIRMATION] Postal code '{extracted_location.postalCode}' provided without city")
                        response = (
                            f"I found postal code {extracted_location.postalCode}. Which city would you like to search in?"
                        )
                        suggestions = [
                            "Toronto",
                            "Mississauga",
                            "Vaughan",
                            "Markham"
                        ]
                        
                        confirmation_id = self.confirmation_manager.create_confirmation(
                            session_id=session_id,
                            confirmation_type=ConfirmationType.POSTAL_CODE_CITY,
                            message=response,
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
                            "intent": "postal_code_confirmation",
                            "requires_confirmation": True
                        }
            
            # Handle response to postal_code_city confirmation
            if is_answering_confirmation:
                pending_confirmation = self.confirmation_manager.get_active_confirmation(session_id)
                if (pending_confirmation and 
                    pending_confirmation.type == ConfirmationType.POSTAL_CODE_CITY):
                    confirmation_context = pending_confirmation.payload or {}
                    postal_code = confirmation_context.get('postal_code')
                    
                    # Extract city from user's response
                    if extracted_location.city:
                        # City was extracted, combine with postal code
                        logger.info(f"✅ [POSTAL CODE CONFIRMATION] User provided city: {extracted_location.city}")
                        
                        # VALIDATE POSTAL CODE AGAINST CITY
                        from services.postal_code_validator import postal_code_validator
                    validation = postal_code_validator.validate_postal_city_match(postal_code, extracted_location.city)
                    
                    if not validation['is_valid']:
                        # Postal code doesn't match city - use correct city instead
                        logger.warning(f"⚠️ [POSTAL VALIDATOR] User said {extracted_location.city} but {postal_code} is in {validation['correct_city']}")
                        extracted_location.city = validation['correct_city']
                        # Store warning message for user
                        state.postal_city_mismatch_message = validation['message']
                    
                    extracted_location.postalCode = postal_code
                    logger.info(f"📮 [POSTAL CODE] Combined: {postal_code} + {extracted_location.city}")
                    self.confirmation_manager.apply_confirmation(session_id, user_message)
                else:
                    # Try to extract city from message
                    message_lower = user_message.lower().strip()
                    potential_cities = ['toronto', 'mississauga', 'vaughan', 'markham', 'brampton', 
                                       'richmond hill', 'oakville', 'burlington', 'ajax', 'whitby']
                    
                    matched_city = None
                    for city in potential_cities:
                        if city in message_lower:
                            matched_city = city.title()
                            break
                    
                    if matched_city:
                        # VALIDATE POSTAL CODE AGAINST CITY
                        from services.postal_code_validator import postal_code_validator
                        validation = postal_code_validator.validate_postal_city_match(postal_code, matched_city)
                        
                        if not validation['is_valid']:
                            # Postal code doesn't match city - use correct city instead
                            logger.warning(f"⚠️ [POSTAL VALIDATOR] User said {matched_city} but {postal_code} is in {validation['correct_city']}")
                            matched_city = validation['correct_city']
                            # Store warning message for user
                            state.postal_city_mismatch_message = validation['message']
                        
                        extracted_location.city = matched_city
                        extracted_location.postalCode = postal_code
                        logger.info(f"✅ [POSTAL CODE CONFIRMATION] Matched city: {matched_city}")
                        logger.info(f"📮 [POSTAL CODE] Combined: {postal_code} + {matched_city}")
                        state.clear_pending_confirmation()
                    else:
                        # Still couldn't extract city, ask again
                        logger.warning(f"⚠️ [POSTAL CODE CONFIRMATION] Could not extract city from: {user_message}")
                        response = f"I'm sorry, I didn't catch the city name. Could you please specify which city you'd like to search {postal_code} in?"
                        suggestions = ["Toronto", "Mississauga", "Vaughan"]
                        
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
                            "intent": "postal_code_confirmation",
                            "requires_confirmation": True
                        }
            
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
            filters_from_gpt = interpreter_out.get("filters", {})
            merge = interpreter_out.get("merge_with_previous", True)
            clarifying = interpreter_out.get("clarifying_question")
            
            logger.info(f"🎯 Intent: {intent}")
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
                    # Create new location_state
                    new_location_state = LocationState()
                    new_location_state.city = validation_result.final_city
                    filters_from_gpt['location_state'] = new_location_state
                logger.info(f"✅ [LOCATION_VALIDATION] Corrected location to: {validation_result.final_city}")
            elif validation_result.final_city:
                # Validation passed - use the validated city
                filters_from_gpt['location'] = validation_result.final_city
                logger.info(f"✅ [LOCATION_VALIDATION] Validated: {validation_result.final_city}")
            
            # STEP 5.5: Clear pending confirmation if it was a location_change confirmation
            # (we've now extracted the location from the original message)
            if (is_answering_confirmation and 
                state.pending_confirmation_type == "location_change" and
                not extracted_location.is_empty()):
                logger.info(f"✅ [CONFIRMATION] Location extracted, clearing pending confirmation")
                state.clear_pending_confirmation()
            
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
            
            if updates:
                state.update_from_dict(updates)
                logger.info(f"✅ State updated: {state.get_summary()}")
            
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
                # STEP 11a: Handle street-only search with specialized service
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
                    
                    # STEP 11b.2: Standard search using enhanced_mls_service
                    logger.info("🔍 Executing standard MLS search...")
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
            
            # Save state
            self.state_manager.save(state)
            
            # Use existing property standardization from voice_assistant_clean.py
            standardize_property_data = get_standardize_property_data()  # Lazy import
            formatted_properties = []
            for i, prop in enumerate(properties[:10]):  # Return top 10
                logger.info(f"🏠 [DEBUG] Property {i+1} raw data keys: {list(prop.keys()) if isinstance(prop, dict) else type(prop)}")
                logger.info(f"🏠 [DEBUG] Sample prop data: price={prop.get('price')} address={prop.get('address')} bedrooms={prop.get('bedrooms')}")
                
                # Use the existing standardization function (no duplication)
                formatted_prop = standardize_property_data(prop)
                formatted_properties.append(formatted_prop)
                logger.info(f"✅ [DEBUG] Standardized property {i+1}: price={formatted_prop.get('price')}, address={formatted_prop.get('address', '')[:50] if formatted_prop.get('address') else 'N/A'}")
            
            # Return structured result
            return {
                "success": True,
                "response": assistant_text,
                "suggestions": suggestions,
                "properties": formatted_properties,
                "property_count": total,
                "state_summary": state.get_summary(),
                "filters": state.get_active_filters()
            }
        
        except Exception as e:
            logger.exception(f"❌ Error processing message")
            return self._handle_error(session_id, user_message, str(e))
    
    # Removed _format_price_for_frontend - using standardize_property_data from voice_assistant_clean.py instead

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
        
        is_refining = (
            (filters_from_gpt.get("bedrooms") is not None or 
             filters_from_gpt.get("bathrooms") is not None or
             filters_from_gpt.get("property_type") is not None) and
            not location_changed  # Not a location change
        )
        
        # Only clear price on TRUE fresh search if price was NOT extracted
        # DON'T clear if: 1) Refining search, 2) Price mentioned, 3) User confirmed to keep filters
        if not merge and not price_mentioned and not is_refining and current_state and current_state.price_range != (None, None):
            # Fresh search without price mentioned - but DON'T clear if extracting now or refining
            logger.info(f"🏠 [FRESH SEARCH] Clearing old price range (not mentioned in new search)")
            updates["price_range"] = (None, None)
        elif is_refining and current_state and current_state.price_range != (None, None):
            # User is refining search - KEEP existing price range
            logger.info(f"✅ [REFINEMENT] Keeping existing price range: {current_state.price_range}")
            if "price_range" not in updates or updates.get("price_range") == (None, None):
                updates["price_range"] = current_state.price_range
        
        # Listing type handling - Critical for rental/sale distinction
        listing_type_mentioned = filters_from_gpt.get("listing_type") is not None
        if not merge and not listing_type_mentioned and current_state and current_state.listing_type:
            # Fresh search without explicit listing_type: inherit from state but log it
            logger.info(f"🏠 [FRESH SEARCH] No listing_type mentioned, keeping current: {current_state.listing_type}")
        
        # Check for explicit budget removal
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
        
        should_remove_budget = any(re.search(pattern, user_message, re.I) for pattern in budget_removal_patterns)
        
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
        elif should_remove_budget:
            logger.info(f"🏠 [BUDGET REMOVAL] User requested to remove budget constraints: '{user_message}'")
            updates["price_range"] = (None, None)  # Clear budget
        else:
            # Fix common misinterpretation: "$2-$3" should be $2M-$3M for sales
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
            "filters": {}
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
                        "intent": "valuation",
                        "mls_number": mls_number,
                        "suggestions": suggestions,
                        "properties": [],
                        "property_count": 0,
                        "filters": state.get_active_filters()
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
            "filters": state.get_active_filters()
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
            "filters": state.get_active_filters()
        }
    
    def _execute_property_search(
        self, 
        state: ConversationState, 
        user_message: str, 
        session_id: str,
        intent_reason: str,
        confirmation_result: str
    ) -> Dict[str, Any]:
        """
        Execute property search after confirmation is resolved.
        This is a terminal action - returns immediately without continuing pipeline.
        
        Args:
            state: Current conversation state
            user_message: User's message (may contain additional filters)
            session_id: Session identifier
            intent_reason: Reason for the search intent
            confirmation_result: "accepted" or "rejected"
            
        Returns:
            Response dict with mode, confirmation_result, and action fields for frontend
        """
        logger.info(f"🔍 [SEARCH EXECUTION] Starting property search after confirmation")
        logger.info(f"📍 Location: {state.location}")
        logger.info(f"🔧 Filters: {state.get_active_filters()}")
        logger.info(f"💬 User message: '{user_message}'")
        
        # Extract any additional filters from the user message using GPT-4
        # Build session summary for interpreter
        session_summary = {
            "filters": state.get_active_filters(),
            "last_search_count": len(state.last_property_results),
            "search_count": state.search_count,
            "last_search_results": state.last_property_results[:3] if state.last_property_results else []
        }
        
        # Call GPT-4 interpreter to extract filters
        logger.info("🤖 [GPT-4 INTERPRETER] Extracting filters from confirmation response")
        interpreter_out = ask_gpt_interpreter(session_summary, user_message)
        
        # Apply interpreted filters
        intent = interpreter_out.get("intent", "search")
        filters = interpreter_out.get("filters", {})
        
        if filters.get("bedrooms"):
            state.bedrooms = filters["bedrooms"]
            logger.info(f"🛏️ Updated bedrooms: {state.bedrooms}")
        
        if filters.get("property_type"):
            state.property_type = filters["property_type"]
            logger.info(f"🏠 Updated property_type: {state.property_type}")
        
        if filters.get("max_price"):
            state.price_range = (state.price_range[0] if state.price_range else None, filters["max_price"])
            logger.info(f"💰 Updated price_range: {state.price_range}")
        
        if filters.get("min_price"):
            state.price_range = (filters["min_price"], state.price_range[1] if state.price_range else None)
            logger.info(f"💰 Updated price_range: {state.price_range}")
        
        # Execute MLS search
        logger.info("🔍 [MLS SEARCH] Executing property search")
        search_results = enhanced_mls_service.search_properties(
            state,
            limit=10,
            user_message=user_message
        )
        
        properties = search_results.get("results", [])
        total = search_results.get("total", 0)
        
        # Update state with results
        state.last_property_results = properties[:10]
        state.search_count += 1
        
        # Generate response
        if properties:
            response = interpreter_out.get("message", f"I found {total} properties in {state.location}!")
        else:
            response = f"I couldn't find any properties matching your criteria in {state.location}. Would you like to adjust your filters?"
        
        # Add suggestions
        suggestions = [
            "Show me more details",
            "Adjust my filters",
            "Try a different location"
        ]
        
        # Save state
        state.add_conversation_turn("assistant", response)
        self.state_manager.save(state)
        
        # Return response with required fields for frontend
        return {
            "success": True,
            "response": response,
            "suggestions": suggestions,
            "properties": properties[:10],
            "property_count": total,
            "state_summary": state.get_summary(),
            "filters": state.get_active_filters(),
            "intent": "property_search",
            "mode": "normal",
            "confirmation_result": confirmation_result,
            "action": "search"
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
            "query_type": query_type
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
            # Step 1: Normalize address to addressKey format
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
            additional_filters = self._extract_address_filters(state.get_active_filters())
            
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
                    # Exact address search - use all results
                    properties = raw_properties
                
                # Apply additional filters AFTER addressKey filtering
                properties = self._apply_post_address_filters(properties, additional_filters)
                
                # Log search results
                logger.info(f"📊 [ADDRESS_HANDLER] Final results after filtering: {len(properties)}")
                
                # Step 4: Handle results - STRICT no-fallback rule
                if not properties:
                    # NO FALLBACK RULE - do not fall back to city search
                    address_description = self._format_address_for_user(address_result.components)
                    search_type = "exact address" if not is_street_search else "street"
                    
                    response = f"No active listings found on {address_description}."
                    
                    suggestions = [
                        "Search nearby streets",
                        "Remove filters", 
                        f"Search the entire {normalized.components.city or 'city'}"
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
    
    def _handle_postal_code_search(
        self,
        session_id: str,
        user_message: str,
        postal_code: str,
        city: Optional[str],
        state: Any  # ConversationState type
    ) -> Dict[str, Any]:
        """
        Handle postal code searches with exclusivity (clears street context).
        
        RULE: When postal code is detected, clear street/neighborhood and use postal-only search.
        """
        logger.info(f"📮 [POSTAL_CODE_HANDLER] Processing postal code search: {postal_code}")
        
        # Clear conflicting location context
        state.clear_address_context()
        state.clear_neighborhood_context()
        
        # Use normal orchestrator flow for postal code search (not address priority)
        # This will trigger standard location extraction and MLS search
        logger.info(f"📮 [POSTAL_CODE_HANDLER] Delegating to standard search flow")
        
        # Set postal code in location context
        current_filters = state.get_active_filters()
        current_filters['postal_code'] = postal_code
        if city:
            current_filters['location'] = city
            
        # Continue with normal processing (will be handled by location extraction)
        return self.process_message(session_id, user_message, skip_address_detection=True)
    
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


# Global chatbot instance
chatbot = ChatGPTChatbot()


def process_user_message(
    message: str,
    session_id: str,
    context: Optional[Dict] = None
) -> Dict[str, Any]:
    """
    Convenience function to process a user message.
    """
    return chatbot.process_message(message, session_id, context)


# ---------------- quick CLI test ----------------
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
