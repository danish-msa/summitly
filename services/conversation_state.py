"""
ChatGPT-Style Conversation State Management
===========================================
Maintains complete conversation context like ChatGPT - remembers everything,
understands follow-ups, never loses state.

Author: Summitly Team
Date: December 12, 2025
"""

import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from copy import deepcopy

logger = logging.getLogger(__name__)


@dataclass
class ConversationState:
    """
    ChatGPT-style conversation state for real estate chatbot.
    
    Preserves ALL context across the entire conversation session.
    Updates ONLY the fields the user mentions, preserving everything else.
    
    Example:
        User: "Find condos in Toronto"
        State: location=Toronto, property_type=condo
        
        User: "With 2 bedrooms"
        State: location=Toronto, property_type=condo, bedrooms=2  [PRESERVED + UPDATED]
        
        User: "Show me rentals instead"
        State: location=Toronto, property_type=condo, bedrooms=2, listing_type=rent  [PRESERVED + UPDATED]
    """
    
    # Core Search Filters
    location: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    property_type: Optional[str] = None  # condo, detached, townhouse, semi-detached
    price_range: Optional[Tuple[Optional[int], Optional[int]]] = None  # (min, max)
    listing_type: str = "sale"  # "sale" or "rent"
    
    # Extended Location Filters
    community: Optional[str] = None
    neighborhood: Optional[str] = None
    postal_code: Optional[str] = None
    street_name: Optional[str] = None
    
    # Extended Property Filters
    ownership_type: Optional[str] = None  # freehold, condo, co-op
    property_style: Optional[str] = None  # 2-storey, bungalow, etc.
    min_bedrooms: Optional[int] = None
    max_bedrooms: Optional[int] = None
    bedrooms_plus: Optional[str] = None  # e.g., "2+1"
    min_bathrooms: Optional[float] = None
    max_bathrooms: Optional[float] = None
    
    # Advanced Filters
    amenities: List[str] = field(default_factory=list)  # pool, gym, parking, balcony, garden
    sqft_range: Optional[Tuple[Optional[int], Optional[int]]] = None  # (min, max)
    parking_spots: Optional[int] = None
    garage_type: Optional[str] = None  # attached, detached, none
    lot_size: Optional[int] = None
    
    # Condo-Specific Features
    exposure: Optional[str] = None  # north, south, east, west
    balcony: Optional[str] = None  # yes, no, open, enclosed
    locker: Optional[str] = None  # yes, no
    
    # Date Filters
    list_date_from: Optional[str] = None  # YYYY-MM-DD format
    list_date_to: Optional[str] = None    # YYYY-MM-DD format
    
    # MLS & Status
    mls_number: Optional[str] = None
    status: Optional[str] = None  # Active, Sold, etc.
    
    # Year Built
    year_built_min: Optional[int] = None
    year_built_max: Optional[int] = None
    
    # Media & Extras
    has_images: Optional[bool] = None
    has_virtual_tour: Optional[bool] = None
    
    # Search Results & History
    last_property_results: List[Dict] = field(default_factory=list)
    last_query: Optional[str] = None
    search_count: int = 0
    
    # Conversation Memory
    conversation_history: List[Dict[str, str]] = field(default_factory=list)  # [{"role": "user", "content": "..."}, ...]
    last_intent: Optional[str] = None  # search, refine, details, compare, general_question
    
    # Session Metadata
    session_id: str = ""
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    last_updated: str = field(default_factory=lambda: datetime.now().isoformat())
    
    # User Preferences (learned over time)
    preferred_locations: List[str] = field(default_factory=list)
    preferred_property_types: List[str] = field(default_factory=list)
    is_investor: bool = False
    is_first_time_buyer: Optional[bool] = None
    
    def update_from_dict(self, updates: Dict[str, Any]) -> 'ConversationState':
        """
        Update state with new values, preserving existing ones.
        This is the CORE of ChatGPT-style memory - only update what changed.
        
        Args:
            updates: Dictionary of field updates
            
        Returns:
            Self for chaining
            
        Example:
            state.update_from_dict({"bedrooms": 3, "location": "Toronto"})
            # Only bedrooms and location change, everything else preserved
        """
        for key, value in updates.items():
            if value is not None:  # Only update if new value provided
                if key == "amenities":
                    # Append to amenities list instead of replacing
                    for amenity in value if isinstance(value, list) else [value]:
                        if amenity not in self.amenities:
                            self.amenities.append(amenity)
                elif key == "preferred_locations":
                    # Append to preferred locations
                    for loc in value if isinstance(value, list) else [value]:
                        if loc not in self.preferred_locations:
                            self.preferred_locations.append(loc)
                elif key == "preferred_property_types":
                    # Append to preferred property types
                    for pt in value if isinstance(value, list) else [value]:
                        if pt not in self.preferred_property_types:
                            self.preferred_property_types.append(pt)
                elif hasattr(self, key):
                    setattr(self, key, value)
        
        self.last_updated = datetime.now().isoformat()
        return self
    
    def add_conversation_turn(self, role: str, content: str) -> 'ConversationState':
        """
        Add a conversation turn (maintains ChatGPT-style history).
        
        Args:
            role: "user" or "assistant"
            content: Message content
            
        Returns:
            Self for chaining
        """
        self.conversation_history.append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        })
        
        # Keep last 50 turns to prevent memory bloat
        if len(self.conversation_history) > 50:
            self.conversation_history = self.conversation_history[-50:]
        
        self.last_updated = datetime.now().isoformat()
        return self
    
    def get_conversation_history(self, last_n: Optional[int] = None) -> List[Dict[str, str]]:
        """
        Get conversation history for GPT-4 API.
        
        Args:
            last_n: Optional - get only last N turns
            
        Returns:
            List of conversation turns in GPT-4 format
        """
        history = self.conversation_history
        if last_n:
            history = history[-last_n:]
        
        # Return in GPT-4 format (without timestamp)
        return [{"role": h["role"], "content": h["content"]} for h in history]
    
    def update_search_results(self, results: List[Dict], query: str) -> 'ConversationState':
        """
        Update with latest search results.
        
        Args:
            results: List of property results
            query: Search query that generated these results
            
        Returns:
            Self for chaining
        """
        self.last_property_results = results
        self.last_query = query
        self.search_count += 1
        self.last_updated = datetime.now().isoformat()
        return self
    
    def get_active_filters(self) -> Dict[str, Any]:
        """
        Get all currently active filters (non-None values).
        
        Returns:
            Dictionary of active filters for MLS query
        """
        filters = {}
        
        # Core location
        if self.location:
            filters['location'] = self.location
        if self.community:
            filters['community'] = self.community
        if self.neighborhood:
            filters['neighborhood'] = self.neighborhood
        if self.postal_code:
            filters['postal_code'] = self.postal_code
        if self.street_name:
            filters['street_name'] = self.street_name
        
        # Property basics
        if self.bedrooms:
            filters['bedrooms'] = self.bedrooms
        if self.min_bedrooms:
            filters['min_bedrooms'] = self.min_bedrooms
        if self.max_bedrooms:
            filters['max_bedrooms'] = self.max_bedrooms
        if self.bedrooms_plus:
            filters['bedrooms_plus'] = self.bedrooms_plus
        if self.bathrooms:
            filters['bathrooms'] = self.bathrooms
        if self.min_bathrooms:
            filters['min_bathrooms'] = self.min_bathrooms
        if self.max_bathrooms:
            filters['max_bathrooms'] = self.max_bathrooms
        if self.property_type:
            filters['property_type'] = self.property_type
        if self.ownership_type:
            filters['ownership_type'] = self.ownership_type
        if self.property_style:
            filters['property_style'] = self.property_style
        
        # Price
        if self.price_range:
            if self.price_range[0]:
                filters['min_price'] = self.price_range[0]
            if self.price_range[1]:
                filters['max_price'] = self.price_range[1]
        
        # Transaction type
        if self.listing_type:
            filters['listing_type'] = self.listing_type
        
        # Size & lot
        if self.amenities:
            filters['amenities'] = self.amenities
        if self.sqft_range:
            if self.sqft_range[0]:
                filters['min_sqft'] = self.sqft_range[0]
            if self.sqft_range[1]:
                filters['max_sqft'] = self.sqft_range[1]
        if self.parking_spots:
            filters['parking_spots'] = self.parking_spots
        if self.garage_type:
            filters['garage_type'] = self.garage_type
        if self.lot_size:
            filters['lot_size'] = self.lot_size
        
        # Condo features
        if self.exposure:
            filters['exposure'] = self.exposure
        if self.balcony:
            filters['balcony'] = self.balcony
        if self.locker:
            filters['locker'] = self.locker
        
        # Dates
        if self.list_date_from:
            filters['list_date_from'] = self.list_date_from
        if self.list_date_to:
            filters['list_date_to'] = self.list_date_to
        
        # MLS & status
        if self.mls_number:
            filters['mls_number'] = self.mls_number
        if self.status:
            filters['status'] = self.status
        
        # Year built
        if self.year_built_min:
            filters['year_built_min'] = self.year_built_min
        if self.year_built_max:
            filters['year_built_max'] = self.year_built_max
        
        # Media
        if self.has_images is not None:
            filters['has_images'] = self.has_images
        if self.has_virtual_tour is not None:
            filters['has_virtual_tour'] = self.has_virtual_tour
        
        return filters
    
    def get_summary(self) -> str:
        """
        Get human-readable summary of current search criteria.
        
        Returns:
            Summary string
        """
        parts = []
        
        if self.bedrooms:
            parts.append(f"{self.bedrooms} bedroom")
        if self.bathrooms:
            parts.append(f"{self.bathrooms} bathroom")
        if self.property_type:
            parts.append(self.property_type)
        else:
            parts.append("properties")
        
        if self.location:
            parts.append(f"in {self.location}")
        
        if self.listing_type == "rent":
            parts.append("for rent")
        else:
            parts.append("for sale")
        
        if self.price_range:
            min_p, max_p = self.price_range
            if min_p and max_p:
                parts.append(f"${min_p:,} - ${max_p:,}")
            elif max_p:
                parts.append(f"under ${max_p:,}")
            elif min_p:
                parts.append(f"over ${min_p:,}")
        
        if self.amenities:
            parts.append(f"with {', '.join(self.amenities)}")
        
        if not parts:
            return "No search criteria set"
        
        return " ".join(parts)
    
    def reset(self) -> 'ConversationState':
        """
        Reset search filters while preserving conversation history.
        Use when user says "start over" or "new search".
        
        Returns:
            Self for chaining
        """
        # Core filters
        self.location = None
        self.community = None
        self.neighborhood = None
        self.postal_code = None
        self.street_name = None
        self.bedrooms = None
        self.min_bedrooms = None
        self.max_bedrooms = None
        self.bedrooms_plus = None
        self.bathrooms = None
        self.min_bathrooms = None
        self.max_bathrooms = None
        self.property_type = None
        self.ownership_type = None
        self.property_style = None
        self.price_range = None
        self.listing_type = "sale"
        
        # Advanced filters
        self.amenities = []
        self.sqft_range = None
        self.parking_spots = None
        self.garage_type = None
        self.lot_size = None
        
        # Condo features
        self.exposure = None
        self.balcony = None
        self.locker = None
        
        # Dates
        self.list_date_from = None
        self.list_date_to = None
        
        # MLS & status
        self.mls_number = None
        self.status = None
        
        # Year built
        self.year_built_min = None
        self.year_built_max = None
        
        # Media
        self.has_images = None
        self.has_virtual_tour = None
        
        # Results
        self.last_property_results = []
        self.last_query = None
        self.last_intent = None
        
        logger.info(f"Reset search filters for session {self.session_id}")
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for storage/serialization."""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationState':
        """Create ConversationState from dictionary."""
        # Handle price_range tuple
        if 'price_range' in data and data['price_range']:
            if isinstance(data['price_range'], list):
                data['price_range'] = tuple(data['price_range'])
        
        # Handle sqft_range tuple
        if 'sqft_range' in data and data['sqft_range']:
            if isinstance(data['sqft_range'], list):
                data['sqft_range'] = tuple(data['sqft_range'])
        
        return cls(**data)
    
    def clone(self) -> 'ConversationState':
        """Create a deep copy of this state."""
        return ConversationState.from_dict(deepcopy(self.to_dict()))


class ConversationStateManager:
    """
    Manages ConversationState instances for multiple users.
    Provides session persistence and retrieval.
    """
    
    def __init__(self, redis_client=None):
        """
        Initialize state manager.
        
        Args:
            redis_client: Optional Redis client for persistence
        """
        self.redis = redis_client
        self.memory_store: Dict[str, ConversationState] = {}
        logger.info("ConversationStateManager initialized")
    
    def get_or_create(self, session_id: str) -> ConversationState:
        """
        Get existing state or create new one.
        
        Args:
            session_id: Unique session identifier
            
        Returns:
            ConversationState instance
        """
        # Try Redis first
        if self.redis:
            try:
                state_json = self.redis.get(f"state:{session_id}")
                if state_json:
                    state_dict = json.loads(state_json)
                    state = ConversationState.from_dict(state_dict)
                    logger.info(f"✅ Loaded state from Redis for session {session_id}")
                    return state
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")
        
        # Check memory store
        if session_id in self.memory_store:
            logger.debug(f"Loaded state from memory for session {session_id}")
            return self.memory_store[session_id]
        
        # Create new state
        state = ConversationState(session_id=session_id)
        self.save(state)
        logger.info(f"🆕 Created new state for session {session_id}")
        return state
    
    def save(self, state: ConversationState) -> None:
        """
        Save state to storage.
        
        Args:
            state: ConversationState to save
        """
        session_id = state.session_id
        state.last_updated = datetime.now().isoformat()
        
        # Try Redis first
        if self.redis:
            try:
                state_json = json.dumps(state.to_dict())
                self.redis.setex(f"state:{session_id}", 86400 * 7, state_json)  # 7 days TTL
                logger.debug(f"Saved state to Redis for session {session_id}")
                return
            except Exception as e:
                logger.warning(f"Redis save failed: {e}")
        
        # Fallback to memory
        self.memory_store[session_id] = state
        logger.debug(f"Saved state to memory for session {session_id}")
    
    def delete(self, session_id: str) -> None:
        """
        Delete a session state.
        
        Args:
            session_id: Session to delete
        """
        if self.redis:
            try:
                self.redis.delete(f"state:{session_id}")
            except Exception as e:
                logger.warning(f"Redis delete failed: {e}")
        
        if session_id in self.memory_store:
            del self.memory_store[session_id]
        
        logger.info(f"Deleted state for session {session_id}")


# Global instance
conversation_state_manager = ConversationStateManager()


if __name__ == "__main__":
    # Test the conversation state
    print("🧪 Testing ConversationState...\n")
    
    # Test 1: Create and update state
    state = ConversationState(session_id="test123")
    print(f"1️⃣  Initial state: {state.get_summary()}")
    
    # Test 2: Update with location and property type
    state.update_from_dict({"location": "Toronto", "property_type": "condo"})
    print(f"2️⃣  After 'Find condos in Toronto': {state.get_summary()}")
    
    # Test 3: Add bedrooms (preserves previous)
    state.update_from_dict({"bedrooms": 2})
    print(f"3️⃣  After 'With 2 bedrooms': {state.get_summary()}")
    
    # Test 4: Change to rentals
    state.update_from_dict({"listing_type": "rent"})
    print(f"4️⃣  After 'Show rentals instead': {state.get_summary()}")
    
    # Test 5: Add amenities
    state.update_from_dict({"amenities": ["pool", "gym"]})
    print(f"5️⃣  After 'With pool and gym': {state.get_summary()}")
    
    # Test 6: Add price range
    state.update_from_dict({"price_range": (500000, 800000)})
    print(f"6️⃣  After 'Between 500k and 800k': {state.get_summary()}")
    
    # Test 7: Get active filters
    print(f"\n7️⃣  Active filters: {json.dumps(state.get_active_filters(), indent=2)}")
    
    # Test 8: Conversation history
    state.add_conversation_turn("user", "Find condos in Toronto")
    state.add_conversation_turn("assistant", "I found 15 condos in Toronto")
    state.add_conversation_turn("user", "Show me the ones with 2 bedrooms")
    print(f"\n8️⃣  Conversation history: {len(state.conversation_history)} turns")
    
    # Test 9: State persistence
    manager = ConversationStateManager()
    manager.save(state)
    loaded_state = manager.get_or_create("test123")
    print(f"\n9️⃣  Loaded state: {loaded_state.get_summary()}")
    
    print("\n✅ All tests passed!")
