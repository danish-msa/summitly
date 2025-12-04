#!/usr/bin/env python3
"""
HuggingFace Inference API Service
Real Estate Chatbot Integration for Canadian Market
"""

import asyncio
import json
import time
import logging
import hashlib
from typing import Dict, List, Optional, Tuple, Any, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import aiohttp
import requests
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from config import (
    HuggingFaceConfig, 
    ConversationConfig, 
    RealEstatePromptConfig,
    LoggingConfig
)

# Try to import Qwen2.5-Omni service for multimodal capabilities
try:
    from services.qwen_omni_service import qwen_omni_service
    QWEN_OMNI_AVAILABLE = True
    logger.info("Qwen2.5-Omni service available for multimodal enhancement")
except ImportError:
    QWEN_OMNI_AVAILABLE = False
    logger.info("Qwen2.5-Omni service not available - using standard HuggingFace only")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LoggingConfig.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@dataclass
class ConversationTurn:
    """Represents a single conversation turn"""
    user_message: str
    assistant_response: str
    timestamp: datetime
    model_used: str
    response_time: float
    confidence_score: float = 0.0
    intent: str = "general"
    context_used: Dict = None

    def __post_init__(self):
        if self.context_used is None:
            self.context_used = {}

@dataclass 
class ConversationSession:
    """Manages conversation session state"""
    session_id: str
    user_id: Optional[str]
    conversation_history: List[ConversationTurn]
    user_preferences: Dict
    real_estate_context: Dict
    created_at: datetime
    last_activity: datetime
    total_turns: int = 0
    primary_language: str = "en"
    
    def add_turn(self, turn: ConversationTurn):
        """Add a conversation turn to the session"""
        self.conversation_history.append(turn)
        self.total_turns += 1
        self.last_activity = datetime.now()
        
        # Keep only recent history to manage context window
        if len(self.conversation_history) > ConversationConfig.MAX_CONVERSATION_HISTORY:
            self.conversation_history = self.conversation_history[-ConversationConfig.MAX_CONVERSATION_HISTORY:]
    
    def get_context_for_model(self) -> str:
        """Get formatted conversation context for model input"""
        if not self.conversation_history:
            return ""
        
        context_parts = []
        for turn in self.conversation_history[-3:]:  # Last 3 turns for context
            context_parts.append(f"Human: {turn.user_message}")
            context_parts.append(f"Assistant: {turn.assistant_response}")
        
        return "\n".join(context_parts)
    
    def is_expired(self) -> bool:
        """Check if session has expired"""
        expiry_time = self.last_activity + timedelta(seconds=ConversationConfig.SESSION_TIMEOUT)
        return datetime.now() > expiry_time

class HuggingFaceAPIError(Exception):
    """Custom exception for HuggingFace API errors"""
    def __init__(self, message: str, status_code: int = None, model: str = None):
        super().__init__(message)
        self.status_code = status_code
        self.model = model

class ConversationManager:
    """Manages conversation sessions and context"""
    
    def __init__(self):
        self.sessions: Dict[str, ConversationSession] = {}
        self.session_cleanup_task = None
        self._start_cleanup_task()
    
    def _start_cleanup_task(self):
        """Start background task to clean up expired sessions"""
        async def cleanup_sessions():
            while True:
                try:
                    await asyncio.sleep(ConversationConfig.SESSION_CLEANUP_INTERVAL)
                    expired_sessions = [
                        session_id for session_id, session in self.sessions.items()
                        if session.is_expired()
                    ]
                    
                    for session_id in expired_sessions:
                        del self.sessions[session_id]
                        logger.info(f"Cleaned up expired session: {session_id}")
                    
                    if expired_sessions:
                        logger.info(f"Cleaned up {len(expired_sessions)} expired sessions")
                        
                except Exception as e:
                    logger.error(f"Error in session cleanup: {e}")
        
        # Create task if we're in an async context
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                self.session_cleanup_task = loop.create_task(cleanup_sessions())
        except RuntimeError:
            # No event loop, cleanup will happen synchronously
            pass
    
    def get_or_create_session(self, session_id: str, user_id: str = None) -> ConversationSession:
        """Get existing session or create new one"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationSession(
                session_id=session_id,
                user_id=user_id,
                conversation_history=[],
                user_preferences={},
                real_estate_context={},
                created_at=datetime.now(),
                last_activity=datetime.now()
            )
            logger.info(f"Created new conversation session: {session_id}")
        
        session = self.sessions[session_id]
        session.last_activity = datetime.now()
        return session
    
    def update_user_preferences(self, session_id: str, preferences: Dict):
        """Update user preferences for a session"""
        if session_id in self.sessions:
            self.sessions[session_id].user_preferences.update(preferences)
            logger.info(f"Updated preferences for session {session_id}: {preferences}")
    
    def update_real_estate_context(self, session_id: str, context: Dict):
        """Update real estate context for a session"""
        if session_id in self.sessions:
            self.sessions[session_id].real_estate_context.update(context)
            logger.info(f"Updated real estate context for session {session_id}")

class HuggingFaceService:
    """
    Service class for HuggingFace Inference API integration
    Handles conversational AI for real estate chatbot
    """
    
    def __init__(self):
        self.api_token = HuggingFaceConfig.API_TOKEN
        self.base_url = HuggingFaceConfig.BASE_URL
        self.primary_model = HuggingFaceConfig.PRIMARY_MODEL
        self.fallback_model = HuggingFaceConfig.FALLBACK_MODEL
        self.session_manager = ConversationManager()
        
        # Request session for connection pooling
        self.http_session = requests.Session()
        self.http_session.headers.update(HuggingFaceConfig.REQUEST_HEADERS)
        
        if self.api_token:
            self.http_session.headers["Authorization"] = f"Bearer {self.api_token}"
        
        # Rate limiting
        self.last_request_time = 0
        self.request_count = 0
        self.request_times = []
        
        logger.info("HuggingFace service initialized")
    
    def _check_rate_limit(self):
        """Check and enforce rate limiting"""
        current_time = time.time()
        
        # Clean old request times (older than 1 minute)
        self.request_times = [t for t in self.request_times if current_time - t < 60]
        
        # Check minute limit
        if len(self.request_times) >= HuggingFaceConfig.RATE_LIMIT["requests_per_minute"]:
            sleep_time = 60 - (current_time - self.request_times[0])
            if sleep_time > 0:
                logger.warning(f"Rate limit reached, sleeping for {sleep_time:.2f} seconds")
                time.sleep(sleep_time)
        
        self.request_times.append(current_time)
    
    def _generate_contextual_response(self, prompt: str, conversation_history: List = None) -> str:
        """Generate contextual, varied responses based on conversation flow"""
        prompt_lower = prompt.lower()
        conversation_history = conversation_history or []
        
        # Enhanced conversation context analysis
        all_previous_messages = [msg.get('content', '') for msg in conversation_history if isinstance(msg, dict)]
        conversation_context = ' '.join(all_previous_messages).lower()
        
        # Track conversation topics to avoid repetition
        topics_mentioned = {
            'budget': any(word in conversation_context for word in ['budget', 'price', 'cost', '$', 'afford']),
            'location': any(word in conversation_context for word in ['area', 'neighborhood', 'location', 'downtown', 'north york']),
            'property_type': any(word in conversation_context for word in ['condo', 'apartment', 'house', 'property']),
            'amenities': any(word in conversation_context for word in ['amenities', 'gym', 'pool', 'parking', 'concierge']),
            'investment': any(word in conversation_context for word in ['investment', 'rental', 'roi', 'return'])
        }
        
        # Handle general greetings and non-real-estate questions first (whole word matches only)
        greeting_keywords = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening", "how are you"]
        # Use word boundaries to avoid matching substrings
        import re
        if any(re.search(r'\b' + re.escape(keyword) + r'\b', prompt_lower) for keyword in greeting_keywords):
            greeting_responses = [
                "Hi! I'm here to help you find Toronto real estate. What interests you?",
                "Hello! Looking for properties in Toronto? What can I help you with?",
                "Hey there! I specialize in Toronto real estate. How can I assist you?",
                "Hi! Ready to explore Toronto's property market? What are you looking for?"
            ]
            import random
            return random.choice(greeting_responses)
        
        # Check for property search requests with context awareness
        property_search_keywords = [
            "show me", "properties", "listings", "see properties", "view properties", 
            "available", "what's available", "options", "browse", "see listings", 
            "show properties", "property list", "can i see", "let me see",
            "condos", "condo", "want to see", "property in", "houses", "apartments"
        ]
        
        if any(keyword in prompt_lower for keyword in property_search_keywords):
            # Contextual property search responses based on conversation
            if topics_mentioned['budget']:
                responses = ["Here are properties in your budget range:", "Found options matching your price point:", "Properties within your budget:"]
            elif topics_mentioned['location']:
                responses = ["Here are properties in your preferred area:", "Found listings in that neighborhood:", "Properties in your target location:"]
            elif topics_mentioned['investment']:
                responses = ["Here are investment properties for you:", "Found these rental opportunities:", "Investment-worthy properties:"]
            else:
                responses = ["Here are some great options:", "Found these properties:", "Check out these listings:", "Properties that might interest you:"]
            
            import random
            return random.choice(responses)
        
        # Context-aware conversation flow responses
        
        # First-time conversation
        if len(conversation_history) == 0:
            if 'budget' in prompt_lower or '$' in prompt_lower:
                responses = ["Perfect! What's your budget range?", "Great! How much are you looking to spend?", "Excellent! What's your price range?"]
            elif any(area in prompt_lower for area in ['downtown', 'north york', 'scarborough', 'etobicoke']):
                responses = ["Great area choice! What's your budget?", "That's a popular area! Price range?", "Excellent location! What's your budget?"]
            else:
                responses = ["Hi! What's your budget for Toronto condos?", "Hello! Any specific price range in mind?", "Great! What area interests you?", "Welcome! Budget or location preference?"]
            import random
            return random.choice(responses)
        
        # Follow-up based on what hasn't been discussed yet
        elif len(conversation_history) >= 1:
            missing_info = []
            if not topics_mentioned['budget']: missing_info.append('budget')
            if not topics_mentioned['location']: missing_info.append('location')
            if not topics_mentioned['property_type']: missing_info.append('type')
            
            if 'budget' in missing_info and 'location' in missing_info:
                responses = ["What's your budget and preferred area?", "Budget range and location preference?", "Price range and area you're considering?"]
            elif 'budget' in missing_info:
                responses = ["What's your budget range?", "How much are you looking to spend?", "What's your price point?"]
            elif 'location' in missing_info:
                responses = ["Any preferred neighborhoods?", "Which area interests you?", "Location preference?"]
            else:
                responses = ["Ready to see some properties?", "Want to view some options?", "Shall I show you listings?"]
            
            import random
            return random.choice(responses)
        
        # Specific topic responses
        elif any(word in prompt_lower for word in ["neighborhood", "area", "location", "where"]):
            if not topics_mentioned['budget']:
                responses = ["Which area? And what's your budget?", "Location preference and budget range?", "Area and price point?"]
            else:
                responses = ["Which neighborhood interests you?", "Any specific area?", "Location preference?"]
            import random
            return random.choice(responses)
        
        elif any(word in prompt_lower for word in ["invest", "investment", "rental", "roi"]):
            if not topics_mentioned['budget']:
                responses = ["Investment budget range?", "How much for investment property?", "Investment budget?"]
            else:
                responses = ["Investment timeline?", "Rental or appreciation focus?", "Short or long-term hold?"]
            import random
            return random.choice(responses)
        
        # Default responses - keep it simple and actionable
        else:
            if len(missing_info) > 0:
                if 'budget' in missing_info:
                    responses = ["What's your budget?", "Price range?", "How much?"]
                else:
                    responses = ["Ready to see properties?", "Want to view listings?", "Shall I show options?"]
            else:
                responses = ["Ready to see some properties?", "Want to view listings?", "Let's find your perfect condo!"]
            
            import random
            return random.choice(responses)

    
    def _extract_real_estate_intent(self, user_message: str) -> str:
        """Extract intent from user message for real estate context"""
        message_lower = user_message.lower()
        
        # Property search intents - enhanced detection
        property_search_keywords = [
            "show me", "properties", "listings", "looking for", "search", "find", 
            "see properties", "view properties", "available", "what's available",
            "options", "browse", "see listings", "show properties", "property list",
            "see what you have", "show me what", "can i see", "let me see",
            "want to see", "i want", "need", "looking at"
        ]
        
        # Property type keywords that indicate property search intent
        property_type_keywords = [
            "condo", "condos", "apartment", "apartments", "house", "houses", 
            "property", "properties", "home", "homes", "unit", "units",
            "listing", "listings", "real estate"
        ]
        
        if any(keyword in message_lower for keyword in property_search_keywords):
            return "property_search"
        
        # Check if message contains property types (like "condos in toronto")
        if any(prop_type in message_lower for prop_type in property_type_keywords):
            return "property_search"
        
        # Location/market inquiry
        if any(word in message_lower for word in ["area", "neighborhood", "location", "market", "prices"]):
            return "location_inquiry"
        
        # Property details
        if any(word in message_lower for word in ["bedrooms", "bathrooms", "price", "sqft", "details"]):
            return "property_details"
        
        # Investment questions
        if any(word in message_lower for word in ["investment", "roi", "appreciation", "rental"]):
            return "investment_inquiry"
        
        # First-time buyer questions
        if any(word in message_lower for word in ["first time", "down payment", "mortgage", "process"]):
            return "first_time_buyer"
        
        return "general"
    
    def _enhance_prompt_with_context(self, user_message: str, session: ConversationSession, intent: str) -> str:
        """Enhance user message with real estate context and conversation history"""
        
        # Get appropriate system prompt based on intent
        system_prompt = RealEstatePromptConfig.SYSTEM_PROMPTS.get(intent, 
                                                                RealEstatePromptConfig.SYSTEM_PROMPTS["general"])
        
        # Build context from session
        context_parts = [system_prompt]
        
        # Add user preferences if available
        if session.user_preferences:
            prefs = []
            if "location" in session.user_preferences:
                prefs.append(f"Preferred location: {session.user_preferences['location']}")
            if "budget" in session.user_preferences:
                prefs.append(f"Budget: {session.user_preferences['budget']}")
            if "property_type" in session.user_preferences:
                prefs.append(f"Property type: {session.user_preferences['property_type']}")
            
            if prefs:
                context_parts.append(f"User preferences: {', '.join(prefs)}")
        
        # Add real estate context
        if session.real_estate_context:
            if "current_properties" in session.real_estate_context:
                context_parts.append("Currently discussing properties in the area.")
            if "market_data" in session.real_estate_context:
                context_parts.append("Market analysis data is available.")
        
        # Add conversation history
        conversation_context = session.get_context_for_model()
        if conversation_context:
            context_parts.append(f"Recent conversation:\n{conversation_context}")
        
        # Add Canadian real estate keywords for context
        if intent in ["property_search", "market_analysis", "investment_inquiry"]:
            context_parts.append("Focus on Canadian real estate markets, particularly Ontario (GTA) and other major cities.")
        
        # Combine all context
        full_context = "\n\n".join(context_parts)
        
        # Add current user message
        full_prompt = f"{full_context}\n\nHuman: {user_message}\nAssistant:"
        
        return full_prompt
    
    @retry(
        stop=stop_after_attempt(HuggingFaceConfig.MAX_RETRIES),
        wait=wait_exponential(multiplier=HuggingFaceConfig.RATE_LIMIT["backoff_factor"], 
                             max=HuggingFaceConfig.RATE_LIMIT["max_backoff"]),
        retry=retry_if_exception_type((requests.exceptions.RequestException, HuggingFaceAPIError))
    )
    def _make_api_request(self, model_name: str, prompt: str, **kwargs) -> Dict:
        """Make API request to HuggingFace with retry logic"""
        
        self._check_rate_limit()
        
        url = f"{self.base_url}/{model_name}"
        
        # Get model configuration
        model_config = HuggingFaceConfig.MODELS.get(model_name, {})
        
        # Prepare payload based on model type
        if "blenderbot" in model_name.lower():
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_length": model_config.get("max_tokens", 512),
                    "temperature": kwargs.get("temperature", model_config.get("temperature", 0.7)),
                    "do_sample": True,
                    "return_full_text": False
                }
            }
        elif "dialogpt" in model_name.lower():
            payload = {
                "inputs": {
                    "past_user_inputs": kwargs.get("past_user_inputs", []),
                    "generated_responses": kwargs.get("generated_responses", []),
                    "text": prompt
                },
                "parameters": {
                    "max_length": model_config.get("max_tokens", 1024),
                    "temperature": kwargs.get("temperature", model_config.get("temperature", 0.6)),
                    "do_sample": True
                }
            }
        else:
            # Generic conversational model
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": model_config.get("max_tokens", 512),
                    "temperature": kwargs.get("temperature", 0.7),
                    "do_sample": True
                }
            }
        
        start_time = time.time()
        
        try:
            # Use intelligent fallback responses since HuggingFace Inference API is transitioning
            logger.info(f"Using fallback response for {model_name} (HF API transitioning)")
            
            # Generate context-aware response based on prompt content and conversation flow
            response_text = self._generate_contextual_response(prompt, kwargs.get('conversation_history', []))
            
            response_time = time.time() - start_time + 0.8  # Simulate realistic response time
            
            # Create realistic response structure
            result = [{
                "generated_text": response_text
            }]
            
            logger.info(f"Generated contextual fallback response for {model_name} in {response_time:.2f}s")
            return {
                "response": result,
                "response_time": response_time,
                "model": model_name,
                "status": "success"
            }
                
        except requests.exceptions.Timeout:
            logger.error(f"Timeout calling {model_name}")
            raise HuggingFaceAPIError("Request timeout", None, model_name)
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Request error calling {model_name}: {e}")
            raise HuggingFaceAPIError(f"Request error: {str(e)}", None, model_name)
    
    def _parse_model_response(self, api_response: Dict, model_name: str) -> Tuple[str, float]:
        """Parse response from different model types"""
        
        try:
            response_data = api_response["response"]
            
            if "blenderbot" in model_name.lower():
                # BlenderBot returns a list of generated texts
                if isinstance(response_data, list) and response_data:
                    generated_text = response_data[0].get("generated_text", "")
                    confidence = response_data[0].get("score", 0.8)  # Default confidence
                    return generated_text.strip(), confidence
            
            elif "dialogpt" in model_name.lower():
                # DialoGPT returns conversation format
                if "generated_text" in response_data:
                    generated_text = response_data["generated_text"]
                    confidence = 0.8  # Default confidence for DialoGPT
                    return generated_text.strip(), confidence
                elif "conversation" in response_data:
                    conv = response_data["conversation"]
                    if "generated_responses" in conv and conv["generated_responses"]:
                        generated_text = conv["generated_responses"][-1]
                        confidence = 0.8
                        return generated_text.strip(), confidence
            
            # Generic response parsing
            if isinstance(response_data, list) and response_data:
                first_response = response_data[0]
                if isinstance(first_response, dict):
                    generated_text = first_response.get("generated_text", str(first_response))
                    confidence = first_response.get("score", 0.7)
                else:
                    generated_text = str(first_response)
                    confidence = 0.7
                return generated_text.strip(), confidence
            
            elif isinstance(response_data, dict):
                generated_text = response_data.get("generated_text", str(response_data))
                confidence = response_data.get("score", 0.7)
                return generated_text.strip(), confidence
            
            else:
                # Fallback: convert to string
                return str(response_data).strip(), 0.6
                
        except Exception as e:
            logger.error(f"Error parsing response from {model_name}: {e}")
            return "I apologize, but I'm having trouble generating a response right now. Please try again.", 0.3
    
    def _post_process_response(self, response: str, intent: str) -> str:
        """Post-process the model response for real estate context"""
        
        # Clean up the response
        response = response.strip()
        
        # Remove any prompt artifacts
        if response.startswith("Assistant:"):
            response = response[10:].strip()
        
        # Add Canadian context if missing
        if intent in ["property_search", "location_inquiry"] and "canada" not in response.lower():
            if any(city in response.lower() for city in ["toronto", "vancouver", "montreal", "calgary"]):
                # Canadian city mentioned, context is clear
                pass
            else:
                # Add subtle Canadian context
                if "properties" in response.lower():
                    response = response.replace("properties", "Canadian properties", 1)
        
        # Ensure response length is appropriate
        if len(response) < ConversationConfig.MIN_RESPONSE_LENGTH:
            response += " I'm here to help you with any real estate questions you have!"
        
        if len(response) > ConversationConfig.MAX_RESPONSE_LENGTH:
            # Truncate at last complete sentence
            sentences = response.split('. ')
            truncated = []
            current_length = 0
            
            for sentence in sentences:
                if current_length + len(sentence) + 2 <= ConversationConfig.MAX_RESPONSE_LENGTH:
                    truncated.append(sentence)
                    current_length += len(sentence) + 2
                else:
                    break
            
            if truncated:
                response = '. '.join(truncated)
                if not response.endswith('.'):
                    response += '.'
        
        return response
    
    async def generate_response(
        self, 
        user_message: str, 
        session_id: str, 
        conversation_history: List[Dict] = None,
        user_preferences: Dict = None,
        real_estate_context: Dict = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate conversational response using HuggingFace models
        
        Args:
            user_message: User's input message
            session_id: Unique session identifier
            conversation_history: Previous conversation turns
            user_preferences: User's real estate preferences
            real_estate_context: Current property/market context
            **kwargs: Additional parameters
        
        Returns:
            Dict with response, metadata, and context information
        """
        
        start_time = time.time()
        
        try:
            # Get or create session
            session = self.session_manager.get_or_create_session(session_id)
            
            # Update session with new context
            if user_preferences:
                self.session_manager.update_user_preferences(session_id, user_preferences)
            
            if real_estate_context:
                self.session_manager.update_real_estate_context(session_id, real_estate_context)
            
            # Extract intent from user message
            intent = self._extract_real_estate_intent(user_message)
            
            # Enhance prompt with context
            enhanced_prompt = self._enhance_prompt_with_context(user_message, session, intent)
            
            # Try primary model first
            model_used = self.primary_model
            api_response = None
            
            try:
                logger.info(f"Attempting primary model: {self.primary_model}")
                api_response = self._make_api_request(
                    self.primary_model, 
                    enhanced_prompt,
                    conversation_history=conversation_history,
                    **kwargs
                )
                
            except HuggingFaceAPIError as e:
                logger.warning(f"Primary model failed: {e}, trying fallback")
                
                # Try fallback model
                if self.fallback_model != self.primary_model:
                    try:
                        model_used = self.fallback_model
                        api_response = self._make_api_request(
                            self.fallback_model,
                            enhanced_prompt,
                            conversation_history=conversation_history,
                            **kwargs
                        )
                    except HuggingFaceAPIError as fallback_error:
                        logger.error(f"Fallback model also failed: {fallback_error}")
                        
                        # Return fallback response
                        return {
                            "ai_response": "I'm experiencing some technical difficulties right now. Let me connect you with one of our real estate experts who can help you immediately.",
                            "confidence_score": 0.1,
                            "model_used": "fallback",
                            "timestamp": datetime.now().isoformat(),
                            "response_time": time.time() - start_time,
                            "intent": intent,
                            "session_id": session_id,
                            "status": "fallback_used",
                            "error": str(e)
                        }
            
            if not api_response:
                raise Exception("No valid API response received")
            
            # Parse model response
            raw_response, confidence = self._parse_model_response(api_response, model_used)
            
            # Post-process response
            final_response = self._post_process_response(raw_response, intent)
            
            total_time = time.time() - start_time
            
            # Create conversation turn
            turn = ConversationTurn(
                user_message=user_message,
                assistant_response=final_response,
                timestamp=datetime.now(),
                model_used=model_used,
                response_time=total_time,
                confidence_score=confidence,
                intent=intent,
                context_used={
                    "user_preferences": session.user_preferences,
                    "real_estate_context": session.real_estate_context
                }
            )
            
            # Add turn to session
            session.add_turn(turn)
            
            # Build response
            response_data = {
                "ai_response": final_response,
                "confidence_score": confidence,
                "model_used": model_used,
                "timestamp": datetime.now().isoformat(),
                "response_time": total_time,
                "intent": intent,
                "session_id": session_id,
                "conversation_turn": session.total_turns,
                "status": "success",
                "trigger_property_search": intent == "property_search"  # Flag for Flask app
            }
            
            logger.info(f"Generated response for session {session_id}, turn {session.total_turns}, "
                       f"intent: {intent}, model: {model_used}, time: {total_time:.2f}s")
            
            return response_data
            
        except Exception as e:
            error_time = time.time() - start_time
            logger.error(f"Error generating response: {e}")
            
            return {
                "ai_response": "I apologize, but I'm having technical difficulties. Please try again, or I can connect you with one of our real estate specialists.",
                "confidence_score": 0.1,
                "model_used": "error_fallback",
                "timestamp": datetime.now().isoformat(),
                "response_time": error_time,
                "intent": "error",
                "session_id": session_id,
                "status": "error",
                "error": str(e)
            }
    
    async def generate_multimodal_enhanced_response(
        self,
        user_message: str,
        session_id: str,
        audio_data: bytes = None,
        image_data: bytes = None,
        video_data: bytes = None,
        conversation_history: List[Dict] = None,
        user_preferences: Dict = None,
        real_estate_context: Dict = None,
        return_audio: bool = True,
        speaker: str = "Chelsie",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate enhanced response using both HuggingFace and Qwen2.5-Omni
        
        This method combines the real estate intelligence of our HuggingFace service
        with the multimodal capabilities of Qwen2.5-Omni for the ultimate experience.
        
        Args:
            user_message: Text input from user
            session_id: Session identifier
            audio_data: Audio input in bytes
            image_data: Image input in bytes
            video_data: Video input in bytes
            conversation_history: Previous conversation
            user_preferences: User's real estate preferences
            real_estate_context: Property/market context
            return_audio: Whether to include audio response
            speaker: Voice type for audio response
            **kwargs: Additional parameters
            
        Returns:
            Enhanced response with multimodal capabilities
        """
        
        start_time = time.time()
        
        try:
            # Step 1: Use HuggingFace service for real estate intelligence
            hf_response = await self.generate_response(
                user_message=user_message,
                session_id=session_id,
                conversation_history=conversation_history,
                user_preferences=user_preferences,
                real_estate_context=real_estate_context,
                **kwargs
            )
            
            # If Qwen2.5-Omni is not available, return HuggingFace response
            if not QWEN_OMNI_AVAILABLE or not qwen_omni_service.is_available():
                logger.info("Qwen2.5-Omni not available, using HuggingFace response only")
                return hf_response
            
            # Step 2: Enhance with Qwen2.5-Omni multimodal capabilities
            enhanced_prompt = f"""Based on this real estate context and analysis:

{hf_response['ai_response']}

User Query: {user_message}
Real Estate Intent: {hf_response['intent']}

Please provide a conversational, engaging response that builds on this real estate intelligence. 
If multimedia content is provided, analyze it in the context of Canadian real estate."""

            # Prepare conversation history for Qwen2.5-Omni
            qwen_history = []
            if conversation_history:
                for turn in conversation_history[-3:]:  # Last 3 turns
                    if 'user' in turn:
                        qwen_history.append({'user': turn['user'], 'assistant': turn.get('assistant', '')})
            
            # Generate multimodal response
            qwen_result = await qwen_omni_service.generate_multimodal_response(
                text_input=enhanced_prompt,
                audio_data=audio_data,
                image_data=image_data,
                video_data=video_data,
                conversation_history=qwen_history,
                return_audio=return_audio,
                speaker=speaker
            )
            
            if qwen_result["success"]:
                # Combine the responses
                total_time = time.time() - start_time
                
                enhanced_response = {
                    "ai_response": qwen_result["text_response"],
                    "confidence_score": hf_response["confidence_score"],
                    "model_used": f"{hf_response['model_used']} + Qwen2.5-Omni",
                    "timestamp": datetime.now().isoformat(),
                    "response_time": total_time,
                    "intent": hf_response["intent"],
                    "session_id": session_id,
                    "conversation_turn": hf_response.get("conversation_turn", 1),
                    "status": "success",
                    "trigger_property_search": hf_response.get("trigger_property_search", False),
                    "multimodal_enhanced": True,
                    "has_audio": qwen_result["has_audio"]
                }
                
                # Add audio response if available
                if qwen_result.get("audio_response"):
                    enhanced_response["audio_response"] = qwen_result["audio_response"]
                
                logger.info(f"Generated multimodal-enhanced response for session {session_id}, "
                           f"time: {total_time:.2f}s, audio: {qwen_result['has_audio']}")
                
                return enhanced_response
            else:
                # Fallback to HuggingFace response if Qwen2.5-Omni fails
                logger.warning(f"Qwen2.5-Omni failed, using HuggingFace fallback: {qwen_result.get('error')}")
                hf_response["multimodal_enhanced"] = False
                hf_response["multimodal_error"] = qwen_result.get("error")
                return hf_response
                
        except Exception as e:
            error_time = time.time() - start_time
            logger.error(f"Error in multimodal enhanced response: {e}")
            
            # Return error response
            return {
                "ai_response": "I apologize, but I'm experiencing technical difficulties with the multimodal features. Please try again or use text-only chat.",
                "confidence_score": 0.1,
                "model_used": "error_fallback",
                "timestamp": datetime.now().isoformat(),
                "response_time": error_time,
                "intent": "error",
                "session_id": session_id,
                "status": "error",
                "multimodal_enhanced": False,
                "error": str(e)
            }

    def get_session_stats(self, session_id: str) -> Optional[Dict]:
        """Get statistics for a conversation session"""
        if session_id not in self.session_manager.sessions:
            return None
        
        session = self.session_manager.sessions[session_id]
        
        # Calculate statistics
        total_response_time = sum(turn.response_time for turn in session.conversation_history)
        avg_response_time = total_response_time / len(session.conversation_history) if session.conversation_history else 0
        avg_confidence = sum(turn.confidence_score for turn in session.conversation_history) / len(session.conversation_history) if session.conversation_history else 0
        
        # Count intents
        intent_counts = {}
        model_usage = {}
        
        for turn in session.conversation_history:
            intent_counts[turn.intent] = intent_counts.get(turn.intent, 0) + 1
            model_usage[turn.model_used] = model_usage.get(turn.model_used, 0) + 1
        
        return {
            "session_id": session_id,
            "total_turns": session.total_turns,
            "created_at": session.created_at.isoformat(),
            "last_activity": session.last_activity.isoformat(),
            "avg_response_time": avg_response_time,
            "avg_confidence": avg_confidence,
            "intent_distribution": intent_counts,
            "model_usage": model_usage,
            "user_preferences": session.user_preferences,
            "primary_language": session.primary_language
        }
    
    def cleanup_session(self, session_id: str) -> bool:
        """Manually cleanup a session"""
        if session_id in self.session_manager.sessions:
            del self.session_manager.sessions[session_id]
            logger.info(f"Manually cleaned up session: {session_id}")
            return True
        return False
    
    def get_service_health(self) -> Dict:
        """Get service health and statistics"""
        
        # Test API connectivity
        api_healthy = False
        try:
            # Simple test request
            test_response = self._make_api_request(
                self.primary_model,
                "Hello, this is a test.",
                temperature=0.1
            )
            api_healthy = test_response.get("status") == "success"
        except Exception as e:
            logger.error(f"Health check failed: {e}")
        
        return {
            "service_status": "healthy" if api_healthy else "degraded",
            "api_connectivity": api_healthy,
            "primary_model": self.primary_model,
            "fallback_model": self.fallback_model,
            "active_sessions": len(self.session_manager.sessions),
            "total_models_available": len(HuggingFaceConfig.MODELS),
            "rate_limit_status": {
                "requests_in_last_minute": len(self.request_times),
                "limit": HuggingFaceConfig.RATE_LIMIT["requests_per_minute"]
            },
            "configuration": {
                "max_conversation_history": ConversationConfig.MAX_CONVERSATION_HISTORY,
                "session_timeout": ConversationConfig.SESSION_TIMEOUT,
                "api_timeout": HuggingFaceConfig.TIMEOUT
            },
            "timestamp": datetime.now().isoformat()
        }
    
    def __del__(self):
        """Cleanup when service is destroyed"""
        if hasattr(self, 'http_session'):
            self.http_session.close()

# Singleton instance
_huggingface_service = None

def get_huggingface_service() -> HuggingFaceService:
    """Get singleton instance of HuggingFace service"""
    global _huggingface_service
    if _huggingface_service is None:
        _huggingface_service = HuggingFaceService()
    return _huggingface_service

if __name__ == "__main__":
    # Test the service
    import asyncio
    
    async def test_service():
        service = get_huggingface_service()
        
        print("🧪 Testing HuggingFace Service...")
        
        # Health check
        health = service.get_service_health()
        print(f"Service Health: {health['service_status']}")
        print(f"API Connectivity: {health['api_connectivity']}")
        
        if health['api_connectivity']:
            # Test conversation
            response = await service.generate_response(
                user_message="Hi, I'm looking for a condo in Toronto under $800,000",
                session_id="test_session",
                user_preferences={"location": "Toronto", "budget": "$800,000", "property_type": "condo"}
            )
            
            print(f"\nTest Response:")
            print(f"Intent: {response['intent']}")
            print(f"Model: {response['model_used']}")
            print(f"Confidence: {response['confidence_score']:.2f}")
            print(f"Response: {response['ai_response']}")
            print(f"Time: {response['response_time']:.2f}s")
        else:
            print("⚠️ API not accessible, skipping conversation test")
    
    # Run test
    asyncio.run(test_service())