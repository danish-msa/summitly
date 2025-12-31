"""
Shared Confirmation Tokens Module
=================================
Central source of truth for all confirmation/rejection detection across the codebase.

This module consolidates the previously scattered confirmation detection logic from:
- chatbot_orchestrator.py (CONFIRMATION_WORDS)
- confirmation_manager.py (POSITIVE_TOKENS, NEGATIVE_TOKENS)
- hybrid_intent_classifier.py (confirmation_patterns)

Usage:
    from services.confirmation_tokens import (
        POSITIVE_TOKENS, NEGATIVE_TOKENS, ALL_CONFIRMATION_TOKENS,
        is_positive_response, is_negative_response, is_confirmation_response,
        CONFIRMATION_REGEX_PATTERNS
    )
"""

import re
from typing import Optional, Tuple


# ============================================================================
# CORE TOKEN SETS - Canonical source of truth
# ============================================================================

# Positive confirmation tokens (user says YES)
POSITIVE_TOKENS = frozenset({
    # Standard affirmatives
    'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'alright', 'correct', 'right',
    'affirmative', 'absolutely', 'definitely', 'certainly', 'fine',
    # Single letter
    'y', 'k',
    # Phrases (normalized, no apostrophes)
    'sounds good', 'that sounds good', 'thats fine', 'thats good',
    'that works', 'works for me', 'perfect', 'great',
    'keep it', 'keep same', 'keep it same', 'keep it the same',
    'go ahead', 'proceed', 'continue', 'confirm',
})

# Negative confirmation tokens (user says NO)
NEGATIVE_TOKENS = frozenset({
    # Standard negatives
    'no', 'nope', 'nah', 'not', 'never', 'negative',
    # Single letter
    'n',
    # Cancel/dismiss phrases
    'cancel', 'nevermind', 'never mind', 'dont', "don't", 'stop',
    'not really', 'not interested', 'no thanks', 'no thank you',
    'skip', 'pass', 'later', 'maybe later',
    # Change intent (treat as "no, change it")
    'change', 'modify', 'adjust', 'update', 'different',
})

# Skip/defer tokens (not yes or no, but also not a new query)
SKIP_TOKENS = frozenset({
    'skip', 'none', 'nothing', 'pass', 'later', 'maybe later',
    'not now', 'not yet', 'hold on', 'wait',
})

# Combined set of ALL confirmation tokens (for entity extraction blocking)
ALL_CONFIRMATION_TOKENS = POSITIVE_TOKENS | NEGATIVE_TOKENS | SKIP_TOKENS


# ============================================================================
# REGEX PATTERNS - For pattern-based detection
# ============================================================================

# High-confidence confirmation patterns (99% confidence)
CONFIRMATION_REGEX_PATTERNS = [
    # Positive patterns
    r'^(yes|yeah|yep|yup|sure|ok|okay|fine|alright|right|correct)\.?!?$',
    r'^(y|k)$',  # Single letter confirmations
    r'^(sounds?\s+good|that\s+works?|works?\s+for\s+me)\.?!?$',
    r'^(keep|keep\s+it|keep\s+(it\s+)?same|keep\s+it\s+the\s+same)\.?!?$',
    r'^(perfect|great|absolutely|definitely|certainly)\.?!?$',
    # Negative patterns
    r'^(no|nope|nah|not\s+really|never)\.?!?$',
    r'^(n)$',  # Single letter rejection
    r'^(cancel|nevermind|never\s+mind)\.?!?$',
    r'^(change|modify|adjust|update|different)\.?!?$',
]

# Compiled patterns for efficiency
_COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in CONFIRMATION_REGEX_PATTERNS]


# ============================================================================
# DETECTION FUNCTIONS - Use these instead of inline checks
# ============================================================================

def normalize_message(message: str) -> str:
    """
    Normalize message for confirmation detection.
    Strips whitespace, lowercases, and removes common punctuation.
    """
    clean = message.strip().lower()
    # Remove punctuation that doesn't affect meaning
    clean = re.sub(r'[.,!?]+$', '', clean)
    # Normalize apostrophes
    clean = clean.replace("'", "")
    return clean


def is_positive_response(message: str) -> bool:
    """
    Check if message is a positive/affirmative response.
    
    Args:
        message: User's raw message
        
    Returns:
        True if message indicates YES/affirmative
    """
    normalized = normalize_message(message)
    return normalized in POSITIVE_TOKENS


def is_negative_response(message: str) -> bool:
    """
    Check if message is a negative/rejection response.
    
    Args:
        message: User's raw message
        
    Returns:
        True if message indicates NO/rejection
    """
    normalized = normalize_message(message)
    return normalized in NEGATIVE_TOKENS


def is_skip_response(message: str) -> bool:
    """
    Check if message is a skip/defer response.
    
    Args:
        message: User's raw message
        
    Returns:
        True if message indicates skip/defer
    """
    normalized = normalize_message(message)
    return normalized in SKIP_TOKENS


def is_confirmation_response(message: str) -> bool:
    """
    Check if message is ANY type of confirmation response (yes/no/skip).
    Critical: These messages should NOT be parsed as location/property queries.
    
    Args:
        message: User's raw message
        
    Returns:
        True if message is a confirmation word/phrase
    """
    normalized = normalize_message(message)
    return normalized in ALL_CONFIRMATION_TOKENS


def is_confirmation_word(message: str) -> bool:
    """
    Alias for is_confirmation_response for backward compatibility.
    Use this when checking if entity extraction should be blocked.
    """
    return is_confirmation_response(message)


def detect_confirmation_with_regex(message: str) -> bool:
    """
    Detect confirmation using regex patterns.
    Slightly more flexible than exact token matching.
    
    Args:
        message: User's raw message
        
    Returns:
        True if message matches a confirmation pattern
    """
    normalized = normalize_message(message)
    return any(pattern.match(normalized) for pattern in _COMPILED_PATTERNS)


def classify_confirmation(message: str) -> Tuple[Optional[str], float]:
    """
    Classify a confirmation message into its type with confidence.
    
    Args:
        message: User's raw message
        
    Returns:
        Tuple of (type, confidence) where type is 'positive', 'negative', 'skip', or None
    """
    normalized = normalize_message(message)
    
    # Exact token match = 99% confidence
    if normalized in POSITIVE_TOKENS:
        return ('positive', 0.99)
    if normalized in NEGATIVE_TOKENS:
        return ('negative', 0.99)
    if normalized in SKIP_TOKENS:
        return ('skip', 0.95)
    
    # Regex match = 95% confidence
    if detect_confirmation_with_regex(message):
        # Determine type by checking partial matches
        if any(token in normalized for token in ['yes', 'yeah', 'yep', 'ok', 'sure', 'right']):
            return ('positive', 0.95)
        if any(token in normalized for token in ['no', 'nope', 'cancel', 'change']):
            return ('negative', 0.95)
        return ('positive', 0.90)  # Default to positive for generic matches
    
    return (None, 0.0)


# ============================================================================
# BACKWARD COMPATIBILITY - Legacy names
# ============================================================================

# For chatbot_orchestrator.py compatibility
CONFIRMATION_WORDS = ALL_CONFIRMATION_TOKENS

# For confirmation_manager.py compatibility (already matches names)
# POSITIVE_TOKENS and NEGATIVE_TOKENS are already exported above


# ============================================================================
# MODULE INFO
# ============================================================================

__all__ = [
    # Token sets
    'POSITIVE_TOKENS',
    'NEGATIVE_TOKENS', 
    'SKIP_TOKENS',
    'ALL_CONFIRMATION_TOKENS',
    'CONFIRMATION_WORDS',  # Legacy alias
    # Regex patterns
    'CONFIRMATION_REGEX_PATTERNS',
    # Functions
    'normalize_message',
    'is_positive_response',
    'is_negative_response',
    'is_skip_response',
    'is_confirmation_response',
    'is_confirmation_word',  # Legacy alias
    'detect_confirmation_with_regex',
    'classify_confirmation',
]
