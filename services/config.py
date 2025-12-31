#!/usr/bin/env python3
"""
Configuration file for HuggingFace FastAPI Integration
Real Estate Chatbot - Canadian Market
"""

import os
from typing import Dict, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class HuggingFaceConfig:
    """HuggingFace API Configuration"""
    
    # HuggingFace API Settings
    API_TOKEN = os.getenv('HUGGINGFACE_API_TOKEN', '')
    BASE_URL = os.getenv('HUGGINGFACE_API_URL', 'https://router.huggingface.co/v1/models')
    TIMEOUT = int(os.getenv('HUGGINGFACE_REQUEST_TIMEOUT', '30'))
    MAX_RETRIES = 3
    
    # Model Configuration
    PRIMARY_MODEL = "facebook/blenderbot-400M-distill"
    FALLBACK_MODEL = "microsoft/DialoGPT-medium"
    
    # Supported models with their characteristics
    MODELS = {
        "facebook/blenderbot-400M-distill": {
            "type": "conversational",
            "max_tokens": 512,
            "temperature": 0.7,
            "description": "Optimized for conversational responses",
            "best_for": ["general_chat", "real_estate_questions", "friendly_responses"]
        },
        "microsoft/DialoGPT-medium": {
            "type": "dialogue",
            "max_tokens": 1024,
            "temperature": 0.6,
            "description": "Multi-turn conversation specialist",
            "best_for": ["follow_up_questions", "context_aware_responses", "detailed_discussions"]
        },
        "facebook/blenderbot-1B-distill": {
            "type": "conversational",
            "max_tokens": 512,
            "temperature": 0.8,
            "description": "Larger model for complex conversations",
            "best_for": ["complex_queries", "detailed_explanations", "nuanced_responses"]
        }
    }
    
    # Request Configuration
    REQUEST_HEADERS = {
        "Content-Type": "application/json",
        "User-Agent": "RealEstate-ChatBot-v1.0"
    }
    
    # Rate Limiting Configuration
    RATE_LIMIT = {
        "requests_per_minute": 100,
        "requests_per_hour": 1000,
        "burst_limit": 10,
        "backoff_factor": 1.5,
        "max_backoff": 60
    }

class ConversationConfig:
    """Conversation Management Configuration"""
    
    # Context Management
    MAX_CONVERSATION_HISTORY = 5  # Last 5 turns
    MAX_CONTEXT_TOKENS = 2048
    CONTEXT_OVERLAP = 50  # Tokens to overlap between contexts
    
    # Session Configuration
    SESSION_TIMEOUT = 1800  # 30 minutes
    MAX_SESSIONS = 1000
    SESSION_CLEANUP_INTERVAL = 300  # 5 minutes
    
    # Response Configuration
    MIN_RESPONSE_LENGTH = 10
    MAX_RESPONSE_LENGTH = 500
    DEFAULT_TEMPERATURE = 0.7
    
    # Canadian Real Estate Context
    CANADIAN_CONTEXT = {
        "provinces": ["Ontario", "British Columbia", "Alberta", "Quebec", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick", "Newfoundland and Labrador", "Prince Edward Island"],
        "major_cities": ["Toronto", "Vancouver", "Montreal", "Calgary", "Edmonton", "Ottawa", "Mississauga", "Winnipeg", "Quebec City", "Hamilton"],
        "gta_cities": ["Toronto", "Mississauga", "Brampton", "Markham", "Richmond Hill", "Vaughan", "Oakville", "Burlington", "Pickering", "Ajax"],
        "property_types": ["Detached", "Semi-Detached", "Townhouse", "Condo", "Apartment", "Duplex", "Triplex", "Commercial"],
        "currency": "CAD",
        "mortgage_terms": ["5-year fixed", "variable rate", "25-year amortization", "CMHC insurance"]
    }

class RealEstatePromptConfig:
    """Real Estate Specific Prompt Configuration"""
    
    # System Prompts for Different Scenarios
    SYSTEM_PROMPTS = {
        "general": """You are a knowledgeable and friendly Canadian real estate assistant. You help clients find properties, understand the market, and make informed decisions. Always provide helpful, accurate information about Canadian real estate markets, focusing on the Greater Toronto Area (GTA), Vancouver, and other major Canadian cities. Be conversational and supportive.""",
        
        "property_search": """You are a real estate expert helping clients find their perfect home in Canada. Focus on understanding their needs: location preferences, budget, property type, and lifestyle requirements. Provide specific, actionable advice about Canadian real estate markets, neighborhoods, and property values.""",
        
        "market_analysis": """You are a Canadian real estate market analyst. Provide insights about property values, market trends, neighborhood characteristics, and investment potential. Focus on Canadian markets, particularly Ontario (GTA), British Columbia (Vancouver), and other major metropolitan areas.""",
        
        "first_time_buyer": """You are a patient and educational real estate assistant helping first-time home buyers in Canada. Explain complex concepts simply, guide them through the buying process, and help them understand mortgages, down payments, closing costs, and CMHC insurance requirements."""
    }
    
    # Context Enhancement Templates
    CONTEXT_TEMPLATES = {
        "property_context": "The user is interested in {property_type} properties in {location} with a budget of {budget}. Previous conversation: {history}",
        "market_context": "Discussing {location} real estate market trends, focusing on {property_type} properties. Market context: {market_data}",
        "comparison_context": "Comparing properties or locations: {comparison_items}. User preferences: {preferences}"
    }
    
    # Response Enhancement Keywords
    CANADIAN_REAL_ESTATE_KEYWORDS = [
        "MLS", "TREB", "CMHC", "down payment", "closing costs", "property taxes",
        "home inspection", "realtor", "real estate agent", "mortgage pre-approval",
        "GTA", "Greater Toronto Area", "Vancouver housing market", "Ontario real estate",
        "condo fees", "maintenance fees", "property management", "rental income",
        "capital gains", "principal residence", "investment property"
    ]

class LoggingConfig:
    """Logging Configuration"""
    
    # Log Levels
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # Log Format
    LOG_FORMAT = {
        "version": 1,
        "formatters": {
            "detailed": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s", "function": "%(funcName)s", "line": %(lineno)d}'
            }
        }
    }
    
    # Log Files
    LOG_FILES = {
        "app": "logs/app.log",
        "huggingface": "logs/huggingface.log",
        "conversations": "logs/conversations.log",
        "errors": "logs/errors.log"
    }
    
    # Performance Metrics
    METRICS = {
        "response_time_buckets": [0.1, 0.5, 1.0, 2.0, 5.0, 10.0],
        "conversation_length_buckets": [1, 5, 10, 20, 50],
        "track_user_satisfaction": True,
        "track_model_performance": True
    }

class CacheConfig:
    """Caching Configuration"""
    
    # Redis Configuration (if available)
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = int(os.getenv('REDIS_PORT', 6379))
    REDIS_DB = int(os.getenv('REDIS_DB', 0))
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
    
    # Redis Connection Settings (fixes "Connection reset by peer" errors)
    REDIS_SOCKET_TIMEOUT = int(os.getenv('REDIS_SOCKET_TIMEOUT', 5))
    REDIS_SOCKET_CONNECT_TIMEOUT = int(os.getenv('REDIS_SOCKET_CONNECT_TIMEOUT', 5))
    REDIS_RETRY_ON_TIMEOUT = os.getenv('REDIS_RETRY_ON_TIMEOUT', 'true').lower() == 'true'
    REDIS_CONNECTION_POOL_MAX_CONNECTIONS = int(os.getenv('REDIS_POOL_MAX_CONNECTIONS', 10))
    REDIS_HEALTH_CHECK_INTERVAL = int(os.getenv('REDIS_HEALTH_CHECK_INTERVAL', 30))
    
    # Cache Settings
    CACHE_TTL = {
        "conversation_history": 1800,  # 30 minutes
        "user_preferences": 3600,      # 1 hour
        "property_data": 900,          # 15 minutes
        "market_data": 1800,           # 30 minutes
        "common_responses": 7200       # 2 hours
    }
    
    # In-Memory Cache (fallback)
    MAX_MEMORY_CACHE_SIZE = 1000
    MEMORY_CACHE_TTL = 600  # 10 minutes

class SecurityConfig:
    """Security Configuration"""
    
    # API Security
    API_KEY_HEADER = "X-API-Key"
    ALLOWED_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5050",
        "https://summitly.ca",
        "https://api.summitly.ca"
    ]
    
    # Rate Limiting
    RATE_LIMIT_STORAGE = "memory"  # or "redis"
    DEFAULT_RATE_LIMIT = "100/minute"
    
    # Input Validation
    MAX_MESSAGE_LENGTH = 2000
    MIN_MESSAGE_LENGTH = 1
    ALLOWED_LANGUAGES = ["en", "fr"]  # English and French for Canadian market
    
    # Content Filtering
    ENABLE_CONTENT_FILTER = True
    BLOCKED_WORDS = []  # Add inappropriate words if needed
    
class IntegrationConfig:
    """Integration with Existing Systems"""
    
    # Existing Flask App Integration
    FLASK_HOST = "localhost"
    FLASK_PORT = 5050
    FLASK_ENDPOINTS = {
        "property_search": "/api/property-search",
        "location_insights": "/api/location-insights", 
        "property_analysis": "/api/property-analysis"
    }
    
    # Database Integration
    DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///chatbot.db')
    
    # External APIs
    REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')
    REPLIERS_BASE_URL = "https://api.repliers.io"
    
    # Email Configuration
    SMTP_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('MAIL_PORT', 587))
    SMTP_USERNAME = os.getenv('MAIL_USERNAME', '')
    SMTP_PASSWORD = os.getenv('MAIL_PASSWORD', '')

# Environment Variables Template
ENV_TEMPLATE = """
# HuggingFace Configuration
HUGGING_FACE_API_TOKEN=your_huggingface_token_here

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Database Configuration
DATABASE_URL=sqlite:///chatbot.db

# Email Configuration
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_app_password

# Logging Configuration
LOG_LEVEL=INFO

# External APIs
REPLIERS_API_KEY=your_repliers_api_key
"""

def validate_config() -> Dict[str, bool]:
    """Validate configuration settings"""
    validation_results = {
        "huggingface_token": bool(HuggingFaceConfig.API_TOKEN),
        "models_available": len(HuggingFaceConfig.MODELS) > 0,
        "logging_configured": bool(LoggingConfig.LOG_LEVEL),
        "cache_configured": True,  # Always available (memory fallback)
        "security_configured": len(SecurityConfig.ALLOWED_ORIGINS) > 0,
        "integration_configured": bool(IntegrationConfig.FLASK_HOST)
    }
    
    # Check if log directories exist
    import os
    for log_file in LoggingConfig.LOG_FILES.values():
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            try:
                os.makedirs(log_dir, exist_ok=True)
                validation_results["log_directories"] = True
            except Exception:
                validation_results["log_directories"] = False
    
    return validation_results

def get_model_config(model_name: str) -> Optional[Dict]:
    """Get configuration for a specific model"""
    return HuggingFaceConfig.MODELS.get(model_name)

def get_system_prompt(scenario: str = "general") -> str:
    """Get system prompt for a specific scenario"""
    return RealEstatePromptConfig.SYSTEM_PROMPTS.get(scenario, 
                                                    RealEstatePromptConfig.SYSTEM_PROMPTS["general"])

if __name__ == "__main__":
    # Print configuration validation
    print("=" * 60)
    print("🔧 HuggingFace FastAPI Configuration Validation")
    print("=" * 60)
    
    validation = validate_config()
    for key, value in validation.items():
        status = "✅ PASS" if value else "❌ FAIL"
        print(f"{key.replace('_', ' ').title()}: {status}")
    
    print("\n📋 Configuration Summary:")
    print(f"Primary Model: {HuggingFaceConfig.PRIMARY_MODEL}")
    print(f"Fallback Model: {HuggingFaceConfig.FALLBACK_MODEL}")
    print(f"Available Models: {len(HuggingFaceConfig.MODELS)}")
    print(f"Max Conversation History: {ConversationConfig.MAX_CONVERSATION_HISTORY}")
    print(f"Session Timeout: {ConversationConfig.SESSION_TIMEOUT}s")
    print(f"API Timeout: {HuggingFaceConfig.TIMEOUT}s")
    
    if not HuggingFaceConfig.API_TOKEN:
        print("\n⚠️  WARNING: HUGGING_FACE_API_TOKEN not set!")
        print("Please set your HuggingFace API token in environment variables.")
        print("\nExample .env file:")
        print(ENV_TEMPLATE)
    
    print("=" * 60)