/**
 * Next.js API Route - Property Analysis Proxy
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:5050';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔄 [API PROXY] Sending request to backend:', body.mls_number);

    const response = await fetch(`${BACKEND_URL}/api/property-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [API PROXY] Received from backend:', {
      success: data.success,
      hasInsights: !!data.insights,
      hasEstimatedValue: !!data.insights?.estimated_value,
      estimatedValue: data.insights?.estimated_value,
      hasAiSummary: !!data.insights?.ai_summary,
      aiSummaryLength: data.insights?.ai_summary?.length || 0
    });
    
    if (data.insights?.estimated_value) {
      console.log('🎯 [API PROXY] AI Estimate:', data.insights.estimated_value);
    } else {
      console.warn('⚠️ [API PROXY] No estimated_value in backend response');
    }
    
    if (data.insights?.ai_summary) {
      console.log('📝 [API PROXY] AI Summary received:', data.insights.ai_summary.substring(0, 100) + '...');
    } else {
      console.warn('⚠️ [API PROXY] No ai_summary in backend response');
      console.warn('   Available insights keys:', Object.keys(data.insights || {}));
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Property Analysis API Error:', error);
    return NextResponse.json(
      {
        success: false,
        analysis: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
