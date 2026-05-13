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
import EventCard from './EventCard.vue';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import type { Event } from '../types/event';

const props = defineProps<{
  category?: string | null;
  search?: string;
  sort?: 'newest' | 'oldest';
}>();

defineEmits<{
  (event: 'open-card', payload: Event): void;
}>();

const eventStore = useEventStore();
const userStore = useUserStore();

const filteredEvents = ref<Event[]>([]);
const isLoading = ref(true);

const VALID_CATEGORIES = new Set([
  'ACADEMIC',
  'CLUB',
  'SPORTS',
  'GAMES',
  'CULTURE',
  'INTEREST',
  'HFS',
]);

function normalizeCategory(cat?: string | null) {
  if (!cat) return null;
  const c = cat.toUpperCase();
  return VALID_CATEGORIES.has(c) ? c : null;
}

function toDate(val: any): Date {
  return val?.toDate ? val.toDate() : new Date(val);
}

function isRecurring(event: Event) {
  return !!event.schedule && event.schedule.type !== 'ONE_TIME';
}

/* ---- FILTER ---- */

function filterPast(events: Event[]) {
  const now = new Date();

  return events.filter(e => {
    if (isRecurring(e)) return true;
    return toDate(e.startTime) >= now;
  });
}

function filterCategory(events: Event[]) {
  const cat = normalizeCategory(props.category);
  if (!cat) return events;

  return events.filter(e => (e.category || '').toUpperCase() === cat);
}

/* ---- SEARCH ---- */

function applySearch(events: Event[]) {
  const q = (props.search ?? '').trim();
  if (!q) return events;

  const fuse = new Fuse(events, {
    keys: ['title', 'tags', 'organizerName', 'description', 'location'],
    threshold: 0.3,
  });

  return fuse.search(q).map(r => r.item);
}

/* ---- SORT ---- */

function sortEvents(events: Event[]) {
  const normal = events.filter(e => !isRecurring(e));
  const recurring = events.filter(isRecurring);

  normal.sort((a, b) => {
    const tA = toDate(a.startTime).getTime();
    const tB = toDate(b.startTime).getTime();
    return props.sort === 'oldest' ? tA - tB : tB - tA;
  });

  return [...normal, ...recurring];
}

/* ---- PIPELINE ---- */

async function refresh() {
  isLoading.value = true;

  let events = [...eventStore.events];

  events = filterCategory(events);
  events = filterPast(events);
  events = applySearch(events);
  events = sortEvents(events);

  filteredEvents.value = events;

  isLoading.value = false;
}

watch(
  () => [props.category, props.search, props.sort, eventStore.events.length],
  refresh,
  { immediate: true }
);

onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }
  await refresh();
});
</script>