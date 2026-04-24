<template>
  <div class="forum-page">
    <section class="toolbar">
      <label class="search-field">
        <span class="sr-only">Search forum posts</span>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Search posts or event titles"
        />
      </label>

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

        <router-link to="/events" class="start-discussion-button">
          Start a Discussion
        </router-link>
      </div>
    </section>

    <section class="forum-content">
      <div v-if="isLoading" class="state-card">
        <h2>Loading forum posts...</h2>
        <p>Pulling the latest event discussions into one feed.</p>
      </div>

      <div v-else-if="errorMessage" class="state-card state-card-error">
        <h2>Couldn’t load the forum</h2>
        <p>{{ errorMessage }}</p>
      </div>

      <div v-else-if="allPosts.length === 0" class="state-card">
        <h2>No forum posts yet</h2>
        <p>Join an event discussion to be the first to post.</p>
      </div>

      <div v-else-if="filteredPosts.length === 0" class="state-card">
        <h2>No matching posts</h2>
        <p>Try a different search or switch back to a broader filter.</p>
      </div>

      <div v-else class="post-list">
        <ForumPostCard
          v-for="post in filteredPosts"
          :key="post.id"
          :post="post"
          :is-logged-in="userStore.isLoggedIn"
          :show-event-context="true"
          :reply-preview-count="2"
          :on-login="goToLogin"
          :on-toggle-post-like="togglePostLike"
          :on-toggle-reply-like="toggleReplyLike"
          :on-submit-reply="submitReply"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ForumPostCard from '../components/ForumPostCard.vue';
import {
  createDiscussionReply,
  listAggregatedDiscussionPosts,
  toggleDiscussionPostLike,
  toggleDiscussionReplyLike,
} from '../api/forums';
import type { AggregatedDiscussionPost } from '../types/forum';
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
const allPosts = ref<AggregatedDiscussionPost[]>([]);
const searchQuery = ref('');
const activeSort = ref<ForumSort>('recommended');

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

    allPosts.value = await listAggregatedDiscussionPosts(
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
      prompt: 'Please log in to join the discussion.'
    }
  });
};

const getTimestampMs = (value: AggregatedDiscussionPost['createdAt']) => {
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

const submitReply = async (postId: string, text: string) => {
  if (!userStore.userProfile?.email) return;

  const post = allPosts.value.find((item) => item.id === postId);
  if (!post) return;

  try {
    await createDiscussionReply(
      post.eventId,
      postId,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
        displayName: userStore.userProfile.displayName,
      },
      text
    );
    await loadForumPosts();
  } catch (error) {
    console.error('Failed to create reply:', error);
  }
};

const togglePostLike = async (postId: string) => {
  if (!userStore.userProfile?.uid) return;

  const post = allPosts.value.find((item) => item.id === postId);
  if (!post) return;

  try {
    await toggleDiscussionPostLike(post.eventId, postId, userStore.userProfile.uid);
    await loadForumPosts();
  } catch (error) {
    console.error('Failed to toggle post like:', error);
  }
};

const toggleReplyLike = async (postId: string, replyId: string) => {
  if (!userStore.userProfile?.uid) return;

  const post = allPosts.value.find((item) => item.id === postId);
  if (!post) return;

  try {
    await toggleDiscussionReplyLike(post.eventId, postId, replyId, userStore.userProfile.uid);
    await loadForumPosts();
  } catch (error) {
    console.error('Failed to toggle reply like:', error);
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
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 30%),
    radial-gradient(circle at bottom right, rgba(173, 138, 230, 0.12), transparent 24%),
    linear-gradient(180deg, #fbfbff 0%, #f7f7fc 100%);
}

.toolbar,
.forum-content {
  max-width: 1100px;
  margin: 0 auto;
}

.toolbar {
  padding-top: 28px;
  display: grid;
  gap: 16px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
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
}

.search-field input {
  width: 100%;
  border: 1px solid rgba(108, 99, 255, 0.12);
  border-radius: 18px;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.88);
  font: inherit;
  color: #20263a;
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
  margin-top: 24px;
}

.post-list {
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
  }

  .toolbar-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
