"""
Models for the Real Estate Voice Assistant
"""
from datetime import datetime
from typing import Dict, List, Optional

class Session:
    """User session management"""
    def __init__(self):
        self.stage = 'greeting'
        self.question_index = 0
        self.user_data = {}
        self.history = []
        self.interaction_mode = 'text'
        self.lead_id = None
        self.assigned_broker = None

class Lead:
    """Lead data model"""
    def __init__(self, user_data: Dict, assigned_broker: Dict = None, properties_viewed: List = None):
        self.lead_id = self.generate_lead_id()
        self.timestamp = datetime.now().isoformat()
        self.user_name = user_data.get('name', '')
        self.user_email = user_data.get('email', '')
        self.user_phone = user_data.get('contact', '')
        self.location_searched = user_data.get('location', '')
        self.property_type = user_data.get('property_type', '')
        self.budget_range = user_data.get('budget', '')
        self.availability = user_data.get('availability_date', '')
        self.properties_interested_in = properties_viewed or []
        self.assigned_broker_id = assigned_broker['broker_id'] if assigned_broker else ''
        self.assigned_broker_name = assigned_broker['name'] if assigned_broker else ''
        self.assigned_broker_email = assigned_broker['email'] if assigned_broker else ''
        self.status = "New"
        self.notes = ""
        self.conversation_history = user_data.get('conversation_history', [])
    
    @staticmethod
    def generate_lead_id() -> str:
        """Generate unique lead ID"""
        import uuid
        timestamp = datetime.now().strftime("%Y%m%d")
        random_suffix = str(uuid.uuid4())[:8].upper()
        return f"LEAD_{timestamp}_{random_suffix}"

class HuggingFaceBridge:
    """Bridge service to connect Flask app with HuggingFace FastAPI"""
    
    def __init__(self, fastapi_url: str = "http://localhost:8000"):
        self.fastapi_url = fastapi_url
        self.session_timeout = 3600  # 1 hour
    
    def generate_session_id(self, user_id: str = None) -> str:
        """Generate a unique session ID"""
        import uuid
        import time
        timestamp = int(time.time())
        unique_id = str(uuid.uuid4())[:8]
        return f"session_{timestamp}_{unique_id}"