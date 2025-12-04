#!/usr/bin/env python3
"""
FastAPI Endpoints for HuggingFace Integration
Real Estate Chatbot API Routes
"""

import asyncio
import time
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from tenacity import retry, stop_after_attempt, wait_exponential

# Import our custom modules
from models.schemas import (
    ChatRequest, ChatResponse, ErrorResponse, SessionStats, ServiceHealth,
    ModelSwitchRequest, ModelSwitchResponse, BulkChatRequest, BulkChatResponse,
    PropertySearchEnhancedRequest, InvestmentAnalysisRequest, FirstTimeBuyerRequest,
    ConversationMessage, ModelStatus, ConversationIntent, ModelMetadata, ConversationMetadata,
    RealEstateInsights
)
from services.huggingface_service import get_huggingface_service, HuggingFaceAPIError
from utils.prompt_templates import RealEstatePromptTemplates
from config import HuggingFaceConfig, ConversationConfig, SecurityConfig, IntegrationConfig

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instance
huggingface_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for FastAPI app"""
    global huggingface_service
    
    # Startup
    logger.info("🚀 Starting HuggingFace FastAPI service...")
    huggingface_service = get_huggingface_service()
    
    # Validate configuration
    health = huggingface_service.get_service_health()
    if not health["api_connectivity"]:
        logger.warning("⚠️ HuggingFace API not accessible at startup")
    else:
        logger.info("✅ HuggingFace API connectivity confirmed")
    
    yield
    
    # Shutdown
    logger.info("🔄 Shutting down HuggingFace FastAPI service...")

# Create FastAPI app
app = FastAPI(
    title="Real Estate AI Assistant - HuggingFace Integration",
    description="Canadian Real Estate Chatbot powered by HuggingFace Inference API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=SecurityConfig.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# ===== MIDDLEWARE =====

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for monitoring"""
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    
    return response

@app.middleware("http")
async def add_response_headers(request: Request, call_next):
    """Add custom headers to responses"""
    response = await call_next(request)
    response.headers["X-Service"] = "RealEstate-HuggingFace-API"
    response.headers["X-Version"] = "1.0.0"
    return response

# ===== UTILITY FUNCTIONS =====

async def get_service():
    """Dependency to get HuggingFace service instance"""
    global huggingface_service
    if huggingface_service is None:
        huggingface_service = get_huggingface_service()
    return huggingface_service

def create_error_response(error_message: str, error_code: str, status_code: int = 500) -> ErrorResponse:
    """Create standardized error response"""
    return ErrorResponse(
        error=error_message,
        error_code=error_code,
        status=ModelStatus.ERROR,
        timestamp=datetime.now()
    )

def extract_real_estate_insights(response_text: str, user_preferences: Dict) -> Optional[RealEstateInsights]:
    """Extract real estate insights from AI response"""
    insights = RealEstateInsights()
    
    # Simple keyword-based extraction (could be enhanced with NLP)
    if any(word in response_text.lower() for word in ["market", "price", "trend", "value"]):
        insights.market_trends = {"summary": "Market analysis mentioned in response"}
    
    if any(word in response_text.lower() for word in ["recommend", "suggest", "consider"]):
        insights.property_recommendations = [{"type": "general", "note": "Recommendations provided"}]
    
    if user_preferences.get("investment_purpose"):
        insights.investment_insights = {"roi_potential": "discussed", "market_position": "analyzed"}
    
    # Extract next steps
    if any(word in response_text.lower() for word in ["next", "step", "contact", "view", "schedule"]):
        insights.next_steps = ["Contact assigned broker", "Schedule property viewing", "Get pre-approved"]
    
    return insights if any([insights.market_trends, insights.property_recommendations, 
                          insights.investment_insights, insights.next_steps]) else None

# ===== MAIN CHAT ENDPOINT =====

@app.post("/chat/huggingface", response_model=ChatResponse, responses={500: {"model": ErrorResponse}})
async def chat_with_huggingface(
    request: ChatRequest,
    background_tasks: BackgroundTasks,
    service: Any = Depends(get_service)
):
    """
    Main chat endpoint using HuggingFace Inference API
    
    Process user messages with context-aware real estate assistance
    """
    try:
        logger.info(f"Chat request from session: {request.session_id}")
        
        # Validate request
        if not request.user_message.strip():
            raise HTTPException(status_code=400, detail="Empty message not allowed")
        
        # Convert conversation history to proper format
        conversation_history = []
        if request.conversation_history:
            for msg in request.conversation_history:
                conversation_history.append({
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp
                })
        
        # Prepare user preferences
        user_preferences = {}
        if request.user_preferences:
            user_preferences = request.user_preferences.model_dump(exclude_none=True)
        
        # Prepare real estate context
        real_estate_context = {}
        if request.real_estate_context:
            real_estate_context = request.real_estate_context.model_dump(exclude_none=True)
        
        # Generate response using HuggingFace service
        hf_response = await service.generate_response(
            user_message=request.user_message,
            session_id=request.session_id,
            conversation_history=conversation_history,
            user_preferences=user_preferences,
            real_estate_context=real_estate_context,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        
        # Extract real estate insights
        insights = None
        if request.enable_real_estate_context:
            insights = extract_real_estate_insights(hf_response["ai_response"], user_preferences)
        
        # Build response metadata
        model_metadata = ModelMetadata(
            model_name=hf_response["model_used"],
            model_type="conversational",  # Could be enhanced to detect actual type
            response_time=hf_response["response_time"],
            confidence_score=hf_response["confidence_score"],
            fallback_used=hf_response["status"] == "fallback_used"
        )
        
        conversation_metadata = ConversationMetadata(
            session_id=request.session_id,
            conversation_turn=hf_response.get("conversation_turn", 1),
            intent=ConversationIntent(hf_response.get("intent", "general")),
            language_detected=request.language,
            context_used={
                "user_preferences": bool(user_preferences),
                "real_estate_context": bool(real_estate_context),
                "conversation_history": len(conversation_history)
            }
        )
        
        # Generate suggested actions
        suggested_actions = []
        intent = hf_response.get("intent", "general")
        
        if intent == "property_search":
            suggested_actions.extend([
                "View similar properties in the area",
                "Schedule a property viewing",
                "Get market analysis for the neighborhood"
            ])
        elif intent == "investment_inquiry":
            suggested_actions.extend([
                "Calculate potential ROI",
                "Compare with other investment options",
                "Connect with investment specialist"
            ])
        elif intent == "first_time_buyer":
            suggested_actions.extend([
                "Get pre-approved for mortgage",
                "Learn about first-time buyer programs",
                "Schedule consultation with buying specialist"
            ])
        
        # Build final response
        chat_response = ChatResponse(
            ai_response=hf_response["ai_response"],
            status=ModelStatus(hf_response["status"]),
            timestamp=datetime.fromisoformat(hf_response["timestamp"]),
            model_metadata=model_metadata,
            conversation_metadata=conversation_metadata,
            real_estate_insights=insights,
            suggested_actions=suggested_actions[:3],  # Limit to 3 actions
            trigger_property_search=hf_response.get("trigger_property_search", False),
            debug_info=hf_response if request.debug_mode else None
        )
        
        # Log successful response
        logger.info(f"Successful response for session {request.session_id}: "
                   f"intent={intent}, model={hf_response['model_used']}, "
                   f"time={hf_response['response_time']:.2f}s")
        
        return chat_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat endpoint error: {e}")
        error_response = create_error_response(
            error_message=f"Failed to generate response: {str(e)}",
            error_code="CHAT_GENERATION_ERROR",
            status_code=500
        )
        raise HTTPException(status_code=500, detail=error_response.model_dump(mode='json'))

# ===== SPECIALIZED ENDPOINTS =====

@app.post("/chat/property-search", response_model=ChatResponse)
async def property_search_chat(
    request: PropertySearchEnhancedRequest,
    service: Any = Depends(get_service)
):
    """Specialized endpoint for property search conversations"""
    try:
        # Convert to regular ChatRequest with enhanced context
        chat_request = ChatRequest(
            user_message=request.user_message,
            conversation_history=request.conversation_history,
            session_id=request.session_id,
            user_id=request.user_id,
            user_preferences=request.user_preferences,
            real_estate_context=request.real_estate_context,
            language=request.language,
            enable_real_estate_context=True
        )
        
        # Add search-specific context
        if request.search_criteria:
            if not chat_request.real_estate_context:
                from models.schemas import RealEstateContext
                chat_request.real_estate_context = RealEstateContext()
            chat_request.real_estate_context.current_properties = request.search_criteria.get("properties", [])
        
        # Process through main chat endpoint
        return await chat_with_huggingface(chat_request, BackgroundTasks(), service)
        
    except Exception as e:
        logger.error(f"Property search endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/investment-analysis", response_model=ChatResponse)
async def investment_analysis_chat(
    request: InvestmentAnalysisRequest,
    service: Any = Depends(get_service)
):
    """Specialized endpoint for investment property analysis"""
    try:
        # Enhance user preferences with investment context
        if not request.user_preferences:
            from models.schemas import UserPreferences
            request.user_preferences = UserPreferences()
        
        request.user_preferences.investment_purpose = True
        
        # Add investment-specific context to the message
        enhanced_message = request.user_message
        if request.investment_timeline:
            enhanced_message += f" (Investment timeline: {request.investment_timeline})"
        if request.risk_tolerance:
            enhanced_message += f" (Risk tolerance: {request.risk_tolerance})"
        
        # Convert to regular ChatRequest
        chat_request = ChatRequest(
            user_message=enhanced_message,
            conversation_history=request.conversation_history,
            session_id=request.session_id,
            user_id=request.user_id,
            user_preferences=request.user_preferences,
            real_estate_context=request.real_estate_context,
            language=request.language,
            enable_real_estate_context=True
        )
        
        return await chat_with_huggingface(chat_request, BackgroundTasks(), service)
        
    except Exception as e:
        logger.error(f"Investment analysis endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat/first-time-buyer", response_model=ChatResponse)
async def first_time_buyer_chat(
    request: FirstTimeBuyerRequest,
    service: Any = Depends(get_service)
):
    """Specialized endpoint for first-time buyer assistance"""
    try:
        # Enhance user preferences with first-time buyer context
        if not request.user_preferences:
            from models.schemas import UserPreferences
            request.user_preferences = UserPreferences()
        
        request.user_preferences.first_time_buyer = True
        
        # Add first-time buyer context to the message
        enhanced_message = request.user_message
        context_additions = []
        
        if request.current_situation:
            context_additions.append(f"Current situation: {request.current_situation}")
        if request.savings_amount:
            context_additions.append(f"Savings: ${request.savings_amount:,}")
        if request.employment_status:
            context_additions.append(f"Employment: {request.employment_status}")
        if request.pre_approval_status:
            context_additions.append(f"Pre-approval: {request.pre_approval_status}")
        
        if context_additions:
            enhanced_message += f" ({', '.join(context_additions)})"
        
        # Convert to regular ChatRequest
        chat_request = ChatRequest(
            user_message=enhanced_message,
            conversation_history=request.conversation_history,
            session_id=request.session_id,
            user_id=request.user_id,
            user_preferences=request.user_preferences,
            real_estate_context=request.real_estate_context,
            language=request.language,
            enable_real_estate_context=True
        )
        
        return await chat_with_huggingface(chat_request, BackgroundTasks(), service)
        
    except Exception as e:
        logger.error(f"First-time buyer endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== SESSION MANAGEMENT ENDPOINTS =====

@app.get("/session/{session_id}/stats", response_model=SessionStats)
async def get_session_statistics(
    session_id: str,
    service: Any = Depends(get_service)
):
    """Get statistics for a conversation session"""
    try:
        stats = service.get_session_stats(session_id)
        if not stats:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/session/{session_id}")
async def cleanup_session(
    session_id: str,
    service: Any = Depends(get_service)
):
    """Manually cleanup a conversation session"""
    try:
        success = service.cleanup_session(session_id)
        if success:
            return {"message": f"Session {session_id} cleaned up successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Session cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/session/switch-model", response_model=ModelSwitchResponse)
async def switch_model(
    request: ModelSwitchRequest,
    service: Any = Depends(get_service)
):
    """Switch to a different model for a session"""
    try:
        # Validate model exists
        if request.new_model not in HuggingFaceConfig.MODELS:
            raise HTTPException(status_code=400, detail=f"Model {request.new_model} not available")
        
        # For now, just return success (actual implementation would update session)
        return ModelSwitchResponse(
            success=True,
            old_model=service.primary_model,
            new_model=request.new_model,
            session_id=request.session_id,
            message=f"Switched to model {request.new_model}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Model switch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== BULK PROCESSING ENDPOINT =====

@app.post("/chat/bulk", response_model=BulkChatResponse)
async def bulk_chat_processing(
    request: BulkChatRequest,
    service: Any = Depends(get_service)
):
    """Process multiple chat requests in batch"""
    try:
        start_time = time.time()
        responses = []
        successful = 0
        failed = 0
        
        if request.process_sequentially:
            # Process sequentially
            for chat_req in request.requests:
                try:
                    response = await chat_with_huggingface(chat_req, BackgroundTasks(), service)
                    responses.append(response)
                    successful += 1
                except Exception as e:
                    error_response = create_error_response(str(e), "BULK_PROCESSING_ERROR")
                    responses.append(error_response)
                    failed += 1
        else:
            # Process concurrently
            tasks = []
            for chat_req in request.requests:
                task = asyncio.create_task(
                    chat_with_huggingface(chat_req, BackgroundTasks(), service)
                )
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, Exception):
                    error_response = create_error_response(str(result), "BULK_PROCESSING_ERROR")
                    responses.append(error_response)
                    failed += 1
                else:
                    responses.append(result)
                    successful += 1
        
        total_time = time.time() - start_time
        
        return BulkChatResponse(
            responses=responses,
            batch_id=request.batch_id,
            total_requests=len(request.requests),
            successful_requests=successful,
            failed_requests=failed,
            total_processing_time=total_time
        )
        
    except Exception as e:
        logger.error(f"Bulk processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===== HEALTH AND MONITORING ENDPOINTS =====

@app.get("/health", response_model=ServiceHealth)
async def get_service_health(service: Any = Depends(get_service)):
    """Get comprehensive service health status"""
    try:
        health = service.get_service_health()
        return ServiceHealth(**health)
        
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return ServiceHealth(
            service_status="error",
            api_connectivity=False,
            primary_model="unknown",
            fallback_model="unknown",
            active_sessions=0,
            total_models_available=0,
            rate_limit_status={},
            configuration={}
        )

@app.get("/models")
async def get_available_models():
    """Get list of available HuggingFace models"""
    return {
        "available_models": list(HuggingFaceConfig.MODELS.keys()),
        "primary_model": HuggingFaceConfig.PRIMARY_MODEL,
        "fallback_model": HuggingFaceConfig.FALLBACK_MODEL,
        "model_details": HuggingFaceConfig.MODELS
    }

@app.get("/templates")
async def get_prompt_templates():
    """Get available prompt templates"""
    return {
        "system_prompts": list(RealEstatePromptTemplates.SYSTEM_PROMPTS.keys()),
        "conversation_starters": list(RealEstatePromptTemplates.CONVERSATION_STARTERS.keys()),
        "property_analysis": list(RealEstatePromptTemplates.PROPERTY_ANALYSIS.keys()),
        "follow_up_questions": list(RealEstatePromptTemplates.FOLLOW_UP_QUESTIONS.keys()),
        "fallback_responses": list(RealEstatePromptTemplates.FALLBACK_RESPONSES.keys())
    }

# ===== INTEGRATION ENDPOINTS =====

@app.post("/integration/webhook")
async def handle_webhook(
    request: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Handle webhooks from external systems (CRM, property databases, etc.)"""
    try:
        webhook_type = request.get("type", "unknown")
        session_id = request.get("session_id")
        
        logger.info(f"Received webhook: {webhook_type} for session {session_id}")
        
        # Process webhook in background
        background_tasks.add_task(process_webhook_data, request)
        
        return {"status": "accepted", "message": "Webhook processed"}
        
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def process_webhook_data(webhook_data: Dict[str, Any]):
    """Background task to process webhook data"""
    try:
        # This would integrate with your existing Flask app
        # For now, just log the webhook data
        logger.info(f"Processing webhook data: {webhook_data}")
        
        # Example: Update user preferences based on CRM data
        # Example: Update property context based on new listings
        # Example: Trigger follow-up conversations based on external events
        
    except Exception as e:
        logger.error(f"Background webhook processing error: {e}")

# ===== ROOT ENDPOINT =====

@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Real Estate AI Assistant - HuggingFace Integration",
        "version": "1.0.0",
        "status": "active",
        "endpoints": {
            "main_chat": "/chat/huggingface",
            "property_search": "/chat/property-search",
            "investment_analysis": "/chat/investment-analysis",
            "first_time_buyer": "/chat/first-time-buyer",
            "health": "/health",
            "docs": "/docs"
        },
        "features": [
            "Context-aware conversations",
            "Canadian real estate expertise", 
            "Multiple HuggingFace models",
            "Session management",
            "Real estate insights",
            "Fallback handling",
            "Rate limiting",
            "Bulk processing"
        ]
    }

# ===== ERROR HANDLERS =====

@app.exception_handler(HuggingFaceAPIError)
async def huggingface_exception_handler(request: Request, exc: HuggingFaceAPIError):
    """Handle HuggingFace API specific errors"""
    logger.error(f"HuggingFace API error: {exc}")
    
    return JSONResponse(
        status_code=503 if exc.status_code == 503 else 500,
        content={
            "error": str(exc),
            "error_code": "HUGGINGFACE_API_ERROR",
            "model": exc.model,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "error_code": "INTERNAL_ERROR",
            "timestamp": datetime.now().isoformat()
        }
    )

# ===== MAIN FUNCTION =====

def main():
    """Main function to run the FastAPI server"""
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=False,  # Set to True for development
        access_log=True
    )
    server = uvicorn.Server(config)
    server.run()

if __name__ == "__main__":
    print("=" * 70)
    print("🤖 REAL ESTATE AI ASSISTANT - HUGGINGFACE FASTAPI")
    print("🏠 Canadian Real Estate Chatbot Integration")
    print("=" * 70)
    print("🚀 Starting FastAPI server...")
    print("📍 Server: http://0.0.0.0:8000")
    print("📍 Local: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("🔍 ReDoc: http://localhost:8000/redoc")
    print("=" * 70)
    
    main()