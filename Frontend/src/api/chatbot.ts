import { requestAi } from './ai';
import type { ChatbotRequest, ChatbotResponse } from '../types/chatbot';

export function sendChatbotMessage(payload: ChatbotRequest): Promise<ChatbotResponse> {
  return requestAi('/chat', {
    ...payload,
    history: payload.history.filter(item => item.role !== 'system').slice(-8)
      .map(item => ({ ...item, content: item.content.slice(0, 4000) })),
    context: {
      ...payload.context,
      events: payload.context.events.map(event => ({
        ...event,
        description: event.description.slice(0, 2000),
      })),
    },
  });
}
