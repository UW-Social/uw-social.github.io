<template>
  <div class="experience-detail-page">
    <button class="back-button" type="button" @click="goBack">
      <span aria-hidden="true">←</span>
      Back
    </button>

    <div v-if="isLoading" class="state-card">Loading post...</div>
    <div v-else-if="errorMessage" class="state-card error">{{ errorMessage }}</div>

    <template v-else-if="post">
      <article class="post-card">
        <header class="post-header">
          <span class="post-tag">Experience</span>
          <h1>{{ postTitle }}</h1>
          <p v-if="post.subtitle" class="post-subtitle">{{ post.subtitle }}</p>
          <p class="post-meta">
            <span>{{ post.authorName || post.userEmail || 'Anonymous User' }}</span>
            <span>{{ formatTimestamp(post.createdAt) }}</span>
          </p>
        </header>

        <div v-if="post.mediaUrls?.length" class="media-section">
          <template v-for="url in post.mediaUrls" :key="url">
            <video
              v-if="isVideoUrl(url)"
              class="post-video"
              :src="url"
              controls
              preload="metadata"
            ></video>
            <img
              v-else
              class="post-image"
              :src="url"
              alt="Experience post media"
            />
          </template>
        </div>

        <div v-if="safeBodyHtml" class="post-content rich-content" v-html="safeBodyHtml"></div>
        <p v-else class="post-content plain-content">{{ post.content }}</p>

        <footer class="post-stats">
          <span>{{ post.likeCount }} likes</span>
          <span>{{ replies.length || post.replyCount }} replies</span>
          <button
            v-if="post.userId === userStore.userProfile?.uid"
            class="delete-post-button"
            type="button"
            @click="deletePost"
          >
            Delete
          </button>
        </footer>
      </article>

      <aside class="event-card">
        <div>
          <p class="event-label">Related Event</p>
          <h2>{{ relatedEvent?.title || 'Event details unavailable' }}</h2>
          <p v-if="eventSchedule" class="event-meta">{{ eventSchedule }}</p>
          <p v-if="relatedEvent?.location" class="event-meta">{{ relatedEvent.location }}</p>
        </div>
        <router-link class="event-link" :to="eventLink">
          View Event
        </router-link>
        <a
          v-if="relatedEvent?.link"
          class="event-link secondary"
          :href="relatedEvent.link"
          target="_blank"
          rel="noopener noreferrer"
        >
          Event Link
        </a>
      </aside>

      <section class="replies-card">
        <div class="replies-header">
          <h2>Replies</h2>
          <span>{{ replies.length }} replies</span>
        </div>

        <div v-if="replies.length === 0" class="reply-empty">
          Replies will appear here once people respond to this experience.
        </div>

        <div v-else class="reply-list">
          <article v-for="reply in replies" :key="reply.id" class="reply-card">
            <p class="reply-meta">
              <span>{{ reply.authorName || reply.userEmail || 'Anonymous User' }}</span>
              <span>{{ formatTimestamp(reply.createdAt) }}</span>
            </p>
            <p class="reply-content">{{ reply.content }}</p>
            <p class="reply-stats">{{ reply.likeCount }} likes</p>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { deleteEventExperiencePost, getEventExperiencePost, listExperiencePostReplies } from '../api/forums';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import { formatEventSchedule } from '../types/event';
import type { DiscussionReply, ExperiencePost } from '../types/forum';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();

const post = ref<ExperiencePost | null>(null);
const replies = ref<DiscussionReply[]>([]);
const isLoading = ref(true);
const errorMessage = ref('');

const eventId = computed(() => route.params.eventId as string);
const postId = computed(() => route.params.postId as string);
const relatedEvent = computed(() => eventStore.events.find((event) => event.id === eventId.value) ?? null);
const eventLink = computed(() => ({
  path: `/events/${eventId.value}`,
  query: { section: 'forum', postId: postId.value },
}));
const eventSchedule = computed(() => relatedEvent.value ? formatEventSchedule(relatedEvent.value) : '');

const postTitle = computed(() => {
  if (post.value?.title?.trim()) return post.value.title.trim();
  const content = post.value?.content?.trim() || 'Event experience';
  return content.length <= 90 ? content : `${content.slice(0, 90).trimEnd()}...`;
});

const safeBodyHtml = computed(() => {
  if (!post.value?.bodyHtml) return '';
  return sanitizeHtml(post.value.bodyHtml);
});

const loadPost = async () => {
  if (!eventId.value || !postId.value) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }

    const [nextPost, nextReplies] = await Promise.all([
      getEventExperiencePost(eventId.value, postId.value, userStore.userProfile?.uid),
      listExperiencePostReplies(eventId.value, postId.value, userStore.userProfile?.uid),
    ]);

    if (!nextPost) {
      errorMessage.value = 'Experience post not found.';
      post.value = null;
      replies.value = [];
      return;
    }

    post.value = nextPost;
    replies.value = nextReplies;
  } catch (error) {
    console.error('Failed to load experience post:', error);
    errorMessage.value = 'Failed to load this experience post.';
  } finally {
    isLoading.value = false;
  }
};

const goBack = () => {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  router.push(eventLink.value);
};

const deletePost = async () => {
  if (!post.value || post.value.userId !== userStore.userProfile?.uid) return;
  if (!window.confirm('Delete this experience post?')) return;

  try {
    await deleteEventExperiencePost(eventId.value, postId.value);
    router.push(eventLink.value);
  } catch (error) {
    console.error('Failed to delete experience post:', error);
    errorMessage.value = 'Failed to delete this experience post.';
  }
};

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

const sanitizeHtml = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  doc.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());
  doc.body.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attribute) => {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (name.startsWith('on') || value.startsWith('javascript:')) {
        element.removeAttribute(attribute.name);
      }
    });
  });
  return doc.body.innerHTML;
};

const formatTimestamp = (value: ExperiencePost['createdAt']) => {
  if (!value) return 'Just now';

  try {
    const date = typeof (value as { toDate?: () => Date }).toDate === 'function'
      ? (value as { toDate: () => Date }).toDate()
      : typeof (value as { seconds?: number }).seconds === 'number'
        ? new Date((value as { seconds: number }).seconds * 1000)
        : new Date(value as string);

    if (Number.isNaN(date.getTime())) return 'Just now';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Just now';
  }
};

onMounted(loadPost);

watch([eventId, postId, () => userStore.userProfile?.uid], () => {
  loadPost();
});
</script>

<style scoped>
.experience-detail-page {
  max-width: 920px;
  margin: 0 auto;
  padding: calc(var(--navbar-height) + 34px) var(--spacing-2xl) var(--spacing-4xl);
}

.back-button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
  padding: 0 14px;
  color: #475467;
  border: 1px solid #e4e7ec;
  border-radius: 999px;
  background: #fff;
  font-weight: 800;
  cursor: pointer;
}

.state-card,
.post-card,
.event-card,
.replies-card {
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.state-card {
  padding: 30px;
  color: #667085;
}

.state-card.error {
  color: #c0392b;
}

.post-card {
  padding: 34px;
}

.post-tag {
  display: inline-flex;
  margin-bottom: 14px;
  padding: 6px 10px;
  color: #6c48d1;
  border-radius: 999px;
  background: rgba(108, 72, 209, 0.1);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.post-header h1 {
  margin: 0;
  color: #101828;
  font-size: 34px;
  font-weight: 850;
  line-height: 1.12;
}

.post-subtitle {
  margin: 10px 0 0;
  color: #667085;
  font-size: 18px;
  line-height: 1.45;
}

.post-meta,
.reply-meta,
.post-stats,
.reply-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #667085;
  font-size: 13px;
}

.post-meta {
  margin: 14px 0 0;
}

.post-meta span:first-child,
.reply-meta span:first-child {
  color: #344054;
  font-weight: 800;
}

.media-section {
  display: grid;
  gap: 14px;
  margin-top: 26px;
}

.post-video,
.post-image {
  width: 100%;
  max-height: 560px;
  border-radius: 16px;
  border: 1px solid #e4e7ec;
  background: #000;
}

.post-image {
  object-fit: cover;
  background: #f8fafc;
}

.post-content {
  margin-top: 28px;
  color: #344054;
  font-size: 17px;
  line-height: 1.75;
}

.plain-content {
  white-space: pre-wrap;
}

.rich-content :deep(*) {
  max-width: 100%;
}

.post-stats {
  margin: 28px 0 0;
  padding-top: 18px;
  border-top: 1px solid #eef2f6;
}

.delete-post-button {
  border: none;
  background: transparent;
  color: #b42318;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  padding: 0;
}

.delete-post-button:hover {
  color: #7a271a;
}

.event-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-top: 18px;
  padding: 22px;
}

.event-label {
  margin: 0 0 4px;
  color: #6c48d1;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.event-card h2 {
  margin: 0;
  color: #101828;
  font-size: 20px;
}

.event-meta {
  margin: 6px 0 0;
  color: #667085;
  font-size: 13px;
}

.event-link {
  flex-shrink: 0;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  padding: 0 16px;
  color: #fff;
  border-radius: 999px;
  background: #6c48d1;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.event-link.secondary {
  color: #6c48d1;
  border: 1px solid rgba(108, 72, 209, 0.2);
  background: rgba(108, 72, 209, 0.08);
}

.replies-card {
  margin-top: 18px;
  padding: 26px;
}

.replies-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.replies-header h2 {
  margin: 0;
  color: #101828;
  font-size: 24px;
}

.replies-header span,
.reply-empty {
  color: #667085;
  font-size: 13px;
}

.reply-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reply-card {
  padding: 16px;
  border: 1px solid #eef2f6;
  border-radius: 16px;
  background: #f8fafc;
}

.reply-meta,
.reply-content,
.reply-stats {
  margin: 0;
}

.reply-content {
  margin-top: 8px;
  color: #344054;
  line-height: 1.6;
  white-space: pre-wrap;
}

.reply-stats {
  margin-top: 10px;
}

@media (max-width: 640px) {
  .experience-detail-page {
    padding: calc(var(--navbar-height) + 20px) 16px 32px;
  }

  .post-card {
    padding: 24px 18px;
  }

  .post-header h1 {
    font-size: 28px;
  }

  .event-card {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
