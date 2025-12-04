"""
Qwen2.5-Omni Multimodal Service

This service handles multimodal interactions including text, audio, image, and video
processing using the Qwen2.5-Omni model for real estate applications.
"""

import os
import io
import base64
import tempfile
from typing import Optional, Dict, Any, List, Tuple
import logging

import torch
import soundfile as sf
import numpy as np
from transformers import Qwen2_5OmniForConditionalGeneration, Qwen2_5OmniProcessor
from qwen_omni_utils import process_mm_info

logger = logging.getLogger(__name__)

class QwenOmniService:
    def __init__(self):
        self.model = None
        self.processor = None
        self.device = None
        self.model_name = "Qwen/Qwen2.5-Omni-3B"
        self.initialized = False
        
    def initialize(self):
        """Initialize the Qwen2.5-Omni model and processor"""
        try:
            logger.info("Initializing Qwen2.5-Omni model...")
            
            # Set device
            self.device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
            logger.info(f"Using device: {self.device}")
            
            # Load model with optimizations
            self.model = Qwen2_5OmniForConditionalGeneration.from_pretrained(
                self.model_name,
                torch_dtype="auto",
                device_map="auto",
                # Uncomment if you have flash attention available
                # attn_implementation="flash_attention_2",
            )
            
            # Load processor
            self.processor = Qwen2_5OmniProcessor.from_pretrained(self.model_name)
            
            self.initialized = True
            logger.info("Qwen2.5-Omni model initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize Qwen2.5-Omni model: {e}")
            raise
    
    def _get_real_estate_system_prompt(self) -> str:
        """Get the system prompt tailored for real estate applications"""
        return """You are Qwen, a virtual human developed by the Qwen Team, Alibaba Group, capable of perceiving auditory and visual inputs, as well as generating text and speech. You are specialized in Canadian real estate assistance.

You help users with:
- Property searches and recommendations
- Market analysis and trends
- Investment advice and ROI calculations
- Location insights and neighborhood analysis
- Property image/video analysis
- Audio property descriptions

Always provide helpful, accurate, and engaging responses about Canadian real estate. Be conversational and friendly while maintaining professionalism."""

    async def generate_multimodal_response(
        self,
        text_input: Optional[str] = None,
        audio_data: Optional[bytes] = None,
        image_data: Optional[bytes] = None,
        video_data: Optional[bytes] = None,
        conversation_history: Optional[List[Dict]] = None,
        return_audio: bool = True,
        speaker: str = "Chelsie"
    ) -> Dict[str, Any]:
        """
        Generate a multimodal response from the Qwen2.5-Omni model
        
        Args:
            text_input: Text input from user
            audio_data: Audio data in bytes
            image_data: Image data in bytes  
            video_data: Video data in bytes
            conversation_history: Previous conversation context
            return_audio: Whether to return audio response
            speaker: Voice type ("Chelsie" or "Ethan")
            
        Returns:
            Dict containing response text and optional audio
        """
        if not self.initialized:
            self.initialize()
            
        try:
            # Build conversation
            conversation = [
                {
                    "role": "system",
                    "content": [
                        {"type": "text", "text": self._get_real_estate_system_prompt()}
                    ],
                }
            ]
            
            # Add conversation history if provided
            if conversation_history:
                for turn in conversation_history[-5:]:  # Keep last 5 turns
                    if 'user' in turn:
                        conversation.append({
                            "role": "user",
                            "content": [{"type": "text", "text": turn['user']}]
                        })
                    if 'assistant' in turn:
                        conversation.append({
                            "role": "assistant", 
                            "content": [{"type": "text", "text": turn['assistant']}]
                        })
            
            # Build current user input
            user_content = []
            
            # Add text if provided
            if text_input:
                user_content.append({"type": "text", "text": text_input})
            
            # Handle multimedia inputs
            temp_files = []
            
            try:
                # Handle audio input
                if audio_data:
                    audio_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
                    audio_file.write(audio_data)
                    audio_file.close()
                    temp_files.append(audio_file.name)
                    user_content.append({"type": "audio", "audio": audio_file.name})
                
                # Handle image input
                if image_data:
                    image_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
                    image_file.write(image_data)
                    image_file.close()
                    temp_files.append(image_file.name)
                    user_content.append({"type": "image", "image": image_file.name})
                
                # Handle video input
                if video_data:
                    video_file = tempfile.NamedTemporaryFile(suffix='.mp4', delete=False)
                    video_file.write(video_data)
                    video_file.close()
                    temp_files.append(video_file.name)
                    user_content.append({"type": "video", "video": video_file.name})
                
                # Add user message to conversation
                if user_content:
                    conversation.append({
                        "role": "user",
                        "content": user_content
                    })
                
                # Process conversation
                text = self.processor.apply_chat_template(
                    conversation, 
                    add_generation_prompt=True, 
                    tokenize=False
                )
                
                # Process multimedia info
                USE_AUDIO_IN_VIDEO = True
                audios, images, videos = process_mm_info(
                    conversation, 
                    use_audio_in_video=USE_AUDIO_IN_VIDEO
                )
                
                # Prepare inputs
                inputs = self.processor(
                    text=text,
                    audio=audios,
                    images=images,
                    videos=videos,
                    return_tensors="pt",
                    padding=True,
                    use_audio_in_video=USE_AUDIO_IN_VIDEO
                )
                
                inputs = inputs.to(self.model.device).to(self.model.dtype)
                
                # Generate response
                if return_audio:
                    text_ids, audio = self.model.generate(
                        **inputs,
                        use_audio_in_video=USE_AUDIO_IN_VIDEO,
                        speaker=speaker,
                        return_audio=True
                    )
                else:
                    text_ids = self.model.generate(
                        **inputs,
                        use_audio_in_video=USE_AUDIO_IN_VIDEO,
                        return_audio=False
                    )
                    audio = None
                
                # Decode text response
                response_text = self.processor.batch_decode(
                    text_ids, 
                    skip_special_tokens=True, 
                    clean_up_tokenization_spaces=False
                )[0]
                
                # Clean up response text (remove the conversation history part)
                if "assistant" in response_text:
                    response_text = response_text.split("assistant")[-1].strip()
                
                # Prepare response
                result = {
                    "success": True,
                    "text_response": response_text,
                    "has_audio": audio is not None
                }
                
                # Convert audio to base64 if present
                if audio is not None:
                    audio_np = audio.reshape(-1).detach().cpu().numpy()
                    
                    # Save to temporary buffer
                    buffer = io.BytesIO()
                    sf.write(buffer, audio_np, samplerate=24000, format='WAV')
                    buffer.seek(0)
                    
                    # Encode to base64
                    audio_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
                    result["audio_response"] = audio_base64
                
                return result
                
            finally:
                # Clean up temporary files
                for temp_file in temp_files:
                    try:
                        os.unlink(temp_file)
                    except:
                        pass
                        
        except Exception as e:
            logger.error(f"Error generating multimodal response: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def analyze_property_media(
        self,
        property_data: Dict[str, Any],
        media_data: bytes,
        media_type: str,  # 'image' or 'video'
        analysis_focus: str = "general"
    ) -> Dict[str, Any]:
        """
        Analyze property images or videos with AI
        
        Args:
            property_data: Property information (price, location, etc.)
            media_data: Image or video data in bytes
            media_type: 'image' or 'video'
            analysis_focus: Focus of analysis ('general', 'investment', 'layout', etc.)
            
        Returns:
            Dict containing AI analysis of the property media
        """
        
        # Create analysis prompt based on focus
        focus_prompts = {
            "general": "Analyze this property. Describe what you see, the condition, style, and key features.",
            "investment": "Analyze this property from an investment perspective. Consider rental potential, appreciation factors, and market appeal.",
            "layout": "Analyze the layout and space utilization of this property. Comment on functionality and flow.",
            "condition": "Assess the condition of this property. Note any maintenance issues, upgrades, or concerns."
        }
        
        prompt = f"""Property Analysis Request:
        
Location: {property_data.get('location', 'Unknown')}
Price: {property_data.get('price', 'Not specified')}
Type: {property_data.get('type', 'Property')}

{focus_prompts.get(analysis_focus, focus_prompts['general'])}

Please provide specific insights about this Canadian real estate property."""
        
        # Generate analysis
        if media_type == 'image':
            result = await self.generate_multimodal_response(
                text_input=prompt,
                image_data=media_data,
                return_audio=False  # Skip audio for property analysis
            )
        elif media_type == 'video':
            result = await self.generate_multimodal_response(
                text_input=prompt,
                video_data=media_data,
                return_audio=False
            )
        else:
            return {"success": False, "error": "Unsupported media type"}
            
        return result
    
    def is_available(self) -> bool:
        """Check if the service is available and initialized"""
        return self.initialized and self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        return {
            "model_name": self.model_name,
            "device": str(self.device) if self.device else None,
            "initialized": self.initialized,
            "supports_audio": True,
            "supports_images": True,
            "supports_video": True,
            "available_speakers": ["Chelsie", "Ethan"]
        }

# Global instance
qwen_omni_service = QwenOmniService()