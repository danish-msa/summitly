"""
confirmation_manager.py

Robust confirmation management system with race condition handling,
timeouts, and UUID-based confirmation tracking.

This module prevents confirmation race conditions by:
1. Explicit pending confirmation objects with UUIDs
2. Timeout-based expiration (default 120 seconds)
3. Routing confirmation responses before normal intent classification
4. Support for multiple pending confirmations with priority queuing
"""

import uuid
import logging
from typing import Dict, List, Optional, Any
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
        id: Unique identifier for this confirmation
        type: Type of confirmation (location_change, etc.)
        message: Confirmation message shown to user
        payload: Additional context data for confirmation
        created_at: When confirmation was created
        expires_at: When confirmation expires
        status: Current status
        session_id: Associated session
    """
    id: str
    type: ConfirmationType
    message: str
    payload: Dict[str, Any]
    created_at: datetime
    expires_at: datetime
    status: ConfirmationStatus = ConfirmationStatus.PENDING
    session_id: Optional[str] = None
    choices: List[str] = field(default_factory=list)  # For multiple choice confirmations
    
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
class ConfirmationResponse:
    """
    Result of processing a confirmation response.
    
    Attributes:
        accepted: Whether confirmation was accepted
        confirmation_id: ID of the confirmation that was responded to
        original_payload: The payload from the original confirmation
        reason: Explanation of the decision
        needs_further_action: Whether additional processing is needed
    """
    accepted: bool
    confirmation_id: str
    original_payload: Dict[str, Any]
    reason: str
    needs_further_action: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


# Confirmation tokens (case-insensitive)
POSITIVE_TOKENS = {
    'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 
    'alright', 'correct', 'right', 'affirmative', 'y'
}

NEGATIVE_TOKENS = {
    'no', 'nope', 'nah', 'not', 'negative', 'n',
    'cancel', 'nevermind', 'never mind'
}


class ConfirmationManager:
    """
    Manages pending confirmations with timeout and race condition handling.
    """
    
    def __init__(self, default_timeout_seconds: int = 120):
        """
        Initialize confirmation manager.
        
        Args:
            default_timeout_seconds: Default timeout for confirmations (seconds)
        """
        self.default_timeout = default_timeout_seconds
        # Store confirmations by session_id -> list of confirmations
        self._confirmations: Dict[str, List[PendingConfirmation]] = {}
        self._confirmation_history: List[PendingConfirmation] = []
        self._max_history = 1000  # Keep last 1000 confirmations for debugging
    
    def create_confirmation(
        self,
        session_id: str,
        confirmation_type: ConfirmationType,
        message: str,
        payload: Dict[str, Any],
        timeout_seconds: Optional[int] = None,
        choices: Optional[List[str]] = None
    ) -> PendingConfirmation:
        """
        Create a new pending confirmation.
        
        Args:
            session_id: Session identifier
            confirmation_type: Type of confirmation
            message: Message to show user
            payload: Context data for confirmation
            timeout_seconds: Custom timeout (uses default if None)
            choices: List of choice options (for multiple choice confirmations)
            
        Returns:
            Created PendingConfirmation object
        """
        timeout = timeout_seconds if timeout_seconds is not None else self.default_timeout
        
        confirmation = PendingConfirmation(
            id=str(uuid.uuid4()),
            type=confirmation_type,
            message=message,
            payload=payload,
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(seconds=timeout),
            session_id=session_id,
            choices=choices or []
        )
        
        # Add to session's confirmation list
        if session_id not in self._confirmations:
            self._confirmations[session_id] = []
        
        # Mark any existing pending confirmations as superseded
        for existing in self._confirmations[session_id]:
            if existing.is_active():
                existing.status = ConfirmationStatus.SUPERSEDED
                logger.info(
                    f"[CONFIRMATION] Superseded confirmation {existing.id} "
                    f"with new confirmation {confirmation.id}"
                )
        
        self._confirmations[session_id].append(confirmation)
        
        # Metrics
        CONFIRMATION_METRICS['created'] += 1
        CONFIRMATION_METRICS[f'created_{confirmation_type.value}'] += 1
        
        logger.info(
            f"[CONFIRMATION] Created confirmation {confirmation.id} "
            f"type={confirmation_type.value} session={session_id} "
            f"expires_at={confirmation.expires_at.isoformat()}"
        )
        
        return confirmation
    
    def get_active_confirmation(self, session_id: str) -> Optional[PendingConfirmation]:
        """
        Get the active (most recent non-expired) confirmation for a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Active PendingConfirmation or None
        """
        if session_id not in self._confirmations:
            return None
        
        # Clean up expired confirmations
        self._cleanup_expired(session_id)
        
        # Find most recent active confirmation
        active = [c for c in self._confirmations[session_id] if c.is_active()]
        
        if active:
            return active[-1]  # Most recent
        
        return None
    
    def has_pending_confirmation(self, session_id: str) -> bool:
        """
        Check if session has any pending confirmation.
        
        Args:
            session_id: Session identifier
            
        Returns:
            True if pending confirmation exists
        """
        return self.get_active_confirmation(session_id) is not None
    
    def is_confirmation_token(self, message: str) -> bool:
        """
        Check if message is a simple confirmation token (yes/no).
        
        Args:
            message: User message
            
        Returns:
            True if message is a confirmation token
        """
        clean_message = message.lower().strip().rstrip('.')
        
        # Check single-word tokens
        if clean_message in POSITIVE_TOKENS or clean_message in NEGATIVE_TOKENS:
            return True
        
        # Check short phrases (max 3 words)
        words = clean_message.split()
        if len(words) <= 3:
            # Check if it starts with a confirmation token
            if words[0] in POSITIVE_TOKENS or words[0] in NEGATIVE_TOKENS:
                return True
        
        return False
    
    def handle_confirmation_response(
        self,
        session_id: str,
        message: str,
        message_id: Optional[str] = None,
        confirmation_id: Optional[str] = None
    ) -> Optional[ConfirmationResponse]:
        """
        Handle a user's response to a pending confirmation.
        
        Args:
            session_id: Session identifier
            message: User's response message
            message_id: Message identifier for logging
            confirmation_id: Optional specific confirmation ID to respond to
            
        Returns:
            ConfirmationResponse if handled, None if no active confirmation
        """
        # Get active confirmation
        if confirmation_id:
            confirmation = self._get_confirmation_by_id(session_id, confirmation_id)
        else:
            confirmation = self.get_active_confirmation(session_id)
        
        if not confirmation:
            logger.warning(
                f"[CONFIRMATION] No active confirmation for session={session_id} "
                f"msg_id={message_id}"
            )
            CONFIRMATION_METRICS['no_active_confirmation'] += 1
            return None
        
        # Check if expired
        if confirmation.is_expired():
            confirmation.status = ConfirmationStatus.EXPIRED
            logger.warning(
                f"[CONFIRMATION] Confirmation {confirmation.id} expired "
                f"session={session_id}"
            )
            CONFIRMATION_METRICS['expired'] += 1
            return None
        
        # Parse response
        clean_message = message.lower().strip().rstrip('.')
        words = clean_message.split()
        first_word = words[0] if words else ''
        
        # Determine acceptance
        accepted = None
        reason = ''
        
        # Check for explicit positive/negative
        if first_word in POSITIVE_TOKENS:
            accepted = True
            reason = f"User confirmed with '{first_word}'"
        elif first_word in NEGATIVE_TOKENS:
            accepted = False
            reason = f"User rejected with '{first_word}'"
        
        # Handle multiple choice confirmations
        elif confirmation.choices:
            # Check if message matches one of the choices
            for choice in confirmation.choices:
                if choice.lower() in clean_message:
                    accepted = True
                    reason = f"User selected choice: {choice}"
                    confirmation.payload['selected_choice'] = choice
                    break
        
        # Ambiguous response
        if accepted is None:
            logger.warning(
                f"[CONFIRMATION] Ambiguous response '{message}' "
                f"for confirmation {confirmation.id}"
            )
            CONFIRMATION_METRICS['ambiguous_response'] += 1
            return None
        
        # Update confirmation status
        confirmation.status = (
            ConfirmationStatus.ACCEPTED if accepted 
            else ConfirmationStatus.REJECTED
        )
        
        # Add to history
        self._add_to_history(confirmation)
        
        # Metrics
        CONFIRMATION_METRICS['handled'] += 1
        CONFIRMATION_METRICS['accepted' if accepted else 'rejected'] += 1
        
        logger.info(
            f"[CONFIRMATION] {'Accepted' if accepted else 'Rejected'} "
            f"confirmation {confirmation.id} session={session_id} "
            f"reason='{reason}'"
        )
        
        return ConfirmationResponse(
            accepted=accepted,
            confirmation_id=confirmation.id,
            original_payload=confirmation.payload,
            reason=reason,
            metadata={
                'confirmation_type': confirmation.type.value,
                'created_at': confirmation.created_at.isoformat(),
                'response_time_seconds': (
                    datetime.utcnow() - confirmation.created_at
                ).total_seconds()
            }
        )
    
    def cancel_confirmation(self, session_id: str, confirmation_id: Optional[str] = None):
        """
        Cancel a pending confirmation.
        
        Args:
            session_id: Session identifier
            confirmation_id: Specific confirmation to cancel (None = cancel active)
        """
        if confirmation_id:
            confirmation = self._get_confirmation_by_id(session_id, confirmation_id)
        else:
            confirmation = self.get_active_confirmation(session_id)
        
        if confirmation and confirmation.is_active():
            confirmation.status = ConfirmationStatus.SUPERSEDED
            self._add_to_history(confirmation)
            logger.info(f"[CONFIRMATION] Cancelled confirmation {confirmation.id}")
            CONFIRMATION_METRICS['cancelled'] += 1
    
    def clear_session_confirmations(self, session_id: str):
        """
        Clear all confirmations for a session.
        
        Args:
            session_id: Session identifier
        """
        if session_id in self._confirmations:
            for conf in self._confirmations[session_id]:
                if conf.is_active():
                    self._add_to_history(conf)
            del self._confirmations[session_id]
            logger.info(f"[CONFIRMATION] Cleared all confirmations for session={session_id}")
    
    def _get_confirmation_by_id(
        self, 
        session_id: str, 
        confirmation_id: str
    ) -> Optional[PendingConfirmation]:
        """Get confirmation by ID."""
        if session_id not in self._confirmations:
            return None
        
        for confirmation in self._confirmations[session_id]:
            if confirmation.id == confirmation_id:
                return confirmation
        
        return None
    
    def _cleanup_expired(self, session_id: str):
        """Mark expired confirmations and clean up."""
        if session_id not in self._confirmations:
            return
        
        for confirmation in self._confirmations[session_id]:
            if confirmation.is_expired() and confirmation.status == ConfirmationStatus.PENDING:
                confirmation.status = ConfirmationStatus.EXPIRED
                self._add_to_history(confirmation)
                CONFIRMATION_METRICS['expired'] += 1
    
    def _add_to_history(self, confirmation: PendingConfirmation):
        """Add confirmation to history for debugging."""
        self._confirmation_history.append(confirmation)
        
        # Trim history if too large
        if len(self._confirmation_history) > self._max_history:
            self._confirmation_history = self._confirmation_history[-self._max_history:]
    
    def get_metrics(self) -> Dict[str, int]:
        """Get current metrics."""
        return dict(CONFIRMATION_METRICS)
    
    def get_session_confirmation_count(self, session_id: str) -> int:
        """Get count of confirmations for session."""
        return len(self._confirmations.get(session_id, []))


# Singleton instance
_manager_instance = None


def get_confirmation_manager() -> ConfirmationManager:
    """Get singleton instance of ConfirmationManager."""
    global _manager_instance
    if _manager_instance is None:
        _manager_instance = ConfirmationManager()
    return _manager_instance


def get_confirmation_metrics() -> Dict[str, int]:
    """Get current confirmation metrics."""
    return dict(CONFIRMATION_METRICS)
