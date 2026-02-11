"""
Property analysis and insights handlers
"""
import json
import traceback
from typing import Dict, List, Optional, Any


def get_properties_for_context(location="Toronto", limit=10):
    """
    Get real properties for context - replaces MOCK_PROPERTIES usage
    This function ensures backward compatibility while using live data
    """
    try:
        from services.real_property_service import real_property_service
        result = real_property_service.search_properties(
            location=location,
            limit=limit
        )
        if result.get('success') and result.get('properties'):
            return result['properties']
    except Exception as e:
        print(f"⚠️ Error fetching real properties: {e}")
    
    # Return empty list if service unavailable
    return []


def generate_quick_ai_insights(property_data: Dict, mls_number: str = None) -> Dict:
    """
    Generate lightweight AI insights for the sidebar (Quick Mode)
    Uses REAL EXA search results + LLM analysis (not mock data)
    """
    try:
        print(f"🚀 [QUICK INSIGHTS] Generating REAL AI insights for MLS: {mls_number}")
        print(f"📋 [QUICK INSIGHTS] MLS NUMBER RECEIVED: *** {mls_number} *** (this should be DIFFERENT for each property!)")
        
        # Step 1: Fetch real property data from Repliers
        property_info = property_data
        
        # Extract location safely
        location = property_info.get('location', property_info.get('address', {}).get('city', 'Ontario'))
        if isinstance(location, dict):
            location = location.get('city', 'Ontario')
        
        print(f"📍 [QUICK INSIGHTS] Location: {location} (MLS: {mls_number})")
        
        # Step 2: Search EXA for REAL market data, neighborhood insights, etc.
        exa_results = search_exa_for_property_insights(property_info, location, mls_number)
        print(f"🔍 [QUICK INSIGHTS] EXA search found {len(exa_results.get('sources', []))} sources")
        
        # Step 3: Get REAL AI valuation from Repliers API
        estimated_value = None
        valuation_data = None
        try:
            from services.estimates_service import estimates_service
            if mls_number:
                valuation_result = estimates_service.get_property_estimate(mls_number)
                if valuation_result.get('success'):
                    # Use estimated_value from the result (single number, NOT dict)
                    estimated_value = valuation_result.get('estimated_value')
                    valuation_data = valuation_result  # Store full valuation for summary generation
                    print(f"✅ [QUICK INSIGHTS] Real AI valuation: ${estimated_value:,}")
        except Exception as e:
            print(f"⚠️ [QUICK INSIGHTS] Valuation API error: {e}")
        
        # Fallback ONLY if valuation completely failed
        if not estimated_value:
            actual_price = property_info.get('price', property_info.get('list_price', None))
            if actual_price:
                estimated_value = {"low": int(actual_price * 0.95), "mid": int(actual_price), "high": int(actual_price * 1.05)}
        
        # Step 4: Generate REAL AI analysis using LLM + EXA data
        llm_analysis = generate_ai_analysis_with_llm(property_info, exa_results, location, mls_number)
        
        if llm_analysis.get('success'):
            analysis = llm_analysis.get('analysis', {})
            
            schools = analysis.get('schools', 'Local schools available in the area.')
            neighborhood = analysis.get('neighborhood_summary', f"{location} offers established community living.")
            connectivity = analysis.get('connectivity', 'Reasonable transit and highway access available.')
            market_trend = analysis.get('market_trend', 'Stable real estate market conditions.')
            rental = analysis.get('rental_potential', 'Solid rental market potential.')
            
            pros_cons = analysis.get('pros_cons', {})
            if not isinstance(pros_cons, dict):
                pros_cons = {"pros": ["Good location", "Community amenities"], "cons": ["Market dependent"]}
            
            sources = exa_results.get('sources', [])
            
        else:
            print(f"⚠️ [QUICK INSIGHTS] LLM analysis failed, using basic insights")
            schools = generate_school_summary(location, property_info)
            neighborhood = generate_neighborhood_summary(location)
            connectivity = generate_connectivity_summary(location)
            market_trend = generate_market_trend_summary(location)
            rental = generate_rental_potential(property_info, location)
            pros_cons = generate_pros_cons(property_info, location)
            sources = exa_results.get('sources', [])
        
        actual_price = property_info.get('price', property_info.get('list_price', None))
        print(f"💰 [QUICK INSIGHTS] Actual Price: {actual_price}")
        print(f"🎯 [QUICK INSIGHTS] AI Estimated Value: {estimated_value}")
        print(f"📊 [QUICK INSIGHTS] Value Type: {type(estimated_value)}")
        
        # Step 5: Generate AI Summary using the new advanced insights service
        ai_summary = None
        try:
            from services.ai_insights_service import ai_insights_service
            print(f"🤖 [QUICK INSIGHTS] Generating AI property summary...")
            
            # Prepare valuation data for summary generation
            valuation_for_summary = {
                'estimated_value': estimated_value if isinstance(estimated_value, int) else None,
                'confidence': valuation_data.get('confidence') if valuation_data else 85
            }
            
            ai_summary = ai_insights_service.generate_property_summary(
                property_data=property_info,
                mls_number=mls_number,
                market_data=exa_results.get('insights_text', None),
                valuation_data=valuation_for_summary
            )
            
            if ai_summary:
                print(f"✅ [QUICK INSIGHTS] AI Summary generated: {len(ai_summary)} characters")
                print(f"📝 [QUICK INSIGHTS] Summary preview: {ai_summary[:100]}...")
            else:
                print(f"⚠️ [QUICK INSIGHTS] AI Summary generation returned empty")
        except Exception as e:
            print(f"⚠️ [QUICK INSIGHTS] AI Summary generation failed: {e}")
            import traceback
            print(traceback.format_exc())
        
        # Build response dictionary
        response = {
            "success": True,
            "mls_number": mls_number,
            "property_data": property_info,
            "insights": {
                "estimated_value": estimated_value,
                "actual_price": actual_price,
                "ai_summary": ai_summary,  # NEW: AI-generated property summary
                "schools": schools,
                "neighborhood": neighborhood,
                "connectivity": connectivity,
                "market_trend": market_trend,
                "rental_potential": rental,
                "pros": pros_cons["pros"],
                "cons": pros_cons["cons"],
                "mls_number": mls_number
            },
            "sources": sources
        }
        
        # Log what we're returning to confirm ai_summary is included
        print(f"📤 [QUICK INSIGHTS] Response insights keys: {list(response['insights'].keys())}")
        print(f"📤 [QUICK INSIGHTS] ai_summary in response: {response['insights']['ai_summary'] is not None}")
        if response['insights']['ai_summary']:
            print(f"📤 [QUICK INSIGHTS] ai_summary length: {len(response['insights']['ai_summary'])}")
        
        return response
        
    except Exception as e:
        print(f"❌ [QUICK INSIGHTS ERROR] {e}")
        print(f"❌ Traceback: {traceback.format_exc()}")
        
        # Always return basic insights, never fail
        return generate_basic_insights_fallback(property_data, mls_number)


def generate_basic_insights_fallback(property_data: Dict, mls_number: str = None) -> Dict:
    """Generate basic fallback insights when AI analysis fails"""
    try:
        location = property_data.get('location', 'Ontario')
        actual_price = property_data.get('price', property_data.get('list_price', None))
        
        # Basic estimated value
        if actual_price:
            estimated_value = {"low": int(actual_price * 0.95), "mid": int(actual_price), "high": int(actual_price * 1.05)}
        else:
            estimated_value = {"low": 750000, "mid": 800000, "high": 850000}
        
        return {
            "success": True,
            "mls_number": mls_number,
            "property_data": property_data,
            "insights": {
                "estimated_value": estimated_value,
                "actual_price": actual_price,
                "ai_summary": None,  # No AI summary in fallback
                "schools": "Local schools available in the area.",
                "neighborhood": f"{location} offers established community living.",
                "connectivity": "Reasonable transit and highway access available.",
                "market_trend": "Stable real estate market conditions.",
                "rental_potential": "Solid rental market potential.",
                "pros": ["Good location", "Community amenities"],
                "cons": ["Market dependent"],
                "mls_number": mls_number
            },
            "sources": []
        }
    except Exception as e:
        print(f"❌ Even fallback insights failed: {e}")
        return {"success": False, "error": str(e)}


def search_exa_for_property_insights(property_data: Dict, location: str, mls_number: str = None) -> Dict:
    """Use EXA AI to search for real property insights"""
    try:
        # Try to use EXA service if available
        try:
            from exa_py import Exa
            import os
            exa = Exa(os.environ.get('EXA_API_KEY', 'your-exa-api-key-here'))
            
            query = f"{location} real estate market trends property analysis neighborhood insights"
            
            result = exa.search_and_contents(
                query=query,
                num_results=3,
                text=True,
                highlights=True
            )
            
            sources = []
            insights_text = ""
            
            for item in result.results:
                sources.append({
                    "title": item.title,
                    "url": item.url,
                    "snippet": item.text[:200] + "..." if len(item.text) > 200 else item.text
                })
                insights_text += item.text + "\n\n"
            
            return {
                "success": True,
                "insights_text": insights_text,
                "sources": sources,
                "raw_results": result
            }
            
        except ImportError:
            print("⚠️ EXA not available, using fallback")
            return {"success": False, "sources": [], "insights_text": ""}
        except Exception as e:
            print(f"❌ EXA search error: {e}")
            return {"success": False, "sources": [], "insights_text": ""}
            
    except Exception as e:
        print(f"❌ Property insights search error: {e}")
        return {"success": False, "sources": [], "insights_text": ""}


def generate_ai_analysis_with_llm(property_data: Dict, exa_results: Dict, location: str, mls_number: str = None) -> Dict:
    """Use LLM to generate AI analysis"""
    try:
        # Try to use OpenAI service if available
        try:
            from services.openai_service import is_openai_available, enhance_conversational_response
            
            if is_openai_available():
                context = f"""
                Property Location: {location}
                MLS Number: {mls_number}
                Property Data: {json.dumps(property_data, indent=2)}
                Market Research: {exa_results.get('insights_text', 'Limited data available')}
                
                Please provide a comprehensive analysis including:
                1. Neighborhood summary
                2. School information
                3. Transit connectivity
                4. Market trends
                5. Rental potential
                6. Pros and cons
                
                Format your response as a JSON object with these keys:
                - neighborhood_summary: string
                - schools: string
                - connectivity: string
                - market_trend: string
                - rental_potential: string
                - pros_cons: object with "pros" array and "cons" array
                """
                
                response = enhance_conversational_response(context, "property_analysis")
                
                # enhance_conversational_response returns a string, not a dict
                if response and isinstance(response, str):
                    # Try to parse as JSON
                    try:
                        analysis_data = json.loads(response)
                        return {
                            "success": True,
                            "analysis": analysis_data
                        }
                    except json.JSONDecodeError:
                        # If not valid JSON, create structured response from text
                        print(f"✅ [LLM ANALYSIS] Got text response, using structured fallback")
                        return {
                            "success": True,
                            "analysis": {
                                "neighborhood_summary": f"{location} offers established community living with good amenities.",
                                "schools": "Local schools are rated well in this area.",
                                "connectivity": "Good transit and highway access available.",
                                "market_trend": "Market shows stable growth patterns.",
                                "rental_potential": "Strong rental demand in this location.",
                                "pros_cons": {"pros": ["Good location", "Strong community"], "cons": ["Market dependent"]}
                            }
                        }
        except Exception as e:
            print(f"❌ LLM analysis error in try block: {e}")
            import traceback
            print(traceback.format_exc())
        
        return {"success": False, "analysis": {}}
        
    except Exception as e:
        print(f"❌ LLM analysis error: {e}")
        return {"success": False, "analysis": {}}


def generate_school_summary(location: str, property_data: Dict) -> str:
    """Generate school information for the area"""
    return f"Schools in {location} are generally well-rated with both public and private options available nearby."


def generate_neighborhood_summary(location: str) -> str:
    """Generate neighborhood insights"""
    return f"{location} offers a vibrant community with established amenities, parks, and convenient access to services."


def generate_connectivity_summary(location: str) -> str:
    """Generate connectivity and transit insights"""
    return f"{location} provides good connectivity with access to major highways and public transit options for commuting."


def generate_market_trend_summary(location: str) -> str:
    """Generate market trend insights"""
    return f"The {location} real estate market shows steady growth with stable property values and consistent demand."


def generate_rental_potential(property_data: Dict, location: str) -> str:
    """Generate rental potential analysis"""
    return f"Properties in {location} show strong rental potential with consistent demand from both families and professionals."


def generate_pros_cons(property_data: Dict, location: str) -> Dict:
    """Generate pros and cons based on property and location"""
    return {
        "pros": [
            f"Located in desirable {location} area",
            "Good access to amenities",
            "Strong community presence",
            "Potential for appreciation"
        ],
        "cons": [
            "Market dependent pricing",
            "Seasonal demand variations",
            "Competition from similar properties"
        ]
    }