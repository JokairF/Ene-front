export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  system?: string;
  temperature?: number;
  max_tokens?: number;
  // Optionnels si tu utilises les nouveaux contrôles :
  style?: {
    personality?: 'ene' | 'takane' | 'neutral';
    reply_style?: 'concise' | 'balanced' | 'immersive';
    min_words?: number;
  };
  gen?: {
    temperature?: number;
    top_p?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    max_tokens?: number;
  };
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  usage_tokens?: number;
  history: ChatMessage[];
}

export type StreamEvent = { event: 'token' | 'done' | 'error'; data: string };
