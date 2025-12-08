"""
Audio processing utilities for voice features
"""
import os
import base64
import io
import re


# Check if audio libraries are available
try:
    from pydub import AudioSegment
    import speech_recognition as sr
    from gtts import gTTS
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False
    print("⚠️ Audio libraries not available. Voice features disabled.")


def text_to_speech_bytes(text: str) -> str:
    """Convert text to speech and return base64 encoded audio"""
    try:
        if not AUDIO_AVAILABLE:
            print("⚠️ Audio libraries not available")
            return ""
        
        # Clean text for TTS
        clean_text = re.sub(r'[🏠✨📸🔗💬📍💰🌟🎯]', '', text)
        clean_text = re.sub(r'\*\*([^*]+)\*\*', r'\1', clean_text)  # Remove markdown bold
        clean_text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean_text)  # Remove markdown links
        
        if not clean_text.strip():
            return ""
        
        # Generate TTS
        tts = gTTS(text=clean_text, lang='en', slow=False)
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        # Convert to base64
        audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
        return audio_base64
        
    except Exception as e:
        print(f"❌ TTS Error: {e}")
        return ""


def speech_to_text(wav_path: str) -> str:
    """Convert speech audio file to text"""
    try:
        if not AUDIO_AVAILABLE:
            print("⚠️ Audio libraries not available")
            return ""
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio = recognizer.record(source)
        
        # Try Google Speech Recognition
        try:
            text = recognizer.recognize_google(audio)
            print(f"🎤 Speech recognized: {text}")
            return text
        except sr.UnknownValueError:
            print("❌ Could not understand audio")
            return ""
        except sr.RequestError as e:
            print(f"❌ Speech recognition error: {e}")
            return ""
        
    except Exception as e:
        print(f"❌ Speech to text error: {e}")
        return ""


def call_openai_api(messages, temperature=0, max_tokens=400):
    """Call OpenAI API for AI responses"""
    try:
        # This would be imported from the OpenAI service
        from services.openai_service import is_openai_available
        
        if not is_openai_available():
            return {"error": "OpenAI service not available"}
        
        # Implementation would go here - placeholder for now
        return {"content": "Response would be generated here"}
        
    except Exception as e:
        print(f"❌ OpenAI API error: {e}")
        return {"error": str(e)}