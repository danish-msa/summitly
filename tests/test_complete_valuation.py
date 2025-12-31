#!/usr/bin/env python3
"""
Test the complete valuation workflow with multiple comparables
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, timedelta
from models.valuation_models import PropertyDetails, ComparableProperty
from services.valuation_engine import estimate_market_value

print("=" * 80)
print("COMPLETE VALUATION WORKFLOW TEST")
print("=" * 80)
print()

# Create subject property
subject = PropertyDetails(
    mls_id="SUBJECT-001",
    address="456 Oak Avenue",
    city="Toronto",
    province="ON",
    postal_code="M4K 1A1",
    property_type="Detached",
    bedrooms=4,
    bathrooms=3.0,
    sqft=2400,
    lot_size=5000,
    year_built=2015,
    condition="Good",
    style="2-Storey",
    basement_finish="Fully Finished",
    garage_type="Attached",
    parking_spaces=2,
    features=["Hardwood Floors", "Granite Countertops", "Stainless Appliances"],
    latitude=43.6762,
    longitude=-79.3530
)

print("SUBJECT PROPERTY:")
print(f"  Address: {subject.address}, {subject.city}")
print(f"  Type: {subject.property_type}")
print(f"  Size: {subject.bedrooms} bed, {subject.bathrooms} bath, {subject.sqft:,} sqft")
print(f"  Lot: {subject.lot_size:,} sqft")
print(f"  Condition: {subject.condition}")
print(f"  Basement: {subject.basement_finish}")
print(f"  Garage: {subject.garage_type}, {subject.parking_spaces} spaces")
print()

# Create 5 comparable properties with varying similarity
comparables = []

# Comparable 1: Very similar, recent sale (STRONG)
comparables.append(ComparableProperty(
    property_details=PropertyDetails(
        mls_id="COMP-001",
        address="460 Oak Avenue",
        city="Toronto",
        province="ON",
        postal_code="M4K 1A2",
        property_type="Detached",
        bedrooms=4,
        bathrooms=3.0,
        sqft=2350,
        lot_size=4900,
        year_built=2016,
        condition="Good",
        style="2-Storey",
        basement_finish="Finished",
        garage_type="Attached",
        parking_spaces=2,
        features=["Hardwood Floors", "Granite Countertops"],
        latitude=43.6765,
        longitude=-79.3532
    ),
    sale_price=925000,
    sale_date=(datetime.now() - timedelta(days=15)).date(),
    days_on_market=12
))

# Comparable 2: Similar, sold 2 months ago (STRONG)
comparables.append(ComparableProperty(
    property_details=PropertyDetails(
        mls_id="COMP-002",
        address="15 Maple Street",
        city="Toronto",
        province="ON",
        postal_code="M4K 1B5",
        property_type="Detached",
        bedrooms=4,
        bathrooms=2.5,
        sqft=2450,
        lot_size=5200,
        year_built=2014,
        condition="Good",
        style="2-Storey",
        basement_finish="Partially",
        garage_type="Attached",
        parking_spaces=2,
        features=["Hardwood Floors"],
        latitude=43.6770,
        longitude=-79.3540
    ),
    sale_price=905000,
    sale_date=(datetime.now() - timedelta(days=60)).date(),
    days_on_market=18
))

# Comparable 3: Similar size, older (STRONG)
comparables.append(ComparableProperty(
    property_details=PropertyDetails(
        mls_id="COMP-003",
        address="22 Elm Road",
        city="Toronto",
        province="ON",
        postal_code="M4K 1C3",
        property_type="Detached",
        bedrooms=3,
        bathrooms=3.0,
        sqft=2400,
        lot_size=4800,
        year_built=2010,
        condition="Average",
        style="2-Storey",
        basement_finish="Finished",
        garage_type="Detached",
        parking_spaces=1,
        features=["Hardwood Floors"],
        latitude=43.6755,
        longitude=-79.3525
    ),
    sale_price=870000,
    sale_date=(datetime.now() - timedelta(days=45)).date(),
    days_on_market=25
))

# Comparable 4: Different property type (WEAK - Semi-Detached)
comparables.append(ComparableProperty(
    property_details=PropertyDetails(
        mls_id="COMP-004",
        address="88 Pine Avenue",
        city="Toronto",
        province="ON",
        postal_code="M4K 1D8",
        property_type="Semi-Detached",
        bedrooms=4,
        bathrooms=3.0,
        sqft=2300,
        lot_size=3500,
        year_built=2015,
        condition="Good",
        style="2-Storey",
        basement_finish="Finished",
        garage_type="Attached",
        parking_spaces=2,
        features=["Modern Kitchen"],
        latitude=43.6780,
        longitude=-79.3550
    ),
    sale_price=795000,
    sale_date=(datetime.now() - timedelta(days=30)).date(),
    days_on_market=20
))

# Comparable 5: Smaller house, different size (MODERATE)
comparables.append(ComparableProperty(
    property_details=PropertyDetails(
        mls_id="COMP-005",
        address="101 Cedar Court",
        city="Toronto",
        province="ON",
        postal_code="M4K 1E2",
        property_type="Detached",
        bedrooms=3,
        bathrooms=2.0,
        sqft=2000,
        lot_size=4500,
        year_built=2012,
        condition="Average",
        style="2-Storey",
        basement_finish="Unfinished",
        garage_type="Attached",
        parking_spaces=1,
        features=[],
        latitude=43.6750,
        longitude=-79.3520
    ),
    sale_price=825000,
    sale_date=(datetime.now() - timedelta(days=75)).date(),
    days_on_market=30
))

print("COMPARABLE PROPERTIES:")
for i, comp in enumerate(comparables, 1):
    print(f"\n{i}. {comp.property_details.mls_id} - {comp.property_details.address}")
    print(f"   Type: {comp.property_details.property_type}")
    print(f"   Size: {comp.property_details.bedrooms} bed, {comp.property_details.bathrooms} bath, {comp.property_details.sqft:,} sqft")
    print(f"   Sale: ${comp.sale_price:,.0f} on {comp.sale_date} ({(datetime.now().date() - comp.sale_date).days} days ago)")
    print(f"   Condition: {comp.property_details.condition}, Basement: {comp.property_details.basement_finish}")

print()
print("=" * 80)

# Market data
market_data = {
    'average_price': 920000,
    'median_price': 910000,
    'price_per_sqft': 480,
    'price_trend_3month': 0.025,  # 2.5% appreciation in 3 months
    'price_trend_6month': 0.05,   # 5% appreciation in 6 months
    'price_trend_12month': 0.08,  # 8% appreciation in 12 months
    'avg_days_on_market': 22,
    'inventory_level': 'Balanced',
    'sale_to_list_ratio': 0.98,
    'market_status': 'Balanced'
}

print("MARKET DATA:")
print(f"  Average Price: ${market_data['average_price']:,.0f}")
print(f"  Price/sqft: ${market_data['price_per_sqft']}")
print(f"  3-Month Trend: {market_data['price_trend_3month']*100:+.1f}%")
print(f"  Avg Days on Market: {market_data['avg_days_on_market']}")
print()

print("=" * 80)
print("RUNNING VALUATION...")
print("=" * 80)
print()

# Run valuation
result = estimate_market_value(subject, comparables, market_data)

print()
print("=" * 80)
print("VALUATION RESULTS")
print("=" * 80)
print()

print(f"📊 ESTIMATED MARKET VALUE: ${result.estimated_value:,.0f}")
print()
print(f"📈 VALUE RANGE:")
print(f"   Low:  ${result.value_range[0]:,.0f}")
print(f"   High: ${result.value_range[1]:,.0f}")
print(f"   Spread: ${result.value_range[1] - result.value_range[0]:,.0f} ({(result.value_range[1] - result.value_range[0]) / result.estimated_value * 100:.1f}%)")
print()

print(f"🎯 CONFIDENCE SCORE: {result.confidence_score:.1%}")
print()

print("📋 CONFIDENCE BREAKDOWN:")
for factor in result.market_analysis['confidence_breakdown']['factors']:
    print(f"   • {factor['description']}: {factor['impact']:+.1%}")
print()

print(f"💰 PRICE PER SQFT: ${result.market_analysis['price_per_sqft_estimate']:.2f}")
print(f"📈 MARKET TREND: {result.market_analysis['market_trend'].upper()} - {result.market_analysis['market_trend_description']}")
print(f"⏱️  ESTIMATED TIME TO SELL: {result.market_analysis['estimated_absorption_time']} days")
print()

print("📝 COMPARABLE SUMMARY:")
summary = result.market_analysis['valuation_summary']
print(f"   Total Reviewed: {summary['total_comparables_reviewed']}")
print(f"   Strong Comparables: {summary['strong_comparables']}")
print(f"   Weak Comparables: {summary['weak_comparables']}")
print(f"   Used in Final: {summary['comparables_used_final']}")
print()

print("🏘️  COMPARABLES USED (by relevance):")
for i, comp_data in enumerate(result.market_analysis['comparable_data'][:5], 1):
    if comp_data['relevance_score'] >= 50:  # Only show relevant ones
        quality = "✅ Strong" if not comp_data['is_weak'] else "⚠️  Weak"
        print(f"\n   {i}. {comp_data['mls_id']} {quality}")
        print(f"      Sale Price: ${comp_data['sale_price']:,.0f}")
        print(f"      Adjusted:   ${comp_data['adjusted_price']:,.0f} ({comp_data['net_adjustment_percent']:+.1f}%)")
        print(f"      Relevance:  {comp_data['relevance_score']:.1f}/100")
        if comp_data['distance_km']:
            print(f"      Distance:   {comp_data['distance_km']:.2f} km")

print()
print("=" * 80)
print("💡 REASONING:")
print("=" * 80)
print()
print(result.notes)
print()

print("=" * 80)
print("✅ TEST COMPLETE!")
print("=" * 80)
print()

print("Summary:")
print(f"  ✓ Analyzed {len(comparables)} comparable properties")
print(f"  ✓ Identified {summary['strong_comparables']} strong comparables")
print(f"  ✓ Used {summary['comparables_used_final']} for final reconciliation")
print(f"  ✓ Estimated value: ${result.estimated_value:,.0f} ±${(result.value_range[1] - result.value_range[0])/2:,.0f}")
print(f"  ✓ Confidence: {result.confidence_score:.1%}")
print(f"  ✓ Market outlook: {result.market_analysis['market_trend'].upper()}")
print()
