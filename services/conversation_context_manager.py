"""
Conversation Context Manager
Manages persistent conversation state across sessions for personalized interactions
"""
import json
import re
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class ConversationContextManager:
    """
    Manages persistent conversation state across sessions.
    
    Features:
    - Conversation history tracking
    - User preference extraction
    - Search history
    - Behavioral signal tracking
    - Next-question prediction
    - Context-aware responses
    """
    
    def __init__(self, redis_client=None, ttl_days: int = 30):
        """
        Initialize with optional Redis for production.
        Falls back to in-memory dict for development.
        
        Args:
            redis_client: Optional Redis client for production
            ttl_days: Session time-to-live in days
        """
        self.redis = redis_client
        self.memory_store = {}  # Fallback for development
        self.ttl_seconds = ttl_days * 24 * 60 * 60
        
        logger.info(
            f"ConversationContextManager initialized "
            f"(storage: {'Redis' if redis_client else 'Memory'})"
        )
    
    def get_or_create_session(self, user_id: str) -> Dict:
        """
        Get existing session or create new one
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Session dictionary with conversation state
        """
        session_key = f"session:{user_id}"
        
        # Try Redis first
        if self.redis:
            try:
                session_json = self.redis.get(session_key)
                if session_json:
                    session = json.loads(session_json)
                    logger.info(f"✅ Loaded session for user {user_id}")
                    return session
            except Exception as e:
                logger.warning(f"Redis get failed: {e}, falling back to memory")
        
        # Fallback to memory store
        if session_key in self.memory_store:
            logger.debug(f"Loaded session from memory: {user_id}")
            return self.memory_store[session_key]
        
        # Create new session
        session = self._create_new_session(user_id)
        self._save_session(user_id, session)
        logger.info(f"🆕 Created new session for user {user_id}")
        return session
    
    def _create_new_session(self, user_id: str) -> Dict:
        """
        Create new session structure
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            New session dictionary
        """
        return {
            'user_id': user_id,
            'created_at': datetime.now().isoformat(),
            'last_updated': datetime.now().isoformat(),
            'conversation_history': [],
            'search_history': [],
            'preferences': {
                'locations': [],
                'property_types': [],
                'price_ranges': [],
                'bedrooms_ranges': [],
                'investor': False,
                'first_time_buyer': None,
                'timeline': None,
                'features': []  # pool, garage, etc.
            },
            'current_context': {
                'last_search_query': None,
                'last_search_results': [],
                'currently_viewing_property': None,
                'comparison_list': [],
                'last_intent': None
            },
            'behavioral_signals': {
                'engagement_level': 0,  # 0-10
                'search_count': 0,
                'property_views_count': 0,
                'time_in_app_minutes': 0,
                'last_interaction': datetime.now().isoformat(),
                'session_count': 1
            },
            'metadata': {
                'version': '2.0',
                'source': 'conversation_context_manager'
            }
        }
    
    def _save_session(self, user_id: str, session: Dict) -> None:
        """
        Save session to storage
        
        Args:
            user_id: Unique user identifier
            session: Session dictionary to save
        """
        session_key = f"session:{user_id}"
        session['last_updated'] = datetime.now().isoformat()
        
        # Try Redis first
        if self.redis:
            try:
                self.redis.setex(
                    session_key,
                    self.ttl_seconds,
                    json.dumps(session)
                )
                logger.debug(f"Saved session to Redis: {user_id}")
                return
            except Exception as e:
                logger.warning(f"Redis save failed: {e}, saving to memory")
        
        # Fallback to memory
        self.memory_store[session_key] = session
        logger.debug(f"Saved session to memory: {user_id}")
    
    def add_to_conversation(
        self, 
        user_id: str, 
        message: str, 
        sender: str,
        intent: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> None:
        """
        Add message to conversation history with metadata
        
        Args:
            user_id: Unique user identifier
            message: Message content
            sender: 'user' or 'assistant'
            intent: Optional intent classification (search, question, feedback)
            metadata: Optional additional metadata
        """
        session = self.get_or_create_session(user_id)
        
        conversation_entry = {
            'timestamp': datetime.now().isoformat(),
            'sender': sender,
            'message': message,
            'intent': intent,
            'tokens': len(message.split()),
            'metadata': metadata or {}
        }
        
        session['conversation_history'].append(conversation_entry)
        
        # Keep only last 50 messages to avoid bloat
        if len(session['conversation_history']) > 50:
            session['conversation_history'] = session['conversation_history'][-50:]
        
        # Update engagement
        if sender == 'user':
            self._update_engagement_level(session)
        
        self._save_session(user_id, session)
        logger.debug(f"Added {sender} message to conversation: {message[:50]}...")
    
    def update_search_context(
        self, 
        user_id: str, 
        query: str, 
        results: List[Dict],
        filters: Optional[Dict] = None
    ) -> None:
        """
        Update context with latest search
        
        Args:
            user_id: Unique user identifier
            query: Search query string
            results: List of property results
            filters: Optional search filters used
        """
        session = self.get_or_create_session(user_id)
        
        search_entry = {
            'timestamp': datetime.now().isoformat(),
            'query': query,
            'result_count': len(results),
            'property_ids': [r.get('id') for r in results[:10]],
            'filters': filters or {}
        }
        
        session['search_history'].append(search_entry)
        
        # Keep only last 20 searches
        if len(session['search_history']) > 20:
            session['search_history'] = session['search_history'][-20:]
        
        session['current_context']['last_search_query'] = query
        session['current_context']['last_search_results'] = results[:10]
        session['behavioral_signals']['search_count'] += 1
        
        # Extract preferences from search
        self._extract_preferences_from_search(session, query, filters)
        
        self._save_session(user_id, session)
        logger.info(f"Updated search context: {query} ({len(results)} results)")
    
    def update_property_view(
        self, 
        user_id: str, 
        property_id: str,
        property_data: Optional[Dict] = None
    ) -> None:
        """
        Track when user views a property
        
        Args:
            user_id: Unique user identifier
            property_id: Property identifier
            property_data: Optional property details
        """
        session = self.get_or_create_session(user_id)
        
        session['current_context']['currently_viewing_property'] = {
            'id': property_id,
            'viewed_at': datetime.now().isoformat(),
            'data': property_data
        }
        
        session['behavioral_signals']['property_views_count'] += 1
        
        self._save_session(user_id, session)
        logger.info(f"User {user_id} viewing property {property_id}")
    
    def add_to_comparison(self, user_id: str, property_id: str) -> None:
        """
        Add property to comparison list
        
        Args:
            user_id: Unique user identifier
            property_id: Property identifier
        """
        session = self.get_or_create_session(user_id)
        
        if property_id not in session['current_context']['comparison_list']:
            session['current_context']['comparison_list'].append(property_id)
        
        # Limit to 5 properties
        if len(session['current_context']['comparison_list']) > 5:
            session['current_context']['comparison_list'] = \
                session['current_context']['comparison_list'][-5:]
        
        self._save_session(user_id, session)
    
    def extract_preferences_from_conversation(self, user_id: str) -> Dict:
        """
        Extract user preferences from conversation history
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Dictionary of extracted preferences
        """
        session = self.get_or_create_session(user_id)
        history = session['conversation_history']
        
        preferences = session['preferences'].copy()
        
        # Get all user messages
        user_messages = [
            m['message'].lower() 
            for m in history 
            if m['sender'] == 'user'
        ]
        all_messages = ' '.join(user_messages)
        
        # Extract location preferences
        preferences['locations'] = self._extract_locations(all_messages)
        
        # Extract property type preferences
        preferences['property_types'] = self._extract_property_types(all_messages)
        
        # Extract price preferences
        preferences['price_ranges'] = self._extract_price_ranges(all_messages)
        
        # Extract bedroom preferences (prioritize most recent)
        preferences['bedrooms_ranges'] = self._extract_bedroom_ranges_latest(user_messages)
        
        # Extract investor signals
        preferences['investor'] = self._detect_investor_intent(all_messages)
        
        # Extract first-time buyer signals
        preferences['first_time_buyer'] = self._detect_first_time_buyer(all_messages)
        
        # Extract timeline
        preferences['timeline'] = self._extract_timeline(all_messages)
        
        # Extract desired features
        preferences['features'] = self._extract_features(all_messages)
        
        # Update session with extracted preferences
        session['preferences'] = preferences
        self._save_session(user_id, session)
        
        return preferences
    
    def _extract_locations(self, text: str) -> List[str]:
        """Extract location preferences from text"""
        location_keywords = {
            'mississauga': 'Mississauga',
            'markham': 'Markham',
            'toronto': 'Toronto',
            'vaughan': 'Vaughan',
            'brampton': 'Brampton',
            'oakville': 'Oakville',
            'burlington': 'Burlington',
            'richmond hill': 'Richmond Hill',
            'ajax': 'Ajax',
            'pickering': 'Pickering',
            'oshawa': 'Oshawa',
            'whitby': 'Whitby',
            'hamilton': 'Hamilton',
            'kitchener': 'Kitchener',
            'waterloo': 'Waterloo',
            'guelph': 'Guelph',
            'cambridge': 'Cambridge',
            'milton': 'Milton'
        }
        
        found_locations = []
        for keyword, city in location_keywords.items():
            if keyword in text:
                found_locations.append(city)
        
        return list(set(found_locations))
    
    def _extract_property_types(self, text: str) -> List[str]:
        """Extract property type preferences"""
        types = []
        
        if any(word in text for word in ['condo', 'condominium', 'apartment']):
            types.append('condo')
        if any(word in text for word in ['house', 'detached', 'single family']):
            types.append('detached')
        if any(word in text for word in ['townhouse', 'townhome', 'town house']):
            types.append('townhouse')
        if any(word in text for word in ['semi-detached', 'semi detached']):
            types.append('semi-detached')
        
        return list(set(types))
    
    def _extract_price_ranges(self, text: str) -> List[Dict]:
        """Extract price range preferences"""
        ranges = []
        
        # Look for price patterns like "$500k-$800k" or "under 1 million"
        price_pattern = r'\$?(\d+)[kK]?\s*(?:to|-|–)\s*\$?(\d+)[kKmM]?'
        matches = re.findall(price_pattern, text)
        
        for match in matches:
            min_val = int(match[0]) * 1000
            max_val = int(match[1])
            if max_val < 1000:  # Assume millions if < 1000
                max_val *= 1000000
            elif max_val < 10000:  # Assume thousands if < 10000
                max_val *= 1000
            
            ranges.append({'min': min_val, 'max': max_val})
        
        # Look for "under X" or "below X" with unit
        under_pattern = r'(?:under|below|less than)\s*\$?(\d+\.?\d*)\s*([kKmM])?'
        under_matches = re.findall(under_pattern, text.lower())
        
        for match in under_matches:
            value = float(match[0])
            unit = match[1].lower() if match[1] else ''
            
            if unit == 'k':
                max_val = int(value * 1000)
            elif unit == 'm':
                max_val = int(value * 1000000)
            elif value >= 100000:  # Raw number >= 100k, assume it's already in dollars
                max_val = int(value)
            elif value >= 100:  # Number like 750, assume thousands
                max_val = int(value * 1000)
            else:  # Small number, assume millions
                max_val = int(value * 1000000)
            
            ranges.append({'min': 0, 'max': max_val})
        
        return ranges
    
    def _extract_bedroom_ranges(self, text: str) -> List[int]:
        """Extract bedroom preferences"""
        bedrooms = []
        
        # Look for patterns like "3 bedroom", "3-bedroom", "3 bed", "3br"
        # The -? allows for optional hyphen between number and word
        bedroom_pattern = r'(\d+)\s*-?\s*(?:bedroom|bed|br|bdrm)s?'
        matches = re.findall(bedroom_pattern, text)
        
        for match in matches:
            bedrooms.append(int(match))
        
        return list(set(bedrooms))
    
    def _extract_bedroom_ranges_latest(self, messages: List[str]) -> List[int]:
        """
        Extract bedroom preferences, prioritizing the most recent mention
        
        Args:
            messages: List of user messages in chronological order
            
        Returns:
            List with the most recently mentioned bedroom count, or empty list
        """
        # Look for patterns like "3 bedroom", "3-bedroom", "3 bed", "3br"
        bedroom_pattern = r'(\d+)\s*-?\s*(?:bedroom|bed|br|bdrm)s?'
        
        # Search messages in reverse order (most recent first)
        for message in reversed(messages):
            matches = re.findall(bedroom_pattern, message)
            if matches:
                # Return only the most recent bedroom count
                return [int(matches[-1])]  # Use last match in the message
        
        return []
    
    def _detect_investor_intent(self, text: str) -> bool:
        """Detect if user is an investor"""
        investor_keywords = [
            'roi', 'return on investment', 'investment', 'rental', 'cash flow',
            'cashflow', 'rental income', 'cap rate', 'yield', 'appreciation',
            'tenant', 'rental property', 'investment property', 'portfolio'
        ]
        
        return any(keyword in text for keyword in investor_keywords)
    
    def _detect_first_time_buyer(self, text: str) -> Optional[bool]:
        """Detect if user is a first-time buyer"""
        first_time_keywords = [
            'first time', 'first-time', 'first home', 'new buyer',
            'starting out', 'never bought', 'buying for the first time'
        ]
        
        if any(keyword in text for keyword in first_time_keywords):
            return True
        
        return None
    
    def _extract_timeline(self, text: str) -> Optional[str]:
        """Extract buying timeline"""
        if any(word in text for word in ['urgent', 'asap', 'immediately', 'now']):
            return 'urgent'
        elif any(word in text for word in ['soon', 'next few months', 'within']):
            return 'soon'
        elif any(word in text for word in ['exploring', 'looking', 'researching']):
            return 'exploring'
        
        return None
    
    def _extract_features(self, text: str) -> List[str]:
        """Extract desired property features"""
        features = []
        
        feature_keywords = {
            'pool': ['pool', 'swimming'],
            'garage': ['garage', 'parking'],
            'backyard': ['backyard', 'yard', 'garden'],
            'basement': ['basement', 'finished basement'],
            'renovated': ['renovated', 'updated', 'modern'],
            'waterfront': ['waterfront', 'water view', 'lakefront']
        }
        
        for feature, keywords in feature_keywords.items():
            if any(keyword in text for keyword in keywords):
                features.append(feature)
        
        return list(set(features))
    
    def _extract_preferences_from_search(
        self, 
        session: Dict, 
        query: str,
        filters: Optional[Dict]
    ) -> None:
        """Extract preferences from search filters"""
        if not filters:
            return
        
        preferences = session['preferences']
        
        # Extract from filters
        if 'min_price' in filters and 'max_price' in filters:
            price_range = {
                'min': filters['min_price'],
                'max': filters['max_price']
            }
            if price_range not in preferences['price_ranges']:
                preferences['price_ranges'].append(price_range)
        
        if 'bedrooms' in filters:
            bedrooms = filters['bedrooms']
            if bedrooms not in preferences['bedrooms_ranges']:
                preferences['bedrooms_ranges'].append(bedrooms)
        
        if 'property_type' in filters:
            prop_type = filters['property_type']
            if prop_type not in preferences['property_types']:
                preferences['property_types'].append(prop_type)
    
    def _update_engagement_level(self, session: Dict) -> None:
        """Update user engagement level based on activity"""
        signals = session['behavioral_signals']
        
        # Calculate engagement score (0-10)
        score = 0
        
        # More searches = more engaged
        if signals['search_count'] > 0:
            score += min(2, signals['search_count'] / 2)
        
        # More property views = more engaged
        if signals['property_views_count'] > 0:
            score += min(3, signals['property_views_count'] / 2)
        
        # Longer conversation = more engaged
        conv_length = len(session['conversation_history'])
        score += min(2, conv_length / 10)
        
        # Has comparison list = highly engaged
        if session['current_context']['comparison_list']:
            score += 2
        
        # Recently active = more engaged
        last_interaction = datetime.fromisoformat(signals['last_interaction'])
        hours_since = (datetime.now() - last_interaction).total_seconds() / 3600
        if hours_since < 24:
            score += 1
        
        signals['engagement_level'] = min(10, int(score))
        signals['last_interaction'] = datetime.now().isoformat()
    
    def predict_next_questions(self, user_id: str) -> List[str]:
        """
        Predict what user might ask next
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            List of predicted questions
        """
        session = self.get_or_create_session(user_id)
        predictions = []
        
        # If they just viewed a property
        if session['current_context']['currently_viewing_property']:
            predictions.extend([
                "Tell me more about this neighborhood",
                "What's the investment potential?",
                "Show me similar properties",
                "What are the nearby amenities?"
            ])
        
        # If they did a search
        elif session['current_context']['last_search_results']:
            predictions.extend([
                "Show me more properties",
                "Can you adjust the price range?",
                "Show me properties in a different area",
                "Filter by number of bedrooms"
            ])
        
        # If highly engaged
        elif session['behavioral_signals']['engagement_level'] > 7:
            predictions.extend([
                "Connect me with a broker",
                "I'm ready to schedule a viewing",
                "How do I make an offer?",
                "What's the next step?"
            ])
        
        # If they have comparison list
        elif session['current_context']['comparison_list']:
            predictions.append("Help me compare these properties")
        
        # If first-time buyer
        elif session['preferences'].get('first_time_buyer'):
            predictions.extend([
                "What's the buying process?",
                "How much do I need for a down payment?",
                "Explain closing costs"
            ])
        
        # If investor
        elif session['preferences'].get('investor'):
            predictions.extend([
                "Show me properties with high ROI",
                "What are the rental rates in this area?",
                "Calculate cash flow potential"
            ])
        
        # Default early-stage questions
        else:
            predictions.extend([
                "Tell me about Toronto real estate",
                "What's my budget?",
                "Show me popular neighborhoods"
            ])
        
        return predictions[:4]  # Return top 4 predictions
    
    def generate_conversation_summary(self, user_id: str) -> str:
        """
        Generate summary for AI to use in responses
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Formatted summary string
        """
        session = self.get_or_create_session(user_id)
        preferences = self.extract_preferences_from_conversation(user_id)
        
        summary_parts = []
        
        # What we know about them
        if preferences['locations']:
            locations_str = ', '.join(preferences['locations'][:3])
            summary_parts.append(f"Interested in: {locations_str}")
        
        if preferences['property_types']:
            types_str = ', '.join(preferences['property_types'])
            summary_parts.append(f"Property types: {types_str}")
        
        if preferences['price_ranges']:
            latest_range = preferences['price_ranges'][-1]
            summary_parts.append(
                f"Budget: ${latest_range.get('min', 0):,} - ${latest_range.get('max', 0):,}"
            )
        
        if preferences['bedrooms_ranges']:
            bedrooms = preferences['bedrooms_ranges'][-1]
            summary_parts.append(f"{bedrooms} bedrooms")
        
        if preferences['investor']:
            summary_parts.append("🎯 Looking for investment properties")
        
        if preferences['first_time_buyer']:
            summary_parts.append("🏠 First-time home buyer")
        
        if preferences['timeline']:
            summary_parts.append(f"Timeline: {preferences['timeline']}")
        
        # Recent activity
        if session['search_history']:
            last_search = session['search_history'][-1]
            summary_parts.append(f"Last searched: {last_search['query']}")
        
        # Engagement level
        engagement_level = session['behavioral_signals']['engagement_level']
        if engagement_level > 7:
            summary_parts.append("⚡ Highly engaged - ready for next steps")
        elif engagement_level > 4:
            summary_parts.append("👍 Actively exploring options")
        else:
            summary_parts.append("🔍 Early exploration phase")
        
        return " | ".join(summary_parts) if summary_parts else "New conversation"
    
    def should_proactively_suggest(self, user_id: str) -> bool:
        """
        Determine if we should proactively suggest properties
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            True if should suggest proactively
        """
        session = self.get_or_create_session(user_id)
        
        # Suggest if:
        # 1. User has engaged (viewed 3+ properties OR done 2+ searches)
        # 2. Has clear preferences (location + price range)
        # 3. Hasn't received suggestion in last hour
        
        signals = session['behavioral_signals']
        preferences = session['preferences']
        
        # Check engagement
        if signals['property_views_count'] < 3 and signals['search_count'] < 2:
            return False
        
        # Check preferences
        if not preferences['locations']:
            return False
        
        # Check recency (simplified - in production, track last_suggestion_time)
        return True
    
    def get_context_for_ai(self, user_id: str) -> Dict:
        """
        Get formatted context for AI prompt
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Dictionary with context for AI
        """
        session = self.get_or_create_session(user_id)
        preferences = self.extract_preferences_from_conversation(user_id)
        
        # Get recent conversation (last 5 exchanges)
        recent_history = session['conversation_history'][-10:]
        conversation_text = []
        for msg in recent_history:
            sender = "User" if msg['sender'] == 'user' else "Assistant"
            conversation_text.append(f"{sender}: {msg['message']}")
        
        return {
            'summary': self.generate_conversation_summary(user_id),
            'preferences': preferences,
            'recent_conversation': '\n'.join(conversation_text),
            'engagement_level': session['behavioral_signals']['engagement_level'],
            'last_search': session['current_context'].get('last_search_query'),
            'viewing_property': session['current_context'].get('currently_viewing_property'),
            'predicted_questions': self.predict_next_questions(user_id)
        }
    
    def get_session_stats(self, user_id: str) -> Dict:
        """
        Get session statistics for analytics
        
        Args:
            user_id: Unique user identifier
            
        Returns:
            Dictionary with session statistics
        """
        session = self.get_or_create_session(user_id)
        
        return {
            'user_id': user_id,
            'created_at': session['created_at'],
            'last_updated': session['last_updated'],
            'conversation_length': len(session['conversation_history']),
            'search_count': session['behavioral_signals']['search_count'],
            'property_views': session['behavioral_signals']['property_views_count'],
            'engagement_level': session['behavioral_signals']['engagement_level'],
            'has_preferences': bool(
                session['preferences']['locations'] or 
                session['preferences']['property_types']
            ),
            'comparison_list_size': len(session['current_context']['comparison_list'])
        }


# Global instance
context_manager = ConversationContextManager()
