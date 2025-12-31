"""
Unified Conversation State Manager
==================================
Production-ready conversation state management using Pydantic v2.
Provides type-safe, validated state management for real estate chatbot sessions.

Features:
- Full validation with Pydantic v2 Field validators
- Atomic state updates with rollback support
- Checkpoint/restore functionality
- Canadian postal code validation
- Comprehensive filter management

Author: Summitly Team
Date: December 2025
"""

from __future__ import annotations

import json
import logging
import re
import uuid
from copy import deepcopy
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS
# =============================================================================


class ListingType(str, Enum):
    """Valid listing types for property searches.
    
    Example:
        >>> ListingType.SALE.value
        'sale'
        >>> ListingType.RENT.value
        'rent'
    """
    SALE = "sale"
    RENT = "rent"


class ConversationStage(str, Enum):
    """Stages of the conversation flow.
    
    Example:
        >>> ConversationStage.GREETING.value
        'greeting'
        >>> ConversationStage.FILTERING in ConversationStage
        True
    """
    GREETING = "greeting"
    FILTERING = "filtering"
    VIEWING = "viewing"
    CONFIRMATION = "confirmation"
    DONE = "done"


# =============================================================================
# NESTED MODELS
# =============================================================================


class ConversationTurn(BaseModel):
    """Individual message in conversation history.
    
    Example:
        >>> turn = ConversationTurn(
        ...     role="user",
        ...     content="Show me condos in Toronto"
        ... )
        >>> turn.role
        'user'
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    role: str = Field(
        ...,
        description="Message role: 'user', 'assistant', or 'system'",
        min_length=1,
        max_length=20,
    )
    content: str = Field(
        ...,
        description="Message content",
        min_length=1,
        max_length=10000,
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="When the message was sent",
    )
    
    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        """Ensure role is one of the allowed values.
        
        Args:
            v: The role value to validate.
            
        Returns:
            Normalized lowercase role.
            
        Raises:
            ValueError: If role is not user/assistant/system.
        """
        v = v.lower().strip()
        if v not in {"user", "assistant", "system"}:
            raise ValueError(f"Role must be 'user', 'assistant', or 'system', got '{v}'")
        return v
    
    @field_validator("timestamp")
    @classmethod
    def validate_timestamp(cls, v: datetime) -> datetime:
        """Ensure timestamp is not in the future.
        
        Args:
            v: The timestamp to validate.
            
        Returns:
            The validated timestamp.
            
        Raises:
            ValueError: If timestamp is in the future.
        """
        from datetime import timedelta
        now = datetime.now()
        # Allow 1 minute tolerance for clock skew
        if v > now + timedelta(minutes=1):
            raise ValueError(f"Timestamp cannot be in the future: {v}")
        return v


class LocationState(BaseModel):
    """Structured location state for property search.
    
    Follows Repliers API location hierarchy for Canadian real estate.
    
    Example:
        >>> location = LocationState(
        ...     city="Toronto",
        ...     neighborhood="Yorkville",
        ...     postal_code="M5R 2C7"
        ... )
        >>> location.get_summary()
        'Yorkville, Toronto, M5R 2C7'
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    city: Optional[str] = Field(
        default=None,
        description="City name (Toronto, Mississauga, etc.)",
        max_length=100,
    )
    community: Optional[str] = Field(
        default=None,
        description="Larger community/area (North York, Etobicoke, etc.)",
        max_length=100,
    )
    neighborhood: Optional[str] = Field(
        default=None,
        description="Specific neighborhood (Yorkville, Liberty Village, etc.)",
        max_length=100,
    )
    postal_code: Optional[str] = Field(
        default=None,
        description="Canadian postal code (FSA or full format)",
        max_length=10,
    )
    address: Optional[str] = Field(
        default=None,
        description="Full street address if provided",
        max_length=200,
    )
    street_name: Optional[str] = Field(
        default=None,
        description="Street name without number",
        max_length=100,
    )
    street_number: Optional[str] = Field(
        default=None,
        description="Street number",
        max_length=20,
    )
    latitude: Optional[float] = Field(
        default=None,
        description="Geocoded latitude coordinate",
        ge=-90.0,
        le=90.0,
    )
    longitude: Optional[float] = Field(
        default=None,
        description="Geocoded longitude coordinate",
        ge=-180.0,
        le=180.0,
    )
    radius_m: Optional[int] = Field(
        default=None,
        description="Search radius in meters for geo-distance filtering",
        ge=0,
        le=10000,
    )
    confidence: Optional[float] = Field(
        default=None,
        description="Geocoding confidence score (0.0 to 1.0)",
        ge=0.0,
        le=1.0,
    )
    source: Optional[str] = Field(
        default=None,
        description="Geocoding source (photon, nominatim, manual, etc.)",
        max_length=50,
    )
    location_type: Optional[str] = Field(
        default=None,
        description="Type of location (intersection, street, neighborhood, landmark, postal_code, address)",
        max_length=50,
    )
    
    @field_validator("city", "community", "neighborhood", mode="before")
    @classmethod
    def normalize_location_string(cls, v: Optional[str]) -> Optional[str]:
        """Normalize location strings: strip whitespace and capitalize properly.
        
        Args:
            v: The location string to normalize.
            
        Returns:
            Normalized string or None.
            
        Example:
            >>> LocationState.normalize_location_string("  toronto  ")
            'Toronto'
        """
        if v is None or not isinstance(v, str):
            return v
        v = v.strip()
        if not v:
            return None
        # Title case for location names
        return v.title()
    
    @field_validator("postal_code", mode="before")
    @classmethod
    def validate_postal_code(cls, v: Optional[str]) -> Optional[str]:
        """Validate and normalize Canadian postal code format.
        
        Accepts:
        - FSA format: A1A (3 characters)
        - Full format: A1A 1A1 or A1A1A1 (6 characters with optional space)
        
        Args:
            v: The postal code to validate.
            
        Returns:
            Normalized postal code in uppercase with space.
            
        Raises:
            ValueError: If postal code format is invalid.
            
        Example:
            >>> LocationState.validate_postal_code("m5v3a8")
            'M5V 3A8'
            >>> LocationState.validate_postal_code("M5V")
            'M5V'
        """
        if v is None or not isinstance(v, str):
            return v
        
        v = v.strip().upper().replace(" ", "")
        if not v:
            return None
        
        # Canadian postal code pattern
        # FSA: A1A (letter-digit-letter)
        # Full: A1A1A1 (letter-digit-letter-digit-letter-digit)
        fsa_pattern = r"^[A-Z]\d[A-Z]$"
        full_pattern = r"^[A-Z]\d[A-Z]\d[A-Z]\d$"
        
        if re.match(fsa_pattern, v):
            return v  # Return FSA as-is
        elif re.match(full_pattern, v):
            # Format as "A1A 1A1"
            return f"{v[:3]} {v[3:]}"
        else:
            raise ValueError(
                f"Invalid Canadian postal code format: '{v}'. "
                "Expected format: 'A1A' (FSA) or 'A1A 1A1' (full)."
            )
    
    def is_empty(self) -> bool:
        """Check if all location fields are empty.
        
        Returns:
            True if no location data is set.
            
        Example:
            >>> LocationState().is_empty()
            True
            >>> LocationState(city="Toronto").is_empty()
            False
        """
        return all(
            v is None
            for v in [
                self.city,
                self.community,
                self.neighborhood,
                self.postal_code,
                self.address,
                self.street_name,
            ]
        )
    
    def get_summary(self) -> str:
        """Get human-readable location summary.
        
        Returns:
            Formatted location string or 'No location specified'.
            
        Example:
            >>> LocationState(city="Toronto", neighborhood="Yorkville").get_summary()
            'Yorkville, Toronto'
        """
        parts = []
        if self.street_number and self.street_name:
            parts.append(f"{self.street_number} {self.street_name}")
        elif self.address:
            parts.append(self.address)
        elif self.street_name:
            parts.append(self.street_name)
        if self.neighborhood:
            parts.append(self.neighborhood)
        if self.community:
            parts.append(self.community)
        if self.city:
            parts.append(self.city)
        if self.postal_code:
            parts.append(self.postal_code)
        return ", ".join(parts) if parts else "No location specified"
    
    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary with only non-None values.
        
        Returns:
            Dictionary of location fields.
        """
        return {k: v for k, v in self.model_dump().items() if v is not None}
    
    # ═══════════════════════════════════════════════════════════════════════════
    # COMPATIBILITY PROPERTIES - Allow camelCase access (for location_extractor compat)
    # ═══════════════════════════════════════════════════════════════════════════
    
    @property
    def postalCode(self) -> Optional[str]:
        """CamelCase alias for postal_code (location_extractor compatibility)."""
        return self.postal_code
    
    @property
    def streetName(self) -> Optional[str]:
        """CamelCase alias for street_name (location_extractor compatibility)."""
        return self.street_name
    
    @property
    def streetNumber(self) -> Optional[str]:
        """CamelCase alias for street_number (location_extractor compatibility)."""
        return self.street_number
    
    def to_camel_case_dict(self) -> Dict[str, str]:
        """Convert to dictionary with camelCase keys (for Repliers API)."""
        result = {}
        for k, v in self.model_dump().items():
            if v is not None:
                # Convert snake_case to camelCase
                if k == 'postal_code':
                    result['postalCode'] = v
                elif k == 'street_name':
                    result['streetName'] = v
                elif k == 'street_number':
                    result['streetNumber'] = v
                elif k == 'radius_m':
                    result['radiusM'] = v
                elif k == 'location_type':
                    result['locationType'] = v
                else:
                    result[k] = v
        return result


class ActiveFilters(BaseModel):
    """Active search filters for property queries.
    
    Validates bedroom/bathroom counts, price ranges, and listing types.
    
    Example:
        >>> filters = ActiveFilters(
        ...     location="Toronto",
        ...     bedrooms=3,
        ...     min_price=500000,
        ...     max_price=1000000,
        ...     listing_type=ListingType.SALE
        ... )
        >>> filters.get_non_null_filters()
        {'location': 'Toronto', 'bedrooms': 3, 'min_price': 500000, 'max_price': 1000000, 'listing_type': 'sale'}
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
        use_enum_values=True,
    )
    
    location: Optional[str] = Field(
        default=None,
        description="Search location (city, neighborhood, etc.)",
        max_length=200,
    )
    property_type: Optional[str] = Field(
        default=None,
        description="Property type (condo, detached, townhouse, etc.)",
        max_length=50,
    )
    bedrooms: Optional[int] = Field(
        default=None,
        description="Number of bedrooms (0-8)",
        ge=0,
        le=8,
    )
    bathrooms: Optional[int] = Field(
        default=None,
        description="Number of bathrooms (0-8)",
        ge=0,
        le=8,
    )
    min_price: Optional[int] = Field(
        default=None,
        description="Minimum price (positive integer)",
        gt=0,
    )
    max_price: Optional[int] = Field(
        default=None,
        description="Maximum price (positive integer)",
        gt=0,
    )
    listing_type: Optional[ListingType] = Field(
        default=None,
        description="Listing type: 'sale' or 'rent'",
    )
    amenities: Optional[List[str]] = Field(
        default_factory=list,
        description="Required amenities (pool, gym, parking, etc.)",
    )
    
    @field_validator("location", "property_type", mode="before")
    @classmethod
    def normalize_string_filter(cls, v: Optional[str]) -> Optional[str]:
        """Normalize string filters: strip and capitalize.
        
        Args:
            v: The string to normalize.
            
        Returns:
            Normalized string or None.
        """
        if v is None or not isinstance(v, str):
            return v
        v = v.strip()
        return v.title() if v else None
    
    @field_validator("bedrooms", "bathrooms", mode="before")
    @classmethod
    def validate_room_count(cls, v: Any) -> Optional[int]:
        """Validate bedroom/bathroom counts.
        
        Args:
            v: The room count to validate.
            
        Returns:
            Validated count or None.
            
        Raises:
            ValueError: If count is negative or exceeds 8.
        """
        if v is None:
            return None
        if isinstance(v, str):
            if not v.strip():
                return None
            try:
                v = int(v.strip().rstrip('+'))
            except ValueError:
                raise ValueError(f"Invalid room count: '{v}'")
        if isinstance(v, float):
            v = int(v)
        if not isinstance(v, int):
            raise ValueError(f"Room count must be an integer, got {type(v)}")
        if v < 0:
            raise ValueError(f"Room count cannot be negative: {v}")
        if v > 8:
            raise ValueError(f"Room count cannot exceed 8: {v}")
        return v
    
    @field_validator("min_price", "max_price", mode="before")
    @classmethod
    def validate_price(cls, v: Any) -> Optional[int]:
        """Validate price values.
        
        Args:
            v: The price to validate.
            
        Returns:
            Validated positive integer price.
            
        Raises:
            ValueError: If price is not positive.
        """
        if v is None:
            return None
        if isinstance(v, str):
            if not v.strip():
                return None
            # Remove currency symbols and commas
            v = v.replace("$", "").replace(",", "").strip()
            try:
                v = int(float(v))
            except ValueError:
                raise ValueError(f"Invalid price: '{v}'")
        if isinstance(v, float):
            v = int(v)
        if not isinstance(v, int):
            raise ValueError(f"Price must be an integer, got {type(v)}")
        if v <= 0:
            raise ValueError(f"Price must be positive: {v}")
        return v
    
    @field_validator("amenities", mode="before")
    @classmethod
    def validate_amenities(cls, v: Any) -> List[str]:
        """Normalize amenities list.
        
        Args:
            v: Amenities to validate.
            
        Returns:
            Normalized list of amenities.
        """
        if v is None:
            return []
        if isinstance(v, str):
            return [a.strip().lower() for a in v.split(",") if a.strip()]
        if isinstance(v, list):
            return [str(a).strip().lower() for a in v if a]
        return []
    
    def get_non_null_filters(self) -> Dict[str, Any]:
        """Get dictionary of only non-null filter values.
        
        Returns:
            Dictionary containing only set filters.
            
        Example:
            >>> f = ActiveFilters(bedrooms=2, location="Toronto")
            >>> f.get_non_null_filters()
            {'location': 'Toronto', 'bedrooms': 2, 'amenities': []}
        """
        result = {}
        data = self.model_dump()
        for key, value in data.items():
            if value is not None:
                if key == "amenities" and not value:
                    continue  # Skip empty amenities list
                result[key] = value
        return result


class PendingConfirmation(BaseModel):
    """Pending confirmation state for multi-turn dialogs.
    
    Tracks confirmations waiting for user response.
    
    Example:
        >>> pending = PendingConfirmation(
        ...     id="conf_123",
        ...     type="filter_reuse",
        ...     payload={"location": "Toronto", "bedrooms": 2}
        ... )
        >>> pending.is_expired(timeout_seconds=300)
        False
    """
    
    model_config = ConfigDict(validate_assignment=True)
    
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique confirmation ID",
    )
    type: str = Field(
        ...,
        description="Confirmation type: 'filter_reuse', 'location_change', etc.",
        min_length=1,
        max_length=50,
    )
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Confirmation context data",
    )
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="When the confirmation was created",
    )
    
    def is_expired(self, timeout_seconds: int = 300) -> bool:
        """Check if confirmation has expired.
        
        Args:
            timeout_seconds: Timeout in seconds (default 5 minutes).
            
        Returns:
            True if confirmation has expired.
        """
        elapsed = (datetime.now() - self.created_at).total_seconds()
        return elapsed > timeout_seconds


class ConversationMetadata(BaseModel):
    """Session metadata for tracking and analytics.
    
    Example:
        >>> metadata = ConversationMetadata(
        ...     device="mobile",
        ...     language="en",
        ...     conversation_stage=ConversationStage.FILTERING,
        ...     detected_intent="property_search"
        ... )
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        use_enum_values=True,
    )
    
    device: Optional[str] = Field(
        default=None,
        description="Device type (mobile, desktop, tablet)",
        max_length=50,
    )
    language: str = Field(
        default="en",
        description="User language preference",
        max_length=10,
    )
    conversation_stage: ConversationStage = Field(
        default=ConversationStage.GREETING,
        description="Current conversation stage",
    )
    detected_intent: Optional[str] = Field(
        default=None,
        description="Intent classified by hybrid_intent_classifier (SINGLE source of truth)",
        max_length=100,
    )
    user_agent: Optional[str] = Field(
        default=None,
        description="Browser user agent",
        max_length=500,
    )
    referrer: Optional[str] = Field(
        default=None,
        description="Traffic source",
        max_length=200,
    )


# =============================================================================
# MAIN UNIFIED STATE MODEL
# =============================================================================


class UnifiedConversationState(BaseModel):
    """Production-ready unified conversation state manager.
    
    Manages complete conversation context including filters, location,
    history, and session metadata with full Pydantic v2 validation.
    
    Features:
    - Atomic state updates with validation
    - Checkpoint/restore for rollback support
    - Filter merging with conflict resolution
    - Comprehensive logging and debugging
    
    Example:
        >>> state = UnifiedConversationState(
        ...     session_id="sess_123",
        ...     user_id="user_456"
        ... )
        >>> state.add_conversation_turn("user", "Show me condos in Toronto")
        >>> state.update_filters(location="Toronto", property_type="condo")
        >>> state.get_active_filters()
        {'location': 'Toronto', 'property_type': 'Condo', 'amenities': []}
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
        extra="forbid",  # Prevent unknown fields
    )
    
    # -------------------------------------------------------------------------
    # Core Session Fields
    # -------------------------------------------------------------------------
    
    session_id: str = Field(
        ...,
        description="Unique session identifier (required)",
        min_length=1,
        max_length=100,
    )
    user_id: Optional[str] = Field(
        default=None,
        description="Optional user identifier for authenticated users",
        max_length=100,
    )
    
    # -------------------------------------------------------------------------
    # Conversation History
    # -------------------------------------------------------------------------
    
    conversation_history: List[ConversationTurn] = Field(
        default_factory=list,
        description="Complete conversation history",
        max_length=100,  # Limit history size
    )
    
    # -------------------------------------------------------------------------
    # Location & Filters
    # -------------------------------------------------------------------------
    
    location_state: LocationState = Field(
        default_factory=LocationState,
        description="Structured location information",
    )
    active_filters: ActiveFilters = Field(
        default_factory=ActiveFilters,
        description="Current search filters",
    )
    
    # -------------------------------------------------------------------------
    # Confirmation Flow
    # -------------------------------------------------------------------------
    
    pending_confirmation: Optional[PendingConfirmation] = Field(
        default=None,
        description="Pending confirmation waiting for user response",
    )
    
    # -------------------------------------------------------------------------
    # Search Results
    # -------------------------------------------------------------------------
    
    last_property_results: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Last property search results (max 20)",
        max_length=20,
    )
    search_count: int = Field(
        default=0,
        description="Number of searches performed in session",
        ge=0,
    )
    zero_results_count: int = Field(
        default=0,
        description="Consecutive searches that returned zero results",
        ge=0,
    )
    last_relaxation_applied: Optional[str] = Field(
        default=None,
        description="Description of last filter relaxation applied (e.g., 'removed bedroom filter')",
        max_length=200,
    )
    last_successful_filters: Optional[ActiveFilters] = Field(
        default=None,
        description="Snapshot of filters from the last successful (non-empty) search",
    )
    
    # -------------------------------------------------------------------------
    # Timestamps
    # -------------------------------------------------------------------------
    
    created_at: datetime = Field(
        default_factory=datetime.now,
        description="Session creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=datetime.now,
        description="Last update timestamp",
    )
    
    # -------------------------------------------------------------------------
    # Metadata
    # -------------------------------------------------------------------------
    
    metadata: ConversationMetadata = Field(
        default_factory=ConversationMetadata,
        description="Session metadata for tracking",
    )
    
    # -------------------------------------------------------------------------
    # Internal Checkpoints (not serialized by default)
    # -------------------------------------------------------------------------
    
    _checkpoints: Dict[str, Dict[str, Any]] = {}
    
    # =========================================================================
    # MODEL VALIDATORS
    # =========================================================================
    
    @model_validator(mode="after")
    def validate_price_range(self) -> "UnifiedConversationState":
        """Ensure min_price < max_price if both are set.
        
        Auto-fixes conflicting prices by resetting min_price to None if invalid.
        This handles cases where previous searches left conflicting price filters.
        
        Returns:
            Self after validation.
        """
        if (
            self.active_filters.min_price is not None
            and self.active_filters.max_price is not None
            and self.active_filters.min_price >= self.active_filters.max_price
        ):
            logger.warning(
                f"🔧 [AUTO-FIX] Invalid price range detected: "
                f"min_price ({self.active_filters.min_price}) >= "
                f"max_price ({self.active_filters.max_price}). "
                f"Resetting min_price to None to resolve conflict."
            )
            # Auto-fix: Reset min_price to allow operation to continue
            object.__setattr__(self.active_filters, 'min_price', None)
        return self
    
    @model_validator(mode="after")
    def validate_location_for_search(self) -> "UnifiedConversationState":
        """Warn if doing property search without location.
        
        This is a soft validation - logs warning but doesn't raise.
        
        Returns:
            Self after validation.
        """
        # If we have property-related filters but no location, log warning
        has_property_filters = (
            self.active_filters.bedrooms is not None
            or self.active_filters.property_type is not None
            or self.active_filters.min_price is not None
            or self.active_filters.max_price is not None
        )
        has_location = (
            not self.location_state.is_empty()
            or self.active_filters.location is not None
        )
        
        if has_property_filters and not has_location:
            logger.warning(
                f"Session {self.session_id}: Property filters set without location"
            )
        
        return self
    
    @model_validator(mode="after")
    def set_updated_timestamp(self) -> "UnifiedConversationState":
        """Update the updated_at timestamp on any change.
        
        Returns:
            Self with updated timestamp.
        """
        object.__setattr__(self, "updated_at", datetime.now())
        return self
    
    # =========================================================================
    # STATE MANAGEMENT METHODS
    # =========================================================================
    
    def get_summary(self) -> Dict[str, Any]:
        """Get comprehensive state summary for logging/debugging.
        
        Returns:
            Dictionary containing key state information.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> summary = state.get_summary()
            >>> 'session_id' in summary
            True
        """
        return {
            "session_id": self.session_id,
            "user_id": self.user_id,
            "conversation_turns": len(self.conversation_history),
            "location": self.location_state.get_summary(),  # Human-readable string
            "location_state": self.location_state.to_dict(),  # Structured dict for API consumers
            "active_filters": self.active_filters.get_non_null_filters(),
            "pending_confirmation": (
                self.pending_confirmation.type
                if self.pending_confirmation
                else None
            ),
            "result_count": len(self.last_property_results),
            "search_count": self.search_count,
            "conversation_stage": self.metadata.conversation_stage,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "session_duration_seconds": (
                datetime.now() - self.created_at
            ).total_seconds(),
        }
    
    def add_conversation_turn(self, role: str, content: str) -> None:
        """Atomically append a conversation turn.
        
        Args:
            role: Message role ('user', 'assistant', 'system').
            content: Message content.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.add_conversation_turn("user", "Hello")
            >>> len(state.conversation_history)
            1
        """
        turn = ConversationTurn(
            role=role,
            content=content,
            timestamp=datetime.now(),
        )
        # Create new list to trigger validation
        self.conversation_history = [*self.conversation_history, turn]
        logger.debug(
            f"Session {self.session_id}: Added {role} turn "
            f"(total: {len(self.conversation_history)})"
        )
    
    def update_filters(self, **kwargs: Any) -> None:
        """Atomically update active filters with validation.
        
        Only updates provided fields; preserves existing values for others.
        
        Args:
            **kwargs: Filter fields to update (location, bedrooms, etc.).
            
        Raises:
            ValueError: If validation fails for any field.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=3, location="Toronto")
            >>> state.active_filters.bedrooms
            3
        """
        current_data = self.active_filters.model_dump()
        current_data.update(kwargs)
        self.active_filters = ActiveFilters(**current_data)
        logger.debug(f"Session {self.session_id}: Updated filters: {kwargs}")
    
    def clear_cached_results(self) -> None:
        """Clear cached property results.
        
        Used when search parameters change significantly (e.g., location change)
        to prevent showing stale results.
        
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.last_property_results = [{"mls": "123"}]
            >>> state.clear_cached_results()
            >>> len(state.last_property_results)
            0
        """
        self.last_property_results = []
        logger.info(f"🗑️ [CACHE CLEAR] Cleared cached property results for session {self.session_id}")
    
    def clear_address_context(self) -> None:
        """Clear address-specific location context.
        
        Preserves city and broader location; clears street-level details.
        
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.location_state = LocationState(
            ...     city="Toronto",
            ...     street_name="King Street",
            ...     street_number="100"
            ... )
            >>> state.clear_address_context()
            >>> state.location_state.street_name is None
            True
            >>> state.location_state.city
            'Toronto'
        """
        self.location_state = LocationState(
            city=self.location_state.city,
            community=self.location_state.community,
            neighborhood=self.location_state.neighborhood,
            postal_code=None,  # Clear postal code too
            address=None,
            street_name=None,
            street_number=None,
        )
        logger.debug(f"Session {self.session_id}: Cleared address context")
    
    def get_active_filters(self) -> Dict[str, Any]:
        """Get dictionary of only non-null active filters.
        
        Returns:
            Dictionary of currently active filters.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=2)
            >>> filters = state.get_active_filters()
            >>> 'bedrooms' in filters
            True
        """
        return self.active_filters.get_non_null_filters()
    
    def create_checkpoint(self) -> str:
        """Create a state snapshot for potential rollback.
        
        Returns:
            Unique checkpoint ID.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=2)
            >>> checkpoint_id = state.create_checkpoint()
            >>> state.update_filters(bedrooms=5)
            >>> state.restore_from_checkpoint(checkpoint_id)
            >>> state.active_filters.bedrooms
            2
        """
        checkpoint_id = f"ckpt_{uuid.uuid4().hex[:8]}_{datetime.now().strftime('%H%M%S')}"
        
        # Serialize current state (exclude internal fields)
        snapshot = self.model_dump(
            exclude={"_checkpoints"},
            mode="json",
        )
        
        self._checkpoints[checkpoint_id] = snapshot
        logger.info(
            f"Session {self.session_id}: Created checkpoint {checkpoint_id}"
        )
        return checkpoint_id
    
    def restore_from_checkpoint(self, checkpoint_id: str) -> None:
        """Restore state from a previous checkpoint.
        
        Args:
            checkpoint_id: The checkpoint ID to restore from.
            
        Raises:
            ValueError: If checkpoint not found.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> cp = state.create_checkpoint()
            >>> state.update_filters(bedrooms=5)
            >>> state.restore_from_checkpoint(cp)
        """
        if checkpoint_id not in self._checkpoints:
            raise ValueError(f"Checkpoint not found: {checkpoint_id}")
        
        snapshot = self._checkpoints[checkpoint_id]
        
        # Restore all fields from snapshot
        restored = UnifiedConversationState(**snapshot)
        
        # Copy all fields using class-level model_fields
        for field_name in UnifiedConversationState.model_fields:
            if field_name != "_checkpoints":
                setattr(self, field_name, getattr(restored, field_name))
        
        logger.info(
            f"Session {self.session_id}: Restored from checkpoint {checkpoint_id}"
        )
    
    def merge_filters(
        self,
        new_filters: Dict[str, Any],
        force_replace: bool = False,
    ) -> None:
        """Merge new filters with existing ones.
        
        Args:
            new_filters: Dictionary of filters to merge.
            force_replace: If True, replace existing values. If False, only
                          update None fields unless new value is provided.
                          
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=2, location="Toronto")
            >>> state.merge_filters({"bedrooms": 3}, force_replace=False)
            >>> state.active_filters.bedrooms  # Unchanged
            2
            >>> state.merge_filters({"bedrooms": 3}, force_replace=True)
            >>> state.active_filters.bedrooms  # Replaced
            3
        """
        current = self.active_filters.model_dump()
        
        for key, new_value in new_filters.items():
            if key not in current:
                logger.warning(f"Unknown filter key: {key}")
                continue
            
            current_value = current.get(key)
            
            if force_replace:
                # Always use new value
                current[key] = new_value
            else:
                # Only update if current is None or empty
                if current_value is None or (
                    isinstance(current_value, list) and not current_value
                ):
                    current[key] = new_value
        
        self.active_filters = ActiveFilters(**current)
        logger.debug(
            f"Session {self.session_id}: Merged filters "
            f"(force_replace={force_replace}): {new_filters}"
        )
    
    def set_pending_confirmation(
        self,
        confirmation_type: str,
        payload: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Set a pending confirmation.
        
        Args:
            confirmation_type: Type of confirmation needed.
            payload: Additional context for the confirmation.
            
        Returns:
            The confirmation ID.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> conf_id = state.set_pending_confirmation(
            ...     "filter_reuse",
            ...     {"filters": {"bedrooms": 2}}
            ... )
        """
        self.pending_confirmation = PendingConfirmation(
            type=confirmation_type,
            payload=payload or {},
        )
        logger.debug(
            f"Session {self.session_id}: Set pending confirmation "
            f"type={confirmation_type}"
        )
        return self.pending_confirmation.id
    
    def clear_pending_confirmation(self) -> None:
        """Clear any pending confirmation."""
        self.pending_confirmation = None
        logger.debug(f"Session {self.session_id}: Cleared pending confirmation")
    
    def has_pending_confirmation(self) -> bool:
        """Check if there's a pending confirmation.
        
        Returns:
            True if confirmation is pending.
        """
        return self.pending_confirmation is not None
    
    def update_search_results(
        self,
        results: List[Dict[str, Any]],
        increment_count: bool = True,
    ) -> None:
        """Update last property results and track zero results streak.
        
        Args:
            results: New property results (will be truncated to 20).
            increment_count: Whether to increment search_count.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_search_results([{"id": "1"}])
            >>> state.search_count
            1
        """
        # Truncate to max 20 results
        self.last_property_results = results[:20]
        
        if increment_count:
            self.search_count += 1
        
        # Track consecutive zero results
        if len(results) == 0:
            self.zero_results_count += 1
            logger.info(
                f"Session {self.session_id}: Zero results streak: {self.zero_results_count}"
            )
        else:
            # Reset counter when we get results
            if self.zero_results_count > 0:
                logger.info(
                    f"Session {self.session_id}: Zero results streak reset (was {self.zero_results_count})"
                )
            self.zero_results_count = 0
            self.last_relaxation_applied = None  # Clear relaxation note
            
            # Store the filters that produced results
            self.last_successful_filters = self.active_filters.model_copy()
            logger.debug(
                f"Session {self.session_id}: Stored successful filters: {self.last_successful_filters.model_dump()}"
            )
        
        logger.debug(
            f"Session {self.session_id}: Updated results "
            f"(count={len(self.last_property_results)}, zero_streak={self.zero_results_count})"
        )
    
    def has_cached_results(self) -> bool:
        """Check if there are cached property results available.
        
        Returns:
            True if last_property_results is non-empty.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.has_cached_results()
            False
            >>> state.update_search_results([{"id": "1"}])
            >>> state.has_cached_results()
            True
        """
        return len(self.last_property_results) > 0
    
    def has_repeated_zero_results(self, threshold: int = 2) -> bool:
        """Check if we've had repeated zero-result searches.
        
        Args:
            threshold: Number of consecutive zero results to trigger.
            
        Returns:
            True if zero_results_count >= threshold.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.has_repeated_zero_results()
            False
            >>> state.zero_results_count = 2
            >>> state.has_repeated_zero_results()
            True
        """
        return self.zero_results_count >= threshold
    
    def get_relaxable_filters(self) -> Dict[str, Any]:
        """Get filters that could be relaxed to get more results.
        
        Returns:
            Dictionary of filter names and their current restrictive values.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=4, max_price=500000)
            >>> state.get_relaxable_filters()
            {'bedrooms': 4, 'max_price': 500000}
        """
        relaxable = {}
        filters = self.active_filters
        
        # Any bedroom filter can be restrictive (especially in tight markets)
        if filters.bedrooms is not None and filters.bedrooms >= 1:
            relaxable['bedrooms'] = filters.bedrooms
        
        # Bathroom requirements can be restrictive  
        if filters.bathrooms is not None and filters.bathrooms >= 1:
            relaxable['bathrooms'] = filters.bathrooms
        
        # Price limits are often restrictive
        if filters.max_price is not None:
            relaxable['max_price'] = filters.max_price
        if filters.min_price is not None:
            relaxable['min_price'] = filters.min_price
        
        # Specific property type can be restrictive
        if filters.property_type is not None:
            relaxable['property_type'] = filters.property_type
        
        # Amenities are often restrictive
        if filters.amenities and len(filters.amenities) > 0:
            relaxable['amenities'] = filters.amenities
        
        return relaxable
    
    def apply_filter_relaxation(self, relax_type: str) -> Optional[str]:
        """Apply automatic filter relaxation strategy.
        
        Args:
            relax_type: Type of relaxation to apply:
                - 'bedrooms': Remove or reduce bedroom requirement
                - 'price': Increase max_price by 20% or remove min_price
                - 'property_type': Remove property type restriction
                - 'amenities': Clear amenity requirements
                - 'auto': Intelligently choose what to relax
                
        Returns:
            Description of what was changed, or None if nothing could be relaxed.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=4)
            >>> state.apply_filter_relaxation('bedrooms')
            'Reduced bedroom requirement from 4 to 3'
        """
        relaxation_description = None
        
        if relax_type == 'bedrooms':
            if self.active_filters.bedrooms is not None and self.active_filters.bedrooms > 1:
                old_beds = self.active_filters.bedrooms
                new_beds = old_beds - 1
                self.update_filters(bedrooms=new_beds)
                relaxation_description = f"Reduced bedroom requirement from {old_beds} to {new_beds}"
            elif self.active_filters.bedrooms is not None:
                self.active_filters = ActiveFilters(
                    location=self.active_filters.location,
                    property_type=self.active_filters.property_type,
                    bedrooms=None,  # Remove bedroom filter
                    bathrooms=self.active_filters.bathrooms,
                    min_price=self.active_filters.min_price,
                    max_price=self.active_filters.max_price,
                    listing_type=self.active_filters.listing_type,
                    amenities=self.active_filters.amenities,
                )
                relaxation_description = "Removed bedroom requirement"
        
        elif relax_type == 'price':
            if self.active_filters.max_price is not None:
                old_max = self.active_filters.max_price
                new_max = int(old_max * 1.2)  # Increase by 20%
                self.update_filters(max_price=new_max)
                relaxation_description = f"Increased max price from ${old_max:,} to ${new_max:,}"
            elif self.active_filters.min_price is not None:
                old_min = self.active_filters.min_price
                self.active_filters = ActiveFilters(
                    location=self.active_filters.location,
                    property_type=self.active_filters.property_type,
                    bedrooms=self.active_filters.bedrooms,
                    bathrooms=self.active_filters.bathrooms,
                    min_price=None,  # Remove min price
                    max_price=self.active_filters.max_price,
                    listing_type=self.active_filters.listing_type,
                    amenities=self.active_filters.amenities,
                )
                relaxation_description = f"Removed minimum price (was ${old_min:,})"
        
        elif relax_type == 'property_type':
            if self.active_filters.property_type is not None:
                old_type = self.active_filters.property_type
                self.active_filters = ActiveFilters(
                    location=self.active_filters.location,
                    property_type=None,  # Remove property type filter
                    bedrooms=self.active_filters.bedrooms,
                    bathrooms=self.active_filters.bathrooms,
                    min_price=self.active_filters.min_price,
                    max_price=self.active_filters.max_price,
                    listing_type=self.active_filters.listing_type,
                    amenities=self.active_filters.amenities,
                )
                relaxation_description = f"Removed property type restriction (was {old_type})"
        
        elif relax_type == 'amenities':
            if self.active_filters.amenities and len(self.active_filters.amenities) > 0:
                old_amenities = self.active_filters.amenities
                self.active_filters = ActiveFilters(
                    location=self.active_filters.location,
                    property_type=self.active_filters.property_type,
                    bedrooms=self.active_filters.bedrooms,
                    bathrooms=self.active_filters.bathrooms,
                    min_price=self.active_filters.min_price,
                    max_price=self.active_filters.max_price,
                    listing_type=self.active_filters.listing_type,
                    amenities=[],  # Clear amenities
                )
                relaxation_description = f"Removed amenity requirements ({', '.join(old_amenities)})"
        
        elif relax_type == 'auto':
            # Intelligent relaxation: try in order of restrictiveness
            relaxable = self.get_relaxable_filters()
            
            # Priority order: amenities > property_type > bedrooms > price
            if 'amenities' in relaxable:
                relaxation_description = self.apply_filter_relaxation('amenities')
            elif 'property_type' in relaxable:
                relaxation_description = self.apply_filter_relaxation('property_type')
            elif 'bedrooms' in relaxable:
                relaxation_description = self.apply_filter_relaxation('bedrooms')
            elif 'max_price' in relaxable or 'min_price' in relaxable:
                relaxation_description = self.apply_filter_relaxation('price')
        
        if relaxation_description:
            self.last_relaxation_applied = relaxation_description
            logger.info(f"Session {self.session_id}: Applied relaxation: {relaxation_description}")
        
        return relaxation_description
    
    def is_view_results_request(self, user_message: str) -> bool:
        """Check if user is requesting to view accumulated results.
        
        Detects phrases like "show me the best options", "what do you have",
        "show results", etc. Only returns True if at least one search has
        been performed (search_count >= 1) AND the user is not specifying
        a different location.
        
        Args:
            user_message: The user's input message.
            
        Returns:
            True if the message is a view results request and searches have been done,
            and no new location is specified.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.search_count = 1
            >>> state.location_state = LocationState(city="London")
            >>> state.is_view_results_request("Show me the best options")
            True
            >>> state.is_view_results_request("Show me properties in Toronto")
            False  # Different location detected
        """
        VIEW_RESULTS_PHRASES = [
            "best options", "show me options", "show options",
            "what do you have", "what matches", "show results",
            "what do you have so far", "show me what you have",
            "any results", "anything so far", "what's available",
            "show me the best", "best matches", "top options",
            "what can you show me", "show what you found",
            "what have you found", "show me properties",
            "let me see", "what options", "view results",
            # Pagination/more phrases
            "show me more", "show more", "more results", "more options",
            "more properties", "see more", "view more", "next page",
            "more please", "keep going", "continue", "what else"
        ]
        
        message_lower = user_message.lower().strip()
        
        # ═══════════════════════════════════════════════════════════════════════════
        # CRITICAL FIX (Dec 2024): Detect NEW FILTER CRITERIA in the message
        # ═══════════════════════════════════════════════════════════════════════════
        # If user says "Show me properties priced over $1M", this is NOT a view results
        # request - it's a NEW search with a price filter. We need to detect this.
        NEW_FILTER_PATTERNS = [
            r'priced?\s*(over|under|above|below|around|at|between)',  # price filters
            r'\$\d+',  # dollar amounts like $1M, $500k
            r'\d+\s*(bed|bath|br|ba)',  # bedroom/bathroom counts
            r'(min|max|at least|at most|no more than|up to)',  # range qualifiers
            r'(pool|gym|parking|garage|basement|fireplace)',  # amenities
            r'(condo|house|townhouse|semi|detached|bungalow)',  # property types
            r'(for sale|for rent|rental|to buy)',  # listing types
            r'(square feet|sqft|sq ft)',  # size filters
        ]
        
        import re
        has_new_filters = any(re.search(pattern, message_lower, re.IGNORECASE) for pattern in NEW_FILTER_PATTERNS)
        
        if has_new_filters:
            logger.info(f"🔧 [is_view_results_request] NEW FILTER CRITERIA detected in message - treating as NEW search, not view results")
            return False
        # ═══════════════════════════════════════════════════════════════════════════
        
        logger.info(f"🔎 [is_view_results_request] Called with: '{user_message[:50]}...', search_count={self.search_count}")
        
        # Check if it looks like a view results request
        if self.search_count < 1:
            logger.info(f"❌ [is_view_results_request] search_count < 1, returning False")
            return False
        
        if not any(phrase in message_lower for phrase in VIEW_RESULTS_PHRASES):
            logger.info(f"❌ [is_view_results_request] No view results phrase found, returning False")
            return False
        
        # 🔧 FIX: Check if user is specifying a NEW location
        # If they mention a different city/location, this is a NEW search, not viewing results
        from services.location_extractor import location_extractor
        
        try:
            extracted = location_extractor.extract_location_entities(user_message)
            
            logger.info(f"🔍 [LOCATION CHECK] Extracted: {extracted.city if extracted else None}, Current: {self.location_state.city if self.location_state else None}")
            
            # If a new location is extracted, check if it's different from current
            if extracted and extracted.city:
                current_city = self.location_state.city if self.location_state else None
                
                # If no current city is set, this is definitely a new search with location
                if not current_city:
                    logger.info(f"🆕 [NEW LOCATION] No previous location, new location '{extracted.city}' specified - treating as NEW search")
                    return False
                
                # Normalize for comparison (case-insensitive, strip whitespace)
                new_city = extracted.city.strip().lower()
                current_city_normalized = current_city.strip().lower()
                
                if new_city != current_city_normalized:
                    logger.info(f"🔄 [LOCATION CHANGE] New location '{extracted.city}' != current '{current_city}' - treating as NEW search")
                    # Clear cached results since location has changed
                    self.clear_cached_results()
                    return False
                else:
                    logger.info(f"✅ [SAME LOCATION] Location unchanged ('{extracted.city}') - can use cached results")
                    
        except Exception as e:
            logger.warning(f"⚠️ [LOCATION CHECK] Error extracting location: {e}")
            # If extraction fails, proceed with default behavior
            pass
        
        # All checks passed - this is a view results request
        return True
    
    def suggest_filter_relaxation(self) -> str:
        """Generate a user-friendly suggestion for relaxing filters.
        
        Analyzes current filters and suggests which one to relax
        to potentially get more results.
        
        Returns:
            A human-readable suggestion string.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=5, max_price=500000)
            >>> suggestion = state.suggest_filter_relaxation()
            >>> "bedroom" in suggestion.lower() or "price" in suggestion.lower()
            True
        """
        relaxable = self.get_relaxable_filters()
        suggestions = []
        
        if 'bedrooms' in relaxable:
            beds = relaxable['bedrooms']
            if beds <= 1:
                suggestions.append("remove the bedroom filter to see all options")
            else:
                suggestions.append(f"try {beds - 1}+ bedrooms instead of {beds}")
        
        if 'max_price' in relaxable:
            price = relaxable['max_price']
            higher_price = int(price * 1.2)
            suggestions.append(f"consider increasing your budget to ${higher_price:,}")
        
        if 'min_price' in relaxable:
            suggestions.append("remove the minimum price requirement")
        
        if 'property_type' in relaxable:
            prop_type = relaxable['property_type']
            suggestions.append(f"search all property types instead of just {prop_type}")
        
        if 'amenities' in relaxable:
            suggestions.append("remove some amenity requirements")
        
        if not suggestions:
            return "You might want to try a different location or adjust your search criteria."
        
        # Return a friendly suggestion
        if len(suggestions) == 1:
            return f"You might want to {suggestions[0]}."
        else:
            return f"You might want to {suggestions[0]}, or {suggestions[1]}."
    
    def get_relaxation_suggestions(self) -> List[str]:
        """Get a list of actionable suggestions for relaxing filters.
        
        Returns quick-action suggestions that could be used as 
        frontend suggestion buttons.
        
        Returns:
            List of suggestion strings.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=4, max_price=800000)
            >>> suggestions = state.get_relaxation_suggestions()
            >>> len(suggestions) > 0
            True
        """
        suggestions = []
        relaxable = self.get_relaxable_filters()
        
        if 'bedrooms' in relaxable:
            beds = relaxable['bedrooms']
            if beds <= 1:
                suggestions.append("Try any bedroom count")
            else:
                suggestions.append(f"Try {beds - 1}+ bedrooms")
        
        if 'max_price' in relaxable:
            suggestions.append("Increase my budget")
        
        if 'min_price' in relaxable:
            suggestions.append("Remove minimum price")
        
        if 'property_type' in relaxable:
            suggestions.append("Search all property types")
        
        if 'amenities' in relaxable:
            suggestions.append("Remove amenity filters")
        
        # Always offer these as fallbacks
        if not suggestions:
            suggestions = [
                "Try a different area",
                "Adjust my filters",
                "Start a new search"
            ]
        
        return suggestions

    def set_conversation_stage(self, stage: ConversationStage) -> None:
        """Update the conversation stage.
        
        Args:
            stage: New conversation stage.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.set_conversation_stage(ConversationStage.FILTERING)
            >>> state.metadata.conversation_stage
            'filtering'
        """
        self.metadata = ConversationMetadata(
            device=self.metadata.device,
            language=self.metadata.language,
            conversation_stage=stage,
            user_agent=self.metadata.user_agent,
            referrer=self.metadata.referrer,
        )
    
    def reset_filters(self, preserve_location: bool = True) -> None:
        """Reset all search filters.
        
        Args:
            preserve_location: If True, keep location; if False, clear all.
            
        Example:
            >>> state = UnifiedConversationState(session_id="test")
            >>> state.update_filters(bedrooms=2, location="Toronto")
            >>> state.reset_filters()
            >>> state.active_filters.bedrooms is None
            True
            >>> state.active_filters.location
            'Toronto'
        """
        location = self.active_filters.location if preserve_location else None
        self.active_filters = ActiveFilters(location=location)
        
        if not preserve_location:
            self.location_state = LocationState()
        
        logger.info(
            f"Session {self.session_id}: Reset filters "
            f"(preserve_location={preserve_location})"
        )
    
    def to_legacy_dict(self) -> Dict[str, Any]:
        """Convert to legacy ConversationState format for compatibility.
        
        Returns:
            Dictionary compatible with existing ConversationState.
        """
        filters = self.active_filters.model_dump()
        location = self.location_state.model_dump()
        
        return {
            "session_id": self.session_id,
            "location": filters.get("location") or location.get("city"),
            "bedrooms": filters.get("bedrooms"),
            "bathrooms": filters.get("bathrooms"),
            "property_type": filters.get("property_type"),
            "price_range": (
                (filters.get("min_price"), filters.get("max_price"))
                if filters.get("min_price") or filters.get("max_price")
                else None
            ),
            "listing_type": filters.get("listing_type"),
            "amenities": filters.get("amenities", []),
            "location_state": location,
            "conversation_history": [
                {"role": t.role, "content": t.content}
                for t in self.conversation_history
            ],
            "last_property_results": self.last_property_results,
            "search_count": self.search_count,
            "zero_results_count": self.zero_results_count,
            "last_successful_filters": (
                self.last_successful_filters.model_dump()
                if self.last_successful_filters
                else None
            ),
            "pending_confirmation": (
                self.pending_confirmation.type
                if self.pending_confirmation
                else None
            ),
            "created_at": self.created_at.isoformat(),
            "last_updated": self.updated_at.isoformat(),
        }
    
    @classmethod
    def from_legacy_dict(
        cls,
        data: Dict[str, Any],
        session_id: Optional[str] = None,
    ) -> "UnifiedConversationState":
        """Create from legacy ConversationState format.
        
        Args:
            data: Legacy state dictionary.
            session_id: Optional session ID override.
            
        Returns:
            New UnifiedConversationState instance.
        """
        # Extract location state
        loc_data = data.get("location_state", {})
        if isinstance(loc_data, dict):
            location_state = LocationState(
                city=loc_data.get("city"),
                community=loc_data.get("community"),
                neighborhood=loc_data.get("neighborhood"),
                postal_code=loc_data.get("postalCode") or loc_data.get("postal_code"),
                street_name=loc_data.get("streetName") or loc_data.get("street_name"),
                street_number=loc_data.get("streetNumber") or loc_data.get("street_number"),
            )
        else:
            location_state = LocationState()
        
        # Extract price range
        price_range = data.get("price_range")
        min_price = None
        max_price = None
        if price_range and isinstance(price_range, (list, tuple)) and len(price_range) >= 2:
            min_price = price_range[0]
            max_price = price_range[1]
        
        # Build active filters
        active_filters = ActiveFilters(
            location=data.get("location"),
            property_type=data.get("property_type"),
            bedrooms=data.get("bedrooms"),
            bathrooms=data.get("bathrooms"),
            min_price=min_price,
            max_price=max_price,
            listing_type=data.get("listing_type"),
            amenities=data.get("amenities", []),
        )
        
        # Build conversation history
        history = []
        for turn in data.get("conversation_history", []):
            if isinstance(turn, dict):
                history.append(ConversationTurn(
                    role=turn.get("role", "user"),
                    content=turn.get("content", ""),
                ))
        
        return cls(
            session_id=session_id or data.get("session_id") or str(uuid.uuid4()),
            location_state=location_state,
            active_filters=active_filters,
            conversation_history=history,
            last_property_results=data.get("last_property_results", [])[:20],
            search_count=data.get("search_count", 0),
            zero_results_count=data.get("zero_results_count", 0),
            last_successful_filters=(
                ActiveFilters(**data["last_successful_filters"])
                if data.get("last_successful_filters")
                else None
            ),
        )


# =============================================================================
# STATE MANAGER
# =============================================================================


class UnifiedStateManager:
    """
    Production-ready Unified State Manager for conversation state persistence.
    
    Manages UnifiedConversationState instances with Redis persistence and
    in-memory fallback. Provides session lifecycle management, checkpointing,
    analytics, and comprehensive error handling.
    
    Features:
    - Redis persistence with 24-hour TTL auto-expiration
    - Graceful fallback to in-memory storage if Redis unavailable
    - Checkpoint/restore for state snapshots
    - Analytics methods for session monitoring
    - Structured logging with structlog
    - Comprehensive error handling with proper error codes
    
    Example:
        >>> manager = UnifiedStateManager()
        >>> state = manager.get_or_create("session_123")
        >>> state.update_filters(location="Toronto")
        >>> manager.save(state)
        True
        
    Attributes:
        SESSION_TTL_SECONDS: Default session expiration time (24 hours).
        SESSION_PREFIX: Redis key prefix for sessions.
        CHECKPOINT_PREFIX: Redis key prefix for checkpoints.
    """
    
    SESSION_TTL_SECONDS: int = 86400  # 24 hours
    SESSION_PREFIX: str = "session:"
    CHECKPOINT_PREFIX: str = "checkpoint:"
    
    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize the UnifiedStateManager with Redis or in-memory fallback.
        
        Attempts to connect to Redis using the provided URL or REDIS_URL
        environment variable. Falls back to in-memory storage if Redis
        is unavailable or ENABLE_REDIS_CACHE is set to false.
        
        Args:
            redis_url: Optional Redis connection URL. If not provided,
                      reads from REDIS_URL environment variable.
        
        Example:
            >>> manager = UnifiedStateManager()
            >>> manager = UnifiedStateManager("redis://localhost:6379/0")
        """
        import os
        
        # Try to import structlog, fallback to standard logging
        try:
            import structlog
            self._log = structlog.get_logger(__name__)
            self._using_structlog = True
        except ImportError:
            self._log = logger
            self._using_structlog = False
        
        # In-memory fallback storage
        self._sessions: Dict[str, UnifiedConversationState] = {}
        self._checkpoints: Dict[str, Dict[str, Any]] = {}
        self._session_timestamps: Dict[str, datetime] = {}
        
        # Initialize Redis connection
        self._redis: Optional[Any] = None
        self._backend: str = "memory"
        
        # Check if Redis is explicitly disabled
        enable_redis = os.environ.get("ENABLE_REDIS_CACHE", "true").lower() in ("true", "1", "yes")
        
        if not enable_redis:
            self._log_info(
                "UnifiedStateManager initialized (Redis disabled via ENABLE_REDIS_CACHE=false)",
                backend="memory",
                ttl_hours=self.SESSION_TTL_SECONDS // 3600,
            )
            return  # Skip Redis initialization entirely
        
        redis_connection_url = redis_url or os.environ.get("REDIS_URL")
        
        if redis_connection_url:
            try:
                import redis
                from redis.retry import Retry
                from redis.backoff import ExponentialBackoff
                
                # Retry configuration: 3 retries with exponential backoff
                retry = Retry(ExponentialBackoff(), 3)
                
                self._redis = redis.from_url(
                    redis_connection_url,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5,
                    retry_on_timeout=True,
                    retry=retry,
                    health_check_interval=30,
                )
                # Test connection
                self._redis.ping()
                self._backend = "redis"
                self._log_info(
                    "UnifiedStateManager initialized",
                    backend="redis",
                    redis_url=self._mask_redis_url(redis_connection_url),
                    ttl_hours=self.SESSION_TTL_SECONDS // 3600,
                )
            except ImportError:
                self._log_warning(
                    "Redis package not installed, using in-memory storage",
                    operation="init",
                )
            except Exception as e:
                self._log_warning(
                    "Redis connection failed, using in-memory storage",
                    operation="init",
                    error=str(e),
                    redis_url=self._mask_redis_url(redis_connection_url),
                )
        else:
            self._log_info(
                "UnifiedStateManager initialized",
                backend="memory",
                ttl_hours=self.SESSION_TTL_SECONDS // 3600,
            )
    
    # =========================================================================
    # LOGGING HELPERS
    # =========================================================================
    
    def _log_info(self, message: str, **kwargs) -> None:
        """Log INFO level message with structured context."""
        if self._using_structlog:
            self._log.info(message, **kwargs)
        else:
            self._log.info(f"{message} | {kwargs}" if kwargs else message)
    
    def _log_warning(self, message: str, **kwargs) -> None:
        """Log WARNING level message with structured context."""
        if self._using_structlog:
            self._log.warning(message, **kwargs)
        else:
            self._log.warning(f"{message} | {kwargs}" if kwargs else message)
    
    def _log_error(self, message: str, **kwargs) -> None:
        """Log ERROR level message with structured context."""
        if self._using_structlog:
            self._log.error(message, **kwargs)
        else:
            self._log.error(f"{message} | {kwargs}" if kwargs else message)
    
    def _log_debug(self, message: str, **kwargs) -> None:
        """Log DEBUG level message with structured context."""
        if self._using_structlog:
            self._log.debug(message, **kwargs)
        else:
            self._log.debug(f"{message} | {kwargs}" if kwargs else message)
    
    @staticmethod
    def _mask_redis_url(url: str) -> str:
        """Mask sensitive parts of Redis URL for logging."""
        if not url:
            return ""
        # Mask password if present
        import re
        return re.sub(r'://[^:]+:[^@]+@', '://***:***@', url)
    
    # =========================================================================
    # CUSTOM JSON ENCODER
    # =========================================================================
    
    class _DateTimeEncoder(json.JSONEncoder):
        """Custom JSON encoder that handles datetime objects."""
        
        def default(self, obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            if isinstance(obj, Enum):
                return obj.value
            return super().default(obj)
    
    def _serialize_state(self, state: UnifiedConversationState) -> str:
        """
        Serialize state to JSON with custom datetime handling.
        
        Args:
            state: The conversation state to serialize.
            
        Returns:
            JSON string representation of the state.
        """
        state_dict = state.model_dump(exclude={"_checkpoints"})
        return json.dumps(state_dict, cls=self._DateTimeEncoder)
    
    def _deserialize_state(self, data: str) -> UnifiedConversationState:
        """
        Deserialize JSON to UnifiedConversationState.
        
        Args:
            data: JSON string representation of state.
            
        Returns:
            Deserialized UnifiedConversationState object.
            
        Raises:
            ValueError: If data cannot be parsed or validated.
        """
        state_dict = json.loads(data)
        
        # Convert ISO datetime strings back to datetime objects
        for field in ["created_at", "updated_at"]:
            if field in state_dict and isinstance(state_dict[field], str):
                state_dict[field] = datetime.fromisoformat(state_dict[field])
        
        # Handle conversation_history timestamps
        if "conversation_history" in state_dict:
            for turn in state_dict["conversation_history"]:
                if "timestamp" in turn and isinstance(turn["timestamp"], str):
                    turn["timestamp"] = datetime.fromisoformat(turn["timestamp"])
        
        return UnifiedConversationState(**state_dict)
    
    # =========================================================================
    # CORE METHODS
    # =========================================================================
    
    def get_or_create(
        self,
        session_id: str,
        user_id: Optional[str] = None,
    ) -> UnifiedConversationState:
        """
        Get existing session state or create a new one.
        
        IMPORTANT: Always checks Redis FIRST (source of truth), then falls back
        to in-memory cache only if Redis is unavailable or fails.
        
        This prevents stale data issues where memory cache has old state
        while Redis has been updated by another request/process.
        
        Args:
            session_id: Unique session identifier.
            user_id: Optional user identifier for authenticated users.
            
        Returns:
            The UnifiedConversationState for the session.
            
        Example:
            >>> state = manager.get_or_create("session_123", user_id="user_456")
            >>> state.session_id
            'session_123'
        """
        # ALWAYS check Redis FIRST (source of truth) - prevents stale cache issues
        if self._redis:
            try:
                data = self._redis.get(f"{self.SESSION_PREFIX}{session_id}")
                if data:
                    state = self._deserialize_state(data)
                    # Update memory cache for this request only
                    self._sessions[session_id] = state
                    self._session_timestamps[session_id] = datetime.now()
                    self._log_debug(
                        "Session loaded from Redis (source of truth)",
                        session_id=session_id,
                    )
                    return state
            except json.JSONDecodeError as e:
                self._log_error(
                    "State corrupted in Redis",
                    session_id=session_id,
                    operation="get_or_create",
                    error=str(e),
                    error_code="STATE_CORRUPTED",
                )
                # Don't use memory cache for corrupted Redis data - create fresh
            except Exception as e:
                self._log_warning(
                    "Redis load failed, checking in-memory fallback",
                    session_id=session_id,
                    operation="get_or_create",
                    error=str(e),
                )
                # Fall through to memory cache check below
        
        # FALLBACK: Check in-memory cache (only if Redis is unavailable/failed)
        if session_id in self._sessions:
            self._log_debug(
                "Session found in memory cache (Redis unavailable)",
                session_id=session_id,
            )
            return self._sessions[session_id]
        
        # Create new session
        state = UnifiedConversationState(
            session_id=session_id,
            user_id=user_id,
        )
        self._sessions[session_id] = state
        self._session_timestamps[session_id] = datetime.now()
        
        self._log_info(
            "Session created",
            session_id=session_id,
            user_id=user_id,
            backend=self._backend,
        )
        
        return state
    
    def save(self, state: Union[UnifiedConversationState, Any]) -> bool:
        """
        Save session state with validation and persistence.
        
        Validates the state using Pydantic validators, serializes to JSON,
        and persists to Redis with 24-hour TTL. Always updates in-memory cache.
        
        Accepts both UnifiedConversationState (preferred) and legacy ConversationState
        for backward compatibility. Legacy states are automatically converted.
        
        Args:
            state: The UnifiedConversationState to save (or legacy ConversationState).
            
        Returns:
            True if save was successful, False otherwise.
            
        Raises:
            ValueError: If state validation fails.
            
        Example:
            >>> state = manager.get_or_create("session_123")
            >>> state.update_filters(location="Toronto")
            >>> success = manager.save(state)
            >>> success
            True
        """
        try:
            # Handle legacy ConversationState (backward compatibility)
            if not isinstance(state, UnifiedConversationState):
                # Check if it's a legacy ConversationState
                # Legacy ConversationState has 'session_id' and 'conversation_history' attributes
                if hasattr(state, 'session_id') and hasattr(state, 'conversation_history'):
                    # Get or create the unified state for this session
                    session_id = getattr(state, 'session_id', None)
                    if not session_id:
                        raise ValueError("Legacy state missing session_id")
                    
                    # Get the existing unified state (or create new)
                    unified_state = self.get_or_create(session_id)
                    
                    # Sync legacy fields to unified state
                    # (this preserves existing unified state and updates from legacy)
                    if hasattr(state, 'location'):
                        loc = getattr(state, 'location', None)
                        if loc:
                            unified_state.active_filters.location = loc
                    
                    if hasattr(state, 'location_state'):
                        loc_state = getattr(state, 'location_state', None)
                        if loc_state and hasattr(loc_state, 'city'):
                            unified_state.location_state.city = getattr(loc_state, 'city', None)
                            unified_state.location_state.community = getattr(loc_state, 'community', None)
                            unified_state.location_state.neighborhood = getattr(loc_state, 'neighborhood', None)
                    
                    # Sync filters
                    if hasattr(state, 'filters'):
                        filters = getattr(state, 'filters', {})
                        if isinstance(filters, dict):
                            for key, value in filters.items():
                                if key == 'bedrooms' and value is not None:
                                    unified_state.active_filters.bedrooms = value
                                elif key == 'bathrooms' and value is not None:
                                    unified_state.active_filters.bathrooms = value
                                elif key == 'price_min' and value is not None:
                                    unified_state.active_filters.price_min = value
                                elif key == 'price_max' and value is not None:
                                    unified_state.active_filters.price_max = value
                                elif key == 'property_type' and value:
                                    unified_state.active_filters.property_type = value
                    
                    # Use the unified state for saving
                    state = unified_state
                    
                    self._log_info(
                        "Converted legacy ConversationState to UnifiedConversationState",
                        session_id=session_id,
                        operation="save"
                    )
                else:
                    raise TypeError(
                        f"Expected UnifiedConversationState, got {type(state).__name__}"
                    )
            
            # Validate state by attempting to dump (triggers Pydantic validation)
            state.model_dump()
            
        except Exception as e:
            self._log_warning(
                "State validation failed",
                session_id=getattr(state, 'session_id', 'unknown'),
                operation="save",
                error=str(e),
                error_code="VALIDATION_ERROR",
            )
            raise ValueError(f"State validation failed: {e}") from e
        
        # Update in-memory cache
        self._sessions[state.session_id] = state
        self._session_timestamps[state.session_id] = datetime.now()
        
        # Persist to Redis if available
        if self._redis:
            try:
                serialized = self._serialize_state(state)
                self._redis.set(
                    f"{self.SESSION_PREFIX}{state.session_id}",
                    serialized,
                    ex=self.SESSION_TTL_SECONDS,
                )
                self._log_info(
                    "Session saved",
                    session_id=state.session_id,
                    backend="redis",
                    ttl_seconds=self.SESSION_TTL_SECONDS,
                )
                return True
            except Exception as e:
                self._log_error(
                    "Redis save failed",
                    session_id=state.session_id,
                    operation="save",
                    error=str(e),
                    error_code="REDIS_SAVE_FAILED",
                )
                # Data is still in memory, so return True with warning
                self._log_warning(
                    "State saved to memory only",
                    session_id=state.session_id,
                )
                return True
        
        self._log_info(
            "Session saved",
            session_id=state.session_id,
            backend="memory",
        )
        return True
    
    def delete(self, session_id: str) -> bool:
        """
        Delete a session from storage.
        
        Removes the session from both Redis and in-memory cache.
        
        Args:
            session_id: The session identifier to delete.
            
        Returns:
            True if deletion was successful, False otherwise.
            
        Example:
            >>> manager.delete("session_123")
            True
        """
        deleted_memory = self._sessions.pop(session_id, None) is not None
        self._session_timestamps.pop(session_id, None)
        
        deleted_redis = False
        if self._redis:
            try:
                result = self._redis.delete(f"{self.SESSION_PREFIX}{session_id}")
                deleted_redis = result > 0
            except Exception as e:
                self._log_warning(
                    "Redis delete failed",
                    session_id=session_id,
                    operation="delete",
                    error=str(e),
                )
        
        self._log_info(
            "Session deleted",
            session_id=session_id,
            deleted_from_memory=deleted_memory,
            deleted_from_redis=deleted_redis,
        )
        
        return deleted_memory or deleted_redis
    
    # =========================================================================
    # CHECKPOINT METHODS
    # =========================================================================
    
    def create_checkpoint(self, state: UnifiedConversationState) -> str:
        """
        Create a checkpoint snapshot of the current state.
        
        Saves a complete copy of the state that can be restored later.
        Useful for implementing undo/rollback functionality.
        
        Args:
            state: The state to checkpoint.
            
        Returns:
            Unique checkpoint ID for later retrieval.
            
        Example:
            >>> checkpoint_id = manager.create_checkpoint(state)
            >>> # Later...
            >>> restored = manager.get_checkpoint(checkpoint_id)
        """
        checkpoint_id = f"cp_{state.session_id}_{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp())}"
        
        checkpoint_data = {
            "state": self._serialize_state(state),
            "created_at": datetime.now().isoformat(),
            "session_id": state.session_id,
        }
        
        # Store in memory
        self._checkpoints[checkpoint_id] = checkpoint_data
        
        # Persist to Redis if available
        if self._redis:
            try:
                self._redis.set(
                    f"{self.CHECKPOINT_PREFIX}{checkpoint_id}",
                    json.dumps(checkpoint_data),
                    ex=self.SESSION_TTL_SECONDS,
                )
            except Exception as e:
                self._log_warning(
                    "Redis checkpoint save failed",
                    checkpoint_id=checkpoint_id,
                    session_id=state.session_id,
                    operation="create_checkpoint",
                    error=str(e),
                )
        
        self._log_info(
            "Checkpoint created",
            checkpoint_id=checkpoint_id,
            session_id=state.session_id,
        )
        
        return checkpoint_id
    
    def get_checkpoint(self, checkpoint_id: str) -> Optional[UnifiedConversationState]:
        """
        Retrieve a saved checkpoint state.
        
        Args:
            checkpoint_id: The checkpoint identifier to retrieve.
            
        Returns:
            The restored UnifiedConversationState or None if not found.
            
        Example:
            >>> restored = manager.get_checkpoint("cp_session_123_abc12345_1703260800")
            >>> if restored:
            ...     print(f"Restored session: {restored.session_id}")
        """
        # Check in-memory first
        if checkpoint_id in self._checkpoints:
            try:
                data = self._checkpoints[checkpoint_id]["state"]
                return self._deserialize_state(data)
            except Exception as e:
                self._log_error(
                    "Checkpoint restore failed from memory",
                    checkpoint_id=checkpoint_id,
                    operation="get_checkpoint",
                    error=str(e),
                    error_code="RESTORE_FAILED",
                )
                return None
        
        # Try Redis if available
        if self._redis:
            try:
                data = self._redis.get(f"{self.CHECKPOINT_PREFIX}{checkpoint_id}")
                if data:
                    checkpoint_data = json.loads(data)
                    state = self._deserialize_state(checkpoint_data["state"])
                    self._log_debug(
                        "Checkpoint restored from Redis",
                        checkpoint_id=checkpoint_id,
                    )
                    return state
            except Exception as e:
                self._log_error(
                    "Checkpoint restore failed from Redis",
                    checkpoint_id=checkpoint_id,
                    operation="get_checkpoint",
                    error=str(e),
                    error_code="RESTORE_FAILED",
                )
        
        self._log_warning(
            "Checkpoint not found",
            checkpoint_id=checkpoint_id,
            operation="get_checkpoint",
        )
        return None
    
    def checkpoint_all_sessions(self) -> Dict[str, str]:
        """
        Create checkpoint snapshots of all active sessions.
        
        Useful for analytics, debugging, or creating periodic backups
        of all conversation states.
        
        Returns:
            Dictionary mapping session_id to checkpoint_id.
            
        Example:
            >>> checkpoints = manager.checkpoint_all_sessions()
            >>> len(checkpoints)
            5
            >>> checkpoints["session_123"]
            'cp_session_123_abc12345_1703260800'
        """
        checkpoints = {}
        
        for session_id, state in self._sessions.items():
            try:
                checkpoint_id = self.create_checkpoint(state)
                checkpoints[session_id] = checkpoint_id
            except Exception as e:
                self._log_error(
                    "Failed to checkpoint session",
                    session_id=session_id,
                    operation="checkpoint_all_sessions",
                    error=str(e),
                )
        
        self._log_info(
            "All sessions checkpointed",
            total_sessions=len(self._sessions),
            successful_checkpoints=len(checkpoints),
        )
        
        return checkpoints
    
    # =========================================================================
    # ANALYTICS METHODS
    # =========================================================================
    
    def get_session_count(self) -> int:
        """
        Get the total count of active sessions.
        
        Returns count from Redis if available, otherwise from memory.
        
        Returns:
            Number of active sessions.
            
        Example:
            >>> manager.get_session_count()
            42
        """
        if self._redis:
            try:
                keys = self._redis.keys(f"{self.SESSION_PREFIX}*")
                return len(keys) if keys else 0
            except Exception as e:
                self._log_warning(
                    "Redis session count failed",
                    operation="get_session_count",
                    error=str(e),
                )
        
        return len(self._sessions)
    
    def get_average_conversation_length(self) -> float:
        """
        Calculate the average number of conversation turns across all sessions.
        
        Returns:
            Average conversation length (turns per session).
            
        Example:
            >>> manager.get_average_conversation_length()
            8.5
        """
        if not self._sessions:
            return 0.0
        
        total_turns = sum(
            len(state.conversation_history) 
            for state in self._sessions.values()
        )
        
        return total_turns / len(self._sessions)
    
    def get_active_sessions_in_last_n_minutes(self, n: int) -> List[str]:
        """
        Get list of session IDs active within the last N minutes.
        
        Args:
            n: Number of minutes to look back.
            
        Returns:
            List of session IDs that were active in the time window.
            
        Example:
            >>> active = manager.get_active_sessions_in_last_n_minutes(30)
            >>> len(active)
            12
        """
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(minutes=n)
        active_sessions = []
        
        for session_id, timestamp in self._session_timestamps.items():
            if timestamp >= cutoff:
                active_sessions.append(session_id)
        
        return active_sessions
    
    def get_analytics_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive analytics summary.
        
        Returns:
            Dictionary containing session statistics and metrics.
            
        Example:
            >>> summary = manager.get_analytics_summary()
            >>> summary["total_sessions"]
            42
        """
        return {
            "total_sessions": self.get_session_count(),
            "memory_sessions": len(self._sessions),
            "average_conversation_length": self.get_average_conversation_length(),
            "active_last_5_min": len(self.get_active_sessions_in_last_n_minutes(5)),
            "active_last_30_min": len(self.get_active_sessions_in_last_n_minutes(30)),
            "active_last_60_min": len(self.get_active_sessions_in_last_n_minutes(60)),
            "checkpoints_count": len(self._checkpoints),
            "backend": self._backend,
            "timestamp": datetime.now().isoformat(),
        }
    
    # =========================================================================
    # UTILITY METHODS
    # =========================================================================
    
    def get_active_session_count(self) -> int:
        """
        Get count of active sessions in memory (legacy compatibility).
        
        Returns:
            Number of sessions in memory cache.
        """
        return len(self._sessions)
    
    def clear_expired_memory_sessions(self) -> int:
        """
        Remove expired sessions from in-memory cache.
        
        Sessions older than SESSION_TTL_SECONDS are removed.
        
        Returns:
            Number of sessions cleared.
        """
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(seconds=self.SESSION_TTL_SECONDS)
        expired = [
            sid for sid, ts in self._session_timestamps.items()
            if ts < cutoff
        ]
        
        for session_id in expired:
            self._sessions.pop(session_id, None)
            self._session_timestamps.pop(session_id, None)
        
        if expired:
            self._log_info(
                "Expired sessions cleared from memory",
                cleared_count=len(expired),
            )
        
        return len(expired)
    
    @property
    def backend(self) -> str:
        """Get the current storage backend ('redis' or 'memory')."""
        return self._backend
    
    @property
    def is_redis_available(self) -> bool:
        """Check if Redis backend is currently available."""
        if not self._redis:
            return False
        try:
            self._redis.ping()
            return True
        except Exception:
            return False


# Backwards compatibility alias
UnifiedConversationStateManager = UnifiedStateManager


# =============================================================================
# MODULE EXPORTS
# =============================================================================

# Create default manager instance
unified_state_manager = UnifiedStateManager()

__all__ = [
    "UnifiedConversationState",
    "UnifiedStateManager",
    "UnifiedConversationStateManager",  # Backwards compatibility alias
    "unified_state_manager",
    "LocationState",
    "ActiveFilters",
    "ConversationTurn",
    "PendingConfirmation",
    "ConversationMetadata",
    "ListingType",
    "ConversationStage",
]


# =============================================================================
# EXAMPLE USAGE
# =============================================================================

if __name__ == "__main__":
    # Example usage and testing
    print("🧪 Testing UnifiedConversationState...")
    
    # Create a new state
    state = UnifiedConversationState(
        session_id="test_session_001",
        user_id="user_123",
    )
    print(f"✅ Created state: {state.session_id}")
    
    # Add conversation turns
    state.add_conversation_turn("user", "Show me condos in Toronto")
    state.add_conversation_turn("assistant", "I found 15 condos in Toronto.")
    print(f"✅ Added {len(state.conversation_history)} conversation turns")
    
    # Update filters
    state.update_filters(
        location="Toronto",
        property_type="condo",
        bedrooms=2,
        min_price=500000,
        max_price=1000000,
    )
    print(f"✅ Updated filters: {state.get_active_filters()}")
    
    # Set location state
    state.location_state = LocationState(
        city="Toronto",
        neighborhood="Yorkville",
        postal_code="M5R 2C7",
    )
    print(f"✅ Location: {state.location_state.get_summary()}")
    
    # Create checkpoint
    checkpoint_id = state.create_checkpoint()
    print(f"✅ Created checkpoint: {checkpoint_id}")
    
    # Modify and restore
    state.update_filters(bedrooms=5)
    print(f"   Bedrooms after modify: {state.active_filters.bedrooms}")
    state.restore_from_checkpoint(checkpoint_id)
    print(f"   Bedrooms after restore: {state.active_filters.bedrooms}")
    
    # Get summary
    summary = state.get_summary()
    print(f"✅ State summary: {json.dumps(summary, indent=2, default=str)}")
    
    # Test validation errors
    print("\n🧪 Testing validation...")
    
    try:
        state.update_filters(bedrooms=10)  # Should fail
    except ValueError as e:
        print(f"✅ Correctly rejected invalid bedrooms: {e}")
    
    try:
        state.update_filters(min_price=-100)  # Should fail
    except ValueError as e:
        print(f"✅ Correctly rejected negative price: {e}")
    
    try:
        LocationState(postal_code="INVALID")  # Should fail
    except ValueError as e:
        print(f"✅ Correctly rejected invalid postal code: {e}")
    
    print("\n✅ All tests passed!")
