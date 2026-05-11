<template>
  <div v-if="chatbotStore.isEnabled" class="chatbot-root">
    <button v-if="!chatbotStore.isOpen" type="button" class="chatbot-launcher" @click="chatbotStore.open">
      Ask Events
    </button>

    <section v-else class="chatbot-panel" aria-label="Event Chatbot">
      <header class="chatbot-header">
        <strong>Event Assistant (MVP)</strong>
        <div class="chatbot-header-actions">
          <button type="button" class="chatbot-small-btn" @click="chatbotStore.resetConversation">Clear</button>
          <button type="button" class="chatbot-small-btn" @click="chatbotStore.close">Close</button>
        </div>
      </header>

      <div class="chatbot-body">
        <p v-if="chatbotStore.messages.length === 0" class="chatbot-empty">
          Ask me about upcoming events, clubs, tags, locations, or dates.
        </p>

        <article
          v-for="message in chatbotStore.messages"
          :key="message.id"
          :class="['chatbot-message', message.role === 'user' ? 'is-user' : 'is-assistant']"
        >
          <p>{{ message.content }}</p>
          <div
            v-if="message.role === 'assistant' && (chatbotStore.citationsByMessageId[message.id] || []).length"
            class="chatbot-citations"
          >
            <span class="chatbot-citation-label">Referenced events:</span>
            <router-link
              v-for="citation in chatbotStore.citationsByMessageId[message.id]"
              :key="`${message.id}-${citation.eventId}`"
              :to="`/events/${citation.eventId}`"
              class="chatbot-citation-link"
            >
              {{ citation.title }}
            </router-link>
          </div>
        </article>
      </div>

      <footer class="chatbot-footer">
        <form class="chatbot-form" @submit.prevent="handleSubmit">
          <textarea
            v-model="draft"
            class="chatbot-input"
            rows="2"
            placeholder="Ask a question about events..."
            :disabled="chatbotStore.isLoading"
          />
          <button type="submit" class="chatbot-send-btn" :disabled="!chatbotStore.canSend || chatbotStore.isLoading">
            {{ chatbotStore.isLoading ? 'Sending...' : 'Send' }}
          </button>
        </form>

        <p v-if="chatbotStore.lastError" class="chatbot-error">{{ chatbotStore.lastError }}</p>
        <p class="chatbot-meta">
          Remaining requests this session: {{ chatbotStore.remainingRequests }}
        </p>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { useChatbotStore } from '../stores/chatbot';

const chatbotStore = useChatbotStore();
const route = useRoute();
const draft = ref('');

const handleSubmit = async () => {
  const message = draft.value.trim();
  if (!message) return;

  await chatbotStore.sendMessage(message, route.fullPath);
  draft.value = '';
};
</script>

<style scoped>
.chatbot-root {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 1200;
}

.chatbot-launcher {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
  color: #fff;
  background: #0f172a;
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.26);
}

.chatbot-panel {
  width: min(420px, calc(100vw - 2rem));
  max-height: min(72vh, 640px);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 14px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.22);
}

.chatbot-header {
  padding: 0.75rem 0.9rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.chatbot-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chatbot-small-btn {
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  background: #fff;
  color: #334155;
  font-weight: 600;
  padding: 0.3rem 0.65rem;
  cursor: pointer;
}

.chatbot-body {
  padding: 0.8rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: #f8fafc;
}

.chatbot-empty {
  font-size: 0.9rem;
  color: #475569;
}

.chatbot-message {
  border-radius: 10px;
  padding: 0.6rem 0.7rem;
  max-width: 95%;
}

.chatbot-message p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.35;
  font-size: 0.92rem;
}

.chatbot-message.is-user {
  align-self: flex-end;
  background: #dbeafe;
  color: #0f172a;
}

.chatbot-message.is-assistant {
  align-self: flex-start;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.09);
  color: #0f172a;
}

.chatbot-citations {
  margin-top: 0.45rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chatbot-citation-label {
  width: 100%;
  font-size: 0.75rem;
  color: #64748b;
}

.chatbot-citation-link {
  font-size: 0.78rem;
  font-weight: 600;
  color: #1d4ed8;
  text-decoration: none;
}

.chatbot-citation-link:hover {
  text-decoration: underline;
}

.chatbot-footer {
  padding: 0.7rem;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.chatbot-form {
  display: grid;
  gap: 0.5rem;
}

.chatbot-input {
  width: 100%;
  border: 1px solid rgba(15, 23, 42, 0.2);
  border-radius: 9px;
  padding: 0.55rem 0.65rem;
  resize: vertical;
  font-family: inherit;
  font-size: 0.92rem;
}

.chatbot-send-btn {
  justify-self: end;
  border: 0;
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  font-weight: 700;
  color: #fff;
  background: #1d4ed8;
  cursor: pointer;
}

.chatbot-send-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.chatbot-error {
  margin: 0.45rem 0 0;
  color: #b91c1c;
  font-size: 0.82rem;
}

.chatbot-meta {
  margin: 0.45rem 0 0;
  color: #64748b;
  font-size: 0.76rem;
}

@media (max-width: 576px) {
  .chatbot-root {
    right: 0.65rem;
    left: 0.65rem;
    bottom: 0.65rem;
  }

  .chatbot-panel {
    width: 100%;
    max-height: 68vh;
  }

  .chatbot-launcher {
    width: 100%;
  }
}
</style>
