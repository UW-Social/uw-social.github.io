<template>
  <div class="forum-page">
    <section class="forum-hero">
      <div class="forum-hero-copy">
        <span class="forum-kicker">Community reflections</span>
        <h1 class="forum-title">Forum</h1>
        <p class="forum-subtitle">
          Read notes, reactions, and mini writeups from attendees across UW Social events.
        </p>
      </div>

      <div class="forum-stats">
        <div class="stat-card">
          <span class="stat-value">{{ attendeePosts.length }}</span>
          <span class="stat-label">Attendee posts</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ activeEventCount }}</span>
          <span class="stat-label">Events with discussion</span>
        </div>
      </div>
    </section>

    <section class="forum-layout">
      <aside class="forum-sidebar">
        <div class="sidebar-card">
          <h2 class="sidebar-title">What shows up here</h2>
          <p class="sidebar-text">
            This feed gathers posts from event forums and highlights posts by people listed as event participants.
          </p>
        </div>

        <div class="sidebar-card">
          <h2 class="sidebar-title">Why this page exists</h2>
          <p class="sidebar-text">
            It gives future attendees a fast way to see what events actually felt like, without opening every event page one by one.
          </p>
        </div>
      </aside>

      <main class="forum-feed">
        <div v-if="isLoading" class="feed-state">
          <h2>Loading forum posts...</h2>
          <p>Gathering attendee notes from recent events.</p>
        </div>

        <div v-else-if="errorMessage" class="feed-state feed-state-error">
          <h2>Couldn’t load the forum</h2>
          <p>{{ errorMessage }}</p>
        </div>

        <div v-else-if="attendeePosts.length === 0" class="feed-state">
          <h2>No attendee posts yet</h2>
          <p>
            Once participants share notes on event pages, their posts will show up here as a community feed.
          </p>
        </div>

        <div v-else class="feed-list">
          <article
            v-for="post in attendeePosts"
            :key="post.id"
            class="feed-card"
          >
            <div class="feed-card-header">
              <div>
                <router-link :to="`/events/${post.eventId}`" class="event-link">
                  {{ post.eventTitle }}
                </router-link>
                <p class="event-meta">
                  {{ post.eventSchedule }}
                  <span v-if="post.eventLocation">• {{ post.eventLocation }}</span>
                </p>
              </div>
              <span class="post-timestamp">{{ formatTimestamp(post.createdAt) }}</span>
            </div>

            <p class="post-body">{{ post.text }}</p>

            <div class="feed-card-footer">
              <span class="author-pill">{{ post.userEmail || 'Unknown attendee' }}</span>
              <router-link :to="`/events/${post.eventId}`" class="event-cta">
                Open event
              </router-link>
            </div>
          </article>
        </div>
      </main>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useEventStore } from '../stores/event';
import { formatEventSchedule, type Event } from '../types/event';

interface ForumPost {
  id: string;
  eventId: string;
  eventTitle: string;
  eventLocation: string;
  eventSchedule: string;
  text: string;
  userId?: string | null;
  userEmail?: string | null;
  createdAt?: {
    seconds?: number;
    toDate?: () => Date;
  } | null;
}

const eventStore = useEventStore();
const isLoading = ref(true);
const errorMessage = ref('');
const attendeePosts = ref<ForumPost[]>([]);

const activeEventCount = computed(() => {
  return new Set(attendeePosts.value.map((post) => post.eventId)).size;
});

const formatTimestamp = (value: ForumPost['createdAt']) => {
  if (!value) return 'Just now';

  try {
    const date = typeof value.toDate === 'function'
      ? value.toDate()
      : typeof value.seconds === 'number'
        ? new Date(value.seconds * 1000)
        : new Date(value as unknown as string);

    if (Number.isNaN(date.getTime())) return 'Just now';

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch (error) {
    console.warn('Failed to format forum timestamp:', value, error);
    return 'Just now';
  }
};

const loadForumPosts = async () => {
  isLoading.value = true;
  errorMessage.value = '';

  try {
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }

    const events = eventStore.events;
    const postsByEvent = await Promise.all(events.map(loadPostsForEvent));

    attendeePosts.value = postsByEvent
      .flat()
      .sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));
  } catch (error) {
    console.error('Failed to load forum page:', error);
    errorMessage.value = 'Please try refreshing the page in a moment.';
  } finally {
    isLoading.value = false;
  }
};

const loadPostsForEvent = async (event: Event): Promise<ForumPost[]> => {
  const postsRef = collection(db, 'events', event.id, 'posts');
  const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(postsQuery);

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      eventId: event.id,
      eventTitle: event.title,
      eventLocation: event.location,
      eventSchedule: formatEventSchedule(event),
      ...(doc.data() as {
        text: string;
        userId?: string | null;
        userEmail?: string | null;
        createdAt?: ForumPost['createdAt'];
      }),
    }))
    .filter((post) => Boolean(post.userId) && event.participants?.includes(post.userId as string));
};

const getTimestampMs = (value: ForumPost['createdAt']) => {
  if (!value) return 0;
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value.seconds === 'number') return value.seconds * 1000;

  const parsed = new Date(value as unknown as string).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

onMounted(() => {
  loadForumPosts();
});
</script>

<style scoped>
.forum-page {
  min-height: calc(100vh - var(--navbar-height));
  padding: var(--spacing-2xl) var(--spacing-3xl) var(--spacing-4xl);
  background:
    radial-gradient(circle at top left, rgba(99, 102, 241, 0.08), transparent 28%),
    linear-gradient(180deg, #f8f8ff 0%, #ffffff 45%, #f8fafc 100%);
}

.forum-hero {
  max-width: var(--container-max-width);
  margin: 0 auto var(--spacing-2xl);
  padding: var(--spacing-2xl);
  border-radius: var(--radius-xl);
  border: 1px solid rgba(99, 102, 241, 0.12);
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
  box-shadow: 0 24px 60px rgba(99, 102, 241, 0.08);
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--spacing-xl);
}

.forum-kicker {
  display: inline-block;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}

.forum-title {
  margin: 0 0 var(--spacing-sm);
  font-size: clamp(2.5rem, 4vw, 4.5rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
  color: var(--color-gray-900);
}

.forum-subtitle {
  margin: 0;
  max-width: 42rem;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-600);
}

.forum-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
  gap: var(--spacing-md);
  min-width: min(100%, 340px);
}

.stat-card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  background: linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(255, 255, 255, 0.95));
  border: 1px solid rgba(99, 102, 241, 0.16);
}

.stat-value {
  display: block;
  font-size: clamp(1.8rem, 2vw, 2.5rem);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
}

.stat-label {
  display: block;
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.forum-layout {
  max-width: var(--container-max-width);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: var(--spacing-xl);
  align-items: start;
}

.forum-sidebar {
  position: sticky;
  top: calc(var(--navbar-height) + var(--spacing-xl));
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.sidebar-card {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
}

.sidebar-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 1.1rem;
  color: var(--color-gray-900);
}

.sidebar-text {
  margin: 0;
  color: var(--color-gray-600);
  line-height: var(--line-height-relaxed);
}

.forum-feed {
  min-width: 0;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.feed-card {
  padding: var(--spacing-xl);
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.15);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
}

.feed-card-header,
.feed-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.feed-card-footer {
  margin-top: var(--spacing-lg);
}

.event-link {
  font-size: 1.2rem;
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  text-decoration: none;
}

.event-link:hover,
.event-cta:hover {
  color: var(--color-primary);
}

.event-meta {
  margin: var(--spacing-xs) 0 0;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

.post-timestamp {
  flex-shrink: 0;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
}

.post-body {
  margin: var(--spacing-lg) 0 0;
  color: var(--color-gray-700);
  font-size: 1.02rem;
  line-height: 1.7;
  white-space: pre-wrap;
}

.author-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.8rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
}

.event-cta {
  color: var(--color-gray-700);
  text-decoration: none;
  font-weight: var(--font-weight-semibold);
}

.feed-state {
  padding: calc(var(--spacing-3xl) * 1.1) var(--spacing-xl);
  text-align: center;
  border-radius: var(--radius-xl);
  border: 1px dashed rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.7);
}

.feed-state h2 {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-gray-900);
}

.feed-state p {
  margin: 0;
  color: var(--color-gray-600);
}

.feed-state-error {
  border-style: solid;
  border-color: rgba(239, 68, 68, 0.2);
  background: rgba(254, 242, 242, 0.8);
}

@media (max-width: 1024px) {
  .forum-hero,
  .forum-layout {
    grid-template-columns: 1fr;
  }

  .forum-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .forum-stats {
    width: 100%;
  }

  .forum-sidebar {
    position: static;
  }
}

@media (max-width: 768px) {
  .forum-page {
    padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-3xl);
  }

  .forum-hero {
    padding: var(--spacing-xl);
  }

  .feed-card-header,
  .feed-card-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
