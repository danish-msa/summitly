"""
Models module - Data schemas and models for the real estate chatbot
"""

# Import and expose valuation models for easy access
# Use relative imports to avoid circular import issues
try:
    from .valuation_models import (
        PropertyDetails,
        ValuationResult,
        ComparableProperty,
        AdjustmentItem
    )
    __all__ = [
        'schemas',
        'valuation_models',
        'PropertyDetails',
        'ValuationResult',
        'ComparableProperty',
        'AdjustmentItem'
    ]
except ImportError:
    # If valuation_models can't be imported, just expose module names
    __all__ = ['schemas', 'valuation_models']
