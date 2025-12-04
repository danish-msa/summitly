"""
Multimodal Chat Endpoints for Qwen2.5-Omni Integration

This module provides FastAPI endpoints for handling multimodal interactions
including text, audio, image, and video inputs with the real estate chatbot.
"""

import os
import base64
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
import asyncio

from services.qwen_omni_service import qwen_omni_service

logger = logging.getLogger(__name__)

# Create router
router = APIRouter()

# Request/Response Models
class MultimodalChatRequest(BaseModel):
    message: Optional[str] = None
    session_id: str
    audio_base64: Optional[str] = None
    image_base64: Optional[str] = None
    video_base64: Optional[str] = None
    return_audio: bool = True
    speaker: str = "Chelsie"  # "Chelsie" or "Ethan"
    conversation_history: Optional[List[Dict[str, str]]] = None

class MultimodalChatResponse(BaseModel):
    success: bool
    text_response: Optional[str] = None
    audio_response: Optional[str] = None  # base64 encoded
    has_audio: bool = False
    error: Optional[str] = None
    session_id: str

class PropertyMediaAnalysisRequest(BaseModel):
    property_data: Dict[str, Any]
    media_base64: str
    media_type: str  # 'image' or 'video'
    analysis_focus: str = "general"  # 'general', 'investment', 'layout', 'condition'

class PropertyMediaAnalysisResponse(BaseModel):
    success: bool
    analysis: Optional[str] = None
    error: Optional[str] = None

class ModelStatusResponse(BaseModel):
    available: bool
    model_info: Dict[str, Any]
    error: Optional[str] = None

@router.post("/multimodal-chat", response_model=MultimodalChatResponse)
async def multimodal_chat(request: MultimodalChatRequest):
    """
    Handle multimodal chat requests with text, audio, image, and/or video inputs
    """
    try:
        # Check if service is available
        if not qwen_omni_service.is_available():
            # Try to initialize if not already done
            try:
                qwen_omni_service.initialize()
            except Exception as e:
                raise HTTPException(
                    status_code=503, 
                    detail=f"Qwen2.5-Omni service unavailable: {str(e)}"
                )
        
        # Prepare input data
        audio_data = None
        image_data = None
        video_data = None
        
        # Decode base64 inputs
        if request.audio_base64:
            try:
                audio_data = base64.b64decode(request.audio_base64)
            except Exception as e:
                logger.error(f"Failed to decode audio data: {e}")
                
        if request.image_base64:
            try:
                image_data = base64.b64decode(request.image_base64)
            except Exception as e:
                logger.error(f"Failed to decode image data: {e}")
                
        if request.video_base64:
            try:
                video_data = base64.b64decode(request.video_base64)
            except Exception as e:
                logger.error(f"Failed to decode video data: {e}")
        
        # Generate response
        result = await qwen_omni_service.generate_multimodal_response(
            text_input=request.message,
            audio_data=audio_data,
            image_data=image_data,
            video_data=video_data,
            conversation_history=request.conversation_history,
            return_audio=request.return_audio,
            speaker=request.speaker
        )
        
        if result["success"]:
            return MultimodalChatResponse(
                success=True,
                text_response=result["text_response"],
                audio_response=result.get("audio_response"),
                has_audio=result["has_audio"],
                session_id=request.session_id
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate response")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in multimodal chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-multimodal", response_model=MultimodalChatResponse)
async def upload_multimodal_chat(
    message: Optional[str] = Form(None),
    session_id: str = Form(...),
    return_audio: bool = Form(True),
    speaker: str = Form("Chelsie"),
    audio_file: Optional[UploadFile] = File(None),
    image_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None)
):
    """
    Handle multimodal chat with file uploads
    """
    try:
        # Check if service is available
        if not qwen_omni_service.is_available():
            try:
                qwen_omni_service.initialize()
            except Exception as e:
                raise HTTPException(
                    status_code=503, 
                    detail=f"Qwen2.5-Omni service unavailable: {str(e)}"
                )
        
        # Read uploaded files
        audio_data = None
        image_data = None
        video_data = None
        
        if audio_file:
            audio_data = await audio_file.read()
            
        if image_file:
            image_data = await image_file.read()
            
        if video_file:
            video_data = await video_file.read()
        
        # Generate response
        result = await qwen_omni_service.generate_multimodal_response(
            text_input=message,
            audio_data=audio_data,
            image_data=image_data,
            video_data=video_data,
            conversation_history=None,  # Could be extended to include history
            return_audio=return_audio,
            speaker=speaker
        )
        
        if result["success"]:
            return MultimodalChatResponse(
                success=True,
                text_response=result["text_response"],
                audio_response=result.get("audio_response"),
                has_audio=result["has_audio"],
                session_id=session_id
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to generate response")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in upload multimodal chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-property-media", response_model=PropertyMediaAnalysisResponse)
async def analyze_property_media(request: PropertyMediaAnalysisRequest):
    """
    Analyze property images or videos with AI
    """
    try:
        # Check if service is available
        if not qwen_omni_service.is_available():
            try:
                qwen_omni_service.initialize()
            except Exception as e:
                raise HTTPException(
                    status_code=503, 
                    detail=f"Qwen2.5-Omni service unavailable: {str(e)}"
                )
        
        # Decode media data
        try:
            media_data = base64.b64decode(request.media_base64)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to decode media data: {str(e)}"
            )
        
        # Validate media type
        if request.media_type not in ['image', 'video']:
            raise HTTPException(
                status_code=400,
                detail="media_type must be 'image' or 'video'"
            )
        
        # Generate analysis
        result = await qwen_omni_service.analyze_property_media(
            property_data=request.property_data,
            media_data=media_data,
            media_type=request.media_type,
            analysis_focus=request.analysis_focus
        )
        
        if result["success"]:
            return PropertyMediaAnalysisResponse(
                success=True,
                analysis=result["text_response"]
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=result.get("error", "Failed to analyze media")
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in property media analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model-status", response_model=ModelStatusResponse)
async def get_model_status():
    """
    Get the status and information about the Qwen2.5-Omni model
    """
    try:
        is_available = qwen_omni_service.is_available()
        model_info = qwen_omni_service.get_model_info()
        
        return ModelStatusResponse(
            available=is_available,
            model_info=model_info
        )
        
    except Exception as e:
        logger.error(f"Error getting model status: {e}")
        return ModelStatusResponse(
            available=False,
            model_info={},
            error=str(e)
        )

@router.post("/initialize-model")
async def initialize_model():
    """
    Manually initialize the Qwen2.5-Omni model
    """
    try:
        if qwen_omni_service.is_available():
            return {"success": True, "message": "Model already initialized"}
        
        # Initialize model in background
        qwen_omni_service.initialize()
        
        return {"success": True, "message": "Model initialized successfully"}
        
    except Exception as e:
        logger.error(f"Error initializing model: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for the multimodal service"""
    return {
        "status": "healthy",
        "service": "qwen-omni-multimodal",
        "model_available": qwen_omni_service.is_available()
    }