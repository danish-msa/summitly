"""
Atomic Transaction Manager
===========================
Provides safe, atomic state updates with rollback capabilities for conversation state.

Features:
- Transaction-based state updates with automatic checkpointing
- Full rollback on failure
- Comprehensive transaction logging
- Support for multiple transaction types
- Validation before applying changes

Transaction Types:
- FILTER_UPDATE: Modify search criteria
- STATE_RESTORE: Revert to checkpoint
- CONFIRMATION_APPLY: Apply confirmation response
- SEARCH_EXECUTE: Run MLS search and update results
- PROPERTY_VIEW: Record property viewing

Author: Summitly Team
Date: December 2025
"""

import logging
import uuid
from copy import deepcopy
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, Field, ConfigDict

from services.unified_conversation_state import (
    UnifiedConversationState,
    UnifiedStateManager,
    ActiveFilters,
    ListingType,
)

logger = logging.getLogger(__name__)


# =============================================================================
# ENUMS
# =============================================================================


class TransactionType(str, Enum):
    """Types of transactions supported by the manager.
    
    Example:
        >>> TransactionType.FILTER_UPDATE.value
        'filter_update'
    """
    FILTER_UPDATE = "filter_update"
    STATE_RESTORE = "state_restore"
    CONFIRMATION_APPLY = "confirmation_apply"
    SEARCH_EXECUTE = "search_execute"
    PROPERTY_VIEW = "property_view"


class TransactionStatus(str, Enum):
    """Status of a transaction.
    
    Example:
        >>> TransactionStatus.SUCCESS.value
        'success'
    """
    SUCCESS = "success"
    FAILED = "failed"
    ROLLED_BACK = "rolled_back"


# =============================================================================
# MODELS
# =============================================================================


class TransactionLog(BaseModel):
    """Log entry for a single transaction.
    
    Example:
        >>> log = TransactionLog(
        ...     transaction_id="abc123",
        ...     transaction_type=TransactionType.FILTER_UPDATE,
        ...     session_id="session_1",
        ...     status=TransactionStatus.SUCCESS
        ... )
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    transaction_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique transaction identifier",
    )
    transaction_type: TransactionType = Field(
        ...,
        description="Type of transaction",
    )
    session_id: str = Field(
        ...,
        description="Session this transaction belongs to",
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="When the transaction occurred",
    )
    status: TransactionStatus = Field(
        ...,
        description="Transaction outcome",
    )
    data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Transaction payload data",
    )
    changes: Dict[str, Any] = Field(
        default_factory=dict,
        description="What changed during transaction",
    )
    error: Optional[str] = Field(
        default=None,
        description="Error message if transaction failed",
    )
    duration_ms: Optional[float] = Field(
        default=None,
        description="Transaction execution time in milliseconds",
    )


class StateCheckpoint(BaseModel):
    """Checkpoint of conversation state for rollback.
    
    Example:
        >>> checkpoint = StateCheckpoint(
        ...     checkpoint_id="chk_123",
        ...     session_id="session_1",
        ...     state_data={"filters": {}}
        ... )
    """
    
    model_config = ConfigDict(
        validate_assignment=True,
        str_strip_whitespace=True,
    )
    
    checkpoint_id: str = Field(
        default_factory=lambda: f"chk_{uuid.uuid4().hex[:12]}",
        description="Unique checkpoint identifier",
    )
    session_id: str = Field(
        ...,
        description="Session this checkpoint belongs to",
    )
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="When checkpoint was created",
    )
    state_data: Dict[str, Any] = Field(
        ...,
        description="Serialized state data",
    )
    transaction_id: Optional[str] = Field(
        default=None,
        description="Transaction that created this checkpoint",
    )
    description: Optional[str] = Field(
        default=None,
        description="Human-readable checkpoint description",
    )


# =============================================================================
# ATOMIC TRANSACTION MANAGER
# =============================================================================


class AtomicTransactionManager:
    """
    Manages atomic state updates with automatic checkpointing and rollback.
    
    Usage:
        >>> manager = AtomicTransactionManager(state_manager)
        >>> success, result, error = manager.execute_transaction(
        ...     transaction_type="filter_update",
        ...     session_id="session_1",
        ...     data={"filters": {"min_price": 500000}},
        ...     rollback_on_failure=True
        ... )
        >>> if success:
        ...     print(f"Updated state: {result}")
        >>> else:
        ...     print(f"Transaction failed: {error}")
    
    Features:
        - Automatic checkpoint creation before each transaction
        - Validation before applying changes
        - Full rollback on failure
        - Comprehensive transaction logging
        - Support for multiple transaction types
    """
    
    def __init__(
        self,
        state_manager: UnifiedStateManager,
        max_checkpoints: int = 10,
        max_logs: int = 1000,
    ):
        """Initialize the transaction manager.
        
        Args:
            state_manager: State manager for accessing/updating state
            max_checkpoints: Maximum checkpoints to keep per session
            max_logs: Maximum transaction logs to keep per session
        """
        self.state_manager = state_manager
        self.max_checkpoints = max_checkpoints
        self.max_logs = max_logs
        
        # In-memory storage (could be Redis/DB in production)
        self._checkpoints: Dict[str, List[StateCheckpoint]] = {}
        self._transaction_logs: Dict[str, List[TransactionLog]] = {}
        
        logger.info(
            "AtomicTransactionManager initialized",
            extra={
                "max_checkpoints": max_checkpoints,
                "max_logs": max_logs,
            }
        )
    
    # =========================================================================
    # CORE TRANSACTION EXECUTION
    # =========================================================================
    
    def execute_transaction(
        self,
        transaction_type: str,
        session_id: str,
        data: Dict[str, Any],
        rollback_on_failure: bool = True,
    ) -> Tuple[bool, Optional[Dict[str, Any]], Optional[str]]:
        """
        Execute a transaction with automatic checkpointing and rollback.
        
        Args:
            transaction_type: Type of transaction (must match TransactionType enum)
            session_id: Session to operate on
            data: Transaction-specific data
            rollback_on_failure: Whether to restore checkpoint on failure
            
        Returns:
            Tuple of (success, result, error):
                - success: True if transaction succeeded
                - result: Transaction result data (or None on failure)
                - error: Error message (or None on success)
                
        Example:
            >>> success, result, error = manager.execute_transaction(
            ...     transaction_type="filter_update",
            ...     session_id="session_1",
            ...     data={"filters": {"min_price": 500000}}
            ... )
        """
        start_time = datetime.now()
        transaction_id = str(uuid.uuid4())
        
        # Validate transaction type
        try:
            trans_type = TransactionType(transaction_type)
        except ValueError:
            error_msg = (
                f"Invalid transaction type: {transaction_type}. "
                f"Must be one of: {[t.value for t in TransactionType]}"
            )
            logger.error(error_msg, extra={"transaction_id": transaction_id})
            return False, None, error_msg
        
        logger.info(
            f"Starting transaction: {trans_type.value}",
            extra={
                "transaction_id": transaction_id,
                "session_id": session_id,
                "transaction_type": trans_type.value,
            }
        )
        
        # Get current state
        try:
            current_state = self.state_manager.get_or_create(session_id)  # ✅ Fixed: use get_or_create instead of get_state
            if not current_state:
                error_msg = f"Session not found: {session_id}"
                logger.error(error_msg, extra={"transaction_id": transaction_id})
                self._log_transaction(
                    transaction_id=transaction_id,
                    transaction_type=trans_type,
                    session_id=session_id,
                    status=TransactionStatus.FAILED,
                    data=data,
                    error=error_msg,
                    duration_ms=self._get_duration_ms(start_time),
                )
                return False, None, error_msg
        except Exception as e:
            error_msg = f"Failed to get current state: {str(e)}"
            logger.error(error_msg, exc_info=True, extra={"transaction_id": transaction_id})
            self._log_transaction(
                transaction_id=transaction_id,
                transaction_type=trans_type,
                session_id=session_id,
                status=TransactionStatus.FAILED,
                data=data,
                error=error_msg,
                duration_ms=self._get_duration_ms(start_time),
            )
            return False, None, error_msg
        
        # Create checkpoint
        checkpoint = None
        if rollback_on_failure:
            try:
                checkpoint = self._create_checkpoint(
                    session_id=session_id,
                    state=current_state,
                    transaction_id=transaction_id,
                    description=f"Before {trans_type.value}",
                )
                logger.debug(
                    f"Created checkpoint: {checkpoint.checkpoint_id}",
                    extra={"transaction_id": transaction_id}
                )
            except Exception as e:
                error_msg = f"Failed to create checkpoint: {str(e)}"
                logger.error(error_msg, exc_info=True, extra={"transaction_id": transaction_id})
                self._log_transaction(
                    transaction_id=transaction_id,
                    transaction_type=trans_type,
                    session_id=session_id,
                    status=TransactionStatus.FAILED,
                    data=data,
                    error=error_msg,
                    duration_ms=self._get_duration_ms(start_time),
                )
                return False, None, error_msg
        
        # Execute transaction based on type
        try:
            if trans_type == TransactionType.FILTER_UPDATE:
                result_state = self._execute_filter_update(
                    session=current_state,
                    filters=data.get("filters", {}),
                )
            elif trans_type == TransactionType.CONFIRMATION_APPLY:
                result_state = self._execute_confirmation_apply(
                    session=current_state,
                    confirmation=data.get("confirmation", {}),
                )
            elif trans_type == TransactionType.SEARCH_EXECUTE:
                result_state = self._execute_search(
                    session=current_state,
                    mls_service=data.get("mls_service"),
                )
            elif trans_type == TransactionType.PROPERTY_VIEW:
                result_state = self._execute_property_view(
                    session=current_state,
                    property_id=data.get("property_id"),
                )
            elif trans_type == TransactionType.STATE_RESTORE:
                checkpoint_id = data.get("checkpoint_id")
                if not checkpoint_id:
                    raise ValueError("checkpoint_id required for STATE_RESTORE")
                result_state = self._execute_state_restore(
                    session_id=session_id,
                    checkpoint_id=checkpoint_id,
                )
            else:
                raise ValueError(f"Transaction type not implemented: {trans_type.value}")
            
            # Save updated state
            self.state_manager.save(result_state)  # ✅ Fixed: use save() instead of save_state()
            
            # Calculate changes
            changes = self._calculate_changes(current_state, result_state)
            
            # Delete checkpoint on success (no longer needed)
            if checkpoint:
                self._delete_checkpoint(session_id, checkpoint.checkpoint_id)
            
            # Log success
            duration_ms = self._get_duration_ms(start_time)
            self._log_transaction(
                transaction_id=transaction_id,
                transaction_type=trans_type,
                session_id=session_id,
                status=TransactionStatus.SUCCESS,
                data=data,
                changes=changes,
                duration_ms=duration_ms,
            )
            
            logger.info(
                f"Transaction succeeded: {trans_type.value}",
                extra={
                    "transaction_id": transaction_id,
                    "session_id": session_id,
                    "duration_ms": duration_ms,
                    "changes": len(changes),
                }
            )
            
            result = {
                "transaction_id": transaction_id,
                "state": result_state.model_dump(),
                "changes": changes,
                "duration_ms": duration_ms,
            }
            
            return True, result, None
            
        except Exception as e:
            error_msg = f"Transaction failed: {str(e)}"
            logger.error(
                error_msg,
                exc_info=True,
                extra={
                    "transaction_id": transaction_id,
                    "transaction_type": trans_type.value,
                }
            )
            
            # Rollback if requested
            if rollback_on_failure and checkpoint:
                try:
                    self._restore_checkpoint(session_id, checkpoint.checkpoint_id)
                    logger.info(
                        f"Rolled back to checkpoint: {checkpoint.checkpoint_id}",
                        extra={"transaction_id": transaction_id}
                    )
                    status = TransactionStatus.ROLLED_BACK
                except Exception as rollback_error:
                    logger.error(
                        f"Rollback failed: {str(rollback_error)}",
                        exc_info=True,
                        extra={"transaction_id": transaction_id}
                    )
                    status = TransactionStatus.FAILED
            else:
                status = TransactionStatus.FAILED
            
            # Log failure
            self._log_transaction(
                transaction_id=transaction_id,
                transaction_type=trans_type,
                session_id=session_id,
                status=status,
                data=data,
                error=error_msg,
                duration_ms=self._get_duration_ms(start_time),
            )
            
            return False, None, error_msg
    
    # =========================================================================
    # SPECIFIC TRANSACTION IMPLEMENTATIONS
    # =========================================================================
    
    def _execute_filter_update(
        self,
        session: UnifiedConversationState,
        filters: Dict[str, Any],
    ) -> UnifiedConversationState:
        """
        Execute a filter update transaction.
        
        Validates all filters before applying atomically.
        
        Args:
            session: Current state
            filters: Filters to update
            
        Returns:
            Updated state with new filters
            
        Raises:
            ValueError: If validation fails
        """
        logger.debug(
            f"Executing filter update for session: {session.session_id}",
            extra={"filters": filters}
        )
        
        # Validate filters first
        self._validate_filters(filters)
        
        # Create a copy for atomic update
        updated_state = session.model_copy(deep=True)
        
        # ═══════════════════════════════════════════════════════════════════════════
        # CRITICAL FIX (Dec 2024): ALWAYS clear stale location_state when city is set
        # ═══════════════════════════════════════════════════════════════════════════
        # The problem: Old neighborhood/postal_code/address persist from previous
        # searches, causing wrong API params like:
        #   city=Mississauga, neighborhood="The Nags Head, London, England"
        #
        # Solution: When we're setting a city, ALWAYS clear neighborhood/postal_code/address
        # unless they're being explicitly set in this same transaction
        if 'city' in filters and filters['city']:
            new_city = filters['city']
            
            # Check if neighborhood/postal_code are NOT being set in this transaction
            if 'neighborhood' not in filters or not filters.get('neighborhood'):
                old_neighborhood = updated_state.location_state.neighborhood if updated_state.location_state else None
                if old_neighborhood:
                    logger.info(f"🔄 [TRANSACTION] Clearing stale neighborhood: '{old_neighborhood}' (not in current transaction)")
                updated_state.location_state.neighborhood = None
            
            if 'postal_code' not in filters or not filters.get('postal_code'):
                old_postal_code = updated_state.location_state.postal_code if updated_state.location_state else None
                if old_postal_code:
                    logger.info(f"🔄 [TRANSACTION] Clearing stale postal_code: '{old_postal_code}' (not in current transaction)")
                updated_state.location_state.postal_code = None
            
            if 'address' not in filters or not filters.get('address'):
                old_address = updated_state.location_state.address if updated_state.location_state else None
                if old_address:
                    logger.info(f"🔄 [TRANSACTION] Clearing stale address: '{old_address}' (not in current transaction)")
                updated_state.location_state.address = None
            
            # Also clear lat/lng if not being set (they belong to the old location)
            if 'latitude' not in filters or not filters.get('latitude'):
                updated_state.location_state.latitude = None
            if 'longitude' not in filters or not filters.get('longitude'):
                updated_state.location_state.longitude = None
        # ═══════════════════════════════════════════════════════════════════════════
        
        # Apply each filter
        # CRITICAL FIX: Handle explicit None values to RESET filters (not skip them)
        # If a filter key exists with value None, it means "reset this filter"
        for key, value in filters.items():
            # Map common filter keys to ActiveFilters fields
            if key == "min_price":
                if value is None:
                    updated_state.active_filters.min_price = None
                    logger.info(f"🔄 [RESET] Reset min_price to None")
                else:
                    updated_state.active_filters.min_price = int(value)
            elif key == "max_price":
                if value is None:
                    updated_state.active_filters.max_price = None
                    logger.info(f"🔄 [RESET] Reset max_price to None")
                else:
                    updated_state.active_filters.max_price = int(value)
            elif key in ("min_beds", "bedrooms"):
                if value is None:
                    updated_state.active_filters.bedrooms = None
                    logger.info(f"🔄 [RESET] Reset bedrooms to None")
                else:
                    updated_state.active_filters.bedrooms = int(value)
            elif key in ("min_baths", "bathrooms"):
                if value is None:
                    updated_state.active_filters.bathrooms = None
                    logger.info(f"🔄 [RESET] Reset bathrooms to None")
                else:
                    updated_state.active_filters.bathrooms = int(value)
            elif key == "property_type":
                if value is None:
                    updated_state.active_filters.property_type = None
                    logger.info(f"🔄 [RESET] Reset property_type to None")
                else:
                    updated_state.active_filters.property_type = value
            elif key == "listing_type":
                if value is None:
                    updated_state.active_filters.listing_type = None
                    logger.info(f"🔄 [RESET] Reset listing_type to None")
                else:
                    updated_state.active_filters.listing_type = ListingType(value)
            elif key == "amenities":
                if value is None or value == []:
                    updated_state.active_filters.amenities = []
                    logger.info(f"🔄 [RESET] Reset amenities to []")
                elif isinstance(value, list):
                    updated_state.active_filters.amenities = value
                else:
                    updated_state.active_filters.amenities = [value]
            elif key == "city":
                if value is None:
                    updated_state.location_state.city = None
                    logger.info(f"🔄 [RESET] Reset city to None")
                else:
                    updated_state.location_state.city = value
            elif key == "neighborhood":
                if value is None:
                    updated_state.location_state.neighborhood = None
                    logger.info(f"🔄 [RESET] Reset neighborhood to None")
                else:
                    updated_state.location_state.neighborhood = value
            elif key == "postal_code":
                if value is None:
                    updated_state.location_state.postal_code = None
                    logger.info(f"🔄 [RESET] Reset postal_code to None")
                else:
                    updated_state.location_state.postal_code = value
            elif key == "location":
                if value is None:
                    updated_state.active_filters.location = None
                    logger.info(f"🔄 [RESET] Reset location to None")
                else:
                    updated_state.active_filters.location = value
            else:
                if value is not None:
                    logger.warning(f"Unknown filter key: {key}")
        
        # Update timestamp
        updated_state.updated_at = datetime.now()
        
        logger.info(
            f"Filter update applied successfully for session: {session.session_id}",
            extra={"applied_filters": list(filters.keys())}
        )
        
        return updated_state
    
    def _execute_search(
        self,
        session: UnifiedConversationState,
        mls_service: Any,
    ) -> UnifiedConversationState:
        """
        Execute a property search transaction.
        
        Calls MLS with current filters, validates results, and updates state.
        
        Args:
            session: Current state
            mls_service: MLS service instance to execute search
            
        Returns:
            Updated state with search results
            
        Raises:
            ValueError: If search fails or returns invalid results
        """
        if not mls_service:
            raise ValueError("mls_service is required for SEARCH_EXECUTE")
        
        logger.debug(
            f"Executing search for session: {session.session_id}",
            extra={
                "filters": session.active_filters.model_dump(exclude_none=True),
                "location": session.location_state.model_dump(exclude_none=True),
            }
        )
        
        # Build search params from state
        search_params = self._build_search_params(session)
        
        # Execute search
        try:
            results = mls_service.search_properties(search_params)
        except Exception as e:
            raise ValueError(f"MLS search failed: {str(e)}")
        
        # Validate results
        if results is None:
            raise ValueError("MLS search returned None")
        
        if not isinstance(results, (list, dict)):
            raise ValueError(f"Invalid MLS results type: {type(results)}")
        
        # Handle dict response (paginated)
        if isinstance(results, dict):
            properties = results.get("properties", results.get("results", []))
            total_count = results.get("total", len(properties))
        else:
            properties = results
            total_count = len(properties)
        
        logger.info(
            f"Search completed successfully",
            extra={
                "session_id": session.session_id,
                "result_count": len(properties),
                "total_count": total_count,
            }
        )
        
        # Update state with results
        updated_state = session.model_copy(deep=True)
        updated_state.last_property_results = properties
        updated_state.updated_at = datetime.now()
        
        return updated_state
    
    def _execute_confirmation_apply(
        self,
        session: UnifiedConversationState,
        confirmation: Dict[str, Any],
    ) -> UnifiedConversationState:
        """
        Execute a confirmation application transaction.
        
        Applies changes from a confirmation response to the state using ConfirmationManager.
        This ensures atomic confirmation handling with proper state validation.
        
        Args:
            session: Current state
            confirmation: Confirmation data including:
                - confirmation_response: User's response message
                - pending_confirmation: Pending confirmation dict
                - state: UnifiedConversationState to update
            
        Returns:
            Updated state with confirmation applied
            
        Raises:
            ValueError: If confirmation is invalid
            ImportError: If ConfirmationManager not available
        """
        logger.debug(
            f"Executing confirmation apply for session: {session.session_id}",
            extra={"confirmation": confirmation}
        )
        
        # Validate confirmation structure
        if not isinstance(confirmation, dict):
            raise ValueError("Confirmation must be a dictionary")
        
        # Import ConfirmationManager at runtime to avoid circular dependency
        try:
            from services.confirmation_manager import get_confirmation_manager
            confirmation_manager = get_confirmation_manager()
        except ImportError as e:
            raise ImportError(f"Failed to import ConfirmationManager: {e}")
        
        # Extract confirmation parameters
        confirmation_response = confirmation.get("confirmation_response")
        pending_confirmation = confirmation.get("pending_confirmation")
        
        if not confirmation_response:
            raise ValueError("Confirmation must have 'confirmation_response' field")
        if not pending_confirmation:
            raise ValueError("Confirmation must have 'pending_confirmation' field")
        
        # Create updated copy for atomic operation
        updated_state = session.model_copy(deep=True)
        
        # Apply confirmation using ConfirmationManager
        result = confirmation_manager.apply_confirmation(
            session_id=session.session_id,
            response=confirmation_response,
            state=updated_state
        )
        
        if not result.success:
            raise ValueError(f"Confirmation application failed: {result.error}")
        
        # Update timestamp
        updated_state.updated_at = datetime.now()
        
        logger.info(
            f"Confirmation applied successfully",
            extra={
                "session_id": session.session_id,
                "applied": result.applied,
                "next_action": result.next_action,
            }
        )
        
        return updated_state
    
    def _execute_property_view(
        self,
        session: UnifiedConversationState,
        property_id: Optional[str],
    ) -> UnifiedConversationState:
        """
        Execute a property view transaction.
        
        Records that user viewed a specific property by adding to conversation history.
        
        Args:
            session: Current state
            property_id: ID of property viewed
            
        Returns:
            Updated state with property view recorded
            
        Raises:
            ValueError: If property_id is invalid
        """
        if not property_id:
            raise ValueError("property_id is required for PROPERTY_VIEW")
        
        logger.debug(
            f"Recording property view for session: {session.session_id}",
            extra={"property_id": property_id}
        )
        
        # Create updated copy
        updated_state = session.model_copy(deep=True)
        
        # Add to conversation history as a system message
        # This provides an audit trail of viewed properties
        updated_state.add_conversation_turn(
            role="system",
            content=f"User viewed property: {property_id}"
        )
        
        # Update timestamp
        updated_state.updated_at = datetime.now()
        
        logger.info(
            f"Property view recorded in conversation history",
            extra={
                "session_id": session.session_id,
                "property_id": property_id,
            }
        )
        
        return updated_state
    
    def _execute_state_restore(
        self,
        session_id: str,
        checkpoint_id: str,
    ) -> UnifiedConversationState:
        """
        Execute a state restore transaction.
        
        Restores state from a checkpoint.
        
        Args:
            session_id: Session to restore
            checkpoint_id: Checkpoint to restore from
            
        Returns:
            Restored state
            
        Raises:
            ValueError: If checkpoint not found
        """
        logger.debug(
            f"Restoring state from checkpoint",
            extra={
                "session_id": session_id,
                "checkpoint_id": checkpoint_id,
            }
        )
        
        # Find checkpoint
        checkpoints = self._checkpoints.get(session_id, [])
        checkpoint = next(
            (c for c in checkpoints if c.checkpoint_id == checkpoint_id),
            None
        )
        
        if not checkpoint:
            raise ValueError(f"Checkpoint not found: {checkpoint_id}")
        
        # Restore state from checkpoint
        restored_state = UnifiedConversationState.model_validate(
            checkpoint.state_data
        )
        
        logger.info(
            f"State restored from checkpoint",
            extra={
                "session_id": session_id,
                "checkpoint_id": checkpoint_id,
                "checkpoint_age_seconds": (
                    datetime.now() - checkpoint.timestamp
                ).total_seconds(),
            }
        )
        
        return restored_state
    
    # =========================================================================
    # CHECKPOINT MANAGEMENT
    # =========================================================================
    
    def _create_checkpoint(
        self,
        session_id: str,
        state: UnifiedConversationState,
        transaction_id: Optional[str] = None,
        description: Optional[str] = None,
    ) -> StateCheckpoint:
        """Create a checkpoint of current state.
        
        Args:
            session_id: Session to checkpoint
            state: Current state to save
            transaction_id: Associated transaction ID
            description: Human-readable description
            
        Returns:
            Created checkpoint
        """
        checkpoint = StateCheckpoint(
            session_id=session_id,
            state_data=state.model_dump(),
            transaction_id=transaction_id,
            description=description,
        )
        
        # Store checkpoint
        if session_id not in self._checkpoints:
            self._checkpoints[session_id] = []
        
        self._checkpoints[session_id].append(checkpoint)
        
        # Trim old checkpoints
        if len(self._checkpoints[session_id]) > self.max_checkpoints:
            self._checkpoints[session_id] = self._checkpoints[session_id][-self.max_checkpoints:]
        
        logger.debug(
            f"Created checkpoint: {checkpoint.checkpoint_id}",
            extra={
                "session_id": session_id,
                "transaction_id": transaction_id,
            }
        )
        
        return checkpoint
    
    def _restore_checkpoint(
        self,
        session_id: str,
        checkpoint_id: str,
    ) -> UnifiedConversationState:
        """Restore state from a checkpoint.
        
        Args:
            session_id: Session to restore
            checkpoint_id: Checkpoint to restore from
            
        Returns:
            Restored state
            
        Raises:
            ValueError: If checkpoint not found
        """
        checkpoints = self._checkpoints.get(session_id, [])
        checkpoint = next(
            (c for c in checkpoints if c.checkpoint_id == checkpoint_id),
            None
        )
        
        if not checkpoint:
            raise ValueError(f"Checkpoint not found: {checkpoint_id}")
        
        # Restore and save state
        restored_state = UnifiedConversationState.model_validate(
            checkpoint.state_data
        )
        self.state_manager.save(restored_state)  # ✅ Fixed: use save() instead of save_state()
        
        logger.info(
            f"Restored checkpoint: {checkpoint_id}",
            extra={"session_id": session_id}
        )
        
        return restored_state
    
    def _delete_checkpoint(
        self,
        session_id: str,
        checkpoint_id: str,
    ) -> bool:
        """Delete a specific checkpoint.
        
        Args:
            session_id: Session the checkpoint belongs to
            checkpoint_id: Checkpoint to delete
            
        Returns:
            True if deleted, False if not found
        """
        if session_id not in self._checkpoints:
            return False
        
        checkpoints = self._checkpoints[session_id]
        original_count = len(checkpoints)
        
        self._checkpoints[session_id] = [
            c for c in checkpoints if c.checkpoint_id != checkpoint_id
        ]
        
        deleted = len(self._checkpoints[session_id]) < original_count
        
        if deleted:
            logger.debug(
                f"Deleted checkpoint: {checkpoint_id}",
                extra={"session_id": session_id}
            )
        
        return deleted
    
    def get_current_checkpoint(
        self,
        session_id: str,
    ) -> Optional[StateCheckpoint]:
        """Get the most recent checkpoint for a session.
        
        Args:
            session_id: Session to get checkpoint for
            
        Returns:
            Most recent checkpoint or None if no checkpoints exist
        """
        checkpoints = self._checkpoints.get(session_id, [])
        if not checkpoints:
            return None
        
        return checkpoints[-1]
    
    # =========================================================================
    # TRANSACTION LOGGING
    # =========================================================================
    
    def _log_transaction(
        self,
        transaction_id: str,
        transaction_type: TransactionType,
        session_id: str,
        status: TransactionStatus,
        data: Dict[str, Any],
        changes: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
        duration_ms: Optional[float] = None,
    ) -> None:
        """Log a transaction for audit trail.
        
        Args:
            transaction_id: Transaction identifier
            transaction_type: Type of transaction
            session_id: Session affected
            status: Transaction status
            data: Transaction data
            changes: What changed
            error: Error message if failed
            duration_ms: Execution time
        """
        log_entry = TransactionLog(
            transaction_id=transaction_id,
            transaction_type=transaction_type,
            session_id=session_id,
            status=status,
            data=data,
            changes=changes or {},
            error=error,
            duration_ms=duration_ms,
        )
        
        # Store log
        if session_id not in self._transaction_logs:
            self._transaction_logs[session_id] = []
        
        self._transaction_logs[session_id].append(log_entry)
        
        # Trim old logs
        if len(self._transaction_logs[session_id]) > self.max_logs:
            self._transaction_logs[session_id] = self._transaction_logs[session_id][-self.max_logs:]
    
    def get_transaction_log(
        self,
        session_id: str,
        limit: int = 100,
    ) -> List[TransactionLog]:
        """Get transaction log for a session.
        
        Args:
            session_id: Session to get logs for
            limit: Maximum number of logs to return (most recent first)
            
        Returns:
            List of transaction logs (newest first)
        """
        logs = self._transaction_logs.get(session_id, [])
        return list(reversed(logs[-limit:]))
    
    def get_checkpoints(
        self,
        session_id: str,
    ) -> List[StateCheckpoint]:
        """Get all checkpoints for a session.
        
        Args:
            session_id: Session to get checkpoints for
            
        Returns:
            List of checkpoints (chronological order)
        """
        return self._checkpoints.get(session_id, [])
    
    def rollback_to_checkpoint(
        self,
        session_id: str,
        checkpoint_id: Optional[str] = None,
    ) -> bool:
        """Rollback to a specific checkpoint.
        
        Args:
            session_id: Session to rollback
            checkpoint_id: Checkpoint ID to restore (or None for most recent)
            
        Returns:
            True if rollback succeeded, False otherwise
        """
        try:
            checkpoints = self.get_checkpoints(session_id)
            
            if not checkpoints:
                logger.error(f"No checkpoints available for session: {session_id}")
                return False
            
            # Use specified checkpoint or most recent
            if checkpoint_id:
                checkpoint = next(
                    (c for c in checkpoints if c.checkpoint_id == checkpoint_id),
                    None
                )
                if not checkpoint:
                    logger.error(f"Checkpoint not found: {checkpoint_id}")
                    return False
            else:
                checkpoint = checkpoints[-1]  # Most recent
            
            # Restore the checkpoint
            self._restore_checkpoint(session_id, checkpoint.checkpoint_id)
            
            logger.info(
                f"Rollback completed successfully",
                extra={
                    "session_id": session_id,
                    "checkpoint_id": checkpoint.checkpoint_id,
                }
            )
            return True
            
        except Exception as e:
            logger.error(
                f"Rollback failed: {str(e)}",
                exc_info=True,
                extra={"session_id": session_id}
            )
            return False
    
    # =========================================================================
    # MANUAL OPERATIONS
    # =========================================================================
    
    def manual_rollback(
        self,
        session_id: str,
        checkpoint_id: Optional[str] = None,
    ) -> bool:
        """Manually rollback to a checkpoint.
        
        Args:
            session_id: Session to rollback
            checkpoint_id: Specific checkpoint to restore (or None for latest)
            
        Returns:
            True if rollback succeeded, False otherwise
        """
        try:
            if checkpoint_id:
                self._restore_checkpoint(session_id, checkpoint_id)
            else:
                # Use latest checkpoint
                checkpoint = self.get_current_checkpoint(session_id)
                if not checkpoint:
                    logger.error(f"No checkpoints found for session: {session_id}")
                    return False
                self._restore_checkpoint(session_id, checkpoint.checkpoint_id)
            
            logger.info(
                f"Manual rollback completed",
                extra={
                    "session_id": session_id,
                    "checkpoint_id": checkpoint_id,
                }
            )
            return True
            
        except Exception as e:
            logger.error(
                f"Manual rollback failed: {str(e)}",
                exc_info=True,
                extra={"session_id": session_id}
            )
            return False
    
    # =========================================================================
    # HELPER METHODS
    # =========================================================================
    
    def _validate_filters(self, filters: Dict[str, Any]) -> None:
        """Validate filter values.
        
        Args:
            filters: Filters to validate
            
        Raises:
            ValueError: If any filter is invalid
        """
        for key, value in filters.items():
            if value is None:
                continue
            
            if key in ("min_price", "max_price"):
                if not isinstance(value, (int, float)) or value <= 0:
                    raise ValueError(f"Invalid {key}: must be positive number")
            
            elif key in ("min_beds", "max_beds", "bedrooms"):
                if not isinstance(value, int) or value < 0 or value > 8:
                    raise ValueError(f"Invalid {key}: must be integer between 0 and 8")
            
            elif key in ("min_baths", "max_baths", "bathrooms"):
                if not isinstance(value, (int, float)) or value < 0 or value > 8:
                    raise ValueError(f"Invalid {key}: must be number between 0 and 8")
            
            elif key == "listing_type":
                try:
                    ListingType(value)
                except ValueError:
                    raise ValueError(
                        f"Invalid listing_type: {value}. "
                        f"Must be one of: {[t.value for t in ListingType]}"
                    )
    
    def _build_search_params(
        self,
        session: UnifiedConversationState,
    ) -> Dict[str, Any]:
        """Build MLS search parameters from state.
        
        Args:
            session: Current state
            
        Returns:
            Search parameters dict
        """
        params = {}
        
        # Add filters
        filters = session.active_filters
        if filters.min_price is not None:
            params["min_price"] = filters.min_price
        if filters.max_price is not None:
            params["max_price"] = filters.max_price
        if filters.bedrooms is not None:
            params["bedrooms"] = filters.bedrooms
        if filters.bathrooms is not None:
            params["bathrooms"] = filters.bathrooms
        if filters.property_type:
            params["property_type"] = filters.property_type
        if filters.listing_type:
            # listing_type is already a string due to use_enum_values=True
            params["listing_type"] = filters.listing_type if isinstance(filters.listing_type, str) else filters.listing_type.value
        if filters.amenities:
            params["amenities"] = filters.amenities
        if filters.location:
            params["location"] = filters.location
        
        # Add location
        location = session.location_state
        if location.city:
            params["city"] = location.city
        if location.neighborhood:
            params["neighborhood"] = location.neighborhood
        if location.postal_code:
            params["postal_code"] = location.postal_code
        
        return params
    
    def _calculate_changes(
        self,
        old_state: UnifiedConversationState,
        new_state: UnifiedConversationState,
    ) -> Dict[str, Any]:
        """Calculate what changed between two states.
        
        Args:
            old_state: Original state
            new_state: Updated state
            
        Returns:
            Dict of changes
        """
        changes = {}
        
        # Compare filters
        old_filters = old_state.active_filters.model_dump(exclude_none=True)
        new_filters = new_state.active_filters.model_dump(exclude_none=True)
        
        for key in set(old_filters.keys()) | set(new_filters.keys()):
            old_val = old_filters.get(key)
            new_val = new_filters.get(key)
            if old_val != new_val:
                changes[f"filters.{key}"] = {
                    "old": old_val,
                    "new": new_val,
                }
        
        # Compare location
        old_location = old_state.location_state.model_dump(exclude_none=True)
        new_location = new_state.location_state.model_dump(exclude_none=True)
        
        for key in set(old_location.keys()) | set(new_location.keys()):
            old_val = old_location.get(key)
            new_val = new_location.get(key)
            if old_val != new_val:
                changes[f"location.{key}"] = {
                    "old": old_val,
                    "new": new_val,
                }
        
        # Compare results
        old_results_count = len(old_state.last_property_results or [])
        new_results_count = len(new_state.last_property_results or [])
        if old_results_count != new_results_count:
            changes["property_results_count"] = {
                "old": old_results_count,
                "new": new_results_count,
            }
        
        return changes
    
    def _get_duration_ms(self, start_time: datetime) -> float:
        """Calculate duration in milliseconds.
        
        Args:
            start_time: When operation started
            
        Returns:
            Duration in milliseconds
        """
        return (datetime.now() - start_time).total_seconds() * 1000


# =============================================================================
# SINGLETON INSTANCE
# =============================================================================

_transaction_manager: Optional[AtomicTransactionManager] = None


def get_transaction_manager(
    state_manager: Optional[UnifiedStateManager] = None,
) -> AtomicTransactionManager:
    """Get the global transaction manager instance.
    
    Args:
        state_manager: State manager to use (required on first call)
        
    Returns:
        Global transaction manager instance
        
    Raises:
        ValueError: If state_manager not provided on first call
    """
    global _transaction_manager
    
    if _transaction_manager is None:
        if state_manager is None:
            raise ValueError(
                "state_manager required for first call to get_transaction_manager"
            )
        _transaction_manager = AtomicTransactionManager(state_manager)
    
    return _transaction_manager
