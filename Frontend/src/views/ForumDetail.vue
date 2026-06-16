<template>
  <div class="forum-detail-page">
    <div class="forum-detail-shell">
      <button class="back-button" @click="router.push('/forums')">← Forums</button>

      <div class="forum-hero">
        <div class="forum-hero-copy">
          <p class="eyebrow">Linked Discussion</p>
          <h1>{{ eventTitle }}</h1>
          <p class="forum-hero-text">{{ eventDescription }}</p>

          <div class="forum-actions">
            <button
              class="primary-action"
              :disabled="!linkedEvent"
              @click="goToEvent"
            >
              View Event
            </button>
            <span class="action-hint">
              {{ linkedEvent ? 'Jump back to the event detail page.' : 'Event document not available.' }}
            </span>
          </div>
        </div>

        <img
          :src="eventImage"
          :alt="eventTitle"
          class="forum-hero-image"
        />
      </div>

      <div class="forum-layout">
        <aside class="forum-sidebar">
          <h2>Event Reference</h2>
          <p><strong>Title</strong> {{ eventTitle }}</p>
          <p><strong>Location</strong> {{ eventLocation }}</p>
          <p><strong>Organizer</strong> {{ eventOrganizer }}</p>
          <p><strong>Status</strong> {{ linkedEvent ? 'Reachable from live event data' : 'Snapshot only' }}</p>
        </aside>

        <section class="forum-panel">
          <div class="forum-panel-header">
            <h2>Posts</h2>
            <span>{{ posts.length }} posts</span>
          </div>

          <div class="forum-input">
            <textarea
              v-model="newPost"
              class="forum-textarea"
              rows="4"
              :placeholder="userStore.isLoggedIn ? 'Share your thoughts about this event...' : 'Log in to post...'"
              :disabled="!userStore.isLoggedIn || isPosting || !linkedEvent"
            ></textarea>
            <button class="forum-submit" :disabled="!canSubmitPost" @click="submitPost">
              Post
            </button>
          </div>

          <p v-if="postError" class="forum-error">{{ postError }}</p>

          <div v-if="isLoadingPosts" class="forum-state">Loading posts...</div>
          <div v-else-if="posts.length === 0" class="forum-state">
            No posts yet. This forum is ready for the first message.
          </div>

          <div v-else class="forum-list">
            <article v-for="post in posts" :key="post.id" class="forum-post">
              <div class="forum-post-header">
                <span class="forum-post-email">{{ post.userEmail || 'Unknown user' }}</span>
                <button
                  v-if="post.userId === userStore.userProfile?.uid"
                  class="forum-post-delete"
                  type="button"
                  @click="deletePost(post.id)"
                >
                  Delete
                </button>
              </div>
              <p>{{ post.text }}</p>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { createForumPost, deleteForumPost, ensureForumForEvent, getForum, subscribeToForumPosts } from '../api/forums';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import type { Event } from '../types/event';
import type { Forum, ForumPost } from '../types/forum';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const userStore = useUserStore();

const forum = ref<Forum | null>(null);
const linkedEvent = ref<Event | null>(null);
const posts = ref<ForumPost[]>([]);
const newPost = ref('');
const postError = ref('');
const isPosting = ref(false);
const isLoadingPosts = ref(true);
let unsubscribePosts: (() => void) | null = null;

const forumId = computed(() => route.params.id as string);

const eventTitle = computed(() => {
  return linkedEvent.value?.title || forum.value?.eventTitle || 'Unknown event';
});

const eventDescription = computed(() => {
  const raw = linkedEvent.value?.description || forum.value?.eventSnapshot?.description || '';
  const plain = raw.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, ' ').trim();
  return plain || 'No description available.';
});

const eventLocation = computed(() => {
  return linkedEvent.value?.location || forum.value?.eventSnapshot?.location || 'Location TBD';
});

const eventOrganizer = computed(() => {
  return linkedEvent.value?.organizerName || forum.value?.eventSnapshot?.organizerName || 'Unknown organizer';
});

const eventImage = computed(() => {
  return linkedEvent.value?.imageUrl || forum.value?.eventSnapshot?.imageUrl || '/images/wavingdog.jpg';
});

const canSubmitPost = computed(() => {
  return Boolean(
    userStore.isLoggedIn &&
    userStore.userProfile?.email &&
    linkedEvent.value &&
    !isPosting.value &&
    newPost.value.trim()
  );
});

const subscribePosts = (id: string) => {
  if (unsubscribePosts) {
    unsubscribePosts();
    unsubscribePosts = null;
  }

  isLoadingPosts.value = true;
  unsubscribePosts = subscribeToForumPosts(
    id,
    (nextPosts) => {
      posts.value = nextPosts;
      isLoadingPosts.value = false;
    },
    (error) => {
      console.error('Failed to load forum posts:', error);
      postError.value = 'Failed to load posts.';
      isLoadingPosts.value = false;
    }
  );
};

const loadForum = async (id: string) => {
  if (!id) return;

  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }

  linkedEvent.value = eventStore.events.find((event) => event.id === id) || null;
  forum.value = await getForum(id);

  if (!forum.value && linkedEvent.value) {
    forum.value = await ensureForumForEvent(linkedEvent.value);
  }

  subscribePosts(id);
};

const submitPost = async () => {
  if (!linkedEvent.value || !userStore.userProfile?.email) return;

  isPosting.value = true;
  postError.value = '';

  try {
    await createForumPost(
      linkedEvent.value,
      {
        uid: userStore.userProfile.uid,
        email: userStore.userProfile.email,
      },
      newPost.value.trim()
    );
    forum.value = await getForum(forumId.value);
    newPost.value = '';
  } catch (error) {
    console.error('Failed to create post:', error);
    postError.value = 'Failed to post. Please try again.';
  } finally {
    isPosting.value = false;
  }
};

const deletePost = async (postId: string) => {
  if (!userStore.userProfile?.uid) return;

  const post = posts.value.find((item) => item.id === postId);
  if (!post || post.userId !== userStore.userProfile.uid) return;
  if (!window.confirm('Delete this post?')) return;

  try {
    await deleteForumPost(forumId.value, postId);
    posts.value = posts.value.filter((item) => item.id !== postId);
  } catch (error) {
    console.error('Failed to delete post:', error);
    postError.value = 'Failed to delete post. Please try again.';
  }
};

const goToEvent = () => {
  if (linkedEvent.value) {
    router.push(`/events/${linkedEvent.value.id}`);
  }
};

watch(forumId, (id) => {
  loadForum(id);
}, { immediate: true });

onBeforeUnmount(() => {
  if (unsubscribePosts) unsubscribePosts();
});
</script>

<style scoped>
.forum-detail-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(255, 221, 184, 0.35), transparent 26%),
    linear-gradient(180deg, #fffdf8 0%, #f3efe6 100%);
}

.forum-detail-shell {
  max-width: 1180px;
  margin: 0 auto;
  padding: calc(var(--navbar-height) + 40px) 24px 48px;
}

.back-button {
  border: 1px solid rgba(63, 48, 34, 0.16);
  background: rgba(255, 255, 255, 0.82);
  color: #3f3022;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
}

.forum-hero {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1.35fr 0.85fr;
  gap: 24px;
  align-items: stretch;
}

.forum-hero-copy,
.forum-sidebar,
.forum-panel {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(63, 48, 34, 0.08);
  backdrop-filter: blur(12px);
}

.forum-hero-copy {
  padding: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #8c5a22;
}

.forum-hero-copy h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1;
  color: #2f241a;
}

.forum-hero-text {
  margin: 16px 0 0;
  color: #645647;
  line-height: 1.7;
}

.forum-actions {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.primary-action,
.forum-submit {
  border: none;
  border-radius: 14px;
  background: #2f241a;
  color: white;
  padding: 12px 18px;
  font-weight: 600;
  cursor: pointer;
}

.primary-action:disabled,
.forum-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-hint {
  color: #7c6d5d;
  font-size: 0.95rem;
}

.forum-hero-image {
  width: 100%;
  min-height: 300px;
  object-fit: cover;
  border-radius: 28px;
  border: 1px solid rgba(63, 48, 34, 0.08);
}

.forum-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.forum-sidebar {
  padding: 24px;
  height: fit-content;
}

.forum-sidebar h2,
.forum-panel h2 {
  margin-top: 0;
  color: #2f241a;
}

.forum-sidebar p {
  margin: 0 0 14px;
  color: #645647;
  line-height: 1.5;
}

.forum-sidebar strong {
  display: block;
  margin-bottom: 4px;
  color: #2f241a;
}

.forum-panel {
  padding: 24px;
}

.forum-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.forum-input {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 20px 0 16px;
}

.forum-textarea {
  flex: 1;
  resize: vertical;
  min-height: 110px;
  border-radius: 16px;
  border: 1px solid rgba(63, 48, 34, 0.14);
  background: #fffaf3;
  padding: 14px;
  font: inherit;
}

.forum-error {
  color: #b42318;
}

.forum-state {
  padding: 24px;
  border-radius: 18px;
  background: #fffaf3;
  color: #645647;
}

.forum-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.forum-post {
  border-radius: 18px;
  padding: 16px;
  background: #fffaf3;
  border: 1px solid rgba(63, 48, 34, 0.08);
}

.forum-post-header {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.forum-post-email {
  font-size: 0.9rem;
  color: #7c6d5d;
  font-weight: 600;
}

.forum-post-delete {
  border: none;
  background: transparent;
  color: #b42318;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.forum-post-delete:hover {
  color: #7a271a;
}

.forum-post p {
  margin: 0;
  color: #2f241a;
  line-height: 1.6;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .forum-hero,
  .forum-layout {
    grid-template-columns: 1fr;
  }

  .forum-input {
    flex-direction: column;
  }

  .forum-submit {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .forum-detail-shell {
    padding: calc(var(--navbar-height) + 24px) 16px 32px;
  }
}
</style>
