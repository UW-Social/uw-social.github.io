<template>
  <div class="mobile-event-page">
    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-bar">
        <div class="search-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ad8ae6" stroke-width="2.5">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Event Name"
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="menu-button" @click="showFilterModal = true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2">
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Event List -->
    <div class="event-list-container">
      <div v-if="isLoading" class="loading">Loading events...</div>
      <div v-else-if="filteredEvents.length === 0" class="no-events">No events found</div>
      <div v-else class="events-list">
        <MobileEventCard
          v-for="event in filteredEvents"
          :key="event.id"
          :event="event"
          @click="handleEventClick(event)"
        />
      </div>
    </div>

    <!-- Filter Modal -->
    <MobileFilterModal
      :isVisible="showFilterModal"
      :selectedCategories="selectedCategories"
      @close="showFilterModal = false"
      @updateCategories="updateSelectedCategories"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEventStore } from '../../stores/event';
import { useUserStore } from '../../stores/user';
import Fuse from 'fuse.js';
import MobileEventCard from './MobileEventCard.vue';
import MobileFilterModal from './MobileFilterModal.vue';
import type { Event } from '../../types/event';

const eventStore = useEventStore();
const userStore = useUserStore();
const route = useRoute();

const searchQuery = ref('');
const isLoading = ref(true);
const events = ref<Event[]>([]);
const showFilterModal = ref(false);
const selectedCategories = ref<string[]>([]);

// Load events from Firebase
onMounted(async () => {
  try {
    if (eventStore.events.length === 0) {
      await eventStore.fetchEvents();
    }
    
    // Filter to only show upcoming events
    const now = new Date();
    events.value = eventStore.events.filter((event: Event) => {
      const end = typeof event.endtime?.toDate === 'function' 
        ? event.endtime.toDate()
        : new Date(event.endtime);
      return end > now;
    });
    
    // Sort by start time (newest first)
    events.value.sort((a: Event, b: Event) => {
      const toDate = (val: any) =>
        typeof val?.toDate === 'function' ? val.toDate() : new Date(val);
      return toDate(b.startTime).getTime() - toDate(a.startTime).getTime();
    });
    
  } catch (error) {
    console.error('Error loading events:', error);
  } finally {
    isLoading.value = false;
  }
});

// Filter events based on search query and selected categories
const filteredEvents = computed(() => {
  let filteredList = events.value;
  
  // First filter by categories
  if (selectedCategories.value.length > 0) {
    filteredList = filteredList.filter(event => 
      selectedCategories.value.includes(event.category)
    );
  }
  
  // Then filter by search query if exists
  if (!searchQuery.value.trim()) {
    return filteredList;
  }
  
  const fuse = new Fuse(filteredList, {
    keys: ['title', 'description', 'location', 'tags', 'organizerName'],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });
  
  return fuse.search(searchQuery.value.trim()).map(result => result.item);
});

// Handle search functionality
const handleSearch = () => {
  // Search is handled by the computed filteredEvents
  console.log('Searching for:', searchQuery.value);
};

// Handle event click - navigate to event details
const handleEventClick = (event: Event) => {
  console.log('Event clicked:', event);
  if (event.id) {
    // Navigate to event detail page with event ID
    window.location.href = `#/events/${event.id}`;
  }
};

// Handle category filter updates
const updateSelectedCategories = (categories: string[]) => {
  selectedCategories.value = categories;
  console.log('Selected categories updated:', categories);
};

// Watch for URL query changes to set initial search
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery && typeof newQuery === 'string') {
      searchQuery.value = newQuery;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.mobile-event-page {
  min-height: 100vh;
  background-image: url('/images/image.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  padding-bottom: 80px; /* Space for bottom navigation if needed */
}

.search-container {
  padding: 12px 20px;
  background-color: transparent;
  position: sticky;
  top: 60px;
  z-index: 100;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 30px;
  padding: 8px 16px;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.05);
  height: 44px;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #333;
  background: transparent;
}

.search-input::placeholder {
  color: #999;
}

.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.menu-button {
  background: none;
  border: none;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  flex-shrink: 0;
  min-width: 40px;
  min-height: 40px;
}

.menu-button:hover {
  opacity: 0.7;
}

.event-list-container {
  padding: 16px;
}

.loading,
.no-events {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-size: 1rem;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

@media (max-width: 576px) {
  .mobile-event-page {
    padding-bottom: 60px;
  }
  
  .search-container {
    padding: 12px;
  }
  
  .event-list-container {
    padding: 12px 20px;
  }
}
</style>