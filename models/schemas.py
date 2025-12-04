#!/usr/bin/env python3
"""
Pydantic Models for HuggingFace FastAPI Integration
Real Estate Chatbot - Request/Response Schemas
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator, ConfigDict
import uuid

class MessageRole(str, Enum):
    """Message roles in conversation"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class ConversationIntent(str, Enum):
    """Conversation intent categories"""
    GENERAL = "general"
    PROPERTY_SEARCH = "property_search"
    LOCATION_INQUIRY = "location_inquiry"
    PROPERTY_DETAILS = "property_details"
    INVESTMENT_INQUIRY = "investment_inquiry"
    FIRST_TIME_BUYER = "first_time_buyer"
    MARKET_ANALYSIS = "market_analysis"
    SCHEDULING = "scheduling"
    SUPPORT = "support"
    ERROR = "error"

class ModelStatus(str, Enum):
    """Model response status"""
    SUCCESS = "success"
    FALLBACK_USED = "fallback_used"
    ERROR = "error"
    RATE_LIMITED = "rate_limited"
    MODEL_LOADING = "model_loading"

class Language(str, Enum):
    """Supported languages"""
    ENGLISH = "en"
    FRENCH = "fr"

# ===== REQUEST MODELS =====

class ConversationMessage(BaseModel):
    """Individual message in conversation history"""
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=2000)
    timestamp: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    model_config = ConfigDict(use_enum_values=True)
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.now()

class UserPreferences(BaseModel):
    """User's real estate preferences"""
    location: Optional[str] = Field(None, description="Preferred location/city")
    budget_min: Optional[float] = Field(None, ge=0, description="Minimum budget in CAD")
    budget_max: Optional[float] = Field(None, ge=0, description="Maximum budget in CAD")
    property_type: Optional[str] = Field(None, description="Preferred property type")
    bedrooms: Optional[int] = Field(None, ge=0, le=10, description="Number of bedrooms")
    bathrooms: Optional[float] = Field(None, ge=0, le=10, description="Number of bathrooms")
    min_sqft: Optional[int] = Field(None, ge=0, description="Minimum square footage")
    max_sqft: Optional[int] = Field(None, ge=0, description="Maximum square footage")
    investment_purpose: Optional[bool] = Field(False, description="Is this an investment property?")
    first_time_buyer: Optional[bool] = Field(False, description="Is this a first-time buyer?")
    move_in_timeline: Optional[str] = Field(None, description="When looking to move in")
    special_requirements: Optional[List[str]] = Field(None, description="Special requirements or features")
    
    @validator('budget_max')
    def budget_max_greater_than_min(cls, v, values):
        if v is not None and 'budget_min' in values and values['budget_min'] is not None:
            if v < values['budget_min']:
                raise ValueError('budget_max must be greater than budget_min')
        return v

class RealEstateContext(BaseModel):
    """Current real estate context"""
    current_properties: Optional[List[Dict[str, Any]]] = Field(None, description="Currently discussed properties")
    market_data: Optional[Dict[str, Any]] = Field(None, description="Current market data")
    location_insights: Optional[Dict[str, Any]] = Field(None, description="Location-specific insights")
    comparison_mode: Optional[bool] = Field(False, description="Is user comparing properties?")
    viewing_scheduled: Optional[List[str]] = Field(None, description="Properties with scheduled viewings")
    interested_properties: Optional[List[str]] = Field(None, description="Properties user expressed interest in")
    broker_assigned: Optional[Dict[str, Any]] = Field(None, description="Assigned broker information")

class ChatRequest(BaseModel):
    """Main chat request model"""
    user_message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    conversation_history: Optional[List[ConversationMessage]] = Field(None, max_items=20, description="Previous conversation")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Session identifier")
    user_id: Optional[str] = Field(None, description="User identifier")
    user_preferences: Optional[UserPreferences] = Field(None, description="User's real estate preferences")
    real_estate_context: Optional[RealEstateContext] = Field(None, description="Current real estate context")
    language: Language = Field(Language.ENGLISH, description="Preferred language")
    
    # Model configuration options
    model_preference: Optional[str] = Field(None, description="Preferred model to use")
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0, description="Response creativity (0.0-1.0)")
    max_tokens: Optional[int] = Field(None, ge=10, le=2048, description="Maximum response tokens")
    
    # System options
    enable_real_estate_context: bool = Field(True, description="Enable real estate context enhancement")
    enable_fallback: bool = Field(True, description="Enable fallback models on failure")
    debug_mode: bool = Field(False, description="Enable debug information in response")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_message": "I'm looking for a 2-bedroom condo in downtown Toronto under $800,000",
                "session_id": "550e8400-e29b-41d4-a716-446655440000",
                "user_preferences": {
                    "location": "Toronto",
                    "budget_max": 800000,
                    "property_type": "condo",
                    "bedrooms": 2
                },
                "language": "en",
                "enable_real_estate_context": True
            }
        }
    )

class ModelSwitchRequest(BaseModel):
    """Request to switch to a different model"""
    session_id: str
    new_model: str = Field(..., description="Model name to switch to")
    reason: Optional[str] = Field(None, description="Reason for switching models")

class SessionStatsRequest(BaseModel):
    """Request for session statistics"""
    session_id: str
    include_conversation_history: bool = Field(False, description="Include full conversation history")

# ===== RESPONSE MODELS =====

class ModelMetadata(BaseModel):
    """Metadata about the model used"""
    model_name: str = Field(..., description="Name of the model used")
    model_type: str = Field(..., description="Type of model (conversational, dialogue, etc.)")
    response_time: float = Field(..., ge=0, description="Response time in seconds")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in the response")
    tokens_used: Optional[int] = Field(None, description="Number of tokens used")
    fallback_used: bool = Field(False, description="Whether fallback model was used")

class ConversationMetadata(BaseModel):
    """Metadata about the conversation"""
    session_id: str
    conversation_turn: int = Field(..., ge=1, description="Current turn number in conversation")
    intent: ConversationIntent = Field(..., description="Detected intent of user message")
    language_detected: Language = Field(..., description="Detected language")
    context_used: Dict[str, Any] = Field(default_factory=dict, description="Context information used")
    
    model_config = ConfigDict(use_enum_values=True)

class RealEstateInsights(BaseModel):
    """Real estate specific insights included in response"""
    market_trends: Optional[Dict[str, Any]] = None
    property_recommendations: Optional[List[Dict[str, Any]]] = None
    location_analysis: Optional[Dict[str, Any]] = None
    investment_insights: Optional[Dict[str, Any]] = None
    comparable_properties: Optional[List[Dict[str, Any]]] = None
    next_steps: Optional[List[str]] = None

class ChatResponse(BaseModel):
    """Main chat response model"""
    ai_response: str = Field(..., description="Generated AI response")
    status: ModelStatus = Field(..., description="Response status")
    timestamp: datetime = Field(default_factory=datetime.now, description="Response timestamp")
    
    # Model information
    model_metadata: ModelMetadata = Field(..., description="Information about the model used")
    conversation_metadata: ConversationMetadata = Field(..., description="Conversation metadata")
    
    # Real estate specific data
    real_estate_insights: Optional[RealEstateInsights] = Field(None, description="Real estate insights")
    suggested_actions: Optional[List[str]] = Field(None, description="Suggested follow-up actions")
    properties_mentioned: Optional[List[str]] = Field(None, description="Property IDs mentioned in response")
    trigger_property_search: Optional[bool] = Field(None, description="Flag to trigger property search in Flask app")
    
    # System information
    debug_info: Optional[Dict[str, Any]] = Field(None, description="Debug information (if enabled)")
    rate_limit_info: Optional[Dict[str, Any]] = Field(None, description="Rate limiting information")
    
    model_config = ConfigDict(
        use_enum_values=True,
        json_schema_extra={
            "example": {
                "ai_response": "I'd be happy to help you find a 2-bedroom condo in downtown Toronto! With your budget of $800,000, you have some great options...",
                "status": "success",
                "model_metadata": {
                    "model_name": "facebook/blenderbot-400M-distill",
                    "model_type": "conversational",
                    "response_time": 1.23,
                    "confidence_score": 0.89,
                    "fallback_used": False
                },
                "conversation_metadata": {
                    "session_id": "550e8400-e29b-41d4-a716-446655440000",
                    "conversation_turn": 1,
                    "intent": "property_search",
                    "language_detected": "en"
                }
            }
        }
    )

class ErrorResponse(BaseModel):
    """Error response model"""
    error: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Error code")
    status: ModelStatus = Field(ModelStatus.ERROR, description="Error status")
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    
    model_config = ConfigDict(use_enum_values=True)

class SessionStats(BaseModel):
    """Session statistics response"""
    session_id: str
    total_turns: int = Field(..., ge=0)
    created_at: datetime
    last_activity: datetime
    avg_response_time: float = Field(..., ge=0)
    avg_confidence: float = Field(..., ge=0.0, le=1.0)
    intent_distribution: Dict[str, int] = Field(default_factory=dict)
    model_usage: Dict[str, int] = Field(default_factory=dict)
    user_preferences: Optional[UserPreferences] = None
    conversation_history: Optional[List[ConversationMessage]] = None
    primary_language: Language = Field(Language.ENGLISH)
    
    model_config = ConfigDict(use_enum_values=True)

class ServiceHealth(BaseModel):
    """Service health status"""
    service_status: str = Field(..., description="Overall service status")
    api_connectivity: bool = Field(..., description="HuggingFace API connectivity")
    primary_model: str = Field(..., description="Primary model name")
    fallback_model: str = Field(..., description="Fallback model name")
    active_sessions: int = Field(..., ge=0, description="Number of active sessions")
    total_models_available: int = Field(..., ge=0, description="Total models configured")
    rate_limit_status: Dict[str, Any] = Field(default_factory=dict)
    configuration: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")

class ModelSwitchResponse(BaseModel):
    """Response to model switch request"""
    success: bool
    old_model: str
    new_model: str
    session_id: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)

# ===== SPECIALIZED REQUEST MODELS =====

class PropertySearchEnhancedRequest(ChatRequest):
    """Enhanced request specifically for property searches"""
    search_criteria: Optional[Dict[str, Any]] = Field(None, description="Specific search criteria")
    include_market_analysis: bool = Field(True, description="Include market analysis in response")
    max_properties_to_discuss: int = Field(5, ge=1, le=20, description="Maximum properties to include in response")

class InvestmentAnalysisRequest(ChatRequest):
    """Enhanced request for investment-related queries"""
    investment_timeline: Optional[str] = Field(None, description="Investment timeline")
    risk_tolerance: Optional[str] = Field(None, description="Risk tolerance level")
    expected_roi: Optional[float] = Field(None, ge=0, description="Expected return on investment")
    financing_details: Optional[Dict[str, Any]] = Field(None, description="Financing information")

class FirstTimeBuyerRequest(ChatRequest):
    """Enhanced request for first-time buyer assistance"""
    current_situation: Optional[str] = Field(None, description="Current living situation")
    savings_amount: Optional[float] = Field(None, ge=0, description="Current savings amount")
    employment_status: Optional[str] = Field(None, description="Employment status")
    credit_score_range: Optional[str] = Field(None, description="Credit score range")
    pre_approval_status: Optional[str] = Field(None, description="Mortgage pre-approval status")

# ===== UTILITY MODELS =====

class BulkChatRequest(BaseModel):
    """Request for processing multiple chat messages"""
    requests: List[ChatRequest] = Field(..., min_items=1, max_items=10)
    batch_id: Optional[str] = Field(None, description="Batch identifier")
    process_sequentially: bool = Field(False, description="Process requests in sequence")

class BulkChatResponse(BaseModel):
    """Response for bulk chat processing"""
    responses: List[Union[ChatResponse, ErrorResponse]]
    batch_id: Optional[str] = None
    total_requests: int = Field(..., ge=1)
    successful_requests: int = Field(..., ge=0)
    failed_requests: int = Field(..., ge=0)
    total_processing_time: float = Field(..., ge=0)
    timestamp: datetime = Field(default_factory=datetime.now)

class ConversationExport(BaseModel):
    """Model for exporting conversation data"""
    session_id: str
    user_id: Optional[str] = None
    conversation_history: List[ConversationMessage]
    session_stats: SessionStats
    export_timestamp: datetime = Field(default_factory=datetime.now)
    export_format: str = Field("json", description="Export format")

# ===== WEBHOOK MODELS =====

class WebhookEvent(BaseModel):
    """Webhook event model for external integrations"""
    event_type: str = Field(..., description="Type of event")
    session_id: str
    user_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Optional[Dict[str, Any]] = None

class IntegrationCallback(BaseModel):
    """Callback model for CRM and external system integration"""
    callback_type: str = Field(..., description="Type of callback")
    session_id: str
    lead_data: Optional[Dict[str, Any]] = None
    property_data: Optional[Dict[str, Any]] = None
    broker_assignment: Optional[Dict[str, Any]] = None
    callback_url: Optional[str] = Field(None, description="URL to send callback to")
    timestamp: datetime = Field(default_factory=datetime.now)

# ===== VALIDATION UTILITIES =====

def validate_canadian_postal_code(postal_code: str) -> bool:
    """Validate Canadian postal code format"""
    import re
    pattern = r'^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$'
    return bool(re.match(pattern, postal_code))

def validate_canadian_phone(phone: str) -> bool:
    """Validate Canadian phone number format"""
    import re
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    # Check if it's 10 digits (Canadian format) or 11 digits with country code
    return len(digits_only) in [10, 11] and (len(digits_only) == 10 or digits_only.startswith('1'))

# Example usage and testing
if __name__ == "__main__":
    # Test model creation and validation
    print("🧪 Testing Pydantic Models...")
    
    # Test ChatRequest
    try:
        request = ChatRequest(
            user_message="I'm looking for a condo in Toronto",
            user_preferences=UserPreferences(
                location="Toronto",
                property_type="condo",
                budget_max=800000,
                bedrooms=2
            ),
            language=Language.ENGLISH
        )
        print("✅ ChatRequest validation passed")
        print(f"   Session ID: {request.session_id}")
        print(f"   User preferences: {request.user_preferences.model_dump()}")
    except Exception as e:
        print(f"❌ ChatRequest validation failed: {e}")
    
    # Test ChatResponse
    try:
        response = ChatResponse(
            ai_response="I'd be happy to help you find a condo in Toronto!",
            status=ModelStatus.SUCCESS,
            model_metadata=ModelMetadata(
                model_name="facebook/blenderbot-400M-distill",
                model_type="conversational",
                response_time=1.23,
                confidence_score=0.89
            ),
            conversation_metadata=ConversationMetadata(
                session_id="test-session",
                conversation_turn=1,
                intent=ConversationIntent.PROPERTY_SEARCH,
                language_detected=Language.ENGLISH
            )
        )
        print("✅ ChatResponse validation passed")
        print(f"   Status: {response.status}")
        print(f"   Model: {response.model_metadata.model_name}")
        print(f"   Intent: {response.conversation_metadata.intent}")
    except Exception as e:
        print(f"❌ ChatResponse validation failed: {e}")
    
    # Test validation functions
    print("\n🧪 Testing validation utilities...")
    print(f"Valid postal code 'K1A 0A6': {validate_canadian_postal_code('K1A 0A6')}")
    print(f"Invalid postal code '12345': {validate_canadian_postal_code('12345')}")
    print(f"Valid phone '416-555-0123': {validate_canadian_phone('416-555-0123')}")
    print(f"Invalid phone '123-456': {validate_canadian_phone('123-456')}")
    
    print("\n✅ All model tests completed!")