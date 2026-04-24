<template>
  <div class="event-detail-page">
    <!-- Back Button -->
    <button @click="goBack" class="back-button shadow-premium">
      <span class="arrow">←</span>
    </button>

    <!-- Loading State -->
    <div v-if="!event" class="loading-state">
      <p>Loading event details...</p>
    </div>

    <!-- Event Content -->
    <template v-else>
      <!-- Event Header -->
      <div class="event-header-section animate-slide-up">
        <div class="event-image-card">
          <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event Image" class="event-image" />
        </div>

        <div class="event-info-card">
          <div class="event-info-header">
            <div class="event-title-row">
              <h1 class="event-title">{{ event.title }}</h1>
              <button
                class="save-event-button"
                type="button"
                :class="{ saved: isSavedEvent }"
                :disabled="isSavingEvent"
                @click="toggleSavedEvent"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{{ isSavedEvent ? 'Saved' : 'Save event' }}</span>
              </button>
            </div>
            <p v-if="descriptionSummary" class="event-summary">{{ descriptionSummary }}</p>
          </div>

          <div class="event-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Time</span>
              <span class="meta-value">{{ formatEventSchedule(event) }}</span>
            </div>
            <div class="meta-item" v-if="event.location">
              <span class="meta-label">Location</span>
              <span class="meta-value">{{ event.location }}</span>
            </div>
            <div class="meta-item" v-if="event.category">
              <span class="meta-label">Category</span>
              <span class="meta-value">{{ event.category }}</span>
            </div>

            <div class="meta-item" v-if="event.participants?.length">
              <span class="meta-label">Attendees</span>
              <span class="meta-value">
                {{ event.participants.length }} / {{ event.maxParticipants ?? 'No limit' }}
              </span>
            </div>
          </div>

          <div class="event-tags" v-if="event.tags && event.tags.length > 0">
            <span v-for="tag in event.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>

          <a
            v-if="event.link"
            :href="event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="event-link-btn"
          >
            View Event Page
          </a>
        </div>
      </div>

      <!-- Description and Forum -->
      <div class="content-section">
        <div class="description-card">
          <h2 class="section-title">About this event</h2>
          <p class="event-description" v-html="formatDescription(event.description || '')"></p>
        </div>

        <!-- Event Forum -->
        <div id="forum-section" ref="forumSectionRef" class="forum-card">
          <div class="forum-header">
            <h2 class="section-title">Forum</h2>
            <span class="forum-count">{{ posts.length }} posts</span>
          </div>

          <ReplyInput
            :is-logged-in="userStore.isLoggedIn"
            :loading="isPosting"
            placeholder="Start a discussion about this event..."
            submit-label="Post"
            login-heading="Join the discussion"
            login-text="Log in to share your thoughts about this event."
            login-button-label="Log in to post"
            @submit="submitPost"
            @login="goToLogin"
          />

          <p v-if="postError" class="forum-error">{{ postError }}</p>

          <div v-if="posts.length === 0" class="forum-empty">
            No posts yet. Be the first to post!
          </div>

          <div v-else class="forum-list">
            <ForumPostCard
              v-for="post in posts"
              :key="post.id"
              :post="post"
              :is-logged-in="userStore.isLoggedIn"
              :compact="true"
              :highlighted="highlightedPostId === post.id"
              :on-login="goToLogin"
              :on-toggle-post-like="togglePostLike"
              :on-toggle-reply-like="toggleReplyLike"
              :on-submit-reply="submitReply"
            />
          </div>
        </div>
      </div>

      <!-- Location -->
      <div class="map-card">
        <h2 class="section-title">Location</h2>
        <div class="google-map" ref="mapContainer"></div>
      </div>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import { formatEventSchedule, type Event } from '../types/event';
import type { DiscussionPost } from '../types/forum';
import ForumPostCard from '../components/ForumPostCard.vue';
import ReplyInput from '../components/ReplyInput.vue';
import { loadGoogleMaps } from '../utils/googleMaps';
import {
  createDiscussionReply,
  createEventDiscussionPost,
  subscribeToEventDiscussionPosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
} from '../api/forums';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();

const eventId = computed(() => route.params.id as string);
const event = ref<Event | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const forumSectionRef = ref<HTMLElement | null>(null);
const posts = ref<DiscussionPost[]>([]);
const isPosting = ref(false);
const isSavingEvent = ref(false);
const postError = ref('');
let unsubscribePosts: (() => void) | null = null;
const highlightedPostId = computed(() => {
  const postId = route.query.postId;
  return typeof postId === 'string' ? postId : '';
});

const isSavedEvent = computed(() => {
  if (!event.value?.id) return false;
  return (userStore.userProfile?.savedEventIds ?? []).includes(event.value.id);
});

const descriptionSummary = computed(() => {
  const raw = event.value?.description?.trim();
  if (!raw) return '';
  const plain = raw.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
  const firstLine = plain.split(/\n+/).find(line => line.trim().length > 0);
  return (firstLine ?? plain).trim();
});

const returnTo = computed(() => {
  const target = route.query.returnTo;
  if (typeof target !== 'string') return '/events';
  if (!target.startsWith('/') || target.startsWith('//')) return '/events';
  return target;
});

const goBack = () => {
  router.push(returnTo.value);

};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to join the event discussion.'
    }
  });
};

const goToForum = () => {
  if (!event.value) return;
  router.push(`/forums/${event.value.id}`);
};

const formatDescription = (desc: string) => {
  if (!desc) return '';
  return desc.replace(/\n/g, '<br>');
};

const loadEventData = async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }

  event.value = eventStore.events.find(e => e.id === eventId.value) || null;

  await nextTick();
  initMap();
};

const subscribePosts = (id: string) => {
  if (!id) return;
  if (unsubscribePosts) {
    unsubscribePosts();
    unsubscribePosts = null;
  }

  unsubscribePosts = subscribeToEventDiscussionPosts(
    id,
    userStore.userProfile?.uid,
    (nextPosts) => {
      posts.value = nextPosts;
    },
    (error) => {
      console.error('Failed to load posts:', error);
      postError.value = 'Failed to load posts.';
    }
  );
};

const submitPost = async (text: string) => {
  if (!userStore.userProfile?.email || !eventId.value) return;

  isPosting.value = true;
  postError.value = '';

  try {
    await createEventDiscussionPost(
      eventId.value,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
  } catch (error) {
    console.error('Failed to post message:', error);
    postError.value = 'Failed to post. Please try again.';
  } finally {
    isPosting.value = false;
  }
};


const submitReply = async (postId: string, text: string) => {
  if (!userStore.userProfile?.email || !eventId.value) return;

  try {
    await createDiscussionReply(
      eventId.value,
      postId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
    subscribePosts(eventId.value);
  } catch (error) {
    console.error('Failed to post reply:', error);
    postError.value = 'Failed to post reply. Please try again.';
  }
};

const togglePostLike = async (postId: string) => {
  if (!userStore.userProfile?.uid || !eventId.value) return;

  try {
    await toggleDiscussionPostLike(eventId.value, postId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle post like:', error);
  }
};

const toggleReplyLike = async (postId: string, replyId: string) => {
  if (!userStore.userProfile?.uid || !eventId.value) return;

  try {
    await toggleDiscussionReplyLike(eventId.value, postId, replyId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle reply like:', error);
  }
};

const scrollToForum = async () => {
  if (!route.query.postId && route.query.section !== 'forum') return;
  await nextTick();
  forumSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};


const initMap = async () => {
  const el = mapContainer.value;
  if (!el || !event.value) return;

  try {
    const g = await loadGoogleMaps();
    const fallback = { lat: 47.6553, lng: -122.3035 }; // UW

    const map = new g.maps.Map(el, {
      center: fallback,
      zoom: 15,
    });

    const location = event.value.location || 'University of Washington';
    const geocoder = new g.maps.Geocoder();

    geocoder.geocode({ address: location }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        const pos = results[0].geometry.location;
        map.setCenter(pos);
        new g.maps.Marker({ position: pos, map });
      } else {
        new g.maps.Marker({ position: fallback, map });
        console.warn('Geocode failed:', status, 'using fallback center');
      }
    });
  } catch (err) {
    console.error('Failed to load Google Maps:', err);
  }
};

onMounted(() => {
  loadEventData();
  scrollToForum();
});

watch(eventId, (id) => {
  if (id) subscribePosts(id);
}, { immediate: true });

watch(() => userStore.userProfile?.uid, () => {
  if (eventId.value) subscribePosts(eventId.value);
});

watch(() => route.query, () => {
  scrollToForum();
});

onBeforeUnmount(() => {
  if (unsubscribePosts) unsubscribePosts();
});
</script>

<style scoped>
.event-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-3xl);
  padding-top: calc(var(--navbar-height) + var(--spacing-2xl));
  position: relative;
  min-height: 100vh;
}

.back-button {
  position: fixed;
  top: calc(var(--navbar-height) + var(--spacing-2xl));
  /* Keep the back button offset symmetric with the page padding */
  left: calc(
    (100vw - min(100vw, calc(1200px + 2 * var(--spacing-3xl)))) / 2 +
    var(--spacing-xl)
  );
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.5rem;
  z-index: 100;
  box-shadow: none;
}

.back-button:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  transform: translateX(-3px);
}

.arrow {
  color: var(--color-gray-900);
  font-weight: bold;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
}

.forum-card {
  background: var(--color-white);
  border-radius: var(--radius-xl);
  border: var(--border-width) solid var(--border-color);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-soft);
}

.forum-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.forum-count {
  font-size: var(--font-size-sm);
  color: var(--color-gray-500);
}

.forum-error {
  color: #c0392b;
  margin-bottom: var(--spacing-md);
}

.forum-empty {
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

.forum-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.event-header-section {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
  /* micro-align the top edge with the back button baseline */
  margin-top: -68px;
  margin-bottom: var(--spacing-2xl);
  align-items: stretch;
}

.event-image-card {
  background: var(--color-white);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 100%;
  min-height: 340px;
  display: flex;
}

.event-image-card {
  background: var(--color-gray-50);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  overflow: hidden;
  height: 100%;
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.event-info-card {
  background: var(--color-white);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-3xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  height: 100%;
  min-height: 380px;
}

.event-info-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.event-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.event-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0;
}

.save-event-button {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border: 1px solid rgba(99, 102, 241, 0.16);
  background: rgba(99, 102, 241, 0.06);
  color: var(--color-primary);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-size: 0.95rem;
  font-weight: 700;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.save-event-button:hover:not(:disabled) {
  transform: translateY(-1px);
  background: rgba(99, 102, 241, 0.12);
}

.save-event-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.save-event-button.saved {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: var(--color-white);
  border-color: transparent;
  box-shadow: 0 14px 30px rgba(99, 102, 241, 0.22);
}

.save-event-button svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.event-summary {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.event-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-gray-600);
}

.meta-value {
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  line-height: var(--line-height-normal);
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  background: var(--color-gray-100);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border: var(--border-width) solid var(--border-color);
}

.event-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  transition: background 0.2s;
  align-self: flex-start;
}

.event-link-btn:hover {
  background: var(--color-primary-hover);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.description-card,
.map-card {
  background: var(--color-white);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0 0 var(--spacing-lg) 0;
}

.event-description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.google-map {
  width: 100%;
  height: 400px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: var(--border-width) solid var(--border-color);
}

.related-events-section {
  background: var(--color-white);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.event-card {
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: var(--border-width) solid var(--border-color);
  background: var(--color-white);
}

.event-card:hover {
  transform: translateY(-4px);
}

.event-thumbnail {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.event-card-info {
  padding: var(--spacing-md);
}

.event-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
  line-height: var(--line-height-tight);
}

@media (max-width: 1024px) {
  .event-header-section {
    grid-template-columns: 1fr;
  }

  .content-section {
    grid-template-columns: 1fr;
  }

  .events-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .event-detail-page {
    padding: var(--spacing-xl);
    padding-top: calc(var(--navbar-height) + var(--spacing-lg));
  }

  .back-button {
    left: var(--spacing-xl);
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .event-info-card {
    padding: var(--spacing-lg);
  }

  .event-title {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 576px) {
  .events-grid {
    grid-template-columns: 1fr;
  }

  .google-map {
    height: 300px;
  }
}
</style>
