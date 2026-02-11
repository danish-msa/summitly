/**
 * Summitly AI Backend Service
 * Connects Next.js frontend with Python Flask backend (voice_assistant_clean.py)
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_AI_BACKEND_URL || 'http://localhost:5050';

export interface PropertySearchParams {
  location?: string;
  property_type?: string;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  listing_type?: 'sale' | 'rent';
  limit?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  properties?: any[];
  analysis?: any;
  timestamp?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  properties?: any[];
  analysis?: any;
  session_id?: string;
  conversation_stage?: string;
  error?: string;
}

export interface PropertyAnalysis {
  estimated_value?: {
    low: number;
    mid: number;
    high: number;
  };
  neighborhood_summary?: string;
  schools?: string;
  connectivity?: string;
  market_trend?: string;
  rental_potential?: string;
  investment_grade?: string;
  final_recommendation?: string;
}

class SummitlyAIService {
  private sessionId: string;

  constructor() {
    this.sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send a chat message to the AI backend
   */
  async sendMessage(message: string, history: ChatMessage[] = []): Promise<ChatResponse> {
    try {
      // Use Next.js API route as proxy
      const response = await fetch(`/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          history: history.slice(-10), // Send last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        response: 'Sorry, I encountered an error. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search properties using natural language or structured parameters
   */
  async searchProperties(params: PropertySearchParams): Promise<any> {
    try {
      // Use Next.js API route as proxy
      const response = await fetch(`/api/ai/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Search error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching properties:', error);
      return {
        success: false,
        properties: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get AI property analysis for a specific MLS number
   */
  async getPropertyAnalysis(mlsNumber: string): Promise<PropertyAnalysis | null> {
    try {
      // Use Next.js API route as proxy
      const response = await fetch(`/api/ai/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mls_number: mlsNumber,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.analysis || null;
    } catch (error) {
      console.error('Error getting property analysis:', error);
      return null;
    }
  }

  /**
   * Get location insights for a city
   */
  async getLocationInsights(location: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/location-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ location }),
      });

      if (!response.ok) {
        throw new Error(`Location insights error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting location insights:', error);
      return null;
    }
  }

  /**
   * Search pre-construction properties
   */
  async searchPreConstruction(query: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/search-properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          property_type: 'preconstruction',
        }),
      });

      if (!response.ok) {
        throw new Error(`Pre-construction search error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching pre-construction:', error);
      return {
        success: false,
        properties: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get investment analysis for a property
   */
  async getInvestmentAnalysis(propertyData: any): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/openai/investment-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ property_data: propertyData }),
      });

      if (!response.ok) {
        throw new Error(`Investment analysis error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting investment analysis:', error);
      return null;
    }
  }

  /**
   * Get market analysis for a location
   */
  async getMarketAnalysis(location: string, propertyType?: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/openai/market-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          location,
          property_type: propertyType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Market analysis error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting market analysis:', error);
      return null;
    }
  }

  /**
   * Calculate mortgage and ROI
   */
  async calculateMortgage(params: {
    price: number;
    down_payment_percent: number;
    interest_rate: number;
    amortization_years: number;
  }): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/mortgage-calculator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Mortgage calculation error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calculating mortgage:', error);
      return null;
    }
  }

  /**
   * Compare multiple properties
   */
  async compareProperties(mlsNumbers: string[]): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/property-comparison`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mls_numbers: mlsNumbers }),
      });

      if (!response.ok) {
        throw new Error(`Property comparison error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error comparing properties:', error);
      return null;
    }
  }

  /**
   * Get backend health status
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset session (create new session ID)
   */
  resetSession(): void {
    this.sessionId = `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const summitlyAIService = new SummitlyAIService();
