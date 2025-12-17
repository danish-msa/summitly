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

logger = logging.getLogger(__name__)

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
    listing_type: "sale" or "rent" (IMPORTANT: detect rental vs purchase intent),
    amenities: array of strings (pool, gym, parking, balcony, garden, etc.),
    list_date_from: string or null (YYYY-MM-DD format - start of date range),
    list_date_to: string or null (YYYY-MM-DD format - end of date range)
  }
- merge_with_previous: boolean (True = merge with existing filters, False = replace all - SET TO FALSE when user mentions a NEW/DIFFERENT city)
- clarifying_question: optional string (if you need clarification, ask user)

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

Special Queries (use intent: "special_query" for non-property searches):
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
        
        # Try parsing JSON
        try:
            result = json.loads(text)
            logger.info("✅ Successfully parsed summarizer JSON response")
            return result
        except json.JSONDecodeError as json_err:
            logger.error(f"❌ JSON parsing failed: {json_err}")
            logger.error(f"❌ Raw text that failed to parse: {text[:300]}")
            raise
    except (json.JSONDecodeError, Exception) as e:
        if isinstance(e, json.JSONDecodeError):
            logger.error(f"⚠️ Summarizer returned invalid JSON: {text[:200] if 'text' in locals() else 'empty'}...")
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
        logger.info("✅ ChatGPTChatbot orchestrator loaded (GPT-4 pipeline enabled)")

    def process_message(
        self,
        user_message: str,
        session_id: str,
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
            extracted_location = location_extractor.extract_location_entities(
                user_message,
                previous_location=previous_location
            )
            logger.info(f"📍 Extracted location: {extracted_location.get_summary()}")
            
            # STEP 4: Call GPT-4 interpreter
            interpreter_out = ask_gpt_interpreter(session_summary, user_message)
            intent = interpreter_out.get("intent", "general_question")
            filters_from_gpt = interpreter_out.get("filters", {})
            merge = interpreter_out.get("merge_with_previous", True)
            clarifying = interpreter_out.get("clarifying_question")
            
            logger.info(f"🎯 Intent: {intent}")
            logger.debug(f"Filters from GPT: {filters_from_gpt}")
            
            # STEP 5: Merge extracted location into filters
            if not extracted_location.is_empty():
                # Add location entities to filters
                if extracted_location.city:
                    filters_from_gpt['location'] = extracted_location.city
                
                # Store full location_state for later use
                filters_from_gpt['location_state'] = extracted_location
                logger.info(f"✅ Added location_state to filters: {extracted_location.get_summary()}")
            
            # STEP 6: If clarifying question, return immediately
            if clarifying:
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
            
            # STEP 11: Execute MLS search
            should_search = intent in ("search", "refine") or any([
                state.location,
                state.bedrooms,
                state.property_type,
                state.price_range
            ])
            
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
                    
                else:
                    # STEP 11b: Standard search using enhanced_mls_service
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
                            from services.conversation_state import ConversationState, LocationState
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
            summarizer_result = ask_gpt_summarizer(user_message, state.get_active_filters(), properties)
            
            assistant_text = summarizer_result.get("response_text") or "I'm here to help you find properties."
            suggestions = summarizer_result.get("suggestions", [])
            
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
        
        # Critical: If this is a fresh search (merge=False) and no price mentioned, clear old price
        price_mentioned = min_p is not None or max_p is not None
        if not merge and not price_mentioned:
            logger.info(f"🏠 [FRESH SEARCH] Clearing old price range (not mentioned in new search)")
            updates["price_range"] = (None, None)
        
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
            
            if min_p is not None or max_p is not None:
                updates["price_range"] = (min_p, max_p)
        
        # Listing type (critical for rental/sale fix)
        if filters_from_gpt.get("listing_type"):
            updates["listing_type"] = filters_from_gpt["listing_type"]
        
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
