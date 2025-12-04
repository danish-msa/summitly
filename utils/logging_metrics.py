#!/usr/bin/env python3
"""
Structured Logging and Metrics for HuggingFace Integration
Real Estate Chatbot Performance Monitoring
"""

import json
import time
import logging
import logging.handlers
from typing import Dict, List, Optional, Any, Union
from datetime import datetime, timedelta
from pathlib import Path
from dataclasses import dataclass, asdict
from enum import Enum
import threading
from collections import defaultdict, Counter
import statistics
import asyncio

from config import LoggingConfig

class MetricType(str, Enum):
    """Types of metrics we track"""
    RESPONSE_TIME = "response_time"
    CONVERSATION_LENGTH = "conversation_length"
    MODEL_USAGE = "model_usage"
    INTENT_DISTRIBUTION = "intent_distribution"  
    ERROR_RATE = "error_rate"
    USER_SATISFACTION = "user_satisfaction"
    API_SUCCESS_RATE = "api_success_rate"
    SESSION_DURATION = "session_duration"

@dataclass
class ConversationMetric:
    """Individual conversation metric"""
    session_id: str
    timestamp: datetime
    metric_type: MetricType
    value: Union[float, int, str]
    metadata: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "metric_type": self.metric_type.value,
            "value": self.value,
            "metadata": self.metadata
        }

@dataclass
class PerformanceSnapshot:
    """Performance snapshot at a point in time"""
    timestamp: datetime
    total_conversations: int
    avg_response_time: float
    success_rate: float
    active_sessions: int
    model_usage: Dict[str, int]
    intent_distribution: Dict[str, int]
    error_summary: Dict[str, int]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class StructuredLogger:
    """Structured JSON logger for the HuggingFace service"""
    
    def __init__(self, service_name: str = "huggingface_service"):
        self.service_name = service_name
        self.setup_loggers()
        
    def setup_loggers(self):
        """Setup structured loggers for different purposes"""
        
        # Ensure log directory exists
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        
        # Main application logger
        self.app_logger = self._create_logger(
            "app", 
            log_dir / "app.log",
            logging.INFO
        )
        
        # HuggingFace API logger
        self.hf_logger = self._create_logger(
            "huggingface",
            log_dir / "huggingface.log", 
            logging.INFO
        )
        
        # Conversation logger
        self.conversation_logger = self._create_logger(
            "conversations",
            log_dir / "conversations.log",
            logging.INFO
        )
        
        # Error logger
        self.error_logger = self._create_logger(
            "errors",
            log_dir / "errors.log",
            logging.ERROR
        )
        
        # Performance metrics logger
        self.metrics_logger = self._create_logger(
            "metrics",
            log_dir / "metrics.log",
            logging.INFO
        )
    
    def _create_logger(self, name: str, log_file: Path, level: int) -> logging.Logger:
        """Create a structured logger with JSON formatting"""
        
        logger = logging.getLogger(f"{self.service_name}.{name}")
        logger.setLevel(level)
        
        # Clear any existing handlers
        logger.handlers.clear()
        
        # File handler with rotation
        file_handler = logging.handlers.RotatingFileHandler(
            log_file,
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5
        )
        
        # Console handler
        console_handler = logging.StreamHandler()
        
        # JSON formatter
        json_formatter = JSONFormatter()
        file_handler.setFormatter(json_formatter)
        console_handler.setFormatter(json_formatter)
        
        logger.addHandler(file_handler)
        logger.addHandler(console_handler)
        
        return logger
    
    def log_conversation_start(self, session_id: str, user_message: str, metadata: Dict = None):
        """Log conversation start"""
        self.conversation_logger.info("conversation_started", extra={
            "session_id": session_id,
            "user_message_length": len(user_message),
            "has_metadata": bool(metadata),
            "metadata": metadata or {}
        })
    
    def log_conversation_response(
        self, 
        session_id: str, 
        response_time: float,
        model_used: str,
        confidence_score: float,
        intent: str,
        success: bool,
        error: str = None
    ):
        """Log conversation response"""
        self.conversation_logger.info("conversation_response", extra={
            "session_id": session_id,
            "response_time": response_time,
            "model_used": model_used,
            "confidence_score": confidence_score,
            "intent": intent,
            "success": success,
            "error": error
        })
    
    def log_huggingface_api_call(
        self,
        model_name: str,
        request_time: float,
        status_code: int,
        success: bool,
        error_message: str = None
    ):
        """Log HuggingFace API calls"""
        self.hf_logger.info("api_call", extra={
            "model_name": model_name,
            "request_time": request_time,
            "status_code": status_code,
            "success": success,
            "error_message": error_message
        })
    
    def log_error(
        self,
        error_type: str,
        error_message: str,
        session_id: str = None,
        model_name: str = None,
        stack_trace: str = None
    ):
        """Log errors with context"""
        self.error_logger.error("service_error", extra={
            "error_type": error_type,
            "error_message": error_message,
            "session_id": session_id,
            "model_name": model_name,
            "stack_trace": stack_trace
        })
    
    def log_performance_metric(self, metric: ConversationMetric):
        """Log performance metrics"""
        self.metrics_logger.info("performance_metric", extra=metric.to_dict())

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        
        # Base log data
        log_data = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add extra fields if they exist
        if hasattr(record, '__dict__'):
            for key, value in record.__dict__.items():
                if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 
                              'filename', 'module', 'lineno', 'funcName', 'created', 'msecs',
                              'relativeCreated', 'thread', 'threadName', 'processName', 'process']:
                    log_data[key] = value
        
        return json.dumps(log_data, default=str)

class MetricsCollector:
    """Collect and aggregate performance metrics"""
    
    def __init__(self):
        self.metrics: List[ConversationMetric] = []
        self.session_data: Dict[str, Dict] = defaultdict(dict)
        self.lock = threading.Lock()
        self.logger = StructuredLogger()
        
        # Start background aggregation
        self.start_background_aggregation()
    
    def record_metric(
        self, 
        session_id: str,
        metric_type: MetricType,
        value: Union[float, int, str],
        metadata: Dict[str, Any] = None
    ):
        """Record a new metric"""
        metric = ConversationMetric(
            session_id=session_id,
            timestamp=datetime.now(),
            metric_type=metric_type,
            value=value,
            metadata=metadata or {}
        )
        
        with self.lock:
            self.metrics.append(metric)
            
            # Update session data
            if session_id not in self.session_data:
                self.session_data[session_id] = {
                    "created_at": datetime.now(),
                    "last_activity": datetime.now(),
                    "total_interactions": 0,
                    "response_times": [],
                    "models_used": Counter(),
                    "intents": Counter(),
                    "errors": 0
                }
            
            session = self.session_data[session_id]
            session["last_activity"] = datetime.now()
            
            if metric_type == MetricType.RESPONSE_TIME:
                session["response_times"].append(float(value))
                session["total_interactions"] += 1
            elif metric_type == MetricType.MODEL_USAGE:
                session["models_used"][str(value)] += 1
            elif metric_type == MetricType.INTENT_DISTRIBUTION:
                session["intents"][str(value)] += 1
            elif metric_type == MetricType.ERROR_RATE:
                session["errors"] += 1
        
        # Log the metric
        self.logger.log_performance_metric(metric)
    
    def get_session_metrics(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get metrics for a specific session"""
        with self.lock:
            if session_id not in self.session_data:
                return None
            
            session = self.session_data[session_id].copy()
            
            # Calculate derived metrics
            if session["response_times"]:
                session["avg_response_time"] = statistics.mean(session["response_times"])
                session["min_response_time"] = min(session["response_times"])
                session["max_response_time"] = max(session["response_times"])
                session["median_response_time"] = statistics.median(session["response_times"])
            
            # Session duration
            session["duration_minutes"] = (
                session["last_activity"] - session["created_at"]
            ).total_seconds() / 60
            
            # Error rate
            if session["total_interactions"] > 0:
                session["error_rate"] = session["errors"] / session["total_interactions"]
            else:
                session["error_rate"] = 0
            
            return session
    
    def get_global_metrics(self, time_window_hours: int = 24) -> Dict[str, Any]:
        """Get global metrics for the specified time window"""
        cutoff_time = datetime.now() - timedelta(hours=time_window_hours)
        
        with self.lock:
            # Filter metrics within time window
            recent_metrics = [m for m in self.metrics if m.timestamp >= cutoff_time]
            
            if not recent_metrics:
                return {
                    "time_window_hours": time_window_hours,
                    "no_data": True
                }
            
            # Aggregate metrics by type
            metrics_by_type = defaultdict(list)
            for metric in recent_metrics:
                metrics_by_type[metric.metric_type].append(metric.value)
            
            # Calculate aggregations
            global_metrics = {
                "time_window_hours": time_window_hours,
                "timestamp": datetime.now().isoformat(),
                "total_metrics": len(recent_metrics),
                "unique_sessions": len(set(m.session_id for m in recent_metrics))
            }
            
            # Response time metrics
            if MetricType.RESPONSE_TIME in metrics_by_type:
                response_times = [float(v) for v in metrics_by_type[MetricType.RESPONSE_TIME]]
                global_metrics["response_time"] = {
                    "count": len(response_times),
                    "avg": statistics.mean(response_times),
                    "min": min(response_times),
                    "max": max(response_times),
                    "median": statistics.median(response_times),
                    "p95": statistics.quantiles(response_times, n=20)[18] if len(response_times) > 20 else max(response_times)
                }
            
            # Model usage distribution
            if MetricType.MODEL_USAGE in metrics_by_type:
                model_counter = Counter(metrics_by_type[MetricType.MODEL_USAGE])
                global_metrics["model_usage"] = dict(model_counter)
            
            # Intent distribution
            if MetricType.INTENT_DISTRIBUTION in metrics_by_type:
                intent_counter = Counter(metrics_by_type[MetricType.INTENT_DISTRIBUTION])
                global_metrics["intent_distribution"] = dict(intent_counter)
            
            # Error rate
            error_count = len(metrics_by_type.get(MetricType.ERROR_RATE, []))
            total_interactions = len(metrics_by_type.get(MetricType.RESPONSE_TIME, []))
            if total_interactions > 0:
                global_metrics["error_rate"] = error_count / total_interactions
            else:
                global_metrics["error_rate"] = 0
            
            return global_metrics
    
    def generate_performance_snapshot(self) -> PerformanceSnapshot:
        """Generate a performance snapshot"""
        global_metrics = self.get_global_metrics(1)  # Last hour
        
        return PerformanceSnapshot(
            timestamp=datetime.now(),
            total_conversations=global_metrics.get("unique_sessions", 0),
            avg_response_time=global_metrics.get("response_time", {}).get("avg", 0),
            success_rate=1 - global_metrics.get("error_rate", 0),
            active_sessions=len([s for s in self.session_data.values() 
                               if (datetime.now() - s["last_activity"]).total_seconds() < 1800]),  # 30 min
            model_usage=global_metrics.get("model_usage", {}),
            intent_distribution=global_metrics.get("intent_distribution", {}),
            error_summary={"total_errors": global_metrics.get("total_metrics", 0) * global_metrics.get("error_rate", 0)}
        )
    
    def start_background_aggregation(self):
        """Start background task for metric aggregation"""
        def aggregate_metrics():
            while True:
                try:
                    # Generate hourly snapshot
                    snapshot = self.generate_performance_snapshot()
                    
                    # Log snapshot
                    self.logger.metrics_logger.info("performance_snapshot", extra=snapshot.to_dict())
                    
                    # Clean old metrics (keep last 7 days)
                    cutoff = datetime.now() - timedelta(days=7)
                    with self.lock:
                        self.metrics = [m for m in self.metrics if m.timestamp >= cutoff]
                    
                    # Clean old sessions (keep last 24 hours)
                    cutoff = datetime.now() - timedelta(hours=24)
                    with self.lock:
                        sessions_to_remove = [
                            sid for sid, data in self.session_data.items()
                            if data["last_activity"] < cutoff
                        ]
                        for sid in sessions_to_remove:
                            del self.session_data[sid]
                    
                    time.sleep(3600)  # Run every hour
                    
                except Exception as e:
                    self.logger.log_error("METRICS_AGGREGATION_ERROR", str(e))
                    time.sleep(60)  # Retry in 1 minute on error
        
        # Start in background thread
        thread = threading.Thread(target=aggregate_metrics, daemon=True)
        thread.start()

class PerformanceMonitor:
    """Context manager for monitoring conversation performance"""
    
    def __init__(self, session_id: str, metrics_collector: MetricsCollector):
        self.session_id = session_id
        self.metrics_collector = metrics_collector
        self.start_time = None
        self.metadata = {}
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.start_time:
            response_time = time.time() - self.start_time
            
            # Record response time
            self.metrics_collector.record_metric(
                session_id=self.session_id,
                metric_type=MetricType.RESPONSE_TIME,
                value=response_time,
                metadata=self.metadata
            )
            
            # Record error if exception occurred
            if exc_type:
                self.metrics_collector.record_metric(
                    session_id=self.session_id,
                    metric_type=MetricType.ERROR_RATE,
                    value=1,
                    metadata={
                        "error_type": exc_type.__name__,
                        "error_message": str(exc_val)
                    }
                )
    
    def set_metadata(self, **kwargs):
        """Set metadata for this monitoring session"""
        self.metadata.update(kwargs)

# Global instances
_structured_logger = None
_metrics_collector = None

def get_structured_logger() -> StructuredLogger:
    """Get singleton structured logger"""
    global _structured_logger
    if _structured_logger is None:
        _structured_logger = StructuredLogger()
    return _structured_logger

def get_metrics_collector() -> MetricsCollector:
    """Get singleton metrics collector"""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector

def monitor_performance(session_id: str) -> PerformanceMonitor:
    """Create a performance monitor context manager"""
    return PerformanceMonitor(session_id, get_metrics_collector())

# Utility functions for easy integration

def log_conversation_metrics(
    session_id: str,
    user_message: str,
    ai_response: str,
    model_used: str,
    response_time: float,
    confidence_score: float,
    intent: str,
    success: bool,
    error: str = None
):
    """Convenient function to log all conversation metrics"""
    logger = get_structured_logger()
    collector = get_metrics_collector()
    
    # Log structured conversation data
    logger.log_conversation_start(session_id, user_message)
    logger.log_conversation_response(
        session_id, response_time, model_used, 
        confidence_score, intent, success, error
    )
    
    # Record metrics
    collector.record_metric(session_id, MetricType.RESPONSE_TIME, response_time)
    collector.record_metric(session_id, MetricType.MODEL_USAGE, model_used)
    collector.record_metric(session_id, MetricType.INTENT_DISTRIBUTION, intent)
    
    if not success:
        collector.record_metric(session_id, MetricType.ERROR_RATE, 1, {"error": error})

# Testing
if __name__ == "__main__":
    print("🧪 Testing Logging and Metrics System...")
    
    # Test structured logger
    logger = get_structured_logger()
    logger.log_conversation_start("test_session", "Hello, I'm looking for a condo")
    logger.log_conversation_response(
        "test_session", 1.23, "facebook/blenderbot-400M-distill", 
        0.89, "property_search", True
    )
    
    # Test metrics collector
    collector = get_metrics_collector()
    collector.record_metric("test_session", MetricType.RESPONSE_TIME, 1.23)
    collector.record_metric("test_session", MetricType.MODEL_USAGE, "facebook/blenderbot-400M-distill")
    collector.record_metric("test_session", MetricType.INTENT_DISTRIBUTION, "property_search")
    
    # Test performance monitor
    with monitor_performance("test_session") as monitor:
        monitor.set_metadata(model="facebook/blenderbot-400M-distill", intent="property_search")
        time.sleep(0.1)  # Simulate processing time
    
    # Get metrics
    session_metrics = collector.get_session_metrics("test_session")
    if session_metrics:
        print("✅ Session metrics collected")
        print(f"   Total interactions: {session_metrics['total_interactions']}")
        print(f"   Avg response time: {session_metrics.get('avg_response_time', 0):.3f}s")
    
    global_metrics = collector.get_global_metrics(1)
    if global_metrics and not global_metrics.get("no_data"):
        print("✅ Global metrics calculated")
        print(f"   Unique sessions: {global_metrics['unique_sessions']}")
        print(f"   Error rate: {global_metrics['error_rate']:.3f}")
    
    print("\n✅ All logging and metrics tests completed!")