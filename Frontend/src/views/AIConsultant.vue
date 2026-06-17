<template>
  <div class="ai-consultant-page">
    <aside class="consultant-sidebar">
      <div class="sidebar-section">
        <div class="section-label">Recent Consultations</div>
        <button
          v-for="item in recentConsultations"
          :key="item"
          type="button"
          class="history-item"
          @click="draft = item"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"></path>
          </svg>
          <span>{{ item }}</span>
        </button>
      </div>

      <div class="sidebar-section">
        <div class="section-label">Trending Topics</div>
        <div class="topic-list">
          <button
            v-for="topic in topics"
            :key="topic"
            type="button"
            class="topic-chip"
            @click="draft = `Tell me about ${topic.replace('#', '')} opportunities at UW.`"
          >
            {{ topic }}
          </button>
        </div>
      </div>

      <div class="consultant-note">
        <strong>MVP Consultant</strong>
        <p>
          This page is ready for the AI backend. If Gemini is not configured, messages will show a temporary fallback.
        </p>
      </div>
    </aside>

    <main class="consultant-main">
      <section class="consultant-hero">
        <div class="hero-icon">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3l1.55 4.45L18 9l-4.45 1.55L12 15l-1.55-4.45L6 9l4.45-1.55L12 3Z"></path>
            <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"></path>
            <path d="M5 13l.95 2.55L8.5 16.5l-2.55.95L5 20l-.95-2.55L1.5 16.5l2.55-.95L5 13Z"></path>
          </svg>
        </div>
        <h1>Hello, I'm your Husky AI Consultant.</h1>
        <p>Ask about events, clubs, campus resources, study plans, career prep, or where to start next.</p>
      </section>

      <section v-if="chatbotStore.messages.length === 0" class="starter-grid">
        <button
          v-for="starter in starters"
          :key="starter.title"
          type="button"
          class="starter-card"
          @click="sendStarter(starter.prompt)"
        >
          <span class="starter-icon" v-html="starter.icon"></span>
          <strong>{{ starter.title }}</strong>
          <p>{{ starter.description }}</p>
          <span class="starter-action">Ask Now</span>
        </button>
      </section>

      <section ref="chatScrollRef" class="chat-feed" aria-live="polite">
        <article
          v-for="message in chatbotStore.messages"
          :key="message.id"
          :class="['chat-row', message.role === 'user' ? 'is-user' : 'is-assistant']"
        >
          <div class="message-avatar">
            <img
              v-if="message.role === 'user' && userStore.userProfile?.photoURL"
              :src="userStore.userProfile.photoURL"
              alt=""
            />
            <span v-else>{{ message.role === 'user' ? userInitials : 'AI' }}</span>
          </div>
          <div class="message-bubble">
            <p>{{ message.content }}</p>
            <div
              v-if="message.role === 'assistant' && (chatbotStore.citationsByMessageId[message.id] || []).length"
              class="citation-list"
            >
              <span>Referenced events</span>
              <router-link
                v-for="citation in chatbotStore.citationsByMessageId[message.id]"
                :key="`${message.id}-${citation.eventId}`"
                :to="`/events/${citation.eventId}`"
              >
                {{ citation.title }}
              </router-link>
            </div>
          </div>
        </article>

        <article v-if="chatbotStore.isLoading" class="chat-row is-assistant">
          <div class="message-avatar"><span>AI</span></div>
          <div class="message-bubble typing-bubble">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
      </section>

      <footer class="consultant-composer">
        <form class="composer-shell" @submit.prevent="handleSubmit">
          <textarea
            v-model="draft"
            rows="1"
            placeholder="Ask your consultant about campus life, events, clubs, or career planning..."
            :disabled="chatbotStore.isLoading"
            @keydown.enter.exact.prevent="handleSubmit"
          ></textarea>
          <button type="submit" :disabled="!canSubmit">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22 2 11 13"></path>
              <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
            </svg>
            Send
          </button>
        </form>
        <div class="composer-meta">
          <span v-if="chatbotStore.lastError">{{ chatbotStore.lastError }}</span>
          <span v-else>Remaining requests this session: {{ chatbotStore.remainingRequests }}</span>
          <button type="button" @click="chatbotStore.resetConversation">Clear conversation</button>
        </div>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useChatbotStore } from '../stores/chatbot';
import { useUserStore } from '../stores/user';

const route = useRoute();
const chatbotStore = useChatbotStore();
const userStore = useUserStore();
const draft = ref('');
const chatScrollRef = ref<HTMLElement | null>(null);

const topics = ['#Internships', '#Orientation', '#Hackathon', '#Research', '#StudySpots'];
const recentConsultations = [
  'Informatics major clubs',
  'Research application help',
  'Career fair preparation',
];

const starters = [
  {
    title: 'Tech Workshops',
    description: 'Find upcoming tech workshops and developer events on campus.',
    prompt: 'Find upcoming tech workshops or developer events at UW.',
    icon: '<svg viewBox="0 0 24 24"><path d="M5 16 3 12l2-4"></path><path d="m19 8 2 4-2 4"></path><path d="m14 4-4 16"></path></svg>',
  },
  {
    title: 'Informatics Clubs',
    description: 'Suggest useful clubs and networks for Informatics students.',
    prompt: 'Suggest the best clubs and networks for Informatics majors.',
    icon: '<svg viewBox="0 0 24 24"><path d="M22 10 12 5 2 10l10 5 10-5Z"></path><path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5"></path></svg>',
  },
  {
    title: 'Research Opportunities',
    description: 'Get a practical path for finding undergraduate research roles.',
    prompt: 'Explain how I can find and apply for undergraduate research opportunities this quarter.',
    icon: '<svg viewBox="0 0 24 24"><path d="M10 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"></path><path d="m21 21-7-7"></path><path d="M10 7v3l2 1"></path></svg>',
  },
];

const userInitials = computed(() => {
  const value = userStore.userProfile?.displayName || userStore.userProfile?.email || 'You';
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || 'U').toUpperCase();
});

const canSubmit = computed(() => (
  draft.value.trim().length > 0 &&
  (chatbotStore.canSend || !chatbotStore.isEnabled) &&
  !chatbotStore.isLoading
));

async function scrollToBottom() {
  await nextTick();
  chatScrollRef.value?.scrollTo({
    top: chatScrollRef.value.scrollHeight,
    behavior: 'smooth',
  });
}

async function sendMessage(message: string) {
  if (!message.trim()) return;
  await chatbotStore.sendMessage(message, route.fullPath);
  await scrollToBottom();
}

async function handleSubmit() {
  const message = draft.value.trim();
  if (!message) return;
  draft.value = '';
  await sendMessage(message);
}

async function sendStarter(prompt: string) {
  draft.value = '';
  await sendMessage(prompt);
}

watch(
  () => chatbotStore.messages.length,
  () => {
    void scrollToBottom();
  }
);
</script>

<style scoped>
.ai-consultant-page {
  min-height: calc(100vh - var(--navbar-height));
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  background:
    radial-gradient(circle at 75% 8%, rgba(91, 97, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #fbf8ff 0%, #f7f8ff 42%, #ffffff 100%);
  color: #38274d;
}

.consultant-sidebar {
  min-height: calc(100vh - var(--navbar-height));
  padding: 30px 20px;
  background: rgba(248, 237, 255, 0.72);
  border-right: 1px solid rgba(91, 97, 246, 0.1);
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.sidebar-section {
  display: grid;
  gap: 10px;
}

.section-label {
  padding: 0 12px 6px;
  color: #826e99;
  font-size: 0.61rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.history-item,
.topic-chip {
  border: none;
  font: inherit;
  cursor: pointer;
}

.history-item {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-radius: 999px;
  background: transparent;
  color: #66537d;
  font-size: 0.85rem;
  font-weight: 750;
  text-align: left;
}

.history-item:first-of-type {
  background: #dcc9ff;
  color: #53368b;
}

.history-item:hover {
  background: rgba(91, 97, 246, 0.1);
  color: #5b61f6;
}

.history-item svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.topic-chip {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #66537d;
  font-size: 0.7rem;
  font-weight: 800;
}

.topic-chip:hover {
  background: #eef0ff;
  color: #5b61f6;
}

.consultant-note {
  margin-top: auto;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 40px rgba(56, 39, 77, 0.06);
}

.consultant-note strong {
  color: #5b61f6;
  font-size: 0.9rem;
}

.consultant-note p {
  margin: 8px 0 0;
  color: #66537d;
  font-size: 0.82rem;
  line-height: 1.55;
}

.consultant-main {
  position: relative;
  min-height: calc(100vh - var(--navbar-height));
  display: flex;
  flex-direction: column;
  padding: 34px clamp(20px, 5vw, 56px) 128px;
}

.consultant-hero {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px 0 26px;
  text-align: center;
}

.hero-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 13px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: rgba(91, 97, 246, 0.12);
  color: #5b61f6;
}

.hero-icon svg {
  width: 27px;
  height: 27px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.1;
}

.consultant-hero h1 {
  margin: 0;
  color: #38274d;
  font-size: clamp(1.19rem, 2.72vw, 1.94rem);
  line-height: 1.05;
  letter-spacing: 0;
}

.consultant-hero p {
  max-width: 620px;
  margin: 14px auto 0;
  color: #66537d;
  font-size: 1.05rem;
  line-height: 1.65;
}

.starter-grid {
  max-width: 980px;
  margin: 0 auto 32px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.starter-card {
  min-height: 190px;
  padding: 20px;
  border: 1px solid rgba(91, 97, 246, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  color: #38274d;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 16px 34px rgba(56, 39, 77, 0.06);
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.starter-card:hover {
  transform: translateY(-2px);
  border-color: rgba(91, 97, 246, 0.32);
  box-shadow: 0 22px 44px rgba(91, 97, 246, 0.1);
}

.starter-icon {
  width: 34px;
  height: 34px;
  display: inline-grid;
  place-items: center;
  margin-bottom: 14px;
  color: #5b61f6;
}

.starter-icon :deep(svg) {
  width: 30px;
  height: 30px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
}

.starter-card strong {
  display: block;
  font-size: 1rem;
}

.starter-card p {
  min-height: 64px;
  margin: 9px 0 12px;
  color: #66537d;
  line-height: 1.55;
}

.starter-action {
  color: #5b61f6;
  font-size: 0.82rem;
  font-weight: 900;
}

.chat-feed {
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding: 4px 4px 24px;
}

.chat-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.chat-row.is-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  overflow: hidden;
  background: #dcc9ff;
  color: #5b61f6;
  font-size: 0.78rem;
  font-weight: 900;
}

.chat-row.is-user .message-avatar {
  background: #eef0ff;
  color: #38274d;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-bubble {
  max-width: min(680px, 78%);
  padding: 16px 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  color: #38274d;
  box-shadow: 0 12px 28px rgba(56, 39, 77, 0.06);
}

.chat-row.is-assistant .message-bubble {
  border-bottom-left-radius: 8px;
}

.chat-row.is-user .message-bubble {
  border-bottom-right-radius: 8px;
  background: linear-gradient(135deg, #5b61f6 0%, #7c73ff 100%);
  color: #fff;
}

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.65;
}

.citation-list {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.citation-list span {
  width: 100%;
  color: #826e99;
  font-size: 0.76rem;
  font-weight: 900;
}

.citation-list a {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eef0ff;
  color: #5b61f6;
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
}

.typing-bubble {
  display: flex;
  gap: 6px;
  align-items: center;
}

.typing-bubble span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #5b61f6;
  animation: typingPulse 1.1s ease-in-out infinite;
}

.typing-bubble span:nth-child(2) {
  animation-delay: 0.16s;
}

.typing-bubble span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes typingPulse {
  0%, 100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.consultant-composer {
  position: fixed;
  right: clamp(20px, 5vw, 56px);
  bottom: 22px;
  left: calc(300px + clamp(20px, 5vw, 56px));
  max-width: 900px;
  margin: 0 auto;
}

.composer-shell {
  min-height: 72px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 10px 10px 20px;
  border: 1px solid rgba(91, 97, 246, 0.16);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 46px rgba(56, 39, 77, 0.14);
  backdrop-filter: blur(18px);
}

.composer-shell textarea {
  flex: 1;
  min-height: 28px;
  max-height: 120px;
  resize: none;
  border: none;
  outline: none;
  background: transparent;
  color: #38274d;
  font: inherit;
  line-height: 1.5;
}

.composer-shell textarea::placeholder {
  color: #826e99;
}

.composer-shell button {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.composer-shell button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.composer-shell button svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
}

.composer-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 8px 0;
  color: #826e99;
  font-size: 0.78rem;
}

.composer-meta button {
  border: none;
  background: transparent;
  color: #5b61f6;
  font: inherit;
  font-weight: 850;
  cursor: pointer;
}

@media (max-width: 900px) {
  .ai-consultant-page {
    grid-template-columns: 1fr;
  }

  .consultant-sidebar {
    display: none;
  }

  .consultant-main {
    padding: 26px 16px 132px;
  }

  .starter-grid {
    grid-template-columns: 1fr;
  }

  .message-bubble {
    max-width: 82%;
  }

  .consultant-composer {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
}

@media (max-width: 560px) {
  .consultant-hero {
    padding-top: 8px;
  }

  .hero-icon {
    width: 58px;
    height: 58px;
  }

  .composer-shell {
    align-items: stretch;
    flex-direction: column;
    border-radius: 22px;
    padding: 12px;
  }

  .composer-shell button {
    width: 100%;
  }

  .composer-meta {
    flex-direction: column;
  }
}
</style>
