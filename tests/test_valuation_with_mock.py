#!/usr/bin/env python3
"""
Test the valuation system with MOCK data until Repliers API is resolved
"""

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from models.valuation_models import PropertyDetails, ComparableProperty, AdjustmentItem, ValuationResult
from datetime import date, timedelta

print("=" * 80)
print("VALUATION SYSTEM TEST - USING MOCK DATA")
print("=" * 80)
print()

# Create a mock subject property (simulating MLS #E12580230)
print("📍 Creating subject property (Mock: E12580230)")
print("-" * 80)

subject_property = PropertyDetails(
    mls_id="E12580230",
    address="123 Main Street",
    city="Toronto",
    province="ON",
    postal_code="M5H 2N2",
    property_type="Detached",
    bedrooms=4,
    bathrooms=3,
    sqft=2500,
    lot_size=5000,
    year_built=2010,
    condition="Excellent",
    style="2-Storey",
    basement_finish="Finished",
    garage_type="Attached",
    parking_spaces=2,
    features=["Hardwood Floors", "Granite Counters", "Updated Kitchen"],
    latitude=43.6532,
    longitude=-79.3832
)

print(f"✅ Subject Property: {subject_property.address}, {subject_property.city}")
print(f"   Type: {subject_property.property_type}, {subject_property.bedrooms} bed, {subject_property.bathrooms} bath")
print(f"   Size: {subject_property.sqft} sqft on {subject_property.lot_size} sqft lot")
print(f"   Year: {subject_property.year_built}, Condition: {subject_property.condition}")
print()

# Create mock comparable properties
print("🔍 Creating comparable sold properties...")
print("-" * 80)

comparables = [
    ComparableProperty(
        property_details=PropertyDetails(
            mls_id="C12580001",
            address="125 Main Street",
            city="Toronto",
            province="ON",
            postal_code="M5H 2N3",
            property_type="Detached",
            bedrooms=4,
            bathrooms=3,
            sqft=2450,
            lot_size=4800,
            year_built=2008,
            condition="Good",
            style="2-Storey",
            basement_finish="Finished",
            garage_type="Attached",
            parking_spaces=2,
            features=["Hardwood Floors", "Granite Counters"],
            latitude=43.6535,
            longitude=-79.3835
        ),
        sale_price=1_250_000,
        sale_date=date.today() - timedelta(days=45),
        days_on_market=30,
        original_list_price=1_299_000
    ),
    ComparableProperty(
        property_details=PropertyDetails(
            mls_id="C12580002",
            address="456 Oak Avenue",
            city="Toronto",
            province="ON",
            postal_code="M5H 2P1",
            property_type="Detached",
            bedrooms=4,
            bathrooms=2,
            sqft=2600,
            lot_size=5200,
            year_built=2012,
            condition="Excellent",
            style="2-Storey",
            basement_finish="Finished",
            garage_type="Attached",
            parking_spaces=2,
            features=["Hardwood Floors", "Granite Counters", "Updated Kitchen", "Pool"],
            latitude=43.6540,
            longitude=-79.3840
        ),
        sale_price=1_325_000,
        sale_date=date.today() - timedelta(days=60),
        days_on_market=25,
        original_list_price=1_349_000
    ),
    ComparableProperty(
        property_details=PropertyDetails(
            mls_id="C12580003",
            address="789 Elm Street",
            city="Toronto",
            province="ON",
            postal_code="M5H 2R5",
            property_type="Detached",
            bedrooms=3,
            bathrooms=3,
            sqft=2400,
            lot_size=4900,
            year_built=2009,
            condition="Good",
            style="2-Storey",
            basement_finish="Partially Finished",
            garage_type="Attached",
            parking_spaces=2,
            features=["Hardwood Floors"],
            latitude=43.6528,
            longitude=-79.3828
        ),
        sale_price=1_200_000,
        sale_date=date.today() - timedelta(days=30),
        days_on_market=35,
        original_list_price=1_229_000
    ),
]

print(f"✅ Created {len(comparables)} comparable properties")
for i, comp in enumerate(comparables, 1):
    print(f"   {i}. {comp.property_details.address}: ${comp.sale_price:,} ({comp.days_on_market} days)")
print()

# Calculate simple adjustments for each comparable
print("💰 Calculating Adjustments...")
print("-" * 80)

def calculate_adjustments(subject: PropertyDetails, comp: ComparableProperty) -> list:
    """Calculate simple adjustments between subject and comparable"""
    adjustments = []
    
    # Square footage adjustment ($150/sqft difference)
    sqft_diff = subject.sqft - comp.property_details.sqft
    if abs(sqft_diff) > 50:
        sqft_adj = sqft_diff * 150
        adjustments.append(AdjustmentItem(
            category="Size",
            description=f"Square footage: {comp.property_details.sqft} vs {subject.sqft} sqft",
            amount=sqft_adj,
            justification=f"${abs(sqft_adj)/abs(sqft_diff):.0f} per sqft difference"
        ))
    
    # Bedroom adjustment ($25,000 per bedroom)
    bed_diff = subject.bedrooms - comp.property_details.bedrooms
    if bed_diff != 0:
        bed_adj = bed_diff * 25_000
        adjustments.append(AdjustmentItem(
            category="Bedrooms",
            description=f"{comp.property_details.bedrooms} vs {subject.bedrooms} bedrooms",
            amount=bed_adj,
            justification="$25,000 per bedroom difference"
        ))
    
    # Bathroom adjustment ($15,000 per bathroom)
    bath_diff = subject.bathrooms - comp.property_details.bathrooms
    if bath_diff != 0:
        bath_adj = bath_diff * 15_000
        adjustments.append(AdjustmentItem(
            category="Bathrooms",
            description=f"{comp.property_details.bathrooms} vs {subject.bathrooms} bathrooms",
            amount=bath_adj,
            justification="$15,000 per bathroom difference"
        ))
    
    # Condition adjustment
    condition_values = {"Poor": -50_000, "Fair": -25_000, "Good": 0, "Excellent": 25_000}
    subj_cond_val = condition_values.get(subject.condition, 0)
    comp_cond_val = condition_values.get(comp.property_details.condition, 0)
    if subj_cond_val != comp_cond_val:
        cond_adj = subj_cond_val - comp_cond_val
        adjustments.append(AdjustmentItem(
            category="Condition",
            description=f"{comp.property_details.condition} vs {subject.condition}",
            amount=cond_adj,
            justification="Condition difference adjustment"
        ))
    
    # Lot size adjustment ($15/sqft difference)
    lot_diff = subject.lot_size - comp.property_details.lot_size
    if abs(lot_diff) > 500:
        lot_adj = lot_diff * 15
        adjustments.append(AdjustmentItem(
            category="Lot Size",
            description=f"{comp.property_details.lot_size} vs {subject.lot_size} sqft lot",
            amount=lot_adj,
            justification="$15 per sqft lot difference"
        ))
    
    return adjustments

# Apply adjustments to each comparable
for i, comp in enumerate(comparables, 1):
    print(f"\nComparable #{i}: {comp.property_details.address}")
    print(f"  Sale Price: ${comp.sale_price:,}")
    
    adjustments = calculate_adjustments(subject_property, comp)
    comp.adjustments = adjustments
    
    total_adj = sum(adj.amount for adj in adjustments)
    adjusted_price = comp.sale_price + total_adj
    comp.adjusted_price = adjusted_price
    
    print(f"  Adjustments:")
    for adj in adjustments:
        sign = "+" if adj.amount >= 0 else ""
        print(f"    • {adj.category}: {sign}${adj.amount:,} ({adj.description})")
    print(f"  Total Adjustment: ${total_adj:+,}")
    print(f"  Adjusted Price: ${adjusted_price:,}")

print()
print("=" * 80)
print("VALUATION ANALYSIS")
print("=" * 80)

# Calculate valuation statistics
adjusted_prices = [comp.adjusted_price for comp in comparables if comp.adjusted_price]
avg_price = sum(adjusted_prices) / len(adjusted_prices)
min_price = min(adjusted_prices)
max_price = max(adjusted_prices)
price_range = max_price - min_price

# Calculate weighted average (weight by recency and adjustment size)
weights = []
for comp in comparables:
    days_old = (date.today() - comp.sale_date).days
    recency_weight = max(0.5, 1.0 - (days_old / 180))  # Decay over 180 days
    
    total_adj = abs(sum(adj.amount for adj in comp.adjustments))
    adj_weight = max(0.5, 1.0 - (total_adj / comp.sale_price))  # Less weight for large adjustments
    
    weight = recency_weight * adj_weight
    weights.append(weight)

weighted_avg = sum(p * w for p, w in zip(adjusted_prices, weights)) / sum(weights)

# Create valuation result
valuation = ValuationResult(
    subject_property=subject_property,
    comparables=comparables,
    estimated_value=weighted_avg,
    value_range_low=min_price,
    value_range_high=max_price,
    confidence_level=0.85,
    valuation_date=date.today(),
    methodology="Direct Comparison Approach",
    adjustments_summary=[adj for comp in comparables for adj in comp.adjustments],
    market_conditions="Stable market with moderate inventory levels",
    appraiser_notes="Based on 3 recent sales within 2km radius. All comparables are similar 2-storey detached homes."
)

print(f"\n📊 ESTIMATED VALUE: ${valuation.estimated_value:,.0f}")
print(f"   Value Range: ${valuation.value_range_low:,.0f} - ${valuation.value_range_high:,.0f}")
print(f"   Confidence Level: {valuation.confidence_level * 100:.0f}%")
print(f"   Methodology: {valuation.methodology}")
print()
print(f"✅ Average of Adjusted Comparables: ${avg_price:,.0f}")
print(f"✅ Weighted Average (by recency & adjustment): ${weighted_avg:,.0f}")
print()
print("📝 Summary:")
print(f"   • 3 comparable sales analyzed")
print(f"   • Sale dates: {min(c.sale_date for c in comparables)} to {max(c.sale_date for c in comparables)}")
print(f"   • Days on market: {min(c.days_on_market for c in comparables)}-{max(c.days_on_market for c in comparables)} days")
print(f"   • Price spread: ${price_range:,.0f}")
print()
print("=" * 80)
print("✅ VALUATION SYSTEM TEST COMPLETE")
print("=" * 80)
print()
print("💡 Once Repliers API is working, this same logic will use REAL MLS data!")
