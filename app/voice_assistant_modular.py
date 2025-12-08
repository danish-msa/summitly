#!/usr/bin/env python3
"""
Enhanced Real Estate Voice Assistant with Lead Management System
Modular Architecture - Main Application
Features: Voice + Text Chat, Summitly Integration, Broker Assignment, Excel Tracking, Email Notifications
"""

import os
import sys
from flask import Flask
from flask_cors import CORS

# Add current directory to Python path for imports
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Configuration and setup
from config.config import Config, load_environment

# Load environment variables
load_environment()

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["*"])

# Configure Flask app
app.config.from_object(Config)

# Initialize services and check availability
def initialize_services():
    """Initialize and check availability of all services"""
    services_status = {
        'exa_available': False,
        'repliers_available': False,
        'openai_available': False,
        'flask_mail_available': False,
        'audio_available': False,
        'real_property_available': False
    }
    
    # Exa AI Integration
    try:
        from exa_py import Exa
        exa = Exa(os.environ.get('EXA_API_KEY', Config.EXA_API_KEY))
        services_status['exa_available'] = True
        print("✅ Exa AI service loaded successfully")
    except ImportError:
        print("⚠️ Exa AI not installed. Run: pip install exa_py")
    except Exception as e:
        print(f"⚠️ Exa AI initialization failed: {e}")

    # Repliers API Integration
    try:
        from services.listings_service import listings_service
        from services.nlp_service import nlp_service
        from services.chatbot_formatter import chatbot_formatter
        from services.estimates_service import estimates_service
        from services.saved_search_service import saved_search_service
        services_status['repliers_available'] = True
        print("✅ Repliers API services loaded successfully")
    except ImportError as e:
        print(f"⚠️ Repliers services not available: {e}")

    # OpenAI Integration
    try:
        from services.openai_service import is_openai_available, test_openai_connection
        if is_openai_available():
            services_status['openai_available'] = True
            print("✅ OpenAI service loaded and configured successfully")
            if test_openai_connection():
                print("✅ OpenAI connection test passed")
        else:
            print("⚠️ OpenAI API key not configured. Set OPENAI_API_KEY in .env")
    except ImportError as e:
        print(f"⚠️ OpenAI service not available: {e}")

    # Flask-Mail
    try:
        from flask_mail import Mail
        mail = Mail(app)
        services_status['flask_mail_available'] = True
        print("✅ Flask-Mail initialized successfully")
    except ImportError:
        print("⚠️ Flask-Mail not available. Email features will use fallback.")

    # Audio libraries
    try:
        from pydub import AudioSegment
        import speech_recognition as sr
        from gtts import gTTS
        services_status['audio_available'] = True
        print("✅ Audio libraries loaded successfully")
    except ImportError:
        print("⚠️ Audio libraries not available. Voice features disabled.")

    # Real Property Service
    try:
        from services.real_property_service import real_property_service
        services_status['real_property_available'] = True
        print("✅ Real Property Service loaded - Live data enabled")
    except ImportError as e:
        print(f"⚠️ Real Property Service not available: {e}")

    return services_status

# Initialize services
SERVICES_STATUS = initialize_services()

# Initialize Excel file for leads
from utils.excel_utils import initialize_excel_file
initialize_excel_file(Config.EXCEL_FILE_PATH)

# Create upload folder
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# Register blueprints (route handlers)
from routes.main_api import main_api
from routes.manager_api import manager_api
from routes.openai_api import openai_api
from routes.frontend_routes import frontend_routes

app.register_blueprint(main_api)
app.register_blueprint(manager_api)
app.register_blueprint(openai_api)
app.register_blueprint(frontend_routes)

# Additional route handlers for extended functionality
def register_extended_routes():
    """Register additional route handlers if services are available"""
    
    # HuggingFace integration routes
    try:
        from routes.huggingface_routes import huggingface_api
        app.register_blueprint(huggingface_api)
        print("✅ HuggingFace routes registered")
    except ImportError:
        print("⚠️ HuggingFace routes not available")
    
    # Intelligent chatbot routes
    try:
        from routes.intelligent_routes import intelligent_api
        app.register_blueprint(intelligent_api)
        print("✅ Intelligent chatbot routes registered")
    except ImportError:
        print("⚠️ Intelligent chatbot routes not available")
    
    # Repliers integration routes
    if SERVICES_STATUS['repliers_available']:
        try:
            from routes.repliers_routes import repliers_api
            app.register_blueprint(repliers_api)
            print("✅ Repliers integration routes registered")
        except ImportError:
            print("⚠️ Repliers routes not available")

# Register extended routes
register_extended_routes()

# Application status endpoint
@app.route('/api/status', methods=['GET'])
def application_status():
    """Get application and services status"""
    from flask import jsonify
    return jsonify({
        "success": True,
        "application": "Real Estate Voice Assistant",
        "version": "2.0.0 (Modular)",
        "services": SERVICES_STATUS,
        "configuration": {
            "host": Config.HOST,
            "port": Config.PORT,
            "debug": Config.DEBUG,
            "excel_file": Config.EXCEL_FILE_PATH,
            "upload_folder": Config.UPLOAD_FOLDER
        }
    })

# Main application runner
def main():
    """Main application entry point"""
    print("\n" + "="*70)
    print("🏠 ENHANCED REAL ESTATE AI - MODULAR ARCHITECTURE")
    print("✨ Features: Voice + Text Chat, AI Analysis, Real Estate Intelligence,")
    print("   Broker Assignment, Lead Management, Excel Tracking, Email Notifications")
    print("="*70)
    print(f"📍 Flask Server: http://{Config.HOST}:{Config.PORT}")
    print(f"📍 Local Access: http://localhost:{Config.PORT}")
    print(f"📊 Manager Dashboard: http://localhost:{Config.PORT}/manager")
    print(f"🤖 Intelligent Chat: http://localhost:{Config.PORT}/intelligent")
    print("="*70)
    
    # Service status summary
    print("🔧 Service Status:")
    for service, status in SERVICES_STATUS.items():
        status_icon = "✅" if status else "⚠️"
        service_name = service.replace('_', ' ').title()
        print(f"   {status_icon} {service_name}: {'Available' if status else 'Not Available'}")
    
    print("="*70)
    
    # API Endpoints summary
    print("🚀 Available API Endpoints:")
    print("   • /api/status - Application status")
    print("   • /api/health - Health check")
    print("   • /api/property-analysis - Property AI analysis")
    print("   • /api/text-chat - Text-based conversation")
    print("   • /api/voice-chat - Voice-based conversation")
    print("   • /api/manager/leads - Lead management")
    print("   • /api/manager/brokers - Broker management")
    
    if SERVICES_STATUS['openai_available']:
        print("   • /api/openai/* - OpenAI integration endpoints")
    
    if SERVICES_STATUS['repliers_available']:
        print("   • /api/repliers/* - MLS data integration endpoints")
    
    print("="*70 + "\n")
    
    # Start the application
    app.run(
        debug=Config.DEBUG,
        host=Config.HOST,
        port=Config.PORT,
        use_reloader=False,
        threaded=True
    )

if __name__ == '__main__':
    main()