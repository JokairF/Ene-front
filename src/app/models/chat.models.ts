export type Role = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface StyleControls {
  personality?: 'ene' | 'takane' | 'neutral';
  reply_style?: 'immersive' | 'balanced' | 'concise';
  min_words?: number;
}

export interface GenControls {
  temperature?: number;
  max_tokens?: number;
  // tu peux garder top_p/stop si le backend les gère,
  // sinon ne les envoie pas
}

export interface ChatRequest {
  session_id: string;
  message: string;
  // ⚠️ volontairement PAS de `system` ici
  style?: StyleControls;
  gen?: GenControls;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  usage_tokens?: number | null;
  history: ChatMessage[];
}

export interface StreamEvent {
  event: 'token' | 'error' | 'done';
  data: string;
}
