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
          <div class="event-badges">
            <span class="category-badge">{{ primaryBadge }}</span>
            <span v-if="secondaryBadge" class="tag-badge">#{{ secondaryBadge }}</span>
          </div>
        </div>

        <div class="event-info-card">
          <div class="event-info-header">
            <h1 class="event-title">{{ event.title }}</h1>
            <p v-if="descriptionSummary" class="event-summary">{{ descriptionSummary }}</p>
          </div>

          <div class="event-logistics-grid">
            <div class="logistic-card">
              <div class="logistic-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div class="logistic-copy">
                <span class="logistic-label">When</span>
                <span class="logistic-primary">{{ schedulePrimary }}</span>
                <span class="logistic-secondary">{{ scheduleSecondary }}</span>
              </div>
            </div>

            <div class="logistic-card">
              <div class="logistic-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="logistic-copy">
                <span class="logistic-label">Where</span>
                <span class="logistic-primary">{{ locationPrimary }}</span>
                <span class="logistic-secondary">{{ locationSecondary }}</span>
              </div>
            </div>
          </div>

          <div class="event-actions">
            <button
              class="register-button"
              type="button"
              :disabled="!event.link"
              @click="openRegistration"
            >
              Register Now
            </button>
            <button
              class="download-button"
              type="button"
              aria-label="Download calendar (.ics)"
              title="Download calendar (.ics)"
              @click="downloadIcs(event)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="17" rx="2"></rect>
                <path d="M16 2v4"></path>
                <path d="M8 2v4"></path>
                <path d="M3 10h18"></path>
                <path d="M12 13v5"></path>
                <path d="m9 16 3 3 3-3"></path>
              </svg>
            </button>
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
              <span>{{ isSavedEvent ? 'Saved' : 'Save' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="event-content-layout">
        <div class="event-main-column">
          <div class="description-card">
            <h2 class="section-title">About this event</h2>
            <p class="event-description" v-html="formatDescription(event.description || '')"></p>
          </div>

          <div id="forum-section" ref="experienceSectionRef" class="experience-sharing-card">
            <div class="experience-sharing-header">
              <div>
                <h2 class="section-title">Experience Sharing</h2>
                <p class="section-helper">Share a longer review, recap, or experience from this event.</p>
              </div>
              <span class="forum-count">{{ experiencePosts.length }} posts</span>
            </div>

            <ReplyInput
              :is-logged-in="userStore.isLoggedIn"
              :loading="isPostingExperience"
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

          <div class="map-card">
            <div class="section-header-row">
              <h2 class="section-title">Location</h2>
              <a
                v-if="event.location"
                class="map-open-link"
                :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in Maps →
              </a>
            </div>
            <div class="google-map" ref="mapContainer"></div>
          </div>
        </div>

        <aside class="event-side-column">
          <div class="ratings-review-card">
            <div class="ratings-review-header">
              <h2 class="ratings-review-title">Ratings &amp; Reviews</h2>
              <div class="ratings-review-score">
                <strong>{{ reviewDisplay.starsText }}</strong>
                <span>/ 5</span>
              </div>
            </div>

            <div class="ratings-review-summary">
              <div class="ratings-stars" :aria-label="`${reviewDisplay.starsText} out of 5 stars`">
                <span
                  v-for="star in 5"
                  :key="star"
                  :class="{ muted: star > reviewDisplay.fullStars }"
                >★</span>
              </div>
            </div>
            <div class="ratings-review-detail">
              <p>{{ reviewDisplay.sentence }}</p>
            </div>
            <router-link class="score-framework-link" to="/score-framework">
              How We Assign This Score?
            </router-link>
          </div>

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
        </aside>
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
import type { DiscussionPost, ExperiencePost } from '../types/forum';
import ExperiencePostCard from '../components/ExperiencePostCard.vue';
import ForumPostCard from '../components/ForumPostCard.vue';
import ReplyInput from '../components/ReplyInput.vue';
import { loadGoogleMaps } from '../utils/googleMaps';
import { downloadIcs } from '../utils/icsUtils';
import { addEventToGoogleCalendar } from '../utils/googleCalendar';
import {
  createDiscussionReply,
  createEventDiscussionPost,
  createEventExperiencePost,
  subscribeToEventDiscussionPosts,
  subscribeToEventExperiencePosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
  toggleExperiencePostLike,
} from '../api/forums';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();

const eventId = computed(() => route.params.id as string);
const event = ref<Event | null>(null);
const mapContainer = ref<HTMLElement | null>(null);
const commentsSectionRef = ref<HTMLElement | null>(null);
const experienceSectionRef = ref<HTMLElement | null>(null);
const posts = ref<DiscussionPost[]>([]);
const experiencePosts = ref<ExperiencePost[]>([]);
const isPosting = ref(false);
const isPostingExperience = ref(false);
const isSavingEvent = ref(false);
const isAddingToGoogleCalendar = ref(false);
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

const descriptionSummary = computed(() => {
  const raw = event.value?.description?.trim();
  if (!raw) return '';
  const plain = raw.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
  const firstLine = plain.split(/\n+/).find(line => line.trim().length > 0);
  const summary = (firstLine ?? plain).trim();
  return summary.length > 124 ? `${summary.slice(0, 121).trim()}...` : summary;
});

const primaryBadge = computed(() => event.value?.category?.trim() || 'Academic');

const secondaryBadge = computed(() => {
  const tags = event.value?.tags ?? [];
  return tags.find(tag => tag && tag.trim())?.trim() || '';
});

const reviewDisplay = computed(() => {
  const review = event.value?.review;
  const stars = typeof review?.stars === 'number'
    ? Math.min(5, Math.max(0, Math.round(review.stars)))
    : 0;
  const score = typeof review?.score === 'number'
    ? Math.min(5, Math.max(0, review.score))
    : 0;
  const sentence = review?.sentence?.trim() || 'Review details coming soon';

  return {
    starsText: score > 0 ? score.toFixed(1) : '--',
    fullStars: stars,
    sentence,
  };
});

const scheduleDetails = computed(() => {
  if (!event.value) {
    return {
      primary: 'Schedule TBD',
      secondary: 'Time TBD',
    };
  }

  const fallback = formatEventSchedule(event.value) || 'Schedule TBD';
  const lines = fallback.split('\n').map(line => line.trim()).filter(Boolean);
  const getValue = (label: string) => {
    const match = lines.find(line => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    return match ? match.split(':').slice(1).join(':').trim() : '';
  };

  const startDate = getValue('Start Date');
  const endDate = getValue('End Date');
  const time = getValue('Time');
  const repeats = getValue('Repeats');

  if (startDate || endDate || time || repeats) {
    return {
      primary: startDate && endDate ? `${startDate} - ${endDate}` : startDate || endDate || 'Schedule TBD',
      secondary: time || repeats || 'Time TBD',
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
      prompt: 'Please log in to join the event conversation.'
    }
  });
};

const openRegistration = () => {
  if (!event.value?.link) return;
  window.open(event.value.link, '_blank', 'noopener,noreferrer');
};

const addToGoogleCalendar = async () => {
  if (!userStore.isLoggedIn) {
    router.push({
      path: '/login',
      query: {
        redirect: route.fullPath,
        prompt: 'Please log in to add events to your Google Calendar.',
      },
    });
    return;
  }

  if (!event.value || isAddingToGoogleCalendar.value) {
    return;
  }

  isAddingToGoogleCalendar.value = true;

  try {
    const created = await addEventToGoogleCalendar(event.value);
    if (created.htmlLink) {
      window.open(created.htmlLink, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Failed to add event to Google Calendar:', error);
    const message = error instanceof Error
      ? error.message
      : 'Unable to add this event to Google Calendar.';
    window.alert(message);
  } finally {
    isAddingToGoogleCalendar.value = false;
  }
};

defineExpose({
  addToGoogleCalendar,
});

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

const submitExperiencePost = async (text: string) => {
  if (!userStore.userProfile?.email || !eventId.value) return;

  isPostingExperience.value = true;
  experienceError.value = '';

  try {
    await createEventExperiencePost(
      eventId.value,
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

const toggleExperienceLike = async (postId: string) => {
  if (!userStore.userProfile?.uid || !eventId.value) return;

  try {
    await toggleExperiencePostLike(eventId.value, postId, userStore.userProfile.uid);
  } catch (error) {
    console.error('Failed to toggle experience like:', error);
  }
};

const scrollToForum = async () => {
  if (!route.query.postId && route.query.section !== 'forum' && route.query.section !== 'comments') return;
  await nextTick();
  if (route.query.section === 'comments') {
    commentsSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  experienceSectionRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  if (id) {
    subscribePosts(id);
    subscribeExperiencePosts(id);
  }
}, { immediate: true });

watch(() => userStore.userProfile?.uid, () => {
  if (eventId.value) {
    subscribePosts(eventId.value);
    subscribeExperiencePosts(eventId.value);
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
  display: flex;
  align-items: stretch;
  gap: 30px;
  margin-top: -68px;
  margin-bottom: var(--spacing-2xl);
  padding: 22px;
  background: var(--color-white);
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.event-image-card {
  position: relative;
  flex: 0 0 35%;
  min-height: 354px;
  overflow: hidden;
  border-radius: 14px;
  background: var(--color-gray-50);
}

.event-image {
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
  color: var(--color-white);
  text-transform: uppercase;
  background: #6c48d1;
  letter-spacing: 0.02em;
}

.tag-badge {
  color: #344054;
  background: #f1f5f9;
}

.event-info-card {
  position: relative;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 64px 0 2px;
}

.event-info-header {
  display: flex;
  flex-direction: column;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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

.event-logistics-grid {
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
  color: var(--color-white);
  background: #6c48d1;
  border-radius: 10px;
}

.logistic-icon svg {
  width: 20px;
  height: 20px;
}

.logistic-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
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
.save-event-button {
  border: 0;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.register-button {
  min-height: 50px;
  padding: 0 30px;
  color: var(--color-white);
  background: #6c48d1;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;
  box-shadow: 0 10px 18px rgba(108, 72, 209, 0.24);
}

.register-button:hover:not(:disabled) {
  background: #5d3fc0;
}

.register-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.download-button {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #475467;
  border: 1px solid #e4e7ec;
  border-radius: 999px;
  background: var(--color-white);
}

.download-button:hover {
  background: #f8fafc;
}

.download-button svg,
.save-event-button svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.save-event-button {
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
  white-space: nowrap;
}

.save-event-button:hover:not(:disabled) {
  background: rgba(108, 72, 209, 0.18);
}

.save-event-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.save-event-button.saved {
  background: rgba(108, 72, 209, 0.12);
  color: #6c48d1;
}

.register-button:active,
.download-button:active,
.save-event-button:active {
  transform: scale(0.97);
}

.event-content-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 0.95fr);
  gap: 30px;
  align-items: start;
}

.event-main-column,
.event-side-column {
  min-width: 0;
}

.event-main-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.event-side-column {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.description-card,
.review-card,
.map-card,
.comments-card {
  background: var(--color-white);
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  padding: var(--spacing-2xl);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.section-title {
  position: relative;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0 0 var(--spacing-lg) 0;
  padding-left: 20px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.16em;
  width: 6px;
  height: 1.15em;
  border-radius: 999px;
  background: #6c48d1;
}

.forum-header .section-title {
  margin-bottom: 0;
}

.forum-header .section-title::before {
  display: none;
}

.comments-card .section-title {
  padding-left: 0;
}

.comments-card .section-title::before {
  display: none;
}

.comments-card {
  padding: 22px;
  border: 1px solid #e8eaf0;
  border-radius: 28px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
}

.comments-card .forum-header {
  margin-bottom: 18px;
}

.comments-card .section-title {
  color: #111827;
  font-size: 23px !important;
  font-weight: 800;
  line-height: 1.1;
}

.comments-card .forum-count {
  color: #9ca3af;
  font-size: 13px !important;
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
  font-size: 13px !important;
  font-weight: 700;
}

.comment-input-row :deep(.reply-input) {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  --reply-textarea-font-size: 13px;
  --reply-textarea-line-height: 18px;
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
  font-size: 13px !important;
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
  background: #6c48d1;
  border-radius: 999px;
  color: #fff;
  font-size: 0;
}

.comment-input-row :deep(.reply-submit::before) {
  content: '➜';
  font-size: 13px !important;
  line-height: 1;
}

.comments-card .forum-list {
  gap: 18px;
}

.experience-sharing-card {
  background: #fff;
  border: 1px solid #e8eaf0;
  border-radius: 24px;
  padding: 48px 56px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.experience-sharing-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.experience-sharing-card .section-title {
  margin-bottom: 8px;
  padding-left: 0;
  color: #111827;
  font-size: 32px;
  font-weight: 800;
  line-height: 1.1;
}

.experience-sharing-card .section-title::before {
  display: none;
}

.experience-sharing-card .section-helper {
  margin: 0;
  color: #6b7280;
  font-size: 18px;
  line-height: 1.45;
}

.experience-sharing-card .forum-count {
  margin-top: 24px;
  color: #6b7280;
  font-size: 18px;
  white-space: nowrap;
}

.experience-sharing-card :deep(.reply-input) {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 16px;
}

.experience-sharing-card :deep(.reply-textarea) {
  min-height: 174px;
  border: 1px solid #ddd9ff;
  border-radius: 14px;
  padding: 18px;
  color: #4b5563;
  background: #fff;
  font-size: 18px;
  line-height: 1.45;
}

.experience-sharing-card :deep(.reply-textarea::placeholder) {
  color: #9ca3af;
}

.experience-sharing-card :deep(.reply-submit) {
  min-height: 50px;
  margin-top: 0;
  padding: 0 26px;
  border-radius: 12px;
  background: #9ca3af;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
}

.experience-sharing-card .forum-empty {
  margin-top: 6px;
  color: #6b7280;
  font-size: 18px;
}

.experience-sharing-card .forum-list {
  margin-top: 24px;
  gap: 16px;
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.section-header-row .section-title {
  margin-bottom: 0;
}

.map-open-link {
  color: #5d2fd6;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  white-space: nowrap;
}

.section-helper {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.event-description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.review-header .section-title {
  margin-bottom: 0;
}

.review-status {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  color: #6c48d1;
  background: rgba(108, 72, 209, 0.1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  white-space: nowrap;
}

.review-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.review-metric {
  min-height: 128px;
  padding: var(--spacing-xl);
  border: 1px solid rgba(108, 72, 209, 0.14);
  border-radius: 18px;
  background: rgba(108, 72, 209, 0.05);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.ratings-review-card {
  padding: 20px;
  color: #fff;
  background: #6841c9;
  border-radius: 24px;
  box-shadow: 0 18px 34px rgba(108, 72, 209, 0.22);
}

.ratings-review-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 22px;
}

.ratings-review-title {
  margin: 0;
  color: #fff;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: 0;
}

.ratings-review-score {
  display: flex;
  align-items: baseline;
  gap: 5px;
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
  font-size: 19px;
  font-weight: 800;
}

.ratings-review-summary {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.ratings-stars {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #ffd51f;
  font-size: 23px;
  line-height: 1;
}

.ratings-stars .muted {
  color: #b68f8c;
}

.ratings-review-detail {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.78);
}

.ratings-review-detail p {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.score-framework-link {
  min-height: 34px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 999px;
  color: #6c48d1;
  background: #fff;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.metric-label {
  color: #6c48d1;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.review-metric strong {
  margin-top: 8px;
  color: #0f172a;
  font-size: 42px;
  line-height: 1;
}

.metric-helper {
  margin-top: 8px;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
}

.google-map {
  width: 100%;
  height: 320px;
  border-radius: 16px;
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
    flex-direction: column;
    margin-top: 0;
  }

  .event-image-card {
    flex-basis: auto;
    aspect-ratio: 4 / 3;
  }

  .event-info-card {
    padding: 0;
  }

  .event-content-layout {
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

  .event-header-section {
    padding: 14px;
    border-radius: 20px;
  }

  .event-logistics-grid {
    grid-template-columns: 1fr;
    margin-bottom: 24px;
  }

  .event-title {
    font-size: 28px;
  }

  .event-summary {
    font-size: 15px;
  }

  .register-button,
  .save-event-button {
    flex: 1 1 auto;
    justify-content: center;
  }

  .download-button {
    position: static;
  }

  .review-metrics {
    grid-template-columns: 1fr;
  }

  .experience-sharing-card {
    padding: 28px;
  }

  .experience-sharing-card :deep(.reply-input) {
    grid-template-columns: 1fr;
  }

  .experience-sharing-card :deep(.reply-submit) {
    width: 100%;
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
