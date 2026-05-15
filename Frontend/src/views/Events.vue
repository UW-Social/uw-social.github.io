<template>
  <div class="events-page">
    <div class="overlapping-page">

      <div class="events-layout">

        <!-- LEFT SIDEBAR -->
        <EventSidebar
          :search="searchQuery"
          :sort="sortType"
          :category="categoryFilter"
          @update:search="searchQuery = $event"
          @update:sort="sortType = $event"
          @update:category="categoryFilter = $event"
        />

        <!-- RIGHT CONTENT -->
        <div class="events-content">
          <EventList
            :category="categoryFilter"
            :search="searchQuery"
            :sort="sortType"
            @open-card="handleEventClick"
          />
        </div>

      </div>

    </div>

    <BackToTop />
  </div>
</template>

<style scoped>
.events-page {
  min-height: 100vh;
  background: var(--color-white);
}

.overlapping-page {
  padding-top: calc(var(--navbar-height) - var(--spacing-2xl));
}

/* 🔥 FIXED LAYOUT CORE */
.events-layout {
  display: flex;
  align-items: flex-start; /* prevents vertical weird centering */
  min-height: calc(100vh - var(--navbar-height));
}

/* RIGHT SIDE (EVENTS) */
.events-content {
  flex: 1;
  padding: 0 var(--spacing-3xl);
  min-width: 0; /* IMPORTANT: prevents overflow pushing sidebar */
}

/* MOBILE FIX */
@media (max-width: 768px) {
  .events-layout {
    flex-direction: column;
  }

  .events-content {
    padding: var(--spacing-md);
  }
}
</style>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import EventList from '../components/EventList.vue';
import EventSidebar from '../components/EventSidebar.vue';
import BackToTop from '../components/BackToTop.vue';

import type { Event } from '../types/event';

const route = useRoute();
const router = useRouter();

const categoryFilter = ref<string | null>(null);
const searchQuery = ref('');
const sortType = ref<'newest' | 'oldest'>('newest');

const handleEventClick = (event: Event) => {
  router.push({
    path: `/events/${event.id}`,
    query: { returnTo: route.fullPath },
  });
};
</script>