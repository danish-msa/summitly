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

Input: user's message + current conversation filters (location, bedrooms, property_type, price_range, listing_type, amenities, etc.)

Output: JSON ONLY with keys:
- intent: one of ["search","refine","details","valuation","compare","general_question","reset"]
- filters: {
    location: string or null (Toronto, Mississauga, Milton, Brampton, Vaughan, Markham, Richmond Hill, Oakville, Burlington, Ajax, Whitby, Oshawa, Hamilton, Kitchener, Waterloo, Guelph, Cambridge, Barrie, London, Ottawa, Kingston, Vancouver, Calgary, Edmonton, Montreal, etc.),
    property_type: string or null (condo|detached|townhouse|semi-detached),
    bedrooms: number or null,
    bathrooms: number or null,
    min_price: number or null,
    max_price: number or null,
    listing_type: "sale" or "rent" (IMPORTANT: detect rental vs purchase intent),
    amenities: array of strings (pool, gym, parking, balcony, garden, etc.)
  }
- merge_with_previous: boolean (True = merge with existing filters, False = replace all - SET TO FALSE when user mentions a NEW/DIFFERENT city)
- clarifying_question: optional string (if you need clarification, ask user)

CRITICAL PRICING RULES:
- For RENTALS (listing_type: "rent"): Use monthly prices in CAD (e.g., 3000 = $3,000/month)
- For SALES (listing_type: "sale"): Use total prices in CAD (e.g., 600000 = $600,000 total)
- "under 5k" for rental = max_price: 5000 (monthly)
- "under 600k" for sale = max_price: 600000 (total)

Examples:
- "Show me rentals under 4k" -> intent: "search", listing_type: "rent", max_price: 4000
- "I want to buy under 600k" -> intent: "search", listing_type: "sale", max_price: 600000
- "How about those with a pool?" -> intent: "refine", amenities: ["pool"], merge_with_previous: true
- "I don't have any budgets" -> intent: "refine", min_price: null, max_price: null, merge_with_previous: true
- "Show me any price range" -> intent: "refine", min_price: null, max_price: null, merge_with_previous: true
- "Value of MLS: C12631086" -> intent: "valuation"
- "What is this property worth?" -> intent: "valuation"
- "Property valuation for MLS C123456" -> intent: "valuation"
- "Estimate the value of this home" -> intent: "valuation"

CRITICAL: Return ONLY valid JSON. No markdown code blocks (```json), no extra text, just pure JSON.
"""

SYSTEM_PROMPT_SUMMARIZER = """You are a friendly Canadian real estate assistant specializing in Toronto and the GTA region.

Your task: Create a conversational response based on the user's property search.

Input:
- User's message  
- Search filters applied
- Property results (may be empty)

Response requirements:
1. Write 2-4 sentences acknowledging their request
2. Summarize what was found (or explain why no results)
3. Use a natural, helpful tone
4. Include 2-3 follow-up suggestions

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
    """
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT_INTERPRETER},
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
            params["max_completion_tokens"] = 600
            # GPT-5-nano only supports temperature=1 (default), so we omit it
            # Try forcing JSON mode for GPT-5
            params["response_format"] = {"type": "json_object"}
        else:
            params["max_tokens"] = 600
            params["temperature"] = 0.2
        
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
            prop_summary = {
                "address": p.get("address", p.get("full_address", "Address not available")),
                "price": p.get("price", "$0"),
                "bedrooms": str(p.get("bedrooms", "N/A")),
                "bathrooms": str(p.get("bathrooms", "N/A")),
                "mls": p.get("mls_number", p.get("id", "N/A")),
                "sqft": p.get("sqft", "N/A"),
                "property_type": p.get("property_type", "Residential"),
                "image_url": p.get("image_url", "")
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
            
            # STEP 2: Build session summary for interpreter
            session_summary = {
                "filters": state.get_active_filters(),
                "last_search_count": len(state.last_property_results),
                "search_count": state.search_count,
                "last_search_results": state.last_property_results[:3] if state.last_property_results else []
            }
            
            # STEP 3: Call GPT-4 interpreter
            interpreter_out = ask_gpt_interpreter(session_summary, user_message)
            intent = interpreter_out.get("intent", "general_question")
            filters_from_gpt = interpreter_out.get("filters", {})
            merge = interpreter_out.get("merge_with_previous", True)
            clarifying = interpreter_out.get("clarifying_question")
            
            logger.info(f"🎯 Intent: {intent}")
            logger.debug(f"Filters from GPT: {filters_from_gpt}")
            
            # STEP 4: If clarifying question, return immediately
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
            
            # STEP 5: Handle different intents
            if intent == 'reset':
                return self._handle_reset(state, user_message)
            elif intent == 'valuation':
                return self._handle_valuation_request(state, user_message)
            elif intent == 'details':
                return self._handle_details_request(state, user_message)
            elif intent == 'compare':
                return self._handle_compare_request(state, user_message)
            elif intent == 'general_question' and not filters_from_gpt:
                return self._handle_general_question(state, user_message)
            
            # STEP 6: Update state with interpreted filters (search or refine)
            updates = self._normalize_filters_for_state(filters_from_gpt, merge, user_message, state)
            if updates:
                state.update_from_dict(updates)
                logger.info(f"✅ State updated: {state.get_summary()}")
            
            # STEP 7: Execute MLS search
            should_search = intent in ("search", "refine") or any([
                state.location,
                state.bedrooms,
                state.property_type,
                state.price_range
            ])
            
            properties = []
            total = 0
            if should_search:
                logger.info("🔍 Executing MLS search...")
                search_results = enhanced_mls_service.search_properties(state, limit=20)
                
                if search_results.get('success'):
                    properties = search_results.get('results', [])
                    total = search_results.get('total', len(properties))
                    state.update_search_results(properties, user_message)
                    logger.info(f"✅ Found {total} properties")
                else:
                    logger.warning(f"⚠️ MLS search failed: {search_results.get('error')}")
            
            # STEP 8: Call GPT-4 summarizer for final response
            summarizer_result = ask_gpt_summarizer(user_message, state.get_active_filters(), properties)
            
            assistant_text = summarizer_result.get("response_text") or "I'm here to help you find properties."
            suggestions = summarizer_result.get("suggestions", [])
            
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
        
        if should_remove_budget:
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
        """Handle general real estate questions using GPT-4."""
        # Use summarizer to answer general question
        result = ask_gpt_summarizer(user_message, state.get_active_filters(), [])
        response = result.get("response_text", "How can I help you find a property today?")
        suggestions = result.get("suggestions", [
            "Start a property search",
            "Tell me about Toronto neighborhoods",
            "What should I look for in a property?"
        ])
        
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
