<template>
  <div class="forums-page">
    <div class="forums-shell">
      <div class="forums-header">
        <div>
          <p class="eyebrow">Forum Archive</p>
          <h1>Event Forums</h1>
          <p class="forums-subtitle">
            Discussions stay visible here even after an event drops out of the main events list.
          </p>
        </div>
      </div>

      <div v-if="isLoading" class="forums-state">Loading forums...</div>
      <div v-else-if="error" class="forums-state error">{{ error }}</div>
      <div v-else-if="forums.length === 0" class="forums-state">
        No forums yet. Open an event and start the first discussion.
      </div>

      <div v-else class="forums-grid">
        <article
          v-for="forum in forums"
          :key="forum.id"
          class="forum-card"
          @click="openForum(forum.id)"
        >
          <img
            :src="forum.eventSnapshot.imageUrl || '/images/wavingdog.jpg'"
            :alt="forum.eventTitle"
            class="forum-card-image"
          />

          <div class="forum-card-body">
            <p class="forum-card-label">Linked Event</p>
            <h2>{{ forum.eventTitle }}</h2>
            <p class="forum-card-meta">{{ forum.eventSnapshot.location || 'Location TBD' }}</p>
            <p class="forum-card-description">
              {{ summarize(forum.eventSnapshot.description) }}
            </p>
          </div>
        </article>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { listForums } from '../api/forums';
import type { Forum } from '../types/forum';

const router = useRouter();
const forums = ref<Forum[]>([]);
const isLoading = ref(true);
const error = ref('');

const summarize = (text: string) => {
  const plain = text.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
  return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain || 'No description yet.';
};

const openForum = (forumId: string) => {
  router.push(`/forums/${forumId}`);
};

onMounted(async () => {
  try {
    forums.value = await listForums();
  } catch (err) {
    console.error('Failed to load forums:', err);
    error.value = 'Failed to load forums.';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.forums-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(186, 215, 255, 0.35), transparent 30%),
    linear-gradient(180deg, #f9fbff 0%, #eef3f7 100%);
}

.forums-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: calc(var(--navbar-height) + 48px) 24px 48px;
}

.forums-header {
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 12px;
  color: #456b88;
}

.forums-header h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
  color: #10212f;
}

.forums-subtitle {
  max-width: 640px;
  margin: 12px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #4d6475;
}

.forums-state {
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(16, 33, 47, 0.08);
  color: #395264;
}

.forums-state.error {
  color: #b42318;
}

.forums-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.forum-card {
  overflow: hidden;
  border: 1px solid rgba(16, 33, 47, 0.08);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.forum-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(34, 64, 89, 0.14);
}

.forum-card-image {
  width: 100%;
  height: 190px;
  object-fit: cover;
}

.forum-card-body {
  padding: 20px;
}

.forum-card-label {
  margin: 0 0 8px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #6a8191;
}

.forum-card-body h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #10212f;
}

.forum-card-meta {
  margin: 10px 0 0;
  color: #395264;
  font-size: 0.95rem;
}

.forum-card-description {
  margin: 12px 0 0;
  color: #5d7383;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .forums-shell {
    padding: calc(var(--navbar-height) + 32px) 16px 32px;
  }
}
</style>
