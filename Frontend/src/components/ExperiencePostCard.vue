<template>
  <article
    :class="['experience-card', { compact }]"
    role="link"
    tabindex="0"
    @click="openPostDetail"
    @keydown.enter.prevent="openPostDetail"
    @keydown.space.prevent="openPostDetail"
  >
    <div class="experience-body">
      <div class="experience-main">
        <span class="experience-tag">Experience</span>
        <p class="experience-meta">
          <span class="experience-author">{{ post.authorName || post.userEmail || 'Anonymous User' }}</span>
          <span>{{ formatTimestamp(post.createdAt) }}</span>
        </p>
        <h3 class="experience-title">{{ derivedTitle }}</h3>
        <p v-if="post.subtitle" class="experience-subtitle">{{ post.subtitle }}</p>
        <p class="experience-text">{{ previewText }}</p>
        <div v-if="post.mediaUrls?.length" class="experience-media-grid">
        <template v-for="url in post.mediaUrls" :key="url">
          <video
            v-if="isVideoUrl(url)"
            :src="url"
            class="experience-media-video"
            controls
            preload="metadata"
            @click.stop
          ></video>

          <img
            v-else
            :src="url"
            class="experience-media-image"
            alt="Forum post media"
          />
        </template>
      </div>
    </div>
      <div v-if="showEventContext" class="event-context">
        <p class="context-label">Event</p>
        <router-link :to="eventLink" class="context-link" @click.stop>
          {{ post.eventTitle }}
        </router-link>
        <p v-if="post.eventSchedule" class="context-value">{{ post.eventSchedule }}</p>
        <p v-if="post.eventLocation" class="context-value">{{ post.eventLocation }}</p>
      </div>
    </div>

    <div class="experience-actions">
      <button class="experience-action-button" type="button" @click.stop="handleToggleLike">
        <span :class="['like-indicator', { active: post.hasLiked }]"></span>
        Like
      </button>
      <span>{{ post.likeCount }} likes</span>
      <span>{{ post.replyCount }} replies</span>
      <button
        v-if="canDelete"
        class="experience-action-button delete-action"
        type="button"
        @click.stop="handleDelete"
      >
        Delete
      </button>
    </div>

    <div v-if="showEventContext" class="experience-footer">
      <router-link :to="eventLink" class="view-event-button" @click.stop>
        View Event Discussion
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { AggregatedExperiencePost, ExperiencePost } from '../types/forum';

const props = withDefaults(defineProps<{
  post: ExperiencePost | AggregatedExperiencePost;
  isLoggedIn: boolean;
  showEventContext?: boolean;
  compact?: boolean;
  previewLimit?: number;
  onLogin: () => void;
  onToggleLike: (postId: string) => Promise<void> | void;
  canDelete?: boolean;
  onDelete?: (postId: string) => Promise<void> | void;
}>(), {
  showEventContext: false,
  compact: false,
  previewLimit: 360,
  canDelete: false,
});

const router = useRouter();

const isVideoUrl = (url: string) => {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
};

const postDetailLink = computed(() => ({
  path: `/forum/posts/${props.post.eventId}/${props.post.id}`,
}));

const eventLink = computed(() => ({
  path: `/events/${props.post.eventId}`,
  query: { section: 'forum', postId: props.post.id },
}));

const derivedTitle = computed(() => {
  if (props.post.title?.trim()) return props.post.title.trim();
  const firstLine = props.post.content
    .split(/\n+/)
    .map((line) => line.trim())
    .find((line) => line.length > 0);
  const source = firstLine || props.post.content.replace(/\s+/g, ' ').trim() || 'Event experience';
  return source.length <= 72 ? source : `${source.slice(0, 72).trimEnd()}...`;
});

const previewText = computed(() => {
  const text = props.post.content.trim();
  if (!props.previewLimit || text.length <= props.previewLimit) return text;
  return `${text.slice(0, props.previewLimit).trimEnd()}...`;
});

const handleToggleLike = async () => {
  if (!props.isLoggedIn) {
    props.onLogin();
    return;
  }

  await props.onToggleLike(props.post.id);
};

const handleDelete = async () => {
  await props.onDelete?.(props.post.id);
};

const openPostDetail = () => {
  router.push(postDetailLink.value);
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
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return 'Just now';
  }
};
</script>

<style scoped>
.experience-card {
  border-radius: 20px;
  border: 1px solid rgba(37, 99, 235, 0.14);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 255, 0.96));
  padding: 22px;
  box-shadow: 0 14px 34px rgba(31, 39, 64, 0.07);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.experience-card:hover {
  border-color: rgba(108, 72, 209, 0.28);
  box-shadow: 0 18px 40px rgba(31, 39, 64, 0.1);
}

.experience-card:focus-visible {
  outline: 3px solid rgba(108, 72, 209, 0.22);
  outline-offset: 3px;
}

.experience-card.compact {
  padding: 18px;
}

.experience-body {
  display: flex;
  justify-content: space-between;
  gap: 22px;
}

.experience-main {
  min-width: 0;
  flex: 1;
}

.experience-tag {
  display: inline-flex;
  margin-bottom: 10px;
  border-radius: 999px;
  padding: 6px 10px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.experience-meta {
  margin: 0 0 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  color: #667089;
  font-size: 0.9rem;
}

.experience-author {
  font-weight: 700;
  color: #24304a;
}

.experience-title {
  margin: 0;
  color: #172033;
  font-size: 1.3rem;
  line-height: 1.25;
}

.experience-subtitle {
  margin: 8px 0 0;
  color: #657089;
  font-weight: 600;
  line-height: 1.5;
}

.experience-text {
  margin: 12px 0 0;
  color: #44506a;
  line-height: 1.7;
  white-space: pre-wrap;
}

.experience-media-grid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
}

.experience-media-image {
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid rgba(31, 39, 64, 0.1);
}

.experience-media-video {
  width: 100%;
  max-height: 320px;
  border-radius: 12px;
  border: 1px solid rgba(31, 39, 64, 0.1);
  background: #000;
}

.event-context {
  min-width: 230px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(37, 99, 235, 0.12);
}

.context-label {
  margin: 0 0 4px;
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.context-link {
  display: inline-block;
  color: #20263a;
  font-weight: 800;
  text-decoration: none;
  line-height: 1.4;
}

.context-value {
  margin: 8px 0 0;
  color: #63708a;
  line-height: 1.5;
}

.experience-actions {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  align-items: center;
  color: #667089;
  font-size: 0.92rem;
}

.experience-action-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.delete-action {
  color: #b42318;
}

.delete-action:hover {
  color: #7a271a;
}

.like-indicator {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #c3c9d9;
}

.like-indicator.active {
  background: #2563eb;
}

.experience-footer {
  margin-top: 16px;
}

.view-event-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 12px 18px;
  background: rgba(37, 99, 235, 0.1);
  color: #20263a;
  text-decoration: none;
  font-weight: 700;
}

@media (max-width: 900px) {
  .experience-body {
    flex-direction: column;
  }

  .event-context {
    min-width: 0;
  }
}
</style>
