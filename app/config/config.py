"""
Configuration settings for the Real Estate Voice Assistant
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file in config directory
def load_environment():
    env_path = Path(__file__).parent.parent.parent / 'config' / '.env'
    try:
        load_dotenv(dotenv_path=env_path)
        print(f"✅ Environment variables loaded from {env_path}")
    except Exception as e:
        print(f"⚠️ Environment variables not loaded: {e}")

# Application configuration
class Config:
    # Flask configuration
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 5050))
    
    # External API URLs
    SUMMITLY_BASE_URL = "https://api.summitly.ca"  # Legacy URL for display
    REPLIERS_BASE_URL = "https://api.repliers.io"
    REPLIERS_API_KEY = os.getenv('REPLIERS_API_KEY', '')
    
    # File paths
    UPLOAD_FOLDER = 'temp_audio'
    EXCEL_FILE_PATH = "leads_data.xlsx"
    
    # Email configuration
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', '587'))
    MAIL_USE_TLS = True
    MAIL_USERNAME = os.getenv('MAIL_USERNAME', 'shreyash@summitly.ca')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', 'shreyash@summitly.ca')
    
    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    EXA_API_KEY = os.getenv('EXA_API_KEY', 'your-exa-api-key-here')
    
    # HuggingFace FastAPI service
    HUGGINGFACE_API_URL = os.getenv('HUGGINGFACE_API_URL', 'http://localhost:8000')

# Questions for data collection
LEAD_COLLECTION_QUESTIONS = [
    ('name', "What's your name?"),
    ('email', "What's your email address?"),
    ('contact', "What's your phone number?"),
    ('location', "What location are you interested in? (e.g., Toronto, Mississauga, etc.)"),
    ('property_type', "What type of property are you looking for? (house, condo, apartment, etc.)"),
    ('budget', "What's your budget range?"),
    ('availability_date', "When are you looking to move?")
]