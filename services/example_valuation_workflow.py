#!/usr/bin/env python3
"""
Simple example demonstrating the complete property valuation workflow.

This script shows how to:
1. Fetch property details by MLS ID
2. Find comparable sold properties
3. Calculate adjustments
4. Generate valuation estimate
5. Export results

Usage:
    python example_valuation_workflow.py
"""

from services.repliers_valuation_api import (
    fetch_property_details,
    find_comparables,
    get_market_data,
    get_cache_stats
)
from models.valuation_models import (
    ValuationResult,
    AdjustmentItem
)
from datetime import date


def calculate_simple_adjustments(subject, comparable_property):
    """
    Calculate basic adjustments between subject and comparable property.
    
    This is a simplified adjustment calculation. In production, you'd use
    more sophisticated methods based on local market data.
    
    Args:
        subject: PropertyDetails of subject property
        comparable_property: ComparableProperty object (not just PropertyDetails)
    """
    adjustments = []
    comparable = comparable_property.property_details
    sale_price = comparable_property.sale_price
    
    # Size adjustment ($50 per sqft difference)
    sqft_diff = subject.sqft - comparable.sqft
    if abs(sqft_diff) > 50:  # Only adjust if difference > 50 sqft
        amount = sqft_diff * 50
        percentage = (amount / sale_price) * 100
        adjustments.append(AdjustmentItem(
            adjustment_category='Size',
            amount=amount,
            percentage=percentage,
            reasoning=f"Subject property is {abs(sqft_diff)} sqft {'larger' if sqft_diff > 0 else 'smaller'}"
        ))
    
    # Bedroom adjustment ($25,000 per bedroom)
    bed_diff = subject.bedrooms - comparable.bedrooms
    if bed_diff != 0:
        amount = bed_diff * 25000
        percentage = (amount / sale_price) * 100
        adjustments.append(AdjustmentItem(
            adjustment_category='Bedrooms',
            amount=amount,
            percentage=percentage,
            reasoning=f"Subject has {abs(bed_diff)} {'more' if bed_diff > 0 else 'fewer'} bedroom(s)"
        ))
    
    # Bathroom adjustment ($15,000 per bathroom)
    bath_diff = subject.bathrooms - comparable.bathrooms
    if abs(bath_diff) >= 0.5:
        amount = bath_diff * 15000
        percentage = (amount / sale_price) * 100
        adjustments.append(AdjustmentItem(
            adjustment_category='Bathrooms',
            amount=amount,
            percentage=percentage,
            reasoning=f"Subject has {abs(bath_diff):.1f} {'more' if bath_diff > 0 else 'fewer'} bathroom(s)"
        ))
    
    # Condition adjustment (if available)
    condition_values = {
        'Excellent': 4,
        'Good': 3,
        'Average': 2,
        'Fair': 1,
        'Poor': 0
    }
    
    subject_condition = condition_values.get(subject.condition, 2)
    comp_condition = condition_values.get(comparable.condition, 2)
    
    if subject_condition != comp_condition:
        # $10,000 per condition level difference
        amount = (subject_condition - comp_condition) * 10000
        percentage = (amount / sale_price) * 100
        adjustments.append(AdjustmentItem(
            adjustment_category='Condition',
            amount=amount,
            percentage=percentage,
            reasoning=f"Subject in {subject.condition} vs {comparable.condition} condition"
        ))
    
    # Age adjustment (if year_built available)
    if subject.year_built and comparable.year_built:
        age_diff = comparable.year_built - subject.year_built  # Older comp = adjustment up
        if abs(age_diff) >= 5:
            # $1,000 per year difference
            amount = age_diff * 1000
            percentage = (amount / sale_price) * 100
            adjustments.append(AdjustmentItem(
                adjustment_category='Age',
                amount=amount,
                percentage=percentage,
                reasoning=f"Subject is {abs(age_diff)} years {'newer' if age_diff > 0 else 'older'}"
            ))
    
    return adjustments


def run_valuation_example():
    """Run a complete property valuation example."""
    
    print("=" * 80)
    print("Canadian Real Estate Property Valuation - Example Workflow")
    print("=" * 80)
    
    # Step 1: Fetch subject property
    print("\n📍 Step 1: Fetching Subject Property")
    print("-" * 80)
    
    # Try with a real MLS ID (will fail with demo API key, but shows the flow)
    mls_id = 'C8753210'
    subject = fetch_property_details(mls_id)
    
    if not subject:
        print(f"⚠️  Could not fetch property {mls_id} (using mock data for demo)")
        # Create mock subject property
        from models.valuation_models import PropertyDetails
        subject = PropertyDetails(
            mls_id='DEMO123',
            address='123 Main Street',
            city='Toronto',
            province='ON',
            postal_code='M5V 3A8',
            property_type='Detached',
            bedrooms=4,
            bathrooms=3.5,
            sqft=2500,
            lot_size=5000,
            year_built=2015,
            condition='Excellent',
            style='2-Storey',
            basement_finish='Finished',
            garage_type='Attached',
            parking_spaces=2,
            features=['Hardwood Floors', 'Granite Countertops', 'Renovated Kitchen']
        )
    
    print(f"\n✅ Subject Property:")
    print(f"   {subject.get_summary()}")
    print(f"   MLS: {subject.mls_id}")
    print(f"   Type: {subject.property_type}")
    print(f"   Condition: {subject.condition}")
    
    # Step 2: Find comparable properties
    print("\n\n🔍 Step 2: Finding Comparable Properties")
    print("-" * 80)
    
    comparables = find_comparables(
        subject_property=subject,
        limit=8,
        radius_km=3.0,
        max_age_days=180
    )
    
    if not comparables:
        print("⚠️  No comparables found via API (creating mock data for demo)")
        # Create mock comparables
        from models.valuation_models import ComparableProperty
        
        mock_comps_data = [
            {
                'mls': 'COMP001', 'address': '456 Oak Avenue', 
                'sqft': 2400, 'beds': 4, 'baths': 3.0, 'year': 2014,
                'sale_price': 1200000, 'sale_date': date(2025, 10, 15)
            },
            {
                'mls': 'COMP002', 'address': '789 Elm Street',
                'sqft': 2550, 'beds': 4, 'baths': 3.5, 'year': 2016,
                'sale_price': 1280000, 'sale_date': date(2025, 11, 1)
            },
            {
                'mls': 'COMP003', 'address': '321 Pine Road',
                'sqft': 2450, 'beds': 3, 'baths': 3.0, 'year': 2015,
                'sale_price': 1185000, 'sale_date': date(2025, 10, 20)
            },
            {
                'mls': 'COMP004', 'address': '654 Maple Drive',
                'sqft': 2520, 'beds': 4, 'baths': 3.5, 'year': 2015,
                'sale_price': 1265000, 'sale_date': date(2025, 11, 10)
            },
            {
                'mls': 'COMP005', 'address': '987 Cedar Lane',
                'sqft': 2480, 'beds': 4, 'baths': 3.0, 'year': 2014,
                'sale_price': 1220000, 'sale_date': date(2025, 10, 25)
            }
        ]
        
        comparables = []
        for comp_data in mock_comps_data:
            from models.valuation_models import PropertyDetails
            comp_property = PropertyDetails(
                mls_id=comp_data['mls'],
                address=comp_data['address'],
                city='Toronto',
                province='ON',
                postal_code='M5V 2B9',
                property_type='Detached',
                bedrooms=comp_data['beds'],
                bathrooms=comp_data['baths'],
                sqft=comp_data['sqft'],
                lot_size=4900,
                year_built=comp_data['year'],
                condition='Good',
                style='2-Storey',
                basement_finish='Finished',
                garage_type='Attached',
                parking_spaces=2
            )
            
            comp = ComparableProperty(
                property_details=comp_property,
                sale_price=comp_data['sale_price'],
                sale_date=comp_data['sale_date'],
                days_on_market=18,
                distance_from_subject=1.2,
                similarity_score=92.0
            )
            comparables.append(comp)
    
    print(f"\n✅ Found {len(comparables)} comparable properties:")
    for i, comp in enumerate(comparables, 1):
        print(f"\n   {i}. {comp.property_details.address}")
        print(f"      MLS: {comp.property_details.mls_id}")
        print(f"      Sale Price: ${comp.sale_price:,.0f}")
        print(f"      Sale Date: {comp.sale_date}")
        print(f"      Size: {comp.property_details.sqft:,} sqft")
        print(f"      Beds/Baths: {comp.property_details.bedrooms}/{comp.property_details.bathrooms}")
        if comp.similarity_score:
            print(f"      Similarity: {comp.similarity_score:.1f}%")
    
    # Step 3: Calculate adjustments
    print("\n\n🔧 Step 3: Calculating Adjustments")
    print("-" * 80)
    
    for comp in comparables:
        adjustments = calculate_simple_adjustments(subject, comp)
        comp.adjustments = adjustments
    
    print("\n✅ Adjustments calculated for all comparables:")
    for i, comp in enumerate(comparables, 1):
        total_adj = comp.calculate_total_adjustments()
        adj_price = comp.get_adjusted_price()
        print(f"\n   {i}. {comp.property_details.address}")
        print(f"      Original: ${comp.sale_price:,.0f}")
        print(f"      Adjustments: {'+' if total_adj >= 0 else ''}${total_adj:,.0f} ({comp.calculate_total_adjustment_percentage():+.1f}%)")
        print(f"      Adjusted: ${adj_price:,.0f}")
        
        if comp.adjustments:
            for adj in comp.adjustments:
                sign = '+' if adj.amount >= 0 else ''
                print(f"         • {adj.adjustment_category}: {sign}${adj.amount:,.0f} - {adj.reasoning}")
    
    # Step 4: Calculate valuation
    print("\n\n💰 Step 4: Calculating Estimated Value")
    print("-" * 80)
    
    adjusted_prices = [comp.get_adjusted_price() for comp in comparables]
    estimated_value = sum(adjusted_prices) / len(adjusted_prices)
    
    # Calculate value range (±4%)
    value_range = (estimated_value * 0.96, estimated_value * 1.04)
    
    # Calculate confidence score based on consistency
    price_variance = max(adjusted_prices) - min(adjusted_prices)
    variance_percent = (price_variance / estimated_value) * 100
    
    # Higher confidence if prices are more consistent
    if variance_percent < 5:
        confidence = 95.0
    elif variance_percent < 10:
        confidence = 85.0
    elif variance_percent < 15:
        confidence = 75.0
    else:
        confidence = 65.0
    
    print(f"\n✅ Valuation Calculated:")
    print(f"   Adjusted Prices Range: ${min(adjusted_prices):,.0f} - ${max(adjusted_prices):,.0f}")
    print(f"   Average: ${estimated_value:,.0f}")
    print(f"   Median: ${sorted(adjusted_prices)[len(adjusted_prices)//2]:,.0f}")
    print(f"   Value Range: ${value_range[0]:,.0f} - ${value_range[1]:,.0f}")
    print(f"   Confidence: {confidence:.1f}%")
    
    # Step 5: Get market data
    print("\n\n📊 Step 5: Fetching Market Context")
    print("-" * 80)
    
    market = get_market_data(subject.city, subject.province)
    
    print(f"\n✅ Market Data for {market['city']}, {market['province']}:")
    print(f"   Median Price: ${market['median_price']:,.0f}")
    print(f"   Price per Sqft: ${market['price_per_sqft']:.2f}")
    print(f"   Market Status: {market['market_status']}")
    print(f"   Avg Days on Market: {market['avg_days_on_market']} days")
    print(f"   Price Trend (3 months): {market['price_trend_3month']:+.1f}%")
    print(f"   Sale-to-List Ratio: {market['sale_to_list_ratio']:.2f}")
    print(f"   Data Source: {market['data_source']}")
    
    # Step 6: Create ValuationResult
    print("\n\n📝 Step 6: Creating Valuation Report")
    print("-" * 80)
    
    valuation = ValuationResult(
        subject_property=subject,
        comparables=comparables,
        estimated_value=estimated_value,
        value_range=value_range,
        confidence_score=confidence,
        market_analysis={
            'median_price': market['median_price'],
            'price_per_sqft': market['price_per_sqft'],
            'market_status': market['market_status'],
            'avg_days_on_market': market['avg_days_on_market'],
            'price_trend_3month': market['price_trend_3month'],
            'sale_to_list_ratio': market['sale_to_list_ratio']
        },
        notes=f'Valuation based on {len(comparables)} comparable sales within 3km radius, all sold within last 6 months'
    )
    
    print("\n✅ Valuation Report Created!")
    print("\n" + "=" * 80)
    print(valuation.get_valuation_summary())
    print("=" * 80)
    
    # Additional analysis
    print("\n\n📈 Additional Analysis")
    print("-" * 80)
    
    psf_analysis = valuation.get_price_per_sqft_analysis()
    print(f"\n✅ Price per Square Foot Analysis:")
    print(f"   Subject (Estimated): ${psf_analysis['subject_estimated_price_per_sqft']:.2f}/sqft")
    print(f"   Comparables Average: ${psf_analysis['avg_price_per_sqft']:.2f}/sqft")
    print(f"   Comparables Range: ${psf_analysis['min_price_per_sqft']:.2f} - ${psf_analysis['max_price_per_sqft']:.2f}/sqft")
    print(f"   Market Average: ${market['price_per_sqft']:.2f}/sqft")
    
    stats = valuation.get_comparable_statistics()
    print(f"\n✅ Comparable Statistics:")
    print(f"   Count: {stats['count']}")
    print(f"   Average Adjusted Price: ${stats['average_adjusted_price']:,.0f}")
    print(f"   Median Adjusted Price: ${stats['median_adjusted_price']:,.0f}")
    print(f"   Price Range: ${stats['price_range'][0]:,.0f} - ${stats['price_range'][1]:,.0f}")
    
    # Step 7: Export results
    print("\n\n💾 Step 7: Exporting Results")
    print("-" * 80)
    
    output_file = 'valuation_report_example.json'
    valuation.export_report(output_file)
    print(f"\n✅ Valuation report exported to: {output_file}")
    
    # Cache stats
    print("\n\n📦 Cache Statistics")
    print("-" * 80)
    cache_stats = get_cache_stats()
    print(f"\n   Total Cached Entries: {cache_stats['total_entries']}")
    print(f"   Valid Entries: {cache_stats['valid_entries']}")
    print(f"   Cache TTL: {cache_stats['cache_ttl_seconds']}s")
    
    print("\n" + "=" * 80)
    print("✅ Complete Valuation Workflow Finished Successfully!")
    print("=" * 80)
    
    return valuation


if __name__ == '__main__':
    try:
        valuation = run_valuation_example()
        print("\n✨ Example completed! Check 'valuation_report_example.json' for exported data.")
    except Exception as e:
        print(f"\n❌ Error during valuation: {str(e)}")
        import traceback
        traceback.print_exc()
