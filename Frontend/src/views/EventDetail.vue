z<template>
  <div class="event-detail-page">
    <!-- 返回按钮 -->
    <button @click="goBack" class="back-button">
      <span class="arrow">←</span>
    </button>

    <!-- Loading State -->
    <div v-if="!event" class="loading-state">
      <p>Loading event details...</p>
    </div>

    <!-- Event Content -->
    <template v-else>
      <!-- Event Header -->
      <div class="event-header-section">
        <div class="event-image-card">
          <img :src="event.imageUrl || '/images/wavingdog.jpg'" alt="Event Image" class="event-image" />
        </div>

        <div class="event-info-card">
          <div class="event-info-header">
            <h1 class="event-title">{{ event.title }}</h1>
            <p v-if="descriptionSummary" class="event-summary">{{ descriptionSummary }}</p>
          </div>

          <div class="event-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Time</span>
              <span class="meta-value">{{ formatEventSchedule(event) }}</span>
            </div>
            <div class="meta-item" v-if="event.location">
              <span class="meta-label">Location</span>
              <span class="meta-value">{{ event.location }}</span>
            </div>
            <div class="meta-item" v-if="event.category">
              <span class="meta-label">Category</span>
              <span class="meta-value">{{ event.category }}</span>
            </div>
            <div class="meta-item" v-if="event.organizerName">
              <span class="meta-label">Organizer</span>
              <span class="meta-value">{{ event.organizerName }}</span>
            </div>
            <div class="meta-item" v-if="event.participants?.length">
              <span class="meta-label">Attendees</span>
              <span class="meta-value">
                {{ event.participants.length }} / {{ event.maxParticipants ?? 'No limit' }}
              </span>
            </div>
          </div>

          <div class="event-tags" v-if="event.tags && event.tags.length > 0">
            <span v-for="tag in event.tags" :key="tag" class="tag">#{{ tag }}</span>
          </div>

          <a
            v-if="event.link"
            :href="event.link"
            target="_blank"
            rel="noopener noreferrer"
            class="event-link-btn"
          >
            View Event Page
          </a>
        </div>
      </div>

      <!-- Description and Map -->
      <div class="content-section">
        <div class="description-card">
          <h2 class="section-title">About this event</h2>
          <p class="event-description" v-html="formatDescription(event.description || '')"></p>
        </div>

        <div class="map-card">
          <h2 class="section-title">Location</h2>
          <div class="google-map" ref="mapContainer"></div>
        </div>
      </div>

      <!-- Related Events -->
      <div class="related-events-section" v-if="relatedEvents.length > 0">
        <h2 class="section-title">Related Events</h2>
        <div class="events-grid">
          <div v-for="relatedEvent in relatedEvents" :key="relatedEvent.id" class="event-card" @click="goToEvent(relatedEvent.id)">
            <img :src="relatedEvent.imageUrl || '/images/wavingdog.jpg'" alt="Event" class="event-thumbnail" />
            <div class="event-card-info">
              <p class="event-card-title">{{ relatedEvent.title }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '../stores/event';
import { formatEventSchedule, type Event } from '../types/event';
import { loadGoogleMaps } from '../utils/googleMaps';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();

const eventId = computed(() => route.params.id as string);
const event = ref<Event | null>(null);
const relatedEvents = ref<Event[]>([]);
const mapContainer = ref<HTMLElement | null>(null);

const descriptionSummary = computed(() => {
  const raw = event.value?.description?.trim();
  if (!raw) return '';
  const plain = raw.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]+>/g, '');
  const firstLine = plain.split(/\n+/).find(line => line.trim().length > 0);
  return (firstLine ?? plain).trim();
});

const goBack = () => {
  router.push('/events');
};

const goToEvent = (id: string) => {
  router.push(`/events/${id}`);
  // Reload the page data
  loadEventData();
};

const formatDescription = (desc: string) => {
  if (!desc) return '';
  return desc.replace(/\n/g, '<br>');
};

const loadEventData = async () => {
  // Load events if not already loaded
  if (eventStore.events.length === 0) {
    await eventStore.fetchEvents();
  }

  event.value = eventStore.events.find(e => e.id === eventId.value) || null;

  // Load related events (based on tags similarity)
  if (event.value?.tags && event.value.tags.length > 0) {
    relatedEvents.value = eventStore.events
      .filter(e => e.id !== eventId.value)
      .filter(e => {
        if (!e.tags || e.tags.length === 0) return false;
        return e.tags.some(tag => event.value?.tags?.includes(tag));
      })
      .slice(0, 4);
  }

  // Initialize map
  await nextTick();
  initMap();
};

const initMap = async () => {
  const el = mapContainer.value;
  if (!el || !event.value) return;

  try {
    const g = await loadGoogleMaps();
    const fallback = { lat: 47.6553, lng: -122.3035 }; // UW

    const map = new g.maps.Map(el, {
      center: fallback,
      zoom: 15,
    });

    const location = event.value.location || 'University of Washington';
    const geocoder = new g.maps.Geocoder();

    geocoder.geocode({ address: location }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        const pos = results[0].geometry.location;
        map.setCenter(pos);
        new g.maps.Marker({ position: pos, map });
      } else {
        new g.maps.Marker({ position: fallback, map });
        console.warn('Geocode failed:', status, 'using fallback center');
      }
    });
  } catch (err) {
    console.error('Failed to load Google Maps:', err);
  }
};

onMounted(() => {
  loadEventData();
});
</script>

<style scoped>
.event-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-3xl);
  padding-top: calc(var(--navbar-height) + var(--spacing-2xl));
  position: relative;
  min-height: 100vh;
}

.back-button {
  position: fixed;
  top: calc(var(--navbar-height) + var(--spacing-2xl));
  /* Keep the back button offset symmetric with the page padding */
  left: calc(
    (100vw - min(100vw, calc(1200px + 2 * var(--spacing-3xl)))) / 2 +
    var(--spacing-xl)
  );
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 1.5rem;
  z-index: 100;
  box-shadow: none;
}

.back-button:hover {
  background: var(--color-gray-50);
  border-color: var(--color-gray-300);
  transform: translateX(-3px);
}

.arrow {
  color: var(--color-gray-900);
  font-weight: bold;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  font-size: var(--font-size-lg);
  color: var(--color-gray-600);
}

.event-header-section {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: var(--spacing-xl);
  /* micro-align the top edge with the back button baseline */
  margin-top: -68px;
  margin-bottom: var(--spacing-2xl);
  align-items: stretch;
}

.event-image-card {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  overflow: hidden;
  height: 100%;
  min-height: 340px;
  display: flex;
}

.event-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-info-card {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-xl) var(--spacing-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  height: 100%;
  min-height: 380px;
}

.event-info-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.event-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0;
}

.event-summary {
  font-size: var(--font-size-lg);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.event-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2xs);
  padding: var(--spacing-md) var(--spacing-lg);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--color-gray-25, #f7f7fb);
  min-height: 96px;
}

.meta-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-gray-600);
}

.meta-value {
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
  line-height: var(--line-height-normal);
}

.event-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.tag {
  background: var(--color-gray-100);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  color: var(--color-gray-700);
  border: var(--border-width) solid var(--border-color);
}

.event-link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: var(--color-white);
  text-decoration: none;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-semibold);
  text-align: center;
  transition: background 0.2s;
  align-self: flex-start;
}

.event-link-btn:hover {
  background: var(--color-primary-hover);
}

.content-section {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.description-card,
.map-card {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
}

.section-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-gray-900);
  margin: 0 0 var(--spacing-lg) 0;
}

.event-description {
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--color-gray-700);
  margin: 0;
}

.google-map {
  width: 100%;
  height: 400px;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: var(--border-width) solid var(--border-color);
}

.related-events-section {
  background: var(--color-white);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
}

.event-card {
  cursor: pointer;
  transition: transform 0.2s;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: var(--border-width) solid var(--border-color);
  background: var(--color-white);
}

.event-card:hover {
  transform: translateY(-4px);
}

.event-thumbnail {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
}

.event-card-info {
  padding: var(--spacing-md);
}

.event-card-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin: 0;
  line-height: var(--line-height-tight);
}

@media (max-width: 1024px) {
  .event-header-section {
    grid-template-columns: 1fr;
  }

  .content-section {
    grid-template-columns: 1fr;
  }

  .events-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .event-detail-page {
    padding: var(--spacing-xl);
    padding-top: calc(var(--navbar-height) + var(--spacing-lg));
  }

  .back-button {
    left: var(--spacing-xl);
    width: 40px;
    height: 40px;
    font-size: 1.2rem;
  }

  .events-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .event-info-card {
    padding: var(--spacing-lg);
  }

  .event-title {
    font-size: var(--font-size-2xl);
  }
}

@media (max-width: 576px) {
  .events-grid {
    grid-template-columns: 1fr;
  }

  .google-map {
    height: 300px;
  }
}
</style>
