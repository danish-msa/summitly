export type AiChatMessageRole = "user" | "assistant";

export type AiDataset = {
  name: string;
  json: unknown;
  csv: string;
  previewColumns: string[];
  previewRows: Array<Record<string, string | number>>;
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
  };
};

export type AiChat = {
  id: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messages: AiChatMessage[];
};

