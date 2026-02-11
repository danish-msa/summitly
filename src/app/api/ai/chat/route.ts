/**
 * Next.js API Route - AI Chat Proxy
 * Proxies requests to Python Flask backend while maintaining Next.js benefits
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:5050';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/chat-gpt4`, {
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('AI Chat API Error:', error);
    return NextResponse.json(
      {
        success: false,
        response: 'Sorry, I encountered an error. Please try again later.',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'AI Chat API is running. Use POST method to send messages.',
    },
    { status: 200 }
  );
}
