import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { sendChatbotMessage } from '../api/chatbot';
import { buildChatbotContext } from '../utils/chatbotContext';
import { useEventStore } from './event';
import { useUserStore } from './user';
import type { ChatMessage, ChatEventCitation } from '../types/chatbot';

function toMessage(role: ChatMessage['role'], content: string): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const useChatbotStore = defineStore('chatbot', () => {
  const eventStore = useEventStore();
  const userStore = useUserStore();

  const isEnabled = import.meta.env.VITE_CHATBOT_ENABLED !== 'false';
  const sessionRequestLimit = toInt(import.meta.env.VITE_CHATBOT_MAX_REQUESTS_PER_SESSION, 30);
  const cooldownMs = toInt(import.meta.env.VITE_CHATBOT_COOLDOWN_MS, 3000);

  const isOpen = ref(false);
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);
  const messages = ref<ChatMessage[]>([]);
  const citationsByMessageId = ref<Record<string, ChatEventCitation[]>>({});
  const sentRequestCount = ref(0);
  const cooldownUntil = ref<number>(0);

  const canSend = computed(() => {
    if (!isEnabled) return false;
    if (isLoading.value) return false;
    if (sentRequestCount.value >= sessionRequestLimit) return false;
    return Date.now() >= cooldownUntil.value;
  });

  const remainingRequests = computed(() => Math.max(sessionRequestLimit - sentRequestCount.value, 0));

  const cooldownRemainingMs = computed(() => Math.max(cooldownUntil.value - Date.now(), 0));

  function open(): void {
    if (!isEnabled) return;
    isOpen.value = true;
  }

  function close(): void {
    isOpen.value = false;
  }

  function toggle(): void {
    if (!isEnabled) return;
    isOpen.value = !isOpen.value;
  }

  function resetConversation(): void {
    messages.value = [];
    citationsByMessageId.value = {};
    lastError.value = null;
  }

  async function ensureEventsLoaded(): Promise<void> {
    if (eventStore.events.length > 0) return;
    await eventStore.fetchEvents();
  }

  async function sendMessage(input: string, routePath: string): Promise<void> {
    const content = input.trim();
    if (!content || !isEnabled) return;

    if (!canSend.value) {
      if (sentRequestCount.value >= sessionRequestLimit) {
        lastError.value = 'Session request limit reached for MVP mode. Please refresh the page to continue.';
      } else {
        const seconds = Math.ceil(cooldownRemainingMs.value / 1000);
        lastError.value = `Please wait ${seconds}s before sending another message.`;
      }
      return;
    }

    await ensureEventsLoaded();

    const userMessage = toMessage('user', content);
    messages.value.push(userMessage);

    isLoading.value = true;
    lastError.value = null;
    cooldownUntil.value = Date.now() + cooldownMs;

    try {
      const context = buildChatbotContext({
        events: eventStore.events,
        message: content,
        routePath,
        userProfile: userStore.userProfile,
        isLoggedIn: userStore.isLoggedIn,
      });

      const response = await sendChatbotMessage({
        message: content,
        history: messages.value.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        context,
      });

      const assistantMessage = toMessage('assistant', response.text);
      messages.value.push(assistantMessage);

      if (response.citations.length) {
        citationsByMessageId.value[assistantMessage.id] = response.citations;
      }

      sentRequestCount.value += 1;
    } catch (error) {
      const fallback = 'I ran into an issue reaching Gemini. Please try again in a moment.';
      const message = error instanceof Error ? error.message : fallback;
      lastError.value = message;
      messages.value.push(toMessage('assistant', fallback));
    } finally {
      isLoading.value = false;
    }
  }

  return {
    canSend,
    citationsByMessageId,
    close,
    cooldownRemainingMs,
    isEnabled,
    isLoading,
    isOpen,
    lastError,
    messages,
    open,
    remainingRequests,
    resetConversation,
    sendMessage,
    toggle,
  };
});
