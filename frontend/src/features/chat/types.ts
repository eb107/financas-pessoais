export interface ChatSession {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  tokens_used: number | null;
  created_at: string;
}

export interface SendMessageResult {
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}
