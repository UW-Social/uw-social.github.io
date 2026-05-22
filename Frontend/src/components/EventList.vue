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
  recommendationMode?: 'personalized' | 'latest' | 'trending';
  limit?: number;
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

interface Candidate {
  id: string;
  event: Event;
  searchableText: string;
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

  // Base sort by date (newest/oldest)
  events = sortEvents(events);

  if (props.recommendationMode === 'personalized') {
    if (
      userStore.isLoggedIn &&
      Array.isArray(userStore.userProfile?.tags) &&
      userStore.userProfile.tags.length > 0
    ) {
      try {
        const personalized = scoreByPersonalization(events, userStore.userProfile.tags || []);
        events = personalized;
      } catch (err) {
        // Fall back to date-sorted events on error
        console.error('Personalized ranking failed, falling back to date sort:', err);
      }
    }
  } else if (props.recommendationMode === 'trending') {
    events = scoreByTrending(events);
  } else if (props.recommendationMode === 'latest') {
    // already date-sorted above
  }

  // Apply limit if supplied
  if (typeof props.limit === 'number' && props.limit > 0) {
    events = events.slice(0, props.limit);
  }

  filteredEvents.value = events;

  isLoading.value = false;
}

/**
 * Score events using Fuse.js fuzzy matching against user tags, then combine
 * with lightweight recency and popularity heuristics.
 */
function scoreByPersonalization(events: Event[], userTags: string[]) {
  if (!events || events.length === 0) return events;

  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;

  // Build candidate string for each event
  const candidates: Candidate[] = events.map((e) => {
    const tagsStr = Array.isArray(e.tags) ? e.tags.join(' ') : '';
    const title = e.title || '';
    const desc = e.description || '';
    return {
      id: e.id,
      event: e,
      searchableText: `${tagsStr} ${title} ${desc}`.trim(),
    };
  });

  // Fuse index over event candidates
  const fuse = new Fuse<Candidate>(candidates, {
    keys: ['searchableText'],
    threshold: 0.4,
    ignoreLocation: true,
    useExtendedSearch: false,
  });

  // Initialize score maps
  const semanticScores: Record<string, number> = {};
  for (const c of candidates) semanticScores[c.id] = 0;

  // For each user tag, search and record max semantic score per event
  for (const tagRaw of userTags) {
    const tag = (tagRaw || '').toString().trim();
    if (!tag) continue;
    const results = fuse.search(tag, { limit: candidates.length });
    for (const r of results) {
      const id = r.item.id;
      const sim = 1 - (typeof r.score === 'number' ? r.score : 1); // convert Fuse score -> similarity
      if (sim > (semanticScores[id] ?? 0)) semanticScores[id] = sim;
    }
  }

  // Popularity normalization: find max attendee-like count
  let maxPop = 0;
  const popCounts: Record<string, number> = {};
  for (const e of events) {
    const count = Array.isArray(e.participants) ? e.participants.length : 0;
    popCounts[e.id] = Math.max(0, count);
    if (popCounts[e.id] > maxPop) maxPop = popCounts[e.id];
  }

  // Combine scores
  const SEMANTIC_WEIGHT = 0.6;
  const RECENCY_WEIGHT = 0.3;
  const POP_WEIGHT = 0.1;

  const scored = events.map((e) => {
    const sem = semanticScores[e.id] ?? 0;

    // Recency: prefer near-future events. Recurring events always receive 1.0.
    const startMs = toDate(e.startTime).getTime();
    const daysUntil = (startMs - now) / msPerDay;
    const isRec = isRecurring(e);
    let recencyScore = 0;
    if (isRec) {
      recencyScore = 1.0;
    } else if (daysUntil <= 0) {
      // past one-time events deprioritized
      recencyScore = 0.2;
    } else {
      // events soon get higher score; scale by 30 days window
      recencyScore = 1 / (1 + daysUntil / 30);
    }

    const pop = maxPop > 0 ? popCounts[e.id] / maxPop : 0;

    const finalScore = SEMANTIC_WEIGHT * sem + RECENCY_WEIGHT * recencyScore + POP_WEIGHT * pop;

    return { event: e, score: finalScore };
  });

  // Sort by descending score
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.event);
}

function scoreByTrending(events: Event[]) {
  const now = Date.now();
  const msPerDay = 1000 * 60 * 60 * 24;
  let maxPop = 0;
  const popCounts: Record<string, number> = {};

  for (const e of events) {
    const count = Array.isArray(e.participants) ? e.participants.length : 0;
    popCounts[e.id] = Math.max(0, count);
    if (popCounts[e.id] > maxPop) maxPop = popCounts[e.id];
  }

  const scored = events.map((e) => {
    const startMs = toDate(e.startTime).getTime();
    const daysUntil = (startMs - now) / msPerDay;
    let recencyScore = 0;
    if (isRecurring(e)) {
      recencyScore = 1;
    } else if (daysUntil <= 0) {
      recencyScore = 0.2;
    } else {
      recencyScore = 1 / (1 + daysUntil / 30);
    }
    const popularityScore = maxPop > 0 ? popCounts[e.id] / maxPop : 0;
    const score = recencyScore * 0.6 + popularityScore * 0.4;
    return { event: e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.event);
}

watch(
  () => [props.category, props.search, props.sort, props.recommendationMode, props.limit, eventStore.events.length],
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