<template>
  <div class="forum-page">
    <section class="toolbar">
      <div class="search-field">
        <span class="sr-only">Search forum posts</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search posts or event titles"
        />
        <button type="button" class="search-action" aria-label="Search forum posts">
          <svg viewBox="0 0 24 24" fill="none" class="search-icon" aria-hidden="true">
            <path
              d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm9 3-4.35-4.35"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>

      <div class="toolbar-row">
        <div class="filter-tabs" role="tablist" aria-label="Forum post sorting options">
          <button
            v-for="tab in sortTabs"
            :key="tab.value"
            type="button"
            :class="['filter-tab', { active: activeSort === tab.value }]"
            @click="activeSort = tab.value"
          >
            {{ tab.label }}
          </button>
        </div>

        <router-link to="/forum/new" class="start-discussion-button">
          Share an Experience
        </router-link>
      </div>
    </section>

    <section class="forum-content">
      <div v-if="isLoading" class="state-card">
        <h2>Loading forum posts...</h2>
        <p>Pulling the latest event experiences into one feed.</p>
      </div>

      <div v-else-if="errorMessage" class="state-card state-card-error">
        <h2>Couldn’t load the forum</h2>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="allPosts.length === 0" class="state-card">
        <h2>No forum posts yet</h2>
        <p>Open an event and share the first longer recap or review.</p>
      </div>

      <div v-else-if="filteredPosts.length === 0" class="state-card">
        <h2>No matching posts</h2>
        <p>Try a different search or switch back to a broader filter.</p>
      </div>

      <div v-else class="post-list">
        <ExperiencePostCard
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          :is-logged-in="userStore.isLoggedIn"
          :show-event-context="true"
          :on-login="goToLogin"
          :on-toggle-like="togglePostLike"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ExperiencePostCard from '../components/ExperiencePostCard.vue';
import {
  listAggregatedExperiencePosts,
  toggleExperiencePostLike,
} from '../api/forums';
import type { AggregatedExperiencePost } from '../types/forum';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';

type ForumSort = 'recommended' | 'latest' | 'oldest';

const sortTabs: Array<{ label: string; value: ForumSort }> = [
  { label: 'Recommended', value: 'recommended' },
  { label: 'Latest', value: 'latest' },
  { label: 'Oldest', value: 'oldest' },
];

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();
const isLoading = ref(true);
const errorMessage = ref('');
const allPosts = ref<AggregatedExperiencePost[]>([]);
const searchQuery = ref('');
const activeSort = ref<ForumSort>('recommended');
const pendingLikePostIds = ref(new Set<string>());

const filteredPosts = computed(() => {
  const normalizedSearch = searchQuery.value.trim().toLowerCase();

  const matchingPosts = allPosts.value.filter((post) => {
    const fallbackTitle = post.title?.trim()
      ? post.title.trim()
      : post.content.replace(/\s+/g, ' ').trim().slice(0, 52).trimEnd();
    const matchesSearch = !normalizedSearch ||
      post.content.toLowerCase().includes(normalizedSearch) ||
      post.eventTitle.toLowerCase().includes(normalizedSearch) ||
      fallbackTitle.toLowerCase().includes(normalizedSearch);

    return matchesSearch;
  });

  if (activeSort.value === 'latest') {
    return [...matchingPosts].sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
  }

  if (activeSort.value === 'oldest') {
    return [...matchingPosts].sort((a, b) => getTimestampMs(a.createdAt) - getTimestampMs(b.createdAt));
  }

  return matchingPosts;
});

const loadForumPosts = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }

    allPosts.value = await listAggregatedExperiencePosts(
      eventStore.events,
      userStore.userProfile?.uid
    );
  } catch (error) {
    console.error('Failed to load forum page:', error);
    errorMessage.value = 'Please try refreshing the page in a moment.';
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: {
      redirect: route.fullPath,
      prompt: 'Please log in to like forum posts.'
    }
  });
};

const getTimestampMs = (value: AggregatedExperiencePost['createdAt']) => {
  if (!value) return 0;

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    typeof (value as { seconds?: number }).seconds === 'number'
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  const parsed = new Date(value as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const togglePostLike = async (postId: string) => {
  const profile = userStore.userProfile;
  if (!profile?.uid) return;
  if (pendingLikePostIds.value.has(postId)) return;

  const post = allPosts.value.find((item) => item.id === postId);
  if (!post) return;

  const previousHasLiked = Boolean(post.hasLiked);
  const previousLikeCount = post.likeCount || 0;
  const nextHasLiked = !previousHasLiked;
  const nextLikeCount = Math.max(0, previousLikeCount + (nextHasLiked ? 1 : -1));

  pendingLikePostIds.value.add(postId);
  allPosts.value = allPosts.value.map((item) => (
    item.id === postId
      ? { ...item, hasLiked: nextHasLiked, likeCount: nextLikeCount }
      : item
  ));

  try {
    await toggleExperiencePostLike(post.eventId, postId, {
      uid: profile.uid,
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
    });
  } catch (error) {
    console.error('Failed to toggle post like:', error);
    allPosts.value = allPosts.value.map((item) => (
      item.id === postId
        ? { ...item, hasLiked: previousHasLiked, likeCount: previousLikeCount }
        : item
    ));
  } finally {
    pendingLikePostIds.value.delete(postId);
  }
};

onMounted(() => {
  loadForumPosts();
});

watch(() => userStore.userProfile?.uid, () => {
  loadForumPosts();
});
</script>

<style scoped>
.forum-page {
  min-height: calc(100vh - var(--navbar-height));
  padding: 0 var(--spacing-3xl) var(--spacing-4xl);
  background-color: var(--color-white);
}

.toolbar,
.forum-content {
  max-width: 1100px;
  margin: 0 auto;
  width: 100%;
}

.toolbar {
  padding-top: 28px;
  display: grid;
  gap: 24px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  width: 100%;
}

.start-discussion-button,
.discussion-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 12px 18px;
  text-decoration: none;
  font-weight: 700;
}

.start-discussion-button {
  background: #1f2740;
  color: #fff;
  box-shadow: 0 12px 28px rgba(108, 99, 255, 0.18);
  margin-left: auto;
}

.search-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.75rem 0.65rem 1.2rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.search-field input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: var(--color-gray-700);
  font: inherit;
  font-size: 1rem;
  outline: none;
}

.search-field input::placeholder {
  color: var(--color-gray-400);
}

.search-action {
  width: 50px;
  height: 50px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--color-primary) 0%, #7c73ff 100%);
  color: var(--color-white);
  box-shadow: 0 10px 24px rgba(99, 102, 241, 0.3);
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.search-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(99, 102, 241, 0.35);
}

.search-icon {
  width: 20px;
  height: 20px;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-tab {
  border: 1px solid rgba(108, 99, 255, 0.14);
  background: rgba(255, 255, 255, 0.82);
  color: #58627e;
  border-radius: 999px;
  padding: 10px 16px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.filter-tab.active {
  background: #1f2740;
  color: #fff;
  border-color: #1f2740;
}

.forum-content {
  margin-top: 28px;
}

.post-list {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.state-card {
  border-radius: 24px;
  border: 1px solid rgba(108, 99, 255, 0.08);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16px 40px rgba(31, 39, 64, 0.06);
}

.state-card {
  padding: 36px 28px;
  text-align: center;
}

.state-card h2 {
  margin: 0 0 8px;
  color: #20263a;
}

.state-card p {
  margin: 0;
  color: #5e6783;
}

.state-card-error {
  border-color: rgba(176, 44, 44, 0.18);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 900px) {
  .forum-page {
    padding: 0 16px 40px;
  }

  .toolbar {
    padding-top: 20px;
    gap: 20px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }

  .start-discussion-button {
    margin-left: 0;
  }

  .search-field {
    gap: 0.5rem;
    padding: 0.55rem 0.55rem 0.55rem 0.9rem;
  }

  .search-field input {
    font-size: 0.95rem;
  }

  .search-action {
    width: 44px;
    height: 44px;
  }
}
</style>
