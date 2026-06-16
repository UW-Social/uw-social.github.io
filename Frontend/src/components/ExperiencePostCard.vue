<template>
  <article
    :class="['experience-card', { compact }]"
    role="link"
    tabindex="0"
    @click="openPostDetail"
    @keydown.enter.prevent="openPostDetail"
    @keydown.space.prevent="openPostDetail"
  >
    <div class="experience-tag-row">
      <span class="experience-tag">Experience</span>
    </div>

    <header class="experience-header">
      <div class="author-block">
        <div class="author-avatar" aria-hidden="true">
          {{ authorInitials }}
        </div>
        <div class="author-copy">
          <h3>{{ authorName }}</h3>
          <p>
            <span>{{ formatTimestamp(post.createdAt) }}</span>
            <span v-if="post.eventLocation">• {{ post.eventLocation }}</span>
          </p>
        </div>
      </div>

    </header>

    <div :class="['experience-body', { 'with-media': post.mediaUrls?.length }]">
      <div class="experience-main">
        <h2 class="experience-title">{{ derivedTitle }}</h2>
        <p v-if="post.subtitle" class="experience-subtitle">{{ post.subtitle }}</p>
        <p class="experience-text">{{ previewText }}</p>
      </div>

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

    <router-link v-if="showEventContext" :to="eventLink" class="event-context" @click.stop>
      <div class="event-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M7 3v3M17 3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      </div>
      <div class="event-copy">
        <p class="context-label">Related Event</p>
        <p class="context-link">{{ post.eventTitle }}</p>
        <p class="context-value">
          <span v-if="post.eventSchedule">{{ post.eventSchedule }}</span>
          <span v-if="post.eventSchedule && post.eventLocation"> • </span>
          <span v-if="post.eventLocation">{{ post.eventLocation }}</span>
        </p>
      </div>
    </router-link>

    <div class="experience-actions">
      <button class="experience-action-button" type="button" @click.stop="handleToggleLike">
        <svg :class="{ active: post.hasLiked }" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.8 8.6c0 5.4-8.8 10.2-8.8 10.2S3.2 14 3.2 8.6A4.7 4.7 0 0 1 12 6.2a4.7 4.7 0 0 1 8.8 2.4Z" />
        </svg>
        <span>{{ post.likeCount }} likes</span>
      </button>
      <span class="action-stat">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
        </svg>
        {{ post.replyCount }} replies
      </span>
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
}>(), {
  showEventContext: false,
  compact: false,
  previewLimit: 360,
});

const router = useRouter();

const authorName = computed(() => props.post.authorName || props.post.userEmail || 'Anonymous User');

const authorInitials = computed(() => {
  const parts = authorName.value
    .replace(/@.*/, '')
    .split(/\s+|[._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return 'U';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
});

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
  position: relative;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid rgba(130, 110, 153, 0.18);
  background: #fff;
  padding: 22px;
  box-shadow: 0 16px 34px rgba(56, 39, 77, 0.07);
  cursor: pointer;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease, background 0.18s ease;
}

.experience-card:hover {
  border-color: rgba(101, 57, 215, 0.28);
  box-shadow: 0 20px 42px rgba(56, 39, 77, 0.1);
  transform: translateY(-2px);
}

.experience-card:focus-visible {
  outline: 3px solid rgba(101, 57, 215, 0.22);
  outline-offset: 3px;
}

.experience-card.compact {
  padding: 18px;
}

.experience-tag-row {
  margin-bottom: 16px;
}

.experience-tag {
  display: inline-flex;
  border-radius: 999px;
  padding: 5px 10px;
  background: #f0e9ff;
  color: #53368b;
  font-size: 0.66rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.experience-header {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin-bottom: 20px;
}

.author-block {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-avatar {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid #d7dce8;
  background: #eef1f7;
  color: #4b5568;
  font-size: 0.82rem;
  font-weight: 800;
}

.author-copy {
  min-width: 0;
}

.author-copy h3 {
  margin: 0;
  color: #2f2542;
  font-size: 0.92rem;
  line-height: 1.2;
}

.author-copy p {
  margin: 5px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0 6px;
  color: #766783;
  font-size: 0.8rem;
}

.experience-action-button svg,
.action-stat svg,
.event-icon svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.experience-body {
  display: grid;
  gap: 20px;
  margin-bottom: 20px;
}

.experience-body.with-media {
  grid-template-columns: minmax(0, 1fr) minmax(180px, 220px);
  align-items: start;
}

.experience-main {
  min-width: 0;
}

.experience-title {
  margin: 0;
  color: #2f2542;
  font-size: clamp(1.12rem, 1.5vw, 1.42rem);
  line-height: 1.2;
  letter-spacing: 0;
  font-weight: 900;
}

.experience-subtitle {
  margin: 9px 0 0;
  color: #657089;
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.5;
}

.experience-text {
  display: -webkit-box;
  margin: 12px 0 0;
  color: #65576f;
  font-size: 0.92rem;
  line-height: 1.6;
  overflow: hidden;
  white-space: pre-wrap;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 8;
}

.experience-media-grid {
  display: grid;
  grid-template-columns: 1fr;
  justify-self: end;
  gap: 10px;
  width: 100%;
  max-width: 220px;
  min-height: 140px;
  margin-top: -4px;
}

.experience-media-image,
.experience-media-video {
  width: 100%;
  height: 100%;
  min-height: 140px;
  max-height: 190px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid rgba(130, 110, 153, 0.16);
  background: #16052a;
}

.experience-media-image {
  transition: transform 0.4s ease;
}

.experience-card:hover .experience-media-image {
  transform: scale(1.015);
}

.event-context {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 16px;
  background: #f9f5ff;
  border: 1px solid rgba(186, 164, 210, 0.24);
  color: inherit;
  text-decoration: none;
  transition: background 0.18s ease;
}

.event-context:hover {
  background: #f3eaff;
}

.event-icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #dcc9ff;
  color: #53368b;
}

.event-copy {
  min-width: 0;
}

.context-label {
  margin: 0 0 4px;
  color: #6539d7;
  font-size: 0.62rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}

.context-link {
  margin: 0;
  max-width: 100%;
  color: #2f2542;
  font-weight: 800;
  font-size: 0.92rem;
  line-height: 1.28;
  overflow-wrap: anywhere;
}

.context-value {
  margin: 4px 0 0;
  color: #75657f;
  line-height: 1.5;
  font-size: 0.82rem;
}

.experience-actions {
  padding-top: 14px;
  border-top: 1px solid rgba(186, 164, 210, 0.22);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  color: #766783;
  font-size: 0.84rem;
}

.experience-action-button,
.action-stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  border-radius: 999px;
  padding: 0 10px;
  color: inherit;
  font: inherit;
  font-weight: 800;
}

.experience-action-button {
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.experience-action-button:hover {
  background: #f0e9ff;
  color: #6539d7;
}

.experience-action-button:active {
  transform: scale(0.96);
}

.experience-action-button svg.active {
  fill: #6539d7;
  color: #6539d7;
}

@media (max-width: 900px) {
  .experience-card {
    padding: 18px;
    border-radius: 18px;
  }

  .experience-body.with-media {
    grid-template-columns: 1fr;
  }

  .experience-media-grid {
    justify-self: stretch;
    max-width: none;
    margin-top: 0;
  }

  .event-context {
    grid-template-columns: auto minmax(0, 1fr);
  }

}

@media (max-width: 560px) {
  .experience-card {
    padding: 16px;
  }

  .experience-header {
    align-items: flex-start;
  }

  .author-avatar {
    width: 38px;
    height: 38px;
    flex-basis: 38px;
  }

  .experience-title {
    font-size: 1.08rem;
  }

  .experience-media-image,
  .experience-media-video {
    min-height: 145px;
    max-height: 190px;
  }

  .event-context {
    padding: 14px;
  }
}
</style>
