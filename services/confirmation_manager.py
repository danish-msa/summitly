"""
confirmation_manager.py

Robust confirmation management system with race condition handling,
timeouts, and UUID-based confirmation tracking.

This module prevents confirmation race conditions by:
1. Explicit pending confirmation objects with UUIDs
2. Timeout-based expiration (default 1 hour)
3. Routing confirmation responses before normal intent classification
4. Redis-based storage with TTL
5. Clear, atomic state update logic

Core Features:
- Create confirmations with specific types
- Get pending confirmations
- Apply confirmation responses with atomic state updates
- Auto-expire old confirmations
- Detect confirmation responses
"""

import uuid
import logging
import json
import re
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
from collections import Counter

logger = logging.getLogger(__name__)

# Metrics counters
CONFIRMATION_METRICS = Counter()


class ConfirmationType(Enum):
    """Types of confirmations."""
    LOCATION_CHANGE = "location_change"
    PROPERTY_REFINEMENT = "property_refinement"
    REQUIREMENTS_NEEDED = "requirements_needed"
    POSTAL_CODE_CLARIFICATION = "postal_code_clarification"
    
    # Legacy types (for backwards compatibility)
    FILTER_CHANGE = "filter_change"
    PROPERTY_SELECTION = "property_selection"
    SEARCH_REFINEMENT = "search_refinement"
    LOCATION_DISAMBIGUATION = "location_disambiguation"
    VAGUE_REQUEST = "vague_request"
    POSTAL_CODE_CITY = "postal_code_city"


class ConfirmationStatus(Enum):
    """Status of confirmation."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    SUPERSEDED = "superseded"



@dataclass
class PendingConfirmation:
    """
    Represents a pending confirmation request.
    
    Attributes:
        confirmation_id: Unique identifier (UUID) for this confirmation
        session_id: Associated session identifier
        type: Type of confirmation (location_change, property_refinement, etc.)
        question: The question asked to the user
        payload: Additional context data needed to apply the confirmation
        created_at: Timestamp when confirmation was created
        expires_at: When confirmation expires (default 1 hour)
        status: Current status (pending, accepted, rejected, expired)
    """
    confirmation_id: str
    session_id: str
    type: ConfirmationType
    question: str
    payload: Dict[str, Any]
    created_at: datetime
    expires_at: datetime
    status: ConfirmationStatus = ConfirmationStatus.PENDING
    
    def is_expired(self) -> bool:
        """Check if confirmation has expired."""
        return datetime.utcnow() > self.expires_at
    
    def is_active(self) -> bool:
        """Check if confirmation is still active (pending and not expired)."""
        return self.status == ConfirmationStatus.PENDING and not self.is_expired()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        data = asdict(self)
        data['type'] = self.type.value
        data['status'] = self.status.value
        data['created_at'] = self.created_at.isoformat()
        data['expires_at'] = self.expires_at.isoformat()
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PendingConfirmation':
        """Create from dictionary."""
        data = data.copy()
        data['type'] = ConfirmationType(data['type'])
        data['status'] = ConfirmationStatus(data['status'])
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['expires_at'] = datetime.fromisoformat(data['expires_at'])
        return cls(**data)


@dataclass
class ConfirmationResult:
    """
    Result of applying a confirmation response.
    
    Attributes:
        success: Whether the confirmation was successfully processed
        state_update: Dictionary of state updates to apply
        next_action: What action to take next ('search', 'ask_requirements', 'continue', etc.)
        applied: Whether state was actually modified
        error: Error message if success=False
        metadata: Additional info about the confirmation
    """
    success: bool
    state_update: Dict[str, Any] = field(default_factory=dict)
    next_action: str = "continue"
    applied: bool = False
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


# Confirmation tokens - Now imported from shared module (single source of truth)
from services.confirmation_tokens import (
    POSITIVE_TOKENS, NEGATIVE_TOKENS, SKIP_TOKENS,
    is_positive_response, is_negative_response, is_skip_response,
    normalize_message
)


class ConfirmationManager:
    """
    Manages pending confirmations with clear, simple logic.
    
    Features:
    - UUID-based confirmation tracking
    - Redis storage with 1-hour TTL
    - Atomic state updates
    - Clear YES/NO/OTHER response detection
    - Type-specific application logic
    """
    
    def __init__(self, default_timeout_seconds: int = 3600, redis_client=None):
        """
        Initialize confirmation manager.
        
        Args:
            default_timeout_seconds: Default timeout for confirmations (default: 1 hour)
            redis_client: Optional Redis client for persistent storage
        """
        self.default_timeout = default_timeout_seconds
        self.redis_client = redis_client
        
        # In-memory storage (fallback if no Redis)
        self._confirmations: Dict[str, PendingConfirmation] = {}
        self._confirmation_history: List[PendingConfirmation] = []
        self._max_history = 1000
        
        logger.info(f"[CONFIRMATION_MANAGER] Initialized with {default_timeout_seconds}s timeout")
    
    def create_confirmation(
        self,
        session_id: str,
        confirmation_type: ConfirmationType,
        question: str,
        payload: Dict[str, Any],
        timeout_seconds: Optional[int] = None
    ) -> str:
        """
        Create a new pending confirmation.
        
        Args:
            session_id: Session identifier
            confirmation_type: Type of confirmation
            question: Question to ask the user
            payload: Context data needed to apply confirmation
            timeout_seconds: Custom timeout (default: 1 hour)
            
        Returns:
            confirmation_id: UUID string of created confirmation
        """
        timeout = timeout_seconds if timeout_seconds is not None else self.default_timeout
        confirmation_id = str(uuid.uuid4())
        
        confirmation = PendingConfirmation(
            confirmation_id=confirmation_id,
            session_id=session_id,
            type=confirmation_type,
            question=question,
            payload=payload,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=timeout),
            status=ConfirmationStatus.PENDING
        )
        
        # Store in memory
        confirmation_key = f"{session_id}:confirmation"
        self._confirmations[confirmation_key] = confirmation
        
        # Store in Redis if available (with TTL)
        if self.redis_client:
            try:
                redis_key = f"confirmation:{session_id}"
                self.redis_client.setex(
                    redis_key,
                    timeout,
                    json.dumps(confirmation.to_dict())
                )
                logger.info(f"[CONFIRMATION] Stored in Redis: {redis_key}")
            except Exception as e:
                logger.warning(f"[CONFIRMATION] Redis storage failed: {e}")
        
        # Metrics
        CONFIRMATION_METRICS['created'] += 1
        CONFIRMATION_METRICS[f'created_{confirmation_type.value}'] += 1
        
        logger.info(
            f"[CONFIRMATION] Created: {confirmation_id[:8]} "
            f"type={confirmation_type.value} session={session_id[:8]} "
            f"expires_at={confirmation.expires_at.isoformat()}"
        )
        
        return confirmation_id
    
    def get_pending_confirmation(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get pending confirmation for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Full confirmation dictionary or None
        """
        confirmation_key = f"{session_id}:confirmation"
        
        # Try memory first
        confirmation = self._confirmations.get(confirmation_key)
        
        # Try Redis if not in memory
        if not confirmation and self.redis_client:
            try:
                redis_key = f"confirmation:{session_id}"
                data = self.redis_client.get(redis_key)
                if data:
                    confirmation = PendingConfirmation.from_dict(json.loads(data))
                    # Cache in memory
                    self._confirmations[confirmation_key] = confirmation
            except Exception as e:
                logger.warning(f"[CONFIRMATION] Redis retrieval failed: {e}")
        
        if not confirmation:
            return None
        
        # Auto-expire old confirmations
        if confirmation.is_expired():
            logger.info(f"[CONFIRMATION] Expired: {confirmation.confirmation_id[:8]}")
            self._delete_confirmation(session_id)
            CONFIRMATION_METRICS['expired'] += 1
            return None
        
        if confirmation.status != ConfirmationStatus.PENDING:
            logger.info(
                f"[CONFIRMATION] Not pending: {confirmation.confirmation_id[:8]} "
                f"status={confirmation.status.value}"
            )
            return None
        
        return confirmation.to_dict()
    
    def get_active_confirmation(self, session_id: str) -> Optional[PendingConfirmation]:
        """
        Get active confirmation object (for backwards compatibility).
        
        Args:
            session_id: Session identifier
            
        Returns:
            PendingConfirmation object or None
        """
        pending_dict = self.get_pending_confirmation(session_id)
        if pending_dict:
            return PendingConfirmation.from_dict(pending_dict)
        return None
    
    def has_pending_confirmation(self, session_id: str) -> bool:
        """
        Check if session has a pending confirmation.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if pending confirmation exists
        """
        return self.get_pending_confirmation(session_id) is not None
    
    def is_confirmation_response(
        self, 
        message: str, 
        pending_confirmation: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Check if message is a response to a specific confirmation type.
        
        CRITICAL: Only treat "yes/no" as valid for LOCATION_CHANGE and FILTER_CHANGE.
        For VAGUE_REQUEST, require semantic confirmation (referencing subject).
        
        Args:
            message: User message
            pending_confirmation: The pending confirmation context (optional)
            
        Returns:
            True if message appears to be a confirmation response
        """
        clean_message = message.lower().strip().rstrip('.!?')
        words = clean_message.split()
        
        if not words:
            return False
        
        # Strip punctuation from first word for token matching
        first_word = words[0].strip(',.!?;:')
        
        # Get confirmation type if available
        conf_type = None
        if pending_confirmation:
            conf_type = pending_confirmation.get('type')
        
        # GUARD: For VAGUE_REQUEST, plain "yes/no" is NOT valid
        # User must reference the subject (e.g., "filters", "budget", "location")
        if conf_type == ConfirmationType.VAGUE_REQUEST.value:
            if first_word in POSITIVE_TOKENS or first_word in NEGATIVE_TOKENS:
                # Check if message contains semantic context
                semantic_keywords = [
                    'filter', 'budget', 'location', 'price', 'bedroom', 
                    'bathroom', 'property', 'search', 'criteria', 'requirement'
                ]
                has_semantic_context = any(keyword in clean_message for keyword in semantic_keywords)
                if not has_semantic_context:
                    # Plain yes/no without context - let normal pipeline handle it
                    return False
                else:
                    # Has semantic context - valid confirmation response
                    return True
        
        # Check for simple YES/NO responses
        # Only valid for LOCATION_CHANGE, FILTER_CHANGE, and other explicit confirmation types
        if first_word in POSITIVE_TOKENS or first_word in NEGATIVE_TOKENS:
            # Allow yes/no for specific confirmation types
            allowed_types = [
                ConfirmationType.LOCATION_CHANGE.value,
                ConfirmationType.FILTER_CHANGE.value,
                ConfirmationType.PROPERTY_REFINEMENT.value,
                ConfirmationType.POSTAL_CODE_CLARIFICATION.value,
                ConfirmationType.REQUIREMENTS_NEEDED.value,
                ConfirmationType.LOCATION_DISAMBIGUATION.value,
                ConfirmationType.POSTAL_CODE_CITY.value,
            ]
            # If we have confirmation type context, only allow if it's in allowed list
            if conf_type and conf_type not in allowed_types:
                return False
            # If no confirmation type provided, assume it's valid (backwards compatibility)
            return True
        
        # Check for skip tokens
        if first_word in SKIP_TOKENS:
            return True
        
        # Short messages (1-3 words) starting with confirmation tokens
        if len(words) <= 3 and (first_word in POSITIVE_TOKENS or first_word in NEGATIVE_TOKENS):
            return True
        
        # If we have context about the confirmation type, check for relevant patterns
        if pending_confirmation:
            if conf_type == ConfirmationType.REQUIREMENTS_NEEDED.value:
                # Anything could be requirements, so be permissive
                return True
            
            if conf_type == ConfirmationType.LOCATION_CHANGE.value:
                # Check if it contains location-like content
                location_patterns = [
                    r'\b(in|at|near|around)\b',
                    r'\b(city|town|area|neighborhood|street|avenue|road)\b',
                    r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b'  # Capitalized names
                ]
                for pattern in location_patterns:
                    if re.search(pattern, message, re.IGNORECASE):
                        return True
        
        return False
    
    def apply_confirmation(
        self, 
        session_id: str, 
        response: str,
        state: Optional[Any] = None
    ) -> ConfirmationResult:
        """
        Apply a confirmation response with atomic state updates.
        
        This is the main method that handles all confirmation logic:
        1. Get pending confirmation
        2. Parse response (YES/NO/OTHER)
        3. Extract data from response if needed
        4. Apply to state based on type
        5. Delete confirmation
        6. Return result with state updates
        
        Args:
            session_id: Session identifier
            response: User's response message
            state: Optional state object to update directly
            
        Returns:
            ConfirmationResult with success, state_update, next_action
        """
        # Get pending confirmation
        pending = self.get_pending_confirmation(session_id)
        
        if not pending:
            logger.warning(f"[CONFIRMATION] No pending confirmation for session={session_id[:8]}")
            return ConfirmationResult(
                success=False,
                error="No pending confirmation"
            )
        
        conf_id = pending['confirmation_id']
        conf_type = ConfirmationType(pending['type'])
        payload = pending['payload']
        
        logger.info(
            f"[CONFIRMATION] Applying: {conf_id[:8]} "
            f"type={conf_type.value} response='{response[:50]}'"
        )
        
        # Parse response
        clean_response = response.lower().strip().rstrip('.!?')
        words = clean_response.split()
        # CRITICAL: Strip punctuation from first word before token matching
        # WHY: Button text like "Yes, switch locations" has comma after "yes"
        first_word = words[0].strip(',.!?;:') if words else ''
        
        # Determine response type
        is_yes = first_word in POSITIVE_TOKENS
        is_no = first_word in NEGATIVE_TOKENS
        is_skip = first_word in SKIP_TOKENS
        
        logger.info(f"[CONFIRMATION] Parsed response: first_word='{first_word}', is_yes={is_yes}, is_no={is_no}")
        
        # Apply based on confirmation type
        result = None
        
        try:
            if conf_type == ConfirmationType.LOCATION_CHANGE:
                result = self._apply_location_change(is_yes, is_no, response, payload, state)
            
            elif conf_type == ConfirmationType.PROPERTY_REFINEMENT:
                result = self._apply_property_refinement(is_yes, is_no, response, payload, state)
            
            elif conf_type == ConfirmationType.REQUIREMENTS_NEEDED:
                result = self._apply_requirements_needed(is_yes, is_no, is_skip, response, payload, state)
            
            elif conf_type == ConfirmationType.POSTAL_CODE_CLARIFICATION:
                result = self._apply_postal_code_clarification(is_yes, is_no, response, payload, state)
            
            else:
                # Generic handling for legacy types
                result = self._apply_generic(is_yes, is_no, response, payload, state)
            
            if result and result.success:
                # Delete confirmation
                self._delete_confirmation(session_id)
                CONFIRMATION_METRICS['applied'] += 1
                CONFIRMATION_METRICS[f'applied_{conf_type.value}'] += 1
                
                logger.info(
                    f"[CONFIRMATION] Applied successfully: {conf_id[:8]} "
                    f"state_updated={result.applied}"
                )
            
            return result
            
        except Exception as e:
            logger.error(f"[CONFIRMATION] Error applying: {e}", exc_info=True)
            return ConfirmationResult(
                success=False,
                error=f"Application error: {str(e)}"
            )
    
    def _apply_location_change(
        self, 
        is_yes: bool, 
        is_no: bool, 
        response: str,
        payload: Dict[str, Any],
        state: Optional[Any]
    ) -> ConfirmationResult:
        """
        Apply LOCATION_CHANGE confirmation.
        
        Logic:
        - YES: Apply stored new_location_state AND clear old restrictive filters
        - NO: Revert to previous location
        - OTHER: Parse as new location + apply
        """
        if is_yes:
            # Apply stored location state
            new_location_state = payload.get('new_location_state', {})
            
            if state:
                # 🔧 STATE SYNC FIX: Update BOTH location_state AND active_filters['location']
                # WHY: Prevents stale location in filters when confirmation applied
                
                # Update location_state attributes
                for key, value in new_location_state.items():
                    # Skip 'location' key if state doesn't have it (UnifiedConversationState uses location_state)
                    if key == 'location' and not hasattr(state, 'location'):
                        continue
                    if hasattr(state, key):
                        setattr(state, key, value)
                
                # CRITICAL: Synchronize active_filters.location with location_state.city
                if hasattr(state, 'active_filters') and hasattr(state, 'location_state'):
                    if state.location_state and state.location_state.city:
                        state.active_filters.location = state.location_state.city
                        logger.info(
                            f"✅ [STATE_SYNC] location_state and active_filters.location synchronized to: {state.location_state.city}",
                            extra={"location": state.location_state.city}
                        )
                    
                    # 🔧 FRESH SEARCH FIX: Clear old restrictive filters when changing locations
                    # WHY: User searching in new city shouldn't have old price/amenity filters applied
                    # Check if price_range was in payload (user mentioned it in new search)
                    price_mentioned = 'price_range' in new_location_state or 'min_price' in new_location_state or 'max_price' in new_location_state
                    amenities_mentioned = 'amenities' in new_location_state
                    bedrooms_mentioned = 'bedrooms' in new_location_state
                    
                    if not price_mentioned:
                        # Clear old price filters
                        if hasattr(state.active_filters, 'min_price'):
                            state.active_filters.min_price = None
                        if hasattr(state.active_filters, 'max_price'):
                            state.active_filters.max_price = None
                        logger.info("🔄 [LOCATION_CHANGE] Cleared old price filters for fresh city search")
                    
                    if not amenities_mentioned:
                        # Clear old amenities
                        if hasattr(state.active_filters, 'amenities'):
                            state.active_filters.amenities = []
                        logger.info("🔄 [LOCATION_CHANGE] Cleared old amenities for fresh city search")
                    
                    if not bedrooms_mentioned:
                        # Clear old bedroom filter
                        if hasattr(state.active_filters, 'bedrooms'):
                            state.active_filters.bedrooms = None
                        logger.info("🔄 [LOCATION_CHANGE] Cleared old bedroom filter for fresh city search")
            
            return ConfirmationResult(
                success=True,
                state_update=new_location_state,
                next_action='search',
                applied=True,
                metadata={'reason': 'User confirmed location change'}
            )
        
        elif is_no:
            # Revert to previous location
            previous_location_state = payload.get('previous_location_state', {})
            
            if state:
                # Only apply attributes that exist on the state object
                for key, value in previous_location_state.items():
                    # Skip 'location' key if state doesn't have it
                    if key == 'location' and not hasattr(state, 'location'):
                        continue
                    if hasattr(state, key):
                        setattr(state, key, value)
            
            return ConfirmationResult(
                success=True,
                state_update=previous_location_state,
                next_action='continue',
                applied=True,
                metadata={'reason': 'User rejected location change, reverted'}
            )
        
        else:
            # Parse as new location
            # Extract location data from response
            # (This would integrate with your location parser)
            return ConfirmationResult(
                success=True,
                state_update={'location_query': response},
                next_action='parse_location',
                applied=False,
                metadata={'reason': 'User provided new location', 'raw_location': response}
            )
    
    def _apply_property_refinement(
        self,
        is_yes: bool,
        is_no: bool,
        response: str,
        payload: Dict[str, Any],
        state: Optional[Any]
    ) -> ConfirmationResult:
        """
        Apply PROPERTY_REFINEMENT confirmation.
        
        Logic:
        - YES: Apply stored filters
        - OTHER: Parse as new filters + apply
        """
        if is_yes:
            # Apply stored filters
            filters = payload.get('filters', {})
            
            if state:
                for key, value in filters.items():
                    setattr(state, key, value)
            
            return ConfirmationResult(
                success=True,
                state_update=filters,
                next_action='search',
                applied=True,
                metadata={'reason': 'User confirmed property refinement'}
            )
        
        else:
            # Parse as new filters
            # (This would integrate with your filter parser)
            return ConfirmationResult(
                success=True,
                state_update={'filter_query': response},
                next_action='parse_filters',
                applied=False,
                metadata={'reason': 'User provided new filters', 'raw_filters': response}
            )
    
    def _apply_requirements_needed(
        self,
        is_yes: bool,
        is_no: bool,
        is_skip: bool,
        response: str,
        payload: Dict[str, Any],
        state: Optional[Any]
    ) -> ConfirmationResult:
        """
        Apply REQUIREMENTS_NEEDED confirmation.
        
        Logic:
        - Response contains data: Parse and apply as filters
        - NO/SKIP: Continue with current filters
        """
        if is_no or is_skip:
            # User doesn't want to add requirements
            return ConfirmationResult(
                success=True,
                state_update={},
                next_action='search',
                applied=False,
                metadata={'reason': 'User skipped requirements'}
            )
        
        # Parse requirements from response
        # (This would integrate with your requirements parser)
        return ConfirmationResult(
            success=True,
            state_update={'requirements_query': response},
            next_action='parse_requirements',
            applied=False,
            metadata={'reason': 'User provided requirements', 'raw_requirements': response}
        )
    
    def _apply_postal_code_clarification(
        self,
        is_yes: bool,
        is_no: bool,
        response: str,
        payload: Dict[str, Any],
        state: Optional[Any]
    ) -> ConfirmationResult:
        """
        Apply POSTAL_CODE_CLARIFICATION confirmation.
        
        Logic:
        - YES: Use postal code
        - NO: Use city/broader area
        - OTHER: Parse as clarification
        """
        if is_yes:
            # Use postal code
            postal_code = payload.get('postal_code')
            
            update = {'postal_code': postal_code, 'use_postal_code': True}
            
            if state:
                for key, value in update.items():
                    setattr(state, key, value)
            
            return ConfirmationResult(
                success=True,
                state_update=update,
                next_action='search',
                applied=True,
                metadata={'reason': 'User confirmed postal code'}
            )
        
        elif is_no:
            # Use broader area
            city = payload.get('city')
            
            update = {'city': city, 'use_postal_code': False}
            
            if state:
                for key, value in update.items():
                    setattr(state, key, value)
            
            return ConfirmationResult(
                success=True,
                state_update=update,
                next_action='search',
                applied=True,
                metadata={'reason': 'User chose broader area'}
            )
        
        else:
            # Parse as clarification
            return ConfirmationResult(
                success=True,
                state_update={'location_query': response},
                next_action='parse_location',
                applied=False,
                metadata={'reason': 'User provided clarification', 'raw_response': response}
            )
    
    def _apply_generic(
        self,
        is_yes: bool,
        is_no: bool,
        response: str,
        payload: Dict[str, Any],
        state: Optional[Any]
    ) -> ConfirmationResult:
        """
        Generic confirmation handler for legacy types.
        """
        if is_yes:
            # Apply payload as state update
            if state:
                for key, value in payload.items():
                    if hasattr(state, key):
                        setattr(state, key, value)
            
            return ConfirmationResult(
                success=True,
                state_update=payload,
                next_action='continue',
                applied=True,
                metadata={'reason': 'User confirmed'}
            )
        
        elif is_no:
            # User rejected
            return ConfirmationResult(
                success=True,
                state_update={},
                next_action='continue',
                applied=False,
                metadata={'reason': 'User rejected'}
            )
        
        else:
            # Ambiguous response
            return ConfirmationResult(
                success=True,
                state_update={'user_response': response},
                next_action='clarify',
                applied=False,
                metadata={'reason': 'Ambiguous response', 'raw_response': response}
            )
    
    def reject_confirmation(self, session_id: str, reason: str = ""):
        """
        Explicitly reject and delete a confirmation.
        
        Args:
            session_id: Session identifier
            reason: Optional reason for rejection
        """
        pending = self.get_pending_confirmation(session_id)
        
        if pending:
            conf_id = pending['confirmation_id']
            logger.info(
                f"[CONFIRMATION] Rejected: {conf_id[:8]} "
                f"reason='{reason}'"
            )
            CONFIRMATION_METRICS['rejected'] += 1
        
        self._delete_confirmation(session_id)
    
    def expire_confirmation(self, session_id: str, reason: str = ""):
        """
        Explicitly expire and delete a confirmation.
        
        Args:
            session_id: Session identifier
            reason: Optional reason for expiration
        """
        pending = self.get_pending_confirmation(session_id)
        
        if pending:
            conf_id = pending['confirmation_id']
            logger.info(
                f"[CONFIRMATION] Expired: {conf_id[:8]} "
                f"reason='{reason}'"
            )
            CONFIRMATION_METRICS['expired'] += 1
        
        self._delete_confirmation(session_id)
    
    def cancel_confirmation(self, session_id: str, confirmation_id: Optional[str] = None):
        """
        Cancel a pending confirmation.
        
        Args:
            session_id: Session identifier
            confirmation_id: Specific confirmation ID (ignored, for compatibility)
        """
        self._delete_confirmation(session_id)
        CONFIRMATION_METRICS['cancelled'] += 1
    
    def clear_session_confirmations(self, session_id: str):
        """
        Clear all confirmations for a session.
        
        Args:
            session_id: Session identifier
        """
        self._delete_confirmation(session_id)
        logger.info(f"[CONFIRMATION] Cleared session: {session_id[:8]}")
    
    def _delete_confirmation(self, session_id: str):
        """Delete confirmation from both memory and Redis."""
        confirmation_key = f"{session_id}:confirmation"
        
        # Delete from memory
        if confirmation_key in self._confirmations:
            conf = self._confirmations.pop(confirmation_key)
            # Add to history
            self._confirmation_history.append(conf)
            if len(self._confirmation_history) > self._max_history:
                self._confirmation_history = self._confirmation_history[-self._max_history:]
        
        # Delete from Redis
        if self.redis_client:
            try:
                redis_key = f"confirmation:{session_id}"
                self.redis_client.delete(redis_key)
            except Exception as e:
                logger.warning(f"[CONFIRMATION] Redis deletion failed: {e}")
    
    def get_metrics(self) -> Dict[str, int]:
        """Get current metrics."""
        return dict(CONFIRMATION_METRICS)
    
    def get_session_confirmation_count(self, session_id: str) -> int:
        """Get count of confirmations for session (0 or 1)."""
        return 1 if self.has_pending_confirmation(session_id) else 0


# Singleton instance
_manager_instance = None


def get_confirmation_manager(redis_client=None) -> ConfirmationManager:
    """Get singleton instance of ConfirmationManager."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = ConfirmationManager(redis_client=redis_client)
    return _manager_instance


def get_confirmation_metrics() -> Dict[str, int]:
    """Get current confirmation metrics."""
    return dict(CONFIRMATION_METRICS)

