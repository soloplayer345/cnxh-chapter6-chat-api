export interface DatasetRecord {
  instruction: string;
  output: string;
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface ChatSession {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatHistoryStore {
  sessions: ChatSession[];
}

export interface ChatRequestBody {
  message?: string;
  sessionId?: string;
}

export interface ChatSuccessResponse {
  success: true;
  sessionId: string;
  answer: string;
  history: ChatMessage[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
}

export interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}
