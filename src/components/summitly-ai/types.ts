export type AiChatMessageRole = "user" | "assistant";

export type AiDataset = {
  name: string;
  json: unknown;
  csv: string;
  previewColumns: string[];
  previewRows: Array<Record<string, string | number>>;
};

export type AiProperty = {
  mls_number?: string;
  address?: string;
  title?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  property_type?: string;
  images?: string[];
  [key: string]: any;
};

export type AiAnalysis = {
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
  [key: string]: any;
};

export type AiChatMessage = {
  id: string;
  role: AiChatMessageRole;
  createdAt: string; // ISO string (mock-friendly)
  userText?: string;
  assistant?: {
    intro: string;
    sections: Array<{
      title: string;
      bullets: string[];
    }>;
    outro?: string;
    dataset?: AiDataset;
    properties?: AiProperty[];
    analysis?: AiAnalysis;
  };
};

export type AiChat = {
  id: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messages: AiChatMessage[];
};

