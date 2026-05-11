<template>
  <div class="event-list">
    <div v-if="filteredEvents.length === 0" class="loading">
      No events found
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
import { computed, onMounted, ref, watch } from 'vue';
import Fuse from 'fuse.js';
import { useEventStore } from '../stores/event';
import { useUserStore } from '../stores/user';
import { useRoute } from 'vue-router';
import EventCard from './EventCard.vue';
import type { Event } from '../types/event';

const props = defineProps<{
  category?: string;
  search?: string;
  sort?: string; // "newest" | "oldest"
}>();

const eventStore = useEventStore();
const userStore = useUserStore();
const route = useRoute();

const eventsResult = ref<Event[]>([]);



function toMillis(val: any): number {
  if (!val) return 0;

  if (typeof val.toDate === 'function') {
    return val.toDate().getTime();
  }

  if (typeof val.seconds === 'number') {
    return val.seconds * 1000;
  }

  if (val instanceof Date) {
    return val.getTime();
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}



function applySort(events: Event[]): Event[] {
  if (props.sort === 'oldest') {
    return events.slice().sort((a, b) => {
      return toMillis(a.startTime) - toMillis(b.startTime);
    });
  }


  return events.slice().sort((a, b) => {
    return toMillis(b.startTime) - toMillis(a.startTime);
  });
}



async function refreshEvents() {
  let events: Event[] = eventStore.events;


  if (props.category) {
    events = events.filter(
      e => e.category.toUpperCase() === props.category?.toUpperCase()
    );
  }


  const now = new Date();
  const pastCutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  events = events.filter(e => {
    const end =
      typeof e.endtime?.toDate === 'function'
        ? e.endtime.toDate()
        : new Date(e.endtime);

    return end > pastCutoff;
  });


  const q = (props.search || (route.query.q as string) || '').trim();

  if (q) {
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

    events = fuse.search(q).map(r => r.item);
  }


  eventsResult.value = applySort(events);
}



watch(
  [() => props.category, () => props.search, () => props.sort],
  refreshEvents,
  { immediate: true }
);



onMounted(async () => {
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }
  refreshEvents();
});


const filteredEvents = computed(() => eventsResult.value);

</script>

<style scoped>
.event-list {
  padding: 0;
  margin: 0;
}

.loading {
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
}
</style>