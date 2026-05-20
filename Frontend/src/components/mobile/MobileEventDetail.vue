<template>
  <div class="mobile-event-detail">
    <!-- Event Header Section -->
    <div class="event-hero-card">
      <div class="event-hero-image-wrap">
        <img
          :src="event?.imageUrl || '/images/wavingdog.jpg'"
          :alt="event?.title || 'Event image'"
          class="event-hero-image"
          @error="handleImageError"
        >
        <div class="event-badges">
          <span class="category-badge">{{ primaryBadge }}</span>
          <span v-if="secondaryBadge" class="tag-badge">#{{ secondaryBadge }}</span>
        </div>
      </div>

      <div class="event-hero-info">
        <h1 class="event-title">{{ event?.title || 'Loading...' }}</h1>
        <p class="event-summary">{{ eventSummary }}</p>

        <div class="logistics-grid">
          <div class="logistic-card">
            <div class="logistic-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div class="logistic-copy">
              <p class="logistic-label">When</p>
              <p class="logistic-primary">{{ schedulePrimary }}</p>
              <p class="logistic-secondary">{{ scheduleSecondary }}</p>
            </div>
          </div>

          <div class="logistic-card">
            <div class="logistic-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div class="logistic-copy">
              <p class="logistic-label">Where</p>
              <p class="logistic-primary">{{ locationPrimary }}</p>
              <p class="logistic-secondary">{{ locationSecondary }}</p>
            </div>
          </div>
        </div>

        <div class="event-actions">
          <button
            class="register-button"
            type="button"
            :disabled="!event?.link"
            @click="openRegistration"
          >
            Register Now
          </button>
          <button class="download-button" type="button" aria-label="Download event details">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <polyline points="9,15 12,18 15,15"></polyline>
            </svg>
          </button>
          <button
            class="save-button"
            type="button"
            :class="{ saved: isSavedEvent }"
            :disabled="isSavingEvent"
            @click="toggleSavedEvent"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
            </svg>
            {{ isSavedEvent ? 'Saved' : 'Save' }}
          </button>
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

    <!-- Experience Sharing -->
    <div id="forum-section" ref="experienceSectionRef" class="forum-card experience-section">
      <div class="forum-header">
        <div>
          <h2 class="section-title">Experience Sharing</h2>
          <p class="section-helper">Share a longer review, recap, or experience from this event.</p>
        </div>
        <span class="forum-count">{{ experiencePosts.length }} posts</span>
      </div>

      <ReplyInput
        :is-logged-in="userStore.isLoggedIn"
        :loading="isPostingExperience"
        :compact="true"
        :rows="6"
        placeholder="Share a longer review, recap, or experience from this event..."
        submit-label="Share Experience"
        login-heading="Log in to share your experience"
        login-text="Log in to share your experience."
        login-button-label="Log in"
        @submit="submitExperiencePost"
        @login="goToLogin"
      />

      <p v-if="experienceError" class="forum-error">{{ experienceError }}</p>

      <div v-if="experiencePosts.length === 0" class="forum-empty">
        No experiences yet. Share the first recap or review.
      </div>

      <div v-else class="forum-list">
        <ExperiencePostCard
          v-for="post in experiencePosts"
          :key="post.id"
          :post="post"
          :is-logged-in="userStore.isLoggedIn"
          :compact="true"
          :on-login="goToLogin"
          :on-toggle-like="toggleExperienceLike"
        />
      </div>
    </div>

    <!-- Ratings & Reviews -->
    <div id="review-section" class="ratings-review-card">
      <div class="ratings-review-header">
        <h2 class="ratings-review-title">Ratings &amp; Reviews</h2>
        <div class="ratings-review-score">
          <strong>4.8</strong>
          <span>/ 5</span>
        </div>
      </div>

      <div class="ratings-review-summary">
        <div class="ratings-stars" aria-label="4.8 out of 5 stars">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span class="muted">★</span>
        </div>
      </div>
    </div>

    <!-- Comments -->
    <div id="comments-section" ref="commentsSectionRef" class="forum-card comments-card">
      <div class="forum-header">
        <h2 class="section-title">Comments</h2>
        <span class="forum-count">{{ posts.length }} comments</span>
      </div>

      <div class="comment-input-row">
        <div class="comment-current-avatar">{{ currentUserInitials }}</div>
        <ReplyInput
          :is-logged-in="userStore.isLoggedIn"
          :loading="isPosting"
          :compact="true"
          :rows="1"
          :submit-on-enter="true"
          placeholder="Add a comment..."
          submit-label="Comment"
          login-heading="Log in to join the conversation"
          login-text="Log in to join the conversation."
          login-button-label="Log in"
          @submit="submitPost"
          @login="goToLogin"
        />
      </div>

      <p v-if="postError" class="forum-error">{{ postError }}</p>

      <div v-if="posts.length === 0" class="forum-empty">
        No comments yet. Be the first to comment!
      </div>

      <div v-else class="forum-list">
        <ForumPostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :is-logged-in="userStore.isLoggedIn"
          :compact="true"
          tag-label="Comment"
          :comment-style="true"
          :highlighted="highlightedPostId === post.id"
          :on-login="goToLogin"
          :on-toggle-post-like="togglePostLike"
          :on-toggle-reply-like="toggleReplyLike"
          :on-submit-reply="submitReply"
        />
      </div>
    </div>

    <!-- Map under social sections -->
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
import type { DiscussionPost, ExperiencePost } from '../../types/forum';
import ExperiencePostCard from '../ExperiencePostCard.vue';
import ForumPostCard from '../ForumPostCard.vue';
import ReplyInput from '../ReplyInput.vue';
import { loadGoogleMaps } from '../../utils/googleMaps';
import {
  createDiscussionReply,
  createEventDiscussionPost,
  createEventExperiencePost,
  subscribeToEventDiscussionPosts,
  subscribeToEventExperiencePosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
  toggleExperiencePostLike,
} from '../../api/forums';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();
const event = ref<Event | null>(null);
const isLoading = ref(true);
const mapEl = ref<HTMLElement | null>(null);
const commentsSectionRef = ref<HTMLElement | null>(null);
const experienceSectionRef = ref<HTMLElement | null>(null);
const posts = ref<DiscussionPost[]>([]);
const experiencePosts = ref<ExperiencePost[]>([]);
const isPosting = ref(false);
const isPostingExperience = ref(false);
const isSavingEvent = ref(false);
const postError = ref('');
const experienceError = ref('');
let unsubscribePosts: (() => void) | null = null;
let unsubscribeExperiencePosts: (() => void) | null = null;
const highlightedPostId = computed(() => {
  const postId = route.query.postId;
  return typeof postId === 'string' ? postId : '';
});

const currentUserInitials = computed(() => {
  const profile = userStore.userProfile;
  const value = profile?.displayName || profile?.email || 'Y';
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  return (words[0]?.slice(0, 2) || 'Y').toUpperCase();
});

const isSavedEvent = computed(() => {
  if (!event.value?.id) return false;
  return (userStore.userProfile?.savedEventIds ?? []).includes(event.value.id);
});

const primaryBadge = computed(() => event.value?.category?.trim() || 'Academic');

const secondaryBadge = computed(() => {
  const tags = event.value?.tags ?? [];
  return tags.find((tag) => tag && tag.trim())?.trim() || '';
});

const eventSummary = computed(() => {
  const description = event.value?.description?.trim();
  if (!description) return 'Witness the convergence of cutting-edge technology and visionary minds.';
  const firstLine = description.split(/\n+/).find(Boolean) || description;
  return firstLine.length > 108 ? `${firstLine.slice(0, 105).trim()}...` : firstLine;
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

const subscribeExperiencePosts = (id: string) => {
  if (!id) return;
  if (unsubscribeExperiencePosts) {
    unsubscribeExperiencePosts();
    unsubscribeExperiencePosts = null;
  }

  unsubscribeExperiencePosts = subscribeToEventExperiencePosts(
    id,
    userStore.userProfile?.uid,
    (nextPosts) => {
      experiencePosts.value = nextPosts;
    },
    (error) => {
      console.error('Failed to load experience posts:', error);
      experienceError.value = 'Failed to load experience posts.';
    }
  );
};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to join the event conversation.'
    }
  });
};

// Handle image loading errors
const handleImageError = (event: any) => {
  const target = event.target as HTMLImageElement;
  target.src = '/images/wavingdog.jpg';
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

const scheduleDetails = computed(() => {
  const fallback = formattedTime.value || 'Schedule TBD';
  const lines = fallback.split('\n').map((line) => line.trim()).filter(Boolean);
  const getValue = (label: string) => {
    const match = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.split(':').slice(1).join(':').trim() : '';
  };

  const startDate = getValue('Start Date');
  const endDate = getValue('End Date');
  const time = getValue('Time');

  if (startDate || endDate || time) {
    return {
      primary: startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'Schedule TBD',
      secondary: time || lines.find((line) => line.toLowerCase().startsWith('repeats:'))?.replace(/^Repeats:\s*/i, '') || 'Time TBD',
    };
  }

  if (fallback.includes(' - ')) {
    const [primary, ...rest] = fallback.split(' - ');
    return {
      primary: primary.trim(),
      secondary: rest.join(' - ').trim() || 'Time TBD',
    };
  }

  return {
    primary: fallback,
    secondary: 'Time TBD',
  };
});

const schedulePrimary = computed(() => scheduleDetails.value.primary);
const scheduleSecondary = computed(() => scheduleDetails.value.secondary);

const locationPrimary = computed(() => {
  const location = event.value?.location?.trim();
  if (!location) return 'Location TBD';
  return location.split(',')[0]?.trim() || location;
});

const locationSecondary = computed(() => {
  const location = event.value?.location?.trim();
  if (!location) return 'Details to be announced';
  const [, ...rest] = location.split(',');
  return rest.join(',').trim() || location;
});

const openRegistration = () => {
  if (!event.value?.link) return;
  window.open(event.value.link, '_blank', 'noopener,noreferrer');
};

const toggleSavedEvent = async () => {
  if (!event.value?.id) return;
  if (!userStore.isLoggedIn || !userStore.userProfile?.uid) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to save events.',
      },
    });
    return;
  }

  isSavingEvent.value = true;
  try {
    const currentSaved = userStore.userProfile.savedEventIds ?? [];
    const nextSaved = isSavedEvent.value
      ? currentSaved.filter((id) => id !== event.value?.id)
      : [...new Set([...currentSaved, event.value.id])];

    await userStore.updateUserProfile({ savedEventIds: nextSaved });
  } catch (error) {
    console.error('Failed to update saved event:', error);
  } finally {
    isSavingEvent.value = false;
  }
};

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

const submitExperiencePost = async (text: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.email || !text || !eventId) return;

  isPostingExperience.value = true;
  experienceError.value = '';

  try {
    await createEventExperiencePost(
      eventId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
  } catch (error) {
    console.error('Failed to post experience:', error);
    experienceError.value = 'Failed to share experience. Please try again.';
  } finally {
    isPostingExperience.value = false;
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

const toggleExperienceLike = async (postId: string) => {
  const eventId = route.params.id as string;
  if (!userStore.userProfile?.uid || !eventId) return;

  try {
    await toggleExperiencePostLike(eventId, postId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle experience like:', error);
  }
};

const scrollToForum = () => {
  if (!route.query.postId && route.query.section !== 'forum' && route.query.section !== 'comments') return;
  if (route.query.section === 'comments') {
    commentsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  experienceSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

watch(
  () => route.params.id as string,
  (id) => {
    if (id) {
      subscribePosts(id);
      subscribeExperiencePosts(id);
    }
  },
  { immediate: true }
);

watch(() => userStore.userProfile?.uid, () => {
  const id = route.params.id as string;
  if (id) {
    subscribePosts(id);
    subscribeExperiencePosts(id);
  }
});

watch(() => route.query, () => {
  scrollToForum();
});

onBeforeUnmount(() => {
  if (unsubscribePosts) unsubscribePosts();
  if (unsubscribeExperiencePosts) unsubscribeExperiencePosts();
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

.event-hero-card {
  display: flex;
  align-items: stretch;
  gap: 30px;
  width: 100%;
  margin-bottom: 16px;
  padding: 22px;
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.event-hero-image-wrap {
  position: relative;
  flex: 0 0 49%;
  min-height: 354px;
  overflow: hidden;
  border-radius: 14px;
  background: #f8fafc;
}

.event-hero-image {
  width: 100%;
  height: 100%;
  min-height: 354px;
  object-fit: cover;
  display: block;
}

.event-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: calc(100% - 32px);
}

.category-badge,
.tag-badge {
  display: inline-flex;
  align-items: center;
  max-width: 170px;
  min-height: 24px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badge {
  color: #fff;
  text-transform: uppercase;
  background: #6c48d1;
  letter-spacing: 0.02em;
}

.tag-badge {
  color: #344054;
  background: #f1f5f9;
}

.event-hero-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 0 0 2px;
}

.event-title {
  margin: 0;
  color: #0f172a;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.event-summary {
  margin: 12px 0 24px;
  color: #667085;
  font-size: 18px;
  line-height: 1.45;
}

.logistics-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 36px;
}

.logistic-card {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 14px;
  border: 1px solid rgba(108, 72, 209, 0.16);
  border-radius: 14px;
  background: rgba(108, 72, 209, 0.07);
}

.logistic-icon {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #6c48d1;
  border-radius: 10px;
}

.logistic-copy {
  min-width: 0;
}

.logistic-label,
.logistic-primary,
.logistic-secondary {
  margin: 0;
}

.logistic-label {
  color: #6c48d1;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.logistic-primary {
  color: #101828;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logistic-secondary {
  margin-top: 2px;
  color: #475467;
  font-size: 11px;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.register-button,
.download-button,
.save-button {
  border: 0;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.register-button {
  min-height: 50px;
  padding: 0 30px;
  color: #fff;
  background: #6c48d1;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;
  box-shadow: 0 10px 18px rgba(108, 72, 209, 0.24);
}

.register-button:hover {
  background: #5d3fc0;
}

.register-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.download-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475467;
  border: 1px solid #e4e7ec;
  border-radius: 999px;
  background: #fff;
}

.download-button:hover {
  background: #f8fafc;
}

.save-button {
  min-height: 50px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 0 22px;
  color: #6c48d1;
  border-radius: 999px;
  background: rgba(108, 72, 209, 0.1);
  font-size: 16px;
  font-weight: 800;
}

.save-button.saved {
  background: rgba(108, 72, 209, 0.12);
}

.save-button:hover {
  background: rgba(108, 72, 209, 0.18);
}

.save-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.register-button:active,
.download-button:active,
.save-button:active {
  transform: scale(0.97);
}

.forum-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1.5px solid #333;
}

.ratings-review-card {
  margin-top: 16px;
  padding: 24px 20px;
  color: #fff;
  background: #6841c9;
  border-radius: 28px;
  box-shadow: 0 18px 34px rgba(108, 72, 209, 0.22);
}

.ratings-review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.ratings-review-title {
  margin: 0;
  color: #fff;
  font-size: 25px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.ratings-review-score {
  display: flex;
  align-items: baseline;
  gap: 4px;
  color: rgba(255, 255, 255, 0.58);
  line-height: 1;
  white-space: nowrap;
}

.ratings-review-score strong {
  color: #fff;
  font-size: 34px;
  font-weight: 900;
  line-height: 0.95;
}

.ratings-review-score span {
  font-size: 20px;
  font-weight: 800;
}

.ratings-review-summary {
  display: flex;
  align-items: center;
  margin-bottom: 0;
}

.ratings-stars {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ffd51f;
  font-size: 25px;
  line-height: 1;
}

.ratings-stars .muted {
  color: #b68f8c;
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

.comments-card {
  padding: 22px 18px;
  border: 1px solid #e8eaf0;
  border-radius: 28px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.comments-card .forum-header {
  margin-bottom: 18px;
}

.comments-card .section-title {
  color: #111827;
  font-size: 19px !important;
  font-weight: 800;
  line-height: 1.1;
}

.comments-card .forum-count {
  color: #9ca3af;
  font-size: 11px !important;
  font-weight: 800;
  white-space: nowrap;
}

.comment-input-row {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  margin-bottom: 22px;
}

.comment-current-avatar {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6c48d1;
  background: #f6f2ff;
  border: 1px solid #ded6ff;
  border-radius: 999px;
  font-size: 11px !important;
  font-weight: 700;
}

.comment-input-row :deep(.reply-input) {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
}

.comment-input-row :deep(.reply-input.compact .reply-textarea) {
  flex: 1;
  width: 100%;
  min-height: 34px !important;
  height: 34px !important;
  box-sizing: border-box;
  resize: none;
  overflow: hidden;
  border: 1px solid #edf0f4;
  border-radius: 999px;
  padding: 7px 32px 7px 14px;
  color: #6b7280;
  background: #f8fafc;
  font-size: 11px !important;
  line-height: 18px;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.01);
}

.comment-input-row :deep(.reply-textarea::placeholder) {
  color: #6b7280;
}

.comment-input-row :deep(.reply-submit) {
  position: absolute;
  right: 5px;
  top: 50%;
  width: 22px;
  height: 22px;
  min-height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateY(-50%);
  padding: 0;
  border-radius: 999px;
  background: #6c48d1;
  color: #fff;
  font-size: 0;
}

.comment-input-row :deep(.reply-submit::before) {
  content: '➜';
  font-size: 11px !important;
  line-height: 1;
}

.comments-card .forum-list {
  gap: 18px;
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

.event-hero-card + .description-card {
  margin-top: 0;
}

.section-title {
  font-size: 18px;
  font-weight: 300;
  color: #333;
  margin: 0 0 16px 0;
}

.forum-header .section-title {
  margin-bottom: 0;
}

.section-helper {
  margin: 4px 0 0;
  color: #666;
  font-size: 12px;
  line-height: 1.45;
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

  .event-hero-card {
    flex-direction: column;
    gap: 18px;
    padding: 12px;
    border-radius: 20px;
  }

  .event-hero-image-wrap {
    flex-basis: auto;
    min-height: 240px;
    aspect-ratio: 4 / 3;
  }

  .event-hero-image {
    min-height: 240px;
  }
  
  .event-title {
    font-size: 28px;
  }

  .event-summary {
    margin-bottom: 18px;
    font-size: 15px;
  }

  .logistics-grid {
    grid-template-columns: 1fr;
    margin-bottom: 22px;
  }

  .register-button,
  .save-button {
    flex: 1 1 auto;
    justify-content: center;
    padding-inline: 18px;
  }

  .ratings-review-card {
    padding: 22px 18px;
  }

  .ratings-review-header {
    gap: 12px;
  }

  .ratings-review-title {
    font-size: 22px;
  }

  .ratings-review-score strong {
    font-size: 31px;
  }

  .ratings-review-score span {
    font-size: 17px;
  }

  .ratings-stars {
    font-size: 23px;
  }

}
</style>
