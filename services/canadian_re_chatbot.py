"""
Intelligent Conversational Real Estate Chatbot for Canada
Using Llama 3.2 (3B-Instruct) via Hugging Face Inference API

This service provides dynamic, context-aware conversation flow for Canadian real estate,
adapting questions based on user responses with natural language understanding.
"""

import asyncio
import json
import time
import logging
import re
import os
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ConversationStage(Enum):
    """Conversation flow stages"""
    GREETING = "greeting"
    CITY_SELECTION = "city_selection"
    TRANSACTION_TYPE = "transaction_type"
    PROPERTY_TYPE = "property_type"
    BEDROOM_COUNT = "bedroom_count"
    BUDGET_RANGE = "budget_range"
    NEIGHBORHOOD = "neighborhood"
    FEATURES = "features"
    SUMMARY = "summary"
    PROPERTY_SEARCH = "property_search"

class TransactionType(Enum):
    """Types of property transactions"""
    BUY = "buy"
    SELL = "sell"
    RENT = "rent"

@dataclass
class ConversationContext:
    """Tracks conversation state and user preferences"""
    session_id: str
    stage: ConversationStage = ConversationStage.GREETING
    city: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    property_type: Optional[str] = None
    bedrooms: Optional[str] = None
    budget_min: Optional[int] = None
    budget_max: Optional[int] = None
    neighborhood: Optional[str] = None
    features: List[str] = None
    conversation_history: List[Dict] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.features is None:
            self.features = []
        if self.conversation_history is None:
            self.conversation_history = []
        if self.timestamp is None:
            self.timestamp = datetime.now()

class CanadianRealEstateChatbot:
    """Intelligent conversational chatbot for Canadian real estate"""
    
    def __init__(self, hf_token: str = None):
        self.hf_token = hf_token or os.getenv('HUGGINGFACE_API_TOKEN', '')  # Use environment variable
        self.api_url = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct"
        self.sessions: Dict[str, ConversationContext] = {}
        
        # Canadian cities database (extensive list)
        self.canadian_cities = {
            # Major cities
            "toronto": {"province": "ON", "population": 2731571, "region": "GTA"},
            "montreal": {"province": "QC", "population": 1704694, "region": "Montreal Metro"},
            "vancouver": {"province": "BC", "population": 631486, "region": "Metro Vancouver"},
            "calgary": {"province": "AB", "population": 1239220, "region": "Calgary Metro"},
            "edmonton": {"province": "AB", "population": 972223, "region": "Edmonton Metro"},
            "ottawa": {"province": "ON", "population": 934243, "region": "NCR"},
            "mississauga": {"province": "ON", "population": 721599, "region": "GTA"},
            "winnipeg": {"province": "MB", "population": 749534, "region": "Winnipeg Metro"},
            "quebec city": {"province": "QC", "population": 531902, "region": "Quebec Metro"},
            "hamilton": {"province": "ON", "population": 536917, "region": "Hamilton Metro"},
            "brampton": {"province": "ON", "population": 593638, "region": "GTA"},
            "surrey": {"province": "BC", "population": 517887, "region": "Metro Vancouver"},
            "laval": {"province": "QC", "population": 422993, "region": "Montreal Metro"},
            "halifax": {"province": "NS", "population": 403131, "region": "Halifax Metro"},
            "victoria": {"province": "BC", "population": 85792, "region": "Capital Regional"},
            "windsor": {"province": "ON", "population": 217188, "region": "Essex County"},
            "saskatoon": {"province": "SK", "population": 246376, "region": "Saskatoon Metro"},
            "regina": {"province": "SK", "population": 215106, "region": "Regina Metro"},
            "kitchener": {"province": "ON", "population": 233222, "region": "KW Region"},
            "waterloo": {"province": "ON", "population": 104986, "region": "KW Region"},
            "london": {"province": "ON", "population": 383822, "region": "London Metro"},
            "markham": {"province": "ON", "population": 328966, "region": "GTA"},
            "vaughan": {"province": "ON", "population": 306233, "region": "GTA"},
            "gatineau": {"province": "QC", "population": 276245, "region": "NCR"},
            "longueuil": {"province": "QC", "population": 239700, "region": "Montreal Metro"},
            "burnaby": {"province": "BC", "population": 232755, "region": "Metro Vancouver"},
            "richmond": {"province": "BC", "population": 198309, "region": "Metro Vancouver"},
            "oakville": {"province": "ON", "population": 193832, "region": "GTA"},
            "burlington": {"province": "ON", "population": 183314, "region": "GTA"},
            "greater sudbury": {"province": "ON", "population": 161531, "region": "Northern ON"},
            "sherbrooke": {"province": "QC", "population": 161323, "region": "Eastern Townships"},
            "oshawa": {"province": "ON", "population": 159458, "region": "GTA"},
            "saguenay": {"province": "QC", "population": 145949, "region": "Saguenay-Lac-Saint-Jean"},
            "leger": {"province": "QC", "population": 106322, "region": "Montreal Metro"},
            "coquitlam": {"province": "BC", "population": 139284, "region": "Metro Vancouver"},
            "trois-rivieres": {"province": "QC", "population": 134413, "region": "Mauricie"},
            "guelph": {"province": "ON", "population": 131794, "region": "Wellington County"},
            "cambridge": {"province": "ON", "population": 129920, "region": "KW Region"},
            "whitby": {"province": "ON", "population": 128377, "region": "GTA"},
            "ajax": {"province": "ON", "population": 119677, "region": "GTA"},
            "langley": {"province": "BC", "population": 117285, "region": "Metro Vancouver"},
            "saanich": {"province": "BC", "population": 117735, "region": "Capital Regional"},
            "abbotsford": {"province": "BC", "population": 141397, "region": "Fraser Valley"},
            "delta": {"province": "BC", "population": 102238, "region": "Metro Vancouver"},
            "red deer": {"province": "AB", "population": 100418, "region": "Central Alberta"},
            "kamloops": {"province": "BC", "population": 90280, "region": "Thompson-Nicola"},
            "kelowna": {"province": "BC", "population": 127380, "region": "Okanagan"},
            "barrie": {"province": "ON", "population": 141434, "region": "Simcoe County"},
            "kingston": {"province": "ON", "population": 123798, "region": "Eastern Ontario"},
            "richmond hill": {"province": "ON", "population": 195022, "region": "GTA"},
            "pickering": {"province": "ON", "population": 91771, "region": "GTA"},
            "milton": {"province": "ON", "population": 110128, "region": "GTA"},
            "newmarket": {"province": "ON", "population": 84224, "region": "GTA"},
            "st. catharines": {"province": "ON", "population": 133113, "region": "Niagara Region"},
            "thunder bay": {"province": "ON", "population": 107909, "region": "Northwestern Ontario"},
            "brantford": {"province": "ON", "population": 97496, "region": "Brant County"},
            "nanaimo": {"province": "BC", "population": 90504, "region": "Vancouver Island"}
        }
        
        # Property types
        self.property_types = {
            "buy": ["Detached Home", "Semi-Detached Home", "Townhouse", "Condo", "Duplex"],
            "rent": ["1BR Apartment", "2BR Apartment", "3BR Apartment", "4BR+ Apartment", "House", "Condo", "Studio"],
            "sell": ["Detached Home", "Semi-Detached Home", "Townhouse", "Condo", "Duplex", "Commercial"]
        }
        
        logger.info("Canadian Real Estate Chatbot initialized with Llama 3.2")
    
    async def generate_llama_response(
        self, 
        conversation_history: List[Dict], 
        system_prompt: str
    ) -> str:
        """Generate response using Llama 3.2 via Hugging Face Inference API"""
        
        headers = {
            "Authorization": f"Bearer {self.hf_token}",
            "Content-Type": "application/json"
        }
        
        # Format conversation for Llama 3.2
        messages = [
            {"role": "system", "content": system_prompt}
        ] + conversation_history
        
        payload = {
            "inputs": self._format_llama_prompt(messages),
            "parameters": {
                "max_new_tokens": 150,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True,
                "return_full_text": False
            }
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api_url, json=payload, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        if isinstance(result, list) and len(result) > 0:
                            return result[0].get("generated_text", "").strip()
                        return result.get("generated_text", "").strip()
                    else:
                        logger.error(f"Hugging Face API error: {response.status}")
                        return "HUGGINGFACE_API_ERROR"
                        
        except Exception as e:
            logger.error(f"Error calling Llama 3.2 API: {e}")
            return "HUGGINGFACE_API_ERROR"
    
    def _format_llama_prompt(self, messages: List[Dict]) -> str:
        """Format messages for Llama 3.2 chat template"""
        formatted = "<|begin_of_text|>"
        
        for msg in messages:
            role = msg["role"]
            content = msg["content"]
            
            if role == "system":
                formatted += f"<|start_header_id|>system<|end_header_id|>\n\n{content}<|eot_id|>"
            elif role == "user":
                formatted += f"<|start_header_id|>user<|end_header_id|>\n\n{content}<|eot_id|>"
            elif role == "assistant":
                formatted += f"<|start_header_id|>assistant<|end_header_id|>\n\n{content}<|eot_id|>"
        
        formatted += "<|start_header_id|>assistant<|end_header_id|>\n\n"
        return formatted
    
    def _get_fallback_response(self, context: ConversationContext = None) -> str:
        """Fallback response when API fails - context-aware"""
        if not context:
            return "I'm here to help you find the perfect property in Canada! Let's start with which city interests you."
        
        if context.stage == ConversationStage.CITY_SELECTION:
            return "Which Canadian city are you interested in? I can help with Toronto, Vancouver, Calgary, Montreal, and many others!"
        
        elif context.stage == ConversationStage.TRANSACTION_TYPE:
            return f"Great choice with {context.city}! Are you looking to Buy, Sell, or Rent a property?"
        
        elif context.stage == ConversationStage.PROPERTY_TYPE:
            action = context.transaction_type.value if context.transaction_type else "find"
            return f"Perfect! What type of property would you like to {action} in {context.city}?"
        
        elif context.stage == ConversationStage.BEDROOM_COUNT:
            return f"How many bedrooms are you looking for in your {context.property_type or 'property'} in {context.city}?"
        
        elif context.stage == ConversationStage.BUDGET_RANGE:
            action = "purchase" if context.transaction_type == TransactionType.BUY else "rent"
            return f"What's your budget range for your {context.property_type or 'property'} {action} in {context.city}?"
        
        elif context.stage == ConversationStage.NEIGHBORHOOD:
            return f"Do you have any preferred neighborhoods or areas in {context.city}?"
        
        elif context.stage == ConversationStage.FEATURES:
            return f"Any specific features or amenities you're looking for in your {context.property_type or 'property'}?"
        
        else:
            return f"Let me help you find the perfect {context.property_type or 'property'} in {context.city}. What would you like to know next?"
    
    def extract_city(self, user_input: str) -> Optional[str]:
        """Extract Canadian city from user input using NLP"""
        user_input_lower = user_input.lower()
        
        # Direct city matches
        for city in self.canadian_cities.keys():
            if city in user_input_lower:
                return city.title()
        
        # Handle common variations
        city_variations = {
            "gta": "toronto",
            "the 6": "toronto",
            "the six": "toronto",
            "t.o": "toronto",
            "mtl": "montreal",
            "van": "vancouver",
            "vancity": "vancouver",
            "yvr": "vancouver",
            "cow town": "calgary",
            "cowtown": "calgary",
            "e-town": "edmonton",
            "etown": "edmonton",
            "the peg": "winnipeg",
            "hali": "halifax",
            "the hammer": "hamilton",
            "k-w": "kitchener",
            "the forest city": "london"
        }
        
        for variation, city in city_variations.items():
            if variation in user_input_lower:
                return city.title()
        
        return None
    
    def extract_transaction_type(self, user_input: str) -> Optional[TransactionType]:
        """Extract transaction type from user input"""
        user_input_lower = user_input.lower()
        
        buy_keywords = ["buy", "buying", "purchase", "purchasing", "own", "ownership"]
        sell_keywords = ["sell", "selling", "list", "listing", "market"]
        rent_keywords = ["rent", "renting", "rental", "lease", "leasing", "tenant"]
        
        if any(keyword in user_input_lower for keyword in buy_keywords):
            return TransactionType.BUY
        elif any(keyword in user_input_lower for keyword in sell_keywords):
            return TransactionType.SELL
        elif any(keyword in user_input_lower for keyword in rent_keywords):
            return TransactionType.RENT
        
        return None
    
    def extract_property_type(self, user_input: str, transaction_type: str) -> Optional[str]:
        """Extract property type from user input"""
        user_input_lower = user_input.lower()
        
        property_mapping = {
            "detached": "Detached Home",
            "house": "Detached Home",
            "home": "Detached Home",
            "semi": "Semi-Detached Home",
            "semi-detached": "Semi-Detached Home",
            "townhouse": "Townhouse",
            "townhome": "Townhouse",
            "condo": "Condo",
            "condominium": "Condo",
            "apartment": "Condo" if transaction_type == "buy" else "Apartment",
            "duplex": "Duplex",
            "studio": "Studio"
        }
        
        for keyword, prop_type in property_mapping.items():
            if keyword in user_input_lower:
                return prop_type
        
        return None
    
    def extract_bedrooms(self, user_input: str) -> Optional[str]:
        """Extract bedroom count from user input"""
        user_input_lower = user_input.lower()
        
        bedroom_patterns = {
            r'(\d+)\s*bed': r'\1BR',
            r'(\d+)\s*br': r'\1BR',
            r'(\d+)\s*bedroom': r'\1BR',
            r'studio': 'Studio',
            r'bachelor': 'Studio',
            r'one bed': '1BR',
            r'two bed': '2BR',
            r'three bed': '3BR',
            r'four bed': '4BR+'
        }
        
        for pattern, replacement in bedroom_patterns.items():
            match = re.search(pattern, user_input_lower)
            if match:
                if 'BR' in replacement and match.groups():
                    return f"{match.group(1)}BR"
                return replacement
        
        return None
    
    def get_quick_replies(self, context: ConversationContext) -> List[str]:
        """Generate contextual quick reply options based on current stage"""
        
        if context.stage == ConversationStage.GREETING:
            return ["Toronto", "Vancouver", "Calgary", "Montreal"]
        
        elif context.stage == ConversationStage.CITY_SELECTION:
            # Suggest popular cities
            return ["Toronto", "Vancouver", "Calgary", "Edmonton", "Montreal", "Ottawa"]
        
        elif context.stage == ConversationStage.TRANSACTION_TYPE:
            return ["Buy", "Rent", "Sell"]
        
        elif context.stage == ConversationStage.BEDROOM_COUNT:
            return ["1BR", "2BR", "3BR", "4BR+"]
        
        elif context.stage == ConversationStage.PROPERTY_TYPE:
            if context.transaction_type == TransactionType.BUY:
                return ["Detached Home", "Semi-Detached", "Townhouse", "Condo"]
            elif context.transaction_type == TransactionType.RENT:
                return ["Apartment", "Condo", "House", "Studio"]
            else:  # SELL
                return ["Detached Home", "Condo", "Townhouse", "Duplex"]
        
        elif context.stage == ConversationStage.BUDGET_RANGE:
            if context.transaction_type == TransactionType.BUY:
                return ["Under $500K", "$500K-$750K", "$750K-$1M", "$1M+"]
            else:  # RENT
                return ["Under $2K", "$2K-$3K", "$3K-$4K", "$4K+"]
        
        elif context.stage == ConversationStage.NEIGHBORHOOD:
            return ["Downtown", "Suburbs", "Waterfront", "Family Area"]
        
        elif context.stage == ConversationStage.FEATURES:
            return ["Parking", "Balcony", "Pet Friendly", "Search Properties"]
        
        return []
    
    def get_system_prompt(self, context: ConversationContext) -> str:
        """Generate dynamic system prompt based on conversation context"""
        
        base_prompt = """You are an intelligent Canadian real estate assistant. Ask ONE contextual question at a time based on conversation history. Guide users through:
1) City selection
2) Transaction type (Buy/Sell/Rent)
3) Property type and specifications
4) Budget and preferences

Be conversational, natural, and intelligent - not robotic. Adapt your questions based on what the user has already told you."""
        
        if context.stage == ConversationStage.GREETING:
            return base_prompt + "\n\nGreet the user and ask which Canadian city they're interested in."
        
        elif context.stage == ConversationStage.CITY_SELECTION:
            return base_prompt + "\n\nHelp the user clarify which Canadian city they want to focus on."
        
        elif context.stage == ConversationStage.TRANSACTION_TYPE:
            return base_prompt + f"\n\nThe user is interested in {context.city}. Ask if they want to Buy, Sell, or Rent."
        
        elif context.stage == ConversationStage.BEDROOM_COUNT:
            return base_prompt + f"\n\nThe user wants to {context.transaction_type.value} in {context.city}. Ask how many bedrooms they need."
        
        elif context.stage == ConversationStage.PROPERTY_TYPE:
            return base_prompt + f"\n\nThe user wants to {context.transaction_type.value} in {context.city}. Ask what type of property they prefer."
        
        elif context.stage == ConversationStage.BUDGET_RANGE:
            return base_prompt + f"\n\nThe user wants a {context.property_type} to {context.transaction_type.value} in {context.city}. Ask about their budget range."
        
        elif context.stage == ConversationStage.NEIGHBORHOOD:
            return base_prompt + f"\n\nAsk if they have any preferred neighborhoods or areas in {context.city}."
        
        elif context.stage == ConversationStage.FEATURES:
            return base_prompt + f"\n\nAsk about any specific features or amenities they're looking for."
        
        return base_prompt
    
    def advance_conversation_stage(self, context: ConversationContext, user_input: str) -> bool:
        """Advance conversation stage based on extracted information"""
        
        if context.stage == ConversationStage.GREETING:
            city = self.extract_city(user_input)
            if city:
                context.city = city
                context.stage = ConversationStage.TRANSACTION_TYPE
                return True
            else:
                context.stage = ConversationStage.CITY_SELECTION
                return False
        
        elif context.stage == ConversationStage.CITY_SELECTION:
            city = self.extract_city(user_input)
            if city:
                context.city = city
                context.stage = ConversationStage.TRANSACTION_TYPE
                return True
            return False
        
        elif context.stage == ConversationStage.TRANSACTION_TYPE:
            transaction = self.extract_transaction_type(user_input)
            if transaction:
                context.transaction_type = transaction
                if transaction == TransactionType.RENT:
                    context.stage = ConversationStage.BEDROOM_COUNT
                else:
                    context.stage = ConversationStage.PROPERTY_TYPE
                return True
            return False
        
        elif context.stage == ConversationStage.BEDROOM_COUNT:
            bedrooms = self.extract_bedrooms(user_input)
            if bedrooms:
                context.bedrooms = bedrooms
                context.stage = ConversationStage.PROPERTY_TYPE
                return True
            return False
        
        elif context.stage == ConversationStage.PROPERTY_TYPE:
            prop_type = self.extract_property_type(user_input, context.transaction_type.value if context.transaction_type else "")
            if prop_type:
                context.property_type = prop_type
                context.stage = ConversationStage.BUDGET_RANGE
                return True
            return False
        
        elif context.stage == ConversationStage.BUDGET_RANGE:
            # Simple budget extraction (can be enhanced)
            context.stage = ConversationStage.NEIGHBORHOOD
            return True
        
        elif context.stage == ConversationStage.NEIGHBORHOOD:
            context.stage = ConversationStage.FEATURES
            return True
        
        elif context.stage == ConversationStage.FEATURES:
            context.stage = ConversationStage.PROPERTY_SEARCH
            return True
        
        return False
    
    async def process_message(self, session_id: str, user_message: str) -> Dict[str, Any]:
        """Process user message and generate intelligent response"""
        
        # Get or create conversation context
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationContext(session_id=session_id)
        
        context = self.sessions[session_id]
        
        # Add user message to history
        context.conversation_history.append({
            "role": "user",
            "content": user_message
        })
        
        # Try to advance conversation stage
        stage_advanced = self.advance_conversation_stage(context, user_message)
        
        # Generate system prompt based on current context
        system_prompt = self.get_system_prompt(context)
        
        # Generate response using Llama 3.2
        assistant_response = await self.generate_llama_response(
            context.conversation_history,
            system_prompt
        )
        
        # If we got a fallback response, make it context-aware
        if (assistant_response == "I'm having some technical difficulties right now. Could you please repeat your request?" or
            assistant_response == "HUGGINGFACE_API_ERROR" or
            not assistant_response.strip()):
            assistant_response = self._get_fallback_response(context)
        
        # Add assistant response to history
        context.conversation_history.append({
            "role": "assistant", 
            "content": assistant_response
        })
        
        # Get contextual quick replies
        quick_replies = self.get_quick_replies(context)
        
        # Check if ready for property search
        ready_for_search = (
            context.stage == ConversationStage.PROPERTY_SEARCH or
            (context.city and context.transaction_type and context.property_type)
        )
        
        return {
            "message": assistant_response,
            "quick_replies": quick_replies,
            "stage": context.stage.value,
            "context": {
                "city": context.city,
                "transaction_type": context.transaction_type.value if context.transaction_type else None,
                "property_type": context.property_type,
                "bedrooms": context.bedrooms
            },
            "ready_for_search": ready_for_search,
            "session_id": session_id
        }
    
    def get_session_context(self, session_id: str) -> Optional[ConversationContext]:
        """Get conversation context for a session"""
        return self.sessions.get(session_id)
    
    def reset_session(self, session_id: str) -> None:
        """Reset conversation session"""
        if session_id in self.sessions:
            del self.sessions[session_id]

# Global instance
canadian_re_chatbot = CanadianRealEstateChatbot()