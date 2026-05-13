<template>
  <div class="event-list">
    <div v-if="isLoading" class="loading">Loading events...</div>

    <div v-else-if="filteredEvents.length === 0" class="no-events">
      No events found.
    </div>

    <div v-else class="events-grid">
      <EventCard
        v-for="event in filteredEvents"
        :key="event.id"
        :event="event"
        :currentUserId="userStore.userProfile?.uid"
        @click="$emit('open-card', event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import Fuse from 'fuse.js';
import { useRoute } from 'vue-router';
import EventCard from './EventCard.vue';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import type { Event } from '../types/event';

const props = defineProps<{
  category?: string;
  search?: string;
  sort?: 'newest' | 'oldest';
}>();

defineEmits<{
  (event: 'open-card', payload: Event): void;
}>();

const eventStore = useEventStore();
const userStore = useUserStore();
const route = useRoute();

const filteredEvents = ref<Event[]>([]);
const isLoading = ref(true);

/* ---------------- helpers ---------------- */

function toDate(val: any): Date {
  return val?.toDate ? val.toDate() : new Date(val);
}

function isRecurring(event: Event): boolean {
  return !!event.schedule && event.schedule.type !== 'ONE_TIME';
}

/* ---------------- NEW: filter past events ---------------- */

function filterPastEvents(events: Event[]): Event[] {
  const now = new Date();

  return events.filter(event => {
    // Always keep recurring events
    if (isRecurring(event)) return true;

    // Only keep one-time events that are in the future
    const start = toDate(event.startTime);
    return start >= now;
  });
}

/* ---------------- sorting ---------------- */

function sortEvents(events: Event[]): Event[] {
  const normal = events.filter(e => !isRecurring(e));
  const recurring = events.filter(e => isRecurring(e));

  normal.sort((a, b) => {
    const tA = toDate(a.startTime).getTime();
    const tB = toDate(b.startTime).getTime();

    return props.sort === 'oldest'
      ? tA - tB
      : tB - tA;
  });

  return [...normal, ...recurring];
}

/* ---------------- search ---------------- */

function applySearch(events: Event[]): Event[] {
  const q = (props.search || (route.query.q as string) || '').trim();
  if (!q) return events;

  const fuse = new Fuse(events, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'tags', weight: 1.5 },
      { name: 'organizerName', weight: 1.2 },
      { name: 'description', weight: 1 },
      { name: 'location', weight: 0.8 },
    ],
    threshold: 0.3,
    ignoreLocation: true,
  });

  return fuse.search(q).map(r => r.item);
}

/* ---------------- core pipeline ---------------- */

async function refreshEvents() {
  isLoading.value = true;

  let events: Event[] = props.category
    ? eventStore.events.filter(e =>
        e.category.toUpperCase() === props.category?.toUpperCase()
      )
    : [...eventStore.events];

  // 1. remove past one-time events (IMPORTANT FIX)
  events = filterPastEvents(events);

  // 2. search
  events = applySearch(events);

  // 3. sort
  events = sortEvents(events);

  filteredEvents.value = events;

  isLoading.value = false;
}

/* ---------------- watchers ---------------- */

watch(
  [
    () => props.category,
    () => props.search,
    () => props.sort,
    () => route.query.q,
    () => eventStore.events.length,
  ],
  () => {
    void refreshEvents();
  },
  { immediate: true }
);

/* ---------------- init ---------------- */

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
}

.events-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
}
</style>