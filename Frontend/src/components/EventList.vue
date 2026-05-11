<template>
  <div class="event-list">
    <div v-if="isLoading" class="loading">Loading events...</div>
    <div v-else-if="filteredEvents.length === 0" class="no-events">No events found.</div>
    <div v-else class="events-grid">
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        :currentUserId="userStore.userProfile?.uid"
        @open-card="$emit('open-card', event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Fuse from 'fuse.js';
import { useRoute } from 'vue-router';
import EventCard from './EventCard.vue';
import { getPhraseVec } from './models/embedding_distance';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import type { Event } from '../types/event';

const props = defineProps<{
  category?: string;
  search?: string;
  sort?: string;
  limit?: number;
  recommendationMode?: 'default' | 'latest' | 'personalized';
}>();

defineEmits<{
  (event: 'open-card', payload: Event): void;
}>();

const eventStore = useEventStore();
const route = useRoute();
const userStore = useUserStore();

const filteredEvents = ref<Event[]>([]);
const isLoading = ref(true);

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }

  return new Date(value as string | number | Date);
}

function sortEventsByStartTimeAsc(events: Event[]): Event[] {
  return events.slice().sort((a, b) => toDate(a.startTime).getTime() - toDate(b.startTime).getTime());
}

function sortEventsByStartTimeDesc(events: Event[]): Event[] {
  return events.slice().sort((a, b) => toDate(b.startTime).getTime() - toDate(a.startTime).getTime());
}

function cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < vecA.length; index += 1) {
    dot += vecA[index] * vecB[index];
    normA += vecA[index] ** 2;
    normB += vecB[index] ** 2;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function sortEventsByUserInterest(events: Event[]): Promise<Event[]> {
  const userSignals = [
    ...(userStore.userProfile?.tags ?? []),
    ...(userStore.userProfile?.goals ?? []),
  ].map(signal => signal.toLowerCase());

  if (!userSignals.length) {
    return sortEventsByStartTimeAsc(events);
  }

  const userSignalEmbeddings = await Promise.all(userSignals.map(signal => getPhraseVec(signal)));

  const scoredEvents = await Promise.all(
    events.map(async (event) => {
      const eventTags = (event.tags ?? []).map(tag => tag.toLowerCase());

      if (!eventTags.length) {
        return {
          event,
          score: -1,
        };
      }

      const eventTagEmbeddings = await Promise.all(eventTags.map(tag => getPhraseVec(tag)));
      let bestScore = -1;

      for (const eventVector of eventTagEmbeddings) {
        for (const userVector of userSignalEmbeddings) {
          bestScore = Math.max(bestScore, cosineSimilarity(eventVector, userVector));
        }
      }

      return {
        event,
        score: bestScore,
      };
    }),
  );

  scoredEvents.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return toDate(left.event.startTime).getTime() - toDate(right.event.startTime).getTime();
  });

  return scoredEvents.map(({ event }) => event);
}

function getVisibleEvents(events: Event[]): Event[] {
  const now = new Date();
  const pastCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  return events.filter((event) => toDate(event.endtime).getTime() > pastCutoff.getTime());
}

function applySearch(events: Event[]): Event[] {
  const queryText = (props.search || (route.query.q as string) || '').trim();
  if (!queryText) return events;

  const fuse = new Fuse(events, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'organizerName', weight: 1.2 },
      { name: 'description', weight: 1 },
      { name: 'location', weight: 0.8 },
    ],
    threshold: 0.3,
    distance: 80,
    ignoreLocation: true,
    minMatchCharLength: 2,
    includeScore: true,
    shouldSort: true,
  });

  return fuse.search(queryText).map(result => result.item);
}

function getRecommendationMode(): 'default' | 'latest' | 'personalized' {
  if (props.recommendationMode) {
    return props.recommendationMode;
  }

  if (props.sort === 'recommended' && userStore.isLoggedIn && userStore.profileIsComplete) {
    return 'personalized';
  }

  return 'default';
}

async function refreshEvents(): Promise<void> {
  isLoading.value = true;

  let events = props.category
    ? eventStore.events.filter(event => event.category.toUpperCase() === props.category?.toUpperCase())
    : eventStore.events.slice();

  events = getVisibleEvents(events);
  events = applySearch(events);

  const recommendationMode = getRecommendationMode();

  if (recommendationMode === 'latest') {
    events = sortEventsByStartTimeAsc(events);
  } else if (recommendationMode === 'personalized') {
    // Keep recommendation ordering inside the list so pages only choose the mode they need.
    events = await sortEventsByUserInterest(events);
  } else if (props.sort === 'farthest') {
    events = sortEventsByStartTimeDesc(events);
  } else {
    events = sortEventsByStartTimeAsc(events);
  }

  if (props.limit) {
    events = events.slice(0, props.limit);
  }

  filteredEvents.value = events;
  isLoading.value = false;
}

watch(
  [
    () => props.category,
    () => props.limit,
    () => props.recommendationMode,
    () => props.search,
    () => props.sort,
    () => route.query.q,
    () => eventStore.events.length,
    () => userStore.isLoggedIn,
    () => userStore.profileIsComplete,
    () => (userStore.userProfile?.tags ?? []).join('|'),
    () => (userStore.userProfile?.goals ?? []).join('|'),
  ],
  () => {
    void refreshEvents();
  },
  { immediate: true },
);

onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }

  await refreshEvents();
});
</script>

<style scoped>
.event-list {
  padding: 0;
  margin: 0;
}

.loading,
.no-events {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
}

.events-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

@media (max-width: 576px) {
  .events-grid {
    padding: 0;
    margin: 0;
  }
}
</style>
