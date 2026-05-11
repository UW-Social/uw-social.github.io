export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
}

export interface ChatContextEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  startTime?: string;
  endTime?: string;
  tags: string[];
}

export interface ChatbotContext {
  routePath: string;
  isLoggedIn: boolean;
  userSignals: string[];
  events: ChatContextEvent[];
}

export interface ChatbotRequest {
  message: string;
  history: Array<Pick<ChatMessage, 'role' | 'content'>>;
  context: ChatbotContext;
}

export interface ChatEventCitation {
  eventId: string;
  title: string;
}

export interface ChatbotResponse {
  text: string;
  citations: ChatEventCitation[];
}
