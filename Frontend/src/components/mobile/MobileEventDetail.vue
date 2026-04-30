<template>
  <div class="mobile-event-detail">
    <!-- Event Header -->
    <div class="event-header">
      <h1 class="event-title">{{ event?.title || 'Loading...' }}</h1>
      <button
        class="bookmark-button"
        type="button"
        :class="{ saved: isSavedEvent }"
        :disabled="isSavingEvent"
        @click="toggleSavedEvent"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
        </svg>
      </button>
    </div>

    <!-- Event Info Bento Layout -->
    <div class="bento-container">
      <!-- Left: Event Image -->
      <div class="bento-image">
        <img 
          :src="event?.imageUrl || '/images/wavingdog.jpg'" 
          :alt="event?.title"
          class="event-image"
          @error="handleImageError"
        />
      </div>

      <!-- Right: Event Details -->
      <div class="bento-details">
        <!-- Time -->
        <div class="detail-item">
          <div class="detail-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
          </div>
          <span class="detail-text">{{ formattedTime }}</span>
        </div>

        <!-- Location -->
        <div class="detail-item">
          <div class="detail-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <span class="detail-text">{{ event?.location || 'Location TBD' }}</span>
        </div>

        <!-- Tags -->
        <div class="tags-section">
          <span 
            v-for="tag in displayTags" 
            :key="tag" 
            class="tag"
          >
            #{{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- Event Description -->
    <div class="description-card">
      <h2 class="section-title">Event Description</h2>
      <div class="description-content">
        <p>{{ event?.description || 'No description available.' }}</p>
      </div>
    </div>

    <!-- Forum -->
    <div id="forum-section" ref="forumSectionRef" class="forum-card">
      <div class="forum-header">
        <h2 class="section-title">Forum</h2>
        <span class="forum-count">{{ posts.length }} posts</span>
      </div>

      <ReplyInput
        :is-logged-in="userStore.isLoggedIn"
        :loading="isPosting"
        :compact="true"
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

    <!-- Map under forum -->
    <div v-if="event?.location" class="map-card">
      <h2 class="section-title">Location Map</h2>
      <div ref="mapEl" class="google-map"></div>
    </div>

    <!-- Event Link -->
    <div class="link-card" v-if="event?.link">
      <h2 class="section-title">Event Link</h2>
      <div class="link-content">
        <a :href="event.link" target="_blank" class="event-link">
          <div class="link-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
          </div>
          <span class="link-text">Click here for event registration</span>
          <div class="external-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15,3 21,3 21,9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, onBeforeUnmount, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '../../stores/event';
import { useUserStore } from '../../stores/user';
import { formatEventSchedule } from '../../types/event';
import type { Event } from '../../types/event';
import type { DiscussionPost } from '../../types/forum';
import ForumPostCard from '../ForumPostCard.vue';
import ReplyInput from '../ReplyInput.vue';
import { loadGoogleMaps } from '../../utils/googleMaps';
import {
  createDiscussionReply,
  createEventDiscussionPost,
  subscribeToEventDiscussionPosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
} from '../../api/forums';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();
const event = ref<Event | null>(null);
const isLoading = ref(true);
const mapEl = ref<HTMLElement | null>(null);
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

// Load event data when component mounts
onMounted(async () => {
  try {
    const eventId = route.params.id as string;
    
    // Ensure events are loaded
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }
    
    // Find the specific event
    const foundEvent = eventStore.events.find((e: Event) => e.id === eventId);
    if (foundEvent) {
      event.value = foundEvent;
    } else {
      console.error('Event not found:', eventId);
    }
    
  } catch (error) {
    console.error('Error loading event:', error);
  } finally {
    isLoading.value = false;
    nextTick(() => {
      scrollToForum();
    });
  }
});

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

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to join the event discussion.'
    }
  });
};

// Handle image loading errors
const handleImageError = (event: any) => {
  const target = event.target as HTMLImageElement;
  target.src = '/images/wavingdog.jpg';
};

const goToForum = () => {
  if (event.value) {
    router.push(`/forums/${event.value.id}`);
  }
};

// Format time using existing utility
const formattedTime = computed(() => {
  if (!event.value) return '';
  try {
    return formatEventSchedule(event.value);
  } catch (error) {
    // Fallback to simple date formatting
    const startDate = typeof event.value.startTime?.toDate === 'function' 
      ? event.value.startTime.toDate() 
      : new Date(event.value.startTime);
    
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
});

const submitPost = async (text: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.email || !text || !eventId) return;

  isPosting.value = true;
  postError.value = '';

  try {
    await createEventDiscussionPost(
      eventId,
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
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.email || !eventId) return;

  try {
    await createDiscussionReply(
      eventId,
      postId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
    subscribePosts(eventId);
  } catch (error) {
    console.error('Failed to post reply:', error);
    postError.value = 'Failed to post reply. Please try again.';
  }
};

const togglePostLike = async (postId: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.uid || !eventId) return;

  try {
    await toggleDiscussionPostLike(eventId, postId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle post like:', error);
  }
};

const toggleReplyLike = async (postId: string, replyId: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.uid || !eventId) return;

  try {
    await toggleDiscussionReplyLike(eventId, postId, replyId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle reply like:', error);
  }
};

const scrollToForum = () => {
  if (!route.query.postId && route.query.section !== 'forum') return;
  forumSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Display limited number of tags
const displayTags = computed(() => {
  if (!event.value?.tags || event.value.tags.length === 0) return [];
  return event.value.tags.slice(0, 5); // Show up to 5 tags
});

watch(
  () => route.params.id as string,
  (id) => {
    if (id) subscribePosts(id);
  },
  { immediate: true }
);

watch(() => userStore.userProfile?.uid, () => {
  const id = route.params.id as string;
  if (id) subscribePosts(id);
});

watch(() => route.query, () => {
  scrollToForum();
});

onBeforeUnmount(() => {
  if (unsubscribePosts) unsubscribePosts();
});

</script>

<style scoped>
.mobile-event-detail {
  min-height: 100vh;
  background-image: url('/images/image.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding: 20px 16px 80px;
  overflow-y: auto;
}

.event-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 16px;
}

.event-title {
  font-size: 24px;
  font-weight: 300;
  color: #333;
  margin: 0;
  line-height: 1.3;
  flex: 1;
}

.bookmark-button {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.bookmark-button:hover {
  background: #f5f5f5;
}

.bookmark-button.saved {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border-color: transparent;
}

.bookmark-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.forum-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.forum-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.forum-count {
  font-size: 12px;
  color: #666;
}

.forum-error {
  color: #c0392b;
  margin-bottom: 10px;
  font-size: 13px;
}

.forum-empty {
  color: #666;
  font-size: 13px;
}

.forum-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bento-container {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.bento-image {
  background: white;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
  flex-shrink: 0;
}

.event-image {
  width: 140px;
  height: 140px;
  object-fit: cover;
  border-radius: 12px;
}

.bento-details {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.detail-icon {
  color: #ad8ae6;
  flex-shrink: 0;
}

.detail-text {
  font-size: 14px;
  color: #333;
  line-height: 1.3;
  white-space: pre-line;
}

.tags-section {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.tag {
  background: #f0f0f0;
  color: #666;
  font-size: 10px;
  font-weight: 300;
  padding: 4px 8px;
  border-radius: 12px;
  white-space: nowrap;
}

.tag:first-child {
  background: rgba(173, 138, 230, 0.95);
  color: white;
}

.description-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.description-card,
.forum-card,
.map-card,
.link-card {
  margin-top: 16px;
}

.bento-container + .description-card {
  margin-top: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 300;
  color: #333;
  margin: 0 0 16px 0;
}

.description-content {
  color: #666;
  font-size: 17px;
  line-height: 1.3;
  font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.description-content p {
  margin: 0 0 12px 0;
}

.description-content p:last-child {
  margin-bottom: 0;
}

.map-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.map-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.google-map {
  width: 100%;
  height: 260px;
  border-radius: 12px;
  overflow: hidden;
}

.google-map {
  width: 100%;
  height: 220px;
  border-radius: 12px;
  overflow: hidden;
}

.link-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.map-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.google-map {
  width: 100%;
  height: 260px;
  border-radius: 12px;
  overflow: hidden;
}

.link-content {
  margin: 0;
}

.event-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 12px;
  text-decoration: none;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.event-link:hover {
  background: #e9ecef;
  border-color: #ad8ae6;
}

.link-icon {
  color: #ad8ae6;
  flex-shrink: 0;
}

.link-text {
  flex: 1;
  font-size: 15px;
  color: #333;
  font-weight: 300;
  font-family: 'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.external-icon {
  color: #666;
  flex-shrink: 0;
}

/* Mobile responsive adjustments */
@media (max-width: 480px) {
  .mobile-event-detail {
    padding: 16px 12px 80px;
  }
  
  .event-title {
    font-size: 20px;
  }
  
  .event-info-card {
    flex-direction: column;
    text-align: center;
  }
  
  .event-image-section {
    width: 100%;
    height: 180px;
    margin-bottom: 8px;
  }
  
  .event-details {
    gap: 10px;
  }
}
</style>
