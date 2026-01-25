"""
Scalability Manager
==================
High-performance concurrency and scalability infrastructure for handling
1000+ users per second without response mixing or data corruption.

Features:
- Request context isolation (thread-local storage)
- Connection pooling (Redis, HTTP)
- Distributed locking (Redis-based)
- Request ID tracking
- In-memory LRU caching
- Graceful degradation
- Performance monitoring

Author: Summitly Team
Date: January 2026
"""

import contextvars
import functools
import hashlib
import logging
import threading
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Any, Callable, Dict, List, Optional, Set, Tuple
from collections import OrderedDict

try:
    import redis
    from redis.connection import ConnectionPool
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)


# =============================================================================
# REQUEST CONTEXT - Thread-safe request isolation
# =============================================================================

# Context vars are thread-safe and async-safe
_request_id_var = contextvars.ContextVar('request_id', default=None)
_session_id_var = contextvars.ContextVar('session_id', default=None)
_user_id_var = contextvars.ContextVar('user_id', default=None)
_request_start_time_var = contextvars.ContextVar('request_start_time', default=None)


class RequestContext:
    """
    Thread-safe request context manager.
    Ensures each request maintains its own isolated context.
    """
    
    @staticmethod
    def set_request_id(request_id: str) -> None:
        """Set request ID for current context."""
        _request_id_var.set(request_id)
    
    @staticmethod
    def get_request_id() -> Optional[str]:
        """Get request ID for current context."""
        return _request_id_var.get()
    
    @staticmethod
    def set_session_id(session_id: str) -> None:
        """Set session ID for current context."""
        _session_id_var.set(session_id)
    
    @staticmethod
    def get_session_id() -> Optional[str]:
        """Get session ID for current context."""
        return _session_id_var.get()
    
    @staticmethod
    def set_user_id(user_id: str) -> None:
        """Set user ID for current context."""
        _user_id_var.set(user_id)
    
    @staticmethod
    def get_user_id() -> Optional[str]:
        """Get user ID for current context."""
        return _user_id_var.get()
    
    @staticmethod
    def set_request_start_time(start_time: float) -> None:
        """Set request start time for current context."""
        _request_start_time_var.set(start_time)
    
    @staticmethod
    def get_request_start_time() -> Optional[float]:
        """Get request start time for current context."""
        return _request_start_time_var.get()
    
    @staticmethod
    def get_request_duration() -> Optional[float]:
        """Get duration of current request in seconds."""
        start_time = _request_start_time_var.get()
        if start_time is None:
            return None
        return time.time() - start_time
    
    @staticmethod
    @contextmanager
    def create(session_id: str, user_id: Optional[str] = None):
        """
        Context manager that sets up request context.
        
        Usage:
            with RequestContext.create(session_id="abc123"):
                # Your code here has isolated context
                pass
        """
        request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Set context vars
        token_request = _request_id_var.set(request_id)
        token_session = _session_id_var.set(session_id)
        token_user = _user_id_var.set(user_id) if user_id else None
        token_time = _request_start_time_var.set(start_time)
        
        try:
            yield {
                'request_id': request_id,
                'session_id': session_id,
                'user_id': user_id,
                'start_time': start_time
            }
        finally:
            # Clean up context vars
            _request_id_var.reset(token_request)
            _session_id_var.reset(token_session)
            if token_user:
                _user_id_var.reset(token_user)
            _request_start_time_var.reset(token_time)


def with_request_context(func: Callable) -> Callable:
    """
    Decorator that automatically creates request context.
    
    Usage:
        @with_request_context
        def process_message(session_id: str, message: str):
            # Automatically has request context
            request_id = RequestContext.get_request_id()
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Extract session_id from args/kwargs
        session_id = kwargs.get('session_id')
        if not session_id and len(args) > 0:
            # Assume first arg is session_id
            session_id = args[0] if isinstance(args[0], str) else None
        
        if not session_id:
            # No session ID found, create a temporary one
            session_id = f"temp_{uuid.uuid4()}"
        
        with RequestContext.create(session_id=session_id):
            return func(*args, **kwargs)
    
    return wrapper


# =============================================================================
# DISTRIBUTED LOCKING - Prevent concurrent session modifications
# =============================================================================

class DistributedLock:
    """
    Redis-based distributed lock to prevent concurrent modifications
    to the same session across multiple server instances.
    """
    
    def __init__(
        self,
        redis_client: Optional['redis.Redis'],
        lock_timeout: int = 10,
        retry_delay: float = 0.1,
        max_retries: int = 50
    ):
        """
        Initialize distributed lock manager.
        
        Args:
            redis_client: Redis client for distributed locking
            lock_timeout: Lock expiration time in seconds
            retry_delay: Delay between lock acquisition retries
            max_retries: Maximum number of lock acquisition attempts
        """
        self.redis_client = redis_client
        self.lock_timeout = lock_timeout
        self.retry_delay = retry_delay
        self.max_retries = max_retries
        self._local_locks: Dict[str, threading.Lock] = {}
        self._local_lock_mutex = threading.Lock()
    
    def _get_local_lock(self, key: str) -> threading.Lock:
        """Get or create local thread lock for key."""
        with self._local_lock_mutex:
            if key not in self._local_locks:
                self._local_locks[key] = threading.Lock()
            return self._local_locks[key]
    
    @contextmanager
    def acquire(self, key: str, blocking: bool = True):
        """
        Acquire distributed lock for a key.
        
        Args:
            key: Lock key (e.g., "session:abc123")
            blocking: Whether to wait for lock or fail immediately
        
        Raises:
            RuntimeError: If lock cannot be acquired
        
        Usage:
            with lock_manager.acquire("session:abc123"):
                # Critical section - only one process can execute this
                modify_session_state()
        """
        lock_key = f"lock:{key}"
        lock_value = str(uuid.uuid4())
        acquired = False
        
        # First, acquire local thread lock
        local_lock = self._get_local_lock(key)
        local_acquired = local_lock.acquire(blocking=blocking)
        
        if not local_acquired:
            raise RuntimeError(f"Failed to acquire local lock for {key}")
        
        try:
            # If Redis available, acquire distributed lock
            if self.redis_client:
                retries = 0
                while retries < self.max_retries:
                    # Try to set lock with NX (only if not exists) and EX (expiration)
                    acquired = self.redis_client.set(
                        lock_key,
                        lock_value,
                        nx=True,
                        ex=self.lock_timeout
                    )
                    
                    if acquired:
                        break
                    
                    if not blocking:
                        raise RuntimeError(f"Failed to acquire distributed lock for {key}")
                    
                    time.sleep(self.retry_delay)
                    retries += 1
                
                if not acquired:
                    raise RuntimeError(
                        f"Failed to acquire distributed lock for {key} "
                        f"after {self.max_retries} attempts"
                    )
            
            # Lock acquired, yield control
            yield
            
        finally:
            # Release distributed lock
            if self.redis_client and acquired:
                # Use Lua script to ensure we only delete our own lock
                lua_script = """
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
                """
                self.redis_client.eval(lua_script, 1, lock_key, lock_value)
            
            # Release local lock
            local_lock.release()


# =============================================================================
# LRU CACHE - In-memory caching for frequent reads
# =============================================================================

class LRUCache:
    """
    Thread-safe LRU (Least Recently Used) cache with TTL support.
    Reduces Redis/DB load for frequently accessed data.
    """
    
    def __init__(self, max_size: int = 10000, default_ttl: int = 300):
        """
        Initialize LRU cache.
        
        Args:
            max_size: Maximum number of items to cache
            default_ttl: Default TTL in seconds for cached items
        """
        self.max_size = max_size
        self.default_ttl = default_ttl
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = threading.RLock()
        self._hits = 0
        self._misses = 0
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if not found/expired
        """
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            
            value, expiry = self._cache[key]
            
            # Check if expired
            if time.time() > expiry:
                del self._cache[key]
                self._misses += 1
                return None
            
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self._hits += 1
            return value
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if None)
        """
        ttl = ttl if ttl is not None else self.default_ttl
        expiry = time.time() + ttl
        
        with self._lock:
            # If key exists, remove it first
            if key in self._cache:
                del self._cache[key]
            
            # Add to cache
            self._cache[key] = (value, expiry)
            
            # Evict oldest if over max_size
            if len(self._cache) > self.max_size:
                self._cache.popitem(last=False)
    
    def delete(self, key: str) -> None:
        """Delete key from cache."""
        with self._lock:
            self._cache.pop(key, None)
    
    def clear(self) -> None:
        """Clear entire cache."""
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        with self._lock:
            total = self._hits + self._misses
            hit_rate = (self._hits / total * 100) if total > 0 else 0
            
            return {
                'size': len(self._cache),
                'max_size': self.max_size,
                'hits': self._hits,
                'misses': self._misses,
                'hit_rate': round(hit_rate, 2),
                'total_requests': total
            }


# =============================================================================
# REDIS CONNECTION POOL - Efficient connection management
# =============================================================================

class RedisConnectionManager:
    """
    Manages Redis connection pools for high-performance concurrent access.
    """
    
    def __init__(
        self,
        redis_url: Optional[str] = None,
        max_connections: int = 100,
        socket_timeout: int = 5,
        socket_connect_timeout: int = 5,
        retry_on_timeout: bool = True
    ):
        """
        Initialize Redis connection manager.
        
        Args:
            redis_url: Redis connection URL
            max_connections: Maximum connections in pool
            socket_timeout: Socket timeout in seconds
            socket_connect_timeout: Connection timeout in seconds
            retry_on_timeout: Whether to retry on timeout
        """
        self.redis_url = redis_url
        self.pool = None
        self.client = None
        
        if redis_url and REDIS_AVAILABLE:
            try:
                self.pool = ConnectionPool.from_url(
                    redis_url,
                    max_connections=max_connections,
                    socket_timeout=socket_timeout,
                    socket_connect_timeout=socket_connect_timeout,
                    retry_on_timeout=retry_on_timeout,
                    decode_responses=True
                )
                self.client = redis.Redis(connection_pool=self.pool)
                
                # Test connection
                self.client.ping()
                logger.info(
                    f"✅ Redis connection pool initialized | "
                    f"max_connections={max_connections}"
                )
            except Exception as e:
                logger.warning(f"⚠️ Redis connection failed: {e}")
                self.pool = None
                self.client = None
    
    def get_client(self) -> Optional['redis.Redis']:
        """Get Redis client from pool."""
        return self.client
    
    def close(self) -> None:
        """Close connection pool."""
        if self.pool:
            self.pool.disconnect()
            logger.info("Redis connection pool closed")


# =============================================================================
# PERFORMANCE MONITOR - Track response times and throughput
# =============================================================================

class PerformanceMonitor:
    """
    Monitors system performance and provides metrics.
    """
    
    def __init__(self, window_size: int = 60):
        """
        Initialize performance monitor.
        
        Args:
            window_size: Time window in seconds for metrics
        """
        self.window_size = window_size
        self._requests: List[Tuple[float, float]] = []  # (timestamp, duration)
        self._lock = threading.Lock()
    
    def record_request(self, duration: float) -> None:
        """Record a request with its duration."""
        now = time.time()
        with self._lock:
            self._requests.append((now, duration))
            # Clean old requests outside window
            cutoff = now - self.window_size
            self._requests = [(t, d) for t, d in self._requests if t > cutoff]
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        now = time.time()
        with self._lock:
            # Clean old requests
            cutoff = now - self.window_size
            active_requests = [(t, d) for t, d in self._requests if t > cutoff]
            
            if not active_requests:
                return {
                    'requests_per_second': 0,
                    'avg_response_time': 0,
                    'p95_response_time': 0,
                    'p99_response_time': 0,
                    'total_requests': 0
                }
            
            durations = [d for _, d in active_requests]
            durations.sort()
            
            # Calculate metrics
            rps = len(active_requests) / self.window_size
            avg = sum(durations) / len(durations)
            p95_idx = int(len(durations) * 0.95)
            p99_idx = int(len(durations) * 0.99)
            
            return {
                'requests_per_second': round(rps, 2),
                'avg_response_time': round(avg, 3),
                'p95_response_time': round(durations[p95_idx], 3),
                'p99_response_time': round(durations[p99_idx], 3),
                'total_requests': len(active_requests)
            }


# =============================================================================
# SCALABILITY MANAGER - Main coordination class
# =============================================================================

class ScalabilityManager:
    """
    Main scalability manager that coordinates all high-performance components.
    """
    
    def __init__(
        self,
        redis_url: Optional[str] = None,
        cache_size: int = 10000,
        cache_ttl: int = 300,
        lock_timeout: int = 10,
        max_redis_connections: int = 100
    ):
        """
        Initialize scalability manager.
        
        Args:
            redis_url: Redis connection URL
            cache_size: LRU cache size
            cache_ttl: Cache TTL in seconds
            lock_timeout: Distributed lock timeout
            max_redis_connections: Max Redis connections
        """
        # Initialize Redis connection manager
        self.redis_manager = RedisConnectionManager(
            redis_url=redis_url,
            max_connections=max_redis_connections
        )
        
        # Initialize distributed lock manager
        self.lock_manager = DistributedLock(
            redis_client=self.redis_manager.get_client(),
            lock_timeout=lock_timeout
        )
        
        # Initialize LRU cache
        self.cache = LRUCache(
            max_size=cache_size,
            default_ttl=cache_ttl
        )
        
        # Initialize performance monitor
        self.performance_monitor = PerformanceMonitor()
        
        logger.info(
            f"✅ ScalabilityManager initialized | "
            f"redis={'enabled' if self.redis_manager.client else 'disabled'} | "
            f"cache_size={cache_size} | "
            f"lock_timeout={lock_timeout}s"
        )
    
    def get_redis_client(self) -> Optional['redis.Redis']:
        """Get Redis client."""
        return self.redis_manager.get_client()
    
    def acquire_session_lock(self, session_id: str):
        """
        Acquire distributed lock for session.
        
        Usage:
            with manager.acquire_session_lock("session_123"):
                # Modify session state safely
                pass
        """
        return self.lock_manager.acquire(f"session:{session_id}")
    
    def cache_get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        return self.cache.get(key)
    
    def cache_set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value in cache."""
        self.cache.set(key, value, ttl)
    
    def cache_delete(self, key: str) -> None:
        """Delete key from cache."""
        self.cache.delete(key)
    
    def record_request(self, duration: float) -> None:
        """Record request for performance tracking."""
        self.performance_monitor.record_request(duration)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics."""
        return {
            'cache': self.cache.get_stats(),
            'performance': self.performance_monitor.get_metrics(),
            'redis': {
                'available': self.redis_manager.client is not None
            }
        }
    
    def close(self) -> None:
        """Cleanup resources."""
        self.redis_manager.close()


# =============================================================================
# GLOBAL INSTANCE
# =============================================================================

# Singleton instance
_scalability_manager: Optional[ScalabilityManager] = None


def get_scalability_manager(
    redis_url: Optional[str] = None,
    cache_size: int = 10000
) -> ScalabilityManager:
    """
    Get or create global scalability manager instance.
    
    Args:
        redis_url: Redis connection URL
        cache_size: LRU cache size
    
    Returns:
        ScalabilityManager instance
    """
    global _scalability_manager
    
    if _scalability_manager is None:
        _scalability_manager = ScalabilityManager(
            redis_url=redis_url,
            cache_size=cache_size
        )
    
    return _scalability_manager


# =============================================================================
# UTILITY DECORATORS
# =============================================================================

def with_performance_tracking(func: Callable) -> Callable:
    """
    Decorator that tracks function performance.
    
    Usage:
        @with_performance_tracking
        def process_message(session_id, message):
            # Function is automatically tracked
            pass
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start_time
            
            # Record performance
            manager = get_scalability_manager()
            manager.record_request(duration)
            
            # Add duration to context
            request_id = RequestContext.get_request_id()
            if request_id:
                logger.info(
                    f"⏱️ Request completed | "
                    f"request_id={request_id} | "
                    f"duration={duration:.3f}s"
                )
            
            return result
        except Exception as e:
            duration = time.time() - start_time
            logger.error(
                f"❌ Request failed | "
                f"duration={duration:.3f}s | "
                f"error={str(e)}"
            )
            raise
    
    return wrapper


def with_session_lock(func: Callable) -> Callable:
    """
    Decorator that automatically acquires session lock.
    
    Usage:
        @with_session_lock
        def update_session(session_id, data):
            # Session is automatically locked
            pass
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        # Extract session_id
        session_id = kwargs.get('session_id')
        if not session_id and len(args) > 0:
            session_id = args[0] if isinstance(args[0], str) else None
        
        if not session_id:
            # No session ID, proceed without lock
            return func(*args, **kwargs)
        
        # Acquire lock
        manager = get_scalability_manager()
        with manager.acquire_session_lock(session_id):
            return func(*args, **kwargs)
    
    return wrapper
