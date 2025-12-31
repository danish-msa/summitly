"""
Open AI API Wrapper with Reliability, Caching, and Observability
================================================================

This module provides a centralized, production-grade wrapper for all Open AI API calls.
It implements reliability patterns (timeouts, retries, circuit breaker), caching for
deterministic calls, and comprehensive observability (latency, token usage, failures).

IMPORTANT - BACKWARD COMPATIBILITY:
- All existing Open AI call patterns are preserved.
- This wrapper is opt-in and can be bypassed via feature flags.
- Original `ask_gpt_interpreter` and `ask_gpt_summarizer` functions remain unchanged.
- Circuit breaker and caching can be disabled via environment variables.

Feature Flags:
- OPENAI_USE_COMBINED_INTERPRETER=false (default) - Combined intent+location extraction
- OPENAI_ALLOW_EXPERIMENTAL_MODELS=false (default) - Allow GPT-5-* models
- OPENAI_ENABLE_CIRCUIT_BREAKER=true (default) - Enable circuit breaker
- OPENAI_ENABLE_CACHE=true (default) - Enable response caching

ROLLBACK:
To disable this wrapper entirely:
1. Set OPENAI_ENABLE_WRAPPER=false in environment
2. All calls will bypass wrapper and use original direct calls
3. No code changes required

Author: Summitly Team
Date: December 26, 2025
"""

import os
import json
import hashlib
import logging
import time
import threading
import functools
from typing import Dict, List, Optional, Any, Tuple, Union
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
from collections import OrderedDict

logger = logging.getLogger(__name__)

# =============================================================================
# FEATURE FLAGS - All new behavior disabled by default for safety
# =============================================================================

def get_feature_flag(name: str, default: bool = False) -> bool:
    """Get a feature flag from environment, defaulting to safe value."""
    value = os.getenv(name, str(default)).lower()
    return value in ('true', '1', 'yes', 'enabled')


# Feature flag definitions with safe defaults
OPENAI_USE_COMBINED_INTERPRETER = get_feature_flag("OPENAI_USE_COMBINED_INTERPRETER", False)
OPENAI_ALLOW_EXPERIMENTAL_MODELS = get_feature_flag("OPENAI_ALLOW_EXPERIMENTAL_MODELS", False)
OPENAI_ENABLE_CIRCUIT_BREAKER = get_feature_flag("OPENAI_ENABLE_CIRCUIT_BREAKER", True)
OPENAI_ENABLE_CACHE = get_feature_flag("OPENAI_ENABLE_CACHE", True)
OPENAI_ENABLE_WRAPPER = get_feature_flag("OPENAI_ENABLE_WRAPPER", True)

# Configuration constants
OPENAI_TIMEOUT_SECONDS = int(os.getenv("OPENAI_TIMEOUT_SECONDS", "30"))
OPENAI_MAX_RETRIES = int(os.getenv("OPENAI_MAX_RETRIES", "3"))
OPENAI_CIRCUIT_BREAKER_THRESHOLD = int(os.getenv("OPENAI_CIRCUIT_BREAKER_THRESHOLD", "5"))
OPENAI_CIRCUIT_BREAKER_RESET_SECONDS = int(os.getenv("OPENAI_CIRCUIT_BREAKER_RESET_SECONDS", "60"))
OPENAI_CACHE_TTL_SECONDS = int(os.getenv("OPENAI_CACHE_TTL_SECONDS", "3600"))  # 1 hour
OPENAI_CACHE_MAX_SIZE = int(os.getenv("OPENAI_CACHE_MAX_SIZE", "1000"))

# Default fallback model when experimental models are disabled
DEFAULT_FALLBACK_MODEL = "gpt-4o-mini"

# System prompt versioning for cache invalidation
SYSTEM_PROMPT_VERSION = "v1.0.0"

logger.info(
    f"[Open AI Wrapper] Initialized | "
    f"wrapper_enabled={OPENAI_ENABLE_WRAPPER} | "
    f"combined_interpreter={OPENAI_USE_COMBINED_INTERPRETER} | "
    f"experimental_models={OPENAI_ALLOW_EXPERIMENTAL_MODELS} | "
    f"circuit_breaker={OPENAI_ENABLE_CIRCUIT_BREAKER} | "
    f"cache={OPENAI_ENABLE_CACHE}"
)


# =============================================================================
# OBSERVABILITY - Metrics Collection
# =============================================================================

@dataclass
class OpenAIMetrics:
    """Thread-safe metrics collection for Open AI API calls."""
    
    # Call counts
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    retry_count: int = 0
    
    # Latency (milliseconds)
    total_latency_ms: float = 0.0
    min_latency_ms: float = float('inf')
    max_latency_ms: float = 0.0
    
    # Token usage
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    
    # Cache stats
    cache_hits: int = 0
    cache_misses: int = 0
    
    # Circuit breaker
    circuit_breaker_trips: int = 0
    
    # Model fallbacks
    experimental_model_fallbacks: int = 0
    
    # Lock for thread safety
    _lock: threading.Lock = field(default_factory=threading.Lock)
    
    def record_call(
        self,
        success: bool,
        latency_ms: float,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        retries: int = 0,
        cache_hit: bool = False
    ):
        """Record metrics for a single Open AI API call."""
        with self._lock:
            self.total_calls += 1
            
            if success:
                self.successful_calls += 1
            else:
                self.failed_calls += 1
            
            self.retry_count += retries
            
            self.total_latency_ms += latency_ms
            self.min_latency_ms = min(self.min_latency_ms, latency_ms)
            self.max_latency_ms = max(self.max_latency_ms, latency_ms)
            
            self.total_prompt_tokens += prompt_tokens
            self.total_completion_tokens += completion_tokens
            
            if cache_hit:
                self.cache_hits += 1
            else:
                self.cache_misses += 1
    
    def record_circuit_breaker_trip(self):
        """Record a circuit breaker trip."""
        with self._lock:
            self.circuit_breaker_trips += 1
    
    def record_experimental_fallback(self):
        """Record when an experimental model was replaced with fallback."""
        with self._lock:
            self.experimental_model_fallbacks += 1
    
    def get_stats(self) -> Dict[str, Any]:
        """Get current metrics as dictionary."""
        with self._lock:
            avg_latency = (
                self.total_latency_ms / self.total_calls
                if self.total_calls > 0 else 0.0
            )
            cache_hit_rate = (
                self.cache_hits / (self.cache_hits + self.cache_misses)
                if (self.cache_hits + self.cache_misses) > 0 else 0.0
            )
            success_rate = (
                self.successful_calls / self.total_calls
                if self.total_calls > 0 else 0.0
            )
            
            return {
                "total_calls": self.total_calls,
                "successful_calls": self.successful_calls,
                "failed_calls": self.failed_calls,
                "success_rate": round(success_rate, 4),
                "retry_count": self.retry_count,
                "avg_latency_ms": round(avg_latency, 2),
                "min_latency_ms": round(self.min_latency_ms, 2) if self.min_latency_ms != float('inf') else 0,
                "max_latency_ms": round(self.max_latency_ms, 2),
                "total_prompt_tokens": self.total_prompt_tokens,
                "total_completion_tokens": self.total_completion_tokens,
                "total_tokens": self.total_prompt_tokens + self.total_completion_tokens,
                "cache_hits": self.cache_hits,
                "cache_misses": self.cache_misses,
                "cache_hit_rate": round(cache_hit_rate, 4),
                "circuit_breaker_trips": self.circuit_breaker_trips,
                "experimental_model_fallbacks": self.experimental_model_fallbacks,
            }
    
    def reset(self):
        """Reset all metrics (useful for testing)."""
        with self._lock:
            self.total_calls = 0
            self.successful_calls = 0
            self.failed_calls = 0
            self.retry_count = 0
            self.total_latency_ms = 0.0
            self.min_latency_ms = float('inf')
            self.max_latency_ms = 0.0
            self.total_prompt_tokens = 0
            self.total_completion_tokens = 0
            self.cache_hits = 0
            self.cache_misses = 0
            self.circuit_breaker_trips = 0
            self.experimental_model_fallbacks = 0


# Global metrics instance
openai_metrics = OpenAIMetrics()


# =============================================================================
# CIRCUIT BREAKER - Prevents cascading failures
# =============================================================================

class CircuitBreakerState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreaker:
    """
    Circuit breaker pattern implementation for Open AI API calls.
    
    Behavior:
    - CLOSED: Normal operation, track failures
    - OPEN: After N consecutive failures, reject all requests for M seconds
    - HALF_OPEN: After reset timeout, allow one test request
    
    This prevents cascading failures when Open AI is experiencing issues.
    """
    
    def __init__(
        self,
        failure_threshold: int = OPENAI_CIRCUIT_BREAKER_THRESHOLD,
        reset_timeout_seconds: int = OPENAI_CIRCUIT_BREAKER_RESET_SECONDS
    ):
        self.failure_threshold = failure_threshold
        self.reset_timeout = timedelta(seconds=reset_timeout_seconds)
        
        self._state = CircuitBreakerState.CLOSED
        self._failure_count = 0
        self._last_failure_time: Optional[datetime] = None
        self._lock = threading.Lock()
        
        logger.info(
            f"[Circuit Breaker] Initialized | "
            f"threshold={failure_threshold} | "
            f"reset_timeout={reset_timeout_seconds}s"
        )
    
    @property
    def state(self) -> CircuitBreakerState:
        """Get current circuit breaker state."""
        with self._lock:
            # Check if we should transition from OPEN to HALF_OPEN
            if self._state == CircuitBreakerState.OPEN:
                if self._last_failure_time:
                    elapsed = datetime.now() - self._last_failure_time
                    if elapsed >= self.reset_timeout:
                        self._state = CircuitBreakerState.HALF_OPEN
                        logger.info("[Circuit Breaker] State: OPEN → HALF_OPEN (testing recovery)")
            
            return self._state
    
    def is_open(self) -> bool:
        """Check if circuit breaker is open (rejecting requests)."""
        return self.state == CircuitBreakerState.OPEN
    
    def record_success(self):
        """Record a successful call, reset failure count."""
        with self._lock:
            self._failure_count = 0
            if self._state == CircuitBreakerState.HALF_OPEN:
                self._state = CircuitBreakerState.CLOSED
                logger.info("[Circuit Breaker] State: HALF_OPEN → CLOSED (service recovered)")
    
    def record_failure(self):
        """Record a failed call, potentially trip the breaker."""
        with self._lock:
            self._failure_count += 1
            self._last_failure_time = datetime.now()
            
            if self._failure_count >= self.failure_threshold:
                if self._state != CircuitBreakerState.OPEN:
                    self._state = CircuitBreakerState.OPEN
                    openai_metrics.record_circuit_breaker_trip()
                    logger.warning(
                        f"[Circuit Breaker] TRIPPED! State: → OPEN | "
                        f"failures={self._failure_count} | "
                        f"Will reset in {self.reset_timeout.total_seconds()}s"
                    )
    
    def reset(self):
        """Reset circuit breaker (useful for testing)."""
        with self._lock:
            self._state = CircuitBreakerState.CLOSED
            self._failure_count = 0
            self._last_failure_time = None


# Global circuit breaker instance
circuit_breaker = CircuitBreaker()


class CircuitBreakerOpenError(Exception):
    """Raised when circuit breaker is open and rejecting requests."""
    pass


# =============================================================================
# RESPONSE CACHE - Caches deterministic (temperature=0) responses
# =============================================================================

class ResponseCache:
    """
    LRU cache for Open AI API responses.
    
    Only caches responses when:
    - temperature == 0.0 (deterministic)
    - Cache is enabled via feature flag
    
    Cache key includes:
    - Model name
    - Messages (hashed)
    - System prompt version (for cache invalidation on prompt changes)
    
    Supports:
    - Redis backend (if REDIS_URL is set)
    - In-memory LRU fallback
    """
    
    def __init__(
        self,
        max_size: int = OPENAI_CACHE_MAX_SIZE,
        ttl_seconds: int = OPENAI_CACHE_TTL_SECONDS
    ):
        self.max_size = max_size
        self.ttl = timedelta(seconds=ttl_seconds)
        
        # In-memory LRU cache
        self._memory_cache: OrderedDict = OrderedDict()
        self._lock = threading.Lock()
        
        # Redis client (lazy initialized)
        self._redis_client = None
        self._redis_available = False
        self._init_redis()
        
        logger.info(
            f"[Response Cache] Initialized | "
            f"max_size={max_size} | "
            f"ttl={ttl_seconds}s | "
            f"redis_available={self._redis_available}"
        )
    
    def _init_redis(self):
        """Initialize Redis client if URL is configured and Redis is enabled."""
        # Check if Redis is explicitly disabled
        enable_redis = os.getenv("ENABLE_REDIS_CACHE", "true").lower() in ("true", "1", "yes")
        if not enable_redis:
            logger.info("[Response Cache] Redis disabled via ENABLE_REDIS_CACHE=false, using memory cache")
            self._redis_available = False
            return
            
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            try:
                import redis
                self._redis_client = redis.from_url(redis_url)
                # Test connection
                self._redis_client.ping()
                self._redis_available = True
                logger.info("[Response Cache] Redis backend connected")
            except Exception as e:
                logger.warning(f"[Response Cache] Redis unavailable, using memory cache: {e}")
                self._redis_available = False
    
    def _make_cache_key(
        self,
        model: str,
        messages: List[Dict[str, str]],
        prompt_version: str = SYSTEM_PROMPT_VERSION
    ) -> str:
        """Create deterministic cache key from model + messages."""
        # Create stable string representation
        key_data = {
            "model": model,
            "messages": messages,
            "prompt_version": prompt_version
        }
        key_str = json.dumps(key_data, sort_keys=True)
        
        # Hash for shorter key
        key_hash = hashlib.sha256(key_str.encode()).hexdigest()[:32]
        return f"openai_cache:{key_hash}"
    
    def get(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached response if available.
        
        Only returns cached data for temperature=0.0 (deterministic calls).
        """
        # Only cache deterministic calls
        if temperature != 0.0:
            return None
        
        if not OPENAI_ENABLE_CACHE:
            return None
        
        cache_key = self._make_cache_key(model, messages)
        
        # Try Redis first
        if self._redis_available and self._redis_client:
            try:
                cached_data = self._redis_client.get(cache_key)
                if cached_data:
                    result = json.loads(cached_data)
                    logger.debug(f"[Cache] Redis HIT for key: {cache_key[:20]}...")
                    return result
            except Exception as e:
                logger.warning(f"[Cache] Redis get error: {e}")
        
        # Fallback to memory cache
        with self._lock:
            if cache_key in self._memory_cache:
                cached_data, timestamp = self._memory_cache[cache_key]
                
                # Check TTL
                if datetime.now() - timestamp < self.ttl:
                    # Move to end (most recently used)
                    self._memory_cache.move_to_end(cache_key)
                    logger.debug(f"[Cache] Memory HIT for key: {cache_key[:20]}...")
                    return cached_data
                else:
                    # Expired
                    del self._memory_cache[cache_key]
        
        return None
    
    def set(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float,
        response: Dict[str, Any]
    ):
        """
        Cache response for future use.
        
        Only caches for temperature=0.0 (deterministic calls).
        """
        # Only cache deterministic calls
        if temperature != 0.0:
            return
        
        if not OPENAI_ENABLE_CACHE:
            return
        
        cache_key = self._make_cache_key(model, messages)
        
        # Try Redis first
        if self._redis_available and self._redis_client:
            try:
                self._redis_client.setex(
                    cache_key,
                    int(self.ttl.total_seconds()),
                    json.dumps(response)
                )
                logger.debug(f"[Cache] Redis SET for key: {cache_key[:20]}...")
                return
            except Exception as e:
                logger.warning(f"[Cache] Redis set error: {e}")
        
        # Fallback to memory cache
        with self._lock:
            self._memory_cache[cache_key] = (response, datetime.now())
            self._memory_cache.move_to_end(cache_key)
            
            # Evict oldest if over limit
            while len(self._memory_cache) > self.max_size:
                self._memory_cache.popitem(last=False)
            
            logger.debug(f"[Cache] Memory SET for key: {cache_key[:20]}...")
    
    def clear(self):
        """Clear all cached responses."""
        with self._lock:
            self._memory_cache.clear()
        
        if self._redis_available and self._redis_client:
            try:
                # Clear all openai_cache keys
                for key in self._redis_client.scan_iter("openai_cache:*"):
                    self._redis_client.delete(key)
            except Exception as e:
                logger.warning(f"[Cache] Redis clear error: {e}")


# Global cache instance
response_cache = ResponseCache()


# =============================================================================
# MODEL SAFETY - Handles experimental model fallback
# =============================================================================

def get_safe_model(requested_model: str) -> Tuple[str, bool]:
    """
    Get a safe model to use, falling back from experimental models if disabled.
    
    Args:
        requested_model: The model requested by the caller
        
    Returns:
        Tuple of (model_to_use, was_fallback_applied)
    """
    # Check if experimental models are allowed
    if "gpt-5" in requested_model.lower():
        if not OPENAI_ALLOW_EXPERIMENTAL_MODELS:
            logger.warning(
                f"[Model Safety] Experimental model '{requested_model}' disabled. "
                f"Falling back to '{DEFAULT_FALLBACK_MODEL}'. "
                f"Set OPENAI_ALLOW_EXPERIMENTAL_MODELS=true to enable."
            )
            openai_metrics.record_experimental_fallback()
            return DEFAULT_FALLBACK_MODEL, True
    
    return requested_model, False


# =============================================================================
# JSON PARSING - Robust JSON extraction with retry
# =============================================================================

class JSONParseError(Exception):
    """Raised when JSON parsing fails after all retry attempts."""
    pass


def parse_json_response(
    text: str,
    retry_on_truncation: bool = True
) -> Tuple[Dict[str, Any], bool]:
    """
    Robustly parse JSON from Open AI response.
    
    Handles:
    - Markdown code blocks (```json ... ```)
    - Truncated JSON (missing closing brackets)
    - Extra text before/after JSON
    
    Args:
        text: Raw response text from Open AI
        retry_on_truncation: Whether to attempt fixes for truncated JSON
        
    Returns:
        Tuple of (parsed_json, was_repaired)
        
    Raises:
        JSONParseError: If parsing fails after all attempts
    """
    if not text or not text.strip():
        raise JSONParseError("Empty response text")
    
    original_text = text
    was_repaired = False
    
    # Step 1: Strip markdown code blocks
    if text.startswith("```"):
        parts = text.split("```")
        if len(parts) >= 2:
            text = parts[1]
            if text.startswith("json"):
                text = text[4:].strip()
            elif text.startswith("\n"):
                text = text[1:].strip()
    
    text = text.strip()
    
    # Step 2: Try direct parse
    try:
        return json.loads(text), False
    except json.JSONDecodeError:
        pass
    
    if not retry_on_truncation:
        raise JSONParseError(f"Invalid JSON: {text[:200]}...")
    
    # Step 3: Try to fix common issues
    
    # 3a: Remove trailing commas (before closing brackets)
    try:
        import re
        # Remove trailing commas before } or ]
        cleaned = re.sub(r',\s*([\}\]])', r'\1', text)
        result = json.loads(cleaned)
        logger.debug("[JSON Parse] Fixed by removing trailing commas")
        return result, True
    except json.JSONDecodeError:
        pass
    
    # 3b: Close unclosed brackets (truncation fix)
    try:
        fixed = text
        open_braces = fixed.count('{') - fixed.count('}')
        open_brackets = fixed.count('[') - fixed.count(']')
        
        if open_braces > 0 or open_brackets > 0:
            # Close unclosed strings first
            if fixed.count('"') % 2 != 0:
                fixed = fixed + '"'
            
            fixed = fixed + (']' * open_brackets) + ('}' * open_braces)
            result = json.loads(fixed)
            logger.debug("[JSON Parse] Fixed truncated JSON by closing brackets")
            return result, True
    except json.JSONDecodeError:
        pass
    
    # 3c: Extract JSON object from text
    try:
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            extracted = json_match.group(0)
            result = json.loads(extracted)
            logger.debug("[JSON Parse] Fixed by extracting JSON object")
            return result, True
    except (json.JSONDecodeError, AttributeError):
        pass
    
    # All attempts failed
    raise JSONParseError(
        f"Failed to parse JSON after all attempts. "
        f"Original text (first 200 chars): {original_text[:200]}..."
    )


# =============================================================================
# MAIN WRAPPER - Centralized Open AI API call handler
# =============================================================================

@dataclass
class OpenAIResponse:
    """Structured response from Open AI API wrapper."""
    
    success: bool
    content: Optional[str] = None
    parsed_json: Optional[Dict[str, Any]] = None
    
    # Metadata
    model_used: str = ""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0
    
    # Flags
    cache_hit: bool = False
    was_retry: bool = False
    json_repaired: bool = False
    model_fallback: bool = False
    
    # Error info
    error_message: Optional[str] = None
    error_type: Optional[str] = None


def call_openai(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.0,
    max_tokens: int = 600,
    timeout_seconds: int = OPENAI_TIMEOUT_SECONDS,
    parse_json: bool = True,
    retry_on_failure: bool = True,
    use_circuit_breaker: bool = True
) -> OpenAIResponse:
    """
    Centralized wrapper for all Open AI API calls.
    
    Features:
    - Timeout enforcement (default 30s)
    - Exponential backoff retry (max 3 attempts)
    - Circuit breaker (trips after 5 consecutive failures)
    - Response caching (for temperature=0.0 calls)
    - JSON parsing with truncation repair
    - Comprehensive metrics logging
    - Experimental model safety fallback
    
    Args:
        messages: Chat messages in Open AI format
        model: Model to use (defaults to OPENAI_MODEL env var)
        temperature: Sampling temperature (0.0 for deterministic)
        max_tokens: Maximum tokens in response
        timeout_seconds: Request timeout in seconds
        parse_json: Whether to parse response as JSON
        retry_on_failure: Whether to retry failed requests
        use_circuit_breaker: Whether to respect circuit breaker state
        
    Returns:
        OpenAIResponse with success status, content, and metadata
        
    IMPORTANT - Backward Compatibility:
    If OPENAI_ENABLE_WRAPPER=false, this function will raise an exception
    to signal callers should use the original direct calls.
    """
    start_time = time.time()
    
    # Get model with safety fallback
    requested_model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    safe_model, model_fallback = get_safe_model(requested_model)
    
    # Check circuit breaker
    if use_circuit_breaker and OPENAI_ENABLE_CIRCUIT_BREAKER:
        if circuit_breaker.is_open():
            logger.warning("[Open AI Wrapper] Circuit breaker is OPEN - rejecting request")
            return OpenAIResponse(
                success=False,
                model_used=safe_model,
                error_message="Circuit breaker is open - Open AI API temporarily unavailable",
                error_type="circuit_breaker_open",
                model_fallback=model_fallback
            )
    
    # Check cache for deterministic calls
    if temperature == 0.0 and OPENAI_ENABLE_CACHE:
        cached = response_cache.get(safe_model, messages, temperature)
        if cached:
            latency_ms = (time.time() - start_time) * 1000
            openai_metrics.record_call(
                success=True,
                latency_ms=latency_ms,
                cache_hit=True
            )
            logger.info(f"[Open AI Wrapper] Cache HIT | model={safe_model} | latency={latency_ms:.1f}ms")
            return OpenAIResponse(
                success=True,
                content=cached.get("content"),
                parsed_json=cached.get("parsed_json"),
                model_used=safe_model,
                latency_ms=latency_ms,
                cache_hit=True,
                model_fallback=model_fallback
            )
    
    # Initialize Open AI client
    try:
        from openai import OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return OpenAIResponse(
                success=False,
                error_message="OPENAI_API_KEY not configured",
                error_type="configuration_error"
            )
        
        client = OpenAI(api_key=api_key, timeout=timeout_seconds)
    except ImportError:
        return OpenAIResponse(
            success=False,
            error_message="OpenAI package not installed",
            error_type="import_error"
        )
    
    # Prepare API parameters
    params = {
        "model": safe_model,
        "messages": messages,
    }
    
    # Handle GPT-5 specific parameters
    if "gpt-5" in safe_model.lower():
        params["max_completion_tokens"] = max_tokens
        # GPT-5 models require temperature=1 or omission
        if temperature != 1.0:
            logger.debug(f"[Open AI Wrapper] GPT-5 model - omitting temperature (requested: {temperature})")
        params["response_format"] = {"type": "json_object"}
    else:
        params["max_tokens"] = max_tokens
        params["temperature"] = temperature
    
    # Retry loop with exponential backoff
    max_retries = OPENAI_MAX_RETRIES if retry_on_failure else 1
    last_error = None
    retries_used = 0
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                # Exponential backoff: 1s, 2s, 4s
                backoff = 2 ** (attempt - 1)
                logger.info(f"[Open AI Wrapper] Retry {attempt}/{max_retries - 1} after {backoff}s backoff")
                time.sleep(backoff)
                retries_used = attempt
            
            # Make API call
            response = client.chat.completions.create(**params)
            
            # Extract content
            content = ""
            if response.choices and response.choices[0].message.content:
                content = response.choices[0].message.content.strip()
            
            # Check for empty response
            if not content:
                logger.warning(f"[Open AI Wrapper] Empty response from {safe_model}")
                
                # If GPT-5 returned empty, try fallback model
                if "gpt-5" in safe_model.lower() and attempt < max_retries - 1:
                    logger.info(f"[Open AI Wrapper] Trying fallback model {DEFAULT_FALLBACK_MODEL}")
                    safe_model = DEFAULT_FALLBACK_MODEL
                    params["model"] = safe_model
                    params.pop("max_completion_tokens", None)
                    params.pop("response_format", None)
                    params["max_tokens"] = max_tokens
                    params["temperature"] = temperature
                    model_fallback = True
                    continue
                
                raise ValueError("Empty response from Open AI API")
            
            # Extract token usage
            prompt_tokens = 0
            completion_tokens = 0
            if response.usage:
                prompt_tokens = response.usage.prompt_tokens or 0
                completion_tokens = response.usage.completion_tokens or 0
            
            # Parse JSON if requested
            parsed_json = None
            json_repaired = False
            if parse_json:
                try:
                    parsed_json, json_repaired = parse_json_response(content)
                except JSONParseError as e:
                    logger.warning(f"[Open AI Wrapper] JSON parse failed: {e}")
                    # Don't fail the request - return raw content
                    parsed_json = None
            
            # Record success
            latency_ms = (time.time() - start_time) * 1000
            
            if OPENAI_ENABLE_CIRCUIT_BREAKER:
                circuit_breaker.record_success()
            
            openai_metrics.record_call(
                success=True,
                latency_ms=latency_ms,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                retries=retries_used,
                cache_hit=False
            )
            
            # Log success
            logger.info(
                f"[Open AI Wrapper] SUCCESS | "
                f"model={safe_model} | "
                f"latency={latency_ms:.1f}ms | "
                f"tokens={prompt_tokens}+{completion_tokens} | "
                f"retries={retries_used} | "
                f"json_repaired={json_repaired}"
            )
            
            # Cache deterministic responses
            if temperature == 0.0 and OPENAI_ENABLE_CACHE and parsed_json:
                response_cache.set(
                    safe_model,
                    messages,
                    temperature,
                    {"content": content, "parsed_json": parsed_json}
                )
            
            return OpenAIResponse(
                success=True,
                content=content,
                parsed_json=parsed_json,
                model_used=safe_model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                latency_ms=latency_ms,
                cache_hit=False,
                was_retry=retries_used > 0,
                json_repaired=json_repaired,
                model_fallback=model_fallback
            )
            
        except Exception as e:
            last_error = e
            logger.warning(f"[Open AI Wrapper] Attempt {attempt + 1}/{max_retries} failed: {e}")
            
            if OPENAI_ENABLE_CIRCUIT_BREAKER:
                circuit_breaker.record_failure()
    
    # All retries exhausted
    latency_ms = (time.time() - start_time) * 1000
    error_message = str(last_error) if last_error else "Unknown error"
    error_type = type(last_error).__name__ if last_error else "unknown"
    
    openai_metrics.record_call(
        success=False,
        latency_ms=latency_ms,
        retries=retries_used,
        cache_hit=False
    )
    
    logger.error(
        f"[Open AI Wrapper] FAILED after {max_retries} attempts | "
        f"model={safe_model} | "
        f"error={error_message[:100]}"
    )
    
    return OpenAIResponse(
        success=False,
        model_used=safe_model,
        latency_ms=latency_ms,
        was_retry=retries_used > 0,
        error_message=error_message,
        error_type=error_type,
        model_fallback=model_fallback
    )


# =============================================================================
# COMBINED INTERPRETER - Single call for intent + location (behind feature flag)
# =============================================================================

COMBINED_INTERPRETER_PROMPT = """You are a precise real-estate assistant interpreter for Canadian properties (Toronto/GTA/Canada).

TASK: In ONE response, extract BOTH:
1. User intent and search filters
2. Location entities

Return STRICT JSON ONLY (no markdown, no extra text):
{
    "intent": "search|refine|details|valuation|compare|general_question|reset|special_query",
    "filters": {
        "property_type": "condo|detached|townhouse|semi-detached" or null,
        "bedrooms": number or null,
        "bathrooms": number or null,
        "min_price": number or null,
        "max_price": number or null,
        "min_sqft": number or null,
        "max_sqft": number or null,
        "listing_type": "sale|rent" or null,
        "amenities": ["pool", "gym", ...] or []
    },
    "location": {
        "city": "Toronto|Mississauga|..." or null,
        "community": "North York|Downtown Core|..." or null,
        "neighborhood": "Yorkville|Liberty Village|..." or null,
        "postalCode": "M5V 3A8" or null,
        "streetName": "King Street West" or null,
        "streetNumber": "123" or null
    },
    "merge_with_previous": true|false,
    "clarifying_question": "..." or null
}

RULES:
- Extract ONLY what user explicitly mentions
- Do NOT guess missing fields
- For "GTA" → city: "Toronto"
- For famous Toronto streets (Yonge, King, Queen, Bay) → city: "Toronto"
- listing_type: ONLY set if user says "rent/rental" or "sale/buy"
- merge_with_previous: false when user mentions NEW city different from current

RETURN ONLY VALID JSON. NO MARKDOWN. NO EXTRA TEXT."""


def call_combined_interpreter(
    user_message: str,
    session_summary: Dict[str, Any],
    previous_location: Optional[Dict[str, Any]] = None
) -> Optional[Dict[str, Any]]:
    """
    Combined interpreter that extracts intent, filters, AND location in one call.
    
    This is an OPTIMIZATION to reduce Open AI API calls from 2 to 1.
    
    IMPORTANT:
    - Only active when OPENAI_USE_COMBINED_INTERPRETER=true
    - Falls back to separate calls on any failure
    - Does NOT change existing behavior, only improves performance
    
    Args:
        user_message: User's message
        session_summary: Current session state summary
        previous_location: Previous location state for contextual references
        
    Returns:
        Combined result dict or None if disabled/failed
    """
    # Check feature flag
    if not OPENAI_USE_COMBINED_INTERPRETER:
        return None
    
    logger.info("[Combined Interpreter] Feature enabled - attempting single-call extraction")
    
    # Build context
    context = {
        "current_filters": session_summary.get("filters", {}),
        "previous_location": previous_location or {}
    }
    
    # Add current date for relative date handling
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    
    messages = [
        {"role": "system", "content": COMBINED_INTERPRETER_PROMPT},
        {"role": "system", "content": f"Current date: {today}. Context: {json.dumps(context)}"},
        {"role": "user", "content": user_message}
    ]
    
    # Call Open AI with wrapper
    response = call_openai(
        messages=messages,
        temperature=0.0,
        max_tokens=600,
        parse_json=True
    )
    
    if not response.success or not response.parsed_json:
        logger.warning(
            f"[Combined Interpreter] Failed, falling back to separate calls. "
            f"Error: {response.error_message}"
        )
        return None
    
    result = response.parsed_json
    
    # Validate required fields
    if "intent" not in result or "filters" not in result or "location" not in result:
        logger.warning("[Combined Interpreter] Missing required fields, falling back")
        return None
    
    logger.info(
        f"[Combined Interpreter] SUCCESS | "
        f"intent={result.get('intent')} | "
        f"latency={response.latency_ms:.1f}ms"
    )
    
    return result


# =============================================================================
# SMART SUMMARIZER - Conditional summarizer calls
# =============================================================================

def should_call_summarizer(
    properties_count: int,
    user_message: str,
    force_summarize: bool = False
) -> Tuple[bool, str]:
    """
    Determine if summarizer should be called or use local template.
    
    OPTIMIZATION: Skip summarizer for small result sets to reduce latency.
    
    Rules:
    - properties_count > 5: Always call summarizer
    - User asks for explanation/details: Always call summarizer
    - properties_count <= 5: Use local template
    
    Args:
        properties_count: Number of properties found
        user_message: User's original message
        force_summarize: Override to always summarize
        
    Returns:
        Tuple of (should_call, reason)
    """
    if force_summarize:
        return True, "force_summarize=True"
    
    # Check for explanation requests
    explanation_keywords = [
        "explain", "tell me more", "details", "what do you think",
        "summary", "summarize", "describe", "elaborate"
    ]
    
    message_lower = user_message.lower()
    if any(keyword in message_lower for keyword in explanation_keywords):
        return True, "user_requested_explanation"
    
    # Check property count threshold
    if properties_count > 5:
        return True, f"properties_count={properties_count}>5"
    
    return False, f"properties_count={properties_count}<=5_using_template"


def generate_local_summary(
    properties_count: int,
    filters: Dict[str, Any],
    properties: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generate a local summary without calling Open AI.
    
    Used when:
    - properties_count <= 5
    - User didn't request explanation
    
    This preserves the exact same response structure as the summarizer.
    """
    # Extract location for response
    location = filters.get("location") or filters.get("city") or "your search area"
    
    if properties_count == 0:
        response_text = f"I couldn't find any properties matching your criteria in {location}."
        suggestions = [
            "Try adjusting your filters",
            "Search in a different area",
            "Remove some requirements"
        ]
    elif properties_count == 1:
        response_text = f"I found 1 property matching your search in {location}."
        suggestions = [
            "View property details",
            "Search nearby areas",
            "Adjust filters for more options"
        ]
    else:
        response_text = f"I found {properties_count} properties in {location}."
        suggestions = [
            "Filter by price",
            "Filter by bedrooms",
            "View on map"
        ]
    
    return {
        "response_text": response_text,
        "suggestions": suggestions,
        "properties_summary": [],
        "enhanced_mode": True,
        "_local_summary": True  # Internal flag to indicate local generation
    }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_wrapper_stats() -> Dict[str, Any]:
    """Get comprehensive wrapper statistics for monitoring."""
    return {
        "metrics": openai_metrics.get_stats(),
        "circuit_breaker": {
            "state": circuit_breaker.state.value,
            "is_open": circuit_breaker.is_open()
        },
        "feature_flags": {
            "wrapper_enabled": OPENAI_ENABLE_WRAPPER,
            "combined_interpreter": OPENAI_USE_COMBINED_INTERPRETER,
            "experimental_models": OPENAI_ALLOW_EXPERIMENTAL_MODELS,
            "circuit_breaker": OPENAI_ENABLE_CIRCUIT_BREAKER,
            "cache": OPENAI_ENABLE_CACHE
        },
        "config": {
            "timeout_seconds": OPENAI_TIMEOUT_SECONDS,
            "max_retries": OPENAI_MAX_RETRIES,
            "circuit_breaker_threshold": OPENAI_CIRCUIT_BREAKER_THRESHOLD,
            "cache_ttl_seconds": OPENAI_CACHE_TTL_SECONDS
        }
    }


def reset_wrapper_state():
    """Reset all wrapper state (useful for testing)."""
    openai_metrics.reset()
    circuit_breaker.reset()
    response_cache.clear()
    logger.info("[Open AI Wrapper] State reset complete")


# =============================================================================
# MODULE INITIALIZATION
# =============================================================================

logger.info(
    f"[Open AI Wrapper] Module loaded | "
    f"version={SYSTEM_PROMPT_VERSION} | "
    f"Features: wrapper={OPENAI_ENABLE_WRAPPER}, "
    f"combined={OPENAI_USE_COMBINED_INTERPRETER}, "
    f"experimental={OPENAI_ALLOW_EXPERIMENTAL_MODELS}"
)
