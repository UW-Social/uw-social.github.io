<template>
  <div class="event-list">
    <div v-if="eventStore.isLoading || isLoading" class="loading" role="status">Loading events...</div>

    <div v-else-if="eventStore.fetchError" class="events-error" role="alert">
      <p>{{ eventStore.fetchError }}</p>
      <button type="button" @click="eventStore.fetchEvents()">Try again</button>
    </div>

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
  sort?: 'soonest' | 'newly-added' | 'online';
  recommendationMode?: 'personalized' | 'latest' | 'trending';
  limit?: number;
  excludeEventId?: string;
}>();

defineEmits<{
  (event: 'open-card', payload: Event): void;
}>();

const eventStore = useEventStore();
const userStore = useUserStore();

const filteredEvents = ref<Event[]>([]);
const isLoading = ref(true);
const RECENCY_WINDOW_DAYS = 30;
const FUSE_WORST_SCORE = 1;
const PERSONALIZED_SEMANTIC_WEIGHT = 0.6;
const PERSONALIZED_RECENCY_WEIGHT = 0.3;
const PERSONALIZED_POP_WEIGHT = 0.1;
const TRENDING_RECENCY_WEIGHT = 0.6;
const TRENDING_POP_WEIGHT = 0.4;

const VALID_CATEGORIES = new Set([
  'ACADEMIC',
  'CAREER',
  'CLUB',
  'SPORTS',
  'INTEREST',
]);

function normalizeCategory(cat?: string | null) {
  if (!cat) return null;
  const c = cat.toUpperCase();
  return VALID_CATEGORIES.has(c) ? c : null;
}

function toDate(val: any): Date | null {
  if (!val) return null;

  if (typeof val.toDate === 'function') {
    const date = val.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof val.seconds === 'number') {
    const date = new Date(val.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = val instanceof Date ? val : new Date(val);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isRecurring(event: Event) {
  return !!event.schedule && event.schedule.type !== 'ONE_TIME';
}

function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getEventEndDate(event: Event): Date | null {
  const schedule = event.schedule;

  if (schedule && schedule.type !== 'ONE_TIME') {
    const scheduleEndDate = toDate(schedule.endDate);
    if (scheduleEndDate) return endOfDay(scheduleEndDate);
  }

  return toDate(event.endtime);
}

function calculateRecencyScore(event: Event, now: number): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const startMs = toDate(event.startTime)?.getTime();
  if (typeof startMs !== 'number') return 0;

  const daysUntil = (startMs - now) / msPerDay;

  if (isRecurring(event)) return 1;
  if (daysUntil <= 0) return 0.2;
  return 1 / (1 + daysUntil / RECENCY_WINDOW_DAYS);
}

interface Candidate {
  id: string;
  event: Event;
  searchableText: string;
}

/* ---- FILTER ---- */

function filterPast(events: Event[]) {
  const now = Date.now();

  return events.filter(e => {
    const endDate = getEventEndDate(e);

    if (isRecurring(e) && !endDate) return true;
    return !!endDate && endDate.getTime() >= now;
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

function getEventStartDate(event: Event): Date | null {
  const schedule = event.schedule;
  const scheduledStart = schedule?.type === 'ONE_TIME'
    ? schedule.startDatetime
    : schedule?.startDate;

  return toDate(scheduledStart) ?? toDate(event.startTime);
}

function sortEvents(events: Event[]) {
  return [...events].sort((a, b) => {
    const newlyAdded = props.sort === 'newly-added';
    const tA = (newlyAdded ? toDate(a.createdAt) : getEventStartDate(a))?.getTime();
    const tB = (newlyAdded ? toDate(b.createdAt) : getEventStartDate(b))?.getTime();

    // Keep events without a valid start date last in either direction.
    if (tA === undefined) return tB === undefined ? 0 : 1;
    if (tB === undefined) return -1;
    return props.sort === 'soonest' || props.sort === 'online' ? tA - tB : tB - tA;
  });
}

function isOnlineEvent(event: Event): boolean {
  return /\b(online|virtual|zoom|webinar|remote|microsoft teams|google meet)\b|线上|線上/i.test(event.location || '');
}

/* ---- PIPELINE ---- */

async function refresh() {
  isLoading.value = true;

  let events = [...eventStore.events];

  if (props.excludeEventId) {
    events = events.filter(event => event.id !== props.excludeEventId);
  }

  events = filterCategory(events);
  events = filterPast(events);
  if (props.sort === 'online') {
    events = events.filter(isOnlineEvent);
  }
  events = applySearch(events);

  // An explicit date sort takes priority over recommendation ranking.
  events = sortEvents(events);

  if (!props.sort && props.recommendationMode === 'personalized') {
    const userTags = userStore.userProfile?.tags;
    if (
      userStore.isLoggedIn &&
      Array.isArray(userTags) &&
      userTags.length > 0
    ) {
      try {
        const personalized = scoreByPersonalization(events, userTags);
        events = personalized;
      } catch (err) {
        // Fall back to date-sorted events on error
        console.error('Personalized ranking failed, falling back to date sort:', err);
      }
    }
  } else if (!props.sort && props.recommendationMode === 'trending') {
    events = scoreByTrending(events);
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
    includeScore: true,
  });

  // Initialize score maps
  const semanticScores: Record<string, number> = {};
  for (const c of candidates) semanticScores[c.id] = 0;

  // For each user tag, search and record max semantic score per event
  for (const tagRaw of userTags) {
    const tag = (tagRaw || '').toString().trim();
    if (!tag) continue;
    console.log('[EventList] Fuse ranking search', {
      userTags,
      eventTags: candidates.map((candidate) => ({
        eventId: candidate.id,
        tags: candidate.event.tags ?? [],
      })),
      query: tag,
    });
    const results = fuse.search(tag, { limit: candidates.length });
    const topMatch = results[0];

    console.log('[EventList] Top Fuse tag fit', {
      userTag: tag,
      eventId: topMatch?.item.id ?? null,
      eventTitle: topMatch?.item.event.title ?? null,
      fuseScore: topMatch?.score ?? null,
    });
    for (const r of results) {
      const id = r.item.id;
      const sim = FUSE_WORST_SCORE - (typeof r.score === 'number' ? r.score : FUSE_WORST_SCORE); // Fuse: 0=best, 1=worst; invert so higher is better
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

  const scored = events.map((e) => {
    const sem = semanticScores[e.id] ?? 0;

    // Recency: prefer near-future events. Recurring events always receive 1.0.
    const recencyScore = calculateRecencyScore(e, now);

    const pop = maxPop > 0 ? popCounts[e.id] / maxPop : 0;

    const finalScore =
      PERSONALIZED_SEMANTIC_WEIGHT * sem +
      PERSONALIZED_RECENCY_WEIGHT * recencyScore +
      PERSONALIZED_POP_WEIGHT * pop;

    return { event: e, score: finalScore };
  });

  // Sort by descending score
  scored.sort((a, b) => b.score - a.score);

      console.log(
      '[EventList] Top final personalized ranking',
      scored.slice(0, 5).map(({ event, score }) => ({
        eventId: event.id,
        title: event.title,
        score,
      })),
    );
  return scored.map((s) => s.event);
}

function scoreByTrending(events: Event[]) {
  const now = Date.now();
  let maxPop = 0;
  const popCounts: Record<string, number> = {};

  for (const e of events) {
    const count = Array.isArray(e.participants) ? e.participants.length : 0;
    popCounts[e.id] = Math.max(0, count);
    if (popCounts[e.id] > maxPop) maxPop = popCounts[e.id];
  }

  const scored = events.map((e) => {
    const recencyScore = calculateRecencyScore(e, now);
    const popularityScore = maxPop > 0 ? popCounts[e.id] / maxPop : 0;
    const score = recencyScore * TRENDING_RECENCY_WEIGHT + popularityScore * TRENDING_POP_WEIGHT;
    return { event: e, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.event);
}

watch(
  () => [
    props.category,
    props.search,
    props.sort,
    props.recommendationMode,
    props.limit,
    props.excludeEventId,
    eventStore.events.length,
  ],
  refresh,
  { immediate: true }
);

onMounted(async () => {
  await eventStore.fetchEvents();
  await refresh();
});
</script>

<style scoped>
.events-error {
  padding: 24px;
  border: 1px solid #e8eaf0;
  border-radius: 20px;
  background: #fff;
  color: #475467;
}

.events-error button {
  padding: 10px 18px;
  border-radius: 999px;
  background: #6c48d1;
  color: #fff;
  font: inherit;
  font-weight: 700;
}
</style>
